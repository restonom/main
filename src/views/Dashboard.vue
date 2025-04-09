<template>
  <div class="min-h-screen bg-gray-100 flex flex-col">
    <!-- Header Bileşeni - Tüm genişlikte -->
    <Header 
      :restaurant-name="restaurant?.name"
      :restaurant-logo="restaurant?.logo_url"
      :user="user"
      :panel-settings="panelSettings"
      @logout="logout"
    />
    
    <!-- Ana içerik ve sidebar yanyana -->
    <div class="flex flex-1 min-h-0">
      <!-- Sidebar -->
      <div class="w-64 bg-white shadow-md flex-shrink-0">
        <Sidebar
          :current-module="currentModule"
          @select-module="currentModule = $event"
        />
      </div>
      
      <!-- Main content -->
      <div class="flex-1 p-6 overflow-auto">
        <component :is="getModuleComponent()" v-if="currentModule" :restaurant-id="restaurant?.id"></component>
        
        <div v-else class="flex flex-col items-center justify-center h-full text-gray-500">
          <span class="material-icons-outlined text-6xl mb-4">dashboard</span>
          <p class="text-xl">Lütfen bir modül seçin</p>
        </div>
      </div>
    </div>
    
    <!-- Footer Bileşeni - Tüm genişlikte -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, defineAsyncComponent, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import Header from '../components/Header.vue'
import Footer from '../components/Footer.vue'
import supabase from '../services/supabase'

// Lazy-loaded modules
const PosModule = defineAsyncComponent(() => import('../modules/pos/PosModule.vue'))
const KitchenModule = defineAsyncComponent(() => import('../modules/kitchen/KitchenModule.vue'))
const AdminModule = defineAsyncComponent(() => import('../modules/admin/AdminModule.vue'))
const StaffModule = defineAsyncComponent(() => import('../modules/staff/StaffModule.vue'))
const TablesModule = defineAsyncComponent(() => import('../modules/tables/TablesModule.vue'))
const ReservationsModule = defineAsyncComponent(() => import('../modules/reservations/ReservationsModule.vue'))

// State
const restaurant = ref<any>(null)
const user = ref<any>(null)
const currentModule = ref<string | undefined>(undefined)
const debugInfo = ref<any>({})
const panelSettings = ref({
  showLogo: true, // Logo mu gösterilecek yoksa isim mi
  showSubtext: true, // Alt metin gösterilsin mi
  subtextContent: '' // Alt metin içeriği (boş ise varsayılan gösterilir)
})

const router = useRouter()
const route = useRoute()

// Modül verileri
const modules = [
  { id: 'pos', name: 'POS', icon: 'point_of_sale', component: PosModule },
  { id: 'orders', name: 'Sipariş', icon: 'receipt_long', component: null }, // Sipariş modülü için yer tutucu
  { id: 'tables', name: 'Masa', icon: 'table_restaurant', component: TablesModule },
  { id: 'reservations', name: 'Rezervasyon', icon: 'event', component: ReservationsModule },
  { id: 'kitchen', name: 'Mutfak', icon: 'restaurant', component: KitchenModule },
  { id: 'staff', name: 'Personel Yönetimi', icon: 'people', component: StaffModule },
  { id: 'admin', name: 'Yönetim', icon: 'settings', component: AdminModule }
]

// Kullanıcı baş harflerini al
const getUserInitials = () => {
  if (!user.value?.name) return '?'
  
  return user.value.name
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// Kullanılabilir modüller
const availableModules = computed(() => {
  // Kullanıcı rolüne göre modülleri filtrele
  const userRole = (user.value?.role || '').toLowerCase();
  
  // Admin veya yönetici ise tüm modülleri göster
  if (userRole === 'admin' || userRole === 'owner' || userRole === 'manager') {
    return modules;
  }
  
  // Garson ise POS ve Masalar
  if (userRole === 'waiter' || userRole === 'garson') {
    return modules.filter(m => ['pos', 'tables'].includes(m.id));
  }
  
  // Aşçı ise Mutfak
  if (userRole === 'chef' || userRole === 'aşçı') {
    return modules.filter(m => ['kitchen'].includes(m.id));
  }
  
  // Kasiyer ise POS ve Masalar
  if (userRole === 'cashier' || userRole === 'kasiyer') {
    return modules.filter(m => ['pos', 'tables'].includes(m.id));
  }
  
  // Bilinmeyen rol için sadece temel modülleri göster (POS ve Masalar)
  console.warn('Tanımsız kullanıcı rolü, temel modüller gösteriliyor:', userRole);
  return modules.filter(m => ['pos', 'tables'].includes(m.id));
})

// Mevcut modülün başlığını al
const getCurrentModuleTitle = () => {
  if (!currentModule.value) return 'Dashboard'
  const module = modules.find(m => m.id === currentModule.value)
  return module ? module.name : 'Dashboard'
}

// Mevcut modül bileşenini al
const getModuleComponent = () => {
  if (!currentModule.value) return null
  const module = modules.find(m => m.id === currentModule.value)
  return module ? module.component : null
}

// Kullanıcı oturumunu kapat
const logout = () => {
  localStorage.removeItem('user')
  localStorage.removeItem('restaurant')
  router.push('/login')
}

// Panel ayarlarını yükle 
const loadPanelSettings = () => {
  const settings = localStorage.getItem('panelSettings')
  if (settings) {
    try {
      panelSettings.value = JSON.parse(settings)
      
      // Eski panel ayarlarında eksik değerler olabilir, onları ekleyelim
      if (panelSettings.value.showSubtext === undefined) {
        panelSettings.value.showSubtext = true
      }
      
      if (panelSettings.value.subtextContent === undefined) {
        panelSettings.value.subtextContent = ''
      }
    } catch (e) {
      console.error('Panel ayarları yüklenemedi:', e)
    }
  }
}

onMounted(() => {
  console.log('Dashboard bileşeni yükleniyor...')
  
  // Panel ayarlarını yükle
  loadPanelSettings()
  
  try {
    // localStorage'dan verileri yükle
    const restaurantData = localStorage.getItem('restaurant')
    const userData = localStorage.getItem('user')
    
    debugInfo.value = {
      restaurant: !!restaurantData,
      user: !!userData
    }
    
    console.log('localStorage durumu:', debugInfo.value)
  
    if (!restaurantData || !userData) {
      console.warn('Giriş bilgileri bulunamadı, login sayfasına yönlendiriliyor')
      router.push('/login')
      return
    }
  
    if (restaurantData) {
      restaurant.value = JSON.parse(restaurantData)
      console.log('Restoran verisi yüklendi:', restaurant.value.name)
    }
    
    if (userData) {
      user.value = JSON.parse(userData)
      console.log('Kullanıcı verisi yüklendi:', user.value.name, user.value.role)
      
      // User bilgisini detaylı log'la
      console.log('Kullanıcı detayları:', user.value)
    }
    
    // Mevcut modülleri log'la
    console.log('Kullanılabilir modüller:', availableModules.value)
    
    // Eğer modül sayısı 0 ise bir hata fırlat
    if (availableModules.value.length === 0) {
      throw new Error('Hiçbir modül yüklenemedi. Kullanıcı rolü: ' + user.value?.role)
    }
    
    // Varsayılan olarak ilk modülü yükle
    if (!currentModule.value && availableModules.value.length > 0) {
      currentModule.value = availableModules.value[0].id
    }
  } catch (error) {
    console.error('Dashboard veri yükleme hatası:', error)
    // Hata durumunda bile bir şeyler göster
    if (availableModules.value.length > 0) {
      currentModule.value = availableModules.value[0].id
    }
  }
})
</script>

<style scoped>
.min-h-screen {
  min-height: 100vh;
}
</style> 