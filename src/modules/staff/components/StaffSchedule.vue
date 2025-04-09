<template>
  <div class="schedule-container">
    <div class="header-actions">
      <h2>Vardiya Planlama</h2>
      <div class="date-navigation">
        <button @click="previousWeek" class="nav-btn">
          <i class="fas fa-chevron-left"></i>
        </button>
        <span class="current-date">
          {{ formatDateRange(currentWeekStart, new Date(currentWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000)) }}
        </span>
        <button @click="nextWeek" class="nav-btn">
          <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    </div>

    <div class="calendar">
      <div class="weekdays">
        <div class="time-column"></div>
        <div v-for="day in weekDays" :key="day.date" class="day-column">
          <div class="day-header">
            <div class="day-name">{{ day.name }}</div>
            <div class="day-date">{{ formatDate(day.date) }}</div>
          </div>
        </div>
      </div>

      <div class="schedule-grid">
        <div class="time-column">
          <div v-for="hour in hours" :key="hour" class="time-slot">
            {{ hour }}:00
          </div>
        </div>

        <div v-for="day in weekDays" :key="day.date" class="day-column">
          <div 
            v-for="hour in hours" 
            :key="`${day.date}-${hour}`" 
            class="time-slot"
            @click="openScheduleModal(day.date, hour)"
          >
            <div 
              v-for="shift in getShiftsForTimeSlot(day.date, hour)" 
              :key="shift.id" 
              class="shift-item"
              :style="{ backgroundColor: getRoleColor(shift.staff_role) }"
            >
              {{ shift.staff_name }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Schedule Modal -->
    <div v-if="showScheduleModal" class="modal">
      <div class="modal-content">
        <h3>Vardiya Ekle</h3>
        <p>{{ formatDate(selectedDate) }} {{ selectedHour }}:00 - {{ selectedHour + 1 }}:00</p>
        <form @submit.prevent="addShift">
          <div class="form-group">
            <label>Personel</label>
            <select v-model="selectedStaff" required>
              <option v-for="staff in availableStaff" :key="staff.id" :value="staff.id">
                {{ staff.name }} ({{ translateRole(staff.role) }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Not (Opsiyonel)</label>
            <textarea v-model="shiftNote" rows="3"></textarea>
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">Kaydet</button>
            <button type="button" @click="showScheduleModal = false" class="cancel-btn">İptal</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../services/supabase'

const hours = Array.from({ length: 13 }, (_, i) => i + 8) // 8:00 to 20:00
const currentWeekStart = ref(getStartOfWeek(new Date()))
const schedules = ref([])
const staffList = ref([])
const restaurantId = localStorage.getItem('restaurantId')

const showScheduleModal = ref(false)
const selectedDate = ref(null)
const selectedHour = ref(null)
const selectedStaff = ref(null)
const shiftNote = ref('')

// Computed properties
const weekDays = computed(() => {
  const days = []
  const dayNames = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar']
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStart.value)
    date.setDate(date.getDate() + i)
    days.push({
      name: dayNames[i],
      date: date
    })
  }
  
  return days
})

const availableStaff = computed(() => {
  return staffList.value.filter(staff => staff.is_active)
})

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([fetchStaff(), fetchSchedules()])
})

// Methods
function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Sunday
  return new Date(d.setDate(diff))
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric' })
}

function formatDateRange(start, end) {
  return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} - ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}`
}

function nextWeek() {
  const nextWeek = new Date(currentWeekStart.value)
  nextWeek.setDate(nextWeek.getDate() + 7)
  currentWeekStart.value = nextWeek
  fetchSchedules()
}

function previousWeek() {
  const prevWeek = new Date(currentWeekStart.value)
  prevWeek.setDate(prevWeek.getDate() - 7)
  currentWeekStart.value = prevWeek
  fetchSchedules()
}

function openScheduleModal(date, hour) {
  selectedDate.value = date
  selectedHour.value = hour
  showScheduleModal.value = true
}

function getShiftsForTimeSlot(date, hour) {
  const dateStr = date.toISOString().split('T')[0]
  return schedules.value.filter(shift => {
    const shiftDate = new Date(shift.date).toISOString().split('T')[0]
    return shiftDate === dateStr && 
           shift.start_hour <= hour && 
           shift.end_hour > hour
  })
}

function getRoleColor(role) {
  const colors = {
    'manager': '#4a6da7',
    'waiter': '#42b983',
    'chef': '#e74c3c',
    'cashier': '#f39c12'
  }
  return colors[role] || '#777'
}

function translateRole(role) {
  const translations = {
    'manager': 'Yönetici',
    'waiter': 'Garson',
    'chef': 'Şef',
    'cashier': 'Kasiyer'
  }
  return translations[role] || role
}

async function fetchStaff() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
    
    if (error) throw error
    
    staffList.value = data
  } catch (error) {
    console.error('Error fetching staff:', error)
  }
}

async function fetchSchedules() {
  try {
    const startDate = currentWeekStart.value.toISOString().split('T')[0]
    const endDate = new Date(currentWeekStart.value)
    endDate.setDate(endDate.getDate() + 6)
    const endDateStr = endDate.toISOString().split('T')[0]
    
    const { data, error } = await supabase
      .from('staff_schedules')
      .select('*, staff:staff_id(name, role)')
      .eq('restaurant_id', restaurantId)
      .gte('date', startDate)
      .lte('date', endDateStr)
    
    if (error) throw error
    
    // Transform the data to include staff name and role directly
    schedules.value = data.map(schedule => ({
      ...schedule,
      staff_name: schedule.staff?.name || 'Unknown',
      staff_role: schedule.staff?.role || 'unknown'
    }))
  } catch (error) {
    console.error('Error fetching schedules:', error)
  }
}

async function addShift() {
  if (!selectedStaff.value || !selectedDate.value || selectedHour.value === null) return
  
  try {
    const staffMember = staffList.value.find(s => s.id === selectedStaff.value)
    
    const { error } = await supabase
      .from('staff_schedules')
      .insert([{
        staff_id: selectedStaff.value,
        restaurant_id: restaurantId,
        date: selectedDate.value.toISOString().split('T')[0],
        start_hour: selectedHour.value,
        end_hour: selectedHour.value + 1,
        notes: shiftNote.value
      }])
    
    if (error) throw error
    
    await fetchSchedules()
    resetScheduleForm()
  } catch (error) {
    console.error('Error adding shift:', error)
  }
}

function resetScheduleForm() {
  selectedStaff.value = null
  shiftNote.value = ''
  showScheduleModal.value = false
}
</script>

<style scoped>
.schedule-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.date-navigation {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
}

.current-date {
  font-weight: 500;
}

.calendar {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.weekdays {
  display: flex;
  background-color: #f8f8f8;
}

.time-column {
  width: 80px;
  min-width: 80px;
  border-right: 1px solid #ddd;
}

.day-column {
  flex: 1;
  border-right: 1px solid #ddd;
}

.day-column:last-child {
  border-right: none;
}

.day-header {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

.day-name {
  font-weight: 600;
}

.day-date {
  font-size: 12px;
  color: #666;
}

.schedule-grid {
  display: flex;
  flex: 1;
  overflow-y: auto;
}

.time-slot {
  height: 60px;
  border-bottom: 1px solid #ddd;
  padding: 5px;
  position: relative;
}

.time-column .time-slot {
  text-align: center;
  font-size: 12px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shift-item {
  background-color: #42b983;
  color: white;
  border-radius: 3px;
  padding: 3px 6px;
  font-size: 12px;
  margin-bottom: 2px;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group select, .form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.save-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.cancel-btn {
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style> 