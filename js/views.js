/* 미래 JOB GO — 화면 모듈(홈·검색·대상별 안내·자료실·일정·통계·공지·더보기)
 * 모든 자료 문자열은 MJG.esc()로 이스케이프하고, 링크는 MJG.safeUrl()을 통과한 값만 씁니다. */
(function () {
  'use strict';
  var MJG = window.MJG, V = MJG.views, esc = MJG.esc;
  var ROLE = { student: '학생', teacher: '교사', jobcoach: '취업지원관', school: '학교', company: '기업체', supervisor: '장학사' };
  var ROLE_INI = { student: '학', teacher: '교', jobcoach: '취', school: '관', company: '기', supervisor: '장' };

  function D() { return MJG.data; }
  /* 광주·전남과 통합(참고) 지표. 통합 값은 두 시도 원자료를 합산해 KEDI 산식으로 다시 계산한 참고치입니다.
   * 취업률 = 취업자 ÷ (졸업자 − 진학자 − 입대자 − 제외인정자) × 100 */
  function gjjn(rel) {
    var by = function (n) { return (rel.sido || []).filter(function (x) { return x.sido === n; })[0]; };
    var g = by('광주'), j = by('전남'); if (!g || !j) return null;
    var sum = function (k) { return (g[k] == null || j[k] == null) ? null : g[k] + j[k]; };
    var c = { sido: '광주·전남 통합(참고)', schools: sum('schools'), grad: sum('grad'), emp: sum('emp'), adv: sum('adv'), enl: sum('enl'), exc: sum('exc'), ins: sum('ins'), inside: sum('inside') };
    var den = c.grad - c.adv - c.enl - c.exc;
    c.rate = den > 0 ? Math.round(c.emp / den * 1000) / 10 : null;
    c.advRate = c.grad ? Math.round(c.adv / c.grad * 1000) / 10 : null;
    var others = (rel.sido || []).filter(function (x) { return x.sido !== '광주' && x.sido !== '전남'; });
    c.rank = c.rate == null ? null : 1 + others.filter(function (x) { return x.rate > c.rate; }).length;
    c.nRank = others.length + 1;
    var rg = (rel.ret && rel.ret.sido || []), rgj = rg.filter(function (x) { return x.sido === '광주'; })[0], rjn = rg.filter(function (x) { return x.sido === '전남'; })[0];
    if (rgj && rjn && rgj.ins + rjn.ins) { c.ret2 = Math.round((rgj.ins * rgj.rate2 + rjn.ins * rjn.rate2) / (rgj.ins + rjn.ins) * 10) / 10; }
    return { g: g, j: j, c: c, rg: rgj, rj: rjn };
  }
  MJG.gjjn = gjjn;
  function qaById(id) { var q = window.QA || []; for (var i = 0; i < q.length; i++) if (q[i].id === id) return { x: q[i], no: i + 1 }; return null; }
  function resById(id) { var r = D().resources; for (var i = 0; i < r.length; i++) if (r[i].id === id) return r[i]; return null; }
  function who(list) { return '<span class="who">' + (list || []).map(function (k) { return ROLE[k] ? '<i>' + ROLE[k] + '</i>' : ''; }).join('') + '</span>'; }
  function pct(v) { return v == null || v === '' ? '–' : (+v).toFixed(1) + '%'; }
  function num(v) { return v == null || v === '' ? '–' : (+v).toLocaleString('ko-KR'); }

  /* 일정 상태 */
  function sched(s) {
    var t = MJG.today(), st = MJG.parseDate(s.start), en = MJG.parseDate(s.end) || st;
    var day = 86400000;
    if (st && t < st) { var d1 = Math.round((st - t) / day); return { k: 'wait', label: '시작 D-' + d1, cls: d1 <= 14 ? 'soon' : '' , order: 1, d: d1}; }
    if (en && t <= en) { var d2 = Math.round((en - t) / day); return { k: 'on', label: d2 === 0 ? '오늘 마감' : '마감 D-' + d2, cls: d2 <= 14 ? 'soon' : 'on', order: 0, d: d2 }; }
    return { k: 'end', label: '종료', cls: '', order: 2, d: 9999 };
  }
  function schedSorted(filter) {
    return D().schedule.filter(function (s) { return !filter || (s.who || []).indexOf(filter) >= 0; })
      .map(function (s) { return { s: s, st: sched(s) }; })
      .sort(function (a, b) { return a.st.order - b.st.order || a.st.d - b.st.d; });
  }
  function schedHtml(list) {
    if (!list.length) return '<p class="muted">해당 일정이 없습니다.</p>';
    return '<div class="list">' + list.map(function (o) {
      var s = o.s, link = s.res ? '#/res/' + s.res : s.qa ? '#/fp/' + s.qa : '';
      var inner = '<span class="ld">' + esc(MJG.fmtDate(s.start)).replace(/\.$/, '') + '<br>~' + esc(MJG.fmtDate(s.end)).replace(/\.$/, '') + '</span>' +
        '<span class="lb"><b>' + esc(s.title) + '</b><span>' + esc(s.desc) + '</span>' + who(s.who) + '</span>' +
        '<span class="dday ' + o.st.cls + '">' + o.st.label + '</span>';
      return link ? '<a class="li" href="' + esc(MJG.safeUrl(link)) + '">' + inner + '</a>' : '<div class="li">' + inner + '</div>';
    }).join('') + '</div>';
  }

  function resCard(r) {
    var ref = /서울특별시교육청/.test(r.publisher);
    return '<a class="rcard" href="#/res/' + esc(r.id) + '"><span class="rc">' + esc(r.cat) + '</span><b>' + esc(r.title) + '</b><p>' + esc(r.summary) + '</p>' +
      '<span class="rmeta"><i>' + esc(r.publisher) + '</i><i>' + esc(r.year) + '</i>' + (r.pages ? '<i>' + esc(r.pages) + '쪽</i>' : '') + (r.size ? '<i>' + MJG.fmtSize(r.size) + '</i>' : '') + (ref ? '<span class="tag ref">타 시도 참고</span>' : '') + '</span></a>';
  }

  /* ───────── 홈 ───────── */
  V.home = function (el) {
    var d = D(), st = d.stats, R0 = (st.releases || [])[0] || {}, nat = (R0.national || []).filter(function (x) { return x.type === '전체'; })[0] || {};
    var pv = (st.trend || []).filter(function (t) { return t.type === '전체' && t.pub === R0.pub - 1; })[0];
    var gj = (R0.sido || []).filter(function (x) { return x.sido === '광주'; })[0], jn = (R0.sido || []).filter(function (x) { return x.sido === '전남'; })[0];
    var pins = d.notices.slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.date < b.date ? 1 : -1); }).slice(0, 3);
    var up = schedSorted().filter(function (o) { return o.st.k !== 'end'; }).slice(0, 4);
    var quick = (window.FP.QUICK || []).slice(0, 6).map(qaById).filter(Boolean);
    var diff = pv && nat.rate != null ? (nat.rate - pv.rate) : null;
    el.innerHTML =
      '<div class="hero"><h1>미래로 가는 첫 직장,<br>미래 JOB GO</h1><p>' + esc(d.meta.summary) + '</p>' +
      '<form class="hsearch" id="hsearch" role="search"><input id="hq" type="search" placeholder="무엇이든 찾아보세요: 순회지도, 수당, 장려금" aria-label="통합 검색" enterkeyhint="search"><button type="submit">검색</button></form></div>' +
      '<div class="sect"><h2>누구를 위한 안내가 필요하세요?</h2><div class="roles">' +
      d.roles.map(function (r) { return '<a class="rolecard" href="#/role/' + esc(r.key) + '"><span class="ri" aria-hidden="true">' + (ROLE_INI[r.key] || '') + '</span><b>' + esc(r.name) + '</b><span>' + esc(r.lead).slice(0, 46) + '…</span></a>'; }).join('') +
      '</div></div>' +
      '<div class="sect"><h2>취업 지원 한곳에서</h2><div class="guidegrid2">' +
      '<a class="guidecard" href="#/center"><span class="ri" aria-hidden="true">센</span><span class="gb"><b>취업지원센터</b><small>지원 사업, 13개 직업계고 학과·연락처, 취업 후 혜택</small></span><span class="ga" aria-hidden="true">→</span></a>' +
      '<a class="guidecard" href="#/district"><span class="ri" aria-hidden="true">혁</span><span class="gb"><b>빛고을 직업교육혁신지구</b><small>취업동아리 40팀 현황, 지역대학 연계, 정주·일학습병행지원금</small></span><span class="ga" aria-hidden="true">→</span></a>' +
      '<a class="guidecard" href="#/fp/leaf"><span class="ri" aria-hidden="true">실</span><span class="gb"><b>현장실습 리플릿 요약</b><small>공통매뉴얼 리플릿(기업용·학교용) 핵심 정리</small></span><span class="ga" aria-hidden="true">→</span></a></div></div>' +
      '<div class="sect"><h2>공지사항 <a href="#/notices">전체 보기</a></h2><div class="list">' +
      pins.map(function (n) { return '<a class="li" href="#/notices/' + esc(n.id) + '"><span class="ld">' + esc(MJG.fmtDate(n.date)) + '</span><span class="lb"><b>' + (n.pin ? '<span class="pin">고정</span>' : '') + esc(n.title) + '</b></span></a>'; }).join('') + '</div></div>' +
      '<div class="sect"><h2>다가오는 일정 <a href="#/schedule">전체 일정</a></h2>' + schedHtml(up) + '</div>' +
      '<div class="sect"><h2>' + esc(R0.pub) + '년 발표 직업계고 취업통계 <a href="#/stats">자세히</a></h2>' +
      '<p class="cohortline"><b>대상</b> ' + esc(R0.cohort) + '(' + esc(R0.gradLabel) + ') · 조사기준일 ' + esc(R0.surveyDate) + '</p><div class="statstrip s5">' +
      '<div class="tile"><span class="tl">취업률</span><span class="tv">' + pct(nat.rate) + '</span><span class="td">' + (diff != null ? (diff >= 0 ? '<span class="up">▲ ' : '<span class="down">▼ ') + Math.abs(diff).toFixed(1) + '%p</span> 전년 대비' : '') + '</span></div>' +
      '<div class="tile"><span class="tl">진학률</span><span class="tv">' + pct(nat.advRate) + '</span><span class="td">졸업자 대비</span></div>' +
      '<div class="tile"><span class="tl">광주 취업률</span><span class="tv">' + pct(gj && gj.rate) + '</span><span class="td">17개 시도 중 ' + (gj ? esc(gj.rank) : '–') + '위</span></div>' +
      '<div class="tile"><span class="tl">전남 취업률</span><span class="tv">' + pct(jn && jn.rate) + '</span><span class="td">17개 시도 중 ' + (jn ? esc(jn.rank) : '–') + '위</span></div>' +
      '<div class="tile"><span class="tl">300인 이상 기업 취업</span><span class="tv">' + pct(R0.big300) + '</span><span class="td">취업자 중 비중</span></div>' +
      '</div><p class="muted m0" id="hstatsrc"></p></div>' +
      '<div class="sect"><h2>현장실습, 이렇게 물어보세요 <a href="#/fp/ask">질문하기</a></h2><div class="quickgrid">' +
      quick.map(function (o) { return '<a class="qcard" href="#/fp/' + esc(o.x.id) + '"><span class="qi" aria-hidden="true">?</span><b>' + esc(o.x.q) + '</b></a>'; }).join('') + '</div></div>' +
      '<div class="sect"><h2>새로 올라온 자료 <a href="#/res">자료실</a></h2><div class="rgrid">' + d.resources.slice(0, 3).map(resCard).join('') + '</div></div>';
    el.querySelector('#hstatsrc').textContent = '출처: ' + st.source + '(' + (R0.releasedAt || '') + ' 발표)';
    el.querySelector('#hsearch').addEventListener('submit', function (e) { e.preventDefault(); var v = el.querySelector('#hq').value.trim(); if (v) MJG.go('#/search/' + encodeURIComponent(v)); });
  };

  /* ───────── 통합 검색 ───────── */
  function norm(s) { return String(s || '').toLowerCase().replace(/[\s·ㆍ.,()「」『』\-~]/g, ''); }
  V.search = function (el, r) {
    var term = r.a ? decodeURIComponent(r.a) : '';
    el.innerHTML = '<h1 class="vt">통합 검색</h1><form id="sform" role="search"><input class="finput" id="sq" type="search" placeholder="낱말을 입력하세요(예: 순회지도, 장려금, HIFIVE)" value="' + esc(term) + '" aria-label="검색어" enterkeyhint="search"></form><div id="sout"></div>';
    var inp = el.querySelector('#sq'), out = el.querySelector('#sout');
    function run(v) {
      var toks = v.trim().split(/\s+/).map(norm).filter(function (t) { return t.length >= 1; });
      if (!toks.length) { out.innerHTML = '<p class="muted">현장실습 Q&amp;A, 자료실, 공지, 일정, 대상별 안내, 취업지원센터, 직업교육혁신지구를 한꺼번에 찾습니다.</p>'; return; }
      function hit(text) { var n = norm(text); return toks.every(function (t) { return n.indexOf(t) >= 0; }); }
      var groups = [];
      var qa = (window.QA || []).map(function (x, i) { return { x: x, no: i + 1 }; }).filter(function (o) { return hit(o.x.q + ' ' + o.x.a + ' ' + (o.x.k || []).join(' ')); });
      if (qa.length) groups.push(['현장실습 Q&A', qa.slice(0, 30).map(function (o) { return '<a href="#/fp/' + esc(o.x.id) + '"><span class="k">Q&amp;A</span><span>' + esc(o.x.q) + '</span></a>'; })]);
      var rs = D().resources.filter(function (x) { return hit(x.title + ' ' + x.summary + ' ' + (x.points || []).join(' ') + ' ' + x.publisher); });
      if (rs.length) groups.push(['자료실', rs.map(function (x) { return '<a href="#/res/' + esc(x.id) + '"><span class="k">자료</span><span>' + esc(x.title) + '</span></a>'; })]);
      var ns = D().notices.filter(function (x) { return hit(x.title + ' ' + x.body); });
      if (ns.length) groups.push(['공지사항', ns.map(function (x) { return '<a href="#/notices/' + esc(x.id) + '"><span class="k">공지</span><span>' + esc(x.title) + '</span></a>'; })]);
      var ss = D().schedule.filter(function (x) { return hit(x.title + ' ' + x.desc); });
      if (ss.length) groups.push(['주요 일정', ss.map(function (x) { return '<a href="#/schedule"><span class="k">일정</span><span>' + esc(x.title) + '</span></a>'; })]);
      var rl = [];
      D().roles.forEach(function (ro) {
        (ro.keyfacts || []).forEach(function (f) { if (hit(f[0] + ' ' + f[1])) rl.push('<a href="#/role/' + esc(ro.key) + '/' + encodeURIComponent(v.trim()) + '"><span class="k">' + esc(ro.name) + '</span><span>' + esc(f[0]) + ': ' + esc(f[1]) + '</span></a>'); });
        (ro.phases || []).forEach(function (ph) { (ph.items || []).forEach(function (it) { if (hit(it)) rl.push('<a href="#/role/' + esc(ro.key) + '/' + encodeURIComponent(v.trim()) + '"><span class="k">' + esc(ro.name) + '</span><span>' + esc(it) + '</span></a>'); }); });
      });
      if (rl.length) groups.push(['대상별 안내', rl.slice(0, 20)]);
      var chs = MJG.chapterHits ? MJG.chapterHits(v) : [];
      if (chs.length) groups.push(['취업지원센터·혁신지구·리플릿', chs]);
      out.innerHTML = groups.length ? groups.map(function (g) { return '<div class="sect"><h2>' + esc(g[0]) + ' <span class="muted">' + g[1].length + '건</span></h2><div class="sres">' + g[1].join('') + '</div></div>'; }).join('') +
        '<p class="muted">문장으로 물어보려면 <a href="#/fp/ask">현장실습 질문하기</a>를 이용하세요.</p>'
        : '<p class="muted">찾는 내용이 없습니다. 다른 낱말로 검색하거나 <a href="#/fp/ask">현장실습 질문하기</a>에 문장으로 물어보세요.</p>';
    }
    var tm; inp.addEventListener('input', function () { clearTimeout(tm); var v = inp.value; tm = setTimeout(function () { run(v); try { history.replaceState(null, '', '#/search/' + encodeURIComponent(v)); } catch (e) {} }, 150); });
    el.querySelector('#sform').addEventListener('submit', function (e) { e.preventDefault(); run(inp.value); inp.blur(); });
    run(term); if (!term) setTimeout(function () { inp.focus(); }, 50);
  };

  /* ───────── 대상별 안내 ───────── */
  V.role = function (el, r) {
    var roles = D().roles, ro = null;
    roles.forEach(function (x) { if (x.key === r.a) ro = x; }); if (!ro) ro = roles[0];
    var ck = 'mjg.chk.' + ro.key, saved = {};
    try { saved = JSON.parse(MJG.store.get(ck) || '{}') || {}; } catch (e) {}
    var qa = (ro.qa || []).map(qaById).filter(Boolean);
    var rs = (ro.res || []).map(resById).filter(Boolean);
    var lk = D().links.filter(function (l) { return (l.roles || []).indexOf(ro.key) >= 0; });
    el.innerHTML =
      '<div class="rolehead"><nav class="rtabs" aria-label="대상 선택">' + roles.map(function (x) { return '<a href="#/role/' + esc(x.key) + '"' + (x.key === ro.key ? ' aria-current="page"' : '') + '>' + esc(x.name) + '</a>'; }).join('') + '</nav>' +
      '<h1 class="vt">' + esc(ro.name) + ' 취업지원 안내</h1><p class="rlead">' + esc(ro.lead) + '</p>' +
      '<form class="rsearch" id="rsearch" role="search"><input class="finput" id="rsq" type="search" placeholder="' + esc(ro.name) + ' 자료 검색(예: 협약, 수당, 산재)" aria-label="' + esc(ro.name) + ' 자료 검색" enterkeyhint="search"><button type="submit">검색</button></form></div>' +
      '<p class="hitnote" id="hitnote" hidden></p>' +
      '<div class="sect"><h2>꼭 알아둘 기준</h2><dl class="facts">' + (ro.keyfacts || []).map(function (f) { return '<dt>' + esc(f[0]) + '</dt><dd>' + esc(f[1]) + '</dd>'; }).join('') + '</dl></div>' +
      '<a class="statlink" href="#/stats" id="toStats"><span><b>' + esc(ro.name) + '에게 필요한 취업통계 보기</b><small>' + esc({ student: '내 계열 취업률, 선배들이 취업한 회사 규모·업종, 취업 유지율', teacher: '광주·전남과 전국 비교, 학교유형·계열별 취업률, 유지취업률', jobcoach: '시도·계열별 취업률, 업종·규모별 취업처, 관내·관외 취업', school: '시도 순위, 학교유형·설립주체별 비교, 연도별 추이', company: '업종·사업장 규모별 취업자, 계열별 배출 인원', supervisor: '우리 지역 4개년 추이·시도 순위, 보고용 요약 문장(개조식), 연계 사업 바로가기' }[ro.key] || '') + '</small></span><span aria-hidden="true">→</span></a>' +
      '<div class="sect"><h2>함께 보면 좋은 메뉴</h2><div class="guidegrid2">' + (ro.key === 'supervisor' ? [['#/fpstat', '통', '현장실습 통계(장학사 확인용)', '학교별 참여·유형·기업·취업 전환·지원금'], ['#/stats', '취', '취업통계 정책 브리핑', '광주·전남 4개년 추이·보고용 요약 문장']] : []).concat([['#/center', '센', '취업지원센터', '지원 사업·13개교 학과 현황·취업 후 혜택'], ['#/district', '혁', '빛고을 직업교육혁신지구', '취업동아리 현황·지역대학 연계·정주지원금'], ['#/fp/leaf', '실', '현장실습 리플릿 요약', '운영 기준·지원금·적용 법령']]).map(function (m) { return '<a class="guidecard" href="' + m[0] + '"><span class="ri" aria-hidden="true">' + m[1] + '</span><span class="gb"><b>' + m[2] + '</b><small>' + m[3] + '</small></span><span class="ga" aria-hidden="true">→</span></a>'; }).join('') + '</div></div>' +
      '<div class="sect"><h2>단계별 체크리스트 <button type="button" class="ghost" id="ckreset">체크 초기화</button></h2><p class="muted m0" id="ckhint"></p><div class="phases">' +
      (ro.phases || []).map(function (ph, pi) {
        var done = 0; (ph.items || []).forEach(function (it, ii) { if (saved[pi + '-' + ii]) done++; });
        return '<div class="phase"><h3>' + esc(ph.name) + ' <small data-pc="' + pi + '">' + done + '/' + (ph.items || []).length + '</small></h3>' +
          (ph.items || []).map(function (it, ii) { var k = pi + '-' + ii; return '<label class="chk"><input type="checkbox" data-k="' + k + '"' + (saved[k] ? ' checked' : '') + '><span>' + esc(it) + '</span></label>'; }).join('') + '</div>';
      }).join('') + '</div></div>' +
      (qa.length ? '<div class="sect"><h2>이렇게 물어보세요 <a href="#/fp/ask">현장실습 질문하기</a></h2><div class="quickgrid">' + qa.map(function (o) { return '<a class="qcard" href="#/fp/' + esc(o.x.id) + '"><span class="qi" aria-hidden="true">?</span><b>' + esc(o.x.q) + '</b></a>'; }).join('') + '</div></div>' : '') +
      '<div class="sect"><h2>관련 일정</h2>' + schedHtml(schedSorted(ro.key).filter(function (o) { return o.st.k !== 'end'; })) + '</div>' +
      '<div class="sect"><h2>추천 자료 <a href="#/res" id="toRes">' + esc(ro.name) + ' 자료 모두 보기</a></h2>' + (rs.length ? '<div class="rgrid">' + rs.map(resCard).join('') + '</div>' : '<p class="muted">자료실에서 ' + esc(ro.name) + ' 대상 자료를 확인하세요.</p>') + '</div>' +
      (lk.length ? '<div class="sect"><h2>바로가기</h2><div class="linklist">' + lk.map(function (l) { var u = MJG.safeUrl(l.url); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(l.title) + '<small>' + esc(l.desc) + '</small></span></a>' : ''; }).join('') + '</div></div>' : '');
    el.querySelector('#ckhint').textContent = '체크 표시는 이 기기에만 저장되며 어디에도 전송되지 않습니다.';
    el.querySelectorAll('.chk input').forEach(function (c) {
      c.addEventListener('change', function () {
        if (c.checked) saved[c.getAttribute('data-k')] = 1; else delete saved[c.getAttribute('data-k')];
        MJG.store.set(ck, JSON.stringify(saved));
        var pi = c.getAttribute('data-k').split('-')[0], ph = ro.phases[+pi], dn = 0;
        ph.items.forEach(function (it, ii) { if (saved[pi + '-' + ii]) dn++; });
        el.querySelector('[data-pc="' + pi + '"]').textContent = dn + '/' + ph.items.length;
      });
    });
    el.querySelectorAll('.guidegrid2 a[href="#/stats"]').forEach(function (a) { a.addEventListener('click', function () { SS.lens = 'sup'; MJG.store.set('mjg.statLens', 'sup'); }); });
    el.querySelector('#toStats').addEventListener('click', function () { SS.lens = { student: 'student', teacher: 'teacher', jobcoach: 'teacher', school: 'teacher', company: 'company', supervisor: 'sup' }[ro.key] || 'all'; MJG.store.set('mjg.statLens', SS.lens); });
    el.querySelector('#ckreset').addEventListener('click', function () { MJG.store.del(ck); MJG._keepScroll = true; V.role(el, r); });
    el.querySelector('#toRes').addEventListener('click', function () { resState.role = ro.key; resState.cat = ''; resState.q = ''; });
    el.querySelector('#rsearch').addEventListener('submit', function (e) { e.preventDefault(); var v = el.querySelector('#rsq').value.trim(); resState.role = ro.key; resState.cat = ''; resState.q = v; MJG.go('#/res'); });
    /* 자료실·통합 검색에서 넘어온 검색어: 해당 기준·체크 항목을 강조하고 첫 항목으로 이동 */
    var term = r.b ? decodeURIComponent(r.b) : '';
    if (term) {
      var toks = term.split(/\s+/).map(norm).filter(Boolean), first = null, n = 0;
      el.querySelectorAll('.facts dt, .chk span').forEach(function (node) {
        var isDt = node.tagName === 'DT', box = isDt ? node : node.closest('.chk');
        var t = norm(isDt ? node.textContent + ' ' + (node.nextElementSibling ? node.nextElementSibling.textContent : '') : node.textContent);
        if (toks.every(function (k) { return t.indexOf(k) >= 0; })) { box.classList.add('hit'); if (isDt && node.nextElementSibling) node.nextElementSibling.classList.add('hit'); n++; if (!first) first = box; }
      });
      var hn = el.querySelector('#hitnote');
      hn.hidden = false; hn.textContent = n ? '‘' + term + '’ 관련 항목 ' + n + '개를 노란색으로 표시했습니다.' : '‘' + term + '’이(가) 들어간 항목이 이 안내에는 없습니다.';
      if (first) setTimeout(function () { first.scrollIntoView({ block: 'center' }); }, 60);
    }
  };

  /* ───────── 자료실 ───────── */
  var resState = { role: '', cat: '', q: '' };
  function linkHtml(l) { var u = MJG.safeUrl(l.url); return u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer"><span>' + esc(l.title) + '<small>' + esc(l.desc) + '</small></span></a>' : ''; }
  V.res = function (el) {
    var all = D().resources, roles = D().roles, cats = [];
    all.forEach(function (x) { if (cats.indexOf(x.cat) < 0) cats.push(x.cat); });
    el.innerHTML = '<h1 class="vt">취업지원 자료실</h1><p class="vsub">자료, 대상별 안내, 현장실습 Q&amp;A, 누리집을 한 번에 찾습니다. 대상을 고르면 그 대상의 안내와 자료만 모아 보여 줍니다.</p>' +
      '<div class="filters"><form id="rform" role="search" class="rsearch"><input class="finput" id="rq" type="search" placeholder="검색: 협약, 산재, 장려금, 채용, 체크리스트" aria-label="자료실 검색" value="' + esc(resState.q) + '" enterkeyhint="search"><button type="submit">검색</button></form>' +
      '<div class="frow" role="group" aria-label="대상"><span class="fl">대상</span>' + [['', '전체']].concat(roles.map(function (ro) { return [ro.key, ro.name]; })).map(function (p) { return '<button type="button" class="fchip" data-role="' + esc(p[0]) + '" aria-pressed="' + (resState.role === p[0]) + '">' + esc(p[1]) + '</button>'; }).join('') + '</div>' +
      '<div class="frow" role="group" aria-label="분류"><span class="fl">분류</span>' + [''].concat(cats).map(function (c) { return '<button type="button" class="fchip" data-cat="' + esc(c) + '" aria-pressed="' + (resState.cat === c) + '">' + (c ? esc(c) : '전체') + '</button>'; }).join('') + '</div></div>' +
      '<div id="rguide"></div><div id="rhits"></div>' +
      '<div class="sect"><h2 id="rhead">자료</h2><p class="muted m0" id="rcount"></p><div class="rgrid" id="rgrid"></div></div>' +
      '<div class="sect"><h2 id="lhead">유용한 누리집</h2><div class="linklist" id="rlinks"></div></div>';
    function draw() {
      var q = resState.q.trim(), toks = q.split(/\s+/).map(norm).filter(Boolean);
      function hit(text) { var n = norm(text); return toks.every(function (t) { return n.indexOf(t) >= 0; }); }
      var qs = q ? '/' + encodeURIComponent(q) : '';
      /* 1) 대상별 안내 바로가기 */
      var shown = resState.role ? roles.filter(function (ro) { return ro.key === resState.role; }) : roles;
      var g = '';
      if (resState.role && shown[0]) {
        var ro = shown[0];
        g = '<a class="guidecard" href="#/role/' + esc(ro.key) + qs + '"><span class="ri" aria-hidden="true">' + (ROLE_INI[ro.key] || '') + '</span><span class="gb"><b>' + esc(ro.name) + ' 취업지원 안내 바로가기</b><small>' + esc(ro.lead) + '</small><small class="gm">꼭 알아둘 기준 ' + (ro.keyfacts || []).length + '개 · 단계별 체크리스트 ' + (ro.phases || []).length + '단계 · 관련 일정·통계</small></span><span class="ga" aria-hidden="true">→</span></a>';
      } else if (!q) {
        g = '<div class="sect"><h2>대상별 안내 바로가기</h2><div class="guidegrid">' + roles.map(function (r0) { return '<a class="guidemini" href="#/role/' + esc(r0.key) + '"><span class="ri" aria-hidden="true">' + (ROLE_INI[r0.key] || '') + '</span><b>' + esc(r0.name) + '</b><span class="ga" aria-hidden="true">→</span></a>'; }).join('') + '</div></div>';
      }
      el.querySelector('#rguide').innerHTML = g;
      /* 2) 검색어가 있으면 대상별 안내와 현장실습 질문하기로 연결 */
      var h = '';
      if (toks.length) {
        var rl = [];
        shown.forEach(function (r1) {
          (r1.keyfacts || []).forEach(function (f) { if (hit(f[0] + ' ' + f[1])) rl.push('<a href="#/role/' + esc(r1.key) + qs + '"><span class="k">' + esc(r1.name) + '</span><span>' + esc(f[0]) + ': ' + esc(f[1]) + '</span></a>'); });
          (r1.phases || []).forEach(function (ph) { (ph.items || []).forEach(function (it) { if (hit(it)) rl.push('<a href="#/role/' + esc(r1.key) + qs + '"><span class="k">' + esc(r1.name) + '</span><span>' + esc(ph.name) + ' · ' + esc(it) + '</span></a>'); }); });
        });
        var qa = (window.QA || []).filter(function (x) { return hit(x.q + ' ' + x.a + ' ' + (x.k || []).join(' ')); });
        h += '<div class="sect"><h2>대상별 안내 <span class="muted">' + rl.length + '건</span></h2>' + (rl.length ? '<div class="sres">' + rl.slice(0, 12).join('') + '</div>' + (rl.length > 12 ? '<p class="muted">' + (rl.length - 12) + '건이 더 있습니다. 대상을 골라 범위를 좁혀 보세요.</p>' : '') : '<p class="muted m0">대상별 안내에는 ‘' + esc(q) + '’ 관련 항목이 없습니다.</p>') + '</div>';
        var chs = MJG.chapterHits ? MJG.chapterHits(q) : [];
        if (chs.length) h += '<div class="sect"><h2>취업지원센터·혁신지구·리플릿 <span class="muted">' + chs.length + '건</span></h2><div class="sres">' + chs.join('') + '</div></div>';
        h += '<div class="sect"><h2>현장실습 Q&amp;A</h2><a class="askcard" href="#/fp/ask/' + encodeURIComponent(q) + '"><span><b>‘' + esc(q) + '’ 현장실습 질문하기로 물어보기</b><small>' + (qa.length ? '관련 답변이 있습니다. ' : '') + '매뉴얼 쪽수와 법령 근거를 붙여 답합니다.</small></span><span class="ga" aria-hidden="true">→</span></a></div>';
      }
      el.querySelector('#rhits').innerHTML = h;
      /* 3) 자료 */
      var list = all.filter(function (x) {
        if (resState.role && (x.roles || []).indexOf(resState.role) < 0) return false;
        if (resState.cat && x.cat !== resState.cat) return false;
        return hit(x.title + ' ' + x.summary + ' ' + (x.points || []).join(' ') + ' ' + x.publisher + ' ' + x.cat);
      });
      el.querySelector('#rhead').innerHTML = '자료 <span class="muted">' + list.length + '건</span>';
      el.querySelector('#rcount').textContent = [resState.role ? ROLE[resState.role] + ' 대상' : '', resState.cat, q ? '‘' + q + '’ 검색' : ''].filter(Boolean).join(' · ');
      el.querySelector('#rgrid').innerHTML = list.length ? list.map(resCard).join('') : '<p class="muted">조건에 맞는 자료가 없습니다.' + (resState.cat || resState.role ? ' 대상이나 분류를 ‘전체’로 바꿔 보세요.' : '') + '</p>';
      /* 4) 누리집: 대상·검색어로 함께 거름 */
      var lk = D().links.filter(function (l) { return (!resState.role || (l.roles || []).indexOf(resState.role) >= 0) && hit(l.title + ' ' + l.desc); });
      el.querySelector('#lhead').innerHTML = '유용한 누리집 <span class="muted">' + lk.length + '곳</span>';
      el.querySelector('#rlinks').innerHTML = lk.length ? lk.map(linkHtml).join('') : '<p class="muted m0">조건에 맞는 누리집이 없습니다.</p>';
    }
    el.querySelectorAll('.fchip').forEach(function (b) {
      b.addEventListener('click', function () {
        if (b.hasAttribute('data-role')) resState.role = b.getAttribute('data-role'); else resState.cat = b.getAttribute('data-cat');
        el.querySelectorAll('.fchip').forEach(function (o) { o.setAttribute('aria-pressed', String(o.hasAttribute('data-role') ? o.getAttribute('data-role') === resState.role : o.getAttribute('data-cat') === resState.cat)); });
        draw();
      });
    });
    var tm, inp = el.querySelector('#rq');
    inp.addEventListener('input', function () { clearTimeout(tm); var v = this.value; tm = setTimeout(function () { resState.q = v; draw(); }, 150); });
    el.querySelector('#rform').addEventListener('submit', function (e) {
      e.preventDefault(); clearTimeout(tm); resState.q = inp.value; draw(); inp.blur();
      var t = el.querySelector('#rguide .guidecard') || el.querySelector('#rhits .sect'); if (t) t.scrollIntoView({ block: 'start' });
    });
    draw();
  };

  V.resdetail = function (el, r) {
    var x = resById(r.a);
    if (!x) { el.innerHTML = '<a class="back" href="#/res">← 자료실</a><div class="err">자료를 찾을 수 없습니다.</div>'; return; }
    var f = MJG.safeUrl(x.file), fname = (x.title.replace(/[\\/:*?"<>|]/g, '').slice(0, 80)) + '.pdf';
    el.innerHTML = '<a class="back" href="#/res">← 자료실</a>' +
      '<div><span class="tag">' + esc(x.cat) + '</span> ' + (/서울특별시교육청/.test(x.publisher) ? '<span class="tag ref">타 시도 참고자료</span>' : '') + '</div>' +
      '<h1 class="vt">' + esc(x.title) + '</h1>' +
      '<dl class="kv"><dt>발간</dt><dd>' + esc(x.publisher) + ' · ' + esc(x.year) + '</dd>' + (x.pages ? '<dt>분량</dt><dd>' + esc(x.pages) + '쪽' + (x.size ? ' · ' + MJG.fmtSize(x.size) : '') + '</dd>' : '') + '<dt>대상</dt><dd>' + who(x.roles) + '</dd></dl>' +
      (f ? '<div class="btnrow"><a class="btn" href="' + esc(f) + '" target="_blank" rel="noopener">자료 열기(PDF)</a><a class="btn line" href="' + esc(f) + '" download="' + esc(fname) + '">내려받기</a></div>' : '') +
      '<div class="card"><p class="m0" id="rsum"></p></div>' +
      ((x.points || []).length ? '<div class="sect"><h2>핵심 내용</h2><ul class="points">' + x.points.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ul></div>' : '') +
      (x.note ? '<p class="notebox">' + esc(x.note) + '</p>' : '') +
      ((x.links || []).length ? '<div class="sect"><h2>바로가기</h2><div class="linklist">' + x.links.map(function (l) { var u = MJG.safeUrl(l.url); return u ? '<a href="' + esc(u) + '"' + (u.charAt(0) === '#' ? '' : ' target="_blank" rel="noopener noreferrer"') + '><span>' + esc(l.title) + '</span></a>' : ''; }).join('') + '</div></div>' : '');
    el.querySelector('#rsum').textContent = x.summary;
  };

  /* ───────── 일정·공지 ───────── */
  var schFilter = '';
  V.schedule = function (el) {
    el.innerHTML = '<h1 class="vt">주요 일정</h1><p class="vsub">지원금·장려금 신청, 지도·점검 등 놓치기 쉬운 기한입니다. 마감 14일 이내 일정은 주황색으로 표시합니다.</p>' +
      '<div class="frow" role="group" aria-label="대상">' + [['', '전체']].concat(Object.keys(ROLE).map(function (k) { return [k, ROLE[k]]; })).map(function (p) { return '<button type="button" class="fchip" data-r="' + p[0] + '" aria-pressed="' + (schFilter === p[0]) + '">' + p[1] + '</button>'; }).join('') + '</div><div id="slist"></div>';
    function draw() { el.querySelector('#slist').innerHTML = schedHtml(schedSorted(schFilter)); }
    el.querySelectorAll('.fchip').forEach(function (b) { b.addEventListener('click', function () { schFilter = b.getAttribute('data-r'); el.querySelectorAll('.fchip').forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-r') === schFilter)); }); draw(); }); });
    draw();
  };
  V.notices = function (el, r) {
    var ns = D().notices.slice().sort(function (a, b) { return (b.pin ? 1 : 0) - (a.pin ? 1 : 0) || (a.date < b.date ? 1 : -1); });
    el.innerHTML = '<h1 class="vt">공지사항</h1><div class="list">' + ns.map(function (n) {
      var u = MJG.safeUrl(n.link);
      return '<details class="nitem" id="nt-' + esc(n.id) + '"' + (r.a === n.id ? ' open' : '') + '><summary><b>' + (n.pin ? '<span class="pin">고정</span>' : '') + esc(n.title) + '</b><span>' + esc(MJG.fmtDate(n.date)) + '</span></summary>' +
        '<p>' + esc(n.body) + '</p>' + (u ? '<a class="btn sm line" href="' + esc(u) + '"' + (/^https/.test(u) ? ' target="_blank" rel="noopener noreferrer"' : '') + '>관련 내용 보기</a>' : '') + '</details>';
    }).join('') + '</div>';
    if (r.a) { var t = el.querySelector('#nt-' + CSS.escape(r.a)); if (t) setTimeout(function () { t.scrollIntoView({ block: 'center' }); }, 30); }
  };

  /* ───────── 통계(차트) ───────── */
  function niceMax(v) { var s = [10, 20, 25, 40, 50, 60, 70, 75, 80, 100]; for (var i = 0; i < s.length; i++) if (v <= s[i]) return s[i]; return Math.ceil(v / 10) * 10; }
  function svgOpen(w, h, label) { return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + esc(label) + '">'; }
  function yAxis(W, H, L, R, T, B, max, step) {
    var s = '';
    for (var v = 0; v <= max + 0.001; v += step) {
      var y = T + (H - T - B) * (1 - v / max);
      s += '<line class="gl" x1="' + L + '" x2="' + (W - R) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (L - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + v + '</text>';
    }
    return s;
  }
  /* 꺾은선: series=[{name,cls,values}] (값 없음은 끊어 그림) */
  function lineChart(xs, series, opt) {
    var W = opt.W || cw(), H = opt.H || (opt.sub ? 316 : 300), L = 40, R = W < 480 ? 70 : 86, T = 16, B = opt.sub ? 50 : 34;
    var mx = 0; series.forEach(function (s) { s.values.forEach(function (v) { if (v != null && v > mx) mx = v; }); });
    var max = opt.max || niceMax(mx * 1.08), step = max / 5;
    var X = function (i) { return L + (W - L - R) * (xs.length === 1 ? 0.5 : i / (xs.length - 1)); };
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    var s = svgOpen(W, H, opt.label) + yAxis(W, H, L, R, T, B, max, step);
    s += '<text x="' + L + '" y="10" text-anchor="start">(%)</text>';
    xs.forEach(function (x, i) { if (W < 520 && xs.length > 5 && i % 2 && i !== xs.length - 1) return; s += '<text x="' + X(i) + '" y="' + (H - B + 18) + '" text-anchor="middle">' + esc(x) + '</text>' + (opt.sub ? '<text class="xsub" x="' + X(i) + '" y="' + (H - B + 34) + '" text-anchor="middle">' + esc(opt.sub(i)) + '</text>' : ''); });
    s += '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/>';
    var labels = [];
    series.forEach(function (se) {
      var d = '', pen = false;
      se.values.forEach(function (v, i) { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; });
      s += '<path class="ln ' + se.cls + '" d="' + d + '"/>';
      se.values.forEach(function (v, i) { if (v != null) s += '<circle class="pt ' + se.cls + '" cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="4"/>'; });
      var li = -1; se.values.forEach(function (v, i) { if (v != null) li = i; });
      if (li >= 0) labels.push({ y: Y(se.values[li]), x: X(li), t: se.name + ' ' + se.values[li].toFixed(1) });
    });
    labels.sort(function (a, b) { return a.y - b.y; });
    for (var k = 1; k < labels.length; k++) if (labels[k].y - labels[k - 1].y < 15) labels[k].y = labels[k - 1].y + 15;
    labels.forEach(function (lb) { s += '<text class="dl" x="' + (lb.x + 8) + '" y="' + (lb.y + 4) + '">' + esc(lb.t) + '</text>'; });
    xs.forEach(function (x, i) {
      var w = (W - L - R) / Math.max(1, xs.length - 1);
      var tip = '<b>' + esc(opt.tipTitle ? opt.tipTitle(i) : x) + '</b>' + series.map(function (se) { return esc(se.name) + ' ' + pct(se.values[i]); }).join('<br>');
      s += '<rect class="hit" x="' + (X(i) - w / 2).toFixed(1) + '" y="' + T + '" width="' + w.toFixed(1) + '" height="' + (H - T - B) + '" data-tip="' + esc(tip) + '"/><line class="hl" x1="' + X(i) + '" x2="' + X(i) + '" y1="' + T + '" y2="' + (H - B) + '"/>';
    });
    return s + '</svg>';
  }
  /* 묶은 막대: groups=[{label, vals:[...]}], keys=[{name,cls}] */
  function groupBar(groups, keys, opt) {
    var W = opt.W || cw(), H = opt.H || 290, L = 40, R = 16, T = 22, B = 34;
    var max = opt.max || 100, n = keys.length;
    var gw = (W - L - R) / groups.length, bw = Math.min(46, (gw - 36) / n);
    var Y = function (v) { return T + (H - T - B) * (1 - v / max); };
    var s = svgOpen(W, H, opt.label) + yAxis(W, H, L, R, T, B, max, max / 5) + '<text x="' + L + '" y="12">(%)</text>';
    groups.forEach(function (g, gi) {
      var x0 = L + gw * gi + (gw - bw * n - 2 * (n - 1)) / 2;
      g.vals.forEach(function (v, k) {
        if (v == null) return;
        var x = x0 + k * (bw + 2), y = Y(v), h = (H - B) - y;
        s += '<path class="bar ' + keys[k].cls + '" d="M' + x.toFixed(1) + ' ' + (H - B) + 'V' + (y + 4).toFixed(1) + 'q0 -4 4 -4h' + (bw - 8).toFixed(1) + 'q4 0 4 4V' + (H - B) + 'Z"/>';
        if (opt.labelAll || gi === groups.length - 1) s += '<text class="dl" x="' + (x + bw / 2).toFixed(1) + '" y="' + (y - 6).toFixed(1) + '" text-anchor="middle">' + v.toFixed(1) + '</text>';
        s += '<rect class="hit" x="' + x.toFixed(1) + '" y="' + T + '" width="' + bw.toFixed(1) + '" height="' + (H - T - B) + '" data-tip="' + esc('<b>' + esc(g.label) + ' · ' + esc(keys[k].name) + '</b>' + pct(v)) + '"/>';
        void h;
      });
      s += '<text x="' + (L + gw * gi + gw / 2).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + esc(g.label) + '</text>';
    });
    return s + '<line class="ax" x1="' + L + '" x2="' + (W - R) + '" y1="' + (H - B) + '" y2="' + (H - B) + '"/></svg>';
  }
  /* 가로 막대: rows=[[이름, 값, 강조여부]], opt: max, unit, avg, avgLabel, metric */
  function hbar(rows, opt) {
    var W = opt.W || cw(), maxLab = 0; rows.forEach(function (r) { maxLab = Math.max(maxLab, String(r[0]).length); });
    var L = Math.min(150, Math.max(46, maxLab * 12.5 + 12)), R = 52, rowH = 26, T = opt.avg != null ? 26 : 8, H = T + rows.length * rowH + 24;
    var mx = 0; rows.forEach(function (r) { if (r[1] != null && r[1] > mx) mx = r[1]; });
    var unit = opt.unit == null ? '%' : opt.unit, max = opt.max;
    if (!max) { if (unit === '%') max = niceMax(mx * 1.05); else { var mg = Math.pow(10, Math.floor(Math.log10(mx * 1.05 || 1))), f = mx * 1.05 / mg; max = (f <= 2 ? 2 : f <= 5 ? 5 : 10) * mg; } }
    var X = function (v) { return L + (W - L - R) * v / max; };
    var s = svgOpen(W, H, opt.label), step = max / (W < 480 ? 2 : 4);
    for (var v = 0; v <= max + 0.001; v += step) s += '<line class="gl" x1="' + X(v) + '" x2="' + X(v) + '" y1="' + T + '" y2="' + (H - 22) + '"/><text x="' + X(v) + '" y="' + (H - 6) + '" text-anchor="middle">' + fmtN(v, unit === '%' ? 0 : 0) + (v + step > max + 0.001 ? unit : '') + '</text>';
    rows.forEach(function (r, i) {
      var y = T + i * rowH + 4, em = !!r[2];
      s += '<text x="' + (L - 8) + '" y="' + (y + 13) + '" text-anchor="end"' + (em ? ' class="dl"' : '') + '>' + esc(r[0]) + '</text>';
      if (r[1] == null) { s += '<text x="' + (L + 4) + '" y="' + (y + 13) + '">자료 없음</text>'; return; }
      var x2 = Math.max(L + 6, X(r[1]));
      s += '<path class="bar ' + (em ? 's2' : 's1') + '" d="M' + L + ' ' + y + 'H' + (x2 - 4).toFixed(1) + 'q4 0 4 4v10q0 4 -4 4H' + L + 'Z"' + (em ? '' : ' opacity="0.6"') + '/>';
      s += '<text class="dl" x="' + (x2 + 5).toFixed(1) + '" y="' + (y + 13) + '">' + fmtN(r[1], unit === '%' ? 1 : 0) + (unit === '%' ? '' : '') + '</text>';
      s += '<rect class="hit" x="0" y="' + (y - 2) + '" width="' + W + '" height="' + rowH + '" data-tip="' + esc('<b>' + esc(r[0]) + '</b>' + esc(opt.metric || '') + ' ' + fmtN(r[1], unit === '%' ? 1 : 0) + unit + (r[3] ? '<br>' + esc(r[3]) : '')) + '"/>';
    });
    if (opt.avg != null) s += '<line x1="' + X(opt.avg) + '" x2="' + X(opt.avg) + '" y1="' + T + '" y2="' + (H - 22) + '" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3" class="ax"/><text x="' + Math.min(W - 60, X(opt.avg)) + '" y="' + (T - 9) + '" text-anchor="middle">' + esc(opt.avgLabel || '전국') + ' ' + fmtN(opt.avg, 1) + '</text>';
    return s + '</svg>';
  }
  function fmtN(v, dp) { if (v == null) return '–'; return dp ? (+v).toFixed(dp) : Math.round(v).toLocaleString('ko-KR'); }
  function cw() { var v = document.querySelector('.view[data-view="stats"]'); var w = v && v.clientWidth ? v.clientWidth - 64 : 680; return Math.max(300, Math.min(880, w)); }
  function bindTips(root) {
    root.querySelectorAll('svg.chart .hit').forEach(function (h) {
      function show(e) { var p = e.touches ? e.touches[0] : e; MJG.tip.show(h.getAttribute('data-tip'), p.clientX, p.clientY); var n = h.nextElementSibling; if (n && n.classList.contains('hl')) n.classList.add('on'); }
      function hide() { MJG.tip.hide(); var n = h.nextElementSibling; if (n && n.classList.contains('hl')) n.classList.remove('on'); }
      h.addEventListener('mousemove', show); h.addEventListener('mouseleave', hide);
      h.addEventListener('touchstart', show, { passive: true });
    });
  }
  /* ───────── 취업통계(KEDI 2023~2026 발표) ───────── */
  var SS = { pub: null, lens: null, region: null, metric: 'rate', subjSort: 'rate', trendType: '전체' };
  var LENS = [['all', '전체 보기'], ['student', '학생'], ['teacher', '교사·취업지원관'], ['company', '기업체'], ['sup', '장학사']];
  var SEC = [
    ['pol', '정책 브리핑', ['sup']],
    ['ov', '한눈에', ['all', 'student', 'teacher', 'company', 'sup']],
    ['tr', '연도별 추이', ['all', 'teacher', 'sup']],
    ['rg', '시도·우리 지역', ['all', 'teacher', 'company', 'sup']],
    ['ty', '학교유형·성별', ['all', 'student', 'teacher', 'sup']],
    ['sj', '계열(교과군)별', ['all', 'student', 'teacher', 'company', 'sup']],
    ['wp', '어디에 취업했나', ['all', 'student', 'teacher', 'company', 'sup']],
    ['rt', '취업 유지', ['all', 'student', 'teacher', 'company', 'sup']],
    ['df', '용어·출처', ['all', 'student', 'teacher', 'company', 'sup']]
  ];
  var LENS_TIP = {
    all: '모든 통계를 순서대로 봅니다.',
    student: '내 계열의 취업률, 졸업 선배들이 취업한 회사 규모·업종, 취업 후 얼마나 오래 다니는지를 중심으로 보여 줍니다.',
    teacher: '광주·전남과 전국 비교, 시도 순위, 학교유형·성별, 관내·관외 취업, 유지취업률 등 진로지도·취업지원에 필요한 통계를 보여 줍니다.',
    company: '직업계고 졸업생이 어떤 업종·규모의 사업장에 취업하는지, 계열별로 몇 명이 배출되는지를 보여 줍니다.',
    sup: '정책 수립·보고에 필요한 우리 지역 4개년 추이와 보고용 요약 문장, 취업지원센터·혁신지구 사업 연계를 먼저 보여 주고, 이어서 모든 통계를 순서대로 보여 줍니다.'
  };
  function rel() { var r = D().stats.releases || []; var x = null; r.forEach(function (k) { if (k.pub === SS.pub) x = k; }); return x || r[0]; }
  function relPrev(R) { var x = null; (D().stats.releases || []).forEach(function (k) { if (k.pub === R.pub - 1) x = k; }); return x; }
  function natAll(R) { return (R.national || []).filter(function (x) { return x.type === '전체'; })[0] || {}; }
  function sidoOf(R, n) { return (R.sido || []).filter(function (x) { return x.sido === n; })[0]; }
  function delta(a, b) { if (a == null || b == null) return ''; var d = Math.round((a - b) * 10) / 10; return d === 0 ? '<span class="muted">전년과 같음</span>' : (d > 0 ? '<span class="up">▲ ' : '<span class="down">▼ ') + Math.abs(d).toFixed(1) + '%p</span>'; }
  function table(head, rows, opt) {
    opt = opt || {};
    return '<details class="tbl"' + (opt.open ? ' open' : '') + '><summary>' + esc(opt.title || '표로 보기') + '</summary><div class="tablewrap"><table class="dtable"><thead><tr>' + head.map(function (h, i) { return '<th' + (i >= (opt.textCols || 1) ? ' class="n"' : '') + '>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      rows.map(function (r) { return '<tr' + (r.em ? ' class="em"' : '') + '>' + r.c.map(function (c, i) { return '<td' + (i >= (opt.textCols || 1) ? ' class="n"' : '') + '>' + c + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></div></details>';
  }
  function sectHead(id, title, sub) { return '<section class="ssec" id="ss-' + id + '" data-sec="' + id + '"><h2 class="sh">' + esc(title) + '</h2>' + (sub ? '<p class="ssub">' + sub + '</p>' : ''); }

  V.stats = function (el) {
    var st = D().stats, rels = st.releases || [];
    if (!rels.length) { el.innerHTML = '<h1 class="vt">취업통계</h1><p class="muted">아직 등록된 통계가 없습니다.</p>'; return; }
    if (SS.pub == null) SS.pub = rels[0].pub;
    if (SS.lens == null) SS.lens = MJG.store.get('mjg.statLens') || 'all';
    if (SS.region == null) SS.region = MJG.store.get('mjg.statRegion2') || '';
    var R = rel(), P = relPrev(R), A = natAll(R), PA = P ? natAll(P) : (st.trend || []).filter(function (t) { return t.type === '전체' && t.pub === R.pub - 1; })[0];
    var G = sidoOf(R, '광주') || R.sido[0], GP = P ? sidoOf(P, G.sido) : null, GX = SS.region ? sidoOf(R, SS.region) : null;
    var show = function (id) { var s = SEC.filter(function (x) { return x[0] === id; })[0]; return s[2].indexOf(SS.lens) >= 0; };
    var h = '';

    /* 머리말·발표 선택 */
    h += '<h1 class="vt">직업계고 취업통계</h1>' +
      '<div class="stickybar"><div class="seg pubseg" role="group" aria-label="발표연도 선택">' + rels.map(function (r) { return '<button type="button" data-pub="' + r.pub + '" aria-pressed="' + (r.pub === R.pub) + '">' + r.pub + '년 발표</button>'; }).join('') + '</div>' +
      '<div class="lens" role="group" aria-label="보는 사람">' + LENS.map(function (l) { return '<button type="button" class="fchip" data-lens="' + l[0] + '" aria-pressed="' + (SS.lens === l[0]) + '">' + l[1] + '</button>'; }).join('') + '</div></div>' +
      '<div class="cohort"><div class="cbig"><span class="ck">' + R.pub + '년 발표</span><span class="carrow" aria-hidden="true">→</span><span class="cv">' + esc(R.cohort) + '</span></div>' +
      '<p>이 통계의 대상은 <b>' + esc(R.cohort) + '</b>, 즉 <b>' + esc(R.gradLabel) + '</b>입니다. 졸업 직후인 <b>' + esc(R.surveyDate) + '</b> 기준으로 취업·진학 여부를 확인했고, ' + esc(R.releasedAt) + '에 발표했습니다.</p>' +
      '<div class="btnrow"><a class="btn sm line" href="' + esc(MJG.safeUrl(R.file)) + '" target="_blank" rel="noopener">원문 보기(' + esc(R.fileType || '') + ')</a><button type="button" class="btn sm line" id="ssHow">발표연도와 학년도 읽는 법</button></div></div>' +
      '<p class="lenstip">' + esc(LENS_TIP[SS.lens]) + '</p>' +
      '<nav class="secnav" aria-label="통계 바로가기">' + SEC.filter(function (x) { return x[2].indexOf(SS.lens) >= 0; }).map(function (x) { return '<button type="button" class="fchip" data-go="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</nav>';

    /* 0. 장학사: 정책 브리핑 */
    if (show('pol')) {
      var AP = function (r) { return (r.national || []).filter(function (x) { return x.type === '전체'; })[0] || {}; };
      var sgn = function (v) { return v == null ? '–' : (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(1) + '%p'; };
      var Q = gjjn(R), QP = P ? gjjn(P) : null;
      var line = function (x, xp, rr0, nm) {
        if (!x) return '';
        return ' - ' + nm + ' 취업률 ' + pct(x.rate) + '(전국 대비 ' + sgn(x.rate - A.rate) + '), ' + (x.nRank ? '16개 시도 기준 ' : '17개 시도 중 ') + x.rank + '위' + (xp && xp.rank != null ? '(전년 ' + xp.rank + '위)' : '') +
          ', 진학률 ' + pct(x.advRate) + ', 관내 취업 ' + (x.ins ? (x.inside / x.ins * 100).toFixed(1) + '%' : '–') + (rr0 != null ? ', 1년 유지취업률 ' + pct(rr0) : '') + '\n';
      };
      var brief = '○ ' + R.pub + '년 KEDI 직업계고 졸업자 취업통계(' + R.releasedAt + ' 발표)\n' +
        ' - 대상: ' + R.cohort + '(' + R.gradLabel + '), 전국 취업률 ' + pct(A.rate) + '\n' +
        (Q ? line(Q.g, QP && QP.g, Q.rg && Q.rg.rate2, '광주') + line(Q.j, QP && QP.j, Q.rj && Q.rj.rate2, '전남') + line(Q.c, QP && QP.c, Q.c.ret2, '광주·전남 통합(참고·자체 합산)') : line(G, GP, null, G.sido)) +
        (GX ? line(GX, P ? sidoOf(P, GX.sido) : null, null, GX.sido) : '') +
        ' ※ ' + R.pub + '년 발표 = ' + R.cohort + ' 대상. 통합 수치는 두 시도 원자료 합산 재계산값(KEDI 공식값 아님)' + (R.ret ? ', 유지취업률은 ' + R.ret.cohort + ' 기준' : '');
      h += sectHead('pol', '정책 브리핑(광주·전남)', '보고서·예상질의답변서에 바로 쓸 수 있도록 광주·전남과 통합(참고) 수치를 함께 정리했습니다. ‘한눈에 보기’에서 다른 시도를 고르면 그 시도도 함께 들어갑니다.');
      h += '<div class="card"><h3>보고용 요약 문장 <button type="button" class="btn sm line" id="ssCopy">복사</button></h3><textarea class="brief" id="ssBrief" readonly rows="8" aria-label="보고용 요약 문장">' + esc(brief) + '</textarea><p class="m0 small muted">개조식(○, -) 형식입니다. 한글 문서에 붙여 넣은 뒤 표준 양식에 맞춰 다듬으세요.</p></div>';
      var rows4 = rels.slice().sort(function (a, b) { return b.pub - a.pub; }).map(function (r) {
        var q = gjjn(r) || {}, a2 = AP(r);
        return { pub: r.pub, cohort: r.cohort, nat: a2.rate, g: q.g || {}, j: q.j || {}, c: q.c || {} };
      });
      var cell = function (x, nat) { return x.rate == null ? '<td class="n">–</td>' : '<td class="n">' + pct(x.rate) + '<br><small class="muted">' + x.rank + '위 · ' + sgn(x.rate - nat) + '</small></td>'; };
      h += '<div class="card"><h3>광주·전남 4개년 추이 <span class="muted small">(발표연도 기준, 아래는 대상 학년도)</span></h3><div class="tablewrap"><table class="dtable gjtable"><thead><tr><th>발표(대상)</th><th class="n">광주</th><th class="n">전남</th><th class="n cb">통합(참고)</th><th class="n">전국</th></tr></thead><tbody>' +
        rows4.map(function (x) { return '<tr' + (x.pub === R.pub ? ' class="em"' : '') + '><td>' + x.pub + '년 발표<br><small class="muted">' + esc(x.cohort) + '</small></td>' + cell(x.g, x.nat) + cell(x.j, x.nat) + cell(x.c, x.nat).replace('<td class="n">', '<td class="n cb">') + '<td class="n">' + pct(x.nat) + '</td></tr>'; }).join('') +
        '</tbody></table></div><p class="m0 small muted">칸 아래 작은 글씨: 순위 · 전국 대비. 통합(참고) 순위는 광주·전남을 하나로 본 16개 시도 기준입니다.</p></div>';
      h += '<div class="card"><h3>연계 사업·자료 바로가기</h3><div class="guidegrid2">' +
        '<a class="guidecard" href="#/center/programs"><span class="ri" aria-hidden="true">센</span><span class="gb"><b>취업지원센터 지원 사업</b><small>역량 강화·공공기관 면접·채용연계형 직무교육, 13개교 학과 현황</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="#/district/clubs"><span class="ri" aria-hidden="true">혁</span><span class="gb"><b>혁신지구 취업동아리 현황</b><small>40팀 580명, 학교·계열 검색 시 합계 자동 계산</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="#/district/benefit"><span class="ri" aria-hidden="true">혜</span><span class="gb"><b>지역 정착 지원 혜택</b><small>정주지원금·일학습병행지원금·유지기업 지원금</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="#/fp/leaf"><span class="ri" aria-hidden="true">실</span><span class="gb"><b>현장실습 리플릿 요약</b><small>운영 기준·지원금·적용 법령</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="#/fpstat"><span class="ri" aria-hidden="true">통</span><span class="gb"><b>현장실습 통계(장학사 확인용)</b><small>학교별 참여·유형·기업·취업 전환·지원금 현황</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="#/role/supervisor"><span class="ri" aria-hidden="true">장</span><span class="gb"><b>장학사 업무 안내</b><small>법적 근거, 연간 업무 체크리스트, 지도·점검 질문</small></span><span class="ga" aria-hidden="true">→</span></a>' +
        '<a class="guidecard" href="' + esc(MJG.safeUrl(R.file)) + '" target="_blank" rel="noopener"><span class="ri" aria-hidden="true">원</span><span class="gb"><b>' + R.pub + '년 KEDI 원문</b><small>세부 분석 자료(' + esc(R.fileType || '') + ') 내려받기</small></span><span class="ga" aria-hidden="true">↗</span></a>' +
        '</div></div></section>';
    }

    /* 1. 한눈에 */
    if (show('ov')) {
      h += sectHead('ov', '한눈에 보기', esc(R.cohort) + ' 졸업자 ' + fmtN(A.grad) + '명 기준');
      h += '<div class="statstrip">' +
        '<div class="tile"><span class="tl">취업률</span><span class="tv">' + pct(A.rate) + '</span><span class="td">' + delta(A.rate, PA && PA.rate) + ' 전년 대비</span></div>' +
        '<div class="tile"><span class="tl">진학률</span><span class="tv">' + pct(A.advRate) + '</span><span class="td">' + delta(A.advRate, PA && PA.advRate) + ' 전년 대비</span></div>' +
        '<div class="tile"><span class="tl">취업자</span><span class="tv">' + fmtN(A.emp) + '<small>명</small></span><span class="td">졸업자의 ' + pct(R.netRate) + '(순취업률)</span></div>' +
        '<div class="tile"><span class="tl">300인 이상 사업장 취업</span><span class="tv">' + pct(R.big300) + '</span><span class="td">' + (P ? delta(R.big300, P.big300) + ' 전년 대비' : '보험가입 취업자 중') + '</span></div></div>';
      h += '<ul class="points">' + (R.highlights || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      // 광주·전남(기본) + 통합 참고 + 선택 시도
      var GJ = gjjn(R), GJP = P ? gjjn(P) : null;
      var extra = SS.region && SS.region !== '광주' && SS.region !== '전남' ? sidoOf(R, SS.region) : null, extraP = extra && P ? sidoOf(P, extra.sido) : null;
      var cols = GJ ? [[GJ.g, GJP && GJP.g, GJ.rg], [GJ.j, GJP && GJP.j, GJ.rj], [GJ.c, GJP && GJP.c, GJ.c.ret2 != null ? { rate2: GJ.c.ret2 } : null]] : [[G, GP, null]];
      if (extra) cols.push([extra, extraP, (R.ret && R.ret.sido || []).filter(function (x) { return x.sido === extra.sido; })[0]]);
      var gap = function (v) { return v == null ? '–' : (v >= A.rate ? '+' : '−') + Math.abs(v - A.rate).toFixed(1) + '%p'; };
      var ROWS = [
        ['취업률', function (x) { return '<b class="big">' + pct(x[0].rate) + '</b>'; }],
        ['시도 순위', function (x) { return x[0].rank == null ? '–' : (x[0].nRank ? '<span title="광주·전남을 하나로 보고 16개 시도 중 순위(참고)">' + x[0].rank + '위 / ' + x[0].nRank + '</span>' : x[0].rank + '위') + (x[1] && x[1].rank != null ? '<br><small class="muted">전년 ' + x[1].rank + '위</small>' : ''); }],
        ['전국 대비', function (x) { return gap(x[0].rate) + '<br><small class="muted">전국 ' + pct(A.rate) + '</small>'; }],
        ['전년 대비', function (x) { return x[1] ? delta(x[0].rate, x[1].rate) : '–'; }],
        ['진학률', function (x) { return pct(x[0].advRate); }],
        ['관내 취업 비중', function (x) { return x[0].ins ? (x[0].inside / x[0].ins * 100).toFixed(1) + '%<br><small class="muted">' + fmtN(x[0].inside) + '/' + fmtN(x[0].ins) + '명</small>' : '–'; }],
        ['졸업자·취업자', function (x) { return fmtN(x[0].grad) + '명<br><small class="muted">취업 ' + fmtN(x[0].emp) + '명</small>'; }],
        ['특성화고·마이스터고', function (x) { return x[0].sp == null && x[0].mt == null ? '<small class="muted">통합 산출 안 함</small>' : pct(x[0].sp) + ' · ' + pct(x[0].mt); }],
        ['1년 유지취업률', function (x) { return x[2] ? pct(x[2].rate2) : '–'; }]
      ];
      h += '<div class="card regioncard"><div class="rch"><h3>광주·전남 한눈에</h3><label class="sel">다른 시도 함께 보기 <select id="ssRegion"><option value="">선택 안 함</option>' + R.sido.filter(function (x) { return x.sido !== '광주' && x.sido !== '전남'; }).map(function (x) { return '<option' + (extra && x.sido === extra.sido ? ' selected' : '') + '>' + esc(x.sido) + '</option>'; }).join('') + '</select></label></div>' +
        '<div class="tablewrap"><table class="dtable gjtable"><thead><tr><th>구분</th>' + cols.map(function (x, i) { return '<th class="n' + (i === 2 && GJ ? ' cb' : '') + '">' + esc(x[0].sido) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        ROWS.map(function (r0) { return '<tr><th scope="row">' + esc(r0[0]) + '</th>' + cols.map(function (x, i) { return '<td class="n' + (i === 2 && GJ ? ' cb' : '') + '">' + r0[1](x) + '</td>'; }).join('') + '</tr>'; }).join('') +
        '</tbody></table></div>' +
        '<p class="m0 small muted">‘광주·전남 통합(참고)’은 두 시도 원자료(졸업자·취업자·진학자·입대자·제외인정자)를 합산해 KEDI 산식으로 다시 계산한 참고치이며 KEDI 공식 발표값이 아닙니다. 순위는 광주·전남을 하나로 본 16개 시도 기준, 유지취업률은 보험가입 취업자 수로 가중평균한 값입니다. 학교유형별 통합값은 산출하지 않았습니다.</p></div>';
      h += '</section>';
    }

    /* 2. 추이 */
    if (show('tr')) {
      var T = st.trend || [], years = []; T.forEach(function (t) { if (years.indexOf(t.pub) < 0) years.push(t.pub); }); years.sort();
      var get = function (type, k) { return years.map(function (y) { var v = T.filter(function (t) { return t.pub === y && t.type === type; })[0]; return v ? v[k] : null; }); };
      var xs = years.map(function (y) { return String(y); });
      var tip = function (i) { return years[i] + '년 발표 · ' + (years[i] - 1) + '학년도 3학년'; };
      h += sectHead('tr', '연도별 추이', '가로축은 <b>발표연도</b>입니다. 괄호 안 학년도가 실제 대상 학생입니다(예: 2026 → 2025학년도 3학년).');
      h += '<div class="card chartcard"><h3>전국 취업률·진학률·순취업률</h3><div class="legend"><span><i class="c1"></i>취업률</span><span><i class="c2"></i>진학률</span><span><i class="c3"></i>순취업률</span></div>' +
        lineChart(xs, [{ name: '취업률', cls: 's1', values: get('전체', 'rate') }, { name: '진학률', cls: 's2', values: get('전체', 'advRate') }, { name: '순취업률', cls: 's3', values: get('전체', 'netRate') }], { label: '전국 직업계고 취업률 추이', max: 70, tipTitle: tip, sub: function (i) { return '(' + String(years[i] - 1).slice(2) + '학년도)'; } }) +
        '<p class="cap">윗줄은 발표연도, 괄호는 대상 학년도(3학년)입니다.</p>' +
        table(['발표연도', '대상', '졸업자', '취업자', '진학자', '취업률', '진학률', '순취업률'], years.slice().reverse().map(function (y) { var v = T.filter(function (t) { return t.pub === y && t.type === '전체'; })[0]; return { em: y === R.pub, c: [y + '년', (y - 1) + '학년도', fmtN(v.grad), fmtN(v.emp), fmtN(v.adv), pct(v.rate), pct(v.advRate), pct(v.netRate)] }; }), { textCols: 2 }) + '</div>';
      h += '<div class="card chartcard"><h3>학교유형별 취업률 추이</h3><div class="legend"><span><i class="c1"></i>마이스터고</span><span><i class="c2"></i>특성화고</span><span><i class="c3"></i>일반고 직업반</span></div>' +
        lineChart(xs, [{ name: '마이스터고', cls: 's1', values: get('마이스터고', 'rate') }, { name: '특성화고', cls: 's2', values: get('특성화고', 'rate') }, { name: '일반고 직업반', cls: 's3', values: get('일반고 직업반', 'rate') }], { label: '학교유형별 취업률 추이', max: 90, tipTitle: tip, sub: function (i) { return '(' + String(years[i] - 1).slice(2) + '학년도)'; } }) +
        '<p class="cap">' + esc((st.notes || [])[0] || '') + '</p></div>';
      h += '</section>';
    }

    /* 3. 시도 */
    if (show('rg')) {
      var mlab = { rate: '취업률', advRate: '진학률', inside: '지역 안(관내) 취업 비중' }[SS.metric];
      var rows = R.sido.map(function (x) { var v = SS.metric === 'inside' ? (x.ins ? x.inside / x.ins * 100 : null) : x[SS.metric]; return [x.sido, v, x.sido === '광주' || x.sido === '전남' || (GX && x.sido === GX.sido), SS.metric === 'rate' ? x.rank + '위 · 졸업자 ' + fmtN(x.grad) + '명' : '']; })
        .sort(function (a, b) { return (b[1] || 0) - (a[1] || 0); });
      var avg = SS.metric === 'rate' ? A.rate : SS.metric === 'advRate' ? A.advRate : (R.workTotal && R.workTotal.ins ? R.workTotal.in / R.workTotal.ins * 100 : null);
      h += sectHead('rg', '시도별 비교', '주황 막대는 광주·전남(그리고 함께 보기로 고른 시도)입니다. 학교가 있는 시도 기준입니다.');
      h += '<div class="card chartcard"><div class="rch"><h3>' + R.pub + '년 발표 시도별 ' + esc(mlab) + '</h3><span class="seg" role="group" aria-label="지표">' + [['rate', '취업률'], ['advRate', '진학률'], ['inside', '관내 취업']].map(function (m) { return '<button type="button" data-metric="' + m[0] + '" aria-pressed="' + (SS.metric === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</span></div>' +
        hbar(rows, { label: '시도별 ' + mlab, max: SS.metric === 'inside' ? 100 : 80, avg: avg, avgLabel: '전국', metric: mlab }) +
        table(['시도', '순위', '학교', '졸업자', '취업자', '취업률', '진학률', '특성화고', '마이스터고', '일반고 직업반', '관내 취업'], R.sido.slice().sort(function (a, b) { return a.rank - b.rank; }).map(function (x) {
          return { em: x.sido === '광주' || x.sido === '전남' || (GX && x.sido === GX.sido), c: [esc(x.sido), esc(x.rank), esc(x.schools), fmtN(x.grad), fmtN(x.emp), pct(x.rate), pct(x.advRate), pct(x.sp), pct(x.mt), pct(x.gv), x.ins ? (x.inside / x.ins * 100).toFixed(1) + '%' : '–'] };
        }), { title: '시도별 표 보기(학교유형 포함)' }) + '</div>';
      // 지역 추이(학교유형별, 2020~)
      var ST = st.sidoTrend || { years: [], rows: [] };
      var trT = SS.trendType;
      var tKey = { '특성화고': '특성화고', '마이스터고': '마이스터고', '일반고 직업반': '일반고 직업반' };
      var pick = function (sd, ty) { var r0 = ST.rows.filter(function (x) { return x.sido === sd && x.type === ty; })[0]; return r0 ? r0.vals : ST.years.map(function () { return null; }); };
      var regRates = function (sd) { return ST.years.map(function (y) { var rr0 = (st.releases || []).filter(function (k) { return k.pub === y; })[0]; var s0 = rr0 ? sidoOf(rr0, sd) : null; return s0 ? s0.rate : null; }); };
      var natRates = ST.years.map(function (y) { var t = (st.trend || []).filter(function (k) { return k.pub === y && k.type === '전체'; })[0]; return t ? t.rate : null; });
      var seriesR = (trT === '전체' ? [{ name: '전국', cls: 's1', values: natRates }, { name: '광주', cls: 's2', values: regRates('광주') }, { name: '전남', cls: 's3', values: regRates('전남') }].concat(GX ? [{ name: GX.sido, cls: 's4', values: regRates(GX.sido) }] : [])
        : [{ name: '전국', cls: 's1', values: pick('전국', trT) }, { name: '광주', cls: 's2', values: pick('광주', trT) }, { name: '전남', cls: 's3', values: pick('전남', trT) }].concat(GX ? [{ name: GX.sido, cls: 's4', values: pick(GX.sido, trT) }] : []));
      h += '<div class="card chartcard"><div class="rch"><h3>광주·전남' + (GX ? '·' + esc(GX.sido) : '') + ' 취업률 추이</h3><span class="seg" role="group" aria-label="학교유형">' + ['전체', '특성화고', '마이스터고', '일반고 직업반'].map(function (t) { return '<button type="button" data-ttype="' + t + '" aria-pressed="' + (trT === t) + '">' + (t === '일반고 직업반' ? '일반고' : t) + '</button>'; }).join('') + '</span></div>' +
        '<div class="legend">' + seriesR.map(function (x, i) { return '<span><i class="c' + (i + 1) + '"></i>' + esc(x.name) + '</span>'; }).join('') + '</div>' +
        lineChart(ST.years.map(String), seriesR, { label: '광주·전남 취업률 추이', max: trT === '마이스터고' ? 100 : 80, sub: function (i) { return '(' + String(ST.years[i] - 1).slice(2) + '학년도)'; }, tipTitle: function (i) { return ST.years[i] + '년 발표 · ' + (ST.years[i] - 1) + '학년도 3학년'; } }) +
        '<p class="cap">' + (trT === '전체' ? '시도 전체 취업률은 2023~2026년 발표자료에 수록된 값만 표시합니다. 학교유형을 고르면 2020년 발표부터 볼 수 있습니다.' : '학교유형별 시도 취업률(각 연도를 담은 가장 최근 발표자료 기준). 학교 수가 적은 유형은 해마다 크게 달라질 수 있습니다.') + '</p></div>';
      h += '</section>';
    }

    /* 4. 학교유형·성별·설립 */
    if (show('ty')) {
      var nat3 = (R.national || []).filter(function (x) { return x.type !== '전체'; });
      h += sectHead('ty', '학교유형·성별', '');
      h += '<div class="twocol"><div class="card chartcard"><h3>학교유형별 취업률·진학률</h3><div class="legend"><span><i class="c1"></i>취업률</span><span><i class="c2"></i>진학률</span></div>' +
        groupBar(nat3.map(function (x) { return { label: x.type, vals: [x.rate, x.advRate] }; }), [{ name: '취업률', cls: 's1' }, { name: '진학률', cls: 's2' }], { label: '학교유형별 취업률과 진학률', max: 100, W: Math.min(cw(), 430), H: 280, labelAll: true }) +
        table(['학교유형', '학교', '졸업자', '취업자', '진학자', '입대', '취업률', '진학률'], (R.national || []).map(function (x) { return { em: x.type === '전체', c: [esc(x.type), esc(x.schools), fmtN(x.grad), fmtN(x.emp), fmtN(x.adv), fmtN(x.enl), pct(x.rate), pct(x.advRate)] }; })) + '</div>';
      var gm = (R.gender || []).filter(function (x) { return x.type === '전체'; });
      h += '<div class="card chartcard"><h3>성별 취업률·진학률</h3><div class="legend"><span><i class="c1"></i>취업률</span><span><i class="c2"></i>진학률</span></div>' +
        groupBar(gm.map(function (x) { return { label: x.sex === '남' ? '남학생' : '여학생', vals: [x.rate, x.advRate] }; }), [{ name: '취업률', cls: 's1' }, { name: '진학률', cls: 's2' }], { label: '성별 취업률과 진학률', max: 100, W: Math.min(cw(), 430), H: 280, labelAll: true }) +
        table(['학교유형', '성별', '졸업자', '취업자', '취업률', '진학률'], (R.gender || []).map(function (x) { return { em: x.type === '전체', c: [esc(x.type), esc(x.sex), fmtN(x.grad), fmtN(x.emp), pct(x.rate), pct(x.advRate)] }; }), { textCols: 2 }) +
        ((R.found || []).length ? table(['설립', '학교', '졸업자', '취업자', '취업률', '진학률'], R.found.map(function (x) { return { c: [esc(x.name), esc(x.schools), fmtN(x.grad), fmtN(x.emp), pct(x.rate), pct(x.advRate)] }; }), { title: '설립주체(국립·공립·사립)별 표' }) : '') + '</div></div>';
      h += '</section>';
    }

    /* 5. 교과(군) */
    if (show('sj')) {
      var sj = (R.subject || []).slice().sort(function (a, b) { return SS.subjSort === 'n' ? b.n - a.n : (b.rate || 0) - (a.rate || 0); });
      h += sectHead('sj', '계열(교과군)별 취업률', '내 학과가 속한 교과(군)을 찾아보세요. 한 학과에 여러 교과(군)이 있어 이수자 합계는 졸업자 수보다 큽니다.');
      h += '<div class="card chartcard"><div class="rch"><h3>' + R.pub + '년 발표 교과(군)별 ' + (SS.subjSort === 'n' ? '이수자 수' : '취업률') + '</h3><span class="seg" role="group" aria-label="정렬">' + [['rate', '취업률 순'], ['n', '인원 순']].map(function (m) { return '<button type="button" data-ssort="' + m[0] + '" aria-pressed="' + (SS.subjSort === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</span></div>' +
        (SS.subjSort === 'n' ? hbar(sj.map(function (x) { return [x.name, x.n, false, '취업자 ' + fmtN(x.emp) + '명 · 취업률 ' + pct(x.rate)]; }), { label: '교과군별 이수자', unit: '명', metric: '이수자' })
          : hbar(sj.map(function (x) { return [x.name, x.rate, false, '진학률 ' + pct(x.advRate) + ' · 이수자 ' + fmtN(x.n) + '명']; }), { label: '교과군별 취업률', max: 80, avg: A.rate, avgLabel: '전체', metric: '취업률' })) +
        table(['교과(군)', '이수자', '취업자', '취업률', '진학자', '진학률'], sj.map(function (x) { return { c: [esc(x.name), fmtN(x.n), fmtN(x.emp), pct(x.rate), fmtN(x.adv), pct(x.advRate)] }; })) + '</div>';
      h += '</section>';
    }

    /* 6. 취업처 */
    if (show('wp')) {
      var sz = R.size || [], tins = (R.workTotal && R.workTotal.ins) || sz.reduce(function (a, b) { return a + (b.sum || 0); }, 0);
      var ind = (R.industry || []).slice().sort(function (a, b) { return b.n - a.n; });
      var indTot = ind.reduce(function (a, b) { return a + b.n; }, 0);
      h += sectHead('wp', '어디에 취업했나', '건강보험(직장)·고용보험에 가입한 취업자 ' + fmtN(tins) + '명 기준입니다.');
      h += '<div class="twocol"><div class="card chartcard"><h3>사업장 종사자 규모별 비중</h3>' +
        hbar(sz.map(function (x) { return [x.label, x.pct, /^(300|1,000)/.test(x.label), fmtN(x.sum) + '명(특성화 ' + fmtN(x.sp) + ' · 마이스터 ' + fmtN(x.mt) + ' · 일반고 ' + fmtN(x.gv) + ')']; }), { label: '사업장 규모별 취업 비중', max: 50, W: Math.min(cw(), 460), metric: '비중' }) +
        '<p class="cap">주황: 종사자 300인 이상(합계 ' + pct(R.big300) + ')</p>' +
        table(['규모', '특성화고', '마이스터고', '일반고', '합계', '비율'], sz.map(function (x) { return { c: [esc(x.label), fmtN(x.sp), fmtN(x.mt), fmtN(x.gv), fmtN(x.sum), pct(x.pct)] }; })) + '</div>' +
        '<div class="card chartcard"><h3>업종(한국표준산업분류)별 취업자</h3>' +
        hbar(ind.slice(0, 10).map(function (x) { return [x.name, x.n, false, '남 ' + fmtN(x.m) + ' · 여 ' + fmtN(x.f) + ' · ' + (x.n / tins * 100).toFixed(1) + '%']; }), { label: '업종별 취업자 상위 10', unit: '명', W: Math.min(cw(), 460), metric: '취업자' }) +
        '<p class="cap">상위 10개 업종. 업종이 확인되지 않은 취업자 ' + fmtN(tins - indTot) + '명은 제외했습니다.</p>' +
        table(['업종', '취업자', '남', '여', '비중'], ind.map(function (x) { return { c: [esc(x.name), fmtN(x.n), fmtN(x.m), fmtN(x.f), (x.n / tins * 100).toFixed(1) + '%'] }; }), { title: '전체 업종 표' }) + '</div></div>';
      [sidoOf(R, '광주'), sidoOf(R, '전남'), GX].filter(function (x) { return x && x.ins; }).forEach(function (G1) {
        var cap = G1.cap / G1.ins * 100;
        h += '<div class="card"><h3 class="m0">' + esc(G1.sido) + ' 졸업생은 어디에서 일하나</h3><div class="stackbar" role="img" aria-label="관내 ' + (G1.inside / G1.ins * 100).toFixed(1) + '%, 관외 ' + (G1.outside / G1.ins * 100).toFixed(1) + '%"><span class="sb1" data-w="' + (G1.inside / G1.ins * 100).toFixed(1) + '"></span><span class="sb2" data-w="' + (G1.outside / G1.ins * 100).toFixed(1) + '"></span></div>' +
          '<div class="legend"><span><i class="c1"></i>' + esc(G1.sido) + ' 안(관내) ' + fmtN(G1.inside) + '명 · ' + (G1.inside / G1.ins * 100).toFixed(1) + '%</span><span><i class="c2"></i>다른 시도(관외) ' + fmtN(G1.outside) + '명 · ' + (G1.outside / G1.ins * 100).toFixed(1) + '%</span></div>' +
          '<p class="m0 small">수도권 사업장 취업 ' + cap.toFixed(1) + '% · 전국 평균 관내 취업 ' + (R.workTotal && R.workTotal.ins ? (R.workTotal.in / R.workTotal.ins * 100).toFixed(1) + '%' : '–') + '</p></div>';
      });
      h += '</section>';
    }

    /* 7. 유지취업 */
    if (show('rt') && R.ret) {
      var rt = R.ret;
      h += sectHead('rt', '취업 후 얼마나 오래 다니나(유지취업률)', '<b>주의:</b> ' + R.pub + '년 발표에 실린 유지취업률의 대상은 한 해 앞선 <b>' + esc(rt.cohort) + '</b>입니다. 4월 1일 취업자가 6개월 뒤(' + esc(rt.d1) + ')와 1년 뒤(' + esc(rt.d2) + ')에도 보험 가입이 유지되는 비율입니다.');
      h += '<div class="twocol"><div class="card chartcard"><h3>학교유형별 유지취업률</h3><div class="legend"><span><i class="c1"></i>6개월(1차)</span><span><i class="c2"></i>1년(2차)</span></div>' +
        groupBar(rt.type.map(function (x) { return { label: x.type === '일반고 직업반' ? '일반고' : x.type, vals: [x.rate1, x.rate2] }; }), [{ name: '6개월', cls: 's1' }, { name: '1년', cls: 's2' }], { label: '학교유형별 유지취업률', max: 100, W: Math.min(cw(), 430), H: 280, labelAll: true }) +
        table(['학교유형', '졸업자', '보험가입 취업자', '6개월 유지', '1년 유지'], rt.type.map(function (x) { return { em: x.type === '전체', c: [esc(x.type), fmtN(x.grad), fmtN(x.ins), pct(x.rate1), pct(x.rate2)] }; })) + '</div>' +
        '<div class="card chartcard"><h3>시도별 1년 유지취업률</h3>' +
        hbar(rt.sido.slice().sort(function (a, b) { return b.rate2 - a.rate2; }).map(function (x) { return [x.sido, x.rate2, x.sido === '광주' || x.sido === '전남' || (GX && x.sido === GX.sido), '6개월 ' + pct(x.rate1) + ' · 취업자 ' + fmtN(x.ins) + '명']; }), { label: '시도별 1년 유지취업률', max: 100, W: Math.min(cw(), 460), avg: (rt.type.filter(function (x) { return x.type === '전체'; })[0] || {}).rate2, avgLabel: '전국', metric: '1년 유지' }) + '</div></div>';
      if ((rt.subject || []).length) h += '<div class="card chartcard"><h3>교과(군)별 유지취업률</h3>' + table(['교과(군)', '이수자', '보험가입 취업자', '6개월 유지', '1년 유지'], rt.subject.slice().sort(function (a, b) { return b.rate2 - a.rate2; }).map(function (x) { return { c: [esc(x.name), fmtN(x.n), fmtN(x.ins), pct(x.rate1), pct(x.rate2)] }; }), { open: SS.lens === 'student' }) + '</div>';
      h += '</section>';
    }

    /* 8. 용어·출처 */
    if (show('df')) {
      h += sectHead('df', '용어·출처', '');
      h += '<p class="rulebox">' + esc(st.rule) + '</p>' +
        '<div class="tablewrap"><table class="dtable mapt"><thead><tr><th>발표</th><th>대상 학생</th><th>졸업 시기</th><th>조사기준일</th><th>유지취업률 대상</th></tr></thead><tbody>' +
        rels.map(function (r) { return '<tr' + (r.pub === R.pub ? ' class="em"' : '') + '><td>' + esc(r.releasedAt) + '</td><td><b>' + esc(r.cohort) + '</b></td><td>' + esc(r.gradLabel) + '</td><td>' + esc(r.surveyDate) + '</td><td>' + esc(r.ret ? r.ret.cohort : '') + '</td></tr>'; }).join('') + '</tbody></table></div>' +
        '<dl class="defs">' + (st.definitions || []).map(function (d) { return '<dt>' + esc(d[0]) + '</dt><dd>' + esc(d[1]) + '</dd>'; }).join('') + '</dl>' +
        '<ul class="points small">' + (st.notes || []).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' +
        '<h3>출처</h3><ol class="srclist">' + (st.sources || []).map(function (s) { var u = MJG.safeUrl(s.url); return '<li>' + (u ? '<a href="' + esc(u) + '" target="_blank" rel="noopener noreferrer">' + esc(s.title) + '</a>' : esc(s.title)) + '</li>'; }).join('') + '</ol>';
      h += '</section>';
    }
    el.innerHTML = h;

    /* 막대 너비(CSSOM으로 설정: CSP 준수) */
    el.querySelectorAll('[data-w]').forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; });
    bindTips(el);
    var redraw = function () { var y = window.scrollY; MJG._keepScroll = true; V.stats(el); window.scrollTo(0, y); };
    el.querySelectorAll('[data-pub]').forEach(function (b) { b.addEventListener('click', function () { SS.pub = +b.getAttribute('data-pub'); redraw(); }); });
    el.querySelectorAll('[data-lens]').forEach(function (b) { b.addEventListener('click', function () { SS.lens = b.getAttribute('data-lens'); MJG.store.set('mjg.statLens', SS.lens); redraw(); }); });
    el.querySelectorAll('[data-metric]').forEach(function (b) { b.addEventListener('click', function () { SS.metric = b.getAttribute('data-metric'); redraw(); }); });
    el.querySelectorAll('[data-ssort]').forEach(function (b) { b.addEventListener('click', function () { SS.subjSort = b.getAttribute('data-ssort'); redraw(); }); });
    el.querySelectorAll('[data-ttype]').forEach(function (b) { b.addEventListener('click', function () { SS.trendType = b.getAttribute('data-ttype'); redraw(); }); });
    el.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { var t = el.querySelector('#ss-' + b.getAttribute('data-go')); if (t) { var top = t.getBoundingClientRect().top + window.scrollY - (document.querySelector('.appbar').offsetHeight + el.querySelector('.stickybar').offsetHeight + 8); window.scrollTo({ top: top, behavior: 'smooth' }); } }); });
    var cp = el.querySelector('#ssCopy'); if (cp) cp.addEventListener('click', function () {
      var ta = el.querySelector('#ssBrief'), done = function () { cp.textContent = '복사됨'; setTimeout(function () { cp.textContent = '복사'; }, 1500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); document.execCommand('copy'); done(); });
      else { ta.select(); document.execCommand('copy'); done(); }
    });
    var rs = el.querySelector('#ssRegion'); if (rs) rs.addEventListener('change', function () { SS.region = rs.value; MJG.store.set('mjg.statRegion2', SS.region); redraw(); });
    var how = el.querySelector('#ssHow'); if (how) how.addEventListener('click', function () {
      var t = el.querySelector('#ss-df'); if (!t) { SS.lens = 'all'; redraw(); t = el.querySelector('#ss-df'); }
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (!V._statsResize) { V._statsResize = true; var tm; window.addEventListener('resize', function () { clearTimeout(tm); tm = setTimeout(function () { var v = document.querySelector('.view[data-view="stats"]'); if (v && !v.hidden) { var y = window.scrollY; V.stats(v); window.scrollTo(0, y); } }, 250); }); }
  };
  /* ───────── 더보기(설치·설정·정보) ───────── */
  V.more = function (el) {
    var d = D(), plat = MJG.platform(), C = window.MJG_CONFIG || {};
    var fi = MJG.fsIndex(), th = MJG.theme();
    var osc = [
      ['windows', '윈도우 PC·노트북', ['크롬 또는 엣지로 앱 주소에 접속합니다.', '주소창 오른쪽의 ‘앱 설치’ 아이콘(모니터 모양)을 누르거나, 메뉴(⋯) → 앱 → ‘이 사이트를 앱으로 설치’를 고릅니다.', '시작 메뉴·바탕화면에 ‘미래 JOB GO’가 생깁니다.']],
      ['mac', '맥(macOS)', ['크롬·엣지: 주소창의 설치 아이콘 또는 메뉴 → ‘미래 JOB GO 설치’', '사파리(macOS 14 이상): 파일 메뉴 → ‘Dock에 추가’', 'Launchpad·Dock에서 실행합니다.']],
      ['android', '안드로이드폰', ['크롬 또는 삼성 인터넷으로 앱 주소에 접속합니다.', '화면 아래 ‘설치’ 안내를 누르거나, 메뉴(⋮) → ‘앱 설치’ 또는 ‘홈 화면에 추가’를 고릅니다.', '홈 화면의 아이콘으로 실행합니다.']],
      ['ios', '아이폰·아이패드', ['사파리로 앱 주소에 접속합니다.', '아래쪽 공유 버튼(□↑)을 누릅니다.', '‘홈 화면에 추가’ → ‘추가’를 누르면 아이콘이 생깁니다.']]
    ];
    var lastc = MJG.store.get('mjg.lastcheck');
    el.innerHTML = '<h1 class="vt">더보기</h1><div class="guidegrid moremenu">' + [['#/center', '센', '취업지원센터'], ['#/district', '혁', '직업교육혁신지구'], ['#/fp/leaf', '실', '현장실습 리플릿 요약'], ['#/schedule', '일', '주요 일정'], ['#/notices', '공', '공지사항'], ['#/search', '검', '통합 검색']].map(function (m) { return '<a class="guidemini" href="' + m[0] + '"><span class="ri" aria-hidden="true">' + m[1] + '</span><b>' + m[2] + '</b><span class="ga" aria-hidden="true">→</span></a>'; }).join('') + '</div>' +
      '<h2 class="vt2">설치·설정·앱 정보</h2>' +
      '<div class="card sect"><h2>앱 설치(무료)</h2>' +
      (MJG.standalone() ? '<p class="ok">✓ 지금 설치된 앱으로 실행 중입니다.</p>' :
        (MJG.installEvt ? '<div class="btnrow"><button type="button" class="btn" id="btnInstall">이 기기에 설치하기</button></div>' : '') +
        (MJG.isWeb() ? '' : '<p class="notebox">지금은 파일로 열려 있어 설치·자동 업데이트가 되지 않습니다. 교육청이 안내한 인터넷 주소(https)로 접속해 설치하세요.</p>')) +
      '<p class="muted">앱 장터(구글플레이·앱스토어)를 거치지 않는 웹앱(PWA) 방식이라 비용·회원가입 없이 설치되며, 한 번 열면 인터넷이 없어도 저장된 자료를 볼 수 있습니다.</p>' +
      '<div class="oscards">' + osc.slice().sort(function (a, b) { return (b[0] === plat) - (a[0] === plat); }).map(function (o) { return '<div class="oscard' + (o[0] === plat ? ' me' : '') + '"><h3>' + o[1] + (o[0] === plat ? ' <span class="tag">지금 기기</span>' : '') + '</h3><ol class="steps">' + o[2].map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol></div>'; }).join('') + '</div></div>' +
      '<div class="card"><div class="setrow"><span class="sl"><b>글자 크기</b><small>현재 ' + [14, 15, 16, 17, 18, 20][fi] + 'px</small></span><span class="fsz"><button type="button" id="fsm" aria-label="글자 작게">가−</button><button type="button" id="fsp" aria-label="글자 크게">가+</button></span></div>' +
      '<div class="setrow"><span class="sl"><b>화면 테마</b><small>기기 설정을 따르거나 직접 고릅니다</small></span><span class="seg" role="group" aria-label="화면 테마">' + [['auto', '자동'], ['light', '밝게'], ['dark', '어둡게']].map(function (t) { return '<button type="button" data-t="' + t[0] + '" aria-pressed="' + (th === t[0]) + '">' + t[1] + '</button>'; }).join('') + '</span></div></div>' +
      '<div class="card sect"><h2>자료 정보</h2><dl class="kv">' +
      '<dt>자료 버전</dt><dd>' + esc(d.meta.label || '') + ' (버전 ' + esc(d.meta.version) + ')</dd>' +
      '<dt>발행</dt><dd>' + esc(MJG.fmtDate(d.meta.publishedAt)) + ' · ' + esc(d.meta.publisher) + '</dd>' +
      '<dt>무결성 검증</dt><dd>' + (MJG.verified ? '<span class="ok">✓ 관리자 전자서명 확인됨</span>' : '<span class="bad">이 브라우저에서는 서명 검증 기능을 쓸 수 없어 앱에 들어 있는 자료만 표시합니다</span>') + '</dd>' +
      '<dt>자료 위치</dt><dd>' + (MJG.source === 'cache' ? '업데이트로 받은 자료(기기 저장)' : '앱 기본 자료') + '</dd>' +
      '<dt>마지막 확인</dt><dd>' + (lastc ? esc(new Date(lastc).toLocaleString('ko-KR')) : '아직 없음') + '</dd>' +
      '<dt>앱 버전</dt><dd>' + esc(C.APP_VERSION || '') + ' (빌드 ' + esc(C.BUILD || '') + ')</dd></dl>' +
      '<div class="btnrow"><button type="button" class="btn line" id="btnChk">지금 업데이트 확인</button><button type="button" class="btn line" id="btnReset">기기에 저장된 자료 지우기</button></div></div>' +
      '<div class="card sect"><h2>보안·개인정보</h2><ul class="points">' +
      '<li>이 앱은 이름·연락처·위치 등 개인정보를 수집하거나 서버로 보내지 않습니다. 체크리스트와 설정은 이 기기 안에만 저장됩니다.</li>' +
      '<li>회원가입·로그인·광고·외부 분석 도구가 없으며, 외부 라이브러리를 쓰지 않습니다.</li>' +
      '<li>새 자료는 교육청 관리자의 전자서명(ECDSA P-256)이 확인된 경우에만 반영되고, 서명이 다르거나 예전 버전이면 거부합니다.</li>' +
      '<li>콘텐츠 보안 정책(CSP)으로 앱 밖의 스크립트 실행을 막습니다. 외부 누리집 링크는 새 창으로 열립니다.</li></ul></div>' +
      '<div class="card sect"><h2>문의처</h2><div class="list">' + d.contacts.map(function (c) { return '<div class="li"><span class="lb"><b>' + esc(c.name) + '</b><span>' + esc(c.role) + (c.note ? ' · ' + esc(c.note) : '') + '</span></span>' + (c.tel ? '<a class="dday on" href="tel:' + esc(String(c.tel).replace(/[^0-9]/g, '')) + '">' + esc(c.tel) + '</a>' : '') + '</div>'; }).join('') + '</div></div>';
    var ib = el.querySelector('#btnInstall');
    if (ib) ib.addEventListener('click', function () { var e = MJG.installEvt; if (!e) return; e.prompt(); e.userChoice.then(function () { MJG.installEvt = null; V.more(el); }); });
    el.querySelector('#fsm').addEventListener('click', function () { MJG.setFs(MJG.fsIndex() - 1); MJG._keepScroll = true; V.more(el); });
    el.querySelector('#fsp').addEventListener('click', function () { MJG.setFs(MJG.fsIndex() + 1); MJG._keepScroll = true; V.more(el); });
    el.querySelectorAll('[data-t]').forEach(function (b) { b.addEventListener('click', function () { MJG.setTheme(b.getAttribute('data-t')); V.more(el); }); });
    el.querySelector('#btnChk').addEventListener('click', function () { MJG.checkUpdate(true).then(function () { V.more(el); }); });
    el.querySelector('#btnReset').addEventListener('click', function () {
      ['mjg.content.v1', 'mjg.chk.student', 'mjg.chk.teacher', 'mjg.chk.school', 'mjg.chk.company', 'mjg.lastcheck'].forEach(MJG.store.del);
      if (window.caches) caches.delete('mjg-content');
      MJG.toast('저장된 자료를 지웠습니다. 앱을 다시 엽니다.'); setTimeout(function () { location.reload(); }, 900);
    });
  };
})();
