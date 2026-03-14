import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

async function checkCache() {
  try {
    // Query the macro_cache table for the specific row
    const { data, error } = await supabase
      .from('macro_cache')
      .select('*')
      .eq('id', 'markets_comparison_countries')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.log('❌ No cache row found with id = "markets_comparison_countries"')
      } else {
        console.error('❌ Query error:', error.message)
      }
      return
    }

    if (!data) {
      console.log('❌ No cache row found with id = "markets_comparison_countries"')
      return
    }

    console.log('✅ Cache row found:')
    console.log('ID:', data.id)
    console.log('Fetched at:', data.fetched_at)
    
    // Check if data is recent (within last hour)
    const fetchedTime = new Date(data.fetched_at)
    const now = new Date()
    const diffMinutes = (now - fetchedTime) / (1000 * 60)
    
    console.log('Age:', Math.round(diffMinutes), 'minutes old')
    
    if (diffMinutes < 60) {
      console.log('✅ Cache is recent (less than 1 hour)')
    } else if (diffMinutes < 1440) {
      console.log('⚠️  Cache is moderately old (', Math.round(diffMinutes / 60), 'hours)')
    } else {
      console.log('❌ Cache is stale (', Math.round(diffMinutes / 1440), 'days)')
    }
    
    // Check if data contains returns information
    if (data.data) {
      const cachedData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data
      console.log('Data keys:', Object.keys(cachedData).slice(0, 5).join(', '), '...')
      
      // Sample what's in the data
      console.log('\nFirst data item sample:')
      const firstKey = Object.keys(cachedData)[0]
      if (firstKey) {
        console.log(JSON.stringify(cachedData[firstKey], null, 2).substring(0, 200))
      }
    }
  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

checkCache()
