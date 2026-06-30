<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useInvestmentsStore } from '../stores/investments'
import { parseCSV, deduplicateTransactions } from '../utils/csv-parser'
import type { Transaction } from '../types'

const router = useRouter()
const investments = useInvestmentsStore()

const dragging = ref(false)
const preview = ref<Transaction[]>([])
const duplicateCount = ref(0)
const error = ref('')
const imported = ref(false)

function handleFile(file: File) {
  if (!file.name.endsWith('.csv') && file.type !== 'text/csv' && !file.type.includes('text')) {
    error.value = 'Fichier invalide — importe un fichier .csv Boursobank'
    return
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    const parsed = parseCSV(content)
    if (!parsed.length) {
      error.value = 'Aucune transaction trouvée dans ce fichier'
      return
    }
    const newTxs = deduplicateTransactions(investments.transactions, parsed)
    duplicateCount.value = parsed.length - newTxs.length
    preview.value = newTxs
    error.value = ''
  }
  reader.readAsText(file, 'UTF-8')
}

function onDrop(e: DragEvent) {
  dragging.value = false
  const file = e.dataTransfer?.files[0]
  if (file) handleFile(file)
}

function onFileInput(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) handleFile(file)
}

function confirmImport() {
  if (!preview.value.length) return
  investments.addTransactions(preview.value)
  imported.value = true
  setTimeout(() => router.push('/'), 1500)
}

function fmtEur(val: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Math.abs(val))
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}
</script>

<template>
  <div>
    <h1 class="text-white font-bold text-xl mb-6">Importer un CSV Boursobank</h1>

    <!-- Drag & drop zone -->
    <div
      v-if="!preview.length && !imported"
      class="border-2 border-dashed rounded-2xl p-10 text-center transition cursor-pointer"
      :class="dragging ? 'border-violet-400 bg-violet-500/10' : 'border-white/15 hover:border-violet-500/50'"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      @click="($refs.fileInput as HTMLInputElement).click()"
    >
      <p class="text-4xl mb-3">📂</p>
      <p class="text-white font-medium">Glisse ton fichier ici</p>
      <p class="text-gray-500 text-sm mt-1">ou clique pour sélectionner</p>
      <p class="text-gray-600 text-xs mt-3">Format Boursobank — séparateur tabulation</p>
      <input ref="fileInput" type="file" accept=".csv,text/csv" class="hidden" @change="onFileInput" />
    </div>

    <!-- Error -->
    <div v-if="error" class="mt-4 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-sm">
      {{ error }}
    </div>

    <!-- Preview -->
    <div v-if="preview.length" class="space-y-4">
      <div class="glass-card p-4">
        <p class="text-white font-semibold mb-1">{{ preview.length }} transaction{{ preview.length > 1 ? 's' : '' }} à importer</p>
        <p v-if="duplicateCount" class="text-amber-400 text-xs">{{ duplicateCount }} doublon{{ duplicateCount > 1 ? 's' : '' }} ignoré{{ duplicateCount > 1 ? 's' : '' }}</p>
      </div>

      <div class="glass-card divide-y divide-white/6 overflow-hidden">
        <div v-for="tx in preview" :key="tx.id" class="px-4 py-3 flex justify-between items-center">
          <div>
            <p class="text-white text-sm">{{ fmtDate(tx.date) }} · {{ tx.quantity }} parts</p>
            <p class="text-gray-500 text-xs">{{ tx.executionPrice.toFixed(4) }} €/part</p>
          </div>
          <p class="text-white font-semibold text-sm">{{ fmtEur(tx.netAmount) }}</p>
        </div>
      </div>

      <button
        @click="confirmImport"
        :disabled="imported"
        class="w-full py-4 rounded-2xl font-bold text-base transition"
        :class="imported ? 'bg-emerald-600 text-white' : 'bg-violet-600 text-white hover:bg-violet-500'"
      >
        {{ imported ? '✓ Importé !' : `Importer ${preview.length} transaction${preview.length > 1 ? 's' : ''}` }}
      </button>
    </div>
  </div>
</template>
