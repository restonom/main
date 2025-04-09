<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-xl font-bold">Kategori Yönetimi</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="p-4">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Yeni Kategori Ekle</label>
          <form @submit.prevent="addCategory" class="flex space-x-2">
            <input
              v-model="newCategory"
              type="text"
              placeholder="Kategori adı"
              class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
            <button
              type="submit"
              :disabled="isSaving"
              class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
              <i v-else class="fas fa-plus mr-2"></i>
              Ekle
            </button>
          </form>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Mevcut Kategoriler</label>
          <div class="border border-gray-200 rounded-md divide-y divide-gray-200 max-h-60 overflow-y-auto">
            <div
              v-for="category in categories"
              :key="category"
              class="flex items-center justify-between p-3 hover:bg-gray-50"
            >
              <div>{{ category }}</div>
              <button
                @click="deleteCategory(category)"
                class="text-red-500 hover:text-red-700"
              >
                <i class="fas fa-trash-alt"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end">
          <button
            @click="closeModal"
            class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import supabase from '../../../services/supabase'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  categories: {
    type: Array as () => string[],
    default: () => []
  },
  menuItems: {
    type: Array as () => any[],
    default: () => []
  },
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'refresh'])

// State
const newCategory = ref('')
const isSaving = ref(false)

// Methods
const closeModal = () => {
  emit('update:modelValue', false)
  newCategory.value = ''
}

const addCategory = async () => {
  if (!newCategory.value.trim()) return
  
  // Check if category already exists
  if (props.categories.includes(newCategory.value.trim())) {
    alert('Bu kategori zaten mevcut')
    return
  }
  
  try {
    isSaving.value = true
    
    // Add a dummy menu item with this category
    const { error } = await supabase
      .from('menu_items')
      .insert([{
        name: `${newCategory.value.trim()} (Örnek)`,
        category: newCategory.value.trim(),
        price: 0,
        restaurant_id: props.restaurantId,
        prep_time: 0
      }])
    
    if (error) throw error
    
    newCategory.value = ''
    emit('refresh')
  } catch (err) {
    console.error('Kategori eklenirken hata:', err)
    alert('Kategori eklenirken bir hata oluştu')
  } finally {
    isSaving.value = false
  }
}

const deleteCategory = async (category: string) => {
  // Check if category is in use
  const itemsInCategory = props.menuItems.filter(item => item.category === category)
  
  if (itemsInCategory.length > 0) {
    alert(`Bu kategori ${itemsInCategory.length} ürün tarafından kullanılıyor ve silinemez. Önce ürünleri başka bir kategoriye taşıyın.`)
    return
  }
  
  if (!confirm(`"${category}" kategorisini silmek istediğinize emin misiniz?`)) return
  
  try {
    isSaving.value = true
    
    // Delete all menu items in this category
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('category', category)
      .eq('restaurant_id', props.restaurantId)
    
    if (error) throw error
    
    emit('refresh')
  } catch (err) {
    console.error('Kategori silinirken hata:', err)
    alert('Kategori silinirken bir hata oluştu')
  } finally {
    isSaving.value = false
  }
}
</script> 