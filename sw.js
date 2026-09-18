/* オフラインで動かすための仕組み（サービスワーカー）。
   1回目にひらいたときに ファイルを スマホの中に 保存し、
   2回目からは 電波が わるくても すぐ ひらけるようにします。

   ★ゲームの中身を なおしたら、下の CACHE_NAME の v1 を v2、v3 …と
     ふやしてください。ふやさないと 古い画面が 表示されつづけます。 */

var CACHE_NAME = 'obake-asobi-v5';

var FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './js/storage.js',
  './js/sound.js',
  './js/ghosts.js',
  './js/app.js',
  './js/games/touch.js',
  './js/games/odd.js',
  './js/games/match.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(FILES);
    })
  );
  self.skipWaiting();
});

/* 古い保存分を かたづける */
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (name) {
        if (name !== CACHE_NAME) { return caches['delete'](name); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

/* まず保存分を見て、なければ ネットから とってくる */
self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function (hit) {
      return hit || fetch(event.request);
    })
  );
});
