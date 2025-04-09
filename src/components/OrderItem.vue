<template>
  <div class="flex justify-between items-center py-3 px-2 border-b border-gray-100 last:border-none hover:bg-gray-50 rounded-md transition-colors">
    <div class="flex items-center">
      <div v-if="editable" class="flex items-center space-x-1 mr-3">
        <button 
          @click="decreaseQuantity"
          class="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-red-500 transition-colors"
          :class="{'opacity-50 cursor-not-allowed': quantity <= 1}"
        >
          <span class="material-icons-outlined text-sm">{{ quantity <= 1 ? 'delete' : 'remove' }}</span>
        </button>
        <span class="text-gray-800 w-6 text-center font-medium">{{ quantity }}</span>
        <button 
          @click="increaseQuantity"
          class="w-7 h-7 flex items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-primary transition-colors"
        >
          <span class="material-icons-outlined text-sm">add</span>
        </button>
      </div>
      <div v-else class="mr-3 font-medium px-2 py-0.5 bg-primary bg-opacity-10 text-primary rounded-full text-xs">
        {{ quantity }}x
      </div>
      <div class="flex-1 min-w-0">
        <div class="text-sm font-medium truncate">{{ name }}</div>
        <div class="text-xs text-gray-500 flex items-center">
          <span class="material-icons-outlined text-xs mr-1">payments</span>
          {{ formatPrice(price) }} ₺
        </div>
        <div v-if="notes" class="text-xs text-gray-500 mt-1 flex items-center">
          <span class="material-icons-outlined text-xs mr-1">notes</span>
          <span class="bg-gray-100 px-1.5 py-0.5 rounded-full truncate">{{ notes }}</span>
        </div>
      </div>
    </div>
    <div class="text-gray-800 font-medium ml-2">
      {{ formatPrice(price * quantity) }} ₺
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps<{
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  editable?: boolean;
}>()

const emit = defineEmits(['increase', 'decrease'])

const increaseQuantity = () => {
  emit('increase', props.id)
}

const decreaseQuantity = () => {
  emit('decrease', props.id)
}

const formatPrice = (price: number) => {
  return price.toFixed(2)
}
</script> 