<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header -->
    <header class="bg-primary text-white p-4 shadow-md">
      <div class="container mx-auto flex items-center justify-between">
        <h1 class="text-xl font-bold">{{ restaurant?.name }}</h1>
        <div class="text-sm">
          Masa #{{ tableId }}
        </div>
      </div>
    </header>
    
    <!-- Content -->
    <div class="container mx-auto p-4">
      <div v-if="orderPlaced" class="mb-8">
        <div class="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 class="text-lg font-semibold text-primary mb-2">Sipariş Durumu</h2>
          
          <div class="mb-4">
            <div class="text-center font-medium mb-2">
              {{ translateStatus(orderStatus) }}
            </div>
            
            <div class="relative pt-1">
              <div class="flex mb-2 items-center justify-between">
                <div>
                  <span class="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full" :class="{
                    'bg-yellow-200 text-yellow-800': orderStatus === 'preparing',
                    'bg-green-200 text-green-800': orderStatus === 'ready',
                    'bg-blue-200 text-blue-800': orderStatus === 'completed'
                  }">
                    {{ translateStatus(orderStatus) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary transition-all"
                :class="{
                  'w-1/3': orderStatus === 'preparing',
                  'w-2/3': orderStatus === 'ready',
                  'w-full': orderStatus === 'completed'
                }"
              ></div>
            </div>
          </div>
          
          <div class="flex justify-between text-sm text-gray-600">
            <div class="flex flex-col items-center">
              <span class="material-icons-outlined text-primary mb-1">receipt</span>
              <span :class="{ 'font-medium text-primary': true }">Sipariş Alındı</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="material-icons-outlined mb-1" 
                :class="orderStatus !== 'Sipariş Alındı' ? 'text-primary' : 'text-gray-400'">
                restaurant
              </span>
              <span :class="{ 
                'font-medium text-primary': orderStatus !== 'Sipariş Alındı', 
                'text-gray-400': orderStatus === 'Sipariş Alındı' 
              }">Hazırlanıyor</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="material-icons-outlined mb-1"
                :class="orderStatus === 'Hazır' || orderStatus === 'Teslim Edildi' ? 'text-primary' : 'text-gray-400'">
                check_circle
              </span>
              <span :class="{ 
                'font-medium text-primary': orderStatus === 'Hazır' || orderStatus === 'Teslim Edildi', 
                'text-gray-400': orderStatus !== 'Hazır' && orderStatus !== 'Teslim Edildi' 
              }">Hazır</span>
            </div>
            <div class="flex flex-col items-center">
              <span class="material-icons-outlined mb-1"
                :class="orderStatus === 'Teslim Edildi' ? 'text-primary' : 'text-gray-400'">
                dining
              </span>
              <span :class="{ 
                'font-medium text-primary': orderStatus === 'Teslim Edildi', 
                'text-gray-400': orderStatus !== 'Teslim Edildi' 
              }">Servis Edildi</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow-md p-4">
          <h3 class="font-semibold mb-3">Sipariş Detayları</h3>
          
          <OrderItem
            v-for="(item, index) in currentOrder.items" 
            :key="index"
            :id="item.id"
            :name="item.name"
            :price="item.price"
            :quantity="item.quantity"
          />
          
          <div class="flex justify-between mt-4 pt-3 border-t border-gray-200 font-medium">
            <div>Toplam</div>
            <div class="text-primary">{{ formatPrice(getOrderTotal()) }} ₺</div>
          </div>
        </div>
        
        <!-- Yeni sipariş butonu -->
        <button 
          @click="resetOrder"
          class="mt-4 w-full py-3 bg-primary text-white rounded-lg font-medium"
        >
          Yeni Sipariş Ver
        </button>
      </div>
      
      <div v-else>
        <!-- Menü Kategorileri -->
        <div class="flex overflow-x-auto space-x-2 py-2 mb-4">
          <button 
            v-for="category in menuCategories" 
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              selectedCategory === category 
                ? 'bg-primary text-white' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            ]"
          >
            {{ category }}
          </button>
        </div>
        
        <!-- Menü Öğeleri -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div 
            v-for="item in filteredMenuItems" 
            :key="item.id"
            class="bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <div class="p-4">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-gray-900">{{ item.name }}</h3>
                  <p class="text-sm text-gray-500 mt-1">{{ item.description }}</p>
                </div>
                <div class="text-primary font-medium">{{ formatPrice(item.price) }} ₺</div>
              </div>
              
              <div class="mt-4 flex justify-end">
                <button 
                  @click="addToOrder(item)"
                  class="bg-primary text-white text-sm px-3 py-1 rounded-md font-medium"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Sipariş Özeti -->
        <div v-if="cart.length > 0" class="fixed bottom-0 left-0 right-0 bg-white shadow-lg p-4">
          <div class="container mx-auto">
            <div class="flex justify-between items-center mb-2">
              <h3 class="font-medium">Siparişiniz</h3>
              <span class="text-sm text-gray-500">{{ cart.length }} ürün</span>
            </div>
            
            <div class="max-h-32 overflow-y-auto mb-3">
              <OrderItem
                v-for="(item, index) in cart" 
                :key="index"
                :id="item.id"
                :name="item.name"
                :price="item.price"
                :quantity="item.quantity"
              />
            </div>
            
            <div class="flex justify-between font-medium border-t border-gray-100 pt-2">
              <div>Toplam</div>
              <div class="text-primary">{{ formatPrice(getCartTotal()) }} ₺</div>
            </div>
            
            <button 
              @click="placeOrder"
              class="mt-3 w-full py-3 bg-primary text-white rounded-lg font-medium"
            >
              Siparişi Onayla
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import OrderItem from '@/components/OrderItem.vue'
import supabase from '@/services/supabase'

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface CartItem extends MenuItem {
  quantity: number;
}

// State
const restaurant = ref<any>(null)
const menuItems = ref<MenuItem[]>([])
const selectedCategory = ref<string>('Tümü')
const cart = ref<CartItem[]>([])
const orderPlaced = ref(false)
const currentOrder = ref<any>({ items: [] })
const orderStatus = ref('beklemede')
const tableId = ref<string | null>(null)

const route = useRoute()

// Mock data
const mockMenuItems: MenuItem[] = [
  { id: 1, name: 'Sütlaç', price: 45, category: 'Tatlılar', description: 'Geleneksel sütlaç, fırında pişirilmiş' },
  { id: 2, name: 'Kazandibi', price: 40, category: 'Tatlılar', description: 'Hafif karamelize edilmiş süt tatlısı' },
  { id: 3, name: 'Türk Kahvesi', price: 25, category: 'İçecekler', description: 'Özenle pişirilmiş Türk kahvesi' },
  { id: 4, name: 'Çay', price: 15, category: 'İçecekler', description: 'Demli Türk çayı' },
  { id: 5, name: 'Tavuk Şiş', price: 120, category: 'Ana Yemekler', description: 'Özel marine edilmiş tavuk şiş' },
  { id: 6, name: 'Köfte', price: 130, category: 'Ana Yemekler', description: 'El yapımı dana köfte' }
]

// Menü kategorileri
const menuCategories = computed(() => {
  const categories = ['Tümü', ...new Set(menuItems.value.map(item => item.category))]
  return categories
})

// Kategori filtreleme
const filteredMenuItems = computed(() => {
  if (selectedCategory.value === 'Tümü') {
    return menuItems.value
  }
  return menuItems.value.filter(item => item.category === selectedCategory.value)
})

// Sepete ürün ekleme
const addToOrder = (item: MenuItem) => {
  const existingItem = cart.value.find(cartItem => cartItem.id === item.id)
  
  if (existingItem) {
    existingItem.quantity += 1
  } else {
    cart.value.push({ ...item, quantity: 1 })
  }
}

// Fiyat formatı
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

// Sepet toplamı
const getCartTotal = () => {
  return cart.value.reduce((total, item) => total + (item.price * item.quantity), 0)
}

// Sipariş toplamı
const getOrderTotal = () => {
  return currentOrder.value.items.reduce((total: number, item: CartItem) => total + (item.price * item.quantity), 0)
}

// Sipariş durumunu tercüme et
const translateStatus = (status) => {
  const statusMap = {
    'beklemede': 'Sipariş Alındı',
    'hazirlanıyor': 'Hazırlanıyor',
    'hazır': 'Hazır',
    'teslim_edildi': 'Teslim Edildi',
    // İngilizce karşılıklar (Veritabanında İngilizce kullanılıyorsa)
    'pending': 'Sipariş Alındı',
    'preparing': 'Hazırlanıyor',
    'ready': 'Hazır',
    'completed': 'Teslim Edildi'
  }
  
  return statusMap[status] || status
}

// Sayfa yüklendiğinde
onMounted(async () => {
  // Route parametresinden table ID al
  tableId.value = route.params.tableId?.toString() || 'demo'
  
  try {
    if (tableId.value !== 'demo') {
      // Restoran bilgilerini al
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('*, restaurants(*)')
        .eq('id', tableId.value)
        .single()
      
      if (tableError) throw tableError
      
      if (tableData) {
        restaurant.value = tableData.restaurants
        
        // Menü öğelerini al
        const { data: menuData, error: menuError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('restaurant_id', restaurant.value.id)
        
        if (menuError) throw menuError
        
        if (menuData && menuData.length > 0) {
          menuItems.value = menuData
        } else {
          // Menü boşsa mock data kullan
          menuItems.value = mockMenuItems
        }
        
        // Mevcut aktif siparişi kontrol et
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            created_at,
            order_items (
              id, menu_item_id, quantity, unit_price, name
            )
          `)
          .eq('table_id', tableId.value)
          .in('status', ['beklemede', 'hazırlanıyor', 'hazır'])
          .order('created_at', { ascending: false })
          .limit(1)
        
        if (orderError) throw orderError
        
        if (orderData && orderData.length > 0) {
          // Aktif sipariş varsa göster
          const latestOrder = orderData[0]
          
          currentOrder.value = {
            id: latestOrder.id,
            status: latestOrder.status,
            created_at: latestOrder.created_at,
            items: latestOrder.order_items.map(item => ({
              id: item.menu_item_id,
              name: item.name,
              price: item.unit_price,
              quantity: item.quantity
            }))
          }
          
          orderStatus.value = latestOrder.status
          orderPlaced.value = true
          
          // Gerçek zamanlı aboneliği başlat
          subscribeToOrderStatus(latestOrder.id)
        }
      }
    } else {
      // Demo mod
      restaurant.value = { name: 'Demo Restoran' }
      menuItems.value = mockMenuItems
    }
  } catch (error) {
    console.error('Veri yüklenirken hata:', error)
    restaurant.value = { name: 'Demo Restoran' }
    menuItems.value = mockMenuItems
  }
})

// Siparişi ver
const placeOrder = async () => {
  if (cart.value.length === 0) return
  
  try {
    // 1. Order tablosuna sipariş oluştur
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant.value.id,
        table_id: parseInt(tableId.value || '0'),
        status: 'beklemede',
        total_amount: getCartTotal(),
        created_at: new Date().toISOString()
      })
      .select()
    
    if (orderError) throw orderError
    
    const orderId = orderData[0].id
    
    // 2. Order items ekle
    const orderItems = cart.value.map(item => ({
      order_id: orderId,
      menu_item_id: item.id,
      quantity: item.quantity,
      unit_price: item.price,
      total_price: item.price * item.quantity,
      name: item.name // Adı da kaydediyoruz (görüntülemek için)
    }))
    
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
    
    if (itemsError) throw itemsError
    
    // 3. Sipariş alındı ekranını göster
    currentOrder.value = {
      id: orderId,
      items: [...cart.value], // cart içeriğini kopyala
      status: 'beklemede',
      created_at: new Date().toISOString()
    }
    
    // Gerçek zamanlı aboneliği başlat
    subscribeToOrderStatus(orderId)
    
    orderPlaced.value = true
    cart.value = [] // Sepeti temizle
    
  } catch (error) {
    console.error('Sipariş oluşturulurken hata:', error)
    alert(`Sipariş oluşturulamadı: ${error.message}`)
  }
}

// Sipariş durumunu izle
let subscription = null
const subscribeToOrderStatus = (orderId) => {
  if (subscription) {
    subscription.unsubscribe()
  }
  
  subscription = supabase
    .from(`orders:id=eq.${orderId}`)
    .on('UPDATE', (payload) => {
      console.log('Sipariş durumu güncellendi:', payload)
      // Gelen status değerini doğrudan kullan
      orderStatus.value = payload.new.status
    })
    .subscribe()
}

// Yeni sipariş için sıfırlama
const resetOrder = () => {
  cart.value = []
  orderPlaced.value = false
  currentOrder.value = { items: [] }
  orderStatus.value = 'beklemede'
}

// Abonelikten çık
onBeforeUnmount(() => {
  if (subscription) {
    subscription.unsubscribe()
  }
})
</script> 