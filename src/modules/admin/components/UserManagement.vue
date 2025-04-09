<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-medium text-gray-900">Kullanıcı Yönetimi</h2>
      <p class="mt-1 text-sm text-gray-500">
        Personel ve kullanıcı hesaplarını buradan yönetebilirsiniz.
      </p>
    </div>

    <!-- Search and Add User -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <input
          v-model="search"
          type="text"
          placeholder="Kullanıcı ara..."
          class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>
      <div class="flex items-end">
        <button
          @click="showUserModal = true"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          <i class="fas fa-user-plus mr-2"></i>
          Kullanıcı Ekle
        </button>
      </div>
    </div>

    <!-- Users Table -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium text-gray-900">Kullanıcı Listesi</h3>
      </div>
      <div class="border-t border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kullanıcı
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Durum
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Son Giriş
              </th>
              <th scope="col" class="relative px-6 py-3">
                <span class="sr-only">İşlemler</span>
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <i class="fas fa-user text-gray-400"></i>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">{{ user.name }}</div>
                    <div class="text-sm text-gray-500">{{ user.email }}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="{
                    'bg-green-100 text-green-800': user.role === 'admin',
                    'bg-blue-100 text-blue-800': user.role === 'manager',
                    'bg-yellow-100 text-yellow-800': user.role === 'staff'
                  }"
                >
                  {{ formatRole(user.role) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  :class="user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                >
                  {{ user.is_active ? 'Aktif' : 'Pasif' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(user.last_login) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  @click="editUser(user)"
                  class="text-primary hover:text-primary-dark mr-4"
                >
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="toggleUserStatus(user)"
                  class="text-gray-500 hover:text-gray-700"
                  :class="user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'"
                >
                  <i :class="user.is_active ? 'fas fa-user-slash' : 'fas fa-user-check'"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="filteredUsers.length === 0"
      class="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300"
    >
      <i class="fas fa-users text-4xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900">Henüz kullanıcı eklenmemiş</h3>
      <p class="mt-1 text-sm text-gray-500">
        Kullanıcı eklemek için "Kullanıcı Ekle" butonuna tıklayın.
      </p>
    </div>

    <!-- User Modal -->
    <div v-if="showUserModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-auto">
        <div class="flex justify-between items-center p-4 border-b">
          <h2 class="text-xl font-bold">{{ selectedUser ? 'Kullanıcıyı Düzenle' : 'Yeni Kullanıcı Ekle' }}</h2>
          <button @click="closeUserModal" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-4">
          <form @submit.prevent="saveUser" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Ad Soyad</label>
              <input
                v-model="userForm.name"
                type="text"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">E-posta</label>
              <input
                v-model="userForm.email"
                type="email"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700">Rol</label>
              <select
                v-model="userForm.role"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              >
                <option value="admin">Yönetici</option>
                <option value="manager">Müdür</option>
                <option value="staff">Personel</option>
              </select>
            </div>
            
            <div v-if="!selectedUser">
              <label class="block text-sm font-medium text-gray-700">Şifre</label>
              <input
                v-model="userForm.password"
                type="password"
                class="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                required
              />
            </div>
            
            <div class="flex items-center">
              <input
                v-model="userForm.is_active"
                type="checkbox"
                class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label class="ml-2 block text-sm text-gray-900">
                Aktif
              </label>
            </div>
            
            <div class="flex justify-end space-x-3">
              <button
                type="button"
                @click="closeUserModal"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import supabase from '../../../services/supabase'

const props = defineProps({
  restaurantId: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update'])

// State
const users = ref<any[]>([])
const search = ref('')
const showUserModal = ref(false)
const selectedUser = ref<any>(null)
const isSaving = ref(false)

const userForm = ref({
  name: '',
  email: '',
  role: 'staff',
  password: '',
  is_active: true
})

// Computed
const filteredUsers = computed(() => {
  if (!search.value) return users.value
  
  const searchLower = search.value.toLowerCase()
  return users.value.filter(user =>
    user.name.toLowerCase().includes(searchLower) ||
    user.email.toLowerCase().includes(searchLower) ||
    formatRole(user.role).toLowerCase().includes(searchLower)
  )
})

// Methods
const formatRole = (role: string) => {
  const roles: { [key: string]: string } = {
    admin: 'Yönetici',
    manager: 'Müdür',
    staff: 'Personel'
  }
  return roles[role] || role
}

const formatDate = (date: string) => {
  if (!date) return 'Hiç giriş yapmadı'
  return new Date(date).toLocaleDateString('tr-TR')
}

const loadUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .order('name')
    
    if (error) throw error
    
    users.value = data || []
  } catch (err) {
    console.error('Kullanıcılar yüklenirken hata:', err)
  }
}

const editUser = (user: any) => {
  selectedUser.value = user
  userForm.value = {
    name: user.name,
    email: user.email,
    role: user.role,
    password: '',
    is_active: user.is_active
  }
  showUserModal.value = true
}

const closeUserModal = () => {
  showUserModal.value = false
  selectedUser.value = null
  userForm.value = {
    name: '',
    email: '',
    role: 'staff',
    password: '',
    is_active: true
  }
}

const saveUser = async () => {
  try {
    isSaving.value = true
    
    if (selectedUser.value) {
      // Update user
      const { error } = await supabase
        .from('users')
        .update({
          name: userForm.value.name,
          email: userForm.value.email,
          role: userForm.value.role,
          is_active: userForm.value.is_active
        })
        .eq('id', selectedUser.value.id)
      
      if (error) throw error
    } else {
      // Create new user
      const { error } = await supabase
        .from('users')
        .insert([{
          name: userForm.value.name,
          email: userForm.value.email,
          role: userForm.value.role,
          password: userForm.value.password,
          is_active: userForm.value.is_active,
          restaurant_id: props.restaurantId
        }])
      
      if (error) throw error
    }
    
    await loadUsers()
    emit('update')
    closeUserModal()
  } catch (err) {
    console.error('Kullanıcı kaydedilirken hata:', err)
    alert('Kullanıcı kaydedilirken bir hata oluştu')
  } finally {
    isSaving.value = false
  }
}

const toggleUserStatus = async (user: any) => {
  if (!confirm(`${user.name} kullanıcısının durumunu değiştirmek istediğinize emin misiniz?`)) return
  
  try {
    const { error } = await supabase
      .from('users')
      .update({ is_active: !user.is_active })
      .eq('id', user.id)
    
    if (error) throw error
    
    await loadUsers()
    emit('update')
  } catch (err) {
    console.error('Kullanıcı durumu güncellenirken hata:', err)
    alert('Kullanıcı durumu güncellenirken bir hata oluştu')
  }
}

// Lifecycle hooks
onMounted(() => {
  loadUsers()
})
</script> 