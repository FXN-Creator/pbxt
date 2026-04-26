const CACHE_NAME = 'scheduler-cache-v2';
const urlsToCache = [
  '/',
  '/scheduler.html',
  '/scheduler.js',
  '/icon.png',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
  'https://res.wx.qq.com/open/js/jweixin-1.6.0.js'
];

// 安装Service Worker
self.addEventListener('install', event => {
  // 跳过等待，直接激活
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        // 并行缓存所有资源
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url, {
              cache: 'no-store',
              credentials: 'omit'
            }).then(response => {
              if (response && response.ok) {
                return cache.put(url, response.clone());
              }
            }).catch(err => {
              console.log('Cache failed for:', url, err);
            });
          })
        );
      })
  );
});

// 激活Service Worker
self.addEventListener('activate', event => {
  // 立即获取控制权
  event.waitUntil(
    Promise.all([
      // 清理旧缓存
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // 立即控制所有客户端
      self.clients.claim()
    ])
  );
});

// 拦截请求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果缓存中有响应，直接返回
        if (response) {
          // 后台更新缓存
          fetch(event.request, {
            cache: 'no-store',
            credentials: 'omit'
          }).then(fetchResponse => {
            if (fetchResponse && fetchResponse.ok) {
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, fetchResponse);
              });
            }
          }).catch(() => {
            // 忽略网络错误
          });
          return response;
        }
        
        // 缓存中没有，从网络获取
        return fetch(event.request, {
          cache: 'no-store',
          credentials: 'omit'
        }).then(fetchResponse => {
          // 如果响应成功，缓存一份
          if (fetchResponse && fetchResponse.ok) {
            const responseToCache = fetchResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return fetchResponse;
        }).catch(() => {
          // 网络错误时，返回离线页面或错误提示
          if (event.request.mode === 'navigate') {
            return caches.match('/scheduler.html');
          }
        });
      })
  );
});

// 后台同步
self.addEventListener('sync', event => {
  if (event.tag === 'sync-schedule-data') {
    event.waitUntil(syncScheduleData());
  }
});

// 同步排班数据
function syncScheduleData() {
  // 这里可以添加数据同步逻辑
  console.log('Syncing schedule data');
  return Promise.resolve();
}