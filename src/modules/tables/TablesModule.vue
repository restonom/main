<template>
  <div class="h-full flex flex-col">
    <!-- Başlık ve sekmeler -->
    <div class="mb-6">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            class="py-2 px-1 border-b-2 font-medium text-sm"
            :class="[
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            ]"
          >
            {{ tab.name }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Ana İçerik Alanı -->
    <div class="flex-1 overflow-y-hidden">
      <!-- Masalar -->
      <div v-if="activeTab === 'tables'" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div v-for="table in tables" :key="table.id" 
               class="p-4 border rounded-lg cursor-pointer hover:shadow-md transition-shadow"
               :class="getTableClass(table.status)"
               @click="selectTable(table.id)">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-medium">{{ table.name || 'Masa ' + table.number }}</h3>
              <span class="text-2xl">{{ getTableIcon(table.status) }}</span>
            </div>
            <div class="text-sm text-gray-600">
              <p>Kapasite: {{ table.capacity }} kişilik</p>
              <p>Konum: {{ table.location }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Masa Detayları -->
      <div v-if="activeTab === 'details' && selectedTable" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <div class="mb-4">
          <h3 class="font-medium text-lg">{{ selectedTable.name || 'Masa ' + selectedTable.number }}</h3>
          <p class="text-sm text-gray-600">{{ selectedTable.location }}</p>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Durum</label>
            <select v-model="selectedTable.status" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
              <option value="available">Müsait</option>
              <option value="occupied">Dolu</option>
              <option value="reserved">Rezerve</option>
              <option value="maintenance">Bakımda</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Kapasite</label>
            <input type="number" v-model="selectedTable.capacity" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Konum</label>
            <input type="text" v-model="selectedTable.location" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          <div class="flex justify-end space-x-2">
            <button @click="activeTab = 'tables'" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
              Geri
            </button>
            <button @click="saveTable" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              Kaydet
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import supabase from '../../services/supabase'

interface Table {
  id: number
  name: string
  capacity: number
  location: string
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
  number: number
  restaurant_id: number
}

const activeTab = ref('tables')
const tabs = [
  { id: 'tables', name: 'Masalar' },
  { id: 'details', name: 'Masa Detayları' }
]

const tables = ref<Table[]>([])
const selectedTable = ref<Table | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const restaurantId = localStorage.getItem('restaurantId')

onMounted(() => {
  fetchTables()
})

const fetchTables = async () => {
  if (!restaurantId) {
    error.value = 'Restoran ID bulunamadı.'
    loading.value = false
    return
  }
  
  try {
    loading.value = true
    error.value = null
    
    const { data, error: fetchError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .order('number', { ascending: true })
      
    if (fetchError) throw fetchError
    
    tables.value = data || []
  } catch (err: any) {
    console.error('Masa verileri alınırken hata:', err)
    error.value = err.message || 'Bir hata oluştu.'
  } finally {
    loading.value = false
  }
}

const getTableClass = (status: string) => {
  switch (status) {
    case 'occupied': return 'bg-red-100 border-red-300 cursor-pointer hover:bg-red-200'
    case 'reserved': return 'bg-yellow-100 border-yellow-300 cursor-pointer hover:bg-yellow-200'
    case 'available': 
    case 'empty':
    default: return 'bg-green-100 border-green-300 cursor-pointer hover:bg-green-200'
  }
}

const getTableIcon = (status: string) => {
  switch (status) {
    case 'occupied': return '👤'
    case 'reserved': return '📅'
    case 'maintenance': return '🔧'
    case 'available':
    case 'empty':
    default: return '🪑'
  }
}

// Masa seçme (düzeltilmiş fonksiyon)
const selectTable = async (id) => {
  try {
    loading.value = true;
    
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .eq('id', id)
      .limit(1)
    
    if (error) throw error
    
    if (data && data.length > 0) {
      selectedTable.value = data[0]
      activeTab.value = 'details'
    } else {
      alert('Masa bulunamadı!')
    }
  } catch (err) {
    console.error('Masa yüklenirken hata oluştu:', err)
    alert('Masa bilgileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.')
  } finally {
    loading.value = false
  }
}

const saveTable = async () => {
  if (!selectedTable.value || !restaurantId) return
  
  try {
    error.value = null
    loading.value = true
    
    const tableData = {
      ...selectedTable.value,
      restaurant_id: parseInt(restaurantId, 10)
    }
    
    if (selectedTable.value.id) {
      // Mevcut masayı güncelle
      const { data, error: updateError } = await supabase
        .from('tables')
        .update({
          capacity: tableData.capacity,
          status: tableData.status,
          location: tableData.location
        })
        .eq('id', tableData.id)
        .select()
      
      if (updateError) {
        console.error('Masa güncelleme hatası:', updateError)
        throw updateError
      }
      
      // Güncel verileri yükle
      await fetchTables()
      // Masalar sekmesine geri dön
      activeTab.value = 'tables'
    } else {
      // Yeni masa ekle
      const { data, error: insertError } = await supabase
        .from('tables')
        .insert([tableData])
        .select()
      
      if (insertError) {
        console.error('Masa ekleme hatası:', insertError)
        throw insertError
      }
      
      // Güncel verileri yükle
      await fetchTables()
      // Masalar sekmesine geri dön
      activeTab.value = 'tables'
    }
  } catch (err: any) {
    console.error('Masa kaydetme hatası:', err)
    error.value = err.message || 'Bir hata oluştu.'
  } finally {
    loading.value = false
  }
}
</script> 