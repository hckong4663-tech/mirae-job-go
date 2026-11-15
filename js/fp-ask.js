/* 현장실습 Q&A 서술형 질문 답변 엔진(기존 「2026 현장실습 업무 Q&A」에서 이관, 자료는 서명 검증 후 주입) */
/* 서술형 질문 답변 엔진: 인터넷 연결 없이 매뉴얼 원문(쪽수)·Q&A·사례·법령 자료에서 답을 찾고, 숫자가 있는 질문은 기준에 따라 계산 */
var ASK = null;
window.MJG_ASK_INIT = function(){ ASK = (function(){
  var SYN = [
    [/부도|폐업|문을 닫|도산|휴업/, '실습 중단 해지 다른 기업 알선 현장실습중단 방지'],
    [/그만두|그만 두|포기|중단|나오고 싶|못 하겠|복귀|돌아오/, '복교 중단 복교의견서 조기복교'],
    [/다쳤|다치|부상|사고|병원|골절|화상|베였|끼임|넘어/, '안전사고 산재 사안보고서 요양급여'],
    [/산재|산업재해|공제회/, '산재보험 안전사고 학교안전공제회'],
    [/야근|늦게|밤|잔업|초과|오버|연장|퇴근/, '실습시간 연장 야간 초과'],
    [/주말|토요일|일요일|공휴일|휴일|명절|연휴|국경일/, '휴일 공휴일 국경일'],
    [/돈|월급|급여|페이|임금|수당|시급/, '현장실습 수당 시간당'],
    [/정규직|채용|입사|취업|근로계약|조기취업/, '취업 전환 근로계약'],
    [/욕|폭언|괴롭|갑질|때리|폭행|성희롱|소리/, '괴롭힘 폭행 권익보호 조사'],
    [/실사|사전 점검|사전점검/, '사전 현장실사 노무사'],
    [/결석|지각|조퇴|출석|출결|나이스|neis/i, '출결 출결일지 인정결석'],
    [/협약|계약서|도장|날인|서명|간인|계인/, '표준협약서 협약 체결'],
    [/위원회|심의|소위/, '현장실습운영위원회 소위원회 심의'],
    [/선도/, '선도기업'],
    [/순회|방문|출장/, '순회지도 방문'],
    [/사전교육|13차시|특별교육|노동인권|안전교육/, '사전교육 실습직전 특별교육 13차시'],
    [/연수/, '교사 연수'],
    [/공무원|공기업|공공기관|부사관|군무원/, '공공기관 공무원 연계교육형'],
    [/군대|입대|병역|군 입대/, '군 입대 병역 사직서'],
    [/예산|운영비|집행|간식|재료비|여비|수당 지급 기준/, '현장실습 운영비 지출'],
    [/지원금|장학재단|장려금/, '지원금 한국장학재단'],
    [/기업현장교사|멘토|사수|담당자 배치|지도자/, '기업현장교사 배치'],
    [/혼자|단독|자리를 비|출장 가|휴가/, '기업현장교사 단독 부재 대체'],
    [/부전공|다른 전공|전공이 다|전공 불일치/, '부전공 전공 일치'],
    [/1학년|2학년|저학년/, '1·2학년 학년'],
    [/체험|견학|캠프/, '산업체 체험형'],
    [/자격증|간호조무사|해기사|조련/, '자격 연계교육형'],
    [/주소|장소|근무지/, '실습 장소 사업자등록증'],
    [/숙박|호텔|편의점|주유소|배달|술집|유흥|게임/, '청소년 고용금지업소 유해'],
    [/1인|소규모|직원이 적|직원 수|사장 혼자/, '1인 기업 소규모 5인'],
    [/세금|원천징수|과세|소득/, '세금 과세 비과세'],
    [/생리/, '생리휴가'],
    [/성적|학점|생활기록부|생기부|평가/, '성적 학점 평가'],
    [/hifive|하이파이브/i, 'HIFIVE'],
    [/lms|일지|ai|위험징후/i, '실습일지 LMS AI'],
    [/평가회|보고회|자체진단|결과 공개/, '평가보고회 자체진단'],
    [/점검|감사|지도점검|컨설팅/, '지도·점검'],
    [/60일|3개월|석 달|기간 연장|더 하고|늘리/, '60일 기간 연장 승인'],
    [/변경|바꾸|옮기/, '현장실습 변경 합의서'],
    [/도제|맞춤반|중소기업 특성화고/, '도제 취업맞춤반'],
    [/일학습/, '일학습병행 학습기업'],
    [/자회사|지점|본사|다른 회사|다른 기업/, '다른 기업 자회사 지점 취업 전환'],
    [/4대 ?보험|국민연금|건강보험|고용보험/, '4대 사회보험 산재보험'],
    [/조례|통합/, '조례 부칙'],
    [/종류|형태|가짓수|몇 ?가지|분류/, '유형 구분'],
    [/뜻|정의|의미|개념|이란|란\?|란 무엇/, '정의 이란'],
    [/점검|컨설팅|지원단|감사|중앙점검|관리 ?계획/, '지도·점검 점검반 안전조치 지원단 관리 계획 컨설팅'],
    [/노무사/, '학교전담노무사 노무사 사전 현장실사 기업코칭'],
    [/참여기업/, '참여기업 겨울방학 1월 1일 취업 전환 시기'],
    [/바로 취업|언제부터 취업|취업시켜|12월|조기/, '취업 전환 시기 겨울방학 1월 1일'],
    [/기간을|기간은|\d+\s*일로|며칠/, '운영 기간 60일 3개월 연장 승인'],
    [/특수교육|장애/, '특수교육대상자']
  ];
  var STOP = {'습을':1,'습이':1,'습은':1,'습의':1,'학생':1,'생이':1,'생을':1,'하나':1,'나요':1,'어떻':1,'떻게':1,'합니':1,'니다':1,'해야':1,'야하':1,'있나':1,'경우':1,'학교':1,'교에':1,'에서':1,'으로':1,'하는':1,'하고':1,'인가':1,'가요':1,'까요':1,'되나':1,'는데':1,'에게':1,'입니':1,'이런':1,'이러':1,'러한':1,'한경':1,'하면':1,'되는':1,'무엇':1,'엇인':1,'얼마':1,'정도':1,'궁금':1,'금합':1,'알려':1,'려주':1,'주세':1,'세요':1,'해주':1,'싶습':1,'습니':1};

  function n(s){ return String(s).toLowerCase().replace(/<[^>]+>/g,' ').replace(/[^0-9a-z가-힣]+/g,''); }
  function grams(s){ var t=n(s), g={}; for(var i=0;i<t.length-1;i++){ var b=t.substr(i,2); g[b]=(g[b]||0)+1; } return g; }

  var DOCS=[], DF={}, NDOC=0, AVG=0;
  function addDoc(kind, ref, text, w){
    var g=grams(text), len=0; for(var k in g){ len+=g[k]; DF[k]=(DF[k]||0)+1; }
    DOCS.push({k:kind, r:ref, g:g, len:len, w:w||1});
  }
  function build(){
    QA.forEach(function(x){
      addDoc('qa', x, x.q+' '+x.q+' '+((x.k||[]).join(' ')+' ').repeat(3)+x.a+' '+(x.d||[]).join(' ')+' '+(x.l||[]).join(' ')+' '+(x.p||[]).join(' '), 1.25);
    });
    CASES.forEach(function(c){ addDoc('case', c, c.t+' '+c.s+' '+c.i.join(' ')+' '+c.j, 1); });
    MAN.forEach(function(m){ addDoc('man', m, m[1], 1); });
    SEC.forEach(function(s){ var hd=s[2].replace(/^([가-하]\.|\d+\)|■)\s*/,''); addDoc('sec', s, (hd+' ').repeat(3)+s[3]+' '+s[4], 1); });
    NDOC=DOCS.length; var s=0; DOCS.forEach(function(d){ s+=d.len; }); AVG=s/NDOC;
  }
  function expand(q){
    var add=[]; SYN.forEach(function(r){ if(r[0].test(q)) add.push(r[1]); });
    return q+' '+add.join(' ');
  }
  function score(qg, d){
    var s=0, k1=1.2, b=0.6;
    for(var t in qg){
      if(STOP[t] || /^[0-9]+$/.test(t)) continue;
      var f=d.g[t]; if(!f) continue;
      var idf=Math.log(1+(NDOC-DF[t]+0.5)/(DF[t]+0.5));
      s+= idf*(f*(k1+1))/(f+k1*(1-b+b*d.len/AVG)) * Math.min(qg[t],2);
    }
    return s*d.w;
  }
  var ROUTE=[
    [/전담 ?노무사.*(역할|지원|무엇|무슨|하는|도움)/, ['q106']],
    [/일지.*(안 ?쓰|미작성|작성 ?안|안 ?써)/, ['q99','q105']],
    [/(취업|졸업).*(임금|월급|급여).*(못|안)/, ['q111']],
    [/(대표|지역대표) ?노무사/, ['q108','q106']],
    [/노무사.*(연락|안 ?되|지연|늦|교체|진행이 안)|실사.*(1주|안 ?되|지연|늦|안 ?해|안 ?하|지나도)/, ['q109','q108']],
    [/노무사.*(비용|수당|돈|무료|누가 ?(내|부담|지급))|(비용|수당).*노무사/, ['q107']],
    [/(참여기업).*(기업 ?코칭|코칭)|코칭.*(일정|참여기업)/, ['q110']],
    [/(취업|졸업생|정규직).*(체불|노동 ?문제|노무사)|체불/, ['q111']],
    [/노무사.*(역할|지원|무엇|도움|하는 ?일)|전담 ?노무사/, ['q106','q108','q107']],
    [/안전조치 ?지원단|바로 ?방문|즉시 ?점검|위험징후.*(점검|방문)/, ['q99']],
    [/(점검|컨설팅|감사).*(준비|자료|서류)/, ['q100','q100','q101']],
    [/체크리스트|점검 ?항목|무엇을 ?(보|점검)/, ['q101','q100']],
    [/(점검|지적).*(지적|조치|개선|후속)/, ['q102']],
    [/컨설팅/, ['q103','q98']],
    [/(일지|lms|ai).*(관리|미작성|교육청)/i, ['q105','q56']],
    [/(지도 ?점검|지도·점검|점검반|관리 ?계획|중앙 ?점검|현장 ?점검)/, ['q98','q100','q103']],
    [/60\s*일.*(초과|넘|이상|연장)|3\s*개월.*(초과|넘|이상)|기간.*(연장|늘리|초과|넘)|(초과|넘겨|넘어).*(실습|운영)|협의체.*(기간|연장)|며칠까지|최대.*(기간|며칠|몇 ?일)/, ['q97','q2']],
    [/(\d{2,3})\s*일/, function(q){ var m=q.match(/(\d{2,3})\s*일/); return (m && +m[1]>60 && !/월\s*\d{1,2}\s*일/.test(q)) ? ['q97'] : []; }],
    [/채용형.*(언제|시작|며칠|최대)|(언제부터|시작 ?시기).*(채용형|현장실습)/, ['q2','q2']],
    [/선도 ?기업.*(혜택|인센티브|우대|가점|지원 ?정책|좋은 ?점|이점|메리트)|(혜택|인센티브|가점).*선도 ?기업/, ['b3','b3','b1']],
    [/참여 ?기업.*(혜택|인센티브|우대|지원 ?정책|좋은 ?점|이점|메리트)|(혜택|인센티브).*참여 ?기업/, ['b1','b1','b3']],
    [/고졸.*(채용|고용).*(지원|혜택|장려금|세액|인센티브)|(채용|고용).*(기업).*(지원금|장려금|세액 ?공제)|도약 ?장려금|통합 ?고용/, ['b2','b2']],
    [/병역 ?지정|산업기능요원|best ?hrd|신용보증기금|기술보증기금|매출채권/i, ['b3','b3']],
    [/(수당|식비|교재비|재료비|인력개발비).*세액 ?공제|세액 ?공제.*(수당|현장실습생)/, ['b1','b1','q46']],
    [/안전 ?장비|고위험 ?개선|금리 ?우대|기업.*(혜택|지원 ?정책)/, function(q){ return /선도/.test(q) ? [] : ['b1','b1']; }],
    [/순회/, ['q51','q52','q53']],
    [/수당|시급|월급|급여/, ['q44','q45']],
    [/밤|야간|휴일|공휴일|주말|몇 ?시간|연장 ?실습|늦게까지|초과 ?근무/, ['q42','q43']],
    [/다쳤|다치|부상|사고|산재|병원/, ['q64','q65']],
    [/그만|중단|포기|조기 ?복교/, ['q66','q67']],
    [/(그만|중단|중지).*(관리 ?계획|처리)/, ['q66','q66','q67']],
    [/(정규직|채용|취업).*(선도)|(선도).*(정규직|채용|취업)/, ['q71']],
    [/(정규직|채용|취업).*(참여기업)|(참여기업).*(정규직|채용|취업)/, ['q70']],
    [/취업 ?전환|정규직|근로계약/, ['q72','q70','q71']],
    [/괴롭|욕|폭언|폭행|갑질|성희롱/, ['q62']],
    [/기업현장교사.*(출장|휴가|부재|비우|혼자)|혼자.*(작업|실습)/, ['q35']],
    [/기업현장교사.*(자격|몇 ?명|인원)/, ['q34']],
    [/소위원회/, ['q12']],
    [/노무사.*(불참|참석|못 ?온|못 ?와)/, ['q13']],
    [/운영위원회.*(구성|몇 ?명|정족|위원)/, ['q11']],
    [/사전 ?현장 ?실사|사전실사|실사/, ['q19']],
    [/선도기업.*(신청|언제)/, ['q21']],
    [/선도기업.*(기간|유효|몇 ?년|취소)/, ['q22']],
    [/전자 ?서명|전자 ?계약|간인|계인/, ['q41','q40']],
    [/크레탑|cretop|기업 ?정보.*(확인|조회|사이트)|(재무|신용).*(확인|조회)/i, ['q25']],
    [/직무 ?성장/, ['q6','q1']],
    [/채용연계형 ?직무 ?교육|대한상공회의소|대한상의/, ['q90','q83']],
    [/(70\s*점|몇 ?점|점수|판정).*(연계|현지 ?실사|기관)|(연계|현지 ?실사).*(70\s*점|몇 ?점|점수|판정)/, ['q84']],
    [/(기업 ?코칭|코칭).*(순회|생략|대체|인정)|순회.*(코칭|생략|대체)/, ['q110','q110','q51']],
    [/(기업 ?코칭|코칭).*(수당|비용|돈|다른 ?학교|타 ?학교|중복|먼저)|(타 ?학교|다른 ?학교).*코칭/, ['q107','q107','q106']],
    [/(공공기관|공기업).*(연계|협약서)|연계.*(공공기관|공기업)/, ['q89','q89']],
    [/프로그램 ?개발 ?(비|수당)|개발 ?수당|원고료/, ['q33','q33']],
    [/(산재|산업 ?재해).*(3년|사후 ?관리)/, ['q100']],
    [/협약서/, ['q40']],
    [/(토요일|일요일|주말|공휴일).*결석|결석.*(토요일|일요일|주말)/, ['q58']],
    [/결석|출결|나이스|neis/i, ['q57','q58']],
    [/변경|바꾸/, ['q59']],
    [/간식|재료비|방과후|비품|시설 ?개선/, ['q79']],
    [/운영비|간식|재료비|예산/, ['q78','q79']],
    [/장려금/, ['q82']],
    [/지원금/, ['q80','q81']],
    [/연계교육형.*(승인|절차|신청)/, ['q83']],
    [/공무원|부사관|군무원|공기업|공공기관/, ['q7','q8','q47']],
    [/군대|입대|병역/, ['q96']],
    [/체험형|견학|캠프/, ['q4']],
    [/\d\s*개월/, function(q){ var m=q.match(/(\d)\s*개월/); return (m && +m[1]>3) ? ['q97'] : []; }],
    [/연계.*채용|채용.*연계/, ['q3','q97']],
    [/부도|폐업|문을 닫|경영 ?악화|도산|휴업|실습을 (못|중단)/, ['q50','q66']],
    [/부전공/, ['q5']],
    [/1학년|2학년/, ['q6']],
    [/입문교육|실무교육|ojt/i, ['q30']],
    [/의무교육/, ['q31']],
    [/사전교육|13차시|특별교육/, ['q37']],
    [/(자체진단|평가 ?결과).*(공개|공유|홈페이지|누리집)/, ['q92','q92']],
    [/평가보고회|자체진단/, ['q91','q92']],
    [/1인|소규모|직원이 ?적/, ['q24']],
    [/숙박|호텔|편의점|주유소|유흥|고용금지/, ['q26']]
  ];
  function routed(q){
    var ids={}, nq=n(q);
    var hits=[];
    QA.forEach(function(x){
      if(n(x.q)===nq){ ids[x.id]=(ids[x.id]||0)+300; }
      (x.k||[]).forEach(function(k){ var nk=n(k); if(nk.length>=2 && nq.indexOf(nk)>=0) hits.push([x.id,nk]); });
    });
    hits=hits.filter(function(h){ return !hits.some(function(o){ return o[1].length>h[1].length && o[1].indexOf(h[1])>=0; }); });
    var bestPer={};
    var core=nq.replace(/(에대해서?|에관해서?|에대한)?(자세히)?(알려주세요|알려줘|설명해주세요|설명해줘|궁금합니다|궁금해요|무엇인가요|무엇인가|뭔가요|뭐예요|뭐에요|이란무엇|란무엇|이란|란|입니까|인가요)+$/g,'').replace(/(은|는|이|가|을|를|의)$/,'');
    hits.forEach(function(h){ var cover=h[1].length/Math.max(core.length,1); var bonus = cover>=0.4 ? 40+h[1].length*4 : 8+h[1].length; bestPer[h[0]]=Math.max(bestPer[h[0]]||0,bonus); });
    for(var id in bestPer) ids[id]=(ids[id]||0)+bestPer[id];
    ROUTE.forEach(function(r){ var hit = typeof r[1]==='function' ? (r[0].test(q) ? r[1](q) : []) : (r[0].test(q) ? r[1] : []); hit.forEach(function(id,i){ ids[id]=(ids[id]||0)+(i===0?60:35); }); });
    return ids;
  }
  function search(q){
    if(!NDOC) build();
    var qg=grams(expand(q)), rt=routed(q);
    var nq=n(q);
    var res=DOCS.map(function(d){ var s=score(qg,d), hb=false; if(d.k==='qa' && rt[d.r.id] && rt[d.r.id]>=20) s+=rt[d.r.id]; else if(d.k==='qa' && rt[d.r.id]) s+=rt[d.r.id];
      if(d.k==='sec'){ var hd=n(d.r[2].replace(/^([가-하]\.|\d+\)|■|\[)\s*/,'').replace(/\s*\]$/,'')); if(hd.length>=4 && nq.indexOf(hd)>=0){ s+=40+Math.min(24,d.r[4].length/70); hb=true; } }
      return {d:d, s:s, rt:d.k==='qa'&&(rt[d.r.id]||0)>=20, hb:hb}; }).filter(function(x){return x.s>0;});
    res.sort(function(a,b){return b.s-a.s;});
    return res;
  }

  /* ── 숫자·날짜 추출과 계산 ── */
  function nums(q){
    var o={days:null,hours:null,dates:[],clock:null,weekly:null,raw:q};
    var m;
    var q2=q.replace(/(\d{1,2})\s*(?:월|\.|\/)\s*(\d{1,2})\s*일?/g,' ').replace(/(하루|1일|일일|매일)\s*\d+\s*시간/g,' ');
    var dm=q2.match(/(\d{1,3})\s*일(?!\s*(부터|까지))/) || q2.match(/실습일\s*(\d{1,3})/);
    if(dm) o.days=parseInt(dm[1],10);
    var all=q2.match(/\d{1,3}\s*일(?!\s*(부터|까지))/g);
    if(all && all.length>=2 && /연계/.test(q) && /채용/.test(q)){ o.days=all.reduce(function(s,x){return s+parseInt(x,10);},0); o.summed=all.map(function(x){return parseInt(x,10);}); }
    var wk=q.match(/(\d{1,2})\s*주\s*(간|동안)?/); if(wk && !o.days) o.weekly=parseInt(wk[1],10);
    var mo=q.match(/(\d)\s*개월/); if(mo && !o.days && !o.weekly) o.months=parseInt(mo[1],10);
    var hm=q.match(/(?:하루|1일|일일|매일|하루에)\s*(\d{1,2})\s*시간/) || q.match(/(\d{1,2})\s*시간\s*(씩|실습|근무)/);
    if(hm) o.hours=parseInt(hm[1],10);
    var re=/(\d{1,2})\s*(?:월|\.|\/)\s*(\d{1,2})\s*일?/g;
    while((m=re.exec(q))!==null){ var mm=+m[1], dd=+m[2]; if(mm>=1&&mm<=12&&dd>=1&&dd<=31) o.dates.push([mm,dd]); }
    var ck=q.match(/(?:밤|저녁|오후)\s*(\d{1,2})\s*시/) || q.match(/(\d{2})\s*시\s*(까지|이후|넘)/);
    if(ck){ var h=parseInt(ck[1],10); if(/밤|저녁|오후/.test(ck[0]) && h<12) h+=12; o.clock=h; }
    return o;
  }
  var HOL=(window.FP&&FP.HOL)||[];
  function mk(md){ var y = md[0]>=3 ? 2026 : 2027; return new Date(y, md[0]-1, md[1]); }
  function ymd(d){ return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2); }
  function addM(d,k){ var y=d.getFullYear(), m=d.getMonth()+k, day=d.getDate(); var last=new Date(y,m+1,0).getDate(); return new Date(y,m,Math.min(day,last)); }
  function fd(d){ return (d.getMonth()+1)+'.'+d.getDate()+'.('+'일월화수목금토'.charAt(d.getDay())+')'; }
  function won(x){ return x.toLocaleString('ko-KR')+'원'; }
  function endFrom(s, days){ var d=new Date(s), c=0; while(true){ var w=d.getDay(); if(w>0&&w<6&&HOL.indexOf(ymd(d))<0){ c++; if(c===days) return d; } d.setDate(d.getDate()+1); } }
  function wdays(s,e){ var c=0; for(var d=new Date(s); d<=e; d.setDate(d.getDate()+1)){ var w=d.getDay(); if(w>0&&w<6&&HOL.indexOf(ymd(d))<0) c++; } return c; }

  function visits(o){
    var lines=[], s=null, e=null, days=o.days, per='';
    if(o.dates.length>=2){ s=mk(o.dates[0]); e=mk(o.dates[1]); if(e<s) e=null; }
    else if(o.dates.length===1 && days){ s=mk(o.dates[0]); e=endFrom(s,days); }
    if(s&&e){ if(!days) days=wdays(s,e); per='실습 기간 '+fd(s)+' ~ '+fd(e)+'의 '; }
    if(o.weekly && !days) days=o.weekly*5;
    if(o.months && !days) days=o.months*20;
    if(!days) return null;
    var k=Math.max(1,Math.ceil(days/20));
    lines.push(per+'실습일 '+(per&&!o.days?'약 ':'')+days+'일은 순회지도 기준(실습일 기준 1개월(20일)마다 1회)에 따라 <b>방문 순회지도 '+k+'회</b>를 실시하여야 합니다.');
    lines.push('기준: 실습일 1~20일 1회, 21~40일 2회, 41~60일 3회(매뉴얼 p.93·p.104 ‘1개월에 1회 이상’, 조례 제14조② ‘월 1회 이상’).');
    lines.push('노무사 기업코칭(학생 면담 포함)과 별개로 순회지도는 1회도 생략할 수 없습니다. 교육부 성과지표 평가에서 기업코칭은 순회지도로 인정되지 않습니다.');
    if(days>60) lines.push('<span class="warnline">실습일 60일을 넘는 운영은 교육청 현장실습 협의체 심의 사항입니다. 실습 전에 서식 6(p.55)을 제출해 승인을 받아야 합니다.</span>');
    return {lead:'방문 순회지도 '+k+'회', lines:lines};
  }
  function pay(o){
    var days=o.days || (o.weekly?o.weekly*5:null) || (o.months?o.months*20:null); var h=o.hours||7;
    if(!days && !o.hours) return null;
    var lines=[];
    if(h>8) lines.push('<span class="warnline">하루 '+h+'시간 실습은 불가합니다. 1일 7시간이 한도이고, 학생 동의와 협약서 서면 표시가 있을 때만 1시간까지 연장할 수 있습니다(직업교육훈련 촉진법 제9조의2, p.80~81).</span>');
    var hh=Math.min(h,8);
    if(days){
      lines.push('수당은 ‘시간당 5,000원 × 실습시간’으로 계산하므로 '+days+'일 × '+hh+'시간 × 5,000원 = <b>'+won(days*hh*5000)+' 이상</b>을 기업이 지급하여야 합니다(p.91~92).');
      if(hh===8) lines.push('연장한 1시간도 1.5배 가산 없이 같은 시간당 5,000원으로 계산합니다(p.92).');
    } else lines.push('하루 '+hh+'시간이면 1일 수당은 '+hh+' × 5,000원 = <b>'+won(hh*5000)+' 이상</b>입니다(p.91).');
    return {lead: days?won(days*hh*5000)+' 이상':won(hh*5000)+'/일 이상', lines:lines};
  }
  function intro(o){
    var days=o.days || (o.weekly?o.weekly*5:null) || (o.months?o.months*20:null); var h=o.hours||7;
    if(!days) return null;
    var tot=days*Math.min(h,8), a=Math.ceil(tot*0.3*10)/10, b=Math.floor(tot*0.7*10)/10;
    var lines=['총 실습시간 '+tot+'시간('+days+'일×'+Math.min(h,8)+'시간) 중 <b>입문교육 '+a+'시간 이상</b>(그 안에 의무교육 12시간 이상), <b>실무교육(OJT) '+b+'시간 이내</b>로 편성하여야 합니다(p.7, p.54, p.96).'];
    if(a<12) lines.push('30%가 12시간보다 적으므로 의무교육 12시간은 별도로 반드시 확보해야 합니다.');
    return {lead:'입문 '+a+'시간 이상 / 실무 '+b+'시간 이내', lines:lines};
  }
  function support(o){
    var days=o.days; if(!days) return null;
    return {lead:'', lines:['산업체 채용형 실습생의 현장실습 지원금은 1일 6만 원이므로 '+days+'일이면 <b>'+won(Math.min(days*60000,3600000))+'</b>(최대 360만 원), 기업현장교사의 기업현장교육 지원금은 1:1 지도 시 <b>'+won(Math.min(days*30000,2100000))+'</b>(최대 210만 원, 세전)입니다(p.10).']};
  }
  function period(o){
    var lines=[];
    var days=o.days || (o.weekly?o.weekly*5:null) || (o.months?o.months*20:null);
    if(o.summed) lines.push('연계교육형과 산업체 채용형 실습일은 합산하므로 '+o.summed.join('일 + ')+'일 = <b>'+days+'일</b>입니다(p.5, p.144).');
    if(days && days>60) lines.push('실습일 '+days+'일은 기본 기준인 3개월(실습일 60일)을 넘습니다. 60일 초과 운영은 <b>교육청 현장실습 협의체 심의 사항</b>이므로, 학교 현장실습운영(소)위원회 심의 후 실습 전에 「현장실습 기간 연장 승인 신청서」(서식 6, p.55)를 제출하여 협의체 심의를 거쳐 승인받아야 합니다(p.6, p.21).');
    else if(days && days<=60 && !/(60\s*일|3\s*개월|석 ?달).*(초과|넘|이상)/.test(o.raw||'') && /기간|며칠|최대|연장|늘리|넘|합산/.test(o.raw||'')) lines.push('실습일 '+days+'일은 3개월(실습일 60일) 이내이므로 학교 현장실습운영(소)위원회 심의로 운영할 수 있습니다(연계교육형 참여 기간이 있으면 합산, p.144).');
    if(o.clock && (o.clock>=22 || o.clock<6)) lines.push('<span class="warnline">오후 10시부터 오전 6시까지의 실습은 금지되며 위반 시 2년 이하 징역 또는 2천만 원 이하 벌금입니다(직업교육훈련 촉진법 제9조의2②, 제26조).</span>');
    else if(o.clock && o.clock>=18) lines.push('저녁 '+(o.clock-12)+'시까지 실습한다면 1일 실습시간(7시간, 합의 시 최대 8시간)과 휴게시간을 넘지 않는지 확인해야 합니다. 협약 시간을 넘긴 실습은 형사처벌 대상입니다(p.80~82).');
    return lines.length?{lead:'',lines:lines}:null;
  }

  function compute(q){
    var o=nums(q), out=[];
    if(/순회/.test(q)){ var v=visits(o); if(v) out.push(v); }
    if(/수당|시급|급여|월급/.test(q) && !/지원금/.test(q)){ var p=pay(o); if(p) out.push(p); }
    if(/입문|의무교육|실무교육|ojt|오리엔테이션/i.test(q)){ var i=intro(o); if(i) out.push(i); }
    if(/지원금/.test(q)){ var s=support(o); if(s) out.push(s); }
    var pr=period(o); if(pr) out.push(pr);
    return out;
  }

  return {search:search, compute:compute};
})(); };
