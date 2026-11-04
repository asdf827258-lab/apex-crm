/* 🛰 <b>자비스 HUD · 목소리 · 「모든 내용을 이어서」</b> (판 X333)

   사장님 말씀 2026-11-04 —
   「자비스를 완전 대폭 업그레이드 해줘, 마치 아이언맨 나오는 자비스처럼 화면을 만들고
    목소리를 개조해. 그리고, 어떤 질문을 하든, 메인세션에 있는 모든 내용을 연결해서 찾아줘」
   고르신 것 — 바탕은 「자비스만 검은 HUD」 · 목소리는 「AI 남자 목소리」.

   ── 여기서 지키는 것 ──────────────────────────────────────────
     [1] HUD 가 선다 — 원자로 · 이름 · 상태 · 이어 둔 곳의 수. 상태(data-st)를 칠하는 곳은
         <b>hudSet 하나</b>다 (5번). 물으면 「찾는 중」 이 되었다가 답이 서면 돌아온다
     [2] 고객 수 · 보험 자료 수는 <b>읽은 뒤에만</b> — 안 읽었으면 「아직 안 읽음」 (0 이 아니다 · 1번)
     [3] ★★ AI 목소리로 <b>고객 실명 · 전화번호를 안 보낸다</b> (3번) — 그런 말 · 앱에 시켜
         읽어 온 값이 든 답은 서버를 안 부른다. 보낸 글에도 실명 0
     [4] ★ 서버를 아낀다 (7번) — 같은 말은 다시 안 받는다 · 220자까지만 보낸다 ·
         한도(429)에 막히면 그 창에서는 더 안 부르고 <b>기기 목소리로</b> 돌아간다
     [5] 모델 이름이 「없다」(404 not found) 면 <b>다음 모델</b>로 — 막힘과 없음은 다르다
     [6] 받은 소리(PCM)를 <b>울림 사슬</b>로 낸다 · 기기 목소리는 남자 목소리를 먼저 고른다
     [7] 📢 공지 — 본체가 받아 둔 공지(OS_NTC)를 찾는다 · 「공지」 를 물었을 때만 ·
         안 받았으면 「안 읽음」 · 다른 물음(스물네 가지)에 끼지 않는다 (8번)
     [8] 🔭 찾아본 곳 — 갈래 수가 JV_FIND 와 같다 · 갈래 이름은 <b>펼칠 때</b>만 채운다
     [9] 콘솔 오류 0 · 바깥 주소 0
   ★ 이름은 「홍길동」 (3번).                                                     */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = process.cwd(), PORT = 9083;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sec = (t) => console.log('\n' + t);
const MT = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8',
             '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
const srv = http.createServer((q, s) => {
  let p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  try { if (fs.statSync(p).isDirectory()) p = path.join(p, 'index.html'); } catch (e) {}
  fs.readFile(p, (e, d) => { if (e) { s.writeHead(404); s.end(''); return; }
    s.writeHead(200, { 'Content-Type': MT[path.extname(p)] || 'application/octet-stream' }); s.end(d); });
});
const SRC = fs.readFileSync(path.join(ROOT, 'app/apex-map.html'), 'utf8');

/* check-jvfind 의 「어디서 · 어떻게」 물음과 같은 결 — 여기서 공지가 끼면 헛것입니다 */
const HOWTO = ['고객 등록은 어디서 해?', '청구 서류 어떻게 받아?', '보장분석 어떻게 해?', '증권 PDF 를 받았어',
  '고객이 보험을 정리하고 싶대', '아침에 뭐부터 해?', '연금 상담 하려면?', '팀원 실적은 어디서 봐?',
  '보험료 비교해달래', '폰에 앱 설치 어떻게 해', '실비 계산 어떻게 해', '교통사고 났대', '법인 대표 상담',
  'DB 배정 받은 거 어디서 봐', '약속 잡힌 고객 일정 넣기', '신상품 나왔는데 뭐 권하지', '질병코드 찾기',
  '재무설계 계산기 어떻게 써?', '인스타 올릴 거 만들기', '거절한 고객 다시 연락하고 싶어', '화면이 이상해',
  '상속 증여 상담', '오늘 챙길 고객 누구야', '교육 일정 알려줘'];

const SEED = () => {
  try { localStorage.setItem('apex_login_ok','1'); } catch(e){}
  window.osLoadProfile=function(){}; window.osProfileApply=function(){};
  window.osShowLoginGate=function(){}; window.arLoad=function(){};
  window.osLoadClients=function(){}; window.cmLoadAll=function(cb){ if(cb)cb(); };
  window.toast=function(){};
  window.setupDone=function(){return true;}; window.setupCanRun=function(){return true;};
  window.osTabAllowed=function(){return true;};
  OS.profile={id:'me',user_id:'me',name:'윤설계',role:'fp',team:'A',active:true};
  OS.session={user:{id:'me'}};
  OSC.loaded=true; OSC.busy=false; OSC.err='';
  CM.loaded=true; AR.loaded=true; AR.busy=''; AR.cliRows=[]; AR.db=[];
  OSC.list=[{id:'c0',name_masked:'홍○○',advisor_id:'me',stage:'AP',created_at:'2026-08-01',phone:'010-1234-5678'}];
  try{ cmRealSet('c0','홍길동'); }catch(e){}
  OS_NTC.loaded=true;
  OS_NTC.list=[{id:'n1',text:'11월 교육 안내\n화요일 오전 10시 본사 3층에서 신상품 교육이 있습니다.',on:true,ts:'2026-11-03T01:00:00Z',by:'지점장',mustAck:true},
               {id:'n2',text:'주차 안내\n지하 2층은 공사 중입니다.',on:true,ts:'2026-11-01T01:00:00Z',by:'총무'},
               {id:'n3',text:'내린 공지',on:false,ts:'2026-11-04T01:00:00Z',by:'총무'}];
  try{ osHideLoginGate(); }catch(e){}
  try{ renderNav(); }catch(e){}
  go('home');
};

/* 가짜 소리 — 0.1초짜리 16비트 PCM. 구글이 돌려주는 꼴 그대로입니다 */
const PCM_B64 = Buffer.alloc(4800).toString('base64');
const TTS_OK = JSON.stringify({ candidates: [{ content: { parts: [{ inlineData: { mimeType: 'audio/L16;codec=pcm;rate=24000', data: PCM_B64 } }] } }] });

(async () => {
  console.log('자비스 HUD · 목소리 · 모든 내용을 이어서 (판 X333)');
  await new Promise(r => srv.listen(PORT, r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const outside = [], TTS = [];
  let ttsMode = 'ok';
  await ctx.route('**://**', rt => { const u = rt.request().url();
    if (u.indexOf('127.0.0.1:' + PORT + '/api/gemini') >= 0) {
      let body = {}; try { body = JSON.parse(rt.request().postData() || '{}'); } catch (e) {}
      /* 목소리 부름만 셉니다 — AI 의견을 묻는 부름(글)은 check-jvfind 가 봅니다 */
      const audio = !!(body.generationConfig && (body.generationConfig.responseModalities || []).indexOf('AUDIO') >= 0);
      if (!audio) return rt.fulfill({ status: 200, contentType: 'application/json',
        body: JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"answer":"","steps":[],"next":[]}' }] } }] }) });
      TTS.push(body);
      if (ttsMode === '404' && body.model === 'gemini-2.5-flash-preview-tts')
        return rt.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: { message: 'models/gemini-2.5-flash-preview-tts is not found for API version v1beta' } }) });
      if (ttsMode === '429') return rt.fulfill({ status: 429, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Resource has been exhausted' } }) });
      return rt.fulfill({ status: 200, contentType: 'application/json', body: TTS_OK });
    }
    if (u.indexOf('127.0.0.1:' + PORT) >= 0) return rt.continue();
    outside.push(u);
    return rt.fulfill({ status: 200, contentType: 'application/javascript', body: '' }); });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push('' + (e && e.message)));
  await p.goto('http://127.0.0.1:' + PORT + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(2400);
  await p.evaluate(SEED);
  await p.waitForTimeout(800);
  await p.evaluate(() => go('apexmap'));
  await p.waitForTimeout(2200);
  const f = p.frame({ url: /apex-map\.html/ });
  is(!!f, '자비스 모드가 <b>앱 안에서</b> 열린다');
  if (!f) { await b.close(); srv.close(); process.exit(1); }
  await f.evaluate(() => { ['gproxy','proxy','apikey','gkey'].forEach(k => LS.del(k)); modeLabel(); });
  outside.length = 0;

  sec('[1] HUD 가 선다 · 상태를 칠하는 곳은 하나');
  const H = await f.evaluate(() => ({
    hud: !!document.getElementById('hud'), svg: !!document.querySelector('#hud svg .core'),
    name: (document.querySelector('.hud-name') || {}).textContent || '', st: document.getElementById('hud').getAttribute('data-st'),
    stat: document.getElementById('hudStat').innerText.replace(/\s+/g, ' '),
    bg: getComputedStyle(document.body).backgroundColor }));
  is(H.hud && H.svg && /J\.A\.R\.V\.I\.S/.test(H.name), 'HUD — 원자로(SVG 직접 그림) · 이름 「' + H.name + '」');
  is(/\(\s*[0-9]\s*,\s*[0-9]{1,2}\s*,\s*[0-9]{1,2}/.test(H.bg) || /rgb\(3, 11, 22\)/.test(H.bg), '바탕이 <b>검은 HUD</b> — ' + H.bg + ' (사장님이 고르신 것)');
  const nSet = (SRC.match(/setAttribute\('data-st'/g) || []).length;
  is(nSet === 1 && /function hudSet\(st\)\{[^}]*setAttribute\('data-st'/.test(SRC), '상태(data-st)를 칠하는 곳 <b>' + nSet + '</b> — hudSet 하나 (5번)');
  const S1 = await f.evaluate(() => { ask('보장분석 어떻게 해?'); return document.getElementById('hud').getAttribute('data-st'); });
  await p.waitForTimeout(1300);
  const S2 = await f.evaluate(() => document.getElementById('hud').getAttribute('data-st'));
  is(S1 === 'think' && S2 === 'idle', '물으면 「찾는 중」(' + S1 + ') → 답이 서면 「대기」(' + S2 + ')');
  is(/화면 \d+/.test(H.stat) && /자료 갈래 \d+/.test(H.stat), '이어 둔 곳의 수 — ' + H.stat);

  sec('[2] 안 읽은 것은 「아직 안 읽음」 (1번)');
  const U = await f.evaluate(() => { var P = kbApp(), o = P.OSC.loaded, d = P.DZ_DATA;
    P.OSC.loaded = false; P.DZ_DATA = null; hudStats(); var t = document.getElementById('hudStat').innerText;
    P.OSC.loaded = o; P.DZ_DATA = d; hudStats(); return {off:t, on:document.getElementById('hudStat').innerText}; });
  is(/고객 아직 안 읽음/.test(U.off) && /보험 자료 아직 안 읽음/.test(U.off) && !/고객 0/.test(U.off), '안 읽었을 때 — 「고객 아직 안 읽음 · 보험 자료 아직 안 읽음」 (0 이 아닙니다)');
  is(/고객 1명/.test(U.on), '읽은 뒤에는 센 수 — 「고객 1명」');

  sec('[3] ★★ AI 목소리로 고객 실명 · 번호를 안 보낸다 (3번)');
  /* 누르기 전에는 AI 목소리를 안 부른다 — 열 때마다 서는 인사말이 서버를 부르면 안 됩니다 (7번) */
  TTS.length = 0;
  await f.evaluate(() => { LS.set('gproxy', '/api/gemini'); JV_VOX.pick = 'ai:Charon'; JV_VOX.dead = ''; JV_VOX.model = ''; JV_VOX.cache = {}; JV_VOX.keys = [];
    TTS.on = true; JV_VOX.armed = false; speak(jvHello().answer); });
  await p.waitForTimeout(500);
  is(TTS.length === 0, '누르시기 전(창을 막 연 인사말) — AI 목소리 부름 <b>' + TTS.length + '</b>');
  await p.mouse.click(200, 300);
  const ARM = await f.evaluate(() => JV_VOX.armed);
  is(ARM, '한 번 누르시면 그때부터 AI 목소리를 씁니다');
  await f.evaluate(() => { JV_VOX.armed = true; voxCtx(); });
  TTS.length = 0;
  await f.evaluate(() => { speak('홍길동님 다음 할 일은 증권 전달입니다.'); speak('연락처는 010-1234-5678 입니다.'); speak('보장 점검 하시면 됩니다.', {priv:1}); });
  await p.waitForTimeout(600);
  is(TTS.length === 0, '실명 · 전화번호 · 일꾼 값이 든 말 — 서버 부름 <b>' + TTS.length + '</b> (기기 목소리가 읽습니다)');
  const C = await f.evaluate(async () => { var c0 = JV_VOX.dead; ask('홍길동 연락처 알려줘'); await new Promise(r => setTimeout(r, 400)); return c0; });
  is(TTS.length === 0, '「홍길동 연락처」 답을 읽을 때도 서버 부름 <b>' + TTS.length + '</b>');

  sec('[4] ★ 서버를 아낀다 (7번)');
  TTS.length = 0;
  const LONG = '보장분석은 증권을 넣고 담보를 견주는 일입니다. ' + '그다음에는 빠진 담보를 짚고 고객께 보여 드리면 됩니다. '.repeat(8);
  await f.evaluate((t) => speak(t), LONG);
  await p.waitForTimeout(900);
  const sent = TTS[0] ? (TTS[0].contents[0].parts[0].text || '') : '';
  is(TTS.length === 1 && TTS[0].model === 'gemini-2.5-flash-preview-tts' &&
     TTS[0].generationConfig.responseModalities[0] === 'AUDIO' &&
     TTS[0].generationConfig.speechConfig.voiceConfig.prebuiltVoiceConfig.voiceName === 'Charon',
     '처음 한 번 — 회사 통로로 AI 목소리(' + (TTS[0] ? TTS[0].model + ' · Charon' : '없음') + ')');
  const body = sent.replace(/^[^:]*:\s*/, '');
  is(body.length <= 220 && body.length >= 30, '보낸 글 <b>' + body.length + '</b>자 — 머리 한두 문장만(220자까지 · 원래 ' + LONG.length + '자)');
  await f.evaluate((t) => speak(t), LONG);
  await p.waitForTimeout(500);
  is(TTS.length === 1, '같은 말을 다시 읽어도 서버 부름 그대로 <b>' + TTS.length + '</b> — 받아 둔 소리를 씁니다');
  const PL = await f.evaluate(() => ({ via: JV_VOX.via, an: !!JV_VOX.an || HUD.st === 'talk' || JV_VOX.via === 'ai' }));
  is(PL.via === 'ai', '받은 소리를 냈다 — ' + PL.via);
  ttsMode = '429'; TTS.length = 0;
  await f.evaluate(() => speak('한도 시험 첫 마디입니다.'));
  await p.waitForTimeout(700);
  await f.evaluate(() => speak('한도 시험 둘째 마디입니다.'));
  await p.waitForTimeout(500);
  const D = await f.evaluate(() => ({ dead: JV_VOX.dead, st: document.getElementById('hudStat').innerText }));
  is(TTS.length === 1 && /429/.test(D.dead), '한도(429)에 막히면 그 창에서는 더 안 부른다 — 부름 <b>' + TTS.length + '</b> · 까닭 「' + D.dead + '」');
  is(/목소리 기기\(AI 막힘\)/.test(D.st), 'HUD 에 「목소리 기기(AI 막힘)」 — 막힌 것을 숨기지 않습니다');

  sec('[5] 모델이 「없다」 면 다음 모델로 — 막힘과 없음은 다르다');
  ttsMode = '404'; TTS.length = 0;
  await f.evaluate(() => { JV_VOX.dead = ''; JV_VOX.model = ''; JV_VOX.cache = {}; JV_VOX.keys = []; speak('모델 시험입니다.'); });
  await p.waitForTimeout(900);
  const M = await f.evaluate(() => ({ model: JV_VOX.model, dead: JV_VOX.dead }));
  is(TTS.length === 2 && TTS[1].model === 'gemini-2.5-flash-tts' && M.model === 'gemini-2.5-flash-tts' && !M.dead,
     '404 not found → 다음 모델 「' + M.model + '」 · 부름 ' + TTS.length);
  ttsMode = 'ok';

  sec('[6] 울림 사슬 · 기기 목소리는 남자 먼저');
  is(/createConvolver\(\)/.test(SRC) && /createDelay\(/.test(SRC) && /createDynamicsCompressor\(\)/.test(SRC) && /createAnalyser\(\)/.test(SRC),
     '울림 — 메아리(Delay) · 잔향(Convolver) · 압축 · 파형(Analyser)');
  const V = await f.evaluate(() => VOICE_PREF.indexOf('InJoon') < VOICE_PREF.indexOf('Google 한국의'));
  is(V, '기기 목소리 차례 — 남자 목소리(InJoon 등)가 여자 목소리보다 앞');
  const O = await f.evaluate(() => { document.getElementById('aiBtn').click(); var s = document.getElementById('kVox');
    var r = {n:s.options.length, v:s.value, say:document.getElementById('kVoxSay').textContent}; document.getElementById('kCancel').click(); return r; });
  is(O.n === 4 && O.v === 'ai:Charon' && O.say.length > 10, '「AI 연결」 창에 목소리 고르개 ' + O.n + '가지 · 지금 「' + O.v + '」');

  sec('[7] 📢 공지 — 받아 둔 것에서 · 물었을 때만');
  const N1 = await f.evaluate(() => { var F = jvFind('공지 뭐 있어'); var n = F.filter(x => x.k === 'ntc')[0]; return n ? {rows:(n.rows || []).map(r => r.t + ' | ' + (r.s || []).join(' | '))} : null; });
  is(N1 && N1.rows.length === 2 && /11월 교육 안내/.test(N1.rows[0]) && !N1.rows.some(r => /내린 공지/.test(r)),
     '「공지 뭐 있어」 → 걸린 공지 ' + (N1 ? N1.rows.length : 0) + '건 · 새것 먼저 · 내린 공지 0');
  is(N1 && /확인 요청/.test(N1.rows[0]) && /2026-11-03/.test(N1.rows[0]), '확인 요청 · 올린 날까지');
  const N2 = await f.evaluate(() => { var n = jvFind('주차 공지').filter(x => x.k === 'ntc')[0]; return n ? (n.rows || []).length : -1; });
  is(N2 === 1, '「주차 공지」 → 주차 공지 하나만 (' + N2 + ')');
  const N3 = await f.evaluate((L) => L.filter(q => jvFind(q).some(x => x.k === 'ntc')), HOWTO);
  is(N3.length === 0, '다른 물음 ' + HOWTO.length + '가지에 공지가 끼지 않는다' + (N3.length ? ' ← ' + N3.join(' · ') : ''));
  const N4 = await f.evaluate(() => { var P = kbApp(); P.OS_NTC.loaded = false; var n = jvFind('공지 뭐 있어').filter(x => x.k === 'ntc')[0]; P.OS_NTC.loaded = true; return n ? n.wait || '' : 'none'; });
  is(N4 === '공지사항', '공지를 아직 안 받았으면 「안 읽음」 — 「없다」 고 하지 않습니다');
  const N5 = await f.evaluate(async () => { ask('공지 뭐 있어'); await new Promise(r => setTimeout(r, 300));
    var c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(); return c ? c.innerText : ''; });
  is(/11월 교육 안내/.test(N5), '물으면 카드에 공지가 선다');

  sec('[8] 🔭 찾아본 곳');
  const SC = await f.evaluate(async () => {
    ask('뇌졸중 화법'); await new Promise(r => setTimeout(r, 300));
    var c = [].slice.call(document.querySelectorAll('#jLog .msg.j')).pop(), d = c.querySelector('.j-scan');
    var names = {}; JV_FIND.forEach(f => names[f.n] = 1);
    var before = c.textContent, sum = d ? d.querySelector('summary').innerText : '';
    if (d) d.open = true; await new Promise(r => setTimeout(r, 120));
    return { sum, n:Object.keys(names).length, before:/고객 명단/.test(before), after:d ? d.querySelectorAll('.js-list span').length : 0,
             hit:d ? d.querySelectorAll('.js-list span.hit').length : 0 };
  });
  is(new RegExp('찾아본 곳 ' + SC.n + '갈래').test(SC.sum), '머리 — 「' + SC.sum + '」 · 갈래 수가 JV_FIND 와 같다(' + SC.n + ')');
  is(!SC.before && SC.after === SC.n, '갈래 이름은 펼칠 때만 — 펴기 전 「고객 명단」 글 0 · 편 뒤 ' + SC.after + '갈래');

  sec('[9] 콘솔 오류 · 바깥 주소');
  is(errs.length === 0, '콘솔 오류 0' + (errs.length ? ' ← ' + errs.slice(0, 3).join(' · ') : ''));
  is(outside.length === 0, '바깥 주소 0' + (outside.length ? ' ← ' + outside.slice(0, 3).join(' · ') : ''));

  await b.close(); srv.close();
  console.log(bad ? '\n✗ ' + bad + '개' : '\n✓ 모두 통과');
  process.exit(bad ? 1 : 0);
})();
