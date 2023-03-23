const zeitmanTracker = "zeitman-tracker"
const assets = [
    "/images/the_man_noexif.jpg",
    "/images/map_noexif.jpg",
    "/style/index.js",
    "/style/index.css",
    "/style/manifest.json"
]

self.addEventListener("install", installEvent => {
  installEvent.waitUntil(
    caches.open(zeitmanTracker).then(cache => {
      cache.addAll(assets)
    })
  )
})

self.addEventListener("fetch", fetchEvent => {
  fetchEvent.respondWith(
    caches.match(fetchEvent.request).then(res => {
      return res || fetch(fetchEvent.request)
    })
  )
})