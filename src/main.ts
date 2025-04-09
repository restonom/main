import { createApp } from 'vue'
import './assets/main.css'
import App from './App.vue'
import router from './router'
import setupDatabase from './services/db-setup'

// İkon kütüphaneleri
import '@fortawesome/fontawesome-free/css/all.css'
import { Icon } from '@iconify/vue'

const app = createApp(App)

// Global bileşenler
app.component('IconifyIcon', Icon)

app.use(router)
app.mount('#app')

// Veritabanı kurulumu
const urlParams = new URLSearchParams(window.location.search)
const setupDb = urlParams.get('setup-db')

// Eğer URL'de setup-db parametresi varsa veritabanını kur
if (setupDb === 'true') {
  setupDatabase()
    .then(() => {
      console.log('Database setup completed')
      
      // Setup tamamlandıktan sonra URL'i temizle ve sayfayı yenile
      const newUrl = window.location.pathname
      window.history.pushState({}, '', newUrl)
      window.location.reload()
    })
    .catch((error: unknown) => {
      console.error('Database setup failed:', error)
    })
}
