/**
 * キャッシュクリア & サービスワーカー自己解除スクリプト
 * 開発中のファイル更新がキャッシュによってブロックされるのを防ぎます
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    }).then(() => {
      return self.registration.unregister();
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // キャッシュを一切介さず、常にネットワークから直接最新を取得
  e.respondWith(fetch(e.request));
});
