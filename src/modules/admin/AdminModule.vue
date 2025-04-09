<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-semibold text-gray-900">Yönetim Paneli</h1>
          <div class="flex items-center space-x-4">
            <button 
              @click="showSettings = true"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i class="fas fa-cog mr-2"></i>
              Ayarlar
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Tabs -->
      <div class="border-b border-gray-200 mb-8">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
            :class="[
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            <i :class="tab.icon" class="mr-2"></i>
            {{ tab.name }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="bg-white shadow rounded-lg">
        <!-- General Settings -->
        <div v-if="activeTab === 'general'" class="p-6">
          <GeneralSettings 
            :restaurant-id="restaurantId"
            @update="handleRestaurantUpdate"
          />
        </div>

        <!-- Menu Management -->
        <div v-if="activeTab === 'menu'" class="p-6">
          <MenuManagement 
            :restaurant-id="restaurantId"
            @update="handleMenuUpdate"
          />
        </div>

        <!-- Reports -->
        <div v-if="activeTab === 'reports'" class="p-6">
          <Reports 
            :restaurant-id="restaurantId"
          />
        </div>

        <!-- Panel Settings -->
        <div v-if="activeTab === 'panel'" class="p-6">
          <PanelSettings 
            v-model="showSettings"
            @update="handleSettingsUpdate"
          />
        </div>

        <!-- User Management -->
        <div v-if="activeTab === 'users'" class="p-6">
          <UserManagement 
            :restaurant-id="restaurantId"
            @update="handleUserUpdate"
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { hasPermission, PermissionType } from '../../utils/permissions'
import * as authService from '../../services/auth'
import GeneralSettings from './components/GeneralSettings.vue'
import MenuManagement from './components/MenuManagement.vue'
import Reports from './components/Reports.vue'
import PanelSettings from './components/PanelSettings.vue'
import UserManagement from './components/UserManagement.vue'

// Props
const props = defineProps({
  restaurantId: {
    type: Number,
    default: () => {
      // Eğer props olarak gelmezse localStorage'dan al
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          return user.restaurant_id || 1
        }
      } catch (error) {
        console.error('Restoran ID alınamadı:', error)
      }
      return 1 // Varsayılan değer
    }
  }
})

// State
const router = useRouter()
const activeTab = ref('general')
const showSettings = ref(false)
const userRole = ref('guest') // Kullanıcı rolü için varsayılan değer

// Tabs configuration
const tabs = [
  { id: 'general', name: 'Genel Ayarlar', icon: 'fas fa-building' },
  { id: 'menu', name: 'Menü Yönetimi', icon: 'fas fa-utensils' },
  { id: 'reports', name: 'Raporlar', icon: 'fas fa-chart-bar' },
  { id: 'panel', name: 'Panel Ayarları', icon: 'fas fa-cog' },
  { id: 'users', name: 'Kullanıcı Yönetimi', icon: 'fas fa-users' }
]

// Lifecycle hooks
onMounted(async () => {
  try {
    // Kullanıcı oturumunu kontrol et
    const sessionValid = authService.checkSessionTime()
    if (!sessionValid) {
      console.log('Oturum süresi dolmuş, yeniden giriş yapılmalı')
      await authService.logout()
      router.push('/login')
      return
    }
    
    // Kullanıcı rolünü localStorage'dan al
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    
    if (!user) {
      console.log('Kullanıcı bilgisi bulunamadı')
      router.push('/login')
      return
    }
    
    userRole.value = user.role || 'guest'
    
    // Kullanıcı modül erişimini kaydet
    await authService.logUserActivity(user.id, 'module_access', {
      module: 'admin',
      restaurant_id: props.restaurantId
    })
    
    console.log('Admin module loaded. Restaurant ID:', props.restaurantId, 'Role:', userRole.value)
    
    // Gerçek zamanlı izin kontrolü yap
    const hasAccess = await authService.checkPermission('admin', 'read')
    
    if (!hasAccess) {
      console.log('Admin module permission denied')
      
      // Yetkisiz erişim log kaydı
      await authService.logUserActivity(user.id, 'unauthorized_access', {
        module: 'admin',
        restaurant_id: props.restaurantId
      })
      
      router.push('/')
      return
    }
    
    // Admin modülüne erişim başarılı logunu kaydet
    await authService.logUserActivity(user.id, 'module_authorized', {
      module: 'admin',
      restaurant_id: props.restaurantId,
      permission: 'read'
    })
    
    console.log('Admin module permission granted')
    
    // Tab değişimlerini izle ve kaydet
    watch(activeTab, async (newTab) => {
      if (user && user.id) {
        await authService.logUserActivity(user.id, 'tab_change', {
          module: 'admin',
          tab: newTab,
          restaurant_id: props.restaurantId
        })
      }
    })
  } catch (error) {
    console.error('Admin module error:', error)
    router.push('/')
  }
})

// Event handlers
const handleRestaurantUpdate = async (data) => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    
    if (user && user.id) {
      // Restoran güncellemesini logla
      await authService.logUserActivity(user.id, 'restaurant_update', {
        restaurant_id: props.restaurantId,
        updated_fields: Object.keys(data || {}).join(',')
      })
    }
  } catch (error) {
    console.error('Restoran güncelleme log hatası:', error)
  }
}

const handleMenuUpdate = async (data) => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    
    if (user && user.id) {
      // Menü güncellemesini logla
      await authService.logUserActivity(user.id, 'menu_update', {
        restaurant_id: props.restaurantId,
        action: data?.action || 'update',
        item_id: data?.itemId || null
      })
    }
  } catch (error) {
    console.error('Menü güncelleme log hatası:', error)
  }
}

const handleSettingsUpdate = async (data) => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    
    if (user && user.id) {
      // Ayar güncellemesini logla
      await authService.logUserActivity(user.id, 'settings_update', {
        restaurant_id: props.restaurantId,
        updated_settings: Object.keys(data || {}).join(',')
      })
    }
  } catch (error) {
    console.error('Ayar güncelleme log hatası:', error)
  }
}

const handleUserUpdate = async (data) => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    const user = userData ? JSON.parse(userData) : null
    
    if (user && user.id) {
      // Kullanıcı güncellemesini logla
      await authService.logUserActivity(user.id, 'user_management', {
        restaurant_id: props.restaurantId,
        action: data?.action || 'update',
        target_user_id: data?.userId || null
      })
    }
  } catch (error) {
    console.error('Kullanıcı güncelleme log hatası:', error)
  }
}
</script>