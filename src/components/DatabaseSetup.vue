<template>
  <div class="fixed bottom-4 right-4 z-50">
    <div v-if="showPanel" class="bg-white rounded-lg shadow-lg p-4 mb-2 w-80">
      <h3 class="text-lg font-medium mb-3">Veritabanı Yönetimi</h3>
      
      <p class="text-sm text-gray-600 mb-4">
        Bu paneli Supabase veritabanınızı kurmak ve test verilerini eklemek için kullanabilirsiniz.
      </p>
      
      <div class="space-y-2">
        <button 
          @click="setupDatabase"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          :disabled="isLoading"
        >
          {{ isLoading && action === 'setup' ? 'Kuruluyor...' : 'Tabloları Oluştur' }}
        </button>
        
        <button 
          @click="seedDatabase"
          class="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded"
          :disabled="isLoading"
        >
          {{ isLoading && action === 'seed' ? 'Veriler Ekleniyor...' : 'Örnek Veriler Ekle' }}
        </button>
        
        <button 
          @click="addTestStaff"
          class="w-full bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 rounded"
          :disabled="isLoading"
        >
          {{ isLoading && action === 'staff' ? 'Personel Ekleniyor...' : 'Test Personellerini Ekle' }}
        </button>
        
        <button 
          @click="addSuperAdmin"
          class="w-full bg-pink-500 hover:bg-pink-600 text-white py-2 px-4 rounded"
          :disabled="isLoading"
        >
          {{ isLoading && action === 'superadmin' ? 'SuperAdmin Oluşturuluyor...' : 'SuperAdmin Oluştur' }}
        </button>
        
        <button 
          @click="deleteSuperAdmin"
          class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
          :disabled="isLoading && action === 'delete-superadmin'"
        >
          {{ isLoading && action === 'delete-superadmin' ? 'SuperAdmin Siliniyor...' : 'SuperAdmin Sil' }}
        </button>
        
        <div v-if="isLoading" class="text-center py-2">
          <div class="loader"></div>
        </div>
        
        <div v-if="message" class="p-2 rounded text-sm" :class="messageClass">
          {{ message }}
        </div>
      </div>
    </div>
    
    <button 
      @click="togglePanel"
      class="bg-primary text-white p-2 rounded-full shadow-lg flex items-center justify-center w-12 h-12"
    >
      <span class="material-icons-outlined">{{ showPanel ? 'close' : 'database' }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import setupDb from '../services/db-setup'
import supabase from '../services/supabase'

const showPanel = ref(false)
const isLoading = ref(false)
const message = ref('')
const messageClass = ref('')
const action = ref<'setup' | 'seed' | 'staff' | 'superadmin' | 'delete-superadmin' | 'clear' | null>(null)

const togglePanel = () => {
  showPanel.value = !showPanel.value
  message.value = ''
}

const setupDatabase = async () => {
  isLoading.value = true
  action.value = 'setup'
  message.value = ''
  
  try {
    await setupDb()
    message.value = 'Veritabanı tabloları başarıyla oluşturuldu.'
    messageClass.value = 'bg-green-100 text-green-700'
  } catch (error) {
    message.value = 'Veritabanı tabloları oluşturulurken hata oluştu.'
    messageClass.value = 'bg-red-100 text-red-700'
    console.error('Database setup error:', error)
  } finally {
    isLoading.value = false
    action.value = null
  }
}

const seedDatabase = async () => {
  isLoading.value = true
  action.value = 'seed'
  message.value = ''
  
  try {
    // Seed işlemleri burada yapılır
    const result = await seedBasicData()
    
    if (result.success) {
      message.value = 'Örnek veriler başarıyla eklendi.'
      messageClass.value = 'bg-green-100 text-green-700'
    } else {
      throw result.error
    }
  } catch (error) {
    message.value = 'Örnek veriler eklenirken hata oluştu.'
    messageClass.value = 'bg-red-100 text-red-700'
    console.error('Database seeding error:', error)
  } finally {
    isLoading.value = false
    action.value = null
  }
}

// Temel verileri ekle
const seedBasicData = async () => {
  try {
    console.log('Temel veriler ekleniyor...')
    
    // Örnek restoran ekle
    const restaurant = {
      name: 'Örnek Restoran',
      slug: 'ornek-restoran',
      email: 'info@ornekrestoran.com',
      phone: '+90 555 123 4567',
      address: 'Örnek Mahallesi, Örnek Sokak No:1, İstanbul',
      tax_rate: 18,
      service_charge: 10
    }
    
    // Önce mevcut restoranları temizle
    const { error: deleteRestaurantsError } = await supabase
      .from('restaurants')
      .delete()
      .neq('id', 0)
    
    if (deleteRestaurantsError) {
      console.warn('Restoranlar silinirken hata oluştu:', deleteRestaurantsError)
    }
    
    // Yeni restoranı ekle
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .insert(restaurant)
      .select()
    
    if (restaurantError) {
      throw restaurantError
    }
    
    const restaurantId = restaurantData[0].id
    console.log('Restaurant ID:', restaurantId)
    
    // Örnek kategorileri ekle
    const categories = [
      { name: 'Başlangıçlar', restaurant_id: restaurantId },
      { name: 'Ana Yemekler', restaurant_id: restaurantId },
      { name: 'Tatlılar', restaurant_id: restaurantId },
      { name: 'İçecekler', restaurant_id: restaurantId }
    ]
    
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .insert(categories)
      .select()
    
    if (categoryError) {
      throw categoryError
    }
    
    console.log('Eklenen kategoriler:', categoryData)
    
    return { 
      success: true, 
      data: { 
        restaurant: restaurantData[0],
        categories: categoryData
      } 
    }
  } catch (error) {
    console.error('Temel veriler eklenirken hata:', error)
    return { success: false, error }
  }
}

// Test personelleri ekle
const addTestStaff = async () => {
  isLoading.value = true
  action.value = 'staff'
  message.value = ''
  
  try {
    console.log('Test personelleri ekleniyor...')
    
    // Önce mevcut restaurant id'yi al
    const { data: restaurantData, error: restaurantError } = await supabase
      .from('restaurants')
      .select('id')
      .limit(1)
      .single()
      
    if (restaurantError) {
      throw new Error('Restoran bulunamadı. Önce örnek verileri ekleyin.')
    }
    
    const restaurantId = restaurantData.id
    console.log('Restaurant ID:', restaurantId)
    
    // Test personellerini ekle
    const staffData = [
      {
        restaurant_id: restaurantId,
        name: 'Ahmet Yılmaz',
        email: 'ahmet@emirgansutis.com',
        role: 'admin',
        pin: '123456',
        permissions: { modules: ['pos', 'kitchen', 'admin'] }
      },
      {
        restaurant_id: restaurantId,
        name: 'Mehmet Can',
        email: 'mehmet@emirgansutis.com',
        role: 'waiter',
        pin: '567890',
        permissions: { modules: ['pos'] }
      },
      {
        restaurant_id: restaurantId,
        name: 'Ayşe Demir',
        email: 'ayse@emirgansutis.com',
        role: 'chef',
        pin: '432109',
        permissions: { modules: ['kitchen'] }
      },
      {
        restaurant_id: restaurantId,
        name: 'Fatma Şahin',
        email: 'fatma@emirgansutis.com',
        role: 'manager',
        pin: '112233',
        permissions: { modules: ['pos', 'admin'] }
      },
      {
        restaurant_id: restaurantId,
        name: 'Ali Kaya',
        email: 'ali@emirgansutis.com',
        role: 'waiter',
        pin: '445566',
        permissions: { modules: ['pos'] }
      }
    ]
    
    // Önce mevcut personelleri temizle
    const { error: deleteError } = await supabase
      .from('staff')
      .delete()
      .eq('restaurant_id', restaurantId)
      
    if (deleteError) {
      console.warn('Mevcut personeller silinirken hata:', deleteError)
    }
    
    // Yeni personelleri ekle
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      
    if (staffError) {
      throw staffError
    }
    
    // Test masalarını ekle
    await addTestTables(restaurantId)
    
    // Test menü öğelerini ekle
    await addTestMenuItems(restaurantId)
    
    // Test rezervasyonlarını ekle
    await addTestReservations(restaurantId)
    
    // Test siparişlerini ekle
    await addTestOrders(restaurantId, staff[0].id)
    
    message.value = `${staff.length} test personeli ve demo veriler başarıyla eklendi.`
    messageClass.value = 'bg-green-100 text-green-700'
    console.log('Eklenen personeller:', staff)
    
  } catch (error: any) {
    message.value = 'Test personelleri eklenirken hata oluştu: ' + error.message
    messageClass.value = 'bg-red-100 text-red-700'
    console.error('Test staff error:', error)
  } finally {
    isLoading.value = false
    action.value = null
  }
}

// Test masalarını ekle
const addTestTables = async (restaurantId: string) => {
  try {
    // Önce mevcut masaları temizle
    const { error: deleteError } = await supabase
      .from('tables')
      .delete()
      .eq('restaurant_id', restaurantId)
      
    if (deleteError) {
      console.warn('Mevcut masalar silinirken hata:', deleteError)
    }
    
    // Test masaları ekle
    const tablesData = []
    
    // Ana salon masaları
    for (let i = 1; i <= 10; i++) {
      tablesData.push({
        restaurant_id: restaurantId,
        number: i,
        capacity: i % 3 === 0 ? 6 : 4,
        status: i % 5 === 0 ? 'occupied' : (i % 7 === 0 ? 'reserved' : 'empty'),
        location: 'main'
      })
    }
    
    // Teras masaları
    for (let i = 11; i <= 15; i++) {
      tablesData.push({
        restaurant_id: restaurantId,
        number: i,
        capacity: i % 2 === 0 ? 2 : 4,
        status: i % 4 === 0 ? 'occupied' : 'empty',
        location: 'terrace'
      })
    }
    
    // VIP masaları
    for (let i = 16; i <= 18; i++) {
      tablesData.push({
        restaurant_id: restaurantId,
        number: i,
        capacity: 8,
        status: i === 16 ? 'reserved' : 'empty',
        location: 'vip'
      })
    }
    
    const { error: tablesError } = await supabase
      .from('tables')
      .insert(tablesData)
      
    if (tablesError) {
      throw tablesError
    }
    
    console.log(`${tablesData.length} test masası eklendi`)
    
  } catch (error: any) {
    console.error('Test masaları eklenirken hata:', error)
    throw error
  }
}

// Test menü öğelerini ekle
const addTestMenuItems = async (restaurantId: string) => {
  try {
    // Önce mevcut menü öğelerini temizle
    const { error: deleteError } = await supabase
      .from('menu_items')
      .delete()
      .eq('restaurant_id', restaurantId)
      
    if (deleteError) {
      console.warn('Mevcut menü öğeleri silinirken hata:', deleteError)
    }
    
    // Test menü öğeleri ekle
    const menuItemsData = [
      // Çorbalar
      {
        restaurant_id: restaurantId,
        name: 'Mercimek Çorbası',
        description: 'Geleneksel lezzetiyle mercimek çorbası',
        price: 35.00,
        category: 'Çorbalar',
        image_url: 'https://cdn.pixabay.com/photo/2017/05/05/19/06/lentil-soup-2287738_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Ezogelin Çorbası',
        description: 'Baharatlı ve doyurucu',
        price: 35.00,
        category: 'Çorbalar',
        image_url: 'https://cdn.pixabay.com/photo/2019/10/01/13/27/soup-4518974_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'İşkembe Çorbası',
        description: 'Sarımsaklı ve limonlu klasik lezzet',
        price: 45.00,
        category: 'Çorbalar',
        image_url: 'https://cdn.pixabay.com/photo/2020/02/15/00/33/soup-4850037_960_720.jpg',
        active: true
      },
      
      // Başlangıçlar
      {
        restaurant_id: restaurantId,
        name: 'Humus',
        description: 'Nohut ezmesi, tahin ve zeytinyağı ile',
        price: 55.00,
        category: 'Başlangıçlar',
        image_url: 'https://cdn.pixabay.com/photo/2021/01/18/12/51/hummus-5928010_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Patlıcan Salatası',
        description: 'Közlenmiş patlıcan, biber ve domates ile',
        price: 60.00,
        category: 'Başlangıçlar',
        image_url: 'https://cdn.pixabay.com/photo/2018/07/03/10/51/salad-3513349_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Yaprak Sarma',
        description: 'Zeytinyağlı yaprak sarma',
        price: 70.00,
        category: 'Başlangıçlar',
        image_url: 'https://cdn.pixabay.com/photo/2020/05/11/21/57/sarma-5160350_960_720.jpg',
        active: true
      },
      
      // Ana Yemekler
      {
        restaurant_id: restaurantId,
        name: 'Izgara Köfte',
        description: 'El yapımı köfte, pilav ve mevsim yeşillikleri ile',
        price: 120.00,
        category: 'Ana Yemekler',
        image_url: 'https://cdn.pixabay.com/photo/2018/09/22/19/43/meat-balls-3695610_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Tavuk Şiş',
        description: 'Marine edilmiş tavuk parçaları, pilav ve közlenmiş sebzeler ile',
        price: 110.00,
        category: 'Ana Yemekler',
        image_url: 'https://cdn.pixabay.com/photo/2017/08/14/00/31/barbecue-2638255_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Kuzu Tandır',
        description: 'Fırında yavaş pişirilmiş kuzu eti, özel soslu patates ile',
        price: 180.00,
        category: 'Ana Yemekler',
        image_url: 'https://cdn.pixabay.com/photo/2015/03/26/10/01/food-691108_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'İskender Kebap',
        description: 'Döner eti, tereyağı, domates sosu ve yoğurt ile',
        price: 150.00,
        category: 'Ana Yemekler',
        image_url: 'https://cdn.pixabay.com/photo/2020/02/15/20/38/iskender-kebap-4851819_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Karnıyarık',
        description: 'Kıymalı patlıcan yemeği',
        price: 95.00,
        category: 'Ana Yemekler',
        image_url: 'https://cdn.pixabay.com/photo/2018/08/31/14/57/karniyarik-3644543_960_720.jpg',
        active: true
      },
      
      // Tatlılar
      {
        restaurant_id: restaurantId,
        name: 'Künefe',
        description: 'Kadayıf hamurundan, peynirli sıcak tatlı',
        price: 75.00,
        category: 'Tatlılar',
        image_url: 'https://cdn.pixabay.com/photo/2019/04/27/23/13/kunafa-4160187_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Baklava',
        description: 'Antep fıstıklı baklava',
        price: 85.00,
        category: 'Tatlılar',
        image_url: 'https://cdn.pixabay.com/photo/2018/07/19/09/45/baklava-3547868_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Sütlaç',
        description: 'Geleneksel fırında sütlaç',
        price: 60.00,
        category: 'Tatlılar',
        image_url: 'https://cdn.pixabay.com/photo/2015/09/15/17/46/pudding-941224_960_720.jpg',
        active: true
      },
      
      // İçecekler
      {
        restaurant_id: restaurantId,
        name: 'Türk Kahvesi',
        description: 'Geleneksel Türk kahvesi',
        price: 30.00,
        category: 'İçecekler',
        image_url: 'https://cdn.pixabay.com/photo/2015/05/31/10/54/coffee-791439_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Çay',
        description: 'Demli Türk çayı',
        price: 15.00,
        category: 'İçecekler',
        image_url: 'https://cdn.pixabay.com/photo/2020/03/19/16/25/turkish-tea-4947501_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Ayran',
        description: 'Geleneksel Türk içeceği',
        price: 20.00,
        category: 'İçecekler',
        image_url: 'https://cdn.pixabay.com/photo/2019/06/23/19/16/ayran-4294442_960_720.jpg',
        active: true
      },
      {
        restaurant_id: restaurantId,
        name: 'Meyveli Soda',
        description: 'Çeşitli meyve aromalı soda',
        price: 25.00,
        category: 'İçecekler',
        image_url: 'https://cdn.pixabay.com/photo/2017/02/02/15/15/bottle-2032980_960_720.jpg',
        active: true
      }
    ]
    
    const { error: menuItemsError } = await supabase
      .from('menu_items')
      .insert(menuItemsData)
      
    if (menuItemsError) {
      throw menuItemsError
    }
    
    console.log(`${menuItemsData.length} test menü öğesi eklendi`)
    
  } catch (error: any) {
    console.error('Test menü öğeleri eklenirken hata:', error)
    throw error
  }
}

// Test rezervasyonları ekle
const addTestReservations = async (restaurantId: string) => {
  try {
    // Önce mevcut rezervasyonları temizle
    const { error: deleteError } = await supabase
      .from('reservations')
      .delete()
      .eq('restaurant_id', restaurantId)
      
    if (deleteError) {
      console.warn('Mevcut rezervasyonlar silinirken hata:', deleteError)
    }
    
    // Test rezervasyonları ekle
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    // Masa ID'lerini al
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, number')
      .eq('restaurant_id', restaurantId)
      .limit(10)
    
    if (tablesError) {
      throw tablesError
    }
    
    const reservationsData = [
      // Bugün için rezervasyonlar
      {
        restaurant_id: restaurantId,
        table_id: tables[0].id,
        customer_name: 'Mehmet Yılmaz',
        email: 'mehmet@example.com',
        phone: '5551234567',
        date: new Date(today.setHours(19, 0, 0, 0)).toISOString(),
        people: 2,
        duration: 120,
        status: 'confirmed',
        notes: '2. evlilik yıldönümleri'
      },
      {
        restaurant_id: restaurantId,
        table_id: tables[1].id,
        customer_name: 'Ayşe Demir',
        email: 'ayse@example.com',
        phone: '5559876543',
        date: new Date(today.setHours(20, 30, 0, 0)).toISOString(),
        people: 4,
        duration: 150,
        status: 'confirmed',
        notes: 'Doğum günü kutlaması'
      },
      
      // Yarın için rezervasyonlar
      {
        restaurant_id: restaurantId,
        table_id: tables[2].id,
        customer_name: 'Ali Kaya',
        email: 'ali@example.com',
        phone: '5554567890',
        date: new Date(tomorrow.setHours(18, 0, 0, 0)).toISOString(),
        people: 3,
        duration: 120,
        status: 'pending',
        notes: 'İş yemeği'
      },
      {
        restaurant_id: restaurantId,
        table_id: tables[3].id,
        customer_name: 'Zeynep Şahin',
        email: 'zeynep@example.com',
        phone: '5553216547',
        date: new Date(tomorrow.setHours(19, 30, 0, 0)).toISOString(),
        people: 6,
        duration: 180,
        status: 'confirmed',
        notes: 'Aile buluşması'
      },
      
      // Gelecek hafta için rezervasyonlar
      {
        restaurant_id: restaurantId,
        table_id: tables[4].id,
        customer_name: 'Mustafa Öztürk',
        email: 'mustafa@example.com',
        phone: '5557894561',
        date: new Date(nextWeek.setHours(20, 0, 0, 0)).toISOString(),
        people: 8,
        duration: 240,
        status: 'confirmed',
        notes: 'Şirket yemeği, VIP masa olursa iyi olur'
      }
    ]
    
    const { error: reservationsError } = await supabase
      .from('reservations')
      .insert(reservationsData)
      
    if (reservationsError) {
      throw reservationsError
    }
    
    console.log(`${reservationsData.length} test rezervasyonu eklendi`)
    
  } catch (error: any) {
    console.error('Test rezervasyonları eklenirken hata:', error)
    throw error
  }
}

// Test siparişleri ekle
const addTestOrders = async (restaurantId: string, staffId: string) => {
  try {
    // Önce mevcut siparişleri temizle
    const { error: deleteOrderItemsError } = await supabase
      .from('order_items')
      .delete()
      .neq('id', 0)
    
    if (deleteOrderItemsError) {
      console.warn('Mevcut sipariş öğeleri silinirken hata:', deleteOrderItemsError)
    }
    
    const { error: deleteOrdersError } = await supabase
      .from('orders')
      .delete()
      .eq('restaurant_id', restaurantId)
      
    if (deleteOrdersError) {
      console.warn('Mevcut siparişler silinirken hata:', deleteOrdersError)
    }
    
    // Masa ID'lerini al
    const { data: tables, error: tablesError } = await supabase
      .from('tables')
      .select('id, number')
      .eq('restaurant_id', restaurantId)
      .limit(10)
    
    if (tablesError) {
      throw tablesError
    }
    
    // Menü öğelerini al
    const { data: menuItems, error: menuItemsError } = await supabase
      .from('menu_items')
      .select('id, name, price, category')
      .eq('restaurant_id', restaurantId)
    
    if (menuItemsError) {
      throw menuItemsError
    }
    
    // Rastgele menü öğesi seç
    const getRandomMenuItems = (count: number) => {
      const result = []
      const availableItems = [...menuItems]
      
      for (let i = 0; i < count; i++) {
        if (availableItems.length === 0) break
        
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        const item = availableItems.splice(randomIndex, 1)[0]
        
        const quantity = Math.floor(Math.random() * 3) + 1
        
        result.push({
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity
        })
      }
      
      return result
    }
    
    // Test siparişleri oluştur
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
    
    const ordersData = [
      // Tamamlanmış sipariş
      {
        restaurant_id: restaurantId,
        table_id: tables[5].id,
        staff_id: staffId,
        status: 'completed',
        source: 'pos',
        total_amount: 0, // Hesaplanacak
        created_at: twoHoursAgo.toISOString(),
        updated_at: oneHourAgo.toISOString(),
        items: getRandomMenuItems(3)
      },
      
      // Hazırlanıyor siparişi
      {
        restaurant_id: restaurantId,
        table_id: tables[6].id,
        staff_id: staffId,
        status: 'preparing',
        source: 'pos',
        total_amount: 0, // Hesaplanacak
        created_at: oneHourAgo.toISOString(),
        updated_at: now.toISOString(),
        items: getRandomMenuItems(4)
      },
      
      // Hazır sipariş
      {
        restaurant_id: restaurantId,
        table_id: tables[7].id,
        staff_id: staffId,
        status: 'ready',
        source: 'pos',
        total_amount: 0, // Hesaplanacak
        created_at: threeHoursAgo.toISOString(),
        updated_at: now.toISOString(),
        items: getRandomMenuItems(2)
      },
      
      // QR'dan gelen sipariş
      {
        restaurant_id: restaurantId,
        table_id: tables[8].id,
        staff_id: null,
        status: 'preparing',
        source: 'qr',
        total_amount: 0, // Hesaplanacak
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        items: getRandomMenuItems(3)
      }
    ]
    
    // Toplam tutarları hesapla ve siparişleri kaydet
    for (const order of ordersData) {
      let totalAmount = 0
      
      for (const item of order.items) {
        totalAmount += item.price * item.quantity
      }
      
      order.total_amount = totalAmount
      
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: order.restaurant_id,
          table_id: order.table_id,
          staff_id: order.staff_id,
          status: order.status,
          source: order.source,
          total_amount: order.total_amount,
          created_at: order.created_at,
          updated_at: order.updated_at
        })
        .select()
        .single()
      
      if (orderError) {
        throw orderError
      }
      
      // Sipariş öğelerini ekle
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        menu_item_id: item.menu_item_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
      
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (orderItemsError) {
        throw orderItemsError
      }
    }
    
    console.log(`${ordersData.length} test siparişi eklendi`)
    
  } catch (error: any) {
    console.error('Test siparişleri eklenirken hata:', error)
    throw error
  }
}

// SuperAdmin oluştur
const addSuperAdmin = async () => {
  isLoading.value = true
  action.value = 'superadmin'
  message.value = ''
  
  try {
    console.log('SuperAdmin oluşturuluyor...')
    
    // Önce mevcut SuperAdmin kontrolü yap
    const { data: existingAdmins, error: checkError } = await supabase
      .from('superadmins')
      .select('*')
      .limit(1)
    
    if (!checkError && existingAdmins && existingAdmins.length > 0) {
      message.value = 'Sistemde zaten bir SuperAdmin bulunuyor. Lütfen önce mevcut SuperAdmin\'i silin.'
      messageClass.value = 'bg-yellow-100 text-yellow-700'
      return
    }
    
    // Benzersiz e-posta oluştur
    const uniqueId = Math.random().toString(36).substring(2, 10)
    const email = `admin.${uniqueId}@restonom.com`
    const password = 'Admin123!'
    
    // Önce auth.users'da kullanıcı oluştur
    const { data: userData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password
    })
    
    if (authError) {
      if (authError.message.includes('security purposes') || authError.message.includes('request this after')) {
        throw new Error('Güvenlik sınırlaması nedeniyle işlem yapılamıyor. Lütfen bir dakika bekleyin ve tekrar deneyin.')
      }
      throw authError
    }
    
    // Kullanıcı kimliğini al
    const userId = userData.user?.id
    
    if (!userId) {
      throw new Error('Kullanıcı oluşturulamadı')
    }
    
    // 2 saniye bekle - bu işlemler arasında biraz zaman vermek hız sınırlaması hatasını azaltabilir
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // SuperAdmin tablosuna kayıt ekle
    const { data: adminData, error: adminError } = await supabase
      .from('superadmins')
      .insert({
        user_id: userId,
        email: email,
        name: 'Sistem Yöneticisi',
        is_active: true
      })
      .select()
      .single()
    
    if (adminError) {
      // Oluşturulan auth kullanıcısını temizle
      try {
        await supabase.auth.admin.deleteUser(userId)
      } catch (deleteError) {
        console.error('Kullanıcı silinirken hata:', deleteError)
      }
      
      throw adminError
    }
    
    message.value = `SuperAdmin başarıyla oluşturuldu. E-mail: ${email}, Şifre: ${password}`
    messageClass.value = 'bg-green-100 text-green-700'
    console.log('Oluşturulan SuperAdmin:', adminData)
    
  } catch (error: any) {
    message.value = 'SuperAdmin oluşturulurken hata oluştu: ' + error.message
    messageClass.value = 'bg-red-100 text-red-700'
    console.error('SuperAdmin error:', error)
  } finally {
    isLoading.value = false
    action.value = null
  }
}

// SuperAdmin sil
const deleteSuperAdmin = async () => {
  isLoading.value = true
  action.value = 'delete-superadmin'
  message.value = ''
  
  try {
    console.log('SuperAdmin siliniyor...')
    
    // Önce mevcut SuperAdmin'i bul
    const { data: admins, error: checkError } = await supabase
      .from('superadmins')
      .select('*')
    
    if (checkError) throw checkError
    
    if (!admins || admins.length === 0) {
      message.value = 'Silinecek SuperAdmin bulunamadı.'
      messageClass.value = 'bg-yellow-100 text-yellow-700'
      return
    }
    
    // Her bir admin için silme işlemi yap
    for (const admin of admins) {
      // Önce superadmins tablosundan sil
      const { error: deleteAdminError } = await supabase
        .from('superadmins')
        .delete()
        .eq('id', admin.id)
      
      if (deleteAdminError) throw deleteAdminError
      
      // Auth.users'dan silme işlemi
      if (admin.user_id) {
        try {
          // Not: Bu işlem yalnızca servis rolü ile yapılabilir
          const { error: deleteUserError } = await supabase.auth.admin.deleteUser(admin.user_id)
          if (deleteUserError) console.warn('Kullanıcı silinirken hata:', deleteUserError)
        } catch (userError) {
          console.warn('Auth kullanıcısı silinemedi:', userError)
        }
      }
    }
    
    message.value = `${admins.length} SuperAdmin başarıyla silindi.`
    messageClass.value = 'bg-green-100 text-green-700'
    
  } catch (error: any) {
    message.value = 'SuperAdmin silinirken hata oluştu: ' + error.message
    messageClass.value = 'bg-red-100 text-red-700'
    console.error('Delete SuperAdmin error:', error)
  } finally {
    isLoading.value = false
    action.value = null
  }
}
</script>

<style scoped>
.loader {
  border: 3px solid #f3f3f3;
  border-radius: 50%;
  border-top: 3px solid #3498db;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style> 