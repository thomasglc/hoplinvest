<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import BottomNav from './components/layout/BottomNav.vue'
import { useAuthStore } from './stores/auth'
import { useInvestmentsStore } from './stores/investments'
import { useSettingsStore } from './stores/settings'

const route = useRoute()
const auth = useAuthStore()
const investments = useInvestmentsStore()
const settings = useSettingsStore()

// Load user data whenever auth state becomes true (login or session restore)
watch(() => auth.isAuthenticated, async (authenticated) => {
  if (authenticated) {
    await Promise.all([investments.fetchTransactions(), settings.fetchSettings()])
  } else {
    investments.clearLocal()
    settings.clearLocal()
  }
}, { immediate: true })

const showNav = () => route.path !== '/login'
</script>

<template>
  <div style="min-height: 100dvh">
    <main class="max-w-md mx-auto px-4 pb-24" style="padding-top: max(1.5rem, env(safe-area-inset-top))">
      <RouterView />
    </main>
    <BottomNav v-if="showNav()" />
  </div>
</template>
