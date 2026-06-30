<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInvestmentsStore } from '../stores/investments'
import { calculateTransaction } from '../utils/brokerage'
import { generateId } from '../utils/id'

const router = useRouter()
const investments = useInvestmentsStore()

const today = new Date().toISOString().slice(0, 10)
const date = ref(today)
const quantity = ref<number | ''>('')
const executionPrice = ref<number | ''>('')
const submitting = ref(false)
const success = ref(false)

const calc = computed(() => {
  const qty = Number(quantity.value)
  const price = Number(executionPrice.value)
  if (!qty || !price || qty <= 0 || price <= 0) return null
  return calculateTransaction(qty, price)
})

async function submit() {
  if (!calc.value || !date.value || !quantity.value || !executionPrice.value) return
  submitting.value = true
  investments.addTransaction({
    id: generateId(),
    date: date.value,
    label: 'iShares MSCI World Swap PEA',
    quantity: Number(quantity.value),
    executionPrice: Number(executionPrice.value),
    grossAmount: calc.value.grossAmount,
    brokerage: calc.value.brokerage,
    netAmount: calc.value.netAmount,
    currency: 'EUR',
    source: 'manual'
  })
  success.value = true
  submitting.value = false
  setTimeout(() => {
    success.value = false
    date.value = today
    quantity.value = ''
    executionPrice.value = ''
    router.push('/')
  }, 1200)
}

function fmtEur(val: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(val))
}
</script>

<template>
  <div>
    <h1 class="text-white font-bold text-xl mb-6">Ajouter une transaction</h1>

    <form @submit.prevent="submit" class="space-y-4">
      <!-- Date -->
      <div class="glass-card p-4">
        <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Date</label>
        <input
          v-model="date"
          type="date"
          required
          class="w-full bg-transparent text-white text-base outline-none"
          style="color-scheme: dark;"
        />
      </div>

      <!-- Quantity -->
      <div class="glass-card p-4">
        <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Quantité (parts)</label>
        <input
          v-model.number="quantity"
          type="number"
          min="1"
          step="1"
          placeholder="ex: 241"
          required
          class="w-full bg-transparent text-white text-2xl font-bold outline-none placeholder-gray-700"
        />
      </div>

      <!-- Execution price -->
      <div class="glass-card p-4">
        <label class="text-gray-400 text-xs uppercase tracking-widest block mb-2">Prix d'exécution (€)</label>
        <input
          v-model.number="executionPrice"
          type="number"
          min="0.0001"
          step="0.0001"
          placeholder="ex: 6.2345"
          required
          class="w-full bg-transparent text-white text-2xl font-bold outline-none placeholder-gray-700"
        />
      </div>

      <!-- Live calculation summary -->
      <Transition name="fade">
        <div v-if="calc" class="glass-card p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Montant brut</span>
            <span class="text-white font-medium">{{ fmtEur(calc.grossAmount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-400">Courtage (0,35%)</span>
            <span :class="calc.brokerage ? 'text-red-400' : 'text-gray-500'">
              {{ calc.brokerage ? fmtEur(calc.brokerage) : 'Exonéré (≤ 500 €)' }}
            </span>
          </div>
          <div class="border-t border-white/10 pt-2 flex justify-between">
            <span class="text-gray-300 font-semibold text-sm">Net à payer</span>
            <span class="text-white font-bold text-lg">{{ fmtEur(calc.netAmount) }}</span>
          </div>
        </div>
      </Transition>

      <!-- Submit -->
      <button
        type="submit"
        :disabled="!calc || submitting || success"
        class="w-full py-4 rounded-2xl font-bold text-base transition"
        :class="success
          ? 'bg-emerald-600 text-white'
          : 'bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-40 disabled:pointer-events-none'"
      >
        {{ success ? '✓ Transaction enregistrée' : 'Enregistrer' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
