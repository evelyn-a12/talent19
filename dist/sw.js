/* 老板用人选人十九讲学习系统 Service Worker：安装成 APP + 离线可用 */
const CACHE = 'talent19-v3'
const PRECACHE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== self.location.origin) return // 同步接口等跨域请求直接走网络

  // 带 hash 的静态资源：缓存优先
  if (url.pathname.includes('/assets/') || /\.(png|webmanifest|ico|svg)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const cp = res.clone()
        caches.open(CACHE).then(c => c.put(req, cp))
        return res
      }))
    )
    return
  }

  // 页面导航：网络优先，离线回退缓存
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(res => {
        const cp = res.clone()
        caches.open(CACHE).then(c => c.put('./index.html', cp))
        return res
      }).catch(() => caches.match('./index.html'))
    )
  }
})
