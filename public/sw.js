// Service Worker для PWA
const CACHE_NAME = 'video-menu-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// Файлы для кэширования
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static files')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker installed')
        return self.skipWaiting()
      })
  )
})

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Пропускаем запросы к API
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Пропускаем запросы к медиа-файлам (они кэшируются отдельно)
  if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/media/')) {
    return
  }

  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request)
          .then((response) => {
            // Кэшируем только успешные ответы
            if (response.status === 200) {
              const responseClone = response.clone()
              
              caches.open(DYNAMIC_CACHE)
                .then((cache) => {
                  cache.put(request, responseClone)
                })
            }

            return response
          })
          .catch(() => {
            // Возвращаем офлайн-страницу для навигационных запросов
            if (request.mode === 'navigate') {
              return caches.match('/')
            }
          })
      })
  )
})

// Обработка push-уведомлений
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: data.primaryKey
      },
      actions: [
        {
          action: 'explore',
          title: 'Открыть',
          icon: '/icons/icon-192x192.png'
        },
        {
          action: 'close',
          title: 'Закрыть',
          icon: '/icons/icon-192x192.png'
        }
      ]
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  }
})

// Обработка кликов по уведомлениям
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Синхронизация в фоне
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Здесь можно добавить логику синхронизации данных
      console.log('Background sync triggered')
    )
  }
})
