# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

# Restonom POS Sistemi

Restonom, restoran yönetimi için geliştirilmiş modern bir POS (Point of Sale) sistemidir.

## Güvenlik Yapılandırması

Uygulama, güvenli bir SaaS modeli için aşağıdaki güvenlik iyileştirmelerini içerir:

### Şifre Güvenliği

- **Şifre Hashleme**: Tüm şifreler bcrypt algoritması kullanılarak hashlenmiştir
- **Geçiş Dönemi Yönetimi**: Eski düz metin şifreler için otomatik hash güncellemesi
- **Şifre Doğrulama**: Güvenli karşılaştırma mekanizması

### Kimlik Doğrulama

- **Role-based Authentication**: Farklı kullanıcı rolleri için özelleştirilmiş doğrulama
- **SuperAdmin**: Supabase Auth ile güvenli kimlik doğrulama
- **Restaurant & Staff**: Özel kimlik doğrulama mekanizması

### Veritabanı Güvenliği

- **RLS (Row Level Security)** politikaları ile her kullanıcı sadece yetkisi olan verilere erişebilir
- **Güvenli API Erişimi**: Supabase ile entegre çalışan, yetkilendirme tabanlı erişim

## Nasıl Çalıştırılır

1. Gereksinimleri yükleyin:
   ```
   npm install
   ```

2. Geliştirme sunucusunu başlatın:
   ```
   npm run dev
   ```

## Şifre Migrasyonu

Eski sistemden taşınan düz metin şifreleri bcrypt formatına çevirmek için migrasyon script'i kullanılabilir:

```javascript
// Migrasyon scripti çalıştırma
import { migrateRestaurantPasswords } from './src/services/migration-script';
await migrateRestaurantPasswords();
```

## Güvenlik Notları

- **API Anahtarları**: Client tarafında sadece public RLS politikalarına erişim sağlayan anahtarlar kullanın
- **Hassas İşlemler**: SuperAdmin gibi hassas işlemler için sunucu taraflı API'ler kullanın
- **Veritabanı Erişimi**: Tüm veritabanı erişimi RLS politikaları üzerinden sağlanmalıdır
- **İstemci Erişimi**: Supabase client sadece izin verilen politikalardaki verilere erişebilir

## SaaS Yapılandırma Kontrolü

Yeni bir ortama dağıtmadan önce aşağıdaki kontrolleri yapın:

1. `.env` dosyasında doğru Supabase anahtarlarının kullanıldığından emin olun
2. Veritabanında RLS politikalarının doğru yapılandırıldığını kontrol edin
3. SuperAdmin kullanıcısının tanımlandığından emin olun
4. Şifre migrasyonunu çalıştırarak tüm şifrelerin güvenli formatta olduğunu doğrulayın

## Veritabanı Yetkilendirme Sorunları

Eğer projeyi çalıştırırken 401 Unauthorized veya yetki hataları alıyorsanız, bu Supabase RLS (Row Level Security) politikalarının veya veritabanı izinlerinin düzgün yapılandırılmamış olmasından kaynaklanabilir. Bu sorunu çözmek için:

1. Supabase Dashboard'a giriş yapın
2. SQL Editörü açın
3. En azından aşağıdaki temel SQL komutlarını çalıştırın:

```sql
-- Şemalara izinler ver
GRANT usage ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- Tüm tablolarda erişim izinleri ver
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Gelecekte oluşturulacak nesnelerde izinleri otomatik ayarla
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- Temel tablo için örnek politika
DROP POLICY IF EXISTS "Allow public SELECT for restaurants" ON public.restaurants;
CREATE POLICY "Allow public SELECT for restaurants" ON restaurants FOR SELECT USING (true);
```

4. Daha kapsamlı politikalar için proje kökündeki `supabase-grants.sql` dosyasını kullanın
5. RLS politikalarını "Security & Policies" bölümünden kontrol edin ve gerekli tablolar için izinleri etkinleştirin

Bu yetki hataları genellikle Prisma gibi araçlar kullanıldığında veya migrasyon işlemleri sonrasında görülebilir.

---

© 2024 Restonom. Tüm hakları saklıdır.



-- Kullanıcı oluşturulduktan sonra, kullanıcının UUID'sini bulun
-- ve superadmin tablosuna ekleyin
INSERT INTO public.superadmins (
  user_id,
  email,
  name,
  is_active,
  created_at,
  updated_at
) VALUES (
  '5b0a601d-2990-419e-8deb-e5f7af0ef118', -- Supabase UI'dan kullanıcının UUID'sini bulun
  'mail@mail.com',
  'Super Admin',
  true,
  now(),
  now()
);
#   r e s t  
 