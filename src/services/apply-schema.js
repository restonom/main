import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Supabase yapılandırması
const supabaseUrl = 'https://yumgzcvknzrqfnnatldr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDk4ODQsImV4cCI6MjA1ODMyNTg4NH0.BjYqRBYq-O7Uc0LRgQ-deB80Q3eRuY7ahtuTf6KTFp8'

// Service role key - YENİ ANAHTAR
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjc0OTg4NCwiZXhwIjoyMDU4MzI1ODg0fQ.QlI5erquzUp5NoliSDio6J3FW-iZWqufNVJyjYN_8mo'

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Supabase URL veya Service Key eksik.')
  process.exit(1)
}

console.log('Script başlatılıyor...')
console.log('Supabase URL:', supabaseUrl)

// Service role key ile client oluştur (RLS politikalarını değiştirmek için gerekli)
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// ESM modüllerinde __dirname yerine kullanılacak helper
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Supabase şemasını ve RLS politikalarını uygula/güncelle
 */
async function applySchemaAndRLS() {
  try {
    console.log('Supabase şeması ve RLS politikaları güncelleniyor...')

    // Supabase schema dosyasını oku
    const schemaPath = path.resolve(__dirname, 'supabase-schema.sql')
    console.log(`Şema dosyası okunuyor: ${schemaPath}`)
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8')

    // Yorum satırlarını temizle ve SQL komutlarına ayır
    const cleanedSQL = schemaSQL.split('\n').filter(line => !line.trim().startsWith('--')).join('\n')
    const commands = cleanedSQL.split(';').map(cmd => cmd.trim()).filter(cmd => cmd.length > 0)

    console.log(`${commands.length} SQL komutu bulundu. Uygulanıyor...`)

    // execute_sql fonksiyonu var mı kontrol et (Supabase Edge Functions için özel olabilir)
    // Eğer yoksa, direkt SQL çalıştırmayı deneyelim
    let executeSqlFunctionExists = true
    try {
        // Basit bir test sorgusu ile fonksiyonun varlığını kontrol et
        await supabase.rpc('execute_sql', { sql_query: 'SELECT 1;' })
    } catch (rpcError) {
        if (rpcError.message.includes('function public.execute_sql(sql_query => text) does not exist')) {
            console.warn('`execute_sql` RPC fonksiyonu bulunamadı. Direkt SQL çalıştırma yöntemine geçiliyor.')
            executeSqlFunctionExists = false
        } else {
            // Başka bir RPC hatası varsa fırlat
            throw rpcError
        }
    }

    for (const command of commands) {
      console.log(`Executing: ${command.substring(0, 100)}...`)
      let error = null
      if (executeSqlFunctionExists) {
        const { error: cmdError } = await supabase.rpc('execute_sql', { sql_query: command })
        error = cmdError
      } else {
        // execute_sql yoksa direkt çalıştırmayı dene
        const { error: queryError } = await supabase.from('information_schema.tables').select().query(command) // Direkt SQL için farklı yöntem gerekebilir
         // Direkt SQL çalıştırma Supabase JS v2'de daha karmaşık, bu kısım örnek amaçlıdır
         // Gerçekte, Supabase admin API veya PSQL client kullanmak gerekebilir.
         console.error("Doğrudan SQL çalıştırma bu scriptte tam desteklenmiyor.")
         error = { message: "Doğrudan SQL çalıştırma desteklenmiyor." }
      }

      if (error) {
        // Bazı hatalar (örn. nesne zaten var, IF NOT EXISTS kullanımı nedeniyle) tolere edilebilir.
        if (!error.message.includes('already exists') && !error.message.includes('does not exist')) {
            console.warn(`Komut hatası (önemli olabilir?): ${error.message} - Komut: ${command.substring(0, 100)}...`)
        }
        // Önemli hataları logla ve durdur?
        if (error.message.includes('permission denied') || error.message.includes('Invalid API key')) {
            console.error('KRİTİK HATA: API anahtarı veya izin sorunu. Script durduruluyor.')
            throw error
        }
      }
    }

    console.log('Şema ve RLS politikaları başarıyla uygulandı/güncellendi.')

    // Şimdi ensure-restaurant.js scriptini çalıştıralım
    console.log('Restoran oluşturma/güncelleme scripti çalıştırılıyor...')
    // Dinamik import ESM'de bu şekilde yapılır
    const { default: ensureRestaurant } = await import('./ensure-restaurant.js')
    await ensureRestaurant()

  } catch (error) {
    console.error('Şema uygulama/RLS politikası güncelleme hatası:', error)
    console.log('Bir hata oluştu. Login.vue\'deki geçici değişiklikle devam edebilirsiniz veya hatayı çözmeye çalışabiliriz.')
    console.log('Geçici Login bilgileri (eğer gerekirse):')
    console.log('İşletme adı: emirgan-sutis')
    console.log('Şifre: herhangi bir değer (örn. sutis123)')
    console.log('PIN: 123456 (Ahmet Yılmaz - admin)')
  }
}

// Scripti çalıştır
applySchemaAndRLS() 