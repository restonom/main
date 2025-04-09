<template>
  <div class="h-full flex flex-col p-4 bg-white rounded-lg shadow-md">
    <!-- Başlık ve Ekle Butonu -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold">Rezervasyonlar</h2>
      <div class="flex space-x-2">
        <input 
          type="date" 
          v-model="selectedDate" 
          @change="loadReservations" 
          class="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary" 
        />
        <button 
          v-if="hasWritePermission"
          @click="showReservationModal()" 
          class="bg-primary text-white text-sm px-3 py-1 rounded-md hover:bg-primary-dark"
        >
          + Yeni Rezervasyon
        </button>
      </div>
    </div>

    <!-- Rezervasyon Listesi -->
    <div class="flex-1 overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Müşteri</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Masa No</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kişi</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih & Saat</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading"> <td colspan="6" class="text-center p-4">Yükleniyor...</td> </tr>
          <tr v-else-if="error"> <td colspan="6" class="text-center p-4 text-red-500">Hata: {{ error }}</td> </tr>
          <tr v-else-if="reservations.length === 0"> <td colspan="6" class="text-center p-4 text-gray-500">Seçili tarih için rezervasyon bulunamadı.</td> </tr>
          <tr v-else v-for="reservation in reservations" :key="reservation.id">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="font-medium text-gray-900">{{ reservation.customer_name }}</div>
              <div class="text-sm text-gray-500">{{ reservation.phone || reservation.email }}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ reservation.tables?.number ? `Masa ${reservation.tables.number}` : '-' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ reservation.people }} kişi
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              {{ formatDateTime(reservation.date) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                class="px-2 py-1 text-xs font-medium rounded-full capitalize"
                :class="{
                  'bg-yellow-100 text-yellow-800': reservation.status === 'pending',
                  'bg-green-100 text-green-800': reservation.status === 'confirmed',
                  'bg-red-100 text-red-800': reservation.status === 'cancelled'
                }"
              >
                {{ reservation.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
              <button v-if="hasWritePermission" @click="showReservationModal(reservation)" class="text-gray-500 hover:text-gray-700">Düzenle</button>
              <button v-if="hasWritePermission && reservation.status !== 'cancelled'" @click="updateReservationStatus(reservation.id, 'cancelled')" class="text-red-500 hover:text-red-700">İptal</button>
              <button v-if="hasWritePermission && reservation.status === 'pending'" @click="updateReservationStatus(reservation.id, 'confirmed')" class="text-green-500 hover:text-green-700">Onayla</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rezervasyon Ekle/Düzenle Modalı -->
     <div v-if="isModalOpen" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
      <div class="relative top-20 mx-auto p-5 border w-[500px] shadow-lg rounded-md bg-white z-[101]">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            {{ reservationForm.id ? 'Rezervasyonu Düzenle' : 'Yeni Rezervasyon Oluştur' }}
          </h3>
          <form @submit.prevent="saveReservation" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Müşteri Adı</label>
              <input v-model="reservationForm.customer_name" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Telefon</label>
                <input v-model="reservationForm.phone" type="tel" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">E-posta</label>
                <input v-model="reservationForm.email" type="email" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
              </div>
            </div>
             <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tarih</label>
                  <input v-model="reservationForm.date_part" type="date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
                 <div>
                  <label class="block text-sm font-medium text-gray-700">Saat</label>
                  <input v-model="reservationForm.time_part" type="time" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                </div>
             </div>
              <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Kişi Sayısı</label>
                    <input v-model.number="reservationForm.people" type="number" min="1" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Masa</label>
                    <select v-model="reservationForm.table_id" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                        <option :value="null">Masa Seçilmedi</option>
                        <option v-for="table in availableTables" :key="table.id" :value="table.id">
                            Masa {{ table.number }} (Kapasite: {{table.capacity}}) - {{ table.location }}
                        </option>
                    </select>
                 </div>
             </div>
             <div>
                <label class="block text-sm font-medium text-gray-700">Durum</label>
                <select v-model="reservationForm.status" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                    <option value="pending">Beklemede</option>
                    <option value="confirmed">Onaylandı</option>
                    <option value="cancelled">İptal Edildi</option>
                </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Notlar</label>
              <textarea v-model="reservationForm.notes" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" @click="isModalOpen = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                İptal
              </button>
              <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                {{ reservationForm.id ? 'Güncelle' : 'Kaydet' }}
              </button>
            </div>
             <div v-if="formError" class="text-red-500 text-sm mt-2">{{ formError }}</div>
          </form>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
// Import Supabase client - Assuming relative path works, otherwise adjust or fix alias
import supabase from '../../services/supabase' 
import { format, parseISO } from 'date-fns' // For date/time formatting
import { usePermissions } from '../../composables/usePermissions'

// Interfaces
interface Reservation {
  id?: number;
  restaurant_id: number;
  table_id?: number | null;
  customer_name: string;
  email?: string | null;
  phone?: string | null;
  date: string; // ISO 8601 format timestamp with time zone
  people: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes?: string | null;
  tables?: { number: number }; // For joining table number
}

interface Table {
    id: number;
    number: number;
    capacity: number;
    location: string;
}

// State
const reservations = ref<Reservation[]>([])
const availableTables = ref<Table[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)
const isModalOpen = ref(false)
const selectedDate = ref(format(new Date(), 'yyyy-MM-dd')) // Default to today

const reservationForm = ref<Partial<Reservation> & { date_part?: string, time_part?: string }>({
  customer_name: '',
  phone: '',
  email: '',
  date_part: format(new Date(), 'yyyy-MM-dd'),
  time_part: '19:00', // Default time
  people: 2,
  table_id: null,
  status: 'pending',
  notes: ''
})

const restaurantId = localStorage.getItem('restaurantId')

// Permissions 
const { canWrite } = usePermissions()
const moduleId = 'reservations'
const hasWritePermission = canWrite(moduleId)

// Load reservations for selected date
const loadReservations = async () => {
  if (!restaurantId) {
    error.value = 'Restoran ID bulunamadı'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null

    // Get start and end of the selected date
    const startDate = `${selectedDate.value}T00:00:00`
    const endDate = `${selectedDate.value}T23:59:59`

    // Query reservations for the selected date
    const { data, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        tables (
          number
        )
      `)
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })

    if (fetchError) throw fetchError

    reservations.value = data || []
  } catch (err: any) {
    console.error('Rezervasyon verileri alınırken hata:', err)
    error.value = err.message || 'Bir hata oluştu'
  } finally {
    loading.value = false
  }
}

// Load available tables
const loadTables = async () => {
  if (!restaurantId) return
  
  try {
    const { data, error: fetchError } = await supabase
      .from('tables')
      .select('*')
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .order('number', { ascending: true })
    
    if (fetchError) throw fetchError
    
    availableTables.value = data || []
  } catch (err: any) {
    console.error('Masa verileri alınırken hata:', err)
  }
}

// Initialize
onMounted(() => {
  loadReservations()
  loadTables()
})

// Format date and time for display
const formatDateTime = (isoString: string) => {
  try {
    const date = parseISO(isoString)
    return format(date, 'dd.MM.yyyy HH:mm')
  } catch (err) {
    return isoString
  }
}

// Show modal to add/edit reservation
const showReservationModal = (reservation: Reservation | null = null) => {
  // Reset form and errors
  formError.value = null
  
  if (reservation) {
    // Edit existing reservation - parse date and time
    try {
      const date = parseISO(reservation.date)
      reservationForm.value = {
        ...reservation,
        date_part: format(date, 'yyyy-MM-dd'),
        time_part: format(date, 'HH:mm')
      }
    } catch (err) {
      console.error('Tarih ayrıştırma hatası:', err)
      reservationForm.value = { ...reservation }
    }
  } else {
    // New reservation - set default values
    reservationForm.value = {
      customer_name: '',
      phone: '',
      email: '',
      date_part: selectedDate.value,
      time_part: '19:00',
      people: 2,
      table_id: null,
      status: 'pending',
      notes: ''
    }
  }
  
  isModalOpen.value = true
}

// Save reservation
const saveReservation = async () => {
  if (!hasWritePermission) {
    formError.value = "Bu işlemi gerçekleştirmek için yeterli yetkiniz yok"
    return
  }
  
  if (!reservationForm.value.customer_name || !reservationForm.value.date_part || !reservationForm.value.time_part) {
    formError.value = 'Lütfen gerekli alanları doldurun'
    return
  }
  
  try {
    loading.value = true
    formError.value = null
    
    // Combine date and time
    const dateTime = `${reservationForm.value.date_part}T${reservationForm.value.time_part}`
    
    const reservationData = {
      restaurant_id: parseInt(restaurantId || '0', 10),
      customer_name: reservationForm.value.customer_name,
      phone: reservationForm.value.phone || null,
      email: reservationForm.value.email || null,
      date: dateTime,
      people: reservationForm.value.people,
      table_id: reservationForm.value.table_id,
      status: reservationForm.value.status,
      notes: reservationForm.value.notes || null
    }
    
    if (reservationForm.value.id) {
      // Update existing reservation
      const { error: updateError } = await supabase
        .from('reservations')
        .update(reservationData)
        .eq('id', reservationForm.value.id)
      
      if (updateError) throw updateError
    } else {
      // Insert new reservation
      const { error: insertError } = await supabase
        .from('reservations')
        .insert([reservationData])
      
      if (insertError) throw insertError
    }
    
    // Close modal and reload data
    isModalOpen.value = false
    await loadReservations()
    
  } catch (err: any) {
    console.error('Rezervasyon kaydedilirken hata:', err)
    formError.value = err.message || 'Rezervasyon kaydedilemedi'
  } finally {
    loading.value = false
  }
}

// Update reservation status
const updateReservationStatus = async (id: number, status: string) => {
  if (!hasWritePermission) {
    error.value = "Bu işlemi gerçekleştirmek için yeterli yetkiniz yok"
    return
  }
  
  try {
    loading.value = true
    
    const { error } = await supabase
      .from('reservations')
      .update({ status })
      .eq('id', id)
    
    if (error) throw error
    
    // Reload reservations
    await loadReservations()
    
  } catch (err: any) {
    console.error('Rezervasyon durumu güncellenirken hata:', err)
    alert('Durum güncellenirken bir hata oluştu: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Add any specific styles for ReservationsModule if needed */
</style> 