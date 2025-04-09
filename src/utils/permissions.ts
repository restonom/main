// İzin Tipleri
export enum PermissionType {
  READ = 'read', // Görüntüleme izni
  WRITE = 'write' // İşlem yapma izni
}

// Modül İzin Yapısı
export interface ModulePermission {
  read: string[]; // Bu modülü görüntüleyebilen roller
  write: string[]; // Bu modülde işlem yapabilen roller
}

// Rol Tanımları
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  WAITER: 'waiter',
  CHEF: 'chef',
  COOK: 'cook',
  HOST: 'host'
}

// Rol Açıklamaları
export const ROLE_NAMES: { [key: string]: string } = {
  [ROLES.ADMIN]: 'Yönetici',
  [ROLES.MANAGER]: 'Müdür',
  [ROLES.CASHIER]: 'Kasiyer',
  [ROLES.WAITER]: 'Garson',
  [ROLES.CHEF]: 'Şef',
  [ROLES.COOK]: 'Aşçı',
  [ROLES.HOST]: 'Karşılama Görevlisi'
}

// Modül İzinleri Matrisi
export const MODULE_PERMISSIONS: { [moduleId: string]: ModulePermission } = {
  'pos': {
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER, ROLES.CHEF],
    write: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CASHIER, ROLES.WAITER]
  },
  'kitchen': {
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.COOK, ROLES.WAITER],
    write: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF, ROLES.COOK]
  },
  'tables': {
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER, ROLES.HOST, ROLES.CHEF],
    write: [ROLES.ADMIN, ROLES.MANAGER, ROLES.WAITER, ROLES.HOST]
  },
  'reservations': {
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.HOST, ROLES.WAITER, ROLES.CHEF],
    write: [ROLES.ADMIN, ROLES.MANAGER, ROLES.HOST]
  },
  'staff': {
    read: [ROLES.ADMIN, ROLES.MANAGER, ROLES.CHEF],
    write: [ROLES.ADMIN, ROLES.MANAGER]
  },
  'admin': {
    read: [ROLES.ADMIN, ROLES.MANAGER],
    write: [ROLES.ADMIN]
  }
}

// Kullanıcının belirli bir modüle ve işlem tipine erişim izni var mı?
export const hasPermission = (role: string, moduleId: string, permissionType: PermissionType): boolean => {
  if (!MODULE_PERMISSIONS[moduleId]) {
    return false
  }

  return MODULE_PERMISSIONS[moduleId][permissionType].includes(role)
}

// Kullanıcının erişebileceği tüm modülleri döndür (read izni olanlar)
export const getAccessibleModules = (role: string): string[] => {
  return Object.keys(MODULE_PERMISSIONS).filter(moduleId => 
    hasPermission(role, moduleId, PermissionType.READ)
  )
}

// Kullanıcının işlem yapabileceği modülleri döndür (write izni olanlar)
export const getWritableModules = (role: string): string[] => {
  return Object.keys(MODULE_PERMISSIONS).filter(moduleId => 
    hasPermission(role, moduleId, PermissionType.WRITE)
  )
} 