<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-lg font-medium text-gray-900">Menü Yönetimi</h2>
        <p class="mt-1 text-sm text-gray-500">
          Menü öğelerinizi ve kategorilerinizi buradan yönetebilirsiniz.
        </p>
      </div>
      <div class="flex space-x-3">
        <button
          @click="showCategoryModal = true"
          class="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i class="fas fa-folder-plus mr-2"></i>
          Kategori Ekle
        </button>
        <button
          @click="showMenuItemModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i class="fas fa-plus mr-2"></i>
          Ürün Ekle
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Ürün ara..."
          class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>
      <div class="w-full sm:w-48">
        <select
          v-model="selectedCategory"
          class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="">Tüm Kategoriler</option>
          <option v-for="category in categories" :key="category" :value="category">
            {{ category }}
          </option>
        </select>
      </div>
      <div class="w-full sm:w-48">
        <select
          v-model="sortBy"
          class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="name">İsim (A-Z)</option>
          <option value="price">Fiyat (Düşük-Yüksek)</option>
          <option value="category">Kategori</option>
        </select>
      </div>
    </div>

    <!-- Menu Items Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="item in filteredAndSortedItems"
        :key="item.id"
        class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      >
        <!-- Item Image -->
        <div class="aspect-w-16 aspect-h-9 bg-gray-100">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
            <i class="fas fa-image text-4xl"></i>
          </div>
        </div>

        <!-- Item Info -->
        <div class="p-4">
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-medium text-gray-900">{{ item.name }}</h3>
              <p class="text-sm text-gray-500">{{ item.category }}</p>
            </div>
            <div class="text-right">
              <div class="text-lg font-semibold text-primary">{{ formatPrice(item.price) }} ₺</div>
              <div class="text-sm text-gray-500">{{ item.prep_time }} dk</div>
            </div>
          </div>

          <!-- Options -->
          <div v-if="item.options && item.options.length > 0" class="mt-2">
            <div class="text-sm text-gray-500">Opsiyonlar:</div>
            <div class="mt-1 space-y-1">
              <div
                v-for="option in item.options"
                :key="option.name"
                class="flex justify-between text-sm"
              >
                <span class="text-gray-600">{{ option.name }}</span>
                <span class="text-gray-900">+{{ formatPrice(option.price) }} ₺</span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-4 flex justify-end space-x-2">
            <button
              @click="editMenuItem(item)"
              class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i class="fas fa-edit mr-1"></i>
              Düzenle
            </button>
            <button
              @click="deleteMenuItem(item)"
              class="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <i class="fas fa-trash-alt mr-1"></i>
              Sil
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredAndSortedItems.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
    >
      <i class="fas fa-utensils text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900">Henüz ürün eklenmemiş</h3>
      <p class="mt-1 text-sm text-gray-500">
        Menünüze ürün eklemek için "Ürün Ekle" butonuna tıklayın.
      </p>
    </div>

    <!-- Modals -->
    <MenuItemModal
      v-model="showMenuItemModal"
      :item="selectedItem"
      :categories="categories"
      :restaurant-id="restaurantId"
      @save="handleMenuItemSave"
    />

    <CategoryModal
      v-model="showCategoryModal"
      :categories="categories"
      :menu-items="menuItems"
      :restaurant-id="restaurantId"
      @refresh="loadCategories"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import supabase from '../../../services/supabase'
import MenuItemModal from './MenuItemModal.vue'
import CategoryModal from './CategoryModal.vue'

const props = defineProps({
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update'])

// State
const menuItems = ref<any[]>([])
const categories = ref<string[]>([])
const search = ref('')
const selectedCategory = ref('')
const sortBy = ref('name')
const showMenuItemModal = ref(false)
const showCategoryModal = ref(false)
const selectedItem = ref<any>(null)

// Computed
const filteredAndSortedItems = computed(() => {
  let items = [...menuItems.value]

  // Search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    items = items.filter(item =>
      item.name.toLowerCase().includes(searchLower) ||
      item.category.toLowerCase().includes(searchLower)
    )
  }

  // Category filter
  if (selectedCategory.value) {
    items = items.filter(item => item.category === selectedCategory.value)
  }

  // Sort
  items.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price':
        return a.price - b.price
      case 'category':
        return a.category.localeCompare(b.category)
      default:
        return 0
    }
  })

  return items
})

// Methods
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

const loadMenuItems = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .order('name')
    
    if (error) throw error
    
    menuItems.value = data || []
  } catch (err) {
    console.error('Menü öğeleri yüklenirken hata:', err)
  }
}

const loadCategories = async () => {
  try {
    const { data, error } = await supabase
      .from('menu_items')
      .select('category')
      .eq('restaurant_id', props.restaurantId)
    
    if (error) throw error
    
    // Unique categories
    categories.value = [...new Set(data?.map(item => item.category) || [])]
  } catch (err) {
    console.error('Kategoriler yüklenirken hata:', err)
  }
}

const editMenuItem = (item: any) => {
  selectedItem.value = item
  showMenuItemModal.value = true
}

const deleteMenuItem = async (item: any) => {
  if (!confirm(`"${item.name}" ürününü silmek istediğinize emin misiniz?`)) return
  
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', item.id)
    
    if (error) throw error
    
    await loadMenuItems()
    emit('update')
  } catch (err) {
    console.error('Menü öğesi silinirken hata:', err)
    alert('Menü öğesi silinirken bir hata oluştu')
  }
}

const handleMenuItemSave = async () => {
  await loadMenuItems()
  emit('update')
}

// Lifecycle hooks
onMounted(() => {
  loadMenuItems()
  loadCategories()
})
</script> 