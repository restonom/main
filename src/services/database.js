import supabase from './supabase'

/**
 * Veritabanı işlemleri için servis katmanı
 * Tüm veritabanı işlemleri bu servis üzerinden gerçekleştirilmelidir
 */

/**
 * Restoran bilgilerini getirir
 * @param {number} restaurantId - Restoran ID
 * @returns {Promise<Object>} - Restoran bilgileri
 */
export const getRestaurant = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Restoran bilgileri getirme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Restoran bilgilerini günceller
 * @param {number} restaurantId - Restoran ID
 * @param {Object} updateData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncelleme sonucu
 */
export const updateRestaurant = async (restaurantId, updateData) => {
  try {
    // Son güncelleme zamanını ekle
    const dataWithTimestamp = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('restaurants')
      .update(dataWithTimestamp)
      .eq('id', restaurantId)
      .select()
    
    if (error) throw error
    
    // Güncelleme logunu kaydet
    await logDatabaseActivity('restaurants', 'update', {
      restaurant_id: restaurantId,
      updated_fields: Object.keys(updateData)
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Restoran bilgileri güncelleme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Menü öğelerini getirir
 * @param {number} restaurantId - Restoran ID
 * @param {Object} options - Sorgu seçenekleri (kategori, arama, sıralama)
 * @returns {Promise<Object>} - Menü öğeleri listesi
 */
export const getMenuItems = async (restaurantId, options = {}) => {
  try {
    let query = supabase
      .from('menu_items')
      .select('*, categories(name)')
      .eq('restaurant_id', restaurantId)
    
    // Filtreleme
    if (options.category) {
      query = query.eq('category_id', options.category)
    }
    
    if (options.search) {
      query = query.ilike('name', `%${options.search}%`)
    }
    
    // Sıralama
    if (options.sortBy) {
      query = query.order(options.sortBy, { ascending: options.sortAsc !== false })
    } else {
      query = query.order('name', { ascending: true })
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // Erişim logunu kaydet
    await logDatabaseActivity('menu_items', 'read', {
      restaurant_id: restaurantId,
      filters: JSON.stringify(options)
    })
    
    return { success: true, data }
  } catch (error) {
    console.error('Menü öğeleri getirme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Yeni menü öğesi ekler
 * @param {Object} menuItem - Menü öğesi verileri
 * @returns {Promise<Object>} - Ekleme sonucu
 */
export const createMenuItem = async (menuItem) => {
  try {
    // Oluşturma zamanını ekle
    const itemWithTimestamp = {
      ...menuItem,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('menu_items')
      .insert(itemWithTimestamp)
      .select()
    
    if (error) throw error
    
    // Ekleme logunu kaydet
    await logDatabaseActivity('menu_items', 'create', {
      restaurant_id: menuItem.restaurant_id,
      item_id: data[0].id
    })
    
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Menü öğesi ekleme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Menü öğesini günceller
 * @param {number} itemId - Menü öğesi ID'si
 * @param {Object} updateData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncelleme sonucu
 */
export const updateMenuItem = async (itemId, updateData) => {
  try {
    // Son güncelleme zamanını ekle
    const dataWithTimestamp = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('menu_items')
      .update(dataWithTimestamp)
      .eq('id', itemId)
      .select()
    
    if (error) throw error
    
    // Güncelleme logunu kaydet
    await logDatabaseActivity('menu_items', 'update', {
      item_id: itemId,
      restaurant_id: data[0].restaurant_id,
      updated_fields: Object.keys(updateData)
    })
    
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Menü öğesi güncelleme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Menü öğesini siler
 * @param {number} itemId - Menü öğesi ID'si
 * @param {number} restaurantId - Restoran ID
 * @returns {Promise<Object>} - Silme sonucu
 */
export const deleteMenuItem = async (itemId, restaurantId) => {
  try {
    // Silmeden önce ID'yi kaydet
    const { data: itemData } = await supabase
      .from('menu_items')
      .select('id, name, restaurant_id')
      .eq('id', itemId)
      .single()
    
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId)
      .eq('restaurant_id', restaurantId)
    
    if (error) throw error
    
    // Silme logunu kaydet
    await logDatabaseActivity('menu_items', 'delete', {
      item_id: itemId,
      restaurant_id: restaurantId,
      item_name: itemData?.name
    })
    
    return { success: true }
  } catch (error) {
    console.error('Menü öğesi silme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Veritabanı işlem logları
 * @param {string} table - Tablo adı
 * @param {string} action - İşlem türü (create, read, update, delete)
 * @param {Object} details - İşlem detayları
 * @returns {Promise<void>}
 */
export const logDatabaseActivity = async (table, action, details = {}) => {
  try {
    // Kullanıcı bilgisi varsa ekle
    let userId = null
    let userRole = null
    
    try {
      const userData = localStorage.getItem('user')
      if (userData) {
        const user = JSON.parse(userData)
        userId = user.id
        userRole = user.role
      }
    } catch (e) {
      console.warn('Kullanıcı bilgisi bulunamadı:', e)
    }
    
    const { error } = await supabase
      .from('database_logs')
      .insert({
        table_name: table,
        action_type: action,
        staff_id: userId,
        staff_role: userRole,
        details: details,
        created_at: new Date().toISOString(),
        restaurant_id: details.restaurant_id
      })
    
    if (error) {
      console.error('Veritabanı log kaydı hatası:', error)
    }
  } catch (error) {
    console.error('Veritabanı log kaydı beklenmeyen hata:', error)
  }
}

/**
 * Personel listesini getirir
 * @param {number} restaurantId - Restoran ID
 * @returns {Promise<Object>} - Personel listesi
 */
export const getStaff = async (restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('active', true)
      .order('name')
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Personel listesi getirme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Yeni personel ekler
 * @param {Object} staffData - Personel verileri
 * @returns {Promise<Object>} - Ekleme sonucu
 */
export const createStaff = async (staffData) => {
  try {
    // PIN kodunun benzersiz olup olmadığını kontrol et
    const { data: existingStaff, error: checkError } = await supabase
      .from('staff')
      .select('id')
      .eq('restaurant_id', staffData.restaurant_id)
      .eq('pin', staffData.pin)
      .limit(1)
    
    if (checkError) throw checkError
    
    if (existingStaff && existingStaff.length > 0) {
      return { 
        success: false, 
        error: { message: 'Bu PIN kodu zaten kullanılıyor. Lütfen farklı bir PIN kodu seçin.' } 
      }
    }
    
    // Oluşturma zamanını ekle
    const dataWithTimestamp = {
      ...staffData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      active: true
    }
    
    const { data, error } = await supabase
      .from('staff')
      .insert(dataWithTimestamp)
      .select()
    
    if (error) throw error
    
    // Ekleme logunu kaydet
    await logDatabaseActivity('staff', 'create', {
      restaurant_id: staffData.restaurant_id,
      staff_id: data[0].id,
      staff_role: data[0].role
    })
    
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Personel ekleme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Personel bilgilerini günceller
 * @param {number} staffId - Personel ID'si
 * @param {Object} updateData - Güncellenecek veriler
 * @returns {Promise<Object>} - Güncelleme sonucu
 */
export const updateStaff = async (staffId, updateData) => {
  try {
    // PIN kodu değiştiyse benzersizliğini kontrol et
    if (updateData.pin) {
      const { data: existingStaff, error: checkError } = await supabase
        .from('staff')
        .select('id')
        .eq('restaurant_id', updateData.restaurant_id)
        .eq('pin', updateData.pin)
        .neq('id', staffId)
        .limit(1)
      
      if (checkError) throw checkError
      
      if (existingStaff && existingStaff.length > 0) {
        return { 
          success: false, 
          error: { message: 'Bu PIN kodu zaten kullanılıyor. Lütfen farklı bir PIN kodu seçin.' } 
        }
      }
    }
    
    // Son güncelleme zamanını ekle
    const dataWithTimestamp = {
      ...updateData,
      updated_at: new Date().toISOString()
    }
    
    const { data, error } = await supabase
      .from('staff')
      .update(dataWithTimestamp)
      .eq('id', staffId)
      .select()
    
    if (error) throw error
    
    // Güncelleme logunu kaydet
    await logDatabaseActivity('staff', 'update', {
      staff_id: staffId,
      restaurant_id: updateData.restaurant_id,
      updated_fields: Object.keys(updateData)
    })
    
    return { success: true, data: data[0] }
  } catch (error) {
    console.error('Personel güncelleme hatası:', error)
    return { success: false, error }
  }
}

/**
 * Personeli pasif duruma geçirir (soft delete)
 * @param {number} staffId - Personel ID'si
 * @param {number} restaurantId - Restoran ID
 * @returns {Promise<Object>} - İşlem sonucu
 */
export const deactivateStaff = async (staffId, restaurantId) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .update({
        active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', staffId)
      .eq('restaurant_id', restaurantId)
      .select()
    
    if (error) throw error
    
    // Pasifleştirme logunu kaydet
    await logDatabaseActivity('staff', 'deactivate', {
      staff_id: staffId,
      restaurant_id: restaurantId
    })
    
    return { success: true }
  } catch (error) {
    console.error('Personel pasifleştirme hatası:', error)
    return { success: false, error }
  }
}

export default {
  getRestaurant,
  updateRestaurant,
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getStaff,
  createStaff,
  updateStaff,
  deactivateStaff,
  logDatabaseActivity
} 