<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Icon, addCollection } from '@iconify/vue'
import ionIcons from '@iconify-json/ion/icons.json'

addCollection(ionIcons)

const route = useRoute()

const tabs = [
  { path: '/', icon: 'ion:stats-chart-outline', label: 'Dashboard' },
  { path: '/mois', icon: 'ion:calendar-outline', label: 'Mois' },
  { path: '/ajouter', icon: 'ion:add-circle-outline', label: 'Ajouter' },
  { path: '/config', icon: 'ion:settings-outline', label: 'Config' }
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
        class="flex-1 flex flex-col items-center py-3 gap-1 text-[10px] font-medium transition-colors no-underline"
        :class="route.path === tab.path ? 'text-violet-400' : 'text-gray-500'"
      >
        <Icon :icon="tab.icon" class="text-[22px] leading-none" />
        {{ tab.label }}
      </RouterLink>
    </div>
  </nav>
</template>
