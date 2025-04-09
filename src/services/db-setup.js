import supabase from './supabase'

/**
 * Supabase veritabanı şemasını oluşturmak için script
 * 
 * Bu script, gerekli tabloları ve ilişkileri oluşturur.
 * Sadece geliştirme ortamında veya ilk kurulumda çalıştırılmalıdır.
 */
async function setupDatabase() {
  try {
    console.log('Database setup starting...')
    
    // Tablonun var olup olmadığını kontrol et ve create-if-not-exists yap
    const tablesExist = await checkTablesExist()
    
    if (tablesExist) {
      console.log('All tables already exist. Skipping database setup.')
      return
    }
    
    // Restaurants tablosu
    const { error: restaurantsError } = await supabase.rpc('create_restaurants_table')
    if (restaurantsError) throw restaurantsError
    console.log('Restaurants table created')
    
    // Staff tablosu
    const { error: staffError } = await supabase.rpc('create_staff_table')
    if (staffError) throw staffError
    console.log('Staff table created')
    
    // Tables (Masalar) tablosu
    const { error: tablesError } = await supabase.rpc('create_tables_table')
    if (tablesError) throw tablesError
    console.log('Tables table created')
    
    // Menu Items tablosu
    const { error: menuError } = await supabase.rpc('create_menu_items_table')
    if (menuError) throw menuError
    console.log('Menu Items table created')
    
    // Orders tablosu
    const { error: ordersError } = await supabase.rpc('create_orders_table')
    if (ordersError) throw ordersError
    console.log('Orders table created')
    
    // Order Items tablosu
    const { error: orderItemsError } = await supabase.rpc('create_order_items_table')
    if (orderItemsError) throw orderItemsError
    console.log('Order Items table created')
    
    // Shifts tablosu
    const { error: shiftsError } = await supabase.rpc('create_shifts_table')
    if (shiftsError) throw shiftsError
    console.log('Shifts table created')
    
    // Reservations tablosu
    const { error: reservationsError } = await supabase.rpc('create_reservations_table')
    if (reservationsError) throw reservationsError
    console.log('Reservations table created')
    
    console.log('Database setup completed successfully')
  } catch (error) {
    console.error('Database setup failed:', error)
  }
}

// Tabloların var olup olmadığını kontrol et
async function checkTablesExist() {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (error) throw error
    
    const requiredTables = [
      'restaurants',
      'staff',
      'tables',
      'menu_items',
      'orders',
      'order_items',
      'shifts',
      'reservations'
    ]
    
    const existingTables = data.map(t => t.table_name)
    const allTablesExist = requiredTables.every(table => existingTables.includes(table))
    
    return allTablesExist
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}

export default setupDatabase 