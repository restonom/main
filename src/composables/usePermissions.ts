import { computed, ref, inject } from 'vue'
import { hasPermission, PermissionType } from '../utils/permissions'

// Sistemdeki mevcut kullanıcı rolünü takip eden bir provide/inject değeri
export const USER_ROLE_KEY = Symbol('userRole')

export function usePermissions() {
  // Provide/inject'ten kullanıcı rolünü alma deneyin
  const injectedRole = inject(USER_ROLE_KEY, null)
  
  // Inject edilen değeri veya localStorage'tan alınan rolü kullan
  const userRole = ref(
    injectedRole || 
    (() => {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const user = JSON.parse(userData)
          return user.role || 'guest'
        }
      } catch (error) {
        console.error('Kullanıcı rolü alınamadı:', error)
      }
      return 'guest'
    })()
  )
  
  // Kullanıcının belirli bir modülde okuma izni var mı?
  const canRead = (moduleId: string) => {
    return hasPermission(userRole.value, moduleId, PermissionType.READ)
  }
  
  // Kullanıcının belirli bir modülde işlem yapma izni var mı?
  const canWrite = (moduleId: string) => {
    return hasPermission(userRole.value, moduleId, PermissionType.WRITE)
  }
  
  // Kullanıcının belirli bir modülde işlem düğmesini görüntüleme izni
  const canShowActionButtons = (moduleId: string) => {
    return computed(() => canWrite(moduleId))
  }
  
  // Kullanıcının admin olup olmadığını kontrol et
  const isAdmin = computed(() => userRole.value === 'admin')
  
  // Kullanıcının yönetici olup olmadığını kontrol et (admin veya manager)
  const isManager = computed(() => ['admin', 'manager'].includes(userRole.value))
  
  return {
    userRole,
    canRead,
    canWrite,
    canShowActionButtons,
    isAdmin,
    isManager
  }
} 