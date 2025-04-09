<template>
  <div class="h-[calc(100vh-56px)] flex flex-col bg-white overflow-auto">
    <!-- Modüller Menüsü -->
    <div class="p-4 flex-1 overflow-y-auto">
      <h2 class="px-2 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 mb-2">
        Modüller
      </h2>
      
      <div class="mt-2 space-y-1">
        <!-- Tüm modüller tek seviyede -->
        <button 
          v-for="module in filteredModules" 
          :key="module.id"
          @click="navigateTo(module.id)"
          :class="[
            'w-full flex items-center px-3 py-2 text-sm rounded-md',
            isActiveModule(module.id)
              ? 'bg-primary text-white font-medium' 
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          <!-- Mevcut ikonu değiştir -->
          <div class="mr-2 text-lg">
            <IconifyIcon :icon="getModuleIcon(module.id)" width="20" />
          </div>
          <span class="flex-1 text-left">{{ module.name }}</span>
          <!-- Yazma yetkisi olmayan modüllerde görüntüleme simgesi göster -->
          <span 
            v-if="!hasWritePermission(module.id)" 
            class="ml-1 text-sm"
            title="Görüntüleme İzni"
          >
            <IconifyIcon icon="mdi:eye" width="18" />
          </span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { computed, ref, onMounted } from 'vue'
import { hasPermission, PermissionType, getAccessibleModules } from '../utils/permissions'
import { Icon } from '@iconify/vue'
import * as authService from '../services/auth'

// Icon bileşenini düzelt
const IconifyIcon = Icon

interface Module {
  id: string;
  name: string;
  icon?: string;
}

const props = defineProps({
  currentModule: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['select-module'])
const router = useRouter()
const route = useRoute()
const userRole = ref<string>('waiter') // Varsayılan rol

// Mevcut route için reaktif değer
const currentRoute = computed(() => route.path)

// Modülün aktif olup olmadığını kontrol et
const isActiveModule = (moduleId: string) => {
  const path = currentRoute.value
  return path === `/${moduleId}` || path.startsWith(`/${moduleId}/`)
}

// Sayfa yönlendirmesi
const navigateTo = (moduleId: string) => {
  router.push(`/${moduleId}`)
  emit('select-module', moduleId)
}

// Kullanıcının yazma yetkisi var mı?
const hasWritePermission = async (moduleId: string) => {
  return await authService.checkPermission(moduleId, 'write')
}

// İç currentModule değeri - geçici olarak tutuyoruz eski yapı için
const currentModuleValue = computed(() => props.currentModule || 'pos')

// Tüm modüller ve erişim izinleri
const baseModules: Module[] = [
  { id: 'pos', name: 'Satış Ekranı', icon: 'point_of_sale' },
  { id: 'kitchen', name: 'Mutfak', icon: 'restaurant' },
  { id: 'tables', name: 'Masalar', icon: 'table_restaurant' },
  { id: 'reservations', name: 'Rezervasyonlar', icon: 'event' },
  { id: 'staff', name: 'Personel', icon: 'people' },
  { id: 'admin', name: 'Ayarlar', icon: 'settings' }
]

// Kullanıcının rolüne göre erişilebilir modül listesi
const accessibleModuleIds = ref<string[]>([])
const loading = ref(true)

const filteredModules = computed(() => {
  // Kullanıcının rolüne göre erişebileceği (okuma izni olan) modülleri filtrele
  return baseModules.filter(module => accessibleModuleIds.value.includes(module.id))
})

// LocalStorage'dan kullanıcı rolünü al ve erişilebilir modülleri hesapla
const loadModules = async () => {
  try {
    loading.value = true
    
    // Oturum geçerliliğini kontrol et
    const sessionValid = authService.checkSessionTime()
    if (!sessionValid) {
      router.push('/login')
      return
    }
    
    // LocalStorage'dan kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      userRole.value = user.role || 'guest'
      
      // Gerçek zamanlı olarak erişilebilir modülleri al
      const modules = await authService.getAccessibleModules()
      accessibleModuleIds.value = modules
      
      console.log('Erişilebilir modüller:', accessibleModuleIds.value)
    } else {
      console.error('Kullanıcı bilgileri bulunamadı')
      router.push('/login')
    }
  } catch (error) {
    console.error('Modüller yüklenirken hata:', error)
  } finally {
    loading.value = false
  }
}

// Modül ID'sine göre ikon döndür
const getModuleIcon = (moduleId: string): string => {
  const icons: { [key: string]: string } = {
    'pos': 'mdi:point-of-sale',
    'kitchen': 'mdi:chef-hat',
    'tables': 'mdi:table-chair',
    'reservations': 'mdi:calendar-clock',
    'staff': 'mdi:account-group',
    'admin': 'mdi:cog'
  };
  
  return icons[moduleId] || 'mdi:view-dashboard';
}

onMounted(() => {
  loadModules()
})
</script>

<style scoped>
/* Stil tanımlamaları */
</style> 