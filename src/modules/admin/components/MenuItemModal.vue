<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div class="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-auto">
      <div class="flex justify-between items-center p-4 border-b">
        <h2 class="text-xl font-bold">{{ item ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle' }}</h2>
        <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="p-4">
        <form @submit.prevent="saveMenuItem" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Ürün Adı</label>
            <input
              v-model="formData.name"
              type="text"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Kategori</label>
            <div class="mt-1 flex space-x-2">
              <select
                v-if="!showCustomCategory"
                v-model="formData.category"
                class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option v-for="category in categories" :key="category" :value="category">{{ category }}</option>
                <option value="__custom__">+ Yeni Kategori</option>
              </select>
              <input
                v-else
                v-model="formData.category"
                type="text"
                placeholder="Yeni kategori adı"
                class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
              <button
                v-if="showCustomCategory"
                type="button"
                @click="showCustomCategory = false"
                class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <i class="fas fa-undo"></i>
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Fiyat (₺)</label>
            <input
              v-model="formData.price"
              type="number"
              min="0"
              step="0.01"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Hazırlama Süresi (dk)</label>
            <input
              v-model="formData.prep_time"
              type="number"
              min="1"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Resim</label>
            <div class="mt-1 flex items-center space-x-3">
              <div
                v-if="imagePreview"
                class="h-24 w-24 rounded-md overflow-hidden bg-gray-100 flex-shrink-0"
              >
                <img :src="imagePreview" alt="Preview" class="h-full w-full object-cover" />
              </div>
              <div
                v-else
                class="h-24 w-24 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 flex-shrink-0"
              >
                <i class="fas fa-image text-2xl"></i>
              </div>
              <div class="flex-1">
                <input
                  type="file"
                  ref="fileInput"
                  @change="handleImageUpload"
                  accept="image/*"
                  class="hidden"
                />
                <button
                  type="button"
                  @click="$refs.fileInput.click()"
                  class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <i class="fas fa-upload mr-2"></i>
                  Resim Yükle
                </button>
                <p v-if="imagePreview" class="mt-2 text-xs text-gray-500">
                  Yeni bir resim yükleyerek değiştirebilirsiniz
                </p>
              </div>
            </div>
          </div>
          
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="block text-sm font-medium text-gray-700">Opsiyonlar / Ekstralar</label>
              <button
                type="button"
                @click="addOption"
                class="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <i class="fas fa-plus mr-1"></i>
                Ekle
              </button>
            </div>
            
            <div v-if="formData.options.length > 0" class="space-y-2 mb-2">
              <div
                v-for="(option, index) in formData.options"
                :key="index"
                class="flex space-x-2"
              >
                <input
                  v-model="option.name"
                  type="text"
                  placeholder="Opsiyon adı"
                  class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                <input
                  v-model="option.price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Fiyat"
                  class="block w-20 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
                <button
                  type="button"
                  @click="removeOption(index)"
                  class="inline-flex items-center p-2 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <i class="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
            
            <p v-else class="text-sm text-gray-500">
              Henüz opsiyon eklenmemiş
            </p>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button
              type="button"
              @click="closeModal"
              class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              İptal
            </button>
            <button
              type="submit"
              :disabled="isSaving"
              class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
            >
              <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
              {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import supabase from '../../../services/supabase'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  },
  categories: {
    type: Array as () => string[],
    default: () => []
  },
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'save'])

// State
const formData = ref({
  name: '',
  category: '',
  price: 0,
  prep_time: 15,
  image_url: '',
  options: [] as { name: string, price: number }[]
})

const showCustomCategory = ref(false)
const isSaving = ref(false)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

// Watch for changes in selected category
watch(() => formData.value.category, (newValue) => {
  if (newValue === '__custom__') {
    formData.value.category = ''
    showCustomCategory.value = true
  }
})

// Watch for changes in item prop
watch(() => props.item, (newItem) => {
  if (newItem) {
    formData.value = {
      name: newItem.name || '',
      category: newItem.category || '',
      price: newItem.price || 0,
      prep_time: newItem.prep_time || 15,
      image_url: newItem.image_url || '',
      options: newItem.options ? [...newItem.options] : []
    }
    
    if (newItem.image_url) {
      imagePreview.value = newItem.image_url
    }
  } else {
    resetForm()
  }
})

// Methods
const resetForm = () => {
  formData.value = {
    name: '',
    category: props.categories.length > 0 ? props.categories[0] : '',
    price: 0,
    prep_time: 15,
    image_url: '',
    options: []
  }
  imageFile.value = null
  imagePreview.value = ''
  showCustomCategory.value = false
}

const closeModal = () => {
  emit('update:modelValue', false)
  resetForm()
}

const addOption = () => {
  formData.value.options.push({ name: '', price: 0 })
}

const removeOption = (index: number) => {
  formData.value.options.splice(index, 1)
}

const handleImageUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    const file = target.files[0]
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      alert('Lütfen bir resim dosyası seçin')
      return
    }
    
    // Check file size (limit to 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Dosya boyutu 2MB\'dan küçük olmalıdır')
      return
    }
    
    imageFile.value = file
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      imagePreview.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const uploadImage = async (): Promise<string | null> => {
  if (!imageFile.value) return formData.value.image_url
  
  try {
    const fileExt = imageFile.value.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `menu-items/${props.restaurantId}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, imageFile.value)
    
    if (uploadError) throw uploadError
    
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)
    
    return data.publicUrl
  } catch (error) {
    console.error('Resim yükleme hatası:', error)
    return null
  }
}

const saveMenuItem = async () => {
  try {
    isSaving.value = true
    
    // Upload image if selected
    let imageUrl = formData.value.image_url
    if (imageFile.value) {
      const uploadedUrl = await uploadImage()
      if (uploadedUrl) {
        imageUrl = uploadedUrl
      }
    }
    
    const menuItem = {
      name: formData.value.name,
      category: formData.value.category,
      price: formData.value.price,
      prep_time: formData.value.prep_time,
      image_url: imageUrl,
      options: formData.value.options,
      restaurant_id: props.restaurantId
    }
    
    if (props.item) {
      // Update existing menu item
      const { error } = await supabase
        .from('menu_items')
        .update(menuItem)
        .eq('id', props.item.id)
      
      if (error) throw error
    } else {
      // Insert new menu item
      const { error } = await supabase
        .from('menu_items')
        .insert([menuItem])
      
      if (error) throw error
    }
    
    emit('save')
    closeModal()
  } catch (err) {
    console.error('Menü öğesi kaydedilirken hata:', err)
    alert('Menü öğesi kaydedilirken bir hata oluştu')
  } finally {
    isSaving.value = false
  }
}

// Initialize form data when component is mounted
onMounted(() => {
  if (props.item) {
    formData.value = {
      name: props.item.name || '',
      category: props.item.category || '',
      price: props.item.price || 0,
      prep_time: props.item.prep_time || 15,
      image_url: props.item.image_url || '',
      options: props.item.options ? [...props.item.options] : []
    }
    
    if (props.item.image_url) {
      imagePreview.value = props.item.image_url
    }
  } else if (props.categories.length > 0) {
    formData.value.category = props.categories[0]
  }
})
</script> 