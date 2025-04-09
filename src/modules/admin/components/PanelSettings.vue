<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-medium text-gray-900">Panel Ayarları</h2>
      <p class="mt-1 text-sm text-gray-500">
        Panel görünümünü ve davranışını buradan özelleştirebilirsiniz.
      </p>
    </div>

    <!-- Settings Form -->
    <form @submit.prevent="saveSettings" class="space-y-6">
      <!-- Theme Color -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Tema Rengi</label>
        <div class="grid grid-cols-5 gap-2">
          <div
            v-for="color in colorOptions"
            :key="color.value"
            class="w-full aspect-square rounded-full p-1 cursor-pointer border-2"
            :class="[
              form.themeColor === color.value
                ? `border-${color.value} ring-2 ring-${color.value}/50`
                : 'border-transparent'
            ]"
            @click="form.themeColor = color.value"
          >
            <div
              class="w-full h-full rounded-full"
              :class="`bg-${color.value}`"
            ></div>
          </div>
        </div>
      </div>

      <!-- Compact Mode -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Kompakt Görünüm</label>
        <div class="flex items-center">
          <button
            type="button"
            class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            :class="form.compactMode ? 'bg-primary' : 'bg-gray-200'"
            @click="form.compactMode = !form.compactMode"
          >
            <span
              class="pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
              :class="form.compactMode ? 'translate-x-5' : 'translate-x-0'"
            >
              <span
                class="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"
                :class="form.compactMode ? 'opacity-0 duration-100 ease-out' : 'opacity-100 duration-200 ease-in'"
              >
                <i class="fas fa-expand text-gray-400"></i>
              </span>
              <span
                class="absolute inset-0 h-full w-full flex items-center justify-center transition-opacity"
                :class="form.compactMode ? 'opacity-100 duration-200 ease-in' : 'opacity-0 duration-100 ease-out'"
              >
                <i class="fas fa-compress text-primary"></i>
              </span>
            </span>
          </button>
          <span class="ml-3 text-sm text-gray-500">
            Daha kompakt bir görünüm için etkinleştirin
          </span>
        </div>
      </div>

      <!-- Notifications -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Bildirimler</label>
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">Ses Bildirimleri</div>
              <div class="text-sm text-gray-500">Yeni sipariş ve bildirimlerde ses çal</div>
            </div>
            <button
              type="button"
              class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              :class="form.notifications.sound ? 'bg-primary' : 'bg-gray-200'"
              @click="form.notifications.sound = !form.notifications.sound"
            >
              <span
                class="pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                :class="form.notifications.sound ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>

          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-medium text-gray-900">Masaşüstü Bildirimleri</div>
              <div class="text-sm text-gray-500">Tarayıcı bildirimlerini göster</div>
            </div>
            <button
              type="button"
              class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              :class="form.notifications.desktop ? 'bg-primary' : 'bg-gray-200'"
              @click="form.notifications.desktop = !form.notifications.desktop"
            >
              <span
                class="pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200"
                :class="form.notifications.desktop ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Auto Refresh -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Otomatik Yenileme</label>
        <div class="flex items-center justify-between">
          <div>
            <div class="text-sm font-medium text-gray-900">Yenileme Sıklığı</div>
            <div class="text-sm text-gray-500">Verileri otomatik olarak güncelle</div>
          </div>
          <select
            v-model="form.autoRefresh"
            class="block w-48 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          >
            <option value="0">Kapalı</option>
            <option value="30">30 saniye</option>
            <option value="60">1 dakika</option>
            <option value="300">5 dakika</option>
          </select>
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

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'update'])

// State
const isSaving = ref(false)

const colorOptions = [
  { value: 'blue', label: 'Mavi' },
  { value: 'green', label: 'Yeşil' },
  { value: 'purple', label: 'Mor' },
  { value: 'red', label: 'Kırmızı' },
  { value: 'yellow', label: 'Sarı' }
]

const form = ref({
  themeColor: 'blue',
  compactMode: false,
  notifications: {
    sound: true,
    desktop: true
  },
  autoRefresh: '60'
})

// Methods
const saveSettings = async () => {
  try {
    isSaving.value = true
    
    // Save settings to localStorage
    localStorage.setItem('panelSettings', JSON.stringify(form.value))
    
    // Emit update event
    emit('update')
    
    // Close modal
    emit('update:modelValue', false)
  } catch (err) {
    console.error('Ayarlar kaydedilirken hata:', err)
    alert('Ayarlar kaydedilirken bir hata oluştu')
  } finally {
    isSaving.value = false
  }
}

// Load settings from localStorage
const loadSettings = () => {
  const savedSettings = localStorage.getItem('panelSettings')
  if (savedSettings) {
    form.value = JSON.parse(savedSettings)
  }
}

// Lifecycle hooks
onMounted(() => {
  loadSettings()
})
</script> 