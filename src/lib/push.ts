const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string
const BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.chesske.com'

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const binaryString = atob(base64)
  const buf = new ArrayBuffer(binaryString.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < binaryString.length; i++) {
    view[i] = binaryString.charCodeAt(i)
  }
  return buf
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false

  if (Notification.permission === 'default') {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false
  }

  if (Notification.permission !== 'granted') return false

  try {
    const registration = await navigator.serviceWorker.ready

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      }))

    const res = await fetch(`${BASE_URL}/api/push/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ subscription }),
    })

    return res.ok
  } catch (err) {
    console.warn('[Push] subscribe failed — notifications may not work:', err)
    return false
  }
}

export async function isPushSubscribed(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/api/push/subscription`, { credentials: 'include' })
    return res.ok
  } catch {
    return false
  }
}
