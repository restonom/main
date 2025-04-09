import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'

// Supabase yapılandırması
const supabaseUrl = 'https://yumgzcvknzrqfnnatldr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDk4ODQsImV4cCI6MjA1ODMyNTg4NH0.BjYqRBYq-O7Uc0LRgQ-deB80Q3eRuY7ahtuTf6KTFp8'

// Service role key - YENİ ANAHTAR
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc0OTg4NCwiZXhwIjoyMDU4MzI1ODg0fQ.QlI5erquzUp5NoliSDio6J3FW-iZWqufNVJyjYN_8mo'

if (!supabaseUrl || !supabaseServiceKey) { // Service key kontrolü eklendi
  console.error('Supabase URL veya Service Key eksik.')
  process.exit(1)
}

console.log('Script başlatılıyor (ensure-restaurant.js)...')
console.log('Supabase URL:', supabaseUrl)

// Service role key ile client oluştur
const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Restoranın varlığını kontrol et ve gerekirse oluştur
 */
async function ensureRestaurant() {
  try {
    console.log('Restoran kontrol ediliyor (ensure-restaurant.js)...')

    const restaurantSlug = 'emirgan-sutis'
    const password = 'sutis123' // Gerçek şifre

    // Restoranın var olup olmadığını kontrol et
    console.log('Restoran sorgusu yapılıyor (ensure-restaurant.js)...')
    const { data: existingRestaurant, error: checkError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', restaurantSlug)
      .maybeSingle()

    if (checkError) {
      console.error('Restoran kontrol hatası (ensure-restaurant.js):', checkError)
      // API anahtarı hatası varsa belirt
      if (checkError.message.includes('Invalid API key')) {
          console.error('HATA: Geçersiz Supabase Service Role API Anahtarı. Lütfen anahtarı kontrol edin.')
      } else if (checkError.message.includes('permission denied')) {
          console.error('HATA: RLS politikaları restoranı okumayı engelliyor.')
      }
      throw checkError // Hata oluşursa scripti durdur
    }

    console.log('Restoran sorgu sonucu (ensure-restaurant.js):', existingRestaurant ? `Var (ID: ${existingRestaurant.id})` : 'Yok')

    let currentRestaurantId = null

    if (!existingRestaurant) {
      console.log('Restoran bulunamadı, oluşturuluyor (ensure-restaurant.js)...')

      // Restoranı oluştur
      const { data: newRestaurant, error: createError } = await supabase
        .from('restaurants')
        .insert({
          name: 'Emirgan Sütiş',
          slug: restaurantSlug,
          email: 'info@emirgansutis.com',
          address: 'Emirgan, Istanbul',
          phone: '+90 212 123 4567',
          password_hash: password // Şifreyi ekle
        })
        .select()
        .single() // Tek bir kayıt eklendiği için single()

      if (createError) {
        console.error('Restoran oluşturma hatası (ensure-restaurant.js):', createError)
        if (createError.message.includes('permission denied')) {
            console.error('HATA: RLS politikaları restoran oluşturmayı engelliyor.')
        }
        throw createError
      }

      console.log('Restoran başarıyla oluşturuldu (ensure-restaurant.js):', newRestaurant)
      currentRestaurantId = newRestaurant.id

    } else {
      console.log('Restoran zaten var (ensure-restaurant.js). Şifre güncelleniyor...')
      currentRestaurantId = existingRestaurant.id

      // Şifreyi güncelle (sadece farklıysa)
      if (existingRestaurant.password_hash !== password) {
        const { data: updatedRestaurant, error: updateError } = await supabase
          .from('restaurants')
          .update({ password_hash: password })
          .eq('slug', restaurantSlug)
          .select()
          .single()

        if (updateError) {
          console.error('Restoran şifre güncelleme hatası (ensure-restaurant.js):', updateError)
          if (updateError.message.includes('permission denied')) {
              console.error('HATA: RLS politikaları restoran güncellemeyi engelliyor.')
          }
          throw updateError
        }
        console.log('Restoran şifresi başarıyla güncellendi (ensure-restaurant.js)', updatedRestaurant)
      } else {
        console.log('Restoran şifresi zaten güncel (ensure-restaurant.js).')
      }
    }

    // Personel var mı kontrol et ve gerekirse oluştur
    if (currentRestaurantId) {
        await ensureStaff(currentRestaurantId);
    } else {
        console.error('Restoran ID alınamadı, personel kontrolü yapılamıyor.');
    }

    console.log('İşlem başarıyla tamamlandı (ensure-restaurant.js)')
    console.log('Doğru Login bilgileri:')
    console.log('İşletme adı: emirgan-sutis')
    console.log('Şifre: sutis123')
    console.log('PIN: 123456 (Ahmet Yılmaz - admin) veya diğer demo PINler')

  } catch (error) {
    console.error('Genel Hata (ensure-restaurant.js):', error)
    console.log('Bir hata nedeniyle işlem tamamlanamadı.')
  }
}

// Örnek personel oluştur/kontrol et
async function ensureStaff(restaurantId) {
  console.log(`Personel kontrol ediliyor (ID: ${restaurantId})...`)

  const demoStaffPins = ['123456', '567890', '432109', '112233', '445566'];
  const staffToCreate = [];

  // Mevcut personeli PIN'leriyle al
  const { data: existingStaff, error: staffCheckError } = await supabase
    .from('staff')
    .select('pin')
    .eq('restaurant_id', restaurantId)

  if (staffCheckError) {
      console.error('Personel kontrol hatası (mevcutları alırken):', staffCheckError)
      // Hata varsa bile devam etmeyi deneyebiliriz, belki sadece okuma izni yoktur
  }

  const existingPins = existingStaff ? existingStaff.map(s => s.pin) : [];
  console.log('Mevcut PINler:', existingPins);

  // Demo personel listesi
  const allDemoStaff = [
    { restaurant_id: restaurantId, name: 'Ahmet Yılmaz', email: 'ahmet@emirgansutis.com', role: 'admin', pin: '123456', permissions: { modules: ['pos', 'kitchen', 'admin'] }, active: true, hire_date: new Date().toISOString().split('T')[0] },
    { restaurant_id: restaurantId, name: 'Mehmet Can', email: 'mehmet@emirgansutis.com', role: 'waiter', pin: '567890', permissions: { modules: ['pos'] }, active: true, hire_date: new Date().toISOString().split('T')[0] },
    { restaurant_id: restaurantId, name: 'Ayşe Demir', email: 'ayse@emirgansutis.com', role: 'chef', pin: '432109', permissions: { modules: ['kitchen'] }, active: true, hire_date: new Date().toISOString().split('T')[0] },
    { restaurant_id: restaurantId, name: 'Zeynep Kaya', email: 'zeynep@emirgansutis.com', role: 'waiter', pin: '112233', permissions: { modules: ['pos'] }, active: true, hire_date: new Date().toISOString().split('T')[0] },
    { restaurant_id: restaurantId, name: 'Ali Veli', email: 'ali@emirgansutis.com', role: 'manager', pin: '445566', permissions: { modules: ['pos', 'admin'] }, active: true, hire_date: new Date().toISOString().split('T')[0] }
  ];

  // Eksik olanları bul
  for (const demoStaff of allDemoStaff) {
      if (!existingPins.includes(demoStaff.pin)) {
          staffToCreate.push(demoStaff);
      }
  }

  if (staffToCreate.length > 0) {
    console.log(`${staffToCreate.length} eksik personel bulundu, oluşturuluyor...`)
    console.log('Oluşturulacak Personel PINleri:', staffToCreate.map(s => s.pin));

    const { data: insertedStaff, error: staffInsertError } = await supabase
      .from('staff')
      .insert(staffToCreate)
      .select()

    if (staffInsertError) {
      console.error('Personel oluşturma hatası:', staffInsertError)
      if (staffInsertError.message.includes('permission denied')) {
        console.error('HATA: RLS politikaları personel oluşturmayı engelliyor.')
      }
      throw staffInsertError // Personel eklenemezse script durmalı
    }

    console.log(`Eksik personel başarıyla oluşturuldu: ${insertedStaff.length} kişi`)
  } else {
    console.log('Tüm demo personel zaten var.')
  }
}

// Scripti sadece direkt çalıştırıldığında çalıştır (import edildiğinde değil)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    ensureRestaurant();
}

export default ensureRestaurant 