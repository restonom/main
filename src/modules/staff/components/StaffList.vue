<template>
  <div class="staff-list-container">
    <div class="header-actions">
      <h2>Personel Listesi</h2>
      <button class="add-btn" @click="showAddStaffModal = true">
        <i class="fas fa-plus"></i> Yeni Personel Ekle
      </button>
    </div>

    <div class="search-filter">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="İsim veya pozisyon ara..."
        @input="filterStaff"
      />
      <select v-model="filterRole" @change="filterStaff">
        <option value="">Tüm Pozisyonlar</option>
        <option value="manager">Yönetici</option>
        <option value="waiter">Garson</option>
        <option value="chef">Şef</option>
        <option value="cashier">Kasiyer</option>
      </select>
    </div>

    <table class="staff-table">
      <thead>
        <tr>
          <th>İsim</th>
          <th>Pozisyon</th>
          <th>Telefon</th>
          <th>E-posta</th>
          <th>Durumu</th>
          <th>İşlemler</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="staff in filteredStaff" :key="staff.id">
          <td>{{ staff.name }}</td>
          <td>{{ staff.role }}</td>
          <td>{{ staff.phone }}</td>
          <td>{{ staff.email }}</td>
          <td>
            <span :class="['status', staff.is_active ? 'active' : 'inactive']">
              {{ staff.is_active ? 'Aktif' : 'Pasif' }}
            </span>
          </td>
          <td class="actions">
            <button @click="editStaff(staff)" class="edit-btn">
              <i class="fas fa-edit"></i>
            </button>
            <button @click="toggleStaffStatus(staff)" class="toggle-btn">
              {{ staff.is_active ? 'Pasif Yap' : 'Aktif Yap' }}
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Staff Modal Component placeholder -->
    <div v-if="showAddStaffModal" class="modal">
      <div class="modal-content">
        <h3>Yeni Personel Ekle</h3>
        <form @submit.prevent="addStaff">
          <div class="form-group">
            <label>İsim</label>
            <input type="text" v-model="newStaff.name" required />
          </div>
          <div class="form-group">
            <label>Pozisyon</label>
            <select v-model="newStaff.role" required>
              <option value="manager">Yönetici</option>
              <option value="waiter">Garson</option>
              <option value="chef">Şef</option>
              <option value="cashier">Kasiyer</option>
            </select>
          </div>
          <div class="form-group">
            <label>Telefon</label>
            <input type="tel" v-model="newStaff.phone" />
          </div>
          <div class="form-group">
            <label>E-posta</label>
            <input type="email" v-model="newStaff.email" />
          </div>
          <div class="form-group">
            <label>PIN (6 haneli)</label>
            <input type="text" v-model="newStaff.pin" maxlength="6" pattern="\d{6}" />
          </div>
          <div class="form-actions">
            <button type="submit" class="save-btn">Kaydet</button>
            <button type="button" @click="showAddStaffModal = false" class="cancel-btn">İptal</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { supabase } from '../../../services/supabase'

const staffList = ref([])
const filteredStaff = ref([])
const searchQuery = ref('')
const filterRole = ref('')
const showAddStaffModal = ref(false)
const restaurantId = localStorage.getItem('restaurantId')

const newStaff = reactive({
  name: '',
  role: '',
  phone: '',
  email: '',
  pin: '',
  restaurant_id: restaurantId
})

onMounted(async () => {
  await fetchStaff()
})

async function fetchStaff() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
    
    if (error) throw error
    
    staffList.value = data
    filteredStaff.value = data
  } catch (error) {
    console.error('Error fetching staff:', error)
  }
}

function filterStaff() {
  filteredStaff.value = staffList.value.filter(staff => {
    const nameMatch = staff.name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const roleMatch = filterRole.value ? staff.role === filterRole.value : true
    return nameMatch && roleMatch
  })
}

async function addStaff() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .insert([{
        name: newStaff.name,
        role: newStaff.role,
        phone: newStaff.phone,
        email: newStaff.email,
        pin: newStaff.pin,
        restaurant_id: restaurantId,
        is_active: true
      }])
    
    if (error) throw error
    
    await fetchStaff()
    showAddStaffModal.value = false
    resetForm()
  } catch (error) {
    console.error('Error adding staff:', error)
  }
}

async function editStaff(staff) {
  // This would typically open a modal with the staff details for editing
  console.log('Edit staff:', staff)
  // Implementation will be added in a future update
}

async function toggleStaffStatus(staff) {
  try {
    const { error } = await supabase
      .from('staff')
      .update({ is_active: !staff.is_active })
      .eq('id', staff.id)
    
    if (error) throw error
    
    await fetchStaff()
  } catch (error) {
    console.error('Error toggling staff status:', error)
  }
}

function resetForm() {
  newStaff.name = ''
  newStaff.role = ''
  newStaff.phone = ''
  newStaff.email = ''
  newStaff.pin = ''
}
</script>

<style scoped>
.staff-list-container {
  width: 100%;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.add-btn {
  background-color: #42b983;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.search-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.search-filter input, .search-filter select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.search-filter input {
  flex: 1;
}

.staff-table {
  width: 100%;
  border-collapse: collapse;
}

.staff-table th, .staff-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.staff-table th {
  background-color: #f8f8f8;
  font-weight: 600;
}

.actions {
  display: flex;
  gap: 8px;
}

.edit-btn, .toggle-btn {
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background-color: #2c3e50;
  color: white;
}

.toggle-btn {
  background-color: #f0ad4e;
  color: white;
}

.status {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
}

.status.active {
  background-color: #dff0d8;
  color: #3c763d;
}

.status.inactive {
  background-color: #f2dede;
  color: #a94442;
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
  width: 500px;
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

.form-group input, .form-group select {
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