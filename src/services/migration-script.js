/**
 * Şifre Migrasyon Scripti
 * 
 * Bu script mevcut düz metin şifreleri bcrypt hash'lerine dönüştürür
 * Veritabanında güvenli olmayan şifreleri günceller
 */

import { hashPassword, verifyPassword } from './auth.js'
import supabase from './supabase'

/**
 * Tüm restoranların şifrelerini hashli şifrelere günceller
 */
export async function migrateRestaurantPasswords() {
  try {
    console.log('Restoran şifre migrasyonu başlatılıyor...')
    
    // Tüm restoranları getir
    const { data: restaurants, error: fetchError } = await supabase
      .from('restaurants')
      .select('id, name, password_hash')
    
    if (fetchError) {
      console.error('Restoranlar alınırken hata:', fetchError)
      return { success: false, error: fetchError.message }
    }
    
    console.log(`${restaurants.length} restoran bulundu.`)
    
    // Her restoran için hash kontrolü yap
    const updates = []
    for (const restaurant of restaurants) {
      if (!restaurant.password_hash) {
        console.log(`UYARI: ${restaurant.name} (ID: ${restaurant.id}) restoranının şifresi yok, atlanıyor.`)
        continue
      }
      
      // Hash kontrolü yap (bcrypt formatında mı?)
      const isBcryptHash = restaurant.password_hash.startsWith('$2a$') || 
                          restaurant.password_hash.startsWith('$2b$') || 
                          restaurant.password_hash.startsWith('$2y$')
      
      if (!isBcryptHash) {
        console.log(`${restaurant.name} (ID: ${restaurant.id}) için düz metin şifre bulundu, hashleniyor...`)
        
        try {
          // Mevcut düz metin şifreyi hash'le
          const hashedPassword = await hashPassword(restaurant.password_hash)
          
          // Güncelleme listesine ekle
          updates.push({
            id: restaurant.id,
            name: restaurant.name,
            oldHash: restaurant.password_hash,
            newHash: hashedPassword
          })
        } catch (hashError) {
          console.error(`${restaurant.name} hashlenirken hata:`, hashError)
        }
      } else {
        console.log(`${restaurant.name} (ID: ${restaurant.id}) zaten güvenli hash kullanıyor, atlanıyor.`)
      }
    }
    
    console.log(`${updates.length} restoran şifresi hashlenmek için hazır.`)
    
    // İşlemi onaylatmak için check
    const shouldProceed = true // Gerçek uygulamada kullanıcıdan onay alınabilir
    
    if (!shouldProceed) {
      console.log('İşlem kullanıcı tarafından iptal edildi.')
      return { success: false, error: 'User cancelled' }
    }
    
    // Şifreleri güncelle
    let successCount = 0
    let errorCount = 0
    
    for (const update of updates) {
      try {
        const { error: updateError } = await supabase
          .from('restaurants')
          .update({ password_hash: update.newHash })
          .eq('id', update.id)
        
        if (updateError) {
          console.error(`${update.name} güncellenirken hata:`, updateError)
          errorCount++
        } else {
          console.log(`${update.name} (ID: ${update.id}) başarıyla güncellendi.`)
          successCount++
        }
      } catch (err) {
        console.error(`${update.name} güncellenirken beklenmeyen hata:`, err)
        errorCount++
      }
    }
    
    console.log('Migrasyon tamamlandı!')
    console.log(`Toplam: ${updates.length}, Başarılı: ${successCount}, Hatalı: ${errorCount}`)
    
    return { 
      success: true, 
      message: 'Migration completed', 
      stats: { total: updates.length, success: successCount, failed: errorCount } 
    }
    
  } catch (error) {
    console.error('Migrasyon sırasında beklenmeyen hata:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Bir şifrenin güvenlik durumunu kontrol eder
 */
export async function checkPasswordSecurity(plainPassword, hash) {
  // Hash formatı kontrolü
  const isBcryptHash = hash.startsWith('$2a$') || 
                      hash.startsWith('$2b$') || 
                      hash.startsWith('$2y$')
  
  return {
    isHashed: isBcryptHash,
    isSecure: isBcryptHash && plainPassword !== hash,
    needsMigration: !isBcryptHash
  }
}

// CLI tarafından doğrudan çalıştırılırsa
if (typeof require !== 'undefined' && require.main === module) {
  migrateRestaurantPasswords().then(result => {
    console.log('Migrasyon sonucu:', result)
  }).catch(err => {
    console.error('Hata:', err)
  })
}

export default { migrateRestaurantPasswords, checkPasswordSecurity } 