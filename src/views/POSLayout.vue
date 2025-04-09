<template>
  <!-- Sidebar'ı kaldırdık, sadece içerik bölümünü bıraktık -->
  <div class="flex-1 flex flex-col overflow-hidden">
    <!-- Content loaded by child routes -->
    <main class="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-4">
      <router-view /> <!-- Child routes like /pos/tables will be rendered here -->
    </main>
  </div>
</template>

<script setup lang="ts">
// Sidebar import'unu kaldırdık, çünkü artık ana uygulama yapısındaki sidebar'ı kullanıyoruz
</script>

<style scoped>
/* Add styles specific to the POS layout if needed */
</style> 