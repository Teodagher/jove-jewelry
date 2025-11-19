// Quick script to check available products in Supabase
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkProducts() {
  console.log('Fetching all jewelry items...\n')

  const { data, error } = await supabase
    .from('jewelry_items')
    .select('id, name, slug, type, product_type, is_active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('No products found in database')
    return
  }

  console.log(`Found ${data.length} products:\n`)

  data.forEach((item, index) => {
    console.log(`${index + 1}. ${item.name}`)
    console.log(`   Slug: ${item.slug || 'NO SLUG'}`)
    console.log(`   Type: ${item.type}`)
    console.log(`   Product Type: ${item.product_type}`)
    console.log(`   Active: ${item.is_active}`)
    console.log('')
  })

  const customizable = data.filter(item => item.product_type === 'customizable' && item.is_active)
  console.log(`\nCustomizable products: ${customizable.length}`)
  customizable.forEach(item => {
    console.log(`  - ${item.name} (slug: ${item.slug || 'NO SLUG'})`)
  })
}

checkProducts()
