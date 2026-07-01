import { ref } from 'vue'

const hidden = ref(localStorage.getItem('hoplinvest_privacy') === 'true')

export function usePrivacyMode() {
  function toggle() {
    hidden.value = !hidden.value
    localStorage.setItem('hoplinvest_privacy', String(hidden.value))
  }

  return { hidden, toggle }
}
