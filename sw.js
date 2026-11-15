/* 미래 JOB GO 서비스워커 — 오프라인 실행용(같은 출처 요청만 처리, 외부 요청은 관여하지 않음) */
'use strict';
var BUILD = '202611150249';
var SHELL_CACHE = 'mjg-shell-' + BUILD;
var FILE_CACHE = 'mjg-files-v1';
var SHELL = ["./","index.html","manifest.webmanifest","css/fp.css?v=202611150249","css/app.css?v=202611150249","js/config.js?v=202611150249","data/content.js?v=202611150249","js/core.js?v=202611150249","js/fp-ask.js?v=202611150249","js/fp-ui.js?v=202611150249","js/views.js?v=202611150249","icons/icon-64.png","icons/icon-192.png","icons/icon-512.png","icons/maskable-192.png","icons/maskable-512.png","icons/apple-touch-icon.png","icons/favicon-32.png"];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL_CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
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
    e.respondWith(fetch(req).then(function (r) {
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
