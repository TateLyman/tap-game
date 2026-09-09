// Cache-killer service worker for the broken v2 deployment.
self.addEventListener('install',e=>e.waitUntil(self.skipWaiting()));
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  await Promise.all((await caches.keys()).map(k=>caches.delete(k)));
  await self.clients.claim();
  await self.registration.unregister();
})()));
