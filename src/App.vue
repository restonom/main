<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import supabase, { checkSession, initAnonymousSession } from './services/supabase'
import * as authService from './services/auth'
import DatabaseSetup from './components/DatabaseSetup.vue'

const router = useRouter()
const isLoading = ref(true)
const connectionError = ref<string | null>(null)

// Check if we're in development mode
const isDev = computed(() => {
  return process.env.NODE_ENV === 'development' || import.meta.env.DEV
})

// Supabase bağlantısını kontrol et
onMounted(async () => {
  isLoading.value = true
  connectionError.value = null
  
  try {
    // Sayfa yüklendiğinde oturum durumunu kontrol et
    const hasSession = await authService.checkAuth()
    
    // Oturum yoksa ve localStorage'da kimlik bilgileri varsa anonim oturum başlatmayı dene
    if (!hasSession && (localStorage.getItem('user') || localStorage.getItem('restaurant'))) {
      console.log('Oturum doğrulanıyor...')
      
      // Oturum süresi kontrolü yap
      const sessionValid = authService.checkSessionTime()
      if (!sessionValid) {
        console.log('Oturum süresi dolmuş, yeniden giriş gerekli')
        router.push('/login')
        return
      }
      
      // Anonim oturum başlat
      await initAnonymousSession()
    }
  } catch (err) {
    console.error('Oturum kontrolü sırasında hata:', err)
    connectionError.value = err.message
  } finally {
    isLoading.value = false
  }
})

// Bağlantı hatası olduğunda bağlantıyı yenileme fonksiyonu
const refreshConnection = async () => {
  isLoading.value = true
  connectionError.value = null
  
  try {
    // Oturumu kapat
    await supabase.auth.signOut()
    
    // LocalStorage'ı temizle (isteğe bağlı - dikkatli olun, kullanıcı verilerini de temizler)
    // localStorage.clear()
    
    // Anonim oturum başlat
    const result = await initAnonymousSession()
    
    if (result) {
      // Başarılı, sayfayı yenile
      window.location.reload()
    } else {
      throw new Error('Bağlantı yenilenemedi')
    }
  } catch (err: any) {
    console.error('Bağlantı yenileme hatası:', err)
    connectionError.value = err.message
  } finally {
    isLoading.value = false
  }
}

// Auth durumu değişikliklerini dinle
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth durumu değişti:', event, session ? 'Oturum var' : 'Oturum yok')
  
  if (event === 'SIGNED_OUT') {
    console.log('Oturum sonlandı, login sayfasına yönlendiriliyor')
    // Yerel verileri temizle
    localStorage.removeItem('user')
    localStorage.removeItem('restaurant')
    localStorage.removeItem('session_time')
    localStorage.removeItem('sb_session')
    
    // Login sayfasına değilse yönlendir
    if (router.currentRoute.value.path !== '/login') {
      router.push('/login')
    }
  } else if (event === 'SIGNED_IN') {
    console.log('Yeni oturum başlatıldı')
    // Session süresini kaydet
    localStorage.setItem('session_time', new Date().getTime().toString())
  }
})
</script>

<template>
  <div class="app">
    <!-- Bağlantı hatası gösterimi -->
    <div v-if="connectionError" class="connection-error">
      <div class="error-container">
        <h2>Bağlantı Hatası</h2>
        <p>{{ connectionError }}</p>
        <button @click="refreshConnection" :disabled="isLoading">
          {{ isLoading ? 'Yenileniyor...' : 'Bağlantıyı Yenile' }}
        </button>
      </div>
    </div>
    
    <!-- Uygulama içeriği -->
    <router-view />
    
    <!-- Show database setup component only in development mode -->
    <DatabaseSetup v-if="isDev" />
  </div>
</template>

<style>
.connection-error {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.error-container {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 80%;
}

.error-container h2 {
  color: #e53935;
  margin-top: 0;
}

.error-container button {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 15px;
  font-weight: 500;
}

.error-container button:hover {
  background-color: #388e3c;
}

.error-container button:disabled {
  background-color: #9e9e9e;
  cursor: not-allowed;
}
</style>
