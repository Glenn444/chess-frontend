const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string

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

export async function subscribeToPush(gameId: string): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const registration = await navigator.serviceWorker.ready

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
    const existing = await registration.pushManager.getSubscription()
    const subscription =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      }))

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ game_id: gameId, subscription }),
    })
  } catch (err) {
    console.warn('[Push] subscribe failed — notifications may not work:', err)
  }
}
