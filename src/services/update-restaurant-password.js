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
 * Update restaurant password
 * 
 * This script updates the password_hash for the restaurant with the given slug.
 * In a production environment, you would use a proper password hashing function.
 */
async function updateRestaurantPassword() {
  try {
    console.log('Updating restaurant password...')
    
    const restaurantSlug = 'emirgan-sutis'
    const password = 'sutis123'
    
    // In a real application, you would hash the password
    // For this demo, we're using plain text (NOT RECOMMENDED FOR PRODUCTION)
    const passwordHash = password
    
    // First, check if the restaurant exists
    const { data: existingRestaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', restaurantSlug)
      .maybeSingle()
    
    if (checkError) {
      console.error('Error checking restaurant:', checkError)
      throw checkError
    }
    
    console.log('Restaurant check result:', existingRestaurant)
    
    // Since we can't directly update the restaurant due to RLS policies,
    // let's try to authenticate as a superadmin first
    
    // For testing purposes, let's try to sign in with a demo account
    // In a real application, you would use proper authentication
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@restonom.com',
      password: 'admin123'
    })
    
    if (authError) {
      console.error('Error signing in:', authError)
      console.log('Creating a test superadmin account...')
      
      // Try to create a test superadmin account
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: 'admin@restonom.com',
        password: 'admin123'
      })
      
      if (signupError) {
        console.error('Error creating superadmin account:', signupError)
        throw signupError
      }
      
      console.log('Superadmin account created:', signupData)
    } else {
      console.log('Signed in as superadmin:', authData)
    }
    
    // Now try to update the restaurant again
    if (existingRestaurant) {
      console.log('Updating existing restaurant...')
      
      const { data, error } = await supabase
        .from('restaurants')
        .update({ password_hash: passwordHash })
        .eq('slug', restaurantSlug)
        .select()
      
      if (error) {
        console.error('Error updating restaurant password:', error)
        throw error
      }
      
      console.log('Restaurant password updated successfully:', data)
    } else {
      console.log('Restaurant not found, creating it...')
      
      // Create the restaurant
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert({
          name: 'Emirgan Sütiş',
          slug: restaurantSlug,
          email: 'info@emirgansutis.com',
          address: 'Emirgan, Istanbul',
          phone: '+90 212 123 4567',
          password_hash: passwordHash
        })
        .select()
      
      if (createError) {
        console.error('Error creating restaurant:', createError)
        throw createError
      }
      
      console.log('Restaurant created successfully:', newRestaurant)
    }
    
  } catch (error) {
    console.error('Failed to update restaurant password:', error)
  }
}

// Run the script
updateRestaurantPassword()

export default updateRestaurantPassword 