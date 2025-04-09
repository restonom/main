<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-dark text-white shadow">
      <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
        <h1 class="text-2xl font-bold">Restonom - Sistem Yönetimi</h1>
        <div class="flex items-center">
          <span class="mr-4">{{ admin?.name }}</span>
          <button 
            @click="logout" 
            class="py-2 px-4 bg-red-600 hover:bg-red-700 rounded text-white"
          >
            Çıkış
          </button>
        </div>
      </div>
    </header>
    
    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <div class="grid grid-cols-12 gap-6">
        <!-- Sidebar -->
        <div class="col-span-3">
          <div class="bg-white rounded-lg shadow p-4">
            <h2 class="text-lg font-medium mb-4">Menü</h2>
            <nav class="space-y-1">
              <button 
                v-for="(tab, index) in tabs" 
                :key="index"
                @click="activeTab = tab.id"
                class="w-full text-left px-3 py-2 rounded-md"
                :class="activeTab === tab.id ? 'bg-primary text-white' : 'hover:bg-gray-100'"
              >
                {{ tab.label }}
              </button>
            </nav>
          </div>
        </div>
        
        <!-- Content -->
        <div class="col-span-9">
          <!-- Dashboard -->
          <div v-if="activeTab === 'dashboard'" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Genel Bakış</h2>
            
            <div class="grid grid-cols-3 gap-4 mb-6">
              <div class="bg-blue-50 p-4 rounded-lg">
                <h3 class="text-blue-600 font-medium">Toplam Restoran</h3>
                <p class="text-2xl font-bold">{{ stats.restaurantCount }}</p>
              </div>
              
              <div class="bg-green-50 p-4 rounded-lg">
                <h3 class="text-green-600 font-medium">Toplam Kullanıcı</h3>
                <p class="text-2xl font-bold">{{ stats.userCount }}</p>
              </div>
              
              <div class="bg-purple-50 p-4 rounded-lg">
                <h3 class="text-purple-600 font-medium">Bugünkü Satış</h3>
                <p class="text-2xl font-bold">{{ formatPrice(stats.dailySales) }} ₺</p>
              </div>
            </div>
            
            <h3 class="text-lg font-medium mb-3">Son Etkinlikler</h3>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zaman</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlem</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(activity, index) in recentActivities" :key="index">
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(activity.timestamp) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ activity.restaurant }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ activity.action }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Restoranlar -->
          <div v-if="activeTab === 'restaurants'" class="bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">Restoranlar</h2>
              <button 
                @click="showAddRestaurantModal = true"
                class="py-2 px-4 bg-primary hover:bg-primary-dark rounded text-white"
              >
                Yeni Restoran Ekle
              </button>
            </div>
            
            <div class="mb-4">
              <input
                v-model="searchRestaurant"
                type="text"
                placeholder="Restoran ara..."
                class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Restoran Adı</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-posta</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oluşturulma</th>
                    <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="restaurant in filteredRestaurants" :key="restaurant.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{{ restaurant.name }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ restaurant.slug }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ restaurant.email }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(restaurant.created_at) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button class="text-primary hover:text-primary-dark mr-2">Düzenle</button>
                      <button class="text-red-600 hover:text-red-700">Sil</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Ayarlar -->
          <div v-if="activeTab === 'settings'" class="bg-white rounded-lg shadow p-6">
            <h2 class="text-xl font-bold mb-4">Sistem Ayarları</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Sistem Adı</label>
                <input 
                  v-model="settings.systemName" 
                  type="text" 
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">Yedekleme Sıklığı</label>
                <select 
                  v-model="settings.backupFrequency" 
                  class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                >
                  <option value="daily">Günlük</option>
                  <option value="weekly">Haftalık</option>
                  <option value="monthly">Aylık</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700">E-posta Bildirimleri</label>
                <div class="mt-2">
                  <label class="inline-flex items-center">
                    <input type="checkbox" v-model="settings.emailNotifications.newRestaurant" class="rounded text-primary focus:ring-primary">
                    <span class="ml-2">Yeni Restoran Kaydı</span>
                  </label>
                </div>
                
                <div class="mt-2">
                  <label class="inline-flex items-center">
                    <input type="checkbox" v-model="settings.emailNotifications.systemUpdates" class="rounded text-primary focus:ring-primary">
                    <span class="ml-2">Sistem Güncellemeleri</span>
                  </label>
                </div>
              </div>
              
              <div class="pt-4">
                <button 
                  @click="saveSettings"
                  class="py-2 px-4 bg-primary hover:bg-primary-dark rounded text-white"
                >
                  Ayarları Kaydet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../services/supabase'

const router = useRouter()
const admin = ref<any>(null)
const activeTab = ref('dashboard')

// Tabs
const tabs = [
  { id: 'dashboard', label: 'Genel Bakış' },
  { id: 'restaurants', label: 'Restoranlar' },
  { id: 'settings', label: 'Ayarlar' }
]

// Dashboard stats
const stats = ref({
  restaurantCount: 0,
  userCount: 0,
  dailySales: 0
})

// Recent activities
const recentActivities = ref([
  { timestamp: new Date(), restaurant: 'Emirgan Sütiş', action: 'Yeni sipariş oluşturuldu' },
  { timestamp: new Date(Date.now() - 30 * 60000), restaurant: 'Köfteci Yusuf', action: 'Personel girişi yapıldı' },
  { timestamp: new Date(Date.now() - 2 * 60 * 60000), restaurant: 'Big Chef', action: 'Yeni rezervasyon alındı' }
])

// Restoranlar
const restaurants = ref([])
const searchRestaurant = ref('')
const showAddRestaurantModal = ref(false)

const filteredRestaurants = computed(() => {
  if (!searchRestaurant.value) return restaurants.value
  
  const searchTerm = searchRestaurant.value.toLowerCase()
  return restaurants.value.filter((restaurant: any) => 
    restaurant.name.toLowerCase().includes(searchTerm) ||
    restaurant.email.toLowerCase().includes(searchTerm) ||
    restaurant.slug.toLowerCase().includes(searchTerm)
  )
})

// Ayarlar
const settings = ref({
  systemName: 'Restonom POS',
  backupFrequency: 'daily',
  emailNotifications: {
    newRestaurant: true,
    systemUpdates: true
  }
})

// İşlevler
const formatDate = (date: string | Date) => {
  const d = new Date(date)
  return d.toLocaleString('tr-TR')
}

const formatPrice = (price: number) => {
  return price.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const saveSettings = () => {
  // Ayarları kaydet
  console.log('Ayarlar kaydedildi:', settings.value)
  // TODO: Gerçek kaydetme işlemi
}

const logout = () => {
  localStorage.removeItem('superadmin')
  supabase.auth.signOut()
  router.push('/login')
}

// Verileri yükle
const loadData = async () => {
  // Admin bilgilerini yükle
  const adminData = localStorage.getItem('superadmin')
  if (adminData) {
    admin.value = JSON.parse(adminData)
  }
  
  try {
    // Restoran sayısını al
    const { count: restaurantCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
    
    stats.value.restaurantCount = restaurantCount || 0
    
    // Kullanıcı sayısını al
    const { count: userCount } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
    
    stats.value.userCount = userCount || 0
    
    // Günlük satışları al (bugün yapılan siparişlerin toplamı)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount')
      .gte('created_at', today.toISOString())
    
    if (orders) {
      stats.value.dailySales = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0)
    }
    
    // Restoranları al
    const { data: restaurantList } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (restaurantList) {
      restaurants.value = restaurantList
    }
  } catch (error) {
    console.error('Veri yükleme hatası:', error)
  }
}

onMounted(async () => {
  await loadData()
})
</script> 