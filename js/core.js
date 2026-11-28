/* 미래 JOB GO — 핵심 모듈
 * 1) 서명 검증된 자료만 사용(ECDSA P-256 / SHA-256)
 * 2) 자료 업데이트 확인·적용(버전 역행 차단)
 * 3) 화면 전환(해시 라우터), 설정(글자 크기·화면 테마), 설치 안내, 서비스워커 등록
 * 외부 라이브러리·외부 서버·쿠키·개인정보 수집을 사용하지 않습니다.
 */
(function () {
  'use strict';
  var C = window.MJG_CONFIG || {};
  var MJG = window.MJG = { data: null, ver: 0, verified: false, source: '', views: {}, installEvt: null, pending: null };

  /* ── 유틸 ── */
  var ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  MJG.esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (m) { return ESC[m]; }); };
  MJG.$ = function (id) { return document.getElementById(id); };
  MJG.store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  /* 자료 속 링크는 https·내부 경로만 허용 */
  MJG.safeUrl = function (u) {
    u = String(u || '').trim();
    if (/^https:\/\/[^\s"'<>]+$/i.test(u)) return u;
    if (/^#\/[\w\-\/?=&%.]*$/.test(u)) return u;
    if (/^files\/[\w\-.]+\.(pdf|hwp|hwpx|docx|xlsx|pptx|zip|png|jpg)$/i.test(u)) return window.MJG_PERSONAL ? 'https://hckong4663-tech.github.io/mirae-job-go/' + u : u;
    return '';
  };
  MJG.fmtSize = function (n) { if (!n) return ''; return n >= 1048576 ? (n / 1048576).toFixed(1) + 'MB' : Math.max(1, Math.round(n / 1024)) + 'KB'; };
  MJG.fmtDate = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? m[1] + '. ' + (+m[2]) + '. ' + (+m[3]) + '.' : (s || ''); };
  MJG.today = function () { var d = new Date(); d.setHours(0, 0, 0, 0); return d; };
  MJG.parseDate = function (s) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null; };

  var toastTimer;
  MJG.toast = function (msg, actLabel, act, keep) {
    var t = MJG.$('toast'); if (!t) return;
    t.innerHTML = '<span>' + MJG.esc(msg) + '</span>' + (actLabel ? '<button type="button">' + MJG.esc(actLabel) + '</button>' : '');
    t.hidden = false;
    if (actLabel) t.querySelector('button').onclick = function () { t.hidden = true; act && act(); };
    clearTimeout(toastTimer);
    if (!keep) toastTimer = setTimeout(function () { t.hidden = true; }, actLabel ? 9000 : 3800);
  };

  /* 차트 말풍선 */
  MJG.tip = {
    show: function (html, x, y) {
      var t = MJG.$('vtip'); if (!t) return;
      t.innerHTML = html; t.hidden = false;
      var w = t.offsetWidth, h = t.offsetHeight;
      var left = Math.min(window.innerWidth - w - 8, Math.max(8, x + 12));
      var top = y - h - 12; if (top < 8) top = y + 16;
      t.style.left = left + 'px'; t.style.top = top + 'px';
    },
    hide: function () { var t = MJG.$('vtip'); if (t) t.hidden = true; }
  };

  /* ── 서명 검증 ── */
  function b64bytes(b64) { var s = atob(String(b64).trim()), a = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) a[i] = s.charCodeAt(i); return a; }
  MJG.canVerify = function () { return !!(window.crypto && window.crypto.subtle && window.isSecureContext !== false && window.TextEncoder); };
  var keyP = null;
  function key() {
    if (!keyP) keyP = crypto.subtle.importKey('jwk', C.PUBLIC_KEY_JWK, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
    return keyP;
  }
  MJG.verify = function (text, sig) {
    if (!MJG.canVerify() || !text || !sig) return Promise.resolve(false);
    return key().then(function (k) {
      return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, k, b64bytes(sig), new TextEncoder().encode(text));
    }).catch(function () { return false; });
  };
  function shapeOk(o) {
    return o && o.schema === 1 && o.meta && typeof o.meta.version === 'number' && isFinite(o.meta.version) &&
      Array.isArray(o.notices) && Array.isArray(o.resources) && Array.isArray(o.roles) && o.stats && o.fp &&
      Array.isArray(o.fp.QA) && Array.isArray(o.fp.CATS) && Array.isArray(o.fp.MAN) && Array.isArray(o.fp.SEC);
  }

  /* ── 자료 보관(기기 안) ── */
  var CK = 'mjg.content.v1';
  function saveLocal(rec) {
    var s = JSON.stringify(rec);
    if (MJG.store.set(CK, s)) return Promise.resolve(true);
    if (window.caches) return caches.open('mjg-content').then(function (c) { return c.put(new Request('./__mjg_content__'), new Response(s)); }).then(function () { return true; }, function () { return false; });
    return Promise.resolve(false);
  }
  function readLocal() {
    var s = MJG.store.get(CK);
    if (s) return Promise.resolve(s);
    if (!window.caches) return Promise.resolve(null);
    return caches.open('mjg-content').then(function (c) { return c.match('./__mjg_content__'); }).then(function (r) { return r ? r.text() : null; }).catch(function () { return null; });
  }

  function pick(cands) {
    var canV = MJG.canVerify();
    return Promise.all(cands.map(function (c) {
      var ok = canV ? MJG.verify(c.json, c.sig) : Promise.resolve(c.src === 'bundle');
      return ok.then(function (v) {
        if (!v) return null;
        try { var o = JSON.parse(c.json); return shapeOk(o) ? { src: c.src, json: c.json, sig: c.sig, o: o, verified: canV } : null; } catch (e) { return null; }
      });
    })).then(function (list) {
      var best = null;
      list.forEach(function (x) { if (x && (!best || x.o.meta.version > best.o.meta.version)) best = x; });
      return best;
    });
  }

  function apply(b) {
    /* 통계 숫자 칸은 숫자만 허용(문자열이 섞여 화면에 끼어드는 것 방지) */
    try {
      var NUMK = /^(pub|cohortYear|schools|grad|emp|adv|enl|exc|unemp|rate|advRate|netRate|big300|rank|sp|mt|gv|ins|inside|outside|cap|noncap|n|m|f|sum|pct|keep1|keep2|rate1|rate2|in)$/;
      var fix = function (o) { if (Array.isArray(o)) { o.forEach(fix); return; } if (o && typeof o === 'object') Object.keys(o).forEach(function (k) { var v = o[k]; if (NUMK.test(k) && v != null && typeof v !== 'number') o[k] = isFinite(+v) ? +v : null; else if (v && typeof v === 'object') fix(v); }); };
      fix(b.o.stats.releases || []); fix(b.o.stats.trend || []);
    } catch (e) {}
    MJG.data = b.o; MJG.ver = b.o.meta.version; MJG.verified = b.verified; MJG.source = b.src;
    var fp = b.o.fp;
    window.FP = fp; window.CATS = fp.CATS; window.QA = fp.QA; window.CASES = fp.CASES || []; window.KEYS = fp.KEYS || [];
    window.FORMS = fp.FORMS || []; window.LAWS = fp.LAWS || []; window.MAN = fp.MAN; window.SEC = fp.SEC;
    var mx = +(MJG.store.get('mjg.maxv') || 0); if (MJG.ver > mx) MJG.store.set('mjg.maxv', String(MJG.ver));
  }

  function load() {
    var cands = [];
    var bd = window.__MJG_BUNDLE;
    if (bd && bd.json) cands.push({ src: 'bundle', json: bd.json, sig: bd.sig });
    return readLocal().then(function (s) {
      if (s) { try { var r = JSON.parse(s); if (r && r.json) cands.push({ src: 'cache', json: r.json, sig: r.sig }); } catch (e) {} }
      return pick(cands);
    });
  }

  /* ── 업데이트 확인 ── */
  var checking = false;
  MJG.isWeb = function () { return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'; };
  function fetchText(url) {
    return fetch(url + (url.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now(), { cache: 'no-store', credentials: 'omit', redirect: 'error' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (t) { if (t.length > 12 * 1024 * 1024) throw new Error('too large'); return t; });
  }
  MJG.checkUpdate = function (manual) {
    if (checking) return Promise.resolve();
    if (!MJG.isWeb()) { if (manual) MJG.toast('파일로 연 앱은 자동 업데이트가 되지 않습니다. 인터넷 주소(https)로 설치해 주세요.'); return Promise.resolve(); }
    if (!MJG.canVerify()) { if (manual) MJG.toast('이 브라우저는 자료 서명 검증을 지원하지 않아 업데이트할 수 없습니다.'); return Promise.resolve(); }
    if (navigator.onLine === false) { if (manual) MJG.toast('인터넷에 연결되어 있지 않습니다. 저장된 자료로 계속 사용합니다.'); return Promise.resolve(); }
    checking = true;
    var b = MJG.$('btnUpdate'); if (b && manual) b.classList.add('spinning');
    return Promise.all([fetchText(C.UPDATE_URL), fetchText(C.UPDATE_SIG_URL)]).then(function (r) {
      var json = r[0], sig = r[1].trim();
      return MJG.verify(json, sig).then(function (ok) {
        if (!ok) { MJG.toast('서명이 맞지 않는 자료가 발견되어 적용하지 않았습니다. 관리자에게 알려 주세요.'); return; }
        var o; try { o = JSON.parse(json); } catch (e) { return; }
        if (!shapeOk(o)) return;
        var mx = +(MJG.store.get('mjg.maxv') || 0);
        MJG.store.set('mjg.lastcheck', new Date().toISOString());
        if (o.meta.version <= MJG.ver || o.meta.version < mx) { if (manual) MJG.toast('최신 자료입니다(자료 버전 ' + MJG.ver + ').'); return; }
        return saveLocal({ json: json, sig: sig, at: new Date().toISOString() }).then(function () {
          MJG.pending = o.meta;
          var d = MJG.$('updDot'); if (d) d.hidden = false;
          MJG.toast('새 자료(' + (o.meta.label || ('버전 ' + o.meta.version)) + ')가 도착했습니다.', '지금 적용', function () { location.reload(); }, true);
        });
      });
    }).catch(function () { if (manual) MJG.toast('업데이트 서버에 연결하지 못했습니다. 저장된 자료로 계속 사용합니다.'); })
      .then(function () { checking = false; if (b) b.classList.remove('spinning'); });
  };

  /* ── 설정 ── */
  var FS = [14, 15, 16, 17, 18, 20];
  MJG.fsIndex = function () { var v = parseInt(MJG.store.get('mjg.fs'), 10); return isNaN(v) ? 2 : Math.min(FS.length - 1, Math.max(0, v)); };
  MJG.setFs = function (i) { i = Math.min(FS.length - 1, Math.max(0, i)); MJG.store.set('mjg.fs', String(i)); document.documentElement.style.setProperty('--fs', FS[i] + 'px'); return i; };
  /* v1.9: 밝은(흰 바탕) 화면으로 고정 — 기기의 어두운 모드와 상관없이 같은 화면 */
  MJG.theme = function () { return 'light'; };
  MJG.setTheme = function () { MJG.store.del('mjg.theme'); document.documentElement.setAttribute('data-theme', 'light'); };
  MJG.setFs(MJG.fsIndex()); MJG.setTheme(MJG.theme());

  /* ── 라우터 ── */
  var fpReady = false;
  function parseHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#\/?/, ''));
    var parts = h.split('/'); return { name: parts[0] || 'home', a: parts[1] || '', b: parts.slice(2).join('/') };
  }
  var TITLES = { home: '홈', fp: '현장실습 Q&A', res: '취업지원 자료실', resdetail: '자료', role: '대상별 안내', schedule: '주요 일정', stats: '취업·현장실습 통계', center: '취업지원센터', district: '직업교육혁신지구', fpst: '직업계고 현장실습 통계', notices: '공지사항', more: '설치·설정', search: '검색' };
  if (window.MJG_PERSONAL) TITLES.qna = '예상질의답변서';
  MJG.route = function () {
    if (!MJG.data) return;
    var r = parseHash(), name = r.name;
    if (name === 'res' && r.a) name = 'resdetail';
    if (!TITLES[name]) name = 'home';
    var views = document.querySelectorAll('.view');
    for (var i = 0; i < views.length; i++) views[i].hidden = views[i].getAttribute('data-view') !== name;
    var navKey = name === 'resdetail' ? 'res' : name === 'role' ? 'role-' + r.a : name;
    var navs = document.querySelectorAll('[data-nav]');
    for (var j = 0; j < navs.length; j++) {
      var k = navs[j].getAttribute('data-nav');
      if (k === navKey || (name === 'role' && k === 'home' && navs[j].closest('.tabbar'))) navs[j].setAttribute('aria-current', 'page'); else navs[j].removeAttribute('aria-current');
    }
    if (name === 'fp') {
      if (!fpReady && window.MJG_FP_INIT) { window.MJG_FP_INIT(); fpReady = true; }
    } else {
      var el = document.querySelector('.view[data-view="' + name + '"]');
      var fn = MJG.views[name]; if (fn) { try { fn(el, r); } catch (e) { el.innerHTML = '<div class="err">화면을 표시하는 중 오류가 발생했습니다: ' + MJG.esc(e.message) + '</div>'; } }
      if (!MJG._keepScroll) window.scrollTo(0, 0);
    }
    MJG._keepScroll = false;
    document.title = (TITLES[name] && name !== 'home' ? TITLES[name] + ' · ' : '') + '미래 JOB GO';
    MJG.tip.hide();
  };
  MJG.go = function (h) { if (location.hash === h) MJG.route(); else location.hash = h; };

  /* ── 설치 ── */
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); MJG.installEvt = e; });
  window.addEventListener('appinstalled', function () { MJG.installEvt = null; MJG.toast('미래 JOB GO가 설치되었습니다.'); });
  MJG.platform = function () {
    var ua = navigator.userAgent || '';
    var iOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (iOS) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    if (/Mac OS X|Macintosh/.test(ua)) return 'mac';
    if (/Windows/.test(ua)) return 'windows';
    return 'other';
  };
  MJG.standalone = function () { return (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true; };

  /* ── 시작 ── */
  function start() {
    var boot = MJG.$('boot');
    load().then(function (best) {
      if (!best) {
        boot.innerHTML = '<div class="err"><b>자료를 불러오지 못했습니다.</b><br>앱 파일이 손상되었거나 서명이 맞지 않습니다. 앱을 다시 설치하거나 관리자에게 문의하세요.</div>';
        return;
      }
      apply(best);
      boot.hidden = true;
      MJG.route();
      window.addEventListener('hashchange', MJG.route);
      if ('serviceWorker' in navigator && MJG.isWeb() && !window.MJG_PERSONAL) {
        navigator.serviceWorker.register('sw.js').catch(function () {});
      }
      setTimeout(function () { MJG.checkUpdate(false); }, 1200);
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'visible') return;
        var last = Date.parse(MJG.store.get('mjg.lastcheck') || 0) || 0;
        if (Date.now() - last > 30 * 60 * 1000) MJG.checkUpdate(false);
      });
    });
    MJG.$('btnUpdate').addEventListener('click', function () {
      if (MJG.pending) { location.reload(); return; }
      MJG.checkUpdate(true);
    });
    MJG.$('btnSearch').addEventListener('click', function () { MJG.go('#/search'); });
  }
  /* defer 스크립트 실행 중에는 readyState가 'interactive'이므로, 나머지 모듈이 모두 실행된 뒤(DOMContentLoaded) 시작 */
  if (document.readyState === 'complete') start(); else document.addEventListener('DOMContentLoaded', start);
})();
