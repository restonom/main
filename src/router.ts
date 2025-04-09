import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { hasPermission, PermissionType, getAccessibleModules } from './utils/permissions'

// Views
import Login from './views/Login.vue'
import Track from './views/Track.vue'
import AdminDashboard from './views/AdminDashboard.vue'

// Dashboard Pages
import PosDashboard from './modules/pos/PosDashboard.vue'
import KitchenDashboard from './modules/kitchen/KitchenDashboard.vue'
import AdminModuleDashboard from './modules/admin/AdminDashboard.vue'
import StaffDashboard from './modules/staff/StaffDashboard.vue'
import TablesDashboard from './modules/tables/TablesDashboard.vue'
import ReservationsDashboard from './modules/reservations/ReservationsDashboard.vue'

// Module Components
import StaffModule from './modules/staff/StaffModule.vue'
import TablesModule from './modules/tables/TablesModule.vue'
import ReservationsModule from './modules/reservations/ReservationsModule.vue'
import AdminModule from './modules/admin/AdminModule.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/pos' // Ana sayfa olarak POS'a yönlendir
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { requiresAuth: false }
  },
  {
    path: '/track',
    name: 'Track',
    component: Track,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/dashboard',
    name: 'SuperAdminDashboard',
    component: AdminDashboard,
    meta: { requiresAuth: true, requiresSuperAdmin: true }
  },
  // Modül sayfaları (ana yönlendirmeler)
  {
    path: '/pos',
    name: 'Pos',
    component: PosDashboard,
    meta: { requiresAuth: true, moduleName: 'POS', moduleId: 'pos' }
  },
  {
    path: '/kitchen',
    name: 'Kitchen',
    component: KitchenDashboard,
    meta: { requiresAuth: true, moduleName: 'Mutfak', moduleId: 'kitchen' }
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminModuleDashboard,
    meta: { requiresAuth: true, moduleName: 'Yönetim', moduleId: 'admin' }
  },
  {
    path: '/staff',
    name: 'Staff',
    component: StaffDashboard,
    meta: { requiresAuth: true, moduleName: 'Personel', moduleId: 'staff' }
  },
  {
    path: '/tables',
    name: 'Tables',
    component: TablesDashboard,
    meta: { requiresAuth: true, moduleName: 'Masalar', moduleId: 'tables' }
  },
  {
    path: '/reservations',
    name: 'Reservations',
    component: ReservationsDashboard,
    meta: { requiresAuth: true, moduleName: 'Rezervasyonlar', moduleId: 'reservations' }
  },
  // Eski dashboard yollarını yeni yapıya yönlendir
  {
    path: '/dashboard',
    redirect: '/pos'
  },
  {
    path: '/pos-dashboard',
    redirect: '/pos'
  },
  {
    path: '/kitchen-dashboard',
    redirect: '/kitchen'
  },
  {
    path: '/admin-dashboard',
    redirect: '/admin'
  },
  {
    path: '/staff-dashboard',
    redirect: '/staff'
  },
  {
    path: '/tables-dashboard',
    redirect: '/tables'
  },
  {
    path: '/reservations-dashboard',
    redirect: '/reservations'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Kullanıcının belirli bir sayfaya erişim izni olup olmadığını kontrol et (okuma izni)
const userHasAccess = (to: any, userRole: string): boolean => {
  // Sayfa bir modüle ait mi?
  if (to.meta?.moduleId) {
    // Kullanıcının bu modülü okuma izni var mı?
    return hasPermission(userRole, to.meta.moduleId, PermissionType.READ)
  }
  
  // Özel bir modül değilse, erişime izin ver
  return true
}

// Kullanıcının rolüne göre erişebileceği ilk sayfayı bul
const findFirstAccessibleRoute = (userRole: string) => {
  // Kullanıcının erişebileceği modülleri al
  const accessibleModules = getAccessibleModules(userRole)
  
  // Öncelikle POS'a erişim var mı kontrol et
  if (accessibleModules.includes('pos')) {
    return { name: 'Pos' }
  }
  
  // Diğer erişilebilir modüllere bak
  if (accessibleModules.length > 0) {
    // İlk erişilebilir modüle yönlendir
    return { path: `/${accessibleModules[0]}` }
  }
  
  // Hiçbir modüle erişim yoksa login'e yönlendir
  return { name: 'Login' }
}

router.beforeEach((to, from, next) => {
  // Kullanıcı bilgilerini al
  let isAuthenticated = false
  let userRole = 'guest'
  let isSuperAdmin = false
  
  try {
    const userData = localStorage.getItem('user')
    if (userData) {
      const user = JSON.parse(userData)
      isAuthenticated = true
      userRole = user.role || 'waiter'
      isSuperAdmin = user.superadmin === true
    }
  } catch (error) {
    console.error('Kullanıcı bilgileri alınamadı:', error)
  }

  // Login sayfasına herkes erişebilir
  if (to.path === '/login') {
    return next()
  }
  
  // Kullanıcı giriş yapmış mı kontrol et
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ name: 'Login' })
  }
  
  // SuperAdmin sayfaları için kontrol
  if (to.meta.requiresSuperAdmin && !isSuperAdmin) {
    return next(findFirstAccessibleRoute(userRole))
  }
  
  // Kullanıcının bu sayfaya okuma izni var mı?
  if (!userHasAccess(to, userRole)) {
    return next(findFirstAccessibleRoute(userRole))
  }
  
  // Her şey yolunda, erişime izin ver
  next()
})

export default router 