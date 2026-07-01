import { ref, onMounted } from 'vue'
import { DIRECTUS_URL, getValidToken } from '../services/directus'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function usePushNotifications() {
  const supported = ref(false)
  const status = ref<'unknown' | 'subscribed' | 'denied'>('unknown')
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function checkStatus() {
    if (!('Notification' in window) || !('PushManager' in window)) return
    supported.value = true
    if (Notification.permission === 'denied') { status.value = 'denied'; return }
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) status.value = 'subscribed'
  }

  async function subscribe() {
    loading.value = true
    error.value = null
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') { status.value = 'denied'; return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      const token = await getValidToken()
      const res = await fetch(`${DIRECTUS_URL}/items/push_subscriptions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ subscription: sub.toJSON() })
      })
      if (!res.ok) throw new Error('Erreur Directus')

      status.value = 'subscribed'
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Erreur inconnue'
    } finally {
      loading.value = false
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) await sub.unsubscribe()
    status.value = 'unknown'
  }

  onMounted(checkStatus)

  return { supported, status, loading, error, subscribe, unsubscribe }
}
