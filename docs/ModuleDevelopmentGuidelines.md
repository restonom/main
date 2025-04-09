# Modül Geliştirme ve Güncelleme Yönergeleri

## Giriş

Bu doküman, projedeki mevcut modüllerin güncellenmesi ve yeni modül geliştirme süreçlerine ilişkin detaylı yönergeler sunar. Mevcut proje scriptleri (örn., StaffModule.vue, TablesModule.vue, AdminModule.vue ve POSLayout.vue) incelenerek, kod tabanının tutarlı, bakımı kolay ve genişletilebilir olması için en iyi uygulamalar belirlenmiştir.

## Modül Genel Bakışı

Proje, farklı işlevleri yöneten çeşitli modüllerden oluşmaktadır:

- **Personel Modülü**: Personel verilerinin yönetilmesi, detaylarının görüntülenmesi, vardiya planlaması (örn., `staff_schedules` tablosunu kullanarak) ve performans takibi gibi işlemleri içerir. Modül ayrıca, detaylı bilgiler için modal pencereler aracılığıyla bilgi sunmaktadır.
- **Masa Modülü**: Restoran masalarının düzenlenmesi, durumlarının izlenmesi ve detay bilgilerinin görüntülenmesi için sekmeli bir navigasyon sistemi kullanır.
- **Yönetim Modülü**: Özet, personel yönetimi, menü yönetimi ve rezervasyonlar gibi idari işlevleri kapsar. Dinamik sekme navigasyonu kullanılarak içerikler ayrıştırılır.
- **POS Düzeni**: Satış noktası arayüzünü yönetir. Son güncellemelerle, modül içindeki ek sidebar kaldırılarak ana uygulamanın sidebar yapısı kullanılmıştır.

## Önemli Hususlar

1. **Tutarlı UI Düzeni ve Yapısı**
   - Modül üzerinde en üstte yalnızca modül adı bulunmalı, altında sekme navigasyonu yer almalıdır.
   - İçerik alanı kaydırılabilir olmalı ve taşma (overflow) durumları doğru yönetilmelidir.
   - Modal pencereler, diğer UI elemanlarının (örneğin tablo başlıkları) üzerinde görünecek şekilde yüksek z-index değerleriyle düzenlenmelidir.

2. **Veri Entegrasyonu ve Supabase Kullanımı**
   - Tüm veri getirme, güncelleme ve silme işlemleri Supabase sorguları kullanılarak gerçekleştirilmelidir.
   - Doğru tablo referansları kullanılmalıdır. Örneğin, vardiya planlaması için `shifts` yerine `staff_schedules` tablosu kullanılmalıdır.
   - Bağlantı veya sorgu hatalarını yönetmek için uygun hata yakalama (try-catch) mekanizmaları eklenmelidir.

3. **Yeni Modül Geliştirme Süreci**
   - **Temel Yapı Kurulumu**: Yeni bir modül geliştirilirken, mevcut modüllerdeki ortak yapılar (header, sekme navigasyonu, içerik alanı) örnek alınmalıdır.
   - **Dinamik Sekmeler**: Vue'nun `v-for` direktifiyle dinamik sekme navigasyonu oluşturulmalı, böylece kod tekrarından kaçınılır ve tasarım tutarlılığı sağlanır.
   - **Veri Bağlama**: Vue'nun Composition API'si kullanılarak, Supabase'den alınan veriler reaktif değişkenlerde saklanmalı ve durum yönetimi doğru uygulanmalıdır.
   - **Responsive Tasarım**: Modül, farklı cihazlarda optimum kullanıcı deneyimi sunacak şekilde responsive olarak tasarlanmalıdır.

4. **Mevcut Modüllerin Güncellenmesi**
   - **Personel Modülü**: Veritabanı sorgularının doğru tabloları (örneğin, `staff_schedules`) referans aldığından emin olunmalı. Modal pencerelerin z-index değerleri ayarlanarak UI katmanları düzgün hale getirilmelidir.
   - **Masa ve Yönetim Modülleri**: Header ve sekme yapılarının tutarlılığı kontrol edilmeli, gerekirse dinamik navigasyon güncellenmeli ve verilerin doğru şekilde gösterildiği doğrulanmalıdır.
   - **POS Düzeni**: Modül içindeki yerel sidebar kaldırılarak, ana uygulamanın sidebar yapısına geçilmelidir. Alt yönlendirmelerin (child routes) doğru render edildiği kontrol edilmelidir.

5. **Test ve Doğrulama**
   - **UI Testleri**: Modal pencereler, sekme navigasyonları ve içerik alanlarının üst üste binme veya görünürlük sorunları manuel olarak test edilmelidir.
   - **Veri Bütünlüğü**: Supabase sorgularının doğru veri tablolarından çekildiği ve verilerin doğru formatta döndüğü doğrulanmalıdır.
   - **Modüller Arası Tutarlılık**: Bir modülde yapılan değişikliklerin diğer modülleri etkilemediğinden emin olunmalı, CSS sınıfları, modal z-index değerleri ve reaktif veri yönetimi tüm modüller için uyumlu çalışmalıdır.

## Kod Yapısı ve En İyi Uygulamalar

- **Vue.js Composition API**: Komponent geliştirme sürecinde `<script setup>` kullanılarak daha modern ve kısa kod yapıları tercih edilmelidir.
- **Dinamik UI Elemanları**: Tekrardan kaçınmak için sekme kontrol elemanları `v-for` kullanılarak oluşturulmalıdır.
- **Reaktivite ve Durum Yönetimi**: Supabase'den gelen veriler reaktif değişkenlerde saklanmalı ve UI güncellemeleri otomatik olarak takip edilmelidir.
- **Hata Yönetimi**: Asenkron fonksiyonlar içerisinde try-catch blokları kullanılarak API hataları düzgün şekilde yakalanmalı ve kullanıcıya anlamlı hata mesajları sunulmalıdır.
- **Stil ve Z-Index Yönetimi**: Modal ve header için stil kuralları net şekilde tanımlanmalı; Tailwind CSS gibi yardımcı sınıflarla z-index düzenlemesi optimize edilmelidir.

## Sonuç

Yukarıda belirtilen yönergeleri takip etmek, modüllerin tutarlı, bakımı kolay ve genişletilebilir olmasını sağlar. Yeni modüller geliştirilirken mevcut modüller referans alınmalı, yapılan güncellemeler titizlikle test edilmeli ve proje yönetimi araçları ile değişiklikler kaydedilmelidir.

---

Daha fazla bilgi veya modül geliştirme/güncelleme süreçlerine ilişkin sorular için lütfen proje deposuna ve güncel commit mesajlarına başvurunuz. 