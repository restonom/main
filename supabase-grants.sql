-- Supabase Erişim Yetkileri
-- Bu script, RLS politikalarının ve veritabanı izinlerinin düzgün şekilde yapılandırılmasını sağlar

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

-- Row Level Security (RLS) Etkinleştirme (eğer aktif değilse)
ALTER TABLE IF EXISTS public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.superadmins ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları - Public erişim için
-- Not: Bu politikalar geliştirme amaçlıdır, üretimde daha kısıtlayıcı olmalıdır

-- Önce mevcut politikaları temizle
DROP POLICY IF EXISTS "Allow public SELECT for restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow authenticated INSERT for restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for restaurants" ON public.restaurants;

DROP POLICY IF EXISTS "Allow public SELECT for staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated INSERT for staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for staff" ON public.staff;
DROP POLICY IF EXISTS "Allow authenticated DELETE for staff" ON public.staff;

-- Restaurants tablosu için basit politikalar
CREATE POLICY "Allow public SELECT for restaurants" 
  ON public.restaurants FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for restaurants" 
  ON public.restaurants FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for restaurants" 
  ON public.restaurants FOR UPDATE USING (true);

-- Staff tablosu için basit politikalar
CREATE POLICY "Allow public SELECT for staff" 
  ON public.staff FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for staff" 
  ON public.staff FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for staff" 
  ON public.staff FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for staff" 
  ON public.staff FOR DELETE USING (true);

-- Diğer tablolar için politikalar
-- staff_schedules için
DROP POLICY IF EXISTS "Allow public SELECT for staff_schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated INSERT for staff_schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for staff_schedules" ON public.staff_schedules;
DROP POLICY IF EXISTS "Allow authenticated DELETE for staff_schedules" ON public.staff_schedules;

CREATE POLICY "Allow public SELECT for staff_schedules" ON staff_schedules
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for staff_schedules" ON staff_schedules
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for staff_schedules" ON staff_schedules
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for staff_schedules" ON staff_schedules
  FOR DELETE USING (true);

-- tables için
DROP POLICY IF EXISTS "Allow public SELECT for tables" ON public.tables;
DROP POLICY IF EXISTS "Allow authenticated INSERT for tables" ON public.tables;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for tables" ON public.tables;
DROP POLICY IF EXISTS "Allow authenticated DELETE for tables" ON public.tables;

CREATE POLICY "Allow public SELECT for tables" ON tables
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for tables" ON tables
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for tables" ON tables
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for tables" ON tables
  FOR DELETE USING (true);

-- menu_items için
DROP POLICY IF EXISTS "Allow public SELECT for menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow authenticated INSERT for menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "Allow authenticated DELETE for menu_items" ON public.menu_items;

CREATE POLICY "Allow public SELECT for menu_items" ON menu_items
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for menu_items" ON menu_items
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for menu_items" ON menu_items
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for menu_items" ON menu_items
  FOR DELETE USING (true);

-- orders için
DROP POLICY IF EXISTS "Allow public SELECT for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated INSERT for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for orders" ON public.orders;
DROP POLICY IF EXISTS "Allow authenticated DELETE for orders" ON public.orders;

CREATE POLICY "Allow public SELECT for orders" ON orders
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for orders" ON orders
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for orders" ON orders
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for orders" ON orders
  FOR DELETE USING (true);

-- order_items için
DROP POLICY IF EXISTS "Allow public SELECT for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated INSERT for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated UPDATE for order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow authenticated DELETE for order_items" ON public.order_items;

CREATE POLICY "Allow public SELECT for order_items" ON order_items
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for order_items" ON order_items
  FOR INSERT WITH CHECK (true);
  
CREATE POLICY "Allow authenticated UPDATE for order_items" ON order_items
  FOR UPDATE USING (true);
  
CREATE POLICY "Allow authenticated DELETE for order_items" ON order_items
  FOR DELETE USING (true);

-- Veritabanını yenile ve önbelleği temizle
ANALYZE VERBOSE; 