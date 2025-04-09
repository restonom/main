<template>
  <div class="performance-container">
    <div class="header-actions">
      <h2>Personel Performans Takibi</h2>
      <div class="period-filter">
        <label>Dönem:</label>
        <select v-model="selectedPeriod" @change="fetchPerformanceData">
          <option value="week">Bu Hafta</option>
          <option value="month">Bu Ay</option>
          <option value="quarter">Son 3 Ay</option>
        </select>
      </div>
    </div>

    <div class="staff-filter">
      <label>Personel:</label>
      <select v-model="selectedStaffId" @change="updateCharts">
        <option value="all">Tüm Personel</option>
        <option v-for="staff in staffList" :key="staff.id" :value="staff.id">
          {{ staff.name }}
        </option>
      </select>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Satış Performansı</h3>
        <div class="metric-value">{{ formatCurrency(totalSales) }}</div>
        <div class="metric-chart">
          <!-- Placeholder for sales chart -->
          <div class="chart-bars">
            <div 
              v-for="(value, index) in salesData" 
              :key="index" 
              class="chart-bar"
              :style="{ height: `${(value / maxSales) * 100}%` }"
              :title="`${salesLabels[index]}: ${formatCurrency(value)}`"
            ></div>
          </div>
          <div class="chart-labels">
            <div v-for="(label, index) in salesLabels" :key="index" class="chart-label">
              {{ label }}
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <h3>Sipariş Sayısı</h3>
        <div class="metric-value">{{ totalOrders }}</div>
        <div class="metric-chart">
          <!-- Placeholder for orders chart -->
          <div class="chart-bars">
            <div 
              v-for="(value, index) in ordersData" 
              :key="index" 
              class="chart-bar"
              :style="{ height: `${(value / maxOrders) * 100}%` }"
              :title="`${ordersLabels[index]}: ${value}`"
            ></div>
          </div>
          <div class="chart-labels">
            <div v-for="(label, index) in ordersLabels" :key="index" class="chart-label">
              {{ label }}
            </div>
          </div>
        </div>
      </div>

      <div class="metric-card">
        <h3>Çalışma Saatleri</h3>
        <div class="metric-value">{{ totalHours }} saat</div>
        <div class="metric-chart">
          <!-- Placeholder for hours chart -->
          <div class="chart-pie-container">
            <div class="chart-pie" :style="{ background: pieChartBackground }"></div>
            <div class="chart-pie-label">{{ (workHourPercentage).toFixed(0) }}%</div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <div class="legend-color" style="background-color: #42b983;"></div>
              <div class="legend-text">Çalışılan</div>
            </div>
            <div class="legend-item">
              <div class="legend-color" style="background-color: #e0e0e0;"></div>
              <div class="legend-text">Hedef</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="performance-table-container">
      <h3>Detaylı Performans Raporu</h3>
      <table class="performance-table">
        <thead>
          <tr>
            <th>Personel</th>
            <th>Satış Toplamı</th>
            <th>Sipariş Sayısı</th>
            <th>Çalışma Saati</th>
            <th>Verimlilik</th>
            <th>Değerlendirme</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="staff in performanceData" :key="staff.id">
            <td>{{ staff.name }}</td>
            <td>{{ formatCurrency(staff.totalSales) }}</td>
            <td>{{ staff.totalOrders }}</td>
            <td>{{ staff.totalHours }} saat</td>
            <td>
              <div class="progress-bar">
                <div 
                  class="progress" 
                  :style="{ width: `${staff.efficiency}%`, backgroundColor: getEfficiencyColor(staff.efficiency) }"
                ></div>
              </div>
              <span>{{ staff.efficiency.toFixed(0) }}%</span>
            </td>
            <td>
              <div class="rating">
                <span v-for="i in 5" :key="i" class="star" :class="{ active: i <= staff.rating }">★</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../../services/supabase'

const restaurantId = localStorage.getItem('restaurantId')
const staffList = ref([])
const selectedPeriod = ref('month')
const selectedStaffId = ref('all')
const performanceData = ref([])

// Chart data
const salesData = ref([120000, 180000, 150000, 200000, 160000, 220000])
const salesLabels = ref(['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'])
const ordersData = ref([35, 42, 38, 50, 45, 58])
const ordersLabels = ref(['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'])
const workHours = ref(160)
const targetHours = ref(200)

// Computed properties
const maxSales = computed(() => Math.max(...salesData.value, 1))
const maxOrders = computed(() => Math.max(...ordersData.value, 1))
const totalSales = computed(() => {
  if (selectedStaffId.value === 'all') {
    return performanceData.value.reduce((sum, staff) => sum + staff.totalSales, 0)
  } else {
    const staff = performanceData.value.find(s => s.id === selectedStaffId.value)
    return staff ? staff.totalSales : 0
  }
})

const totalOrders = computed(() => {
  if (selectedStaffId.value === 'all') {
    return performanceData.value.reduce((sum, staff) => sum + staff.totalOrders, 0)
  } else {
    const staff = performanceData.value.find(s => s.id === selectedStaffId.value)
    return staff ? staff.totalOrders : 0
  }
})

const totalHours = computed(() => {
  if (selectedStaffId.value === 'all') {
    return performanceData.value.reduce((sum, staff) => sum + staff.totalHours, 0)
  } else {
    const staff = performanceData.value.find(s => s.id === selectedStaffId.value)
    return staff ? staff.totalHours : 0
  }
})

const workHourPercentage = computed(() => {
  return (workHours.value / targetHours.value) * 100
})

const pieChartBackground = computed(() => {
  const percentage = Math.min(workHourPercentage.value, 100)
  return `conic-gradient(#42b983 0% ${percentage}%, #e0e0e0 ${percentage}% 100%)`
})

// Lifecycle hooks
onMounted(async () => {
  await Promise.all([fetchStaff(), fetchPerformanceData()])
})

// Methods
async function fetchStaff() {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name, role')
      .eq('restaurant_id', restaurantId)
      .eq('is_active', true)
    
    if (error) throw error
    
    staffList.value = data
  } catch (error) {
    console.error('Error fetching staff:', error)
  }
}

async function fetchPerformanceData() {
  try {
    // In a real application, this would fetch data from the staff_performance table
    // For now, we'll use mock data
    generateMockPerformanceData()
    updateCharts()
  } catch (error) {
    console.error('Error fetching performance data:', error)
  }
}

function generateMockPerformanceData() {
  performanceData.value = staffList.value.map(staff => {
    // Generate random performance data for demonstration
    const totalSales = Math.floor(Math.random() * 500000) + 50000
    const totalOrders = Math.floor(Math.random() * 100) + 20
    const totalHours = Math.floor(Math.random() * 100) + 80
    const efficiency = Math.floor(Math.random() * 40) + 60
    const rating = Math.floor(Math.random() * 3) + 3
    
    return {
      id: staff.id,
      name: staff.name,
      role: staff.role,
      totalSales,
      totalOrders,
      totalHours,
      efficiency,
      rating
    }
  })
}

function updateCharts() {
  if (selectedStaffId.value === 'all') {
    // Show aggregate data for all staff
    salesData.value = [120000, 180000, 150000, 200000, 160000, 220000]
    ordersData.value = [35, 42, 38, 50, 45, 58]
    workHours.value = 160
  } else {
    // Show data for the selected staff member
    const staffIndex = performanceData.value.findIndex(s => s.id === selectedStaffId.value)
    if (staffIndex >= 0) {
      // Generate personalized chart data based on the staff's performance metrics
      const staff = performanceData.value[staffIndex]
      const salesBase = staff.totalSales / 7
      salesData.value = Array.from({ length: 6 }, () => Math.floor(salesBase * (0.8 + Math.random() * 0.4)))
      
      const ordersBase = staff.totalOrders / 7
      ordersData.value = Array.from({ length: 6 }, () => Math.floor(ordersBase * (0.8 + Math.random() * 0.4)))
      
      workHours.value = staff.totalHours
    }
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value)
}

function getEfficiencyColor(efficiency) {
  if (efficiency >= 80) return '#42b983'
  if (efficiency >= 60) return '#f0ad4e'
  return '#d9534f'
}
</script>

<style scoped>
.performance-container {
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

.period-filter, .staff-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.period-filter select, .staff-filter select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 30px;
}

.metric-card {
  background-color: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metric-card h3 {
  margin-top: 0;
  color: #333;
  font-size: 16px;
}

.metric-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
  margin: 10px 0;
}

.metric-chart {
  height: 200px;
  margin-top: 15px;
}

.chart-bars {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  height: 160px;
}

.chart-bar {
  width: 30px;
  background-color: #42b983;
  border-radius: 4px 4px 0 0;
  min-height: 4px;
}

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
}

.chart-label {
  width: 30px;
  text-align: center;
  font-size: 12px;
  color: #666;
}

.chart-pie-container {
  height: 160px;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.chart-pie {
  width: 140px;
  height: 140px;
  border-radius: 50%;
}

.chart-pie-label {
  position: absolute;
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 15px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-text {
  font-size: 12px;
  color: #666;
}

.performance-table-container {
  margin-top: 20px;
}

.performance-table {
  width: 100%;
  border-collapse: collapse;
}

.performance-table th, .performance-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.performance-table th {
  background-color: #f8f8f8;
  font-weight: 600;
}

.progress-bar {
  width: 100px;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 8px;
  display: inline-block;
  vertical-align: middle;
}

.progress {
  height: 100%;
  border-radius: 4px;
}

.rating {
  display: flex;
}

.star {
  color: #ddd;
  font-size: 18px;
}

.star.active {
  color: #f0ad4e;
}
</style> 