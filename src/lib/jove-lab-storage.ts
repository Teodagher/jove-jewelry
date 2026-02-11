// =============================================
// JOVÉ LAB Storage - Isolated Local Storage
// =============================================
// This uses localStorage to avoid modifying the database schema
// All JOVÉ LAB admin data is stored separately from the main store

import type {
  JoveLabTemplate,
  JoveLabOptionCategory,
  JoveLabOption,
  JoveLabPricing,
  JoveLabPricingAddOn,
  JoveLabLead,
  JoveLabLeadStatus,
  JoveLabStats,
} from '@/types/jove-lab';

const STORAGE_KEYS = {
  TEMPLATES: 'jove_lab_templates',
  OPTION_CATEGORIES: 'jove_lab_option_categories',
  OPTIONS: 'jove_lab_options',
  PRICING: 'jove_lab_pricing',
  PRICING_ADDONS: 'jove_lab_pricing_addons',
  LEADS: 'jove_lab_leads',
} as const;

// Helper to generate UUIDs
function generateId(): string {
  return 'jl_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Helper to get current timestamp
function now(): string {
  return new Date().toISOString();
}

// =============================================
// Templates Storage
// =============================================

export function getTemplates(): JoveLabTemplate[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
  return data ? JSON.parse(data) : getDefaultTemplates();
}

export function saveTemplates(templates: JoveLabTemplate[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function createTemplate(data: Partial<JoveLabTemplate>): JoveLabTemplate {
  const templates = getTemplates();
  const template: JoveLabTemplate = {
    id: generateId(),
    name: data.name || 'New Template',
    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'new-template',
    description: data.description || '',
    hero_image_url: data.hero_image_url || null,
    gallery_images: data.gallery_images || [],
    display_order: templates.length,
    is_active: data.is_active ?? true,
    created_at: now(),
    updated_at: now(),
  };
  templates.push(template);
  saveTemplates(templates);
  return template;
}

export function updateTemplate(id: string, data: Partial<JoveLabTemplate>): JoveLabTemplate | null {
  const templates = getTemplates();
  const index = templates.findIndex(t => t.id === id);
  if (index === -1) return null;
  
  templates[index] = {
    ...templates[index],
    ...data,
    updated_at: now(),
  };
  saveTemplates(templates);
  return templates[index];
}

export function deleteTemplate(id: string): boolean {
  const templates = getTemplates();
  const filtered = templates.filter(t => t.id !== id);
  if (filtered.length === templates.length) return false;
  saveTemplates(filtered);
  return true;
}

export function reorderTemplates(orderedIds: string[]): void {
  const templates = getTemplates();
  const reordered = orderedIds.map((id, index) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      return { ...template, display_order: index };
    }
    return null;
  }).filter(Boolean) as JoveLabTemplate[];
  saveTemplates(reordered);
}

// =============================================
// Option Categories Storage
// =============================================

export function getOptionCategories(): JoveLabOptionCategory[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.OPTION_CATEGORIES);
  return data ? JSON.parse(data) : getDefaultOptionCategories();
}

export function saveOptionCategories(categories: JoveLabOptionCategory[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OPTION_CATEGORIES, JSON.stringify(categories));
}

export function createOptionCategory(data: Partial<JoveLabOptionCategory>): JoveLabOptionCategory {
  const categories = getOptionCategories();
  const category: JoveLabOptionCategory = {
    id: generateId(),
    name: data.name || 'New Category',
    slug: data.slug || data.name?.toLowerCase().replace(/\s+/g, '-') || 'new-category',
    display_order: categories.length,
    is_active: data.is_active ?? true,
  };
  categories.push(category);
  saveOptionCategories(categories);
  return category;
}

export function updateOptionCategory(id: string, data: Partial<JoveLabOptionCategory>): JoveLabOptionCategory | null {
  const categories = getOptionCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index === -1) return null;
  
  categories[index] = { ...categories[index], ...data };
  saveOptionCategories(categories);
  return categories[index];
}

export function deleteOptionCategory(id: string): boolean {
  const categories = getOptionCategories();
  const filtered = categories.filter(c => c.id !== id);
  if (filtered.length === categories.length) return false;
  saveOptionCategories(filtered);
  // Also delete all options in this category
  const options = getOptions().filter(o => o.category_id !== id);
  saveOptions(options);
  return true;
}

// =============================================
// Options Storage
// =============================================

export function getOptions(): JoveLabOption[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.OPTIONS);
  return data ? JSON.parse(data) : getDefaultOptions();
}

export function getOptionsByCategory(categoryId: string): JoveLabOption[] {
  return getOptions().filter(o => o.category_id === categoryId);
}

export function saveOptions(options: JoveLabOption[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.OPTIONS, JSON.stringify(options));
}

export function createOption(data: Partial<JoveLabOption>): JoveLabOption {
  const options = getOptions();
  const categoryOptions = options.filter(o => o.category_id === data.category_id);
  const option: JoveLabOption = {
    id: generateId(),
    category_id: data.category_id || '',
    name: data.name || 'New Option',
    description: data.description || null,
    image_url: data.image_url || null,
    display_order: categoryOptions.length,
    is_active: data.is_active ?? true,
    metadata: data.metadata || {},
    created_at: now(),
    updated_at: now(),
  };
  options.push(option);
  saveOptions(options);
  return option;
}

export function updateOption(id: string, data: Partial<JoveLabOption>): JoveLabOption | null {
  const options = getOptions();
  const index = options.findIndex(o => o.id === id);
  if (index === -1) return null;
  
  options[index] = {
    ...options[index],
    ...data,
    updated_at: now(),
  };
  saveOptions(options);
  return options[index];
}

export function deleteOption(id: string): boolean {
  const options = getOptions();
  const filtered = options.filter(o => o.id !== id);
  if (filtered.length === options.length) return false;
  saveOptions(filtered);
  return true;
}

// =============================================
// Pricing Storage
// =============================================

export function getPricing(): JoveLabPricing[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PRICING);
  return data ? JSON.parse(data) : [];
}

export function savePricing(pricing: JoveLabPricing[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRICING, JSON.stringify(pricing));
}

export function getPricingForTemplate(templateId: string): JoveLabPricing | null {
  return getPricing().find(p => p.template_id === templateId) || null;
}

export function upsertPricing(templateId: string, data: Partial<JoveLabPricing>): JoveLabPricing {
  const pricing = getPricing();
  const existing = pricing.findIndex(p => p.template_id === templateId);
  
  const pricingItem: JoveLabPricing = {
    id: existing >= 0 ? pricing[existing].id : generateId(),
    template_id: templateId,
    base_price: data.base_price || 0,
    pricing_mode: data.pricing_mode || 'fixed',
    min_price: data.min_price || null,
    max_price: data.max_price || null,
    currency: data.currency || 'USD',
    created_at: existing >= 0 ? pricing[existing].created_at : now(),
    updated_at: now(),
  };
  
  if (existing >= 0) {
    pricing[existing] = pricingItem;
  } else {
    pricing.push(pricingItem);
  }
  
  savePricing(pricing);
  return pricingItem;
}

// =============================================
// Pricing Add-ons Storage
// =============================================

export function getPricingAddOns(): JoveLabPricingAddOn[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.PRICING_ADDONS);
  return data ? JSON.parse(data) : getDefaultPricingAddOns();
}

export function savePricingAddOns(addons: JoveLabPricingAddOn[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.PRICING_ADDONS, JSON.stringify(addons));
}

export function createPricingAddOn(data: Partial<JoveLabPricingAddOn>): JoveLabPricingAddOn {
  const addons = getPricingAddOns();
  const addon: JoveLabPricingAddOn = {
    id: generateId(),
    name: data.name || 'New Add-on',
    category: data.category || 'other',
    option_value: data.option_value || '',
    price_adjustment: data.price_adjustment || 0,
    is_percentage: data.is_percentage ?? false,
    is_active: data.is_active ?? true,
  };
  addons.push(addon);
  savePricingAddOns(addons);
  return addon;
}

export function updatePricingAddOn(id: string, data: Partial<JoveLabPricingAddOn>): JoveLabPricingAddOn | null {
  const addons = getPricingAddOns();
  const index = addons.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  addons[index] = { ...addons[index], ...data };
  savePricingAddOns(addons);
  return addons[index];
}

export function deletePricingAddOn(id: string): boolean {
  const addons = getPricingAddOns();
  const filtered = addons.filter(a => a.id !== id);
  if (filtered.length === addons.length) return false;
  savePricingAddOns(filtered);
  return true;
}

// =============================================
// Leads Storage
// =============================================

export function getLeads(): JoveLabLead[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem(STORAGE_KEYS.LEADS);
  return data ? JSON.parse(data) : [];
}

export function saveLeads(leads: JoveLabLead[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
}

export function createLead(data: Omit<JoveLabLead, 'id' | 'created_at' | 'updated_at'>): JoveLabLead {
  const leads = getLeads();
  const lead: JoveLabLead = {
    ...data,
    id: generateId(),
    created_at: now(),
    updated_at: now(),
  };
  leads.unshift(lead); // Add to beginning
  saveLeads(leads);
  return lead;
}

export function updateLead(id: string, data: Partial<JoveLabLead>): JoveLabLead | null {
  const leads = getLeads();
  const index = leads.findIndex(l => l.id === id);
  if (index === -1) return null;
  
  leads[index] = {
    ...leads[index],
    ...data,
    updated_at: now(),
  };
  saveLeads(leads);
  return leads[index];
}

export function updateLeadStatus(id: string, status: JoveLabLeadStatus, notes?: string): JoveLabLead | null {
  const lead = getLeads().find(l => l.id === id);
  if (!lead) return null;
  
  const updates: Partial<JoveLabLead> = { status };
  
  if (notes !== undefined) {
    updates.internal_notes = notes;
  }
  
  if (status === 'contacted' && !lead.contacted_at) {
    updates.contacted_at = now();
  }
  
  if (status === 'completed') {
    updates.completed_at = now();
  }
  
  return updateLead(id, updates);
}

export function deleteLead(id: string): boolean {
  const leads = getLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;
  saveLeads(filtered);
  return true;
}

export function getLeadStats(): JoveLabStats {
  const leads = getLeads();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const byStatus: Record<JoveLabLeadStatus, number> = {
    new: 0,
    contacted: 0,
    quoted: 0,
    in_progress: 0,
    completed: 0,
    cancelled: 0,
  };
  
  let totalPrice = 0;
  let priceCount = 0;
  
  leads.forEach(lead => {
    byStatus[lead.status]++;
    if (lead.shown_price) {
      totalPrice += lead.shown_price;
      priceCount++;
    }
  });
  
  return {
    total_leads: leads.length,
    leads_this_week: leads.filter(l => new Date(l.created_at) >= weekAgo).length,
    leads_this_month: leads.filter(l => new Date(l.created_at) >= monthAgo).length,
    by_status: byStatus,
    average_price: priceCount > 0 ? totalPrice / priceCount : 0,
  };
}

// =============================================
// Default Data (Seed Data)
// =============================================

function getDefaultTemplates(): JoveLabTemplate[] {
  return [
    {
      id: 'tpl_solitaire',
      name: 'Solitaire',
      slug: 'solitaire',
      description: 'A timeless single-stone design that puts the spotlight on one magnificent gem.',
      hero_image_url: null,
      gallery_images: [],
      display_order: 0,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'tpl_halo',
      name: 'Halo',
      slug: 'halo',
      description: 'A center stone surrounded by a circle of smaller gems for maximum brilliance.',
      hero_image_url: null,
      gallery_images: [],
      display_order: 1,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'tpl_three_stone',
      name: 'Three Stone',
      slug: 'three-stone',
      description: 'Past, present, and future united in a symbolic trio of stones.',
      hero_image_url: null,
      gallery_images: [],
      display_order: 2,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'tpl_cluster',
      name: 'Cluster',
      slug: 'cluster',
      description: 'Multiple stones arranged together for a bold, contemporary statement.',
      hero_image_url: null,
      gallery_images: [],
      display_order: 3,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    },
    {
      id: 'tpl_pave',
      name: 'Pavé',
      slug: 'pave',
      description: 'A band encrusted with tiny diamonds for continuous sparkle.',
      hero_image_url: null,
      gallery_images: [],
      display_order: 4,
      is_active: true,
      created_at: now(),
      updated_at: now(),
    },
  ];
}

function getDefaultOptionCategories(): JoveLabOptionCategory[] {
  return [
    { id: 'cat_shape', name: 'Shape', slug: 'shape', display_order: 0, is_active: true },
    { id: 'cat_size', name: 'Size', slug: 'size', display_order: 1, is_active: true },
    { id: 'cat_metal', name: 'Metal', slug: 'metal', display_order: 2, is_active: true },
    { id: 'cat_setting', name: 'Setting', slug: 'setting', display_order: 3, is_active: true },
  ];
}

function getDefaultOptions(): JoveLabOption[] {
  return [
    // Shapes
    { id: 'opt_round', category_id: 'cat_shape', name: 'Round Brilliant', description: 'Classic cut with maximum fire and brilliance', image_url: null, display_order: 0, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_oval', category_id: 'cat_shape', name: 'Oval', description: 'Elegant elongated shape with brilliant facets', image_url: null, display_order: 1, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_cushion', category_id: 'cat_shape', name: 'Cushion', description: 'Soft, rounded corners with vintage charm', image_url: null, display_order: 2, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_emerald', category_id: 'cat_shape', name: 'Emerald', description: 'Step-cut rectangular with hall-of-mirrors effect', image_url: null, display_order: 3, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_pear', category_id: 'cat_shape', name: 'Pear', description: 'Teardrop silhouette, feminine and distinctive', image_url: null, display_order: 4, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    
    // Metals
    { id: 'opt_platinum', category_id: 'cat_metal', name: 'Platinum', description: 'Pure white, hypoallergenic, and incredibly durable', image_url: null, display_order: 0, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_white_gold', category_id: 'cat_metal', name: 'White Gold 18K', description: 'Bright white finish with classic appeal', image_url: null, display_order: 1, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_yellow_gold', category_id: 'cat_metal', name: 'Yellow Gold 18K', description: 'Warm, traditional, timelessly elegant', image_url: null, display_order: 2, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
    { id: 'opt_rose_gold', category_id: 'cat_metal', name: 'Rose Gold 18K', description: 'Romantic blush tone, modern and unique', image_url: null, display_order: 3, is_active: true, metadata: {}, created_at: now(), updated_at: now() },
  ];
}

function getDefaultPricingAddOns(): JoveLabPricingAddOn[] {
  return [
    // Metal add-ons
    { id: 'addon_platinum', name: 'Platinum Upgrade', category: 'metal', option_value: 'platinum', price_adjustment: 500, is_percentage: false, is_active: true },
    { id: 'addon_white_gold', name: 'White Gold 18K', category: 'metal', option_value: 'white-gold-18k', price_adjustment: 0, is_percentage: false, is_active: true },
    { id: 'addon_yellow_gold', name: 'Yellow Gold 18K', category: 'metal', option_value: 'yellow-gold-18k', price_adjustment: 0, is_percentage: false, is_active: true },
    { id: 'addon_rose_gold', name: 'Rose Gold 18K', category: 'metal', option_value: 'rose-gold-18k', price_adjustment: 50, is_percentage: false, is_active: true },
    
    // Stone size add-ons
    { id: 'addon_1ct', name: '1 Carat', category: 'stone_size', option_value: '1ct', price_adjustment: 0, is_percentage: false, is_active: true },
    { id: 'addon_1_5ct', name: '1.5 Carat', category: 'stone_size', option_value: '1.5ct', price_adjustment: 2000, is_percentage: false, is_active: true },
    { id: 'addon_2ct', name: '2 Carat', category: 'stone_size', option_value: '2ct', price_adjustment: 5000, is_percentage: false, is_active: true },
    { id: 'addon_3ct', name: '3 Carat', category: 'stone_size', option_value: '3ct', price_adjustment: 12000, is_percentage: false, is_active: true },
    
    // Setting add-ons
    { id: 'addon_halo', name: 'Halo Setting', category: 'setting', option_value: 'halo', price_adjustment: 800, is_percentage: false, is_active: true },
    { id: 'addon_pave', name: 'Pavé Band', category: 'setting', option_value: 'pave', price_adjustment: 600, is_percentage: false, is_active: true },
  ];
}

// =============================================
// Export Lead to CSV
// =============================================

export function exportLeadsToCSV(leads: JoveLabLead[]): string {
  const headers = [
    'Design ID',
    'Date',
    'Client Name',
    'Email',
    'Phone',
    'Jewelry Type',
    'Architecture',
    'Stone Personality',
    'Proportions',
    'Setting Style',
    'Metal',
    'Notes',
    'Shown Price',
    'Currency',
    'Status',
    'Internal Notes',
  ];
  
  const rows = leads.map(lead => [
    lead.design_id,
    new Date(lead.created_at).toLocaleDateString(),
    lead.client_name,
    lead.client_email,
    lead.client_phone || '',
    lead.selections.jewelry_type || '',
    lead.selections.architecture || '',
    lead.selections.stone_personality || '',
    lead.selections.proportions || '',
    lead.selections.setting_style || '',
    lead.selections.metal || '',
    lead.selections.notes || '',
    lead.shown_price?.toString() || '',
    lead.currency,
    lead.status,
    lead.internal_notes || '',
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');
  
  return csvContent;
}
