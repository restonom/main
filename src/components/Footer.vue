<template>
  <footer class="bg-white border-t border-gray-200 py-4 px-6 text-sm text-gray-600">
    <div class="text-center">
      &copy; {{ currentYear }} Restonom
    </div>
  </footer>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// Mevcut yıl için computed değer
const currentYear = computed(() => {
  return new Date().getFullYear()
})
</script>

<style scoped>
/* Footer özel stilleri */
</style> 