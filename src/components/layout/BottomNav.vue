<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const tabs = [
  { path: '/', icon: '📊', label: 'Dashboard' },
  { path: '/mois', icon: '📅', label: 'Mois' },
  { path: '/ajouter', icon: '➕', label: 'Ajouter' },
  { path: '/config', icon: '⚙️', label: 'Config' }
]
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10"
       style="background: rgba(15, 12, 41, 0.92); backdrop-filter: blur(16px); padding-bottom: env(safe-area-inset-bottom);">
    <div class="flex max-w-md mx-auto">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.path"
        :to="tab.path"
        class="flex-1 flex flex-col items-center py-3 gap-0.5 text-[10px] font-medium transition-colors no-underline"
        :class="route.path === tab.path ? 'text-violet-400' : 'text-gray-500'"
      >
        <span class="text-xl leading-tight">{{ tab.icon }}</span>
        {{ tab.label }}
      </RouterLink>
    </div>
  </nav>
</template>
