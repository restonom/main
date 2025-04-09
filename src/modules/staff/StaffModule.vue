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
      <!-- Personel Listesi -->
      <div v-if="activeTab === 'list'" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">Personel Listesi</h3>
          <button 
            @click="activeTab = 'add'"
            class="bg-primary text-white text-sm px-3 py-1 rounded-md hover:bg-primary-dark flex items-center"
          >
            <i class="fas fa-user-plus mr-1"></i> Yeni Personel
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Soyad</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PIN</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="loading"> <td colspan="5" class="text-center p-4">Yükleniyor...</td> </tr>
              <tr v-else-if="error"> <td colspan="5" class="text-center p-4 text-red-500">Hata: {{ error }}</td> </tr>
              <tr v-else v-for="staff in staffList" :key="staff.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ staff.name }}</div>
                  <div class="text-sm text-gray-500">{{ staff.email }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap capitalize">
                  <div class="flex flex-col space-y-2">
                    <span :class="{
                      'bg-indigo-100 text-indigo-800': staff.role === 'admin',
                      'bg-blue-100 text-blue-800': staff.role === 'manager',
                      'bg-green-100 text-green-800': staff.role === 'cashier',
                      'bg-yellow-100 text-yellow-800': staff.role === 'waiter',
                      'bg-orange-100 text-orange-800': staff.role === 'chef',
                      'bg-red-100 text-red-800': staff.role === 'cook',
                      'bg-purple-100 text-purple-800': staff.role === 'host'
                    }" class="px-2 py-1 text-xs font-medium rounded-full w-fit">
                      {{ getRoleName(staff.role) }}
                    </span>
                    
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="moduleId in staff.permissions?.modules?.slice(0, 3) || []" 
                        :key="moduleId" 
                        class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                      >
                        <span v-if="staff.permissions?.writePermissions?.[moduleId]">
                          <IconifyIcon icon="mdi:pencil" class="text-gray-600" width="10" />
                        </span>
                        <span v-else>
                          <IconifyIcon icon="mdi:eye" class="text-gray-600" width="10" />
                        </span>
                        {{ getModuleShortName(moduleId) }}
                      </span>
                      <span 
                        v-if="(staff.permissions?.modules?.length || 0) > 3" 
                        class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800"
                      >
                        +{{ (staff.permissions?.modules?.length || 0) - 3 }}
                      </span>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="text-sm">****</span> 
                  <!-- <button class="text-xs text-gray-500 hover:text-primary">(Göster)</button> -->
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    class="px-2 py-1 text-xs font-medium rounded-full"
                    :class="staff.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'"
                  >
                    {{ staff.active ? 'Aktif' : 'Pasif' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button @click="editStaff(staff)" class="text-gray-500 hover:text-gray-700 flex items-center">
                    <i class="fas fa-edit mr-1"></i> Düzenle
                  </button>
                  <button @click="deleteStaff(staff.id)" class="text-red-500 hover:text-red-700 flex items-center">
                    <i class="fas fa-trash-alt mr-1"></i> Sil
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Vardiya Planlama -->
      <div v-if="activeTab === 'schedule'" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">Vardiya Planlama</h3>
          <button 
            @click="showShiftDetailsModal(null)"
            class="bg-primary text-white text-sm px-3 py-1 rounded-md hover:bg-primary-dark"
          >
            + Yeni Vardiya
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Başlangıç</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bitiş</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="shift in shifts" :key="shift.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ shift.staff?.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ new Date(shift.date).toLocaleDateString() }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ shift.start_time }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ shift.end_time }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button @click="showShiftDetailsModal(shift)" class="text-gray-500 hover:text-gray-700">Düzenle</button>
                  <button v-if="shift.id" @click="deleteShift(shift.id)" class="text-red-500 hover:text-red-700">Sil</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Performans Takibi -->
      <div v-if="activeTab === 'performance'" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <div class="flex justify-between items-center mb-4">
          <h3 class="font-medium">Performans Takibi</h3>
          <button 
            @click="showPerformanceModalFn()"
            class="bg-primary text-white text-sm px-3 py-1 rounded-md hover:bg-primary-dark"
          >
            + Yeni Performans Kaydı
          </button>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Personel</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notlar</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="perf in performanceData" :key="perf.id">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="font-medium text-gray-900">{{ perf.staff?.name }}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">{{ new Date(perf.date).toLocaleDateString() }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ perf.score }}/10</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ perf.notes }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                  <button @click="showPerformanceModalFn(perf)" class="text-gray-500 hover:text-gray-700">Düzenle</button>
                  <button v-if="perf.id" @click="deletePerformance(perf.id)" class="text-red-500 hover:text-red-700">Sil</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Yeni Personel Ekle / Düzenle Formu -->
      <div v-if="activeTab === 'add' || activeTab === 'edit'" class="h-full overflow-y-auto p-4 bg-white rounded-lg shadow-md">
        <h3 class="font-medium mb-4">{{ isEditing ? 'Personel Düzenle' : 'Yeni Personel Ekle' }}</h3>
        
        <form @submit.prevent="saveStaff" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Ad Soyad</label>
            <input v-model="staffForm.name" type="text" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">E-posta (Opsiyonel)</label>
            <input v-model="staffForm.email" type="email" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Rol</label>
            <select v-model="staffForm.role" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option value="waiter">Garson</option>
                <option value="chef">Aşçı</option>
                <option value="cashier">Kasiyer</option>
                <option value="manager">Yönetici</option>
                <option value="admin">Admin</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">PIN (6 Hane)</label>
            <input v-model="staffForm.pin" type="text" pattern="[0-9]{6}" maxlength="6" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">İzinler (Modüller)</label>
            <div class="mt-2 space-y-2 border p-4 rounded-md bg-gray-50">
              <div v-for="mod in availableModulesForPermissions" :key="mod.id" class="mb-3">
                <div class="flex items-center">
                  <input 
                    type="checkbox" 
                    :id="`module-${mod.id}`" 
                    :value="mod.id" 
                    v-model="modulesList" 
                    class="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50" 
                  />
                  <label :for="`module-${mod.id}`" class="ml-2 font-medium">{{ mod.name }}</label>
                </div>
                <div class="pl-6 mt-1" v-if="modulesList.includes(mod.id)">
                  <!-- READ/WRITE izinleri -->
                  <div class="flex items-center space-x-4 text-sm text-gray-700">
                    <label class="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        :checked="true"
                        disabled 
                        class="rounded border-gray-300 text-gray-400 shadow-sm cursor-not-allowed" 
                      />
                      <span class="ml-2 flex items-center">
                        <IconifyIcon icon="mdi:eye" class="mr-1" /> Görüntüleme
                      </span>
                    </label>
                    <label class="inline-flex items-center">
                      <input 
                        type="checkbox" 
                        :checked="getModuleWritePermission(mod.id)"
                        @change="updateModuleWritePermission(mod.id, $event)"
                        class="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50" 
                      />
                      <span class="ml-2 flex items-center">
                        <IconifyIcon icon="mdi:pencil" class="mr-1" /> Düzenleme
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-500 mt-2">
              <i class="fas fa-info-circle text-xs align-middle"></i>
              Modüle erişim yetkisi verilen personel görüntüleme yapabilir. İşlem yapma yetkisi için ayrıca "Düzenleme" izni gereklidir.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700">Durum</label>
             <select v-model="staffForm.active" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option :value="true">Aktif</option>
                <option :value="false">Pasif</option>
            </select>
          </div>

          <div class="flex justify-end space-x-2">
            <button type="button" @click="cancelEdit" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">İptal</button>
            <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              {{ isEditing ? 'Güncelle' : 'Kaydet' }}
            </button>
          </div>
           <div v-if="formError" class="text-red-500 text-sm mt-2">{{ formError }}</div>
        </form>
      </div>
    </div>

    <!-- Personel Detay Modalı -->
    <div v-if="showStaffDetails" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-[101]">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Personel Detayları</h3>
          <div v-if="selectedStaff" class="space-y-2">
            <p><span class="font-medium">Ad Soyad:</span> {{ selectedStaff.name }}</p>
            <p><span class="font-medium">E-posta:</span> {{ selectedStaff.email || '-' }}</p>
            <p><span class="font-medium">Rol:</span> {{ getRoleName(selectedStaff.role) }}</p>
            <p><span class="font-medium">Durum:</span> {{ selectedStaff.active ? 'Aktif' : 'Pasif' }}</p>
            
            <div class="border-t pt-2 mt-2">
              <p class="font-medium mb-1">Modül İzinleri:</p>
              <ul class="pl-2 space-y-2">
                <li v-for="moduleId in selectedStaff.permissions?.modules || []" :key="moduleId" class="flex items-center">
                  <span v-if="selectedStaff.permissions?.writePermissions?.[moduleId]">
                    <IconifyIcon icon="mdi:pencil" class="text-gray-600 mr-1" />
                  </span>
                  <span v-else>
                    <IconifyIcon icon="mdi:eye" class="text-gray-600 mr-1" />
                  </span>
                  {{ getModuleName(moduleId) }}
                  <span class="text-xs text-gray-500 ml-1">
                    {{ selectedStaff.permissions?.writePermissions?.[moduleId] ? '(Düzenleme)' : '(Görüntüleme)' }}
                  </span>
                </li>
                <li v-if="(selectedStaff.permissions?.modules?.length || 0) === 0" class="text-gray-500 text-sm">
                  Modül izni bulunmuyor
                </li>
              </ul>
            </div>
          </div>
          <div class="mt-4">
            <button @click="showStaffDetails = false" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300">
              Kapat
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Vardiya Detay Modalı -->
    <div v-if="showShiftDetails" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-[101]">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            {{ selectedShift?.id ? 'Vardiya Düzenle' : 'Yeni Vardiya' }}
          </h3>
          <form @submit.prevent="saveShift(selectedShift)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Personel</label>
              <select v-model="selectedShift.staff_id" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option :value="undefined" disabled>Personel Seçin</option>
                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                  {{ staff.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tarih Aralığı</label>
              <div class="mt-1 flex space-x-2">
                <input 
                  v-model="selectedShift.start_date" 
                  type="date" 
                  required 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                />
                <input 
                  v-model="selectedShift.end_date" 
                  type="date" 
                  required 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                />
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Vardiya Saatleri</label>
              <div class="mt-1 flex space-x-2">
                <input 
                  v-model="selectedShift.start_time" 
                  type="time" 
                  required 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                />
                <input 
                  v-model="selectedShift.end_time" 
                  type="time" 
                  required 
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" 
                />
              </div>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" @click="showShiftDetails = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                İptal
              </button>
              <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                {{ selectedShift?.id ? 'Güncelle' : 'Kaydet' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Performans Detay Modalı -->
    <div v-if="showPerformanceModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-[100]">
      <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white z-[101]">
        <div class="mt-3">
          <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
            {{ performanceForm.id ? 'Performans Düzenle' : 'Yeni Performans Kaydı' }}
          </h3>
          <form @submit.prevent="savePerformance(performanceForm)" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Personel</label>
              <select v-model="performanceForm.staff_id" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary">
                <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
                  {{ staff.name }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Tarih</label>
              <input v-model="performanceForm.date" type="date" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Puan (1-10)</label>
              <input v-model="performanceForm.score" type="number" min="1" max="10" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary" />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Notlar</label>
              <textarea v-model="performanceForm.notes" rows="3" class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"></textarea>
            </div>
            <div class="flex justify-end space-x-2">
              <button type="button" @click="showPerformanceModal = false" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                İptal
              </button>
              <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                {{ performanceForm.id ? 'Güncelle' : 'Kaydet' }}
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
import supabase from '../../services/supabase'
import { Icon } from '@iconify/vue'

// Icon bileşenini düzelt
const IconifyIcon = Icon

interface StaffPermissions {
  modules: string[];
  writePermissions?: { [key: string]: boolean };
}

interface Staff {
  id?: number;
  name: string;
  email: string | null;
  role: string;
  pin: string;
  active: boolean;
  restaurant_id?: number;
  permissions: StaffPermissions;
}

interface Shift {
  id?: number;
  staff_id: number;
  date: string;
  start_date?: string;
  end_date?: string;
  start_time: string;
  end_time: string;
  restaurant_id?: number;
  staff?: { name: string };
}

interface Performance {
  id?: number;
  staff_id: number;
  restaurant_id?: number;
  date: string;
  score: number;
  notes?: string;
  staff?: { name: string };
}

// State
const activeTab = ref('list')
const tabs = [
  { id: 'list', name: 'Personel Listesi' },
  { id: 'schedule', name: 'Vardiya Planlama' },
  { id: 'performance', name: 'Performans Takibi' },
  { id: 'add', name: 'Yeni Personel Ekle' }
]

const staffList = ref<Staff[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const formError = ref<string | null>(null)

const restaurantId = localStorage.getItem('restaurantId')

const isEditing = ref(false)
const staffForm = ref<Partial<Staff>>({
    name: '',
    email: '',
    role: 'waiter',
    pin: '',
    permissions: { modules: ['pos'] },
    active: true
})

// İzinler için kullanılabilir modüller (Admin hariç)
const availableModulesForPermissions = [
  { id: 'pos', name: 'Satış Ekranı (POS)' },
  { id: 'kitchen', name: 'Mutfak' },
  { id: 'tables', name: 'Masalar' },
  { id: 'reservations', name: 'Rezervasyonlar' },
  { id: 'staff', name: 'Personel Yönetimi' },
  { id: 'admin', name: 'Sistem Ayarları' }
];

// Vardiya ve performans verileri
const shifts = ref<Shift[]>([])
const performanceData = ref<Performance[]>([])
const selectedStaff = ref<Staff | null>(null)
const selectedShift = ref<Partial<Shift>>({})
const showStaffDetails = ref(false)
const showShiftDetails = ref(false)

// Performans Modalı için state
const showPerformanceModal = ref(false)
const performanceForm = ref<Partial<Performance>>({})

// Personel listesini yükle
const loadStaff = async () => {
  if (!restaurantId) {
    error.value = 'Restoran ID bulunamadı.'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = null
    const { data, error: fetchError } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .order('name', { ascending: true })

    if (fetchError) throw fetchError
    staffList.value = data || []
  } catch (err: any) {
    console.error('Personel verileri alınırken hata:', err)
    error.value = err.message || 'Personel listesi yüklenemedi.'
  } finally {
    loading.value = false
  }
}

// Vardiya listesini yükle
const loadShifts = async () => {
  if (!restaurantId) return

  try {
    const { data, error: fetchError } = await supabase
      .from('staff_schedules')
      .select('*, staff(*)')
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .order('date', { ascending: true })

    if (fetchError) throw fetchError
    shifts.value = data || []
  } catch (err: any) {
    console.error('Vardiya verileri alınırken hata:', err)
    error.value = err.message || 'Vardiya listesi yüklenemedi.'
  }
}

// Performans verilerini yükle
const loadPerformance = async () => {
  if (!restaurantId) return

  try {
    const { data, error: fetchError } = await supabase
      .from('staff_performance')
      .select('*, staff(*)')
      .eq('restaurant_id', parseInt(restaurantId, 10))
      .order('date', { ascending: false })

    if (fetchError) throw fetchError
    performanceData.value = data || []
  } catch (err: any) {
    console.error('Performans verileri alınırken hata:', err)
    error.value = err.message || 'Performans verileri yüklenemedi.'
  }
}

// Yeni personel ekle veya güncelle
const saveStaff = async () => {
  if (!restaurantId) {
      formError.value = 'Restoran ID bulunamadı.';
      return;
  }
  if (!staffForm.value.name || !staffForm.value.role || !staffForm.value.pin || staffForm.value.pin.length !== 6) {
      formError.value = 'Lütfen tüm zorunlu alanları (Ad, Rol, 6 Haneli PIN) doğru şekilde doldurun.';
      return;
  }

  // Permissions null değilse ama modules undefined ise, boş array atayalım
  if (staffForm.value.permissions && !staffForm.value.permissions.modules) {
    staffForm.value.permissions.modules = [];
  }

  // Permissions tamamen yoksa, default değerlerle oluşturalım
  if (!staffForm.value.permissions) {
    staffForm.value.permissions = {
      modules: ['pos'],
      writePermissions: { 'pos': true }
    };
  }

  formError.value = null;

  try {
    // Temel veri nesnesi oluştur
    const staffDataToSave = {
        name: staffForm.value.name,
        email: staffForm.value.email || null,
        role: staffForm.value.role,
        pin: staffForm.value.pin,
        active: staffForm.value.active,
        permissions: staffForm.value.permissions,
        restaurant_id: parseInt(restaurantId, 10)
    };

    let result;
    if (isEditing.value && staffForm.value.id) {
      // Güncelleme - ID alanını dahil etmiyoruz
      console.log('Personel güncelleniyor:', staffDataToSave);
       const { data, error: updateError } = await supabase
            .from('staff')
            .update(staffDataToSave)
            .eq('id', staffForm.value.id)
            .select();
       if (updateError) throw updateError;
       result = data;
       console.log('Güncelleme sonucu:', result);
    } else {
      // Ekleme
      console.log('Yeni personel ekleniyor:', staffDataToSave);
      const { data, error: insertError } = await supabase
            .from('staff')
            .insert(staffDataToSave)
            .select();
      if (insertError) throw insertError;
      result = data;
      console.log('Ekleme sonucu:', result);
    }

    await loadStaff(); // Listeyi yenile
    resetForm();
    activeTab.value = 'list'; // Liste sekmesine dön

  } catch (err: any) {
    console.error('Personel kaydetme/güncelleme hatası:', err);
    formError.value = err.message || 'İşlem sırasında bir hata oluştu.';
  }
}

// Düzenleme moduna geç
const editStaff = (staff: Staff) => {
  isEditing.value = true;
  
  // Clone and handle potentially missing permissions safely
  const permissions = staff.permissions ? { ...staff.permissions } : { modules: ['pos'] };
  
  // Yazma izinlerini ekle - yoksa başlat
  if (!permissions.writePermissions) {
    permissions.writePermissions = {};
    // Varsayılan olarak tüm modüllere yazma izni ver
    permissions.modules.forEach(moduleId => {
      permissions.writePermissions![moduleId] = true;
    });
  }
  
  staffForm.value = { 
    ...staff,
    permissions: permissions
  };
  
  activeTab.value = 'edit'; 
}

// Formu sıfırla
const resetForm = () => {
  isEditing.value = false;
  staffForm.value = {
    name: '',
    email: '',
    role: 'waiter',
    pin: '',
    permissions: { 
      modules: ['pos'], 
      writePermissions: { 'pos': true } 
    },
    active: true
  };
  formError.value = null;
}

// Düzenlemeyi iptal et
const cancelEdit = () => {
    resetForm();
    activeTab.value = 'list';
}

// Personeli sil
const deleteStaff = async (staffId: number | undefined) => {
  if (!staffId) {
    error.value = 'Geçersiz personel ID';
    return;
  }
  
  if (!confirm('Bu personeli silmek istediğinizden emin misiniz?')) return;

  try {
    const { error: deleteError } = await supabase
      .from('staff')
      .delete()
      .eq('id', staffId)
      
    if (deleteError) throw deleteError;
    
    await loadStaff(); // Listeyi yenile

  } catch (err: any) {
    console.error('Personel silme hatası:', err);
    error.value = err.message || 'Personel silinemedi.'; // Liste görünümünde hata göster
  }
}

// Personel detaylarını göster
const showStaffDetailsModal = (staff: Staff) => {
  selectedStaff.value = staff
  showStaffDetails.value = true
}

// Vardiya detaylarını göster
const showShiftDetailsModal = (shift?: Shift | null) => {
  selectedShift.value = shift?.id ? { ...shift } : {
    staff_id: undefined,
    start_date: '',
    end_date: '',
    start_time: '',
    end_time: ''
  }
  showShiftDetails.value = true
}

// Vardiya ekle/güncelle
const saveShift = async (shiftData: Partial<Shift>) => {
  if (!shiftData || !shiftData.staff_id || !shiftData.start_date || !shiftData.end_date || !shiftData.start_time || !shiftData.end_time) {
      error.value = 'Lütfen personel, tarih aralığı ve saatleri eksiksiz doldurun.';
      formError.value = error.value;
      return;
  }
  
  if (!restaurantId) {
      error.value = 'Restoran ID bulunamadı.';
      formError.value = error.value;
      return;
  }
  
  formError.value = null;

  try {
    const startDate = new Date(shiftData.start_date);
    const endDate = new Date(shiftData.end_date);
    
    if (endDate < startDate) {
      error.value = 'Bitiş tarihi başlangıç tarihinden önce olamaz.';
      formError.value = error.value;
      return;
    }

    // Start hour and end hour calculations from time strings
    const startParts = shiftData.start_time.split(':');
    const endParts = shiftData.end_time.split(':');
    const startHour = parseInt(startParts[0], 10);
    const endHour = parseInt(endParts[0], 10);
    
    const shiftsToInsert = [];
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      shiftsToInsert.push({
        staff_id: shiftData.staff_id,
        date: d.toISOString().split('T')[0],
        start_time: shiftData.start_time,
        end_time: shiftData.end_time,
        start_hour: startHour,
        end_hour: endHour,
        restaurant_id: parseInt(restaurantId, 10)
      });
    }

    if (shiftData.id) {
      const { error: updateError } = await supabase
        .from('staff_schedules')
        .update({
          staff_id: shiftData.staff_id,
          start_time: shiftData.start_time,
          end_time: shiftData.end_time,
          start_hour: startHour,
          end_hour: endHour
        })
        .eq('id', shiftData.id);
        
      if (updateError) {
        console.error('Supabase Update Error (staff_schedules):', updateError);
        if (updateError.message.includes('security policy')) {
          throw new Error('Vardiya güncelleme izniniz yok (RLS). Lütfen restoran yöneticisiyle iletişime geçin.');
        }
        throw updateError;
      }
    } else {
      const { error: insertError } = await supabase
        .from('staff_schedules')
        .insert(shiftsToInsert);
        
      if (insertError) {
        console.error('Supabase Insert Error (staff_schedules):', insertError);
        if (insertError.message.includes('security policy')) {
          throw new Error('Yeni vardiya ekleme izniniz yok veya eksik bilgi (RLS). Lütfen restoran yöneticisiyle iletişime geçin.');
        }
        throw insertError;
      }
    }
    
    await loadShifts();
    showShiftDetails.value = false;
    selectedShift.value = {};
  } catch (err: any) {
    console.error('Vardiya kaydetme hatası:', err);
    error.value = err.message || 'Vardiya kaydedilemedi.';
    formError.value = error.value;
  }
};

// Vardiya sil
const deleteShift = async (shiftId: number) => {
  if (!confirm('Bu vardiyayı silmek istediğinizden emin misiniz?')) return

  try {
    const { error: deleteError } = await supabase
      .from('staff_schedules')
      .delete()
      .eq('id', shiftId)
      
    if (deleteError) throw deleteError
    
    await loadShifts()
  } catch (err: any) {
    console.error('Vardiya silme hatası:', err)
    error.value = err.message || 'Vardiya silinemedi.'
  }
}

// Performans Modalı fonksiyonları
const showPerformanceModalFn = (perf?: Performance | null) => {
  performanceForm.value = perf?.id ? { ...perf } : {
    staff_id: undefined,
    date: new Date().toISOString().split('T')[0],
    score: undefined,
    notes: ''
  };
  showPerformanceModal.value = true;
};

const savePerformance = async (perfData: Partial<Performance>) => {
  if (!perfData || !perfData.staff_id || !perfData.date || perfData.score === undefined || perfData.score === null) {
      error.value = 'Lütfen personel, tarih ve puan alanlarını doldurun.';
      formError.value = error.value;
      return;
  }
  
  if (!restaurantId) {
      error.value = 'Restoran ID bulunamadı.';
      formError.value = error.value;
      return;
  }
  
  formError.value = null;

  try {
      const dataToSave = {
          ...perfData,
          restaurant_id: parseInt(restaurantId, 10),
          score: Number(perfData.score),
          rating: Number(perfData.score),
          notes: perfData.notes || '',
          efficiency_score: 0,
          hours_worked: 0
      };

      if (perfData.id) {
          const { data, error: updateError } = await supabase
              .from('staff_performance')
              .update(dataToSave)
              .eq('id', perfData.id)
              .select();
          if (updateError) {
              console.error('Supabase Update Error (staff_performance):', updateError);
              if (updateError.message.includes('security policy')) {
                  throw new Error('Performans kaydı güncelleme izniniz yok (RLS). Lütfen restoran yöneticisiyle iletişime geçin.');
              }
              throw updateError;
          }
      } else {
          delete dataToSave.id;
          const { data, error: insertError } = await supabase
              .from('staff_performance')
              .insert(dataToSave)
              .select();
           if (insertError) {
             console.error('Supabase Insert Error (staff_performance):', insertError);
             if (insertError.message.includes('security policy')) {
                  throw new Error('Performans kaydı ekleme izniniz yok veya eksik bilgi (RLS). Lütfen restoran yöneticisiyle iletişime geçin.');
             }
             throw insertError;
           }
      }

      await loadPerformance();
      showPerformanceModal.value = false;
      performanceForm.value = {};
  } catch (err: any) {
      console.error('Performans kaydetme hatası:', err);
      error.value = err.message || 'Performans kaydedilemedi.';
      formError.value = error.value;
  }
};

const deletePerformance = async (perfId: number) => {
  if (!confirm('Bu performans kaydını silmek istediğinizden emin misiniz?')) return;

  try {
      const { error: deleteError } = await supabase
          .from('staff_performance')
          .delete()
          .eq('id', perfId);
          
      if (deleteError) {
         console.error('Supabase Delete Error (staff_performance):', deleteError);
         if (deleteError.message.includes('security policy')) {
              throw new Error('Performans kaydı silme izniniz yok (RLS).');
         }
         throw deleteError;
       }
      
      await loadPerformance();
  } catch (err: any) {
      console.error('Performans silme hatası:', err);
      error.value = err.message || 'Performans kaydı silinemedi.';
  }
};

// Modül yazma iznini kontrol et
const getModuleWritePermission = (moduleId: string): boolean => {
  if (!staffForm.value.permissions) {
    return false;
  }
  
  if (!staffForm.value.permissions.writePermissions) {
    staffForm.value.permissions.writePermissions = {};
  }
  
  return staffForm.value.permissions.writePermissions[moduleId] || false;
}

// Modül yazma iznini güncelle
const updateModuleWritePermission = (moduleId: string, event: Event) => {
  if (!staffForm.value.permissions) {
    staffForm.value.permissions = { modules: [], writePermissions: {} };
  }
  
  if (!staffForm.value.permissions.writePermissions) {
    staffForm.value.permissions.writePermissions = {};
  }
  
  const target = event.target as HTMLInputElement;
  staffForm.value.permissions.writePermissions[moduleId] = target.checked;
}

// Helper functions
const getRoleName = (role: string) => {
  switch (role) {
    case 'waiter':
      return 'Garson';
    case 'chef':
      return 'Aşçı';
    case 'cashier':
      return 'Kasiyer';
    case 'manager':
      return 'Yönetici';
    case 'admin':
      return 'Admin';
    default:
      return role;
  }
}

const getModuleName = (moduleId: string) => {
  const module = availableModulesForPermissions.find(m => m.id === moduleId);
  return module ? module.name : moduleId;
}

const getModuleShortName = (moduleId: string) => {
  const shortNames: { [key: string]: string } = {
    'pos': 'POS',
    'kitchen': 'Mutfak',
    'tables': 'Masalar',
    'reservations': 'Rez.',
    'staff': 'Personel',
    'admin': 'Ayarlar'
  };
  
  return shortNames[moduleId] || moduleId;
}

// Script kısmına yeni bir computed property ekleyeceğim
const modulesList = computed({
  get: () => staffForm.value.permissions?.modules || [],
  set: (newValue) => {
    if (!staffForm.value.permissions) {
      staffForm.value.permissions = { modules: [], writePermissions: {} };
    }
    staffForm.value.permissions.modules = newValue;
  }
});

onMounted(() => {
  loadStaff()
  loadShifts()
  loadPerformance()
})

</script>

<style scoped>
.staff-module {
  padding: 20px;
  height: 100%;
}

h1 {
  margin-bottom: 20px;
  color: #333;
}

.tabs {
  display: flex;
  margin-bottom: 20px;
  border-bottom: 1px solid #ddd;
}

.tabs button {
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  color: #666;
}

.tabs button.active {
  color: #2c3e50;
  border-bottom: 2px solid #42b983;
}

.tab-content {
  background-color: white;
  border-radius: 4px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: calc(100% - 120px);
  overflow: auto;
}

/* Modal için ek stiller */
.modal-overlay {
  z-index: 50;
}

.modal-content {
  z-index: 51;
}

/* Optional: Add styling for form errors */
.text-red-500 {
  color: #ef4444; 
}
</style> 