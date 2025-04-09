import { createClient } from '@supabase/supabase-js'

// Supabase yapılandırması
const supabaseUrl = 'https://yumgzcvknzrqfnnatldr.supabase.co'

// Service role key - YENİ ANAHTAR
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc0OTg4NCwiZXhwIjoyMDU4MzI1ODg0fQ.QlI5erquzUp5NoliSDio6J3FW-iZWqufNVJyjYN_8mo'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL veya Service Key eksik.')
  process.exit(1)
}

// Service role key ile client oluştur
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Belirli bir restorana ait personeli kontrol et
 */
async function checkStaff() {
  try {
    console.log('Personel kontrol ediliyor...')
    
    const restaurantSlug = 'emirgan-sutis'
    
    // Önce restoran ID'sini bul
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .eq('slug', restaurantSlug)
      .single()
      
    if (restaurantError || !restaurant) {
      console.error('Restoran bulunamadı:', restaurantError)
      // API anahtarı hatası varsa belirt
      if (restaurantError && restaurantError.message.includes('Invalid API key')) {
          console.error('HATA: Geçersiz Supabase Service Role API Anahtarı. Lütfen anahtarı kontrol edin.')
      } else {
         console.log(`'${restaurantSlug}' slug'ına sahip restoran veritabanında yok veya RLS nedeniyle erişilemiyor. Lütfen önce restoranı oluşturun veya RLS politikalarını kontrol edin.`)
      }
      return
    }
    
    const restaurantId = restaurant.id
    console.log(`Restoran ID bulundu: ${restaurantId}`)
    
    // Personeli sorgula
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      
    if (staffError) {
      console.error('Personel sorgulama hatası:', staffError)
      // API anahtarı hatası varsa belirt
      if (staffError.message.includes('Invalid API key')) {
          console.error('HATA: Geçersiz Supabase Service Role API Anahtarı. Lütfen anahtarı kontrol edin.')
      } else if (staffError.message.includes('permission denied')) {
          console.error('HATA: RLS politikaları personeli okumayı engelliyor.')
      }
      return
    }
    
    if (!staff || staff.length === 0) {
      console.log(`Restoran ID ${restaurantId} için personel bulunamadı.`) 
      console.log('Personel verisi eklemek için ensure-restaurant.js scriptini geçerli bir service_role key ile çalıştırın.')
    } else {
      console.log(`Restoran ID ${restaurantId} için ${staff.length} personel bulundu:`) 
      staff.forEach(s => console.log(`  - ${s.name} (PIN: ${s.pin}, Rol: ${s.role})`))
    }
    
  } catch (error) {
    console.error('Personel kontrol hatası:', error)
  }
}

// Scripti çalıştır
checkStaff() 