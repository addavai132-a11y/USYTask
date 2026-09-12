self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // 1. Invalidar y purgar cachés obsoletas para evitar stale data en la PWA
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            console.log('[SW] Purgando caché obsoleta:', cacheName)
            return caches.delete(cacheName)
          })
        )
      }),
      // 2. Tomar control inmediato de los clientes
      self.clients.claim(),
    ])
  )
})

// Estrategias de red: NUNCA CacheFirst para APIs o URLs de Supabase
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // 1. Peticiones a /api/* o URLs de Supabase (*.supabase.co): SIEMPRE NetworkOnly
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase')
  ) {
    // Permitir que vaya directo a la red sin interceptar ni almacenar en caché
    return
  }

  // 2. Navegaciones HTML (páginas dinámicas de Next.js App Router): NetworkFirst
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // Fallback a caché solo si el dispositivo está completamente desconectado (offline)
        return caches.match(request)
      })
    )
    return
  }
})

self.addEventListener('push', (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: 'USYTask', body: event.data.text() }
  }

  const title = data.title || 'USYTask / Life OS'
  const options = {
    body: data.body || 'Tienes una nueva actualización en tu espacio.',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || `usytask-${data.category || data.data?.type || 'general'}-${Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.data?.url || data.url || '/app',
      category: data.category || data.data?.category,
      referenceId: data.referenceId || data.data?.referenceId,
      ...data.data,
    },
    actions: data.actions || [],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/app'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url && client.url.includes(self.location.origin)) {
            if ('navigate' in client) {
              client.navigate(targetUrl)
            }
            return client.focus()
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl)
      }
    })
  )
})

// Renovación automática de la suscripción cuando el navegador la invalida
// (importante: ocurre con cierta frecuencia en Android/Chrome)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((subscription) =>
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: subscription.toJSON() }),
        })
      )
  )
})