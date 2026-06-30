<script setup lang="ts">
import BottomNav from './components/layout/BottomNav.vue'
</script>

<template>
  <div class="min-h-screen">
    <main class="max-w-md mx-auto px-4 pt-6 pb-24">
      <RouterView />
    </main>
    <BottomNav />
  </div>
</template>
