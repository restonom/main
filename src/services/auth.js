import bcryptjs from 'bcryptjs'
import supabase from './supabase'

/**
 * Şifre hash oluşturur
 * @param {string} password - Hashlenmemiş şifre
 * @returns {Promise<string>} Hashlenmiş şifre
 */
export const hashPassword = async (password) => {
  const salt = await bcryptjs.genSalt(12)
  return bcryptjs.hash(password, salt)
}

/**
 * Şifreyi doğrular
 * @param {string} password - Kullanıcının girdiği düz metin şifre
 * @param {string} hash - Veritabanındaki hash değeri
 * @returns {Promise<boolean>} Doğrulama sonucu
 */
export const verifyPassword = async (password, hash) => {
  // Eğer hash BCrypt formatında değilse (eski sistem) doğrudan karşılaştır
  if (!hash.startsWith('$2a$') && !hash.startsWith('$2b$') && !hash.startsWith('$2y$')) {
    console.warn('Eski formatta şifre bulundu (hash değil). Güncelleme gerekiyor.')
    return password === hash
  }
  
  return bcryptjs.compare(password, hash)
}

/**
 * Kullanıcı girişini doğrular
 * @param {string} email - Email adresi veya kullanıcı adı
 * @param {string} password - Şifre
 * @returns {Promise<Object>} Doğrulama sonucu
 */
export const authenticateSuperAdmin = async (email, password) => {
  try {
    // Supabase Auth ile giriş yap
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError) {
      console.error('SuperAdmin auth hatası:', authError.message)
      return { success: false, error: 'Geçersiz email veya şifre.' }
    }
    
    if (!authData.user) {
      return { success: false, error: 'Kullanıcı bulunamadı.' }
    }
    
    // SuperAdmin mi kontrol et
    const { data: adminData, error: adminError } = await supabase
      .from('superadmins')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (adminError || !adminData) {
      console.error('SuperAdmin bulunamadı:', adminError?.message)
      await supabase.auth.signOut() // Auth'da var ama SuperAdmin değil, oturumu kapat
      return { success: false, error: 'SuperAdmin yetkiniz bulunmuyor.' }
    }
    
    // Hesap aktif mi kontrol et
    if (adminData.is_active === false) {
      await supabase.auth.signOut()
      return { success: false, error: 'Hesabınız devre dışı bırakılmış. Lütfen yönetici ile iletişime geçin.' }
    }
    
    return {
      success: true,
      user: adminData,
      session: authData.session
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

/**
 * İşletme girişini doğrular
 * @param {string} credential - İşletme adı, slug veya email
 * @param {string} password - İşletme şifresi
 * @returns {Promise<Object>} Doğrulama sonucu
 */
export const authenticateRestaurant = async (credential, password) => {
  try {
    // İşletmeyi bul
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .or(`name.ilike.%${credential}%,email.ilike.%${credential}%,slug.ilike.%${credential}%`)
      .limit(1)
      .single()
    
    if (restaurantError || !restaurant) {
      console.error('İşletme bulunamadı:', restaurantError?.message)
      return { success: false, error: 'Geçersiz işletme adı veya şifre.' }
    }
    
    // Şifre kontrolü
    if (!restaurant.password_hash) {
      return { success: false, error: 'Bu işletme için şifre tanımlanmamış.' }
    }
    
    const isPasswordValid = await verifyPassword(password, restaurant.password_hash)
    
    if (!isPasswordValid) {
      return { success: false, error: 'Geçersiz işletme adı veya şifre.' }
    }
    
    return {
      success: true,
      restaurant
    }
  } catch (error) {
    console.error('Restaurant authentication error:', error)
    return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

/**
 * Personel PIN doğrulama
 * @param {number} restaurantId - İşletme ID
 * @param {string} pin - Personel PIN kodu
 * @returns {Promise<Object>} Doğrulama sonucu
 */
export const authenticateStaff = async (restaurantId, pin) => {
  try {
    if (!restaurantId || !pin) {
      return { success: false, error: 'Restoran ID veya PIN eksik.' }
    }
    
    // Personeli bul
    const { data: staffList, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('pin', pin)
      .eq('active', true)
    
    if (staffError) {
      console.error('Personel arama hatası:', staffError)
      return { success: false, error: 'Personel doğrulanamadı. Lütfen tekrar deneyin.' }
    }
    
    if (!staffList || staffList.length === 0) {
      return { success: false, error: 'Geçersiz PIN kodu veya pasif personel.' }
    }
    
    const staff = staffList[0]
    
    return {
      success: true,
      staff
    }
  } catch (error) {
    console.error('Staff authentication error:', error)
    return { success: false, error: 'Bir hata oluştu. Lütfen tekrar deneyin.' }
  }
}

/**
 * İşletme şifresini güvenli şekilde günceller
 * @param {number} restaurantId - İşletme ID
 * @param {string} currentPassword - Mevcut şifre
 * @param {string} newPassword - Yeni şifre
 * @returns {Promise<Object>} İşlem sonucu
 */
export const updateRestaurantPassword = async (restaurantId, currentPassword, newPassword) => {
  try {
    // İşletmeyi bul
    const { data: restaurant, error: getError } = await supabase
      .from('restaurants')
      .select('id, password_hash')
      .eq('id', restaurantId)
      .single()
    
    if (getError || !restaurant) {
      return { success: false, error: 'İşletme bulunamadı.' }
    }
    
    // Mevcut şifreyi doğrula
    if (restaurant.password_hash) {
      const isValidPassword = await verifyPassword(currentPassword, restaurant.password_hash)
      if (!isValidPassword) {
        return { success: false, error: 'Mevcut şifre yanlış.' }
      }
    }
    
    // Yeni şifreyi hashle
    const hashedPassword = await hashPassword(newPassword)
    
    // Şifreyi güncelle
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ password_hash: hashedPassword })
      .eq('id', restaurantId)
    
    if (updateError) {
      console.error('Şifre güncelleme hatası:', updateError)
      return { success: false, error: 'Şifre güncellenirken bir hata oluştu.' }
    }
    
    return { success: true, message: 'Şifre başarıyla güncellendi.' }
  } catch (error) {
    console.error('Password update error:', error)
    return { success: false, error: 'Şifre güncellenirken bir hata oluştu.' }
  }
}

/**
 * Kullanıcı oturumunu kontrol eder ve geçerli bir oturum varsa kullanıcı bilgilerini döndürür
 * @returns {Promise<Object|null>} Kullanıcı bilgileri veya null
 */
export const checkAuth = async () => {
  try {
    // Supabase oturumunu kontrol et
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Oturum kontrolü hatası:', error)
      return false
    }
    
    if (!session) {
      console.log('Aktif oturum bulunamadı')
      // Session yoksa localStorage'dan kullanıcı bilgisini kontrol et
      const userData = localStorage.getItem('user')
      if (userData) {
        // Kullanıcı bilgisi varsa, session süresini kontrol et
        const sessionValid = checkSessionTime()
        return sessionValid
      }
      return false
    }
    
    return true
  } catch (err) {
    console.error('Oturum kontrolü beklenmeyen hata:', err)
    return false
  }
}

/**
 * Email ve şifre ile kullanıcı girişi yapar
 * @param {string} email - Kullanıcı email adresi
 * @param {string} password - Kullanıcı şifresi
 * @returns {Promise<Object>} - Login sonucu
 */
export const loginWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    
    return { success: true, data }
  } catch (error) {
    console.error('Email giriş hatası:', error)
    return { success: false, error }
  }
}

/**
 * Personel PIN kodu ile giriş yapar
 * @param {number} restaurantId - Restoran ID'si 
 * @param {string} pin - Personel PIN kodu
 * @returns {Promise<Object>} - Login sonucu
 */
export const loginWithPin = async (restaurantId, pin) => {
  try {
    // Personeli bul
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .eq('pin', pin)
      .eq('active', true)
      .single()
    
    if (staffError) {
      throw new Error('Personel bulunamadı veya PIN kodu geçersiz.')
    }
    
    // Restoranı bul
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single()
    
    if (restaurantError) {
      throw new Error('Restoran bilgileri alınamadı.')
    }
    
    // Supabase Auth ile anonim oturum aç
    const { data: authData, error: authError } = await supabase.auth.signInAnonymously()
    
    if (authError) {
      console.warn('Anonim oturum açılamadı:', authError.message)
      // Devam et, kritik değil
    }
    
    // Kullanıcı bilgilerini kaydet
    const userData = {
      id: staff.id,
      name: staff.name,
      role: staff.role || 'staff',
      restaurant_id: restaurantId,
      email: staff.email || '',
      isAdmin: ['admin', 'manager'].includes(staff.role || '')
    }
    
    // Oturum zamanını kaydet (hem localStorage hem veritabanı)
    const sessionTime = Date.now().toString()
    localStorage.setItem('session_time', sessionTime)
    
    // Giriş logunu veritabanına kaydet
    await logUserActivity(staff.id, 'login', { restaurantId, device: navigator.userAgent })
    
    // Kullanıcının son giriş zamanını güncelle
    await supabase
      .from('staff')
      .update({ 
        last_login: new Date().toISOString(),
        last_login_ip: await getClientIP(),
        last_login_device: navigator.userAgent,
        login_count: staff.login_count ? staff.login_count + 1 : 1
      })
      .eq('id', staff.id)
    
    // localStorage'a kaydet
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('restaurant', JSON.stringify(restaurant))
    
    // Session token'ı da kaydet
    if (authData?.session) {
      localStorage.setItem('sb_session', JSON.stringify(authData.session))
    }
    
    return { 
      success: true, 
      data: { 
        user: userData,
        restaurant,
        session: authData?.session || null
      } 
    }
  } catch (error) {
    console.error('PIN giriş hatası:', error)
    return { success: false, error }
  }
}

/**
 * Kullanıcı çıkışı yapar
 * @returns {Promise<Object>} - Çıkış sonucu
 */
export const logout = async () => {
  try {
    // Kullanıcı bilgilerini al (çıkış kaydı için)
    const userData = localStorage.getItem('user')
    let userId = null
    
    if (userData) {
      const user = JSON.parse(userData)
      userId = user.id
      
      // Çıkış logunu veritabanına kaydet
      await logUserActivity(userId, 'logout', { device: navigator.userAgent })
    }
    
    // Supabase oturumunu sonlandır
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Çıkış yapılırken hata:', error)
      return { success: false, error: error.message }
    }
    
    // localStorage'dan kullanıcı bilgilerini temizle
    localStorage.removeItem('user')
    localStorage.removeItem('restaurant')
    localStorage.removeItem('session_time')
    localStorage.removeItem('sb_session')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userRole')
    localStorage.removeItem('restaurantId')
    localStorage.removeItem('restaurantName')
    
    return { success: true, message: 'Başarıyla çıkış yapıldı' }
  } catch (error) {
    console.error('Çıkış beklenmeyen hata:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Session süresi kontrolü - 12 saatten uzun süredir aktif oturum varsa çıkış yap
 * @param {number} maxHours - Maksimum oturum süresi (saat)
 * @returns {boolean} - Oturum geçerli mi?
 */
export const checkSessionTime = (maxHours = 12) => {
  const sessionTime = localStorage.getItem('session_time')
  if (!sessionTime) return false
  
  const currentTime = Date.now()
  const sessionStartTime = parseInt(sessionTime)
  const sessionDuration = currentTime - sessionStartTime
  
  // 12 saat = 43200000 ms
  const maxSessionTime = maxHours * 60 * 60 * 1000
  
  if (sessionDuration > maxSessionTime) {
    console.log('Oturum süresi doldu, otomatik çıkış yapılıyor')
    logout()
    return false
  }
  
  return true
}

/**
 * Kullanıcının belirli bir role sahip olup olmadığını gerçek zamanlı kontrol eder
 * @param {string|Array<string>} requiredRoles - Gerekli rol(ler)
 * @returns {Promise<boolean>} - Kullanıcı gerekli role sahip mi?
 */
export const hasRole = async (requiredRoles) => {
  try {
    // Kullanıcı bilgisini al
    const userData = localStorage.getItem('user')
    if (!userData) return false
    
    const user = JSON.parse(userData)
    
    // Veritabanından gerçek zamanlı rol bilgisini al
    const { data, error } = await supabase
      .from('staff')
      .select('role')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Rol kontrolü hatası:', error)
      return false
    }
    
    // Veritabanındaki güncel rol
    const userRole = data.role || 'guest'
    
    // localStorage'daki rol güncel değilse güncelle
    if (user.role !== userRole) {
      user.role = userRole
      localStorage.setItem('user', JSON.stringify(user))
    }
    
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(userRole)
    }
    
    return userRole === requiredRoles
  } catch (error) {
    console.error('Rol kontrolü hatası:', error)
    return false
  }
}

/**
 * Kullanıcının belirli bir modül için izni olup olmadığını Supabase'den gerçek zamanlı kontrol eder
 * @param {string} moduleId - Modül ID'si 
 * @param {string} permissionType - İzin tipi (read/write)
 * @returns {Promise<boolean>} - Kullanıcının izni var mı?
 */
export const checkPermission = async (moduleId, permissionType = 'read') => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    if (!userData) return false
    
    const user = JSON.parse(userData)
    const userId = user.id
    const restaurantId = user.restaurant_id
    
    // Admin her zaman tüm izinlere sahiptir
    if (user.role === 'admin') return true
    
    // Veritabanından güncel izinleri kontrol et
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('staff_id', userId)
      .eq('module', moduleId)
      .eq('restaurant_id', restaurantId)
      .maybeSingle()
    
    if (error) {
      console.warn(`İzin sorgusu hatası - ${moduleId}:${permissionType} -`, error)
      // Hata durumunda rol bazlı yetkilendirmeye geç
      return hasPermissionByRole(user.role, moduleId, permissionType)
    }
    
    // Veritabanında özel bir izin kaydı varsa
    if (data) {
      // İzin türüne göre kontrol et
      if (permissionType === 'read') {
        return data.read_access === true
      } else if (permissionType === 'write') {
        return data.write_access === true
      }
      return false
    }
    
    // Özel izin yoksa rol bazlı izinlere bak
    return hasPermissionByRole(user.role, moduleId, permissionType)
  } catch (error) {
    console.error('İzin kontrolü hatası:', error)
    
    // Hata durumunda rol bazlı yetkilendirmeye geç
    const userData = localStorage.getItem('user')
    if (!userData) return false
    
    const user = JSON.parse(userData)
    return hasPermissionByRole(user.role, moduleId, permissionType)
  }
}

/**
 * Kullanıcının belirli bir modül için rolüne göre izni olup olmadığını kontrol eder
 * @param {string} role - Kullanıcı rolü 
 * @param {string} moduleId - Modül ID'si
 * @param {string} permissionType - İzin tipi (read/write)
 * @returns {boolean} - Kullanıcının izni var mı?
 */
export const hasPermissionByRole = (role, moduleId, permissionType) => {
  // Rol-İzin Matrisi - Temel İzinler
  const MODULE_PERMISSIONS = {
    'pos': {
      read: ['admin', 'manager', 'cashier', 'waiter'],
      write: ['admin', 'manager', 'cashier', 'waiter']
    },
    'kitchen': {
      read: ['admin', 'manager', 'chef', 'cook', 'waiter'],
      write: ['admin', 'manager', 'chef', 'cook']
    },
    'admin': {
      read: ['admin', 'manager'],
      write: ['admin']
    },
    'staff': {
      read: ['admin', 'manager'],
      write: ['admin', 'manager']
    },
    'tables': {
      read: ['admin', 'manager', 'waiter', 'host'],
      write: ['admin', 'manager', 'waiter', 'host']
    },
    'reservations': {
      read: ['admin', 'manager', 'host', 'waiter'],
      write: ['admin', 'manager', 'host']
    }
  }
  
  if (!MODULE_PERMISSIONS[moduleId]) {
    return false
  }
  
  return MODULE_PERMISSIONS[moduleId][permissionType]?.includes(role) || false
}

/**
 * Kullanıcının erişebileceği modülleri gerçek zamanlı olarak Supabase'den alır
 * @returns {Promise<Array<string>>} - Erişilebilir modül ID'leri
 */
export const getAccessibleModules = async () => {
  try {
    // Kullanıcı bilgilerini al
    const userData = localStorage.getItem('user')
    if (!userData) return []
    
    const user = JSON.parse(userData)
    const userId = user.id
    const restaurantId = user.restaurant_id
    
    // Veritabanından güncel izinleri kontrol et
    const { data, error } = await supabase
      .from('permissions')
      .select('module, permission_type')
      .eq('staff_id', userId)
      .eq('restaurant_id', restaurantId)
    
    if (error) {
      console.warn('Modül izinleri sorgusu hatası:', error)
      // Hata durumunda rol bazlı modüllere geç
      return getAccessibleModulesByRole(user.role)
    }
    
    // İzinli modülleri topla
    const modules = new Set()
    
    // Önce rol bazlı modülleri ekle
    const roleModules = getAccessibleModulesByRole(user.role)
    roleModules.forEach(module => modules.add(module))
    
    // Sonra özel izinleri ekle
    if (data && data.length > 0) {
      data.forEach(permission => {
        // En az okuma izni varsa ekle
        if (permission.permission_type === 'read' || permission.permission_type === 'write') {
          modules.add(permission.module)
        }
      })
    }
    
    return Array.from(modules)
  } catch (error) {
    console.error('Erişilebilir modüller sorgusu hatası:', error)
    
    // Hata durumunda rol bazlı modüllere geç
    const userData = localStorage.getItem('user')
    if (!userData) return []
    
    const user = JSON.parse(userData)
    return getAccessibleModulesByRole(user.role)
  }
}

/**
 * Kullanıcının rolüne göre erişebileceği modülleri getirir
 * @param {string} role - Kullanıcı rolü
 * @returns {Array<string>} - Erişilebilir modül ID'leri
 */
export const getAccessibleModulesByRole = (role) => {
  // Role göre erişilebilir modüller
  const ROLE_MODULES = {
    admin: ['admin', 'pos', 'kitchen', 'staff', 'tables', 'reservations', 'reports'],
    manager: ['admin', 'pos', 'kitchen', 'staff', 'tables', 'reservations', 'reports'],
    chef: ['kitchen', 'inventory'],
    cook: ['kitchen'],
    waiter: ['pos', 'tables', 'reservations'],
    cashier: ['pos', 'reports'],
    host: ['tables', 'reservations']
  }
  
  return ROLE_MODULES[role] || []
}

/**
 * Kullanıcı aktivitesini kaydeder
 * @param {number} userId - Kullanıcı ID
 * @param {string} activity - Aktivite tipi 
 * @param {Object} details - Aktivite detayları
 * @returns {Promise<void>}
 */
export const logUserActivity = async (userId, activity, details = {}) => {
  try {
    if (!userId || !activity) return
    
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        staff_id: userId,
        activity_type: activity,
        details: details,
        created_at: new Date().toISOString(),
        ip_address: await getClientIP()
      })
    
    if (error) {
      console.error('Aktivite kaydı hatası:', error)
    }
  } catch (error) {
    console.error('Aktivite kaydı beklenmeyen hata:', error)
  }
}

/**
 * Kullanıcının gerçek IP adresini almaya çalışır
 * @returns {Promise<string>} IP adresi veya bilinmiyor
 */
export const getClientIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json')
    const data = await response.json()
    return data.ip
  } catch (error) {
    console.warn('IP adresi alınamadı:', error)
    return 'unknown'
  }
}

/**
 * Servis modülünü dışa aktar
 */
export default {
  hashPassword,
  verifyPassword,
  authenticateSuperAdmin,
  authenticateRestaurant,
  authenticateStaff,
  updateRestaurantPassword,
  checkAuth,
  loginWithEmail,
  loginWithPin,
  logout,
  checkSessionTime,
  hasRole,
  checkPermission,
  hasPermissionByRole,
  getAccessibleModules,
  getAccessibleModulesByRole,
  logUserActivity
} 