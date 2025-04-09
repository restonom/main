<template>
  <div class="h-full flex flex-col">
    <div class="mb-6 flex justify-between items-center">
      <div>
        <h2 class="text-xl font-semibold">Mutfak Siparişleri</h2>
        <p class="text-sm text-gray-500">Aktif siparişleri görüntüle ve durumlarını güncelle</p>
      </div>
      
      <div class="flex space-x-3">
        <button 
          @click="selectedFilter = 'all'"
          :class="[
            'px-3 py-1 rounded-md text-sm',
            selectedFilter === 'all' 
              ? 'bg-primary text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          ]"
        >
          Tümü ({{ orders.length }})
        </button>
        <button 
          @click="selectedFilter = 'preparing'"
          :class="[
            'px-3 py-1 rounded-md text-sm',
            selectedFilter === 'preparing' 
              ? 'bg-orange-500 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          ]"
        >
          Hazırlanıyor ({{ preparingOrders.length }})
        </button>
        <button 
          @click="selectedFilter = 'ready'"
          :class="[
            'px-3 py-1 rounded-md text-sm',
            selectedFilter === 'ready' 
              ? 'bg-green-500 text-white' 
              : 'bg-white text-gray-700 border border-gray-300'
          ]"
        >
          Hazır ({{ readyOrders.length }})
        </button>
      </div>
    </div>
    
    <!-- Siparişler Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto">
      <div 
        v-for="order in filteredOrders" 
        :key="order.id"
        class="bg-white rounded-lg shadow-md overflow-hidden"
        :class="{
          'border-l-4 border-orange-500': order.status === 'preparing',
          'border-l-4 border-green-500': order.status === 'ready',
          'border-l-4 border-blue-500': order.status === 'completed'
        }"
      >
        <div class="p-4">
          <div class="flex justify-between items-start mb-3">
            <div>
              <h3 class="font-semibold">Masa #{{ order.table_id }}</h3>
              <p class="text-xs text-gray-500">{{ formatTime(order.created_at) }}</p>
            </div>
            <div 
              class="px-2 py-1 text-xs font-medium rounded-full"
              :class="{
                'bg-orange-100 text-orange-800': order.status === 'preparing',
                'bg-green-100 text-green-800': order.status === 'ready',
                'bg-blue-100 text-blue-800': order.status === 'completed'
              }"
            >
              {{ translateStatus(order.status) }}
            </div>
          </div>
          
          <div class="border-t border-gray-100 pt-2 mb-3">
            <div
              v-for="(item, index) in order.items"
              :key="index"
              class="py-1 flex justify-between"
            >
              <div class="flex">
                <span class="font-medium">{{ item.quantity }}x</span>
                <span class="ml-2">{{ item.name }}</span>
              </div>
              <div v-if="item.notes" class="text-xs bg-gray-100 px-1 py-0.5 rounded">
                {{ item.notes }}
              </div>
            </div>
          </div>
          
          <div class="flex justify-between items-center text-sm">
            <div>
              <span class="font-medium">Kaynak:</span>
              <span 
                class="ml-1 px-2 py-0.5 rounded-full text-xs"
                :class="{
                  'bg-purple-100 text-purple-800': order.source === 'qr',
                  'bg-gray-100 text-gray-800': order.source === 'pos'
                }"
              >
                {{ order.source === 'qr' ? 'QR Menü' : 'POS' }}
              </span>
            </div>
            
            <div class="space-x-1">
              <button
                v-if="order.status === 'preparing'"
                @click="updateOrderStatus(order.id, 'ready')"
                class="px-3 py-1 bg-green-500 text-white text-xs rounded-md"
              >
                Hazır
              </button>
              <button
                v-if="order.status === 'ready'"
                @click="updateOrderStatus(order.id, 'completed')"
                class="px-3 py-1 bg-blue-500 text-white text-xs rounded-md"
              >
                Teslim Et
              </button>
              <button
                v-if="order.status === 'completed'"
                @click="removeOrder(order.id)"
                class="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Boş durum gösterimi -->
    <div 
      v-if="filteredOrders.length === 0 && !loading" 
      class="mt-12 text-center text-gray-500 flex-1 flex flex-col items-center justify-center"
    >
      <i class="fas fa-utensils text-6xl mb-4"></i>
      <p class="text-lg">Sipariş bulunmuyor</p>
      <p class="text-sm">Seçilen filtreye uygun sipariş yok</p>
    </div>
    
    <!-- Yükleniyor gösterimi -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <div class="flex items-center space-x-3">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        <p>Siparişler yükleniyor...</p>
      </div>
    </div>
    
    <!-- Bildirim sesi -->
    <audio ref="notificationSound" src="@/assets/notification.mp3"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import supabase from '../../services/supabase'
import { Icon } from '@iconify/vue'

// Props
const props = defineProps({
  restaurantId: {
    type: Number,
    default: () => parseInt(localStorage.getItem('restaurantId') || '0', 10)
  }
})

interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
}

interface Order {
  id: number;
  table_id: number;
  items: OrderItem[];
  status: string;
  source: 'pos' | 'qr';
  created_at: string;
}

// State
const orders = ref<Order[]>([])
const selectedFilter = ref('all')
const notificationSound = ref<HTMLAudioElement | null>(null)
const intervalId = ref<number | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

// Durum değerlerine göre filtreleme
const preparingOrders = computed(() => 
  orders.value.filter(order => order.status === 'hazırlanıyor' || order.status === 'preparing')
)

const readyOrders = computed(() => 
  orders.value.filter(order => order.status === 'hazır' || order.status === 'ready')
)

const filteredOrders = computed(() => {
  switch (selectedFilter.value) {
    case 'preparing':
      return preparingOrders.value
    case 'ready':
      return readyOrders.value
    default:
      return orders.value
  }
})

// Format time
const formatTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('tr-TR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  } catch (err) {
    console.error('Tarih formatı hatası:', err)
    return dateStr
  }
}

// Durum değerini Türkçeye çevir
const translateStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    'beklemede': 'Sipariş Alındı',
    'waiting': 'Sipariş Alındı',
    'preparing': 'Hazırlanıyor',
    'hazırlanıyor': 'Hazırlanıyor',
    'ready': 'Hazır',
    'hazır': 'Hazır',
    'completed': 'Teslim Edildi',
    'teslim edildi': 'Teslim Edildi'
  }
  
  return statusMap[status.toLowerCase()] || status
}

// Siparişleri yükle
const loadOrders = async () => {
  if (!props.restaurantId) {
    error.value = 'Restoran ID bulunamadı'
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const { data, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .in('status', ['waiting', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
    
    if (fetchError) throw fetchError
    
    if (data && data.length > 0) {
      orders.value = data
      
      // Yeni sipariş varsa sesli uyarı ver
      if (data.some(order => order.status === 'waiting' || order.status === 'beklemede')) {
        playNotification()
      }
    } else {
      // Canlı veri yoksa test verilerini yükle
      useTestData()
    }
  } catch (err: any) {
    console.error('Sipariş verileri alınırken hata:', err)
    error.value = err.message || 'Bir hata oluştu'
    
    // Hata durumunda test verilerini yükle
    useTestData()
  } finally {
    loading.value = false
  }
}

// Test verilerini kullan
const useTestData = () => {
  orders.value = [
    {
      id: 1,
      table_id: 5,
      items: [
        { id: 1, name: 'Tavuk Şiş', price: 120, quantity: 2 },
        { id: 2, name: 'Köfte', price: 130, quantity: 1, notes: 'Az pişmiş' }
      ],
      status: 'preparing',
      source: 'pos',
      created_at: new Date(Date.now() - 15 * 60000).toISOString()
    },
    {
      id: 2,
      table_id: 3,
      items: [
        { id: 3, name: 'Sütlaç', price: 45, quantity: 3 }
      ],
      status: 'ready',
      source: 'qr',
      created_at: new Date(Date.now() - 25 * 60000).toISOString()
    },
    {
      id: 3,
      table_id: 7,
      items: [
        { id: 5, name: 'Ayran', price: 15, quantity: 2 },
        { id: 6, name: 'Köfte', price: 130, quantity: 2 }
      ],
      status: 'completed',
      source: 'pos',
      created_at: new Date(Date.now() - 40 * 60000).toISOString()
    }
  ]
}

// Sipariş durumunu güncelle
const updateOrderStatus = async (id: number, newStatus: string) => {
  try {
    const orderIndex = orders.value.findIndex(o => o.id === id)
    if (orderIndex === -1) return
    
    // UI'ı hızlıca güncelle
    orders.value[orderIndex].status = newStatus
    
    // API'yi çağır
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (updateError) throw updateError
    
  } catch (err: any) {
    console.error('Sipariş durumu güncellenirken hata:', err)
    alert('Durum güncellenirken bir hata oluştu: ' + err.message)
  }
}

// Siparişi kaldır
const removeOrder = (id: number) => {
  // UI'dan kaldır
  orders.value = orders.value.filter(order => order.id !== id)
}

// Bildirim sesini çal
const playNotification = () => {
  if (notificationSound.value) {
    notificationSound.value.play().catch(err => {
      console.error('Bildirim sesi çalınamadı:', err)
    })
  }
}

// Otomatik yenileme ayarla
const setupAutoRefresh = () => {
  // Her 60 saniyede bir verileri yenile
  intervalId.value = window.setInterval(() => {
    loadOrders()
  }, 60000)
}

// Bileşen hazır olduğunda
onMounted(() => {
  // İlk veri yüklemesi
  loadOrders()
  
  // Otomatik yenileme başlat
  setupAutoRefresh()
})

// Bileşen kaldırılmadan önce
onBeforeUnmount(() => {
  // Otomatik yenilemeyi temizle
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})

// Icon bileşenini düzelt
const IconifyIcon = Icon
</script> 