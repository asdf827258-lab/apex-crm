/* ══════════════════════════════════════════════════════════════════
   check-skin2.js — <b>목각 옷 물결 1.</b> 매일 여는 화면부터 입힙니다.

   2026-10-01. 화면 98개 중 옷을 입은 것이 <b>다섯</b>이었습니다
   (home · clients · news_live · mycal · me). X02 는 대장에서 유일하게
   「안됨」 인 줄입니다. 93개를 물결 다섯으로 쪼개, 여기는 <b>물결 1</b> —
   <b>매일 여는 것</b>부터입니다.

   ★★ <b>이 자가 있는 진짜 까닭 — 「넣었는데 아무 일이 안 나는 화면」</b>
     T_SKIN 에 이름을 적으면 check-skinmap 의 「안입음」 수가 줄어듭니다.
     그런데 <b>열한 화면은 적어도 화면이 안 바뀝니다.</b>
       finance · crm · apexmap · frmake · onecmp · mikki · car_fault ·
       mikki_talk · sangdam · pdel · bohum
     이들은 go() 에서 <b>제 전용 화면으로 빠져나가고</b>, 그때
     <b>body.○○-mode .app{display:none}</b> 이 걸립니다. 옷은 #dynPane 에
     붙는데 #dynPane 은 .app <b>안에</b> 있어 <b>안 보이는 것에</b> 붙습니다.
     게다가 여럿은 <b>iframe</b> 이라 CSS 가 넘어가지도 않습니다.
     → 적으면 <b>수만 줄고 화면은 그대로</b>입니다. 「됐다」 고 적히는데
       안 된 자리 — CLAUDE.md 0-1번이 말하는 바로 그 구멍입니다.
     이 자는 그 열하나를 <b>코드에서 직접 찾아</b> T_SKIN 에 안 들었는지
     봅니다. 손으로 적어 두면 화면이 늘 때 낡습니다.

   ── 보는 것 ───────────────────────────────────────────────────────
     [1] 물결 1 의 다섯이 <b>정말 옷을 입나</b> — 표가 아니라 go() 뒤의
         <b>화면</b>을 봅니다 (표에 적고 안 입는 일이 실제로 있습니다)
     [2] ★★ <b>전체화면으로 빠져나가는 화면이 T_SKIN 에 없나</b> (위 까닭)
     [3] 1440·390 두 크기에서 — 옆으로 안 새나 · 조용히 터진 곳 0 ·
         13px 아래 글자가 <b>안 늘었나</b>
     [4] 누르는 것 44px 미만 ≤ 기준선. ★ <b>제가 만든 것이 아닙니다</b> —
         옷을 입히기 전부터 있던 수라 <b>줄이라고만</b> 적어 둡니다 (8번)
     [5] 못 입힌 화면의 <b>수와 까닭이 적혀 있나</b> — 0 이라고 우기지 않기
   ══════════════════════════════════════════════════════════════════ */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9081;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});

/* 물결 1 — 사람이 읽을 이름을 같이 둡니다 */
const 물결1 = [['airep','TFA 업무관리'], ['assistant','오늘의 AI 비서'],
               ['voiceasst','음성 비서'], ['brain','윤시현의 두뇌'],
               ['growboard','성장판']];
/* ⚠ 2026-10-01 기준선 — <b>줄이라고만 있는 수</b>입니다 (0-1번).
   ★ <b>옷을 입힌 채와 벗긴 채를 각각 세어 견줬습니다</b> — 두 수가 같습니다.
     1440 — airep 3 · assistant 0 · voiceasst 12 · brain 37 · growboard 1 = <b>53</b>
      390 — airep 0 · assistant 0 · voiceasst  3 · brain  8 · growboard 0 = <b>11</b>
     옷을 벗겨도 <b>53 / 11</b> 로 같습니다. 즉 <b>옷이 만든 것이 하나도
     없습니다</b> — 입력칸(33~36px)과 슬라이더(16px)가 대부분입니다.
   ⚠ 처음에 20 이라고 적었다가 빨간불이 났습니다. 목록을 <b>여덟 개까지만</b>
     찍어 보고 어림한 수였습니다. <b>어림한 수를 기준선으로 적지 마십시오</b> —
     자가 울려서 알았지, 안 울렸으면 거짓 기준선이 남았을 것입니다.        */
const BASE = { '1440': 53, '390': 11 };
/* ★ 물결 1 에서 <b>못 입힌 셋</b> — 수와 까닭을 적습니다 (1번) */
const 못입힘 = [
  ['crm',       'DB 통합 CRM',   '전체화면 + iframe — 옷이 안 보이는 것에 붙습니다'],
  ['mikki',     '미끼 레이더',    '전체화면 + iframe — 같은 까닭'],
  ['fact_find', '상담카드·팩트파인딩', '사장님이 빼라고 하신 자리 (check-cusskin 면제)'],
];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.osCliInfoLoad=function(){};
  window.osRepListLoad=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;}; window.toast=function(){};
  const chain = v => { const o = { then:function(f){ try{ f(v); }catch(e){} return o; }, catch:function(){ return o; } };
    ['eq','neq','select','order','limit','in','gte','lte','is','not','or','filter',
     'ilike','like','range','contains','overlaps'].forEach(k => { o[k]=function(){ return o; }; });
    o.single=function(){ return chain({data:null}); }; o.maybeSingle=function(){ return chain({data:null}); }; return o; };
  window.osClient=function(){ return { from:function(){ return {
      select:function(){ return chain({data:[]}); }, update:function(){ return chain({}); },
      insert:function(){ return chain({}); }, upsert:function(){ return chain({}); },
      delete:function(){ return chain({}); } }; } }; };
  OS.profile={id:'me',user_id:'me',name:'홍길동',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  try{ if(window.CM)CM.loaded=true; }catch(e){}
  try{ if(window.OSC){OSC.loaded=true;OSC.busy=false;OSC.err='';OSC.list=[];} }catch(e){}
  try{ if(window.AR){AR.loaded=true;AR.busy='';AR.cliRows=[];AR.db=[];} }catch(e){}
};

/* 한 화면을 재는 자 — <b>눈에 보이는 것만</b> 봅니다 */
const LOOK = () => {
  const host = document.getElementById('dynPane');
  if (!host) return { err: 'dynPane 이 없습니다' };
  const vis = el => { const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    const st = getComputedStyle(el);
    return st.display !== 'none' && st.visibility !== 'hidden' && +st.opacity > 0.05; };
  let 작은글자 = 0, 작은단추 = 0, 글자 = 0;
  [].slice.call(host.querySelectorAll('*')).forEach(el => {
    if (!vis(el)) return;
    const st = getComputedStyle(el);
    if ([].slice.call(el.childNodes).some(n => n.nodeType === 3 && n.textContent.trim())) {
      글자++; if (parseFloat(st.fontSize) < 13) 작은글자++; }
    if (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'SELECT' ||
        el.tagName === 'INPUT' || el.hasAttribute('onclick')) {
      const r = el.getBoundingClientRect(); if (r.height > 0 && r.height < 44) 작은단추++; }
  });
  return {
    옷: host.classList.contains('t-skin'),
    /* 옷이 정말 <b>먹었나</b> — 표에 적기만 하고 안 먹는 일이 있습니다.
       .t-skin 은 잉크 표(--ink-1)를 목각 잉크로 갈아끼웁니다.            */
    잉크: getComputedStyle(host).getPropertyValue('--ink-1').trim(),
    가림막: /로그인 \/ 계정/.test(host.innerText || ''),
    빔: (host.innerText || '').trim().length < 20,
    높이: host.scrollHeight,
    삐짐: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    글자: 글자, 작은글자: 작은글자, 작은단추: 작은단추,
  };
};

(async () => {
  const src = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');

  console.log('\n[1] 물결 1 의 다섯이 <b>T_SKIN 에 있나</b>');
  const m = src.match(/var\s+T_SKIN\s*=\s*\{([\s\S]*?)\}/);
  if (!m) { is(false, '  T_SKIN 을 못 찾았습니다'); console.log('\n✗ 1개'); process.exit(1); }
  const skin = m[1].split(',').map(s => s.split(':')[0].trim().replace(/['"]/g, '')).filter(Boolean);
  물결1.forEach(([id, nm]) => is(skin.indexOf(id) >= 0, '  ' + id.padEnd(11) + ' ' + nm));

  /* ── [2] 여기가 이 자의 핵심입니다 ─────────────────────────────── */
  console.log('\n[2] ★★ <b>전체화면으로 빠져나가는 화면</b>이 T_SKIN 에 <b>없나</b>');
  console.log('    (적으면 수만 줄고 화면은 그대로 — 「됐다」 고 거짓이 적힙니다)');
  /* 손으로 적지 않고 <b>코드에서 찾습니다</b> — 화면이 늘어도 안 낡습니다.
     go() 안에서 if(tab==='X'){ … osFullMode('무엇') … return; } 인 것.   */
  const go = src.slice(src.indexOf('function go(tab){'));
  const 전체화면 = [];
  /* ⚠ <b>정규식으로 블록을 뜨지 마십시오.</b> 처음에 [\s\S]{0,420}? 로 떴다가
     안쪽 if(window.innerWidth<=880){…} 의 <b>닫는 괄호에서 끊겨</b> 열한 개
     중 <b>0개</b>를 찾았습니다. 그물이 비면 [2] 는 <b>언제나 초록</b>입니다 —
     안 잡는 자였습니다. <b>중괄호를 세서</b> 블록을 통째로 뜹니다.        */
  const re = /if\s*\(\s*tab\s*===\s*'([a-z_0-9]+)'\s*\)\s*\{/g;
  let g;
  while ((g = re.exec(go))) {
    let i = g.index + g[0].length - 1, d = 0, end = -1;
    for (let k = i; k < go.length && k < i + 4000; k++) {
      if (go[k] === '{') d++;
      else if (go[k] === '}') { d--; if (!d) { end = k; break; } }
    }
    if (end < 0) continue;
    const body = go.slice(i, end);
    const mo = body.match(/osFullMode\(\s*'([a-z-]+)'\s*\)/);
    if (mo && mo[1] && /\breturn\s*;/.test(body))
      if (!전체화면.some(x => x[0] === g[1])) 전체화면.push([g[1], mo[1]]);
  }
  /* openBa() 로 나가는 frmake 는 osFullMode('') 라 위 그물에 안 걸립니다 —
     <b>제 전용 화면(#baScreen)이 덮으므로</b> 똑같이 옷이 안 보입니다.    */
  if (/if\(tab==='frmake'\)\{\s*osFullMode\(''\);\s*openBa\(\);\s*return;/.test(go))
    전체화면.push(['frmake', '']);
  is(전체화면.length >= 11,
     '  전체화면으로 빠져나가는 화면을 <b>' + 전체화면.length + '개</b> 찾았다 (11개 이상이어야 그물이 성한 것)' +
     '\n      ' + 전체화면.map(x => x[0]).join(' · '));
  const 잘못 = 전체화면.filter(x => skin.indexOf(x[0]) >= 0).map(x => x[0]);
  is(잘못.length === 0,
     '  그중 T_SKIN 에 적힌 것이 <b>없다</b>' +
     (잘못.length ? ' ← ' + 잘못.join(' · ') + ' 는 적어도 화면이 안 바뀝니다 (수만 줄어듭니다)' : ''));
  /* ★ 정말 <b>안 보이는지</b>를 CSS 에서 확인합니다 — 위 판정의 <b>까닭</b>입니다.
     까닭이 사라지면(예: .app 을 안 숨기게 바뀌면) 위 두 줄은 헛것을 잡는
     자가 됩니다. 그때 울려야 합니다 (8번).
     ⚠ 처음에 탭마다 안 재고 <b>같은 정규식을 다섯 번</b> 돌렸습니다 —
       t 를 아예 안 쓰는 자였습니다. 게다가 [a-z]* 가 crm-<b>-</b>mode 의
       붙임표를 못 넘었습니다. <b>탭마다 제 모드 이름으로</b> 잽니다.      */
  const 안숨음 = 전체화면.filter(([t, mode]) => {
    if (!mode) return !/#baScreen\.on\s*\{[^}]*display\s*:\s*block/.test(src);   /* frmake */
    return !new RegExp('body\\.' + mode + '\\s+\\.app\\s*\\{[^}]*display\\s*:\\s*none').test(src);
  }).map(x => x[0]);
  is(안숨음.length === 0,
     '  그 <b>' + 전체화면.length + '개가 켜지면 .app 이 통째로 숨는다</b> — #dynPane 이 그 안에 있어 옷이 안 보인다' +
     (안숨음.length ? ' ← ' + 안숨음.join(' · ') + ' 는 안 숨습니다 (까닭이 사라졌습니다)' : ''));

  console.log('\n[5] 못 입힌 화면의 <b>수와 까닭</b>이 코드에 적혀 있나 (0 이라고 우기지 않기 · 1번)');
  못입힘.forEach(([id, nm, why]) => {
    is(src.indexOf(id) >= 0 && new RegExp(id).test(src.slice(src.indexOf('물결 1'), src.indexOf('var T_SKIN'))) ||
       new RegExp(id).test(src.slice(Math.max(0, src.indexOf('var T_SKIN') - 1800), src.indexOf('var T_SKIN'))),
       '  ' + id.padEnd(11) + ' ' + nm.padEnd(14) + ' — ' + why);
  });

  /* ── 화면을 실제로 열어 봅니다 ───────────────────────────────── */
  await new Promise(r => srv.listen(PORT, r));
  const br = await chromium.launch();
  for (const [W, H] of [[1440, 900], [390, 844]]) {
    console.log('\n[3][4] <b>' + W + 'px</b> 에서 열어 본다');
    const pg = await br.newPage({ viewport: { width: W, height: H } });
    const errs = []; pg.on('pageerror', e => errs.push('' + (e && e.message)));
    await pg.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
    await pg.waitForTimeout(2400);
    await pg.evaluate(SEED);
    await pg.waitForTimeout(1500);
    let 작은단추합 = 0;
    for (const [id, nm] of 물결1) {
      errs.length = 0;
      let R;
      try { await pg.evaluate(t => go(t), id); await pg.waitForTimeout(700);
            R = await pg.evaluate(LOOK); }
      catch (e) { is(false, '  ' + id + ' 를 여는 데 터졌습니다 — ' + String(e).slice(0, 90)); continue; }
      if (R.err) { is(false, '  ' + id + ' — ' + R.err); continue; }
      작은단추합 += R.작은단추;
      /* ★ 표가 아니라 <b>화면</b>을 봅니다 — 옷이 정말 먹었나 */
      is(R.옷 && /var\(--t-ink\)|#/.test(R.잉크),
         '  ' + id.padEnd(11) + ' 옷을 <b>정말 입었다</b> (--ink-1 = ' + (R.잉크 || '없음') + ')');
      /* 가림막·빈 화면을 재고 「괜찮다」 고 하면 <b>안 본 것</b>입니다 */
      is(!R.가림막 && !R.빔,
         '     제 내용이 떴다 (가림막·빈 화면이 아니다) — 글자 ' + R.글자 + '개 · 높이 ' + R.높이);
      is(R.삐짐 === 0 && R.작은글자 === 0 && errs.length === 0,
         '     옆으로 안 새고(' + R.삐짐 + ') · 13px 아래 글자 ' + R.작은글자 + '개 · 조용히 터진 곳 ' + errs.length + '건' +
         (errs.length ? ' ← ' + errs[0].slice(0, 80) : ''));
    }
    is(작은단추합 <= BASE[String(W)],
       '  [4] 누르는 것 44px 미만 <b>' + 작은단추합 + '개</b> ≤ 기준선 ' + BASE[String(W)] +
       ' — <b>옷을 입히기 전부터</b> 있던 수입니다(입력칸·슬라이더). 줄이라고만 적어 둡니다');
    if (작은단추합 < BASE[String(W)])
      console.log('      ↓ 줄었습니다 — BASE.' + W + ' 를 ' + 작은단추합 + ' 로 내리십시오');
    await pg.close();
  }
  await br.close(); srv.close();

  console.log('\n' + '─'.repeat(30));
  console.log(bad ? '✗ ' + bad + '개'
                  : '✓ 물결 1 다섯이 옷을 입었고, <b>입혀도 소용없는 열하나</b>는 안 적혔습니다.');
  process.exit(bad ? 1 : 0);
})();
