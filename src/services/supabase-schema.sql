-- Supabase specific helper function (if needed)
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create superadmins table
CREATE TABLE IF NOT EXISTS superadmins (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID REFERENCES auth.users(id),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create restaurants table
CREATE TABLE IF NOT EXISTS restaurants (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID REFERENCES auth.users(id),
  email TEXT,
  logo_url TEXT,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add the password_hash column if it doesn't exist
ALTER TABLE public.restaurants
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Create function to generate slugs from restaurant names
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT) 
RETURNS TEXT AS $$
DECLARE
  result TEXT;
  i INTEGER := 0;
BEGIN
  -- Replace non-alphanumeric characters with dashes, convert to lowercase, and trim dashes from ends
  result := regexp_replace(lower(input_text), '[^a-z0-9]+', '-', 'g');
  result := regexp_replace(result, '^-+|-+$', '', 'g');
  
  -- Check for uniqueness
  WHILE EXISTS (SELECT 1 FROM restaurants WHERE slug = result || CASE WHEN i > 0 THEN '-' || i::TEXT ELSE '' END) LOOP
    i := i + 1;
  END LOOP;
  
  -- Append number if needed
  IF i > 0 THEN
    result := result || '-' || i::TEXT;
  END IF;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug for restaurants
CREATE OR REPLACE FUNCTION restaurants_before_insert_update()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.slug IS NULL OR NEW.slug = '') THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger first if it exists
DROP TRIGGER IF EXISTS restaurants_before_insert_trigger ON public.restaurants;

CREATE TRIGGER restaurants_before_insert_trigger
BEFORE INSERT ON restaurants
FOR EACH ROW
EXECUTE PROCEDURE restaurants_before_insert_update();

-- Create function to create superadmins table if it doesn't exist
CREATE OR REPLACE FUNCTION create_superadmins_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  -- Check if the table already exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'superadmins'
  ) THEN
    -- Create the superadmins table
    CREATE TABLE superadmins (
      id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      user_id UUID REFERENCES auth.users(id),
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Enable row level security
    ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Enable read access for authenticated users" ON superadmins 
      FOR SELECT USING (auth.role() = 'authenticated');
    
    CREATE POLICY "Enable all access for service role" ON superadmins 
      FOR ALL USING (auth.role() = 'service_role');
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create staff table
CREATE TABLE IF NOT EXISTS staff (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL, -- 'admin', 'manager', 'waiter', 'chef', etc.
  pin TEXT NOT NULL,
  permissions JSONB DEFAULT '{"modules": ["pos"]}',
  active BOOLEAN DEFAULT TRUE,
  hire_date DATE DEFAULT CURRENT_DATE,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT staff_restaurant_email_unique UNIQUE (restaurant_id, email)
);

-- Create staff_schedules table for shift planning
CREATE TABLE IF NOT EXISTS staff_schedules (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_leave BOOLEAN DEFAULT FALSE,
  leave_type TEXT, -- 'sick', 'vacation', 'personal', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff_performance table for tracking performance
CREATE TABLE IF NOT EXISTS staff_performance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  staff_id BIGINT REFERENCES staff(id) ON DELETE CASCADE,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  orders_processed INTEGER DEFAULT 0,
  sales_amount DECIMAL(10, 2) DEFAULT 0,
  hours_worked DECIMAL(5, 2) DEFAULT 0,
  efficiency_score INTEGER DEFAULT 0, -- percentage value
  rating INTEGER DEFAULT 0, -- 1-5 rating
  average_order_time INTEGER, -- in minutes
  customer_feedback_score DECIMAL(3, 2), -- 1.00 to 5.00
  attendance_status TEXT, -- 'on_time', 'late', 'absent', etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tables table (for restaurant tables)
CREATE TABLE IF NOT EXISTS tables (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  capacity INTEGER DEFAULT 4,
  status TEXT DEFAULT 'empty', -- 'empty', 'occupied', 'reserved'
  location TEXT DEFAULT 'main', -- 'main', 'terrace', 'bar', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (restaurant_id, number)
);

-- Create menu_items table
CREATE TABLE IF NOT EXISTS menu_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE SET NULL,
  table_id BIGINT REFERENCES tables(id) ON DELETE SET NULL,
  staff_id BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'preparing', -- 'preparing', 'ready', 'completed', 'cancelled'
  source TEXT DEFAULT 'pos', -- 'pos', 'qr'
  total_amount DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  order_id BIGINT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id BIGINT REFERENCES menu_items(id) ON DELETE SET NULL,
  name TEXT NOT NULL, -- Store name separately in case menu item changes
  price DECIMAL(10, 2) NOT NULL, -- Store price separately in case menu item price changes
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id BIGINT REFERENCES staff(id) ON DELETE SET NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  active BOOLEAN DEFAULT TRUE,
  starting_cash DECIMAL(10, 2) DEFAULT 0,
  ending_cash DECIMAL(10, 2),
  notes TEXT
);

-- Create reservations table
CREATE TABLE IF NOT EXISTS reservations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restaurant_id BIGINT REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id BIGINT REFERENCES tables(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  people INTEGER NOT NULL DEFAULT 2,
  duration INTEGER DEFAULT 120, -- in minutes
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_restaurants_slug ON restaurants(slug);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
CREATE INDEX IF NOT EXISTS idx_tables_restaurant_id ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_staff_restaurant_id ON staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_id ON staff_schedules(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_schedules_date ON staff_schedules(date);
CREATE INDEX IF NOT EXISTS idx_staff_performance_staff_id ON staff_performance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_performance_date ON staff_performance(date);
CREATE INDEX IF NOT EXISTS idx_shifts_user_id ON shifts(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at

-- restaurants
DROP TRIGGER IF EXISTS set_timestamp ON public.restaurants;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON restaurants
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- staff
DROP TRIGGER IF EXISTS set_timestamp ON public.staff;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON staff
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- staff_schedules
DROP TRIGGER IF EXISTS set_timestamp ON public.staff_schedules;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON staff_schedules
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- staff_performance
DROP TRIGGER IF EXISTS set_timestamp ON public.staff_performance;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON staff_performance
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- tables
DROP TRIGGER IF EXISTS set_timestamp ON public.tables;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON tables
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- menu_items
DROP TRIGGER IF EXISTS set_timestamp ON public.menu_items;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- orders
DROP TRIGGER IF EXISTS set_timestamp ON public.orders;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- reservations
DROP TRIGGER IF EXISTS set_timestamp ON public.reservations;
CREATE TRIGGER set_timestamp
BEFORE UPDATE ON reservations
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

-- Audit Logs tablosu
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    restaurant_id BIGINT REFERENCES restaurants(id),
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login', 'logout'
    table_name TEXT NOT NULL, -- İşlem yapılan tablo adı
    record_id UUID, -- İşlem yapılan kaydın ID'si
    old_data JSONB, -- Değişiklik öncesi veri
    new_data JSONB, -- Değişiklik sonrası veri
    ip_address TEXT,
    user_agent TEXT,
    additional_info JSONB -- Ek bilgiler
);

-- Audit log oluşturma fonksiyonu
CREATE OR REPLACE FUNCTION create_audit_log(
    p_user_id UUID,
    p_restaurant_id BIGINT,
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_old_data JSONB,
    p_new_data JSONB,
    p_ip_address TEXT,
    p_user_agent TEXT,
    p_additional_info JSONB
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO audit_logs (
        user_id,
        restaurant_id,
        action_type,
        table_name,
        record_id,
        old_data,
        new_data,
        ip_address,
        user_agent,
        additional_info
    ) VALUES (
        p_user_id,
        p_restaurant_id,
        p_action_type,
        p_table_name,
        p_record_id,
        p_old_data,
        p_new_data,
        p_ip_address,
        p_user_agent,
        p_additional_info
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================ --
-- Consolidated Row Level Security Policies (Idempotent)        --
-- ============================================================ --

-- Ensure RLS is enabled for all relevant tables first (already done above)

-- superadmins (Assuming RLS enabled in function or manually)
-- If superadmins table RLS is not enabled elsewhere, add:
-- ALTER TABLE superadmins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.superadmins;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.superadmins;
CREATE POLICY "Enable read access for authenticated users" ON public.superadmins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.superadmins FOR ALL USING (auth.role() = 'service_role');

-- restaurants
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.restaurants;
DROP POLICY IF EXISTS "Enable specific read access for login" ON public.restaurants;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.restaurants;
DROP POLICY IF EXISTS "Enable access for anon users" ON public.restaurants;

-- Allow service_role full access (Kept)
CREATE POLICY "Enable all access for service role" ON public.restaurants
    FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to read specific columns needed for login check (NEW/MODIFIED)
CREATE POLICY "Enable specific read access for login" ON public.restaurants
    FOR SELECT
    TO authenticated -- Changed from just USING to specify role
    USING (true); -- Allow reading any restaurant for login check

-- Allow anonymous users to access restaurants table (NEW)
CREATE POLICY "Enable access for anon users" ON public.restaurants
    FOR ALL
    TO anon
    USING (true);

-- staff
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.staff;
DROP POLICY IF EXISTS "Allow anon select for PIN check" ON public.staff; -- Eski politikayı sil (varsa)

-- Allow anon users to select staff for PIN check (LESS SECURE, but fixes current logic)
CREATE POLICY "Allow anon select for PIN check" ON public.staff
    FOR SELECT
    TO anon
    USING (true); -- Allows anon to select any staff, filtering happens in the query

CREATE POLICY "Enable all access for service role" ON public.staff
    FOR ALL
    USING (auth.role() = 'service_role');

-- staff_schedules
DROP POLICY IF EXISTS "Kimliği doğrulanmış kullanıcılar için okuma erişimini etkinleştir" ON public.staff_schedules; -- Keep original name if exists
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff_schedules;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.staff_schedules;
-- Add specific policies drop here if needed
-- DROP POLICY IF EXISTS "Staff can manage their own schedules" ON public.staff_schedules;
CREATE POLICY "Enable read access for authenticated users" ON public.staff_schedules FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.staff_schedules FOR ALL USING (auth.role() = 'service_role');
-- Example Specific Policy (Recreate):
-- CREATE POLICY "Staff can manage their own schedules" ON public.staff_schedules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM staff WHERE staff.id = staff_schedules.staff_id AND staff.user_id = auth.uid()));

-- staff_performance
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.staff_performance;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.staff_performance;
CREATE POLICY "Enable read access for authenticated users" ON public.staff_performance FOR SELECT TO authenticated USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.staff_performance FOR ALL USING (auth.role() = 'service_role');

-- tables
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.tables;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.tables;
CREATE POLICY "Enable read access for authenticated users" ON public.tables FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.tables FOR ALL USING (auth.role() = 'service_role');

-- menu_items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.menu_items;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.menu_items;
DROP POLICY IF EXISTS "Enable read access for anonymous users" ON public.menu_items;
CREATE POLICY "Enable read access for authenticated users" ON public.menu_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.menu_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable read access for anonymous users" ON public.menu_items FOR SELECT USING (auth.role() = 'anon' AND active = true);

-- orders
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.orders;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.orders;
DROP POLICY IF EXISTS "Enable insert access for anonymous users" ON public.orders;
CREATE POLICY "Enable read access for authenticated users" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.orders FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert access for anonymous users" ON public.orders FOR INSERT WITH CHECK (auth.role() = 'anon' AND source = 'qr');

-- order_items
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.order_items;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.order_items;
DROP POLICY IF EXISTS "Enable insert access for anonymous users" ON public.order_items;
CREATE POLICY "Enable read access for authenticated users" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.order_items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Enable insert access for anonymous users" ON public.order_items FOR INSERT WITH CHECK (auth.role() = 'anon');

-- shifts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.shifts;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.shifts;
CREATE POLICY "Enable read access for authenticated users" ON public.shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.shifts FOR ALL USING (auth.role() = 'service_role');

-- reservations
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.reservations;
DROP POLICY IF EXISTS "Enable all access for service role" ON public.reservations;
CREATE POLICY "Enable read access for authenticated users" ON public.reservations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable all access for service role" ON public.reservations FOR ALL USING (auth.role() = 'service_role');

-- audit_logs RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "SuperAdmin can view all audit logs" ON public.audit_logs;
CREATE POLICY "SuperAdmin can view all audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM superadmins
            WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Restaurant admins can view their audit logs" ON public.audit_logs;
CREATE POLICY "Restaurant admins can view their audit logs" ON public.audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM staff
            WHERE user_id = auth.uid()
            AND restaurant_id = audit_logs.restaurant_id
            AND role IN ('admin', 'manager', 'owner')
        )
    );

-- Create RLS Policies section to enable public access for development
-- Warning: These are permissive policies for development only!

-- Enable RLS on all tables
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for restaurants table
CREATE POLICY "Allow public SELECT for restaurants" ON restaurants
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for restaurants" ON restaurants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for restaurants" ON restaurants
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for staff table
CREATE POLICY "Allow public SELECT for staff" ON staff
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for staff" ON staff
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for staff" ON staff
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for staff" ON staff
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for staff_schedules table
CREATE POLICY "Allow public SELECT for staff_schedules" ON staff_schedules
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for staff_schedules" ON staff_schedules
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for staff_schedules" ON staff_schedules
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for staff_schedules" ON staff_schedules
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for tables table
CREATE POLICY "Allow public SELECT for tables" ON tables
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for tables" ON tables
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for tables" ON tables
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for tables" ON tables
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for menu_items table
CREATE POLICY "Allow public SELECT for menu_items" ON menu_items
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for menu_items" ON menu_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for menu_items" ON menu_items
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for menu_items" ON menu_items
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for orders table
CREATE POLICY "Allow public SELECT for orders" ON orders
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for orders" ON orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for orders" ON orders
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for orders" ON orders
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Create permissive policies for order_items table
CREATE POLICY "Allow public SELECT for order_items" ON order_items
  FOR SELECT USING (true);
  
CREATE POLICY "Allow authenticated INSERT for order_items" ON order_items
  FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated UPDATE for order_items" ON order_items
  FOR UPDATE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');
  
CREATE POLICY "Allow authenticated DELETE for order_items" ON order_items
  FOR DELETE USING (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- END OF FILE 