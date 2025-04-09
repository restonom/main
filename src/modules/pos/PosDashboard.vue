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
          :current-module="'pos'"
          @select-module="navigateToModule"
        />
      </div>
      
      <!-- Main content -->
      <div class="flex-1 p-6 overflow-auto">
        <!-- POS Modülü içeriği -->
        <PosModule :restaurant-id="restaurant?.id" />
      </div>
    </div>
    
    <!-- Footer Bileşeni - Tüm genişlikte -->
    <Footer />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../../components/Sidebar.vue'
import Header from '../../components/Header.vue'
import Footer from '../../components/Footer.vue'
import PosModule from './PosModule.vue'

// State
const restaurant = ref<any>(null)
const user = ref<any>(null)
const panelSettings = ref({
  showLogo: true, // Logo mu gösterilecek yoksa isim mi
  showSubtext: true, // Alt metin gösterilsin mi
  subtextContent: '' // Alt metin içeriği (boş ise varsayılan gösterilir)
})

const router = useRouter()

// Modüller arası gezinme
const navigateToModule = (moduleId: string) => {
  router.push(`/${moduleId}`)
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
  // Panel ayarlarını yükle
  loadPanelSettings()
  
  try {
    // localStorage'dan verileri yükle
    const restaurantData = localStorage.getItem('restaurant')
    const userData = localStorage.getItem('user')
    
    if (!restaurantData || !userData) {
      console.warn('Giriş bilgileri bulunamadı, login sayfasına yönlendiriliyor')
      router.push('/login')
      return
    }
  
    if (restaurantData) {
      restaurant.value = JSON.parse(restaurantData)
    }
    
    if (userData) {
      user.value = JSON.parse(userData)
    }
  } catch (error) {
    console.error('Veriler yüklenirken hata oluştu:', error)
    router.push('/login')
  }
})
</script>

<style scoped>
/* PosDashboard için özel stiller */
</style> 