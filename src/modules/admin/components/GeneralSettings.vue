<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-lg font-medium text-gray-900">Restoran Bilgileri</h2>
      <p class="mt-1 text-sm text-gray-500">
        Restoranınızın temel bilgilerini buradan yönetebilirsiniz.
      </p>
    </div>

    <form @submit.prevent="saveRestaurantInfo" class="space-y-6">
      <!-- Restaurant Name -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Restoran Adı</label>
        <input
          v-model="form.name"
          type="text"
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        />
      </div>

      <!-- Address -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Adres</label>
        <textarea
          v-model="form.address"
          rows="3"
          class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          required
        ></textarea>
      </div>

      <!-- Contact Info -->
      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">Telefon</label>
          <input
            v-model="form.phone"
            type="tel"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">E-posta</label>
          <input
            v-model="form.email"
            type="email"
            class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
            required
          />
        </div>
      </div>

      <!-- Working Hours -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Çalışma Saatleri</label>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div v-for="(day, index) in form.workingHours" :key="index" class="flex items-center space-x-2">
            <span class="text-sm font-medium text-gray-700 w-24">{{ day.name }}</span>
            <div class="flex-1 flex items-center space-x-2">
              <input
                v-model="day.open"
                type="time"
                class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
              <span class="text-gray-500">-</span>
              <input
                v-model="day.close"
                type="time"
                class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              />
            </div>
            <button
              type="button"
              @click="toggleDay(index)"
              class="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              <i :class="day.isOpen ? 'fas fa-check text-green-600' : 'fas fa-times text-red-600'"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Tax Settings -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Vergi Ayarları</label>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-sm text-gray-500">KDV Oranı (%)</label>
            <input
              v-model.number="form.taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500">Servis Ücreti (%)</label>
            <input
              v-model.number="form.serviceCharge"
              type="number"
              min="0"
              max="100"
              step="0.01"
              class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
              required
            />
          </div>
        </div>
      </div>

      <!-- Submit Button -->
      <div class="flex justify-end">
        <button
          type="submit"
          :disabled="isSaving"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <i v-if="isSaving" class="fas fa-spinner fa-spin mr-2"></i>
          {{ isSaving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as dbService from '../../../services/database'
import * as authService from '../../../services/auth'

const props = defineProps({
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update'])

// Form state
const form = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
  workingHours: [
    { name: 'Pazartesi', open: '09:00', close: '22:00', isOpen: true },
    { name: 'Salı', open: '09:00', close: '22:00', isOpen: true },
    { name: 'Çarşamba', open: '09:00', close: '22:00', isOpen: true },
    { name: 'Perşembe', open: '09:00', close: '22:00', isOpen: true },
    { name: 'Cuma', open: '09:00', close: '23:00', isOpen: true },
    { name: 'Cumartesi', open: '10:00', close: '23:00', isOpen: true },
    { name: 'Pazar', open: '10:00', close: '22:00', isOpen: true }
  ],
  taxRate: 18,
  serviceCharge: 10
})

const isSaving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

// Methods
const toggleDay = (index: number) => {
  form.value.workingHours[index].isOpen = !form.value.workingHours[index].isOpen
}

const saveRestaurantInfo = async () => {
  try {
    isSaving.value = true
    errorMessage.value = ''
    
    // Tüm gerekli alanların doldurulduğunu kontrol et
    if (!form.value.name) {
      errorMessage.value = 'Restoran adı gereklidir.'
      return
    }
    
    // Veritabanı servisi ile güncelleme yap
    const result = await dbService.updateRestaurant(props.restaurantId, {
      name: form.value.name,
      address: form.value.address,
      phone: form.value.phone,
      email: form.value.email,
      working_hours: form.value.workingHours,
      tax_rate: form.value.taxRate,
      service_charge: form.value.serviceCharge
    })
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Restoran bilgileri kaydedilemedi')
    }
    
    // Güncelleme başarılı
    successMessage.value = 'Restoran bilgileri başarıyla kaydedildi.'
    
    // Kullanıcı aktivitesini logla
    await authService.logUserActivity(
      getUserId(), 
      'restaurant_update',
      {
        restaurant_id: props.restaurantId,
        updated_fields: Object.keys(form.value).join(',')
      }
    )
    
    // 3 saniye sonra başarı mesajını temizle
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
    
    // Emit the update event
    emit('update', form.value)
  } catch (error) {
    console.error('Restoran kaydetme hatası:', error)
    errorMessage.value = error.message || 'Restoran bilgileri kaydedilemedi. Lütfen tekrar deneyin.'
  } finally {
    isSaving.value = false
  }
}

// Restoran bilgilerini getir
const loadRestaurant = async () => {
  try {
    isSaving.value = true
    errorMessage.value = ''
    
    // Veritabanı servisi ile verileri getir
    const result = await dbService.getRestaurant(props.restaurantId)
    
    if (!result.success) {
      throw new Error(result.error?.message || 'Restoran bilgileri yüklenemedi')
    }
    
    // Form verilerini ayarla
    form.value = result.data
    
    // Çalışma saatleri yoksa boş obje oluştur
    if (!form.value.working_hours) {
      form.value.working_hours = {}
    }
    
    // Kullanıcı aktivitesini logla
    await authService.logUserActivity(
      getUserId(), 
      'view_restaurant_settings',
      {
        restaurant_id: props.restaurantId
      }
    )
  } catch (error) {
    console.error('Restoran yükleme hatası:', error)
    errorMessage.value = error.message || 'Restoran bilgileri yüklenemedi. Lütfen sayfayı yenileyin.'
  } finally {
    isSaving.value = false
  }
}

// Mevcut kullanıcı ID'sini al
const getUserId = () => {
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      return user.id
    }
    return null
  } catch (error) {
    console.error('Kullanıcı bilgisi alınamadı:', error)
    return null
  }
}

// Lifecycle hooks
onMounted(() => {
  loadRestaurant()
})
</script> 