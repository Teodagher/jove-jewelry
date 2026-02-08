
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Order {
  id: string;
  order_number?: string;
  customer_name: string;
  customer_email: string;
  total: number;
  subtotal: number;
  delivery_fee?: number;
  payment_method: string;
  discount_code?: string;
  discount_amount?: number;
  created_at: string;
  // Fallback fields
  total_amount?: number;
}

interface OrderItem {
  id: string;
  jewelry_type: string;
  customization_data: Record<string, unknown>;
  customization_summary: string;
  base_price: number;
  total_price: number;
  quantity: number;
  preview_image_url?: string;
  // needed for join
  product_name?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    // Expected input from database webhook: { record: { id: ... } }
    // Or direct invocation: { order_id: ... }
    const payload = await req.json();
    const orderId = payload.record?.id || payload.order_id;

    if (!orderId) {
      throw new Error("Missing order_id in payload");
    }

    console.log(`[OrderConfirmation] Processing order: ${orderId}`);

    // Fetch Order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      console.error("[OrderConfirmation] Order not found:", orderError);
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Items - retry logic for async insertion
    let orderItems: OrderItem[] = [];
    for (let i = 0; i < 3; i++) {
      const { data } = await supabase
        .from("order_items")
        .select("*")
        .eq("order_id", orderId);

      if (data && data.length > 0) {
        orderItems = data;
        break;
      }
      console.log(`[OrderConfirmation] No items found, attempt ${i + 1}/3. Waiting...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    if (orderItems.length === 0) {
      console.warn(`[OrderConfirmation] Warning: Order ${orderId} has no items after retries.`);
    }

    // Generate accurate image URLs (The Intelligence Logic)
    const processedItems = await Promise.all(orderItems.map(async (item) => {
      let imgUrl = item.preview_image_url;

      // If no image, try to generate one
      if (!imgUrl && item.jewelry_type) {
        const { data: product } = await supabase
          .from('jewelry_items')
          .select('type, base_image_url')
          .eq('id', item.jewelry_type)
          .single();

        if (product) {
          if (item.customization_data && Object.keys(item.customization_data).length > 0) {
            // Replicate CustomizationService logic partially
            // We need a helper to verify file existence in storage
            const generatedUrl = await generateVariantImageUrl(supabase, product.type, item.customization_data);
            imgUrl = generatedUrl || product.base_image_url;
          } else {
            imgUrl = product.base_image_url;
          }
        }
      }

      return { ...item, preview_image_url: imgUrl };
    }));


    // Fetch Templates
    const { data: templates } = await supabase
      .from('email_templates')
      .select('*')
      .in('name', ['Order Confirmation - Client', 'Order Confirmation - Admin']);

    const clientTemplate = templates?.find(t => t.name === 'Order Confirmation - Client');
    const adminTemplate = templates?.find(t => t.name === 'Order Confirmation - Admin');

    // Prepare Variables
    const variables: Record<string, string> = {
      '{{order_number}}': order.order_number || order.id.slice(0, 8).toUpperCase(),
      '{{customer_name}}': order.customer_name || '',
      '{{customer_email}}': order.customer_email || '',
      '{{order_total}}': `$${Number(order.total || order.total_amount || 0).toFixed(2)}`,
      '{{subtotal}}': `$${Number(order.subtotal || 0).toFixed(2)}`,
      '{{delivery_fee}}': order.delivery_fee ? `$${Number(order.delivery_fee).toFixed(2)}` : 'Free',
      '{{payment_method}}': formatPaymentMethod(order.payment_method),
      '{{discount_code}}': order.discount_code || '',
      '{{discount_amount}}': order.discount_amount ? `$${Number(order.discount_amount).toFixed(2)}` : '',
      '{{order_items_html}}': buildOrderItemsHtml(processedItems),
    };

    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || 'Maison Jové <noreply@maisonjove.com>';
    const replyTo = Deno.env.get("RESEND_REPLY_TO");

    // Send Client Email
    if (clientTemplate && order.customer_email) {
      const subject = resolveVariables(clientTemplate.subject, variables);
      const bodyContent = resolveVariables(clientTemplate.content, variables);
      const html = buildHtmlEmail(bodyContent);

      await resend.emails.send({
        from: fromEmail,
        to: [order.customer_email],
        replyTo: replyTo || undefined,
        subject: subject,
        html: html,
      });
      console.log(`[OrderConfirmation] Client email sent to ${order.customer_email}`);

      // Log history
      await logEmailHistory(supabase, orderId, clientTemplate.id, order.customer_email, order.customer_name, subject, 'sent');
    }

    // Send Admin Email
    if (adminTemplate) {
      const adminEmail = replyTo || 'admin@maisonjove.com';
      const subject = resolveVariables(adminTemplate.subject, variables);
      const bodyContent = resolveVariables(adminTemplate.content, variables);
      const html = buildHtmlEmail(bodyContent);

      await resend.emails.send({
        from: fromEmail,
        to: [adminEmail],
        subject: subject,
        html: html,
      });
      console.log(`[OrderConfirmation] Admin email sent to ${adminEmail}`);

      await logEmailHistory(supabase, orderId, adminTemplate.id, adminEmail, 'Admin', subject, 'sent');
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("[OrderConfirmation] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
};

// --- Helpers ---

// Logic ported from DynamicFilenameService + CustomizationService
// Logic ported from DynamicFilenameService + CustomizationService
async function generateVariantImageUrl(supabase: any, jewelryType: string, customizations: any): Promise<string | null> {
  const baseUrl = 'https://ndqxwvascqwhqaoqkpng.supabase.co/storage/v1/object/customization-item';

  try {
    // 1. Get Filename Mappings
    // We first need the jewelry_item_id
    const { data: jewelryItems } = await supabase
      .from('jewelry_items')
      .select('id')
      .eq('type', jewelryType)
      .eq('is_active', true);

    if (!jewelryItems || jewelryItems.length === 0) return null;
    const jewelryItemIds = jewelryItems.map((j: any) => j.id);

    const { data: mappings } = await supabase
      .from('customization_options')
      .select('option_id, filename_slug, setting_id')
      .eq('is_active', true)
      .eq('affects_image_variant', true)
      .in('jewelry_item_id', jewelryItemIds)
      .not('filename_slug', 'is', null);

    if (!mappings) return null;

    const mappingMap = new Map(mappings.map((m: any) => [m.option_id, m.filename_slug]));

    // 2. Identify Options
    const variantOptions = Object.entries(customizations).map(([k, v]) => ({ setting_id: k, option_id: v as string }));

    const extractStoneFromContextual = (stoneId: string): string => {
      if (stoneId && stoneId.includes('_')) {
        const parts = stoneId.split('_');
        const lastPart = parts[parts.length - 1];
        if (parts.length >= 2) {
          const twoWordStone = parts.slice(-2).join('_');
          if (['blue_sapphire', 'pink_sapphire', 'yellow_sapphire'].includes(twoWordStone)) return twoWordStone;
        }
        if (['ruby', 'emerald', 'diamond', 'sapphire'].includes(lastPart)) return lastPart;
      }
      return stoneId;
    };

    const firstStoneOpt = variantOptions.find(o => o.setting_id === 'first_stone');
    const secondStoneOpt = variantOptions.find(o => o.setting_id === 'second_stone');
    const metalOpt = variantOptions.find(o => o.setting_id === 'metal');
    const chainOpt = variantOptions.find(o => o.setting_id === 'chain_type');

    const actualFirstStone = firstStoneOpt ? extractStoneFromContextual(firstStoneOpt.option_id) : '';

    let finalStoneOptions: string[] = [];
    if (firstStoneOpt && actualFirstStone !== 'diamond' && secondStoneOpt) {
      finalStoneOptions = [firstStoneOpt.option_id, secondStoneOpt.option_id];
    } else if (secondStoneOpt) {
      finalStoneOptions = [secondStoneOpt.option_id];
    } else if (firstStoneOpt) {
      finalStoneOptions = [firstStoneOpt.option_id];
    }

    // 3. Build Filename
    const filenameParts = [jewelryType];

    if (chainOpt) filenameParts.push(mappingMap.get(chainOpt.option_id) || chainOpt.option_id);

    for (const stoneId of finalStoneOptions) {
      filenameParts.push(mappingMap.get(stoneId) || stoneId);
    }

    if (metalOpt) filenameParts.push(mappingMap.get(metalOpt.option_id) || metalOpt.option_id);

    // Add extras
    for (const opt of variantOptions) {
      if (!['chain_type', 'first_stone', 'second_stone', 'metal'].includes(opt.setting_id)) {
        // Only if affects image (checked via mapping existence)
        if (mappingMap.has(opt.option_id)) {
          filenameParts.push(mappingMap.get(opt.option_id)!);
        }
      }
    }

    const baseFilename = filenameParts.join('-');

    // Check for extension existence: .webp, .PNG, .png
    // Since we can't easily list files on Edge without huge permission impact or latency,
    // we'll optimistically default to .webp which is our standard.
    // Or better: Use the public URL directly and hope? 
    // No, let's stick to .webp as standard.
    const filename = `${baseFilename}.webp`;

    return `${baseUrl}/${jewelryType}s/${filename}`;

  } catch (e) {
    console.warn('Edge Function Image Gen Error:', e);
    return null;
  }
}

function formatPaymentMethod(method: string): string {
  if (!method) return 'N/A';
  return method.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function resolveVariables(text: string, variables: Record<string, string>): string {
  let resolved = text;
  // Handle {{#if variable}}...{{/if}} logic
  resolved = resolved.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\\{\{\/if\}\}/g, (_, varName, content) => {
    const val = variables[`{{${varName}}}`];
    return val && val.trim() ? content : '';
  });

  for (const [key, value] of Object.entries(variables)) {
    resolved = resolved.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  return resolved;
}

function buildHtmlEmail(body: string): string {
  if (body.trim().startsWith('<!DOCTYPE')) return body;
  return `<!DOCTYPE html><html><body style="font-family:serif;background:#f7f5f3;padding:20px;">
    <div style="background:#fff;padding:40px;max-width:600px;margin:0 auto;color:#333;">
    ${body.replace(/\n/g, '<br>')}
    </div></body></html>`;
}

function buildOrderItemsHtml(items: OrderItem[]): string {
  return items.map(item => {
    const name = item.product_name || `Custom ${item.jewelry_type}`;
    const img = item.preview_image_url
      ? `<img src="${item.preview_image_url}" width="80" height="80" style="object-fit:cover;border-radius:4px;">`
      : `<div style="width:80px;height:80px;background:#eee;"></div>`;

    return `<div style="display:flex;gap:15px;margin-bottom:15px;border:1px solid #eee;padding:10px;border-radius:8px;">
            ${img}
            <div>
                <div style="font-weight:bold;">${name} (x${item.quantity})</div>
                <div style="color:#666;font-size:0.9em;">${item.customization_summary || ''}</div>
                <div style="margin-top:5px;">$${Number(item.total_price || 0).toFixed(2)}</div>
            </div>
        </div>`;
  }).join('');
}

async function logEmailHistory(supabase: any, orderId: string, templateId: string, toEmail: string, name: string, subject: string, status: string) {
  await supabase.from('email_send_history').insert({
    template_id: templateId,
    to_email: toEmail,
    to_name: name,
    subject,
    body: 'Sent via Edge Function', // we don't store full body here to save space often
    status,
    sent_by: '00000000-0000-0000-0000-000000000000'
  });
}

serve(handler);
