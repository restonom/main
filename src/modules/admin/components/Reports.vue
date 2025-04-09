<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h2 class="text-lg font-medium text-gray-900">Raporlar</h2>
      <p class="mt-1 text-sm text-gray-500">
        Restoranınızın performans metriklerini ve raporlarını buradan görüntüleyebilirsiniz.
      </p>
    </div>

    <!-- Date Range Selector -->
    <div class="flex flex-col sm:flex-row gap-4">
      <div class="flex-1">
        <label class="block text-sm font-medium text-gray-700">Tarih Aralığı</label>
        <div class="mt-1 flex space-x-2">
          <input
            v-model="dateRange.start"
            type="date"
            class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
          <input
            v-model="dateRange.end"
            type="date"
            class="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      </div>
      <div class="flex items-end">
        <button
          @click="loadReports"
          :disabled="isLoading"
          class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
        >
          <i v-if="isLoading" class="fas fa-spinner fa-spin mr-2"></i>
          {{ isLoading ? 'Yükleniyor...' : 'Raporla' }}
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Revenue -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-money-bill-wave text-2xl text-green-600"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Toplam Gelir</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ formatPrice(reports.totalRevenue) }} ₺</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold" :class="reports.revenueChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    <i :class="reports.revenueChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                    <span class="sr-only">{{ reports.revenueChange >= 0 ? 'Artış' : 'Azalış' }}</span>
                    {{ Math.abs(reports.revenueChange) }}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Orders -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-shopping-cart text-2xl text-blue-600"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Toplam Sipariş</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ reports.totalOrders }}</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold" :class="reports.ordersChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    <i :class="reports.ordersChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                    <span class="sr-only">{{ reports.ordersChange >= 0 ? 'Artış' : 'Azalış' }}</span>
                    {{ Math.abs(reports.ordersChange) }}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Average Order Value -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-chart-line text-2xl text-purple-600"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Ortalama Sipariş Değeri</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ formatPrice(reports.averageOrderValue) }} ₺</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold" :class="reports.aovChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    <i :class="reports.aovChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                    <span class="sr-only">{{ reports.aovChange >= 0 ? 'Artış' : 'Azalış' }}</span>
                    {{ Math.abs(reports.aovChange) }}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Total Customers -->
      <div class="bg-white overflow-hidden shadow rounded-lg">
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-users text-2xl text-yellow-600"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Toplam Müşteri</dt>
                <dd class="flex items-baseline">
                  <div class="text-2xl font-semibold text-gray-900">{{ reports.totalCustomers }}</div>
                  <div class="ml-2 flex items-baseline text-sm font-semibold" :class="reports.customersChange >= 0 ? 'text-green-600' : 'text-red-600'">
                    <i :class="reports.customersChange >= 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down'"></i>
                    <span class="sr-only">{{ reports.customersChange >= 0 ? 'Artış' : 'Azalış' }}</span>
                    {{ Math.abs(reports.customersChange) }}%
                  </div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts -->
    <div class="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <!-- Revenue Chart -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Gelir Grafiği</h3>
        <div class="h-80 flex items-center justify-center">
          <div v-if="isLoading" class="text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
            <p class="mt-2 text-sm text-gray-500">Grafik yükleniyor...</p>
          </div>
          <div v-else-if="!reports.revenueData.length" class="text-center text-gray-500">
            <i class="fas fa-chart-line text-4xl mb-2"></i>
            <p>Veri bulunamadı</p>
          </div>
          <div v-else class="w-full h-full">
            <!-- Chart component will be added here -->
            <div class="h-full bg-gray-50 rounded flex items-center justify-center">
              <p class="text-gray-500">Grafik bileşeni eklenecek</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Top Products Chart -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">En Çok Satan Ürünler</h3>
        <div class="h-80 flex items-center justify-center">
          <div v-if="isLoading" class="text-center">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
            <p class="mt-2 text-sm text-gray-500">Grafik yükleniyor...</p>
          </div>
          <div v-else-if="!reports.topProducts.length" class="text-center text-gray-500">
            <i class="fas fa-chart-pie text-4xl mb-2"></i>
            <p>Veri bulunamadı</p>
          </div>
          <div v-else class="w-full h-full">
            <!-- Chart component will be added here -->
            <div class="h-full bg-gray-50 rounded flex items-center justify-center">
              <p class="text-gray-500">Grafik bileşeni eklenecek</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Reports Table -->
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6">
        <h3 class="text-lg font-medium text-gray-900">Detaylı Raporlar</h3>
      </div>
      <div class="border-t border-gray-200">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tarih
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sipariş Sayısı
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Toplam Gelir
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Müşteri Sayısı
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ortalama Sepet
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="report in reports.detailedReports" :key="report.date">
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatDate(report.date) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ report.orderCount }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatPrice(report.revenue) }} ₺
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ report.customerCount }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ formatPrice(report.averageOrderValue) }} ₺
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import supabase from '../../../services/supabase'

const props = defineProps({
  restaurantId: {
    type: Number,
    required: true
  }
})

// State
const dateRange = ref({
  start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

const isLoading = ref(false)

const reports = ref({
  totalRevenue: 0,
  revenueChange: 0,
  totalOrders: 0,
  ordersChange: 0,
  averageOrderValue: 0,
  aovChange: 0,
  totalCustomers: 0,
  customersChange: 0,
  revenueData: [],
  topProducts: [],
  detailedReports: []
})

// Methods
const formatPrice = (price: number) => {
  return price.toFixed(2)
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('tr-TR')
}

const loadReports = async () => {
  try {
    isLoading.value = true
    
    // Bugünün tarihini al
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    // Son 30 günlük varsayılan aralık ayarla (eğer kullanıcı seçmezse)
    if (!dateRange.value.start || !dateRange.value.end) {
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      dateRange.value.start = thirtyDaysAgo.toISOString().split('T')[0]
      dateRange.value.end = today.toISOString().split('T')[0]
    }
    
    // Siparişleri veritabanından çek
    const { data: currentPeriodOrders, error: currentError } = await supabase
      .from('orders')
      .select('*, order_items(*, menu_item(*))')
      .eq('restaurant_id', props.restaurantId)
      .gte('created_at', dateRange.value.start)
      .lte('created_at', dateRange.value.end)
      .order('created_at', { ascending: false })
    
    if (currentError) throw currentError
    
    // Önceki dönem için siparişleri çek (karşılaştırma için)
    const daysDiff = Math.ceil((new Date(dateRange.value.end) - new Date(dateRange.value.start)) / (1000 * 60 * 60 * 24))
    const previousStart = new Date(dateRange.value.start)
    previousStart.setDate(previousStart.getDate() - daysDiff)
    const previousEnd = new Date(dateRange.value.start)
    previousEnd.setDate(previousEnd.getDate() - 1)
    
    const { data: previousPeriodOrders, error: previousError } = await supabase
      .from('orders')
      .select('*')
      .eq('restaurant_id', props.restaurantId)
      .gte('created_at', previousStart.toISOString().split('T')[0])
      .lte('created_at', previousEnd.toISOString().split('T')[0])
    
    if (previousError) throw previousError
    
    // Veri işleme
    const currentOrders = currentPeriodOrders || []
    const previousOrders = previousPeriodOrders || []
    
    // Toplam gelir hesapla
    const currentRevenue = currentOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const previousRevenue = previousOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0)
    const revenueChange = previousRevenue === 0 ? 100 : ((currentRevenue - previousRevenue) / previousRevenue) * 100
    
    // Sipariş sayısı hesapla
    const currentOrderCount = currentOrders.length
    const previousOrderCount = previousOrders.length
    const ordersChange = previousOrderCount === 0 ? 100 : ((currentOrderCount - previousOrderCount) / previousOrderCount) * 100
    
    // Ortalama sipariş değeri hesapla
    const currentAOV = currentOrderCount === 0 ? 0 : currentRevenue / currentOrderCount
    const previousAOV = previousOrderCount === 0 ? 0 : previousRevenue / previousOrderCount
    const aovChange = previousAOV === 0 ? 0 : ((currentAOV - previousAOV) / previousAOV) * 100
    
    // Benzersiz müşteri sayısı
    const currentCustomers = new Set(currentOrders.map(order => order.customer_id)).size
    const previousCustomers = new Set(previousOrders.map(order => order.customer_id)).size
    const customersChange = previousCustomers === 0 ? 100 : ((currentCustomers - previousCustomers) / previousCustomers) * 100
    
    // Günlük gelir verileri
    const revenueByDate = new Map()
    currentOrders.forEach(order => {
      const date = order.created_at.split('T')[0]
      const currentTotal = revenueByDate.get(date) || 0
      revenueByDate.set(date, currentTotal + (order.total_amount || 0))
    })
    
    const revenueData = Array.from(revenueByDate.entries()).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // En çok satan ürünler
    const productSales = new Map()
    currentOrders.forEach(order => {
      if (order.order_items && Array.isArray(order.order_items)) {
        order.order_items.forEach(item => {
          if (item.menu_item) {
            const productId = item.menu_item.id
            const productName = item.menu_item.name
            const currentCount = productSales.get(productId)?.count || 0
            const currentRevenue = productSales.get(productId)?.revenue || 0
            
            productSales.set(productId, {
              id: productId,
              name: productName,
              count: currentCount + (item.quantity || 1),
              revenue: currentRevenue + (item.price * item.quantity || 0)
            })
          }
        })
      }
    })
    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Detaylı günlük raporlar
    const detailedReportsByDate = new Map()
    
    currentOrders.forEach(order => {
      const date = order.created_at.split('T')[0]
      
      if (!detailedReportsByDate.has(date)) {
        detailedReportsByDate.set(date, {
          date,
          orderCount: 0,
          revenue: 0,
          customerCount: new Set(),
          averageOrderValue: 0
        })
      }
      
      const report = detailedReportsByDate.get(date)
      report.orderCount += 1
      report.revenue += (order.total_amount || 0)
      if (order.customer_id) {
        report.customerCount.add(order.customer_id)
      }
    })
    
    const detailedReports = Array.from(detailedReportsByDate.values()).map(report => ({
      ...report,
      customerCount: report.customerCount.size,
      averageOrderValue: report.orderCount === 0 ? 0 : report.revenue / report.orderCount
    })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    
    // Rapor verilerini güncelle
    reports.value = {
      totalRevenue: currentRevenue,
      revenueChange: parseFloat(revenueChange.toFixed(1)),
      totalOrders: currentOrderCount,
      ordersChange: parseFloat(ordersChange.toFixed(1)),
      averageOrderValue: currentAOV,
      aovChange: parseFloat(aovChange.toFixed(1)),
      totalCustomers: currentCustomers,
      customersChange: parseFloat(customersChange.toFixed(1)),
      revenueData,
      topProducts,
      detailedReports
    }
  } catch (err) {
    console.error('Raporlar yüklenirken hata:', err)
    alert('Raporlar yüklenirken bir hata oluştu')
  } finally {
    isLoading.value = false
  }
}

// Lifecycle hooks
onMounted(() => {
  loadReports()
})
</script> 