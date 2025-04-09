<template>
  <!-- Header - Üst kısım -->
  <header class="bg-white shadow-sm p-3 flex items-center justify-between h-14 z-10">
    <!-- Sol taraf: Logo veya restoran ismi (panelSettings'e göre) -->
    <div class="flex items-center">
      <img 
        v-if="panelSettings.showLogo && restaurantLogo" 
        :src="restaurantLogo" 
        alt="Restoran Logo" 
        class="h-10 w-auto object-contain mr-3"
      />
      <div v-else class="flex flex-col">
        <h2 class="text-xl font-bold text-primary">
          {{ restaurantName || 'Restonom' }}
        </h2>
        <p v-if="panelSettings.showSubtext" class="text-xs text-gray-500">
          {{ panelSettings.subtextContent || 'Restoran Yönetim Paneli' }}
        </p>
      </div>
    </div>
    
    <!-- Sağ taraf: Kullanıcı bilgileri ve işlem menüsü -->
    <div class="flex items-center">
      <div class="text-sm text-gray-600 mr-4">
        {{ new Date().toLocaleDateString('tr-TR') }}
      </div>

      <div class="relative" v-if="user">
        <button 
          class="user-profile-button flex items-center space-x-2 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow transition-all duration-200 px-2 py-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50" 
          @click.stop="toggleUserMenu"
        >
          <div class="rounded-full bg-primary text-white w-8 h-8 flex items-center justify-center">
            {{ userInitials }}
          </div>
          <div class="text-left max-w-[120px] hidden sm:block">
            <div class="font-medium text-sm truncate">{{ user.name }}</div>
            <div class="text-xs text-gray-500 capitalize truncate">{{ user.role }}</div>
          </div>
          <span class="material-icons-outlined text-gray-500 text-sm transition-transform duration-200" :class="{'rotate-180': showUserMenu}">
            expand_more
          </span>
        </button>
        
        <!-- Kullanıcı menüsü (animasyonlu) -->
        <div 
          v-if="showUserMenu" 
          class="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 user-menu"
        >
          <!-- Kullanıcı bilgileri başlığı -->
          <div class="p-3 border-b border-gray-100">
            <p class="text-sm font-medium text-gray-700">{{ user.name }}</p>
            <p class="text-xs text-gray-500">{{ user.email || 'Email bilgisi yok' }}</p>
          </div>

          <div class="py-1">
            <a 
              href="#" 
              @click.prevent="goToProfile"
              class="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <span class="material-icons-outlined text-gray-400 group-hover:text-primary mr-3 transition-colors">account_circle</span>
              Hesap Bilgilerim
            </a>
            <a 
              href="#" 
              @click.prevent="changePassword"
              class="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
            >
              <span class="material-icons-outlined text-gray-400 group-hover:text-primary mr-3 transition-colors">lock</span>
              Şifre Değiştir
            </a>
            <div class="border-t border-gray-100 my-1"></div>
            <a 
              @click.prevent="handleLogout"
              class="group flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 transition-colors duration-150 cursor-pointer"
            >
              <span class="material-icons-outlined text-gray-400 group-hover:text-red-500 mr-3 transition-colors">logout</span>
              <span class="group-hover:text-red-600 transition-colors">Çıkış Yap</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Props tanımları
const props = defineProps({
  restaurantName: {
    type: String,
    default: 'Restonom'
  },
  restaurantLogo: {
    type: String,
    default: ''
  },
  user: {
    type: Object,
    default: () => null
  },
  panelSettings: {
    type: Object,
    default: () => ({ 
      showLogo: true,
      showSubtext: true,
      subtextContent: ''
    })
  }
})

// Emit tanımları
const emit = defineEmits(['logout'])

// State
const showUserMenu = ref(false)

// Kullanıcı baş harflerini al
const userInitials = computed(() => {
  if (!props.user?.name) return '?'
  
  return props.user.name
    .split(' ')
    .map((name: string) => name[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
})

// Kullanıcı menüsünü aç/kapa
const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}

// Kullanıcı profiline git
const goToProfile = () => {
  alert('Hesap bilgilerim sayfası yapım aşamasında.')
  showUserMenu.value = false
}

// Şifre değiştir
const changePassword = () => {
  alert('Şifre değiştirme sayfası yapım aşamasında.')
  showUserMenu.value = false
}

// Çıkış yap
const handleLogout = () => {
  emit('logout')
  showUserMenu.value = false
}

// Kullanıcı menüsünün dışına tıklayınca menüyü kapat
const closeUserMenu = (e: MouseEvent) => {
  // Eğer tıklama kullanıcı butonundan gelmediyse menüyü kapat
  if (showUserMenu.value) {
    showUserMenu.value = false
  }
}

// Event listener
onMounted(() => {
  document.addEventListener('click', closeUserMenu)
})

// Event listener temizleme
onUnmounted(() => {
  document.removeEventListener('click', closeUserMenu)
})
</script>

<style scoped>
.user-profile-button {
  position: relative;
  overflow: hidden;
}

.user-profile-button:after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to bottom, rgba(255,255,255,0.1), rgba(255,255,255,0));
  opacity: 0;
  transition: opacity 0.2s;
}

.user-profile-button:hover:after {
  opacity: 1;
}

.rotate-180 {
  transform: rotate(180deg);
}

.user-menu {
  animation: dropdown 0.2s ease-out;
  transform-origin: top right;
}

@keyframes dropdown {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style> 