/* 현장실습 Q&A 화면 모듈(기존 「2026 현장실습 업무 Q&A」에서 이관) */
window.MJG_FP_INIT = function(){
  if(!ASK && window.MJG_ASK_INIT) window.MJG_ASK_INIT();
  var catName = {}; CATS.forEach(function(c){ catName[c.k]=c.n; });
  var state = {cat:'all', q:'', tab:'qa'};
  var $ = function(id){ return document.getElementById(id); };

  function esc(s){ return String(s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];}); }
  function strip(s){ return String(s).replace(/<[^>]+>/g,' '); }
  function norm(s){ return strip(s).toLowerCase().replace(/[\s·ㆍ.,()「」『』\-~·]/g,''); }

  var LAWMAP = {'직업교육훈련 촉진법':'직업교육훈련촉진법','근로기준법':'근로기준법','산업재해보상보험법':'산업재해보상보험법','산업안전보건법':'산업안전보건법','청소년 보호법':'청소년보호법','최저임금법':'최저임금법','병역법':'병역법','개인정보 보호법':'개인정보보호법','조세특례제한법':'조세특례제한법','장애인고용촉진 및 직업재활법':'장애인고용촉진및직업재활법','초·중등교육법':'초ㆍ중등교육법'};
  function lawHtml(t){
    if(t.indexOf('현장실습 운영 및 지원 조례')===0){
      return '<a class="law" target="_blank" rel="noopener" href="https://www.law.go.kr/자치법규/전남광주통합특별시고등학교현장실습운영및지원조례">'+esc(t.replace('현장실습 운영 및 지원 조례','조례'))+'</a>';
    }
    for(var k in LAWMAP){
      if(t.indexOf(k+' 제')===0){
        var m = t.slice(k.length+1).match(/^제\d+조(의\d+)?/);
        var url = 'https://www.law.go.kr/법령/'+LAWMAP[k]+(m?'/'+m[0]:'');
        return '<a class="law" target="_blank" rel="noopener" href="'+url+'">'+esc(t)+'</a>';
      }
    }
    return '<span class="law">'+esc(t)+'</span>';
  }
  function em(s){ return esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>'); }
  function unb(s){ return String(s).replace(/\*\*/g,''); }

  /* 표 등 HTML이 들어간 세부 줄은 허용 목록 방식으로 다시 만들어 넣음(스크립트·속성 차단) */
  var ALLOW={TABLE:1,THEAD:1,TBODY:1,TR:1,TH:1,TD:1,B:1,STRONG:1,BR:1,DIV:1,P:1,SPAN:1,SMALL:1};
  function safeHtml(src){
    var doc; try{ doc=new DOMParser().parseFromString('<div>'+src+'</div>','text/html'); }catch(e){ return esc(src); }
    function walk(n){
      if(n.nodeType===3) return esc(n.nodeValue);
      if(n.nodeType!==1) return '';
      var inner=''; for(var i=0;i<n.childNodes.length;i++) inner+=walk(n.childNodes[i]);
      var t=n.tagName; if(!ALLOW[t]) return inner;
      var a='';
      ['colspan','rowspan'].forEach(function(k){ var v=n.getAttribute(k); if(v && /^\d{1,2}$/.test(v)) a+=' '+k+'="'+v+'"'; });
      var c=n.getAttribute('class'); if(c && /^(tw|l1|l2|l3|nt|sym)$/.test(c)) a+=' class="'+c+'"';
      var tag=t.toLowerCase(); return tag==='br' ? '<br>' : '<'+tag+a+'>'+inner+'</'+tag+'>';
    }
    var root=doc.body.firstChild, out=''; for(var i=0;i<root.childNodes.length;i++) out+=walk(root.childNodes[i]); return out;
  }
  function line(s){
    if(s.charAt(0)==='<') return safeHtml(s);
    s=esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>');
    var two = s.slice(0,2);
    if(two==='□ ') return '<p class="l1"><span class="sym">□</span>'+s.slice(2)+'</p>';
    if(two==='○ ') return '<p class="l2"><span class="sym">○</span>'+s.slice(2)+'</p>';
    if(two==='- ') return '<p class="l3"><span class="sym">-</span>'+s.slice(2)+'</p>';
    if(two==='※ ') return '<p class="nt">※ '+s.slice(2)+'</p>';
    return '<p>'+s+'</p>';
  }
  function hl(text, toks){
    var out = esc(text);
    toks.forEach(function(t){
      if(t.length<1) return;
      var safe = t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
      try{ out = out.replace(new RegExp('('+safe+')','g'),'<mark>$1</mark>'); }catch(e){}
    });
    return out;
  }

  /* 색인 */
  QA.forEach(function(x,i){
    x.no = i+1;
    x.idx = norm([x.q,x.a,(x.d||[]).join(' '),catName[x.c],(x.r||[]).map(function(r){return 'p'+r[0]+' '+r[1];}).join(' '),(x.l||[]).join(' '),(x.p||[]).join(' '),x.t||'',x.f||''].join(' '));
  });

  function qaHtml(x, toks){
    var refs = (x.r||[]).map(function(r){return '<span class="pg"><b>p.'+esc(r[0])+'</b>'+esc(r[1])+'</span>';}).join('');
    var laws = (x.l||[]).map(lawHtml).join('');
    var plans = (x.p||[]).map(function(t){return '<span class="law plan">'+esc(t)+'</span>';}).join('');
    var h = '<details class="qa" id="'+esc(x.id)+'"'+(x.open?' open':'')+'><summary>'+
      '<span class="qno">Q'+x.no+'</span><span class="qmain">'+
      '<span class="qmeta"><span>'+esc(catName[x.c])+'</span>'+(x.star?'<span class="star">예시 질문</span>':'')+(x.f?'<span class="flag">'+esc(x.f)+'</span>':'')+'</span>'+
      '<span class="qtext">'+hl(x.q,toks)+'</span><span class="qprev">'+esc(unb(x.a))+'</span></span></summary>'+
      '<div class="ans"><p class="concl"><span class="lab">답변</span>'+em(x.a)+'</p>'+
      ((x.d&&x.d.length)?'<div class="detail">'+x.d.map(line).join('')+'</div>':'')+
      '<div class="basis">'+(refs?'<span class="blab">매뉴얼 근거(쪽)</span><div class="refs">'+refs+'</div>':'')+
      (laws?'<span class="blab">관련 법령·규정</span><div class="laws">'+laws+'</div>':'')+(plans?'<span class="blab">관련 계획·지침</span><div class="laws">'+plans+'</div>':'')+'</div>'+
      (x.t?'<p class="tip"><b>실무 팁</b> '+esc(x.t)+'</p>':'')+'</div></details>';
    return h;
  }

  function filtered(){
    var toks = state.q.trim().split(/\s+/).filter(Boolean);
    var ntoks = toks.map(norm).filter(Boolean);
    return {toks:toks, list:QA.filter(function(x){
      if(state.cat!=='all' && x.c!==state.cat) return false;
      for(var i=0;i<ntoks.length;i++){ if(x.idx.indexOf(ntoks[i])<0) return false; }
      return true;
    }), ntoks:ntoks};
  }

  function renderChips(){
    var f = state.q.trim().split(/\s+/).filter(Boolean).map(norm).filter(Boolean);
    function cnt(k){ return QA.filter(function(x){ if(k!=='all'&&x.c!==k) return false; for(var i=0;i<f.length;i++){ if(x.idx.indexOf(f[i])<0) return false;} return true; }).length; }
    var h = '<button type="button" class="chip" data-cat="all" aria-pressed="'+(state.cat==='all')+'">전체<span class="n">'+cnt('all')+'</span></button>';
    CATS.forEach(function(c){ h += '<button type="button" class="chip" data-cat="'+c.k+'" aria-pressed="'+(state.cat===c.k)+'">'+esc(c.n)+'<span class="n">'+cnt(c.k)+'</span></button>'; });
    $('chips').innerHTML = h;
  }

  function renderList(){
    var r = filtered();
    $('count').textContent = r.list.length+'개 질문'+(state.q?(' · “'+state.q.trim()+'” 검색'):'');
    $('qlist').innerHTML = r.list.length ? r.list.map(function(x){return qaHtml(x, r.toks);}).join('') : '<div class="empty">찾는 질문이 없습니다. 다른 낱말(예: 순회, 수당, 협약, 산재)로 검색해 보세요.</div>';
    if($('n-qa')) $('n-qa').textContent = QA.length;
    renderChips();
    syncToggle();
  }

  function syncToggle(){
    var all = $('qlist').querySelectorAll('details.qa');
    var open = $('qlist').querySelectorAll('details.qa[open]');
    $('toggleAll').textContent = (all.length && open.length===all.length) ? '모두 접기' : '모두 펼치기';
  }

  function renderCases(){
    $('n-cases').textContent = CASES.length;
    $('cases').innerHTML = CASES.map(function(c,i){
      return '<article class="case" id="'+esc(c.id)+'"><span class="cno">사례 '+(i+1)+'</span><h3>'+esc(c.t)+'</h3>'+
        '<p class="sit">'+esc(c.s)+'</p><dl>'+
        '<div><dt>쟁점</dt><dd><ul>'+c.i.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul></dd></div>'+
        '<div><dt>판단</dt><dd class="judge">'+esc(c.j)+'</dd></div>'+
        '<div><dt>조치</dt><dd><ol>'+c.a.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ol></dd></div>'+
        '<div><dt>근거</dt><dd><div class="refs">'+c.r.map(function(p){return '<span class="pg"><b>p.'+esc(p)+'</b></span>';}).join('')+(c.l||[]).map(lawHtml).join('')+'</div></dd></div>'+
        '</dl></article>';
    }).join('');
  }
  function renderKeys(){
    $('keys').innerHTML = KEYS.map(function(k){ return '<div class="krow"><span class="k">'+esc(k[0])+'</span><span class="v">'+esc(k[1])+'</span><span class="p">'+(/^\d/.test(k[2])?'p.':'')+esc(k[2])+'</span></div>'; }).join('');
  }
  function renderForms(){
    $('forms').innerHTML = FORMS.map(function(f){ return '<div class="fitem"><span class="fn">'+esc(f[0])+'</span><span>'+esc(f[1])+'</span><span class="fp">p.'+esc(f[2])+'</span></div>'; }).join('');
  }
  function renderLaws(){
    $('laws').innerHTML = LAWS.map(function(b){
      return '<div class="lawblk"><h3>'+esc(b.n)+'</h3>'+(b.s?'<span class="src">'+esc(b.s)+'</span>':'')+
        b.a.map(function(a){
          var label = a[0];
          var full = (b.n.indexOf('조례')>=0) ? '현장실습 운영 및 지원 조례 '+label : (b.n.indexOf('직업교육훈련')===0 ? '직업교육훈련 촉진법 '+label : (b.n.indexOf('근로기준법')===0 ? '근로기준법 '+label.split('·')[0].split('~')[0] : label));
          var link = lawHtml(full).replace('class="law"','class="an"');
          link = link.replace(/>[^<]*<\/(a|span)>$/,'>'+esc(label)+'</$1>');
          return '<div class="art">'+link+'<span class="ad">'+esc(a[1])+'</span><span class="ap">'+(a[2]?'p.'+esc(a[2]):'')+'</span></div>';
        }).join('')+'</div>';
    }).join('');
  }

  /* 계산기 */
  var HOL = (FP.HOL||[]);
  function pd(v){ var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v||''); return m ? new Date(+m[1],+m[2]-1,+m[3]) : null; }
  function ymd(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function addM(d,k){ var y=d.getFullYear(), m=d.getMonth()+k, day=d.getDate(); var last=new Date(y,m+1,0).getDate(); return new Date(y,m,Math.min(day,last)); }
  function fmtD(d){ var w='일월화수목금토'.charAt(d.getDay()); return d.getFullYear()+'.'+(d.getMonth()+1)+'.'+d.getDate()+'.('+w+')'; }
  function won(n){ return n.toLocaleString('ko-KR')+'원'; }
  function row(k,v,big){ return '<div class="orow'+(big?' big':'')+'"><span>'+k+'</span><b>'+v+'</b></div>'; }

  function calc1(){
    var s=pd($('c1s').value), e=pd($('c1e').value), x=Math.max(0,parseInt($('c1x').value,10)||0), msgs=[];
    if(!s||!e){ $('c1o').innerHTML=row('입력','시작일과 종료일을 넣어 주세요'); $('c1m').innerHTML=''; return; }
    if(e<s){ $('c1o').innerHTML=row('입력','종료일이 시작일보다 빠릅니다'); $('c1m').innerHTML=''; return; }
    var days=0, wd=0, hol=0;
    for(var d=new Date(s); d<=e; d.setDate(d.getDate()+1)){
      days++; var w=d.getDay();
      if(w>0&&w<6){ if(HOL.indexOf(ymd(d))>=0) hol++; else wd++; }
    }
    var est=Math.max(0,wd-x);
    var k=Math.max(1,Math.ceil(est/20));
    $('c1o').innerHTML = row('달력상 기간', fmtD(s)+' ~ '+fmtD(e)+' ('+days+'일)')+
      row('총 기간(주 단위)', days+'일 = '+Math.floor(days/7)+'주'+(days%7?' '+(days%7)+'일':'')+' <small>(약 '+(Math.round(days/7*10)/10)+'주)</small>')+
      row('추정 실습일수', est+'일 <small>(월~금, 공휴일 '+hol+'일·기타 '+x+'일 제외)</small>')+
      row('방문 순회지도 횟수 <small>(실습일 20일 기준 1번)</small>', k+'회', true);
    msgs.push('<p class="msg i">순회지도는 실습일 기준 1개월(20일)마다 1회입니다: 실습일 1~20일 1회, 21~40일 2회, 41~60일 3회.</p>');
    if(est>60) msgs.push('<p class="msg c">추정 실습일수가 60일을 넘습니다. 60일 초과 운영은 교육청 현장실습 협의체 심의 사항으로, 실습 전에 서식 6(p.55)을 제출해 승인받아야 합니다.</p>');
    var sm=s.getMonth()+1; if(sm>=3&&sm<=9) msgs.push('<p class="msg w">산업체 채용형은 10월 1일 이후 시작할 수 있습니다(p.6, p.21). 체험형·연계교육형이면 해당 기준을 확인하세요.</p>');
    msgs.push('<p class="msg w">노무사 기업코칭(학생 면담 포함)과 별개로 순회지도는 1회도 생략할 수 없습니다(교육부 성과지표상 기업코칭은 순회지도로 인정되지 않음). 설 연휴·재량휴업일 등은 기타 제외일에 넣어 주세요.</p>');
    $('c1m').innerHTML = msgs.join('');
  }
  function calc2(){
    var d=Math.max(0,parseInt($('c2d').value,10)||0), h=parseInt($('c2h').value,10)||7, t=parseInt($('c2t').value,10)||1, msgs=[];
    var tot=d*h, intro=Math.ceil(tot*0.3*10)/10, ojt=Math.floor(tot*0.7*10)/10;
    var pay=tot*5000, sup=Math.min(d*60000,3600000), tch=Math.min(d*(t>1?35000:30000),2100000);
    $('c2o').innerHTML = row('총 실습시간', tot+'시간')+
      row('입문교육(30% 이상)', intro+'시간 이상 <small>(의무교육 12시간 포함)</small>')+
      row('실무교육(OJT, 70% 이내)', ojt+'시간 이내')+
      row('기업 지급 최저 수당 <small>(시간당 5,000원)</small>', won(pay), true)+
      row('현장실습 지원금 <small>(1일 6만 원, 최대 360만 원)</small>', won(sup))+
      row('기업현장교육 지원금 <small>(교사 1인, 세전)</small>', won(tch));
    if(intro<12) msgs.push('<p class="msg w">총 실습시간이 짧아 30%가 12시간에 못 미칩니다. 의무교육 12시간 이상은 별도로 반드시 확보해야 합니다(p.7, p.54).</p>');
    if(h>7) msgs.push('<p class="msg w">1일 7시간을 넘는 1시간은 학생 동의와 협약서 서면 표시가 있어야 하며, 1주 5시간을 넘을 수 없습니다. 연장 1시간도 같은 단가(1.5배 아님)로 지급합니다(p.81, p.92).</p>');
    if(d>60) msgs.push('<p class="msg c">60일을 넘습니다. 교육청 현장실습 협의체 심의·승인(서식 6 사전 제출) 없이 운영할 수 없습니다.</p>');
    if(t>1) msgs.push('<p class="msg i">1:2 지도는 부득이한 경우에만 허용되며, 위험작업은 반드시 1:1로 배치해야 합니다(p.58).</p>');
    msgs.push('<p class="msg i">지원금은 산업체 채용형만 해당하며, 기업현장교육 지원금은 기타소득세 8.8% 원천징수 전 금액입니다(p.10).</p>');
    $('c2m').innerHTML = msgs.join('');
  }

  /* 탭 */
  function showTab(name, push){
    state.tab=name;
    var tabs=document.querySelectorAll('.tab');
    for(var i=0;i<tabs.length;i++){ tabs[i].setAttribute('aria-selected', tabs[i].getAttribute('data-tab')===name?'true':'false'); }
    ['ask','qa','cases','keys','calc','laws','forms'].forEach(function(n){ $('p-'+n).hidden = (n!==name); });
    if(push){ try{ history.replaceState(null,'','#/fp/'+name); }catch(e){} }
  }

  /* 이벤트 */
  document.addEventListener('click', function(ev){
    var t=ev.target;
    var tab = t.closest ? t.closest('.tab') : null;
    if(tab){ ev.preventDefault(); showTab(tab.getAttribute('data-tab'), true); window.scrollTo(0,0); return; }
    var ql = t.closest ? t.closest('.quick a') : null;
    if(ql){ ev.preventDefault(); var hid=ql.getAttribute('href'); try{ history.replaceState(null,'',hid); }catch(e){} route(); return; }
    var chip = t.closest ? t.closest('.chip') : null;
    if(chip){ state.cat=chip.getAttribute('data-cat'); renderList(); return; }
  });
  $('toggleAll').addEventListener('click', function(){
    var all=$('qlist').querySelectorAll('details.qa'), open=$('qlist').querySelectorAll('details.qa[open]');
    var to = !(all.length && open.length===all.length);
    for(var i=0;i<all.length;i++){ all[i].open=to; }
    syncToggle();
  });
  $('qlist').addEventListener('toggle', function(){ syncToggle(); }, true);
  var timer;


  ['c1s','c1e','c1x'].forEach(function(id){ $(id).addEventListener('input', calc1); });
  ['c2d','c2h','c2t'].forEach(function(id){ $(id).addEventListener('input', calc2); $(id).addEventListener('change', calc2); });
  window.addEventListener('beforeprint', function(){ var a=document.querySelectorAll('details.qa'); for(var i=0;i<a.length;i++) a[i].open=true; });

  /* 초기 렌더 */
  QA.forEach(function(x){ if(x.star) x.open=true; });
  var QUICK=(FP.QUICK||[]);
  $('quick').innerHTML='<span class="blab">자주 찾는 질문</span><ul>'+QUICK.map(function(id){var x=null;for(var i=0;i<QA.length;i++){if(QA[i].id===id)x=QA[i];} return x?'<li><a href="#/fp/'+id+'"><span>Q'+x.no+'</span><b>'+esc(x.q)+'</b></a></li>':'';}).join('')+'</ul>';
  renderList(); renderCases(); renderKeys(); renderForms(); renderLaws(); calc1(); calc2();

  function route(){
    var h=(location.hash||''); if(h.indexOf('#/fp')!==0) return; h=decodeURIComponent(h.replace(/^#\/fp\/?/,''));
    if(!h) return;
    if(h==='qa'){ showTab('ask',true); return; }
    if(['ask','cases','keys','calc','laws','forms'].indexOf(h)>=0){ showTab(h,false); return; }
    if(/^q\d+$/.test(h)){ var qx=null; for(var qi=0;qi<QA.length;qi++){ if(QA[qi].id===h) qx=QA[qi]; } showTab('ask',true); if(qx){ $('askq').value=qx.q; answer(qx.q); } return; }
    if(h.indexOf('ask/')===0){ var aq=h.slice(4).trim(); showTab('ask',true); if(aq){ $('askq').value=aq; answer(aq); } return; }
    if(/^c\d+$/.test(h)){ showTab('cases',false); var c=$(h); if(c) setTimeout(function(){ c.scrollIntoView({block:'start'}); window.scrollBy(0,-190); },50); }
  }


  /* ── 질문하기 ── */
  var EX=(FP.EX||[]);
  $('examples').innerHTML='<span class="blab">질문 예시 (누르면 바로 답변)</span>'+EX.map(function(e){return '<button type="button" class="ex">'+esc(e)+'</button>';}).join('');
  var turnNo=0;
  function cite(x){
    var r=(x.r||[]).map(function(a){return a[0]+'쪽 「'+a[1]+'」';}).join(', ');
    var l=(x.l||[]).join(', '); var pl=(x.p||[]).join(', ');
    return '<p class="cite"><b>근거</b> 전남광주통합특별시교육청 「2026년 개정 직업계고 현장실습 운영 공통매뉴얼(학교용)」 '+esc(r)+(l?' / <b>관련 법령</b> '+esc(l):'')+''+(pl?' / <b>관련 계획·지침</b> '+esc(pl):'')+'</p>';
  }
  function qwords(q){
    return q.replace(/[^0-9a-zA-Z가-힣\s]/g,' ').split(/\s+/).map(function(w){return w.replace(/(은|는|이|가|을|를|에|의|도|로|으로|에서|에게|하고|하면|해야|인가요|나요|합니다|입니다|했는데|했습니다|습니다|어요|이요)$/,'');}).filter(function(w){return w.length>=2 && !/^(현장실습|현장|실습|학생|학교|경우|어떻게|무엇|이러한|이런|그러면|해당|관련|정도|궁금)$/.test(w);});
  }
  function hlw(text, ws){
    var out=esc(text);
    ws.forEach(function(w){ var sf=w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); try{ out=out.replace(new RegExp('('+sf+')','g'),'<mark>$1</mark>'); }catch(e){} });
    return out;
  }
  function plain(el){ return (el.innerText||el.textContent||'').replace(/\n{3,}/g,'\n\n').trim(); }
  var SEC_T=18, MAN_T=22;
  function answer(q, noScroll){
    q=q.trim(); if(!q) return;
    var res=ASK.search(q), calc=ASK.compute(q);
    var qa=res.filter(function(r){return r.d.k==='qa';}), cs=res.filter(function(r){return r.d.k==='case';}), mn=res.filter(function(r){return r.d.k==='man';}), sc=res.filter(function(r){return r.d.k==='sec';});
    var top=qa[0], ws=qwords(q);
    var okc0 = !!(top && (top.s>=20 || top.rt));
    var conf= top ? top.s : 0;
    var h='<div class="body">';
    if(calc.length){
      h+='<div class="calcans"><span class="blab">질문 속 숫자로 계산한 답변</span>'+calc.map(function(c){return (c.lead?'<p class="lead">'+c.lead+'</p>':'')+c.lines.map(function(l){return '<p>'+l+'</p>';}).join('');}).join('')+'</div>';
    }
    var secWin = sc.length && sc[0].hb && (!top || (!top.rt && sc[0].s>top.s));
    if(top && (conf>=20 || top.rt) && !secWin){
      var x=top.d.r;
      h+='<p class="concl"><span class="lab">답변</span>'+em(x.a)+'</p>'+cite(x);
      if((x.d&&x.d.length)||x.t) h+='<details class="more"><summary>세부 내용 보기</summary><div class="detail">'+(x.d||[]).map(line).join('')+(x.t?'<p class="tip"><b>실무 팁</b> '+esc(x.t)+'</p>':'')+'</div></details>';
      if(sc.length && sc[0].s>=SEC_T){ var Sx=sc[0].d.r; h+='<p class="cite"><b>관련 매뉴얼 항목</b> p.'+Sx[0]+(Sx[1]!==Sx[0]?'~'+Sx[1]:'')+' 「'+esc((Sx[3]?Sx[3]+' › ':'')+Sx[2])+'」</p>'; }
      if(x.f) h+='<p class="low">매뉴얼·법령에 명확한 기준이 없는 부분이 포함되어 있습니다. <b>취업지원센터에 문의 요망</b></p>';
    } else if(sc.length && sc[0].s>=SEC_T){
      var S=sc[0].d.r, pr=S[0]===S[1]?('p.'+S[0]):('p.'+S[0]+'~'+S[1]);
      var title=(S[3]?S[3]+' › ':'')+S[2];
      var body=S[4].split('\n').map(function(t){return t.trim();}).filter(Boolean);
      var lead=body.join(' ').slice(0,420);
      h+='<p class="concl"><span class="lab">답변 · 매뉴얼 '+pr+' 「'+esc(title)+'」</span>'+hlw(lead+(body.join(' ').length>420?'…':''),ws)+'</p>';
      h+='<p class="cite"><b>근거</b> 전남광주통합특별시교육청 「2026년 개정 직업계고 현장실습 운영 공통매뉴얼(학교용)」 '+pr+' 「'+esc(title)+'」</p>';
      h+='<details class="more" open><summary>매뉴얼 원문 전체 보기 ('+pr+')</summary><div class="detail">'+body.map(function(t){return '<p class="l2">'+hlw(t,ws)+'</p>';}).join('')+'</div></details>';
      okc0=true;
      if(sc[1] && sc[1].s>=SEC_T*0.8 && sc[1].d.r!==S){ var S2=sc[1].d.r; h+='<p class="cite"><b>함께 볼 매뉴얼 항목</b> p.'+S2[0]+' 「'+esc((S2[3]?S2[3]+' › ':'')+S2[2])+'」</p>'; }
    } else if(mn.length && mn[0].s>=MAN_T){
      var M=mn[0].d.r;
      h+='<p class="concl"><span class="lab">답변 · 매뉴얼 p.'+M[0]+' 원문</span>'+hlw(M[1],ws)+'</p>';
      h+='<p class="cite"><b>근거</b> 전남광주통합특별시교육청 「2026년 개정 직업계고 현장실습 운영 공통매뉴얼(학교용)」 '+M[0]+'쪽</p>';
      okc0=true;
    } else {
      h+='<p class="low"><b>현장실습 매뉴얼 및 관련 법률·시행령·시행규칙·지침·조례에서 확인되지 않는 사항입니다. 취업지원센터에 문의 요망</b>'+(top&&conf>=10?'<br>참고로 비슷한 내용: ‘'+esc(top.d.r.q)+'’':'')+'</p>';
    }
    if(cs.length && cs[0].s>=20){
      var c=cs[0].d.r;
      h+='<details class="more"><summary>비슷한 사례: '+esc(c.t)+'</summary><div class="detail"><p>'+esc(c.s)+'</p><p><b>판단</b> '+esc(c.j)+'</p><ol>'+c.a.map(function(a){return '<li>'+esc(a)+'</li>';}).join('')+'</ol></div></details>';
    }
    var seen={}, picks=[];
    var mtop=mn.length?mn[0].s:0;
    for(var i=0;i<mn.length && picks.length<3;i++){ if(mn[i].s<Math.max(12,mtop*0.55)) break; var m=mn[i].d.r; if(seen[m[0]]) continue; seen[m[0]]=1; picks.push(m); }
    if(picks.length){
      h+='<div class="man"><span class="blab">'+(okc0?'매뉴얼 원문 (책자에서 해당 쪽을 확인하세요)':'참고: 질문 낱말이 들어간 매뉴얼 원문')+'</span>'+picks.map(function(m){ var t=m[1].length>260?m[1].slice(0,260)+'…':m[1]; return '<p class="mq"><span class="pg"><b>p.'+m[0]+'</b></span>'+hlw(t,ws)+'</p>'; }).join('')+'</div>';
    }
    var okc=top&&(conf>=20||top.rt)&&!secWin; var rel=qa.slice(okc?1:0,(okc?1:0)+3).filter(function(r){return r.s>=15;});
    if(rel.length) h+='<div class="rel"><span class="blab">이어서 물어볼 만한 질문</span>'+rel.map(function(r){return '<button type="button" class="relq" data-q="'+esc(r.d.r.id)+'">'+esc(r.d.r.q)+'</button>';}).join('')+'</div>';
    h+='<p class="nt">※ 위 매뉴얼·법령 근거로 판단하기 어려운 세부 사항은 취업지원센터에 문의 요망</p><div class="tools"><button type="button" class="ghost copyans">답변 복사</button></div></div>';
    turnNo++;
    var el=document.createElement('article'); el.className='turn';
    el.innerHTML='<div class="uq"><span>질문 '+turnNo+'</span><div>'+esc(q)+'</div></div>'+h;
    var th=$('thread'); th.insertBefore(el, th.firstChild);
    if(!noScroll){ el.scrollIntoView({block:'start'}); window.scrollBy(0,-190); }
  }
  $('askform').addEventListener('submit', function(ev){ ev.preventDefault(); answer($('askq').value); });
  $('askq').addEventListener('keydown', function(ev){ if(ev.isComposing || ev.keyCode===229) return; if(ev.key==='Enter' && !ev.shiftKey){ ev.preventDefault(); answer(this.value); try{ this.blur(); }catch(e){} } });
  document.addEventListener('click', function(ev){
    var t=ev.target; if(!t.closest) return;
    var ex=t.closest('.ex'); if(ex){ $('askq').value=ex.textContent; answer(ex.textContent); return; }
    var rq=t.closest('.relq'); if(rq){ var id=rq.getAttribute('data-q'); for(var i=0;i<QA.length;i++){ if(QA[i].id===id){ answer(QA[i].q); break; } } return; }
    var cp=t.closest('.copyans'); if(cp){ var turn=cp.closest('.turn'); var txt=plain(turn).replace('답변 복사','').trim();
      var done=function(){ cp.textContent='복사됨'; setTimeout(function(){cp.textContent='답변 복사';},1500); };
      var fallback=function(){ var ta=document.createElement('textarea'); ta.value=txt; document.body.appendChild(ta); ta.select(); try{ document.execCommand('copy'); done(); }catch(e){} document.body.removeChild(ta); };
      try{ navigator.clipboard.writeText(txt).then(done, fallback); }catch(e){ fallback(); } }
  });
  if(EX.length) answer(EX[0], true);
  try{ document.getElementById('n-cases').textContent=CASES.length; document.getElementById('fpSource').textContent='쪽수 기준 '+(FP.source||'')+(FP.lawBasis?' · 법령 기준 '+FP.lawBasis:''); }catch(e){}
  showTab('ask',false);
  route();
  window.addEventListener('hashchange', route);
};
