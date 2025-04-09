import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://yumgzcvknzrqfnnatldr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDk4ODQsImV4cCI6MjA1ODMyNTg4NH0.BjYqRBYq-O7Uc0LRgQ-deB80Q3eRuY7ahtuTf6KTFp8'

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Check if the restaurant exists and verify its password_hash
 */
async function checkRestaurant() {
  try {
    console.log('Checking restaurant...')
    
    const restaurantSlug = 'emirgan-sutis'
    
    // Get the restaurant
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', restaurantSlug)
      .single()
    
    if (error) {
      console.error('Error getting restaurant:', error)
      throw error
    }
    
    console.log('Restaurant found:', data)
    console.log('Password hash:', data.password_hash)
    
  } catch (error) {
    console.error('Failed to check restaurant:', error)
  }
}

// Run the script
checkRestaurant() 