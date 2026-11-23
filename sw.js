/* 미래 JOB GO 서비스워커 — 오프라인 실행용(같은 출처 요청만 처리, 외부 요청은 관여하지 않음) */
'use strict';
var BUILD = '202611230557';
var SHELL_CACHE = 'mjg-shell-' + BUILD;
var FILE_CACHE = 'mjg-files-v1';
var SHELL = ["./","index.html","manifest.webmanifest?v=71720f20e2","css/fp.css?v=202611230557","css/app.css?v=202611230557","js/config.js?v=202611230557","data/content.js?v=202611230557","js/core.js?v=202611230557","js/fp-ask.js?v=202611230557","js/fp-ui.js?v=202611230557","js/views.js?v=202611230557","js/chapters.js?v=202611230557","icons/icon-64.png?v=71720f20e2","icons/icon-192.png?v=71720f20e2","icons/icon-512.png?v=71720f20e2","icons/maskable-192.png?v=71720f20e2","icons/maskable-512.png?v=71720f20e2","icons/apple-touch-icon.png?v=71720f20e2","icons/favicon-32.png?v=71720f20e2"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('mjg-shell-') === 0 && k !== SHELL_CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // 외부 누리집은 브라우저가 직접 처리
  var p = url.pathname;
  if (/\/data\/content\.json(\.sig)?$/.test(p)) return;          // 업데이트 자료는 항상 서버에서(서명 검증은 앱이 수행)
  if (req.mode === 'navigate') {                                // 화면: 네트워크 우선, 실패 시 저장본
    e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (r) {
      var cp = r.clone(); caches.open(SHELL_CACHE).then(function (c) { c.put('index.html', cp); }); return r;
    }).catch(function () { return caches.match('index.html'); }));
    return;
  }
  if (/\/files\//.test(p)) {                                     // 자료 파일: 한 번 연 파일은 오프라인에서도 열람
    e.respondWith(caches.open(FILE_CACHE).then(function (c) {
      return c.match(req).then(function (hit) {
        return hit || fetch(req).then(function (r) { if (r.ok && r.status === 200) c.put(req, r.clone()); return r; });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function (hit) { return hit || fetch(req); }));
});
