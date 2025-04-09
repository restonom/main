import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Ortam değişkenlerinden veya varsayılan değerlerden URL ve key'i al
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yumgzcvknzrqfnnatldr.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1bWd6Y3ZrbnpycWZubmF0bGRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NDk4ODQsImV4cCI6MjA1ODMyNTg4NH0.BjYqRBYq-O7Uc0LRgQ-deB80Q3eRuY7ahtuTf6KTFp8'

// Singleton instance
let supabaseInstance: SupabaseClient | null = null

// Storage keys
const STORAGE_KEY = 'restonom-auth-storage'
const SESSION_KEY = 'supabase_session'

/**
 * Supabase istemcisi oluşturur veya mevcut olanı döndürür (singleton)
 */
function createSupabaseClient() {
  if (supabaseInstance) {
    return supabaseInstance
  }

  console.log(`Supabase istemcisi oluşturuluyor: ${supabaseUrl}`)
  
  // Hata yakalama ile client oluştur
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        storage: localStorage,
        storageKey: STORAGE_KEY
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    })
    
    // Global hata yakalama olayı dinleyicisi
    window.addEventListener('supabase.error', (event: any) => {
      console.error('Supabase Error:', event.detail)
    })
    
    return supabaseInstance
  } catch (error) {
    console.error('Supabase client oluşturma hatası:', error)
    throw error
  }
}

// Supabase istemcisini oluştur
const supabase = createSupabaseClient()

/**
 * İstemciyi sıfırlar
 */
export const resetClient = () => {
  console.log('Supabase client sıfırlanıyor...')
  supabaseInstance = null
  localStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(SESSION_KEY)
  return createSupabaseClient()
}

/**
 * Oturum kontrolü yapar
 */
export const checkSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Oturum kontrolü hatası:', error)
      return false
    }
    
    if (session) {
      console.log('Aktif oturum bulundu:', session.user.id)
      return true
    }
    
    console.log('Aktif oturum bulunamadı, anonim erişim kullanılıyor')
    return false
  } catch (err) {
    console.error('Oturum kontrolü beklenmeyen hata:', err)
    return false
  }
}

/**
 * PUBLIC RLS politikasıyla erişim için anonim oturum başlatır
 * Not: Supabase projesinde anonim erişim kapalıysa bu işlev gerekli değildir
 */
export const initAnonymousSession = async () => {
  try {
    console.log('Anonim oturum kontrolü yapılıyor...')
    
    // Mevcut oturum var mı kontrol et
    const sessionExists = await checkSession()
    if (sessionExists) {
      console.log('Aktif bir oturum mevcut, anonim giriş atlanıyor')
      return true
    }
    
    // Supabase projesinde anonim oturum kapalı, sadece public RLS kullanılacak
    console.log('Supabase projesinde anonim giriş devre dışı, public RLS politikalarına güveniliyor')
    return true
    
    // *** Anonim giriş aktif edilirse aşağıdaki kod kullanılabilir ***
    /*
    console.log('Anonim oturum başlatılıyor...')
    
    // Anonim giriş dene
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      console.error('Anonim oturum hatası:', error.message)
      return false
    }
    
    console.log('Anonim oturum başlatıldı, user ID:', data.user?.id || 'Kimlik yok')
    return true
    */
  } catch (err) {
    console.error('Anonim oturum başlatma hatası:', err)
    return false
  }
}

/**
 * Supabase bağlantısını test eder
 */
export const testConnection = async () => {
  try {
    console.log('Supabase bağlantısı test ediliyor...')
    
    // Public tablodan basit sorgu
    const { data, error, status } = await supabase
      .from('restaurants')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('Test sorgusu hatası:', error)
      return { success: false, message: error.message, status }
    }
    
    console.log(`Supabase bağlantısı başarılı! HTTP Durum: ${status}`)
    console.log(`Örnek veri:`, data)
    
    return { success: true, message: 'Bağlantı başarılı', status }
  } catch (err: any) {
    console.error('Test bağlantısı hatası:', err)
    return { success: false, message: err.message || 'Bilinmeyen hata', status: 500 }
  }
}

// Bağlantı testi yap ve RLS sorunlarını kontrol et
// Bu işlem uygulamanın başlangıcında çalışır
(async () => {
  try {
    // Önce bağlantıyı kontrol et
    const testResult = await testConnection()
    
    if (!testResult.success) {
      console.warn('⚠️ Supabase bağlantı sorunu, hata kodu:', testResult.status)
      
      if (testResult.status === 401 || testResult.status === 403) {
        console.warn('⚠️ Yetkilendirme hatası tespit edildi. RLS politikalarını kontrol edin.')
        
        // Oturumu sıfırlayıp tekrar dene
        resetClient()
        await initAnonymousSession()
        
        // Tekrar test et
        const retryResult = await testConnection()
        if (retryResult.success) {
          console.log('✅ Yeniden bağlantı başarılı')
        } else {
          console.error('❌ Yeniden bağlantı başarısız. RLS politikalarını kontrol edin.')
        }
      }
      
      if (testResult.status === 0 || testResult.status >= 500) {
        console.error('❌ Supabase sunucusuna erişilemiyor veya sunucu hatası.')
      }
    } else {
      console.log('✅ Supabase bağlantısı kuruldu:')
      
      // Anonim oturumu başlat
      await initAnonymousSession()
    }
  } catch (err) {
    console.error('İlk Supabase bağlantı testi hatası:', err)
  }
})()

// Default export
export default supabase 