<template>
  <div class="h-full flex flex-col">
    <div class="flex flex-1 overflow-hidden">
      <!-- Sol panel: Ürünler ve kategori listesi -->
      <div class="w-2/3 pr-4">
        <!-- Kategori seçimi -->
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
        
        <!-- Ürün grid -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto" style="max-height: calc(100vh - 240px)">
          <div 
            v-for="item in filteredMenuItems" 
            :key="item.id"
            @click="addToOrder(item)"
            class="bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
          >
            <div class="p-3">
              <div class="flex justify-between items-start">
                <h3 class="font-medium text-gray-900">{{ item.name }}</h3>
                <div class="text-primary font-medium">{{ formatPrice(item.price) }} ₺</div>
              </div>
              <p class="text-xs text-gray-500 mt-1 line-clamp-2">{{ item.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Sağ panel: Sipariş listesi -->
      <div class="w-1/3 bg-white rounded-lg shadow-md p-4">
        <div class="flex items-center justify-between mb-4">
          <div class="flex flex-col">
            <h2 class="text-lg font-semibold text-primary">Sipariş Oluştur</h2>
            <p class="text-xs text-gray-500">{{ currentOrder.length > 0 ? `${currentOrder.length} ürün` : 'Henüz ürün eklenmedi' }}</p>
          </div>
          <div class="flex space-x-2">
            <button 
              @click="clearOrder"
              class="p-1.5 rounded hover:bg-red-50 text-red-500 border border-gray-200"
              title="Siparişi Temizle"
              :disabled="currentOrder.length === 0"
              :class="{'opacity-50 cursor-not-allowed': currentOrder.length === 0}"
            >
              <span class="material-icons-outlined text-lg">delete</span>
            </button>
          </div>
        </div>
        
        <!-- Masa ve kişi sayısı seçimi -->
        <div class="mb-4">
          <!-- Hiçbir seçim yapılmadığında -->
          <div v-if="!selectedTable" class="flex justify-center">
            <button 
              @click="modalOpen = true"
              class="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              <span class="material-icons-outlined">table_restaurant</span>
              Masa Seç
            </button>
          </div>
          
          <!-- Masa seçildi ama kişi sayısı belirlenmedi -->
          <div v-else-if="selectedTable && !isPeopleCountConfirmed" class="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div class="text-center mb-3">
              <div class="font-medium mb-1">Masa {{ selectedTable }}</div>
              <p class="text-xs text-gray-500">Lütfen kişi sayısını belirleyin</p>
            </div>
            
            <div class="flex justify-center items-center gap-3">
              <button 
                @click="decreasePeopleCount" 
                class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                :disabled="peopleCount <= 1"
                :class="{'opacity-50 cursor-not-allowed': peopleCount <= 1}"
              >
                <span class="material-icons-outlined">remove</span>
              </button>
              <span 
                class="mx-2 min-w-[40px] text-center text-2xl font-medium cursor-pointer hover:text-primary"
                @click="showPeopleCountModal = true"
                title="Kişi sayısını gir"
              >
                {{ peopleCount }}
              </span>
              <button 
                @click="increasePeopleCount" 
                class="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              >
                <span class="material-icons-outlined">add</span>
              </button>
            </div>
            
            <div class="flex justify-center mt-3">
              <button 
                @click="confirmPeopleSelection"
                class="px-4 py-2 bg-primary text-white rounded-md"
              >
                Onayla
              </button>
            </div>
          </div>
          
          <!-- Tüm seçimler yapıldı (minimal gösterim) -->
          <div v-else class="flex items-center justify-between p-2 border-b border-gray-100 mb-2">
            <div class="flex items-center gap-4">
              <div class="flex items-center">
                <span class="material-icons-outlined text-primary mr-1">table_restaurant</span>
                <span class="text-sm font-medium">{{ selectedTable }}</span>
              </div>
              
              <div class="flex items-center">
                <span class="material-icons-outlined text-primary mr-1">people</span>
                <span class="text-sm font-medium">{{ peopleCount }} kişi</span>
              </div>
            </div>
            
            <button 
              @click="showEditModal = true"
              class="text-xs text-gray-500 hover:text-primary flex items-center"
            >
              <span class="material-icons-outlined text-sm mr-1">edit</span>
              Değiştir
            </button>
          </div>
        </div>
        
        <!-- Sipariş Öğeleri -->
        <div v-if="currentOrder.length > 0" class="overflow-y-auto mb-4" style="max-height: calc(100vh - 350px)">
          <OrderItem 
            v-for="(item, index) in currentOrder" 
            :key="index"
            :id="item.id"
            :name="item.name"
            :price="item.price"
            :quantity="item.quantity"
            :editable="true"
            @increase="increaseQuantity(index)"
            @decrease="decreaseQuantity(index)"
          />
        </div>
        
        <!-- Boş sipariş durumu -->
        <div v-else class="py-8 text-center text-gray-500 border border-dashed border-gray-200 rounded-lg mb-4">
          <span class="material-icons-outlined text-3xl mb-2">shopping_cart</span>
          <p class="text-sm">Siparişe ürün eklemek için sol taraftan seçim yapınız</p>
        </div>
        
        <!-- Toplam -->
        <div class="mt-auto space-y-3">
          <div class="flex flex-col border-t border-gray-100 pt-3 space-y-1">
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">Ara Toplam</div>
              <div class="font-medium">{{ formatPrice(getOrderTotal()) }} ₺</div>
            </div>
            <div class="flex items-center justify-between">
              <div class="text-sm text-gray-600">KDV (%8)</div>
              <div class="text-sm">{{ formatPrice(getOrderTotal() * 0.08) }} ₺</div>
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="font-medium text-gray-800">Genel Toplam</div>
              <div class="font-bold text-lg text-primary">{{ formatPrice(getOrderTotal() * 1.08) }} ₺</div>
            </div>
          </div>
          
          <button 
            @click="saveOrder"
            class="w-full py-3 bg-primary text-white rounded-lg font-medium flex items-center justify-center hover:bg-primary-dark transition-colors"
            :disabled="currentOrder.length === 0 || !selectedTable"
            :class="{'opacity-70 cursor-not-allowed': currentOrder.length === 0 || !selectedTable}"
          >
            <span class="material-icons-outlined mr-2">save</span>
            Siparişi Kaydet
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Masa Seçim Modal -->
  <div v-if="modalOpen" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Masa Seçimi</h3>
        <button @click="modalOpen = false" class="text-gray-500 hover:text-gray-700">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>
      
      <div class="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
        <button 
          v-for="table in tables" 
          :key="table.id"
          @click="selectTable(table.id.toString())"
          :class="[
            'py-3 rounded-md',
            table.status === 'dolu' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'
          ]"
        >
          Masa {{ table.number }}
        </button>
      </div>
      
      <div class="flex justify-end">
        <button 
          @click="modalOpen = false"
          class="px-4 py-2 bg-primary text-white rounded-md font-medium"
        >
          Tamam
        </button>
      </div>
    </div>
  </div>

  <!-- Kişi Sayısı Girişi Modal -->
  <div v-if="showPeopleCountModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Kişi Sayısını Girin</h3>
        <button @click="showPeopleCountModal = false" class="text-gray-500 hover:text-gray-700">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>
      
      <div class="mb-4">
        <div class="flex flex-col">
          <label for="peopleCountInput" class="text-sm font-medium text-gray-700 mb-1">Kişi Sayısı</label>
          <input 
            id="peopleCountInput"
            type="number" 
            v-model.number="tempPeopleCount" 
            min="1" 
            class="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary focus:border-primary" 
            ref="peopleCountInput"
          />
          <p class="text-xs text-gray-500 mt-1">Minimum 1 kişi olmalıdır</p>
        </div>
      </div>
      
      <!-- Sayı klavyesi -->
      <div class="grid grid-cols-3 gap-2 mb-4">
        <button 
          v-for="num in 9" 
          :key="num" 
          @click="appendToCount(num)"
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-md text-xl font-medium"
        >
          {{ num }}
        </button>
        <button 
          @click="tempPeopleCount = ''" 
          class="bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-md text-sm font-medium"
        >
          Temizle
        </button>
        <button 
          @click="appendToCount(0)"
          class="bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-md text-xl font-medium"
        >
          0
        </button>
        <button 
          @click="confirmPeopleCount"
          class="bg-primary hover:bg-primary-dark text-white py-3 rounded-md text-sm font-medium"
        >
          Tamam
        </button>
      </div>
      
      <div class="flex justify-end">
        <button 
          @click="confirmPeopleCount"
          class="px-4 py-2 bg-primary text-white rounded-md font-medium"
        >
          Kaydet
        </button>
      </div>
    </div>
  </div>
  
  <!-- Seçimleri Değiştirme Modal -->
  <div v-if="showEditModal" class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[1000]">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md p-5">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-medium">Seçimleri Değiştir</h3>
        <button @click="showEditModal = false" class="text-gray-500 hover:text-gray-700">
          <span class="material-icons-outlined">close</span>
        </button>
      </div>
      
      <div class="py-2 space-y-4">
        <button 
          @click="editTable"
          class="w-full flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200"
        >
          <div class="flex items-center">
            <span class="material-icons-outlined text-primary mr-3">table_restaurant</span>
            <div>
              <div class="font-medium">Masa Değiştir</div>
              <div class="text-xs text-gray-500">Mevcut masa: {{ selectedTable }}</div>
            </div>
          </div>
          <span class="material-icons-outlined text-gray-400">chevron_right</span>
        </button>
        
        <button 
          @click="editPeopleCount"
          class="w-full flex items-center justify-between p-3 rounded-md bg-gray-50 hover:bg-gray-100 border border-gray-200"
        >
          <div class="flex items-center">
            <span class="material-icons-outlined text-primary mr-3">people</span>
            <div>
              <div class="font-medium">Kişi Sayısını Değiştir</div>
              <div class="text-xs text-gray-500">Mevcut kişi sayısı: {{ peopleCount }}</div>
            </div>
          </div>
          <span class="material-icons-outlined text-gray-400">chevron_right</span>
        </button>
      </div>
      
      <div class="flex justify-end mt-4">
        <button 
          @click="showEditModal = false"
          class="px-4 py-2 bg-gray-100 text-gray-700 rounded-md mr-2"
        >
          İptal
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import OrderItem from '../../components/OrderItem.vue'
import supabase from '../../services/supabase'

const props = defineProps({
  restaurantId: {
    type: Number,
    default: () => parseInt(localStorage.getItem('restaurantId') || '0', 10)
  }
})

interface MenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
  description?: string;
}

interface OrderItem extends MenuItem {
  quantity: number;
}

interface Table {
  id: number;
  number: number;
  status: 'boş' | 'dolu' | 'rezerve';
}

// State
const selectedCategory = ref('Tümü')
const currentOrder = ref<OrderItem[]>([])
const selectedTable = ref<string | null>(null)
const modalOpen = ref(false)
const peopleCount = ref(1)
const isPeopleCountConfirmed = ref(false)
const showPeopleCountModal = ref(false)
const tempPeopleCount = ref<number | string>(1)
const peopleCountInput = ref<HTMLInputElement | null>(null)
const showEditModal = ref(false)

// Menü öğelerini yükle
const menuItems = ref<MenuItem[]>([])
const loadMenuItems = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .order('name')
    
    if (error) throw error
    
    if (data && data.length > 0) {
      menuItems.value = data
    } else {
      // Test verileri
      menuItems.value = [
        { id: 1, name: 'Sütlaç', price: 45, category: 'Tatlılar', description: 'Geleneksel sütlaç' },
        { id: 2, name: 'Kazandibi', price: 40, category: 'Tatlılar', description: 'Karamelize süt tatlısı' },
        { id: 3, name: 'Türk Kahvesi', price: 25, category: 'İçecekler', description: 'Özenle pişirilmiş' },
        { id: 4, name: 'Çay', price: 15, category: 'İçecekler', description: 'Demli Türk çayı' },
        { id: 5, name: 'Tavuk Şiş', price: 120, category: 'Ana Yemekler', description: 'Marine edilmiş tavuk' },
        { id: 6, name: 'Köfte', price: 130, category: 'Ana Yemekler', description: 'El yapımı köfte' },
        { id: 7, name: 'Kola', price: 20, category: 'İçecekler', description: 'Soğuk içecek' },
        { id: 8, name: 'Ayran', price: 15, category: 'İçecekler', description: 'Ev yapımı ayran' },
        { id: 9, name: 'Baklava', price: 60, category: 'Tatlılar', description: 'Antep fıstıklı' }
      ]
    }
  } catch (err) {
    console.error('Menü yüklenemedi:', err)
  }
}

// Masaları yükle
const tables = ref<Table[]>([])
const loadTables = async () => {
  try {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .order('number')
    
    if (error) throw error
    
    if (data && data.length > 0) {
      tables.value = data
    } else {
      // Test verileri
      tables.value = Array.from({ length: 12 }, (_, i) => ({ 
        id: i + 1, 
        number: i + 1,
        status: Math.random() > 0.7 ? 'dolu' : 'boş' 
      }))
    }
  } catch (err) {
    console.error('Masalar yüklenemedi:', err)
  }
}

onMounted(() => {
  loadMenuItems()
  loadTables()
})

// Kategori listesi
const menuCategories = computed(() => {
  const categories = ['Tümü', ...new Set(menuItems.value.map(item => item.category))]
  return categories
})

// Filtrelenmiş menü öğeleri
const filteredMenuItems = computed(() => {
  if (selectedCategory.value === 'Tümü') {
    return menuItems.value
  }
  return menuItems.value.filter(item => item.category === selectedCategory.value)
})

// Sipariş toplamı
const getOrderTotal = () => {
  return currentOrder.value.reduce((total, item) => total + (item.price * item.quantity), 0)
}

// Sipariş öğesi ekleme
const addToOrder = (item: MenuItem) => {
  const existingItemIndex = currentOrder.value.findIndex(i => i.id === item.id)
  
  if (existingItemIndex >= 0) {
    currentOrder.value[existingItemIndex].quantity++
  } else {
    currentOrder.value.push({ ...item, quantity: 1 })
  }
}

// Ürün miktarını azaltma
const decreaseQuantity = (index: number) => {
  if (currentOrder.value[index].quantity > 1) {
    currentOrder.value[index].quantity--
  } else {
    currentOrder.value.splice(index, 1)
  }
}

// Ürün miktarını artırma
const increaseQuantity = (index: number) => {
  currentOrder.value[index].quantity++
}

// Masa seçimi (düzeltilmiş fonksiyon)
const selectTable = (tableId: string) => {
  try {
    // Masa bilgisini tablodan bul
    const table = tables.value.find(t => t.id.toString() === tableId);
    
    if (!table) {
      throw new Error(`Masa #${tableId} bulunamadı!`);
    }
    
    // Masa numarasını seç
    selectedTable.value = String(table.number);
    modalOpen.value = false;
    isPeopleCountConfirmed.value = false; // Yeni masa seçildiğinde kişi sayısı onayını sıfırla
    
    console.log(`Masa #${selectedTable.value} seçildi`);
    return true;
  } catch (err: any) {
    console.error('Masa seçim hatası:', err);
    alert(err.message || 'Masa seçiminde beklenmeyen hata');
    return false;
  }
}

// Sipariş kaydet
const saveOrder = async () => {
  if (!selectedTable.value || currentOrder.value.length === 0) {
    alert('Lütfen masa seçin ve sipariş ekleyin!')
    return
  }
  
  // Sipariş kaydetme işlemi burada olacak
  alert(`Sipariş ${selectedTable.value} numaralı masa için kaydedildi! Kişi sayısı: ${peopleCount.value}`)
  clearOrder()
}

// Siparişi temizle
const clearOrder = () => {
  currentOrder.value = []
  selectedTable.value = null
  peopleCount.value = 1
  isPeopleCountConfirmed.value = false
}

// Kişi sayısını artır
const increasePeopleCount = () => {
  peopleCount.value++
}

// Kişi sayısını azalt
const decreasePeopleCount = () => {
  if (peopleCount.value > 1) {
    peopleCount.value--
  }
}

// Fiyat formatla
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

// Zaman formatla
const formatTime = (date: Date | null) => {
  if (!date) return ''
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

// Sayıya ekleme yap (numara tuşları için)
const appendToCount = (digit: number) => {
  if (typeof tempPeopleCount.value === 'string') {
    tempPeopleCount.value += digit.toString()
  } else {
    tempPeopleCount.value = digit.toString()
  }
}

// Kişi sayısını doğrula ve kaydet
const confirmPeopleCount = () => {
  let count = typeof tempPeopleCount.value === 'string' 
    ? parseInt(tempPeopleCount.value) 
    : tempPeopleCount.value
  
  // Geçerli bir sayı değilse veya 1'den küçükse 1 olarak ayarla
  if (isNaN(count) || count < 1) {
    count = 1
  }
  
  peopleCount.value = count
  showPeopleCountModal.value = false
}

// Kişi sayısı seçimini onayla
const confirmPeopleSelection = () => {
  isPeopleCountConfirmed.value = true
}

// Masa ve kişi sayısı seçimlerini sıfırla
const resetSelections = () => {
  isPeopleCountConfirmed.value = false
}

// Masa değiştirme
const editTable = () => {
  showEditModal.value = false
  modalOpen.value = true // Masa seçim modalını aç
}

// Kişi sayısı değiştirme
const editPeopleCount = () => {
  showEditModal.value = false
  isPeopleCountConfirmed.value = false // Kişi sayısı seçim ekranına dön
}

// Modal açıldığında input alanına odaklan
watch(showPeopleCountModal, (newVal) => {
  if (newVal) {
    tempPeopleCount.value = peopleCount.value
    nextTick(() => {
      if (peopleCountInput.value) {
        peopleCountInput.value.focus()
        peopleCountInput.value.select()
      }
    })
  }
})
</script>

<style scoped>
/* POS Module styles can be added here */
</style> 