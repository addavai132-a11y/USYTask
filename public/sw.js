self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'UsyaTask', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'UsyaTask / Life OS'
  const options = {
    body: data.body || 'Tienes una nueva actualización en tu espacio.',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'usyatask-notification',
    renotify: true,
    vibrate: [100, 50, 100],
    data: {
      url: data.data?.url || data.url || '/app',
      ...data.data,
    },
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
            client.navigate(targetUrl)
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