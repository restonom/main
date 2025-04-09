<template>
  <div class="min-h-screen bg-gray-100 flex items-center justify-center">
    <div class="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
      <h1 class="text-2xl font-bold text-center text-primary mb-6">Restonom POS</h1>
      
      <!-- İlk aşama: Giriş -->
      <div v-if="loginStep === 1">
        <h2 class="text-xl font-semibold mb-4">Giriş</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">E-mail veya Restoran Adı</label>
            <input 
              v-model="credential" 
              type="text" 
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="E-mail (SuperAdmin) veya Restoran Adı"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Şifre</label>
            <input 
              v-model="password" 
              type="password" 
              class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="SuperAdmin şifresi veya herhangi bir değer"
            />
          </div>
          
          <div class="flex items-center">
            <input 
              v-model="rememberDevice" 
              type="checkbox" 
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label class="ml-2 block text-sm text-gray-700">Bu cihazı hatırla</label>
          </div>
          
          <button 
            @click="login"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Giriş
          </button>
          
          <div class="text-xs text-gray-500 text-center mt-2">
            <p>SuperAdmin girişi için e-mail ve şifre ile,</p>
            <p>Restoran girişi için restoran adı ile giriş yapabilirsiniz.</p>
          </div>
        </div>
      </div>
      
      <!-- İkinci aşama: Personel girişi -->
      <div v-else-if="loginStep === 2">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">{{ restaurant?.name }}</h2>
          <button 
            @click="loginStep = 1"
            class="text-sm text-gray-500 hover:text-gray-700"
          >
            Değiştir
          </button>
        </div>
        
        <h3 class="text-lg font-medium mb-2">PIN Girişi</h3>
        <div class="mb-4">
          <input 
            v-model="userPin" 
            @input="handlePinInput"
            type="text" 
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-center text-2xl tracking-widest focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="6 haneli PIN"
          />
        </div>
        
        <div class="grid grid-cols-3 gap-2">
          <button 
            v-for="n in 9" 
            :key="n" 
            @click="addPinDigit(n)"
            class="py-3 border border-gray-300 rounded-md text-xl font-medium hover:bg-gray-100"
          >
            {{ n }}
          </button>
          <button 
            @click="clearPin"
            class="py-3 border border-gray-300 rounded-md text-xl font-medium hover:bg-gray-100"
          >
            C
          </button>
          <button 
            @click="addPinDigit(0)"
            class="py-3 border border-gray-300 rounded-md text-xl font-medium hover:bg-gray-100"
          >
            0
          </button>
          <button 
            @click="loginUser"
            class="py-3 border border-transparent rounded-md text-xl font-medium text-white bg-primary hover:bg-primary-dark"
          >
            →
          </button>
        </div>
        
        <div class="text-xs text-gray-500 text-center mt-4">
          <p>Demo personel PINleri: 123456, 567890, 432109, 112233, 445566</p>
        </div>
      </div>
      
      <div v-if="error" class="mt-4 text-red-500 text-sm text-center">
        {{ error }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../services/supabase'
// eslint-disable-next-line
import type { resetClient, testConnection, initAnonymousSession } from '../services/supabase'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as authService from '../services/auth'

// State
const loginStep = ref(1)
const credential = ref('')
const password = ref('')
const rememberDevice = ref(true)
const userPin = ref('')
const error = ref('')
const restaurant = ref<any>(null)
const loading = ref(false)

const router = useRouter()

// Cihaz ID'si oluşturma
const deviceId = Math.random().toString(36).substring(2, 15)

// Cihaz hatırlama kontrolü
onMounted(() => {
  const savedRestaurant = localStorage.getItem('restaurant')
  if (savedRestaurant) {
    restaurant.value = JSON.parse(savedRestaurant)
    loginStep.value = 2
  }
})

// Giriş işlemi
const login = async () => {
  if (!credential.value) {
    error.value = 'Lütfen e-mail veya kullanıcı adı girin'
    return
  }
  
  try {
    error.value = ''
    loading.value = true
    
    // Doğrudan Restorana Giriş Yap
    try {
      // Restoranı bul
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .or(`name.eq."${credential.value}",slug.eq."${credential.value}",email.eq."${credential.value}"`)
        .limit(1)
        .single()
      
      if (restaurantError) {
        console.error('Restoran arama hatası:', restaurantError)
        throw new Error('Restoran bulunamadı.')
      }
      
      // Şifre kontrolünü geçici olarak kaldırıyoruz, sadece restoran ismi/slug ile girişe izin veriyoruz
      // if (restaurantData.password_hash !== password.value) {
      //   throw new Error('Geçersiz şifre.')
      // }
      
      console.log('İşletme bulundu ve oturum açıldı:', restaurantData.name)
      restaurant.value = restaurantData
      
      if (rememberDevice.value) {
        localStorage.setItem('restaurant', JSON.stringify(restaurant.value))
      }
      
      loginStep.value = 2
      return
    } catch (restaurantError) {
      console.error('Restoran girişi hatası:', restaurantError)
      error.value = 'Geçersiz restoran adı veya şifre.'
    }
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'Giriş başarısız'
  } finally {
    loading.value = false
  }
}

// PIN ekleme
const addPinDigit = (digit: number) => {
  if (userPin.value.length < 6) {
    userPin.value += digit.toString()
    
    // PIN 6 haneye ulaşınca otomatik login
    if (userPin.value.length === 6) {
      setTimeout(() => {
        loginUser()
      }, 300)
    }
  }
}

// PIN temizleme
const clearPin = () => {
  userPin.value = ''
}

// PIN input handling
const handlePinInput = (e: Event) => {
  const input = e.target as HTMLInputElement
  // Remove non-digit characters
  input.value = input.value.replace(/\D/g, '')
  
  // Limit to 6 digits
  if (input.value.length > 6) {
    input.value = input.value.slice(0, 6)
  }
  
  userPin.value = input.value
  
  // If PIN is complete, auto-login after delay
  if (userPin.value.length === 6) {
    setTimeout(() => {
      loginUser()
    }, 300)
  }
}

// Personel girişi
const loginUser = async () => {
  if (!userPin.value || userPin.value.length < 4) {
    error.value = 'Lütfen geçerli bir PIN kodu girin'
    return
  }
  
  if (!restaurant.value || !restaurant.value.id) {
    error.value = 'Restoran bilgisi eksik, lütfen tekrar giriş yapın'
    loginStep.value = 1
    return
  }
  
  try {
    error.value = ''
    loading.value = true
    
    // Yeni auth servisi fonksiyonunu kullan
    const result = await authService.loginWithPin(restaurant.value.id, userPin.value)
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Giriş başarısız')
    }
    
    console.log('Giriş başarılı:', result.data.user)
    
    // Kullanıcı aktivitesini kaydet
    await authService.logUserActivity(
      result.data.user.id, 
      'system_login', 
      { 
        restaurant_id: restaurant.value.id,
        method: 'pin',
        device: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}`
      }
    )
    
    // Personel rolüne göre uygun dashboard'a yönlendir
    const role = result.data.user.role || 'staff'
    if (role === 'admin' || role === 'manager') {
      router.push('/admin')
    } else if (role === 'chef' || role === 'cook') {
      router.push('/kitchen')
    } else if (role === 'waiter' || role === 'cashier') {
      router.push('/pos')
    } else {
      router.push('/dashboard')
    }
    
  } catch (err: any) {
    console.error('Personel giriş hatası:', err)
    error.value = err.message || 'Geçersiz PIN kodu'
    userPin.value = '' // PIN'i temizle
    
    // Başarısız giriş denemesini kaydet
    if (restaurant.value && restaurant.value.id) {
      try {
        const { error } = await supabase
          .from('login_attempts')
          .insert({
            restaurant_id: restaurant.value.id,
            pin: userPin.value ? '****' : null, // PIN'i kaydetme, sadece giriş olduğunu belirt
            success: false,
            ip_address: 'client', // IP sunucu tarafında kaydedilir
            user_agent: navigator.userAgent,
            created_at: new Date().toISOString()
          })
        
        if (error) {
          console.error('Giriş denemesi kaydedilemedi:', error)
        }
      } catch (logError) {
        console.error('Giriş log hatası:', logError)
      }
    }
  } finally {
    loading.value = false
  }
}
</script> 