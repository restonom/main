import express from 'express';
import { createClient } from '@supabase/supabase-js';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.post('/api/restaurant-login', async (req, res) => {
  const { email, username, password, deviceId } = req.body;
  
  try {
    // Burada gerçek bir authentication yapılacak
    // Şimdilik mock data dönüyoruz
    const restaurant = { id: 1, name: 'Emirgan Sütiş', slug: 'emirgan-sutis' };
    
    // Cihaz kaydı
    if (deviceId) {
      await supabase.from('devices').upsert({
        restaurant_id: restaurant.id,
        device_id: deviceId,
        last_login: new Date().toISOString()
      });
    }
    
    res.json({ success: true, restaurant });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Giriş başarısız' });
  }
});

app.post('/api/user-login', async (req, res) => {
  const { pin, restaurantId } = req.body;
  
  try {
    // Burada PIN doğrulaması yapılacak
    // Şimdilik mock data dönüyoruz
    const user = { 
      id: 1, 
      name: 'Ahmet', 
      role: 'kasiyer',
      permissions: {
        modules: ['pos']
      }
    };
    
    res.json({ success: true, user });
  } catch (error) {
    res.status(400).json({ success: false, error: 'PIN hatalı' });
  }
});

app.get('/api/dashboard', async (req, res) => {
  const { restaurantId, userId } = req.query;
  
  try {
    // Kullanıcının yetkilerine göre modül listesi
    const modules = [
      { id: 'pos', name: 'POS', icon: 'cash-register' },
      { id: 'kitchen', name: 'Mutfak', icon: 'utensils' },
      { id: 'admin', name: 'Yönetim', icon: 'cog' }
    ];
    
    res.json({ success: true, modules });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Modüller yüklenemedi' });
  }
});

app.get('/api/menu', async (req, res) => {
  const { restaurantId } = req.query;
  
  try {
    // Menü öğeleri mock data
    const menuItems = [
      { id: 1, name: 'Sütlaç', price: 45.00, category: 'Tatlılar' },
      { id: 2, name: 'Kazandibi', price: 40.00, category: 'Tatlılar' },
      { id: 3, name: 'Türk Kahvesi', price: 25.00, category: 'İçecekler' }
    ];
    
    res.json({ success: true, menuItems });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Menü yüklenemedi' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { restaurantId, tableId, items, source } = req.body;
  
  try {
    // Sipariş oluşturma
    const order = {
      id: Math.floor(Math.random() * 1000),
      restaurant_id: restaurantId,
      table_id: tableId,
      items,
      status: 'Hazırlanıyor',
      source: source || 'pos',
      created_at: new Date().toISOString()
    };
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Sipariş oluşturulamadı' });
  }
});

// Server başlatma
app.listen(PORT, () => {
  console.log(`Server çalışıyor: http://localhost:${PORT}`);
}); 