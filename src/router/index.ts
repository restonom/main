import { createRouter, createWebHistory } from 'vue-router'
import * as authService from '../services/auth'

// Yetkilendirme kontrol fonksiyonu
const requireAuth = async (to, from, next) => {
  const hasSession = await authService.checkAuth()
  
  if (!hasSession) {
    // Oturum yoksa login sayfasına yönlendir
    next('/login')
    return
  }
  
  // Oturum süresi kontrolü
  const sessionValid = authService.checkSessionTime()
  if (!sessionValid) {
    console.log('Oturum süresi dolmuş, yeniden giriş gerekli')
    next('/login')
    return
  }
  
  // Eğer belirli bir modül için özel izin kontrolü gerekiyorsa
  if (to.meta.requiresPermission) {
    const module = to.meta.module
    const permission = to.meta.permission || 'read'
    
    try {
      const hasPermission = await authService.checkPermission(module, permission)
      if (!hasPermission) {
        console.warn(`${module} modülü için ${permission} yetkisi yok. Ana sayfaya yönlendiriliyor.`)
        next('/')
        return
      }
    } catch (error) {
      console.error('İzin kontrolü sırasında hata:', error)
      next('/')
      return
    }
  }
  
  next()
}

const routes = [
  {
    path: '/',
    component: () => import('../views/Home.vue'),
    beforeEnter: requireAuth
  },
  {
    path: '/login',
    component: () => import('../views/Login.vue')
  },
  // Admin modülü
  {
    path: '/admin',
    component: () => import('../modules/admin/AdminModule.vue'),
    beforeEnter: requireAuth,
    meta: {
      requiresPermission: true,
      module: 'admin',
      permission: 'read'
    },
    children: [
      {
        path: '',
        component: () => import('../modules/admin/views/Dashboard.vue')
      },
      {
        path: 'settings',
        component: () => import('../modules/admin/views/Settings.vue')
      },
      {
        path: 'reports',
        component: () => import('../modules/admin/views/Reports.vue')
      },
      {
        path: 'menu',
        component: () => import('../modules/admin/views/Menu.vue')
      }
    ]
  },
  // Diğer modüller
  {
    path: '/manager',
    component: () => import('../modules/manager/ManagerModule.vue'),
    beforeEnter: requireAuth,
    meta: {
      requiresPermission: true,
      module: 'manager',
      permission: 'read'
    }
  },
  {
    path: '/waiter',
    component: () => import('../modules/waiter/WaiterModule.vue'),
    beforeEnter: requireAuth,
    meta: {
      requiresPermission: true,
      module: 'waiter',
      permission: 'read'
    }
  },
  {
    path: '/chef',
    component: () => import('../modules/chef/ChefModule.vue'),
    beforeEnter: requireAuth,
    meta: {
      requiresPermission: true, 
      module: 'chef',
      permission: 'read'
    }
  },
  {
    path: '/cashier',
    component: () => import('../modules/cashier/CashierModule.vue'),
    beforeEnter: requireAuth,
    meta: {
      requiresPermission: true,
      module: 'cashier',
      permission: 'read'
    }
  },
  // 404 yakalama
  { 
    path: '/:catchAll(.*)', 
    component: () => import('../views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 