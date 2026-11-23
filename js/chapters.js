/* 미래 JOB GO — 챕터 화면(취업지원센터·빛고을 직업교육혁신지구·현장실습 리플릿 요약)
 * 본문은 간단한 표기법(build/chapters.py 머리말 참고)으로 저장되며, 모든 글자는 MJG.esc()로 이스케이프한 뒤에만 화면에 넣습니다.
 * 링크는 MJG.safeUrl()을 통과한 값만, 전화번호는 숫자·하이픈만 남겨 tel: 링크로 씁니다. */
(function () {
  'use strict';
  var MJG = window.MJG, V = MJG.views, esc = MJG.esc;
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·・,.\-–—_()\[\]「」『』‘’“”"'/|:;!?~]/g, ''); }
  function chapter(key) { var c = (MJG.data && MJG.data.chapters) || []; for (var i = 0; i < c.length; i++) if (c[i].key === key) return c[i]; return null; }
  MJG.chapter = chapter;

  /* 인라인: **굵게** */
  function inl(t) { return esc(t).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function cells(line) { return line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(function (c) { return c.trim(); }); }
  function tag(line) { var m = /^\[(카드|단계|링크|파일|전화)\]\s*(.*)$/.exec(line); return m ? { k: m[1], v: m[2] } : null; }

  /* 표기법 → 블록 */
  function parse(body) {
    var lines = String(body || '').split('\n'), out = [], i = 0;
    while (i < lines.length) {
      var ln = lines[i].replace(/\s+$/, ''), t = tag(ln);
      if (!ln.trim()) { i++; continue; }
      if (/^\s*\|/.test(ln)) { var rows = []; while (i < lines.length && /^\s*\|/.test(lines[i])) { rows.push(cells(lines[i])); i++; } out.push({ t: 'table', head: rows[0], rows: rows.slice(1) }); continue; }
      if (/^- /.test(ln)) { var items = []; while (i < lines.length && /^- /.test(lines[i])) { items.push(lines[i].slice(2)); i++; } out.push({ t: 'ul', items: items }); continue; }
      if (t && t.k === '카드') { var cs = []; while (i < lines.length && (t = tag(lines[i])) && t.k === '카드') { cs.push(t.v.split('|').map(function (x) { return x.trim(); })); i++; } out.push({ t: 'cards', items: cs }); continue; }
      if (t && (t.k === '링크' || t.k === '파일' || t.k === '전화')) { var ls = []; while (i < lines.length && (t = tag(lines[i])) && (t.k === '링크' || t.k === '파일' || t.k === '전화')) { var p = t.v.split('|'); ls.push({ k: t.k, name: (p[0] || '').trim(), v: (p[1] || '').trim() }); i++; } out.push({ t: 'links', items: ls }); continue; }
      if (t && t.k === '단계') { out.push({ t: 'flow', items: t.v.split('>').map(function (x) { return x.trim(); }).filter(Boolean) }); i++; continue; }
      if (/^## /.test(ln)) out.push({ t: 'h', text: ln.slice(3) });
      else if (/^※/.test(ln)) out.push({ t: 'note', text: ln });
      else if (/^> /.test(ln)) out.push({ t: 'call', text: ln.slice(2) });
      else out.push({ t: 'p', text: ln });
      i++;
    }
    return out;
  }
  function blockText(b) {
    if (b.t === 'table') return [b.head].concat(b.rows).map(function (r) { return r.join(' '); }).join(' ');
    if (b.t === 'ul' || b.t === 'flow') return b.items.join(' ');
    if (b.t === 'cards') return b.items.map(function (c) { return c.join(' '); }).join(' ');
    if (b.t === 'links') return b.items.map(function (l) { return l.name + ' ' + l.v; }).join(' ');
    return b.text || '';
  }
  MJG.chapterText = function (sec) { return sec.title + ' ' + (sec.tags || '') + ' ' + parse(sec.body).map(blockText).join(' '); };

  function numCol(b) { /* 마지막 열이 숫자인 표: 합계 표시 */
    if (!b.rows.length) return -1; var c = b.head.length - 1;
    return b.rows.every(function (r) { return /^\d[\d,]*$/.test(r[c] || ''); }) && /수|인원|명|건|개/.test(b.head[c]) ? c : -1;
  }
  function linkHtml(l) {
    if (l.k === '전화') { var d = l.v.replace(/[^\d\-]/g, ''); return d ? '<a class="chlink tel" href="tel:' + esc(d) + '"><span class="ci" aria-hidden="true">☎</span><span><b>' + esc(l.name) + '</b><small>' + esc(l.v) + '</small></span></a>' : ''; }
    var u = MJG.safeUrl(l.v); if (!u) return '';
    var ext = /^https:/.test(u), file = /^files\//.test(u);
    return '<a class="chlink" href="' + esc(u) + '"' + (ext || file ? ' target="_blank" rel="noopener noreferrer"' : '') + '><span class="ci" aria-hidden="true">' + (file ? '⬇' : ext ? '↗' : '→') + '</span><span><b>' + esc(l.name) + '</b><small>' + esc(ext ? u.replace(/^https:\/\//, '') : file ? '원문 파일' : '앱 안에서 이동') + '</small></span></a>';
  }

  /* 블록 → HTML. hit(text)가 주어지면 표의 행과 목록 항목을 걸러 냄 */
  function render(blocks, hit, mark) {
    var html = '', shown = 0, pend = '';
    function put(h) { html += pend + h; pend = ''; }
    blocks.forEach(function (b) {
      if (b.t === 'table') {
        var rows = hit ? b.rows.filter(function (r) { return hit(r.join(' ')); }) : b.rows;
        if (hit && !rows.length) return;
        shown += rows.length;
        var nc = numCol(b), sum = '';
        if (nc >= 0) { var tot = rows.reduce(function (a, r) { return a + (+String(r[nc]).replace(/,/g, '') || 0); }, 0); sum = '<p class="tsum">' + (hit ? '찾은 ' : '전체 ') + '<b>' + rows.length + '</b>' + (b.head.indexOf('동아리명') >= 0 ? '팀' : '건') + ' · ' + esc(b.head[nc]) + ' 합계 <b>' + tot.toLocaleString('ko-KR') + '</b>' + (/학생/.test(b.head[nc]) ? '명' : '') + '</p>'; }
        put(sum + '<div class="tscroll"><table class="ctable"><thead><tr>' + b.head.map(function (h) { return '<th scope="col">' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
          rows.map(function (r) { return '<tr>' + b.head.map(function (_, j) { return '<td' + (j === nc ? ' class="num"' : '') + '>' + mark(r[j] || '') + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div>');
        return;
      }
      if (b.t === 'ul') { var it = hit ? b.items.filter(hit) : b.items; if (!it.length) return; shown += it.length; put('<ul class="cul">' + it.map(function (x) { return '<li>' + mark(x) + '</li>'; }).join('') + '</ul>'); return; }
      if (b.t === 'h') { var hh = '<h3 class="chh">' + mark(b.text) + '</h3>'; if (hit) pend = hh; else html += hh; return; }
      if (b.t === 'cards') { var ci = hit ? b.items.filter(function (c) { return hit(c.join(' ')); }) : b.items; if (!ci.length) return; b = { t: 'cards', items: ci }; }
      else if (hit && !hit(blockText(b))) return;
      shown++;
      if (b.t === 'cards') put('<div class="ccards">' + b.items.map(function (c) { return '<div class="ccard"><span class="cl">' + mark(c[0] || '') + '</span><b>' + mark(c[1] || '') + '</b>' + (c[2] ? '<small>' + mark(c[2]) + '</small>' : '') + '</div>'; }).join('') + '</div>');
      else if (b.t === 'flow') put('<ol class="cflow">' + b.items.map(function (x, j) { return '<li><span class="fn">' + (j + 1) + '</span>' + mark(x) + '</li>'; }).join('') + '</ol>');
      else if (b.t === 'links') put('<div class="clinks">' + b.items.map(linkHtml).join('') + '</div>');
      else if (b.t === 'note') put('<p class="cnote">' + mark(b.text) + '</p>');
      else if (b.t === 'call') put('<p class="ccall">' + mark(b.text) + '</p>');
      else put('<p class="cp">' + mark(b.text) + '</p>');
    });
    return { html: html, n: shown };
  }

  /* 챕터 화면: 머리말 · 검색 · 바로가기 · 섹션 */
  var state = {};
  function draw(el, key, sectionId, opts) {
    opts = opts || {};
    var ch = chapter(key);
    if (!ch) { el.innerHTML = '<p class="muted">자료가 없습니다. 관리자 도구에서 추가할 수 있습니다.</p>'; return; }
    var st = state[key] || (state[key] = { q: '' });
    var secs = ch.sections || [], parsed = secs.map(function (s) { return parse(s.body); });
    var files = (ch.files || []).map(function (f) { var u = MJG.safeUrl(f.url); return u ? '<a class="chfile" href="' + esc(u) + '"' + (u.charAt(0) === '#' ? '' : ' target="_blank" rel="noopener noreferrer"') + '>⬇ ' + esc(f.title) + '</a>' : ''; }).join('');
    el.innerHTML = (opts.inPanel ? '<h2 class="vt2">' + esc(ch.title) + '</h2>' : '<h1 class="vt">' + esc(ch.title) + '</h1>') +
      '<p class="vsub">' + esc(ch.lead) + '</p>' + (files ? '<div class="chfiles">' + files + '</div>' : '') +
      '<form class="rsearch chsearch" role="search"><input class="finput" type="search" placeholder="이 메뉴에서 찾기(예: ' + esc(key === 'district' ? '광주공업, 드론, 정주' : key === 'center' ? '면접, 간호, 장려금' : '연장실습, 지원금, 선도기업') + ')" aria-label="' + esc(ch.title) + ' 안에서 찾기" value="' + esc(st.q) + '" enterkeyhint="search"><button type="submit">찾기</button></form>' +
      '<p class="hitnote chnote" hidden></p>' +
      '<nav class="secnav chnav" aria-label="바로가기">' + secs.map(function (s) { return '<a href="#" data-sec="' + esc(s.id) + '">' + esc(s.title) + '</a>'; }).join('') + '</nav>' +
      '<div class="chbody"></div>';
    var body = el.querySelector('.chbody'), note = el.querySelector('.chnote'), inp = el.querySelector('input');
    function paint() {
      var q = st.q.trim(), toks = q.split(/\s+/).map(norm).filter(Boolean);
      var hit = toks.length ? function (t) { var n = norm(t); return toks.every(function (k) { return n.indexOf(k) >= 0; }); } : null;
      /* 구절 단위가 아니라 낱말 하나라도 들어 있으면 강조 */
      var re = toks.length ? new RegExp('(' + q.split(/\s+/).filter(Boolean).map(function (w) { return esc(w).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'g') : null;
      var mark = function (t) { var h = inl(t); return re ? h.replace(/(<[^>]+>)|([^<]+)/g, function (m, tg, tx) { return tg || tx.replace(re, '<mark>$1</mark>'); }) : h; };
      var total = 0, html = '';
      secs.forEach(function (s, i) {
        var secHit = hit && hit(s.title + ' ' + (s.tags || ''));
        var r = render(parsed[i], hit && !secHit ? hit : null, mark);
        if (hit && !secHit && !r.n) return;
        total += hit ? (r.n || 1) : 0;
        html += '<section class="ssec chsec" id="ch-' + esc(key) + '-' + esc(s.id) + '"><h2 class="sh">' + mark(s.title) + '</h2>' + r.html + '</section>';
      });
      body.innerHTML = html || '<p class="muted">‘' + esc(q) + '’이(가) 들어간 내용이 없습니다. 다른 낱말로 찾거나 <a href="#/search/' + encodeURIComponent(q) + '">통합 검색</a>을 이용하세요.</p>';
      note.hidden = !hit; if (hit) note.textContent = '‘' + q + '’ 관련 내용 ' + total + '건을 표시했습니다. 검색창을 비우면 전체가 다시 보입니다.';
      el.querySelector('.chnav').hidden = !!hit;
    }
    var tm;
    inp.addEventListener('input', function () { clearTimeout(tm); var v = inp.value; tm = setTimeout(function () { st.q = v; paint(); }, 150); });
    el.querySelector('form').addEventListener('submit', function (e) { e.preventDefault(); clearTimeout(tm); st.q = inp.value; paint(); inp.blur(); var f = body.querySelector('mark'); if (f) f.scrollIntoView({ block: 'center' }); });
    el.querySelector('.chnav').addEventListener('click', function (e) {
      var a = e.target.closest('a[data-sec]'); if (!a) return; e.preventDefault();
      var t = document.getElementById('ch-' + key + '-' + a.getAttribute('data-sec')); if (t) t.scrollIntoView({ block: 'start' });
    });
    if (opts.q != null) st.q = opts.q, inp.value = opts.q;
    paint();
    if (sectionId) setTimeout(function () { var t = document.getElementById('ch-' + key + '-' + sectionId); if (t) t.scrollIntoView({ block: 'start' }); }, 60);
  }
  MJG.renderChapter = draw;

  /* 라우트: #/center, #/center/섹션ID, #/center/q/검색어 */
  function view(key) {
    return function (el, r) {
      if (r.a === 'q') draw(el, key, '', { q: decodeURIComponent(r.b || '') });
      else draw(el, key, r.a || '');
    };
  }
  V.center = view('center');
  V.district = view('district');
})();

/* 통합 검색·자료실 검색에서 쓰는 챕터 검색 결과(링크 HTML 목록) */
(function () {
  'use strict';
  var MJG = window.MJG, esc = MJG.esc;
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·・,.\-–—_()\[\]「」『』‘’“”"'/|:;!?~]/g, ''); }
  var NAME = { fpleaf: '현장실습 리플릿', center: '취업지원센터', district: '혁신지구' };
  MJG.chapterHits = function (v) {
    var toks = String(v || '').trim().split(/\s+/).map(norm).filter(Boolean), out = [];
    if (!toks.length) return out;
    ((MJG.data && MJG.data.chapters) || []).forEach(function (ch) {
      (ch.sections || []).forEach(function (s) {
        var n = norm(MJG.chapterText(s));
        if (!toks.every(function (t) { return n.indexOf(t) >= 0; })) return;
        var href = ch.key === 'fpleaf' ? '#/fp/leaf' : '#/' + ch.key + '/q/' + encodeURIComponent(String(v).trim());
        out.push('<a href="' + esc(href) + '"><span class="k">' + esc(NAME[ch.key] || ch.title) + '</span><span>' + esc(s.title) + '</span></a>');
      });
    });
    return out;
  };
})();
