/* Service worker do painel (escopo /admin/). Só cuida das notificações:
   não guarda páginas em cache, então o painel sempre mostra o dado atual. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try {
    d = e.data ? e.data.json() : {};
  } catch {
    d = { titulo: 'Uni Bolsas', texto: e.data ? e.data.text() : '' };
  }
  e.waitUntil(
    self.registration.showNotification(d.titulo || 'Uni Bolsas', {
      body: d.texto || '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: d.etiqueta || undefined,
      renotify: !!d.etiqueta,
      data: { url: d.url || '/admin' },
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const url = new URL((e.notification.data && e.notification.data.url) || '/admin', self.location.origin).href;
  e.waitUntil(
    (async () => {
      const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const c of abertas) {
        if (c.url.startsWith(self.location.origin + '/admin')) {
          await c.focus();
          return c.navigate(url);
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
