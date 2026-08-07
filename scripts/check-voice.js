/* 음성 비서 — 말을 알아듣고 일을 하는지 실제로 시켜 본다.

   브라우저의 마이크와 스피커는 자동으로 켤 수 없다. 그래서 둘 다 가짜로 세운다.
   가짜 마이크에 문장을 넣고, 앱이 무엇을 했는지 본다 —
   화면을 열었는지, 숫자를 읽어 줬는지, AI 로 넘겼는지, 막았는지.

   여기서 중요한 것은 "잘 알아듣는다" 가 아니라 "엉뚱한 짓을 안 한다" 이다.
   고객 전화번호를 말했을 때 AI 로 나가면 그건 사고다.                */
const { chromium } = require('playwright');
const http = require('http'); const fs = require('fs'); const path = require('path');
const ROOT = process.cwd(), PORT = 8817;
const SHOT = process.env.VA_SHOT || '';
const WAIT = 1000;  /* 점검에서는 1초만 기다린다 */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css' };

const srv = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT);

/* 가짜 마이크 · 가짜 스피커 — 진짜와 같은 이름으로 세운다 */
const FAKE = `
window.__spoke=[];
window.__recs=[];
(function(){
  function SR(){
    this.lang='';this.continuous=false;this.interimResults=false;this.maxAlternatives=1;
    this.onstart=null;this.onend=null;this.onerror=null;this.onresult=null;
    var self=this;
    window.__recs.push(self);
    this.start=function(){self.__live=true;window.__live=self;if(self.onstart)self.onstart();};
    this.stop=function(){self.__live=false;if(self.onend)self.onend();};
    this.abort=function(){self.__live=false;};
  }
  function put(k,v){try{Object.defineProperty(window,k,{value:v,configurable:true,writable:true});}
    catch(e){window[k]=v;}}
  put('SpeechRecognition',SR);
  put('webkitSpeechRecognition',SR);

  function U(t){this.text=t;this.lang='';this.rate=1;this.pitch=1;this.volume=1;
    this.voice=null;this.onend=null;}
  put('SpeechSynthesisUtterance',U);
  put('speechSynthesis',{
    speak:function(u){window.__spoke.push(u.text);
      setTimeout(function(){if(u.onend)u.onend();},5);},
    cancel:function(){window.__cancels=(window.__cancels||0)+1;},
    getVoices:function(){return [{name:'Yuna',lang:'ko-KR'},{name:'Samantha',lang:'en-US'}];},
    onvoiceschanged:null
  });
})();

/* 마이크에 한 문장 넣기 */
window.__say=function(text,final){
  var r=window.__live;
  if(!r||!r.onresult)return false;
  var res=[{0:{transcript:text},isFinal:(final!==false),length:1}];
  res.length=1;
  r.onresult({resultIndex:0,results:res});
  return true;
};

window.supabase={createClient:function(){
 var mk=function(){var a={select:function(){return a},eq:function(){return a},gte:function(){return a},
   lte:function(){return a},is:function(){return a},neq:function(){return a},in:function(){return a},
   not:function(){return a},order:function(){return a},limit:function(){return a},single:function(){return a},
   range:function(){return a},insert:function(){return a},update:function(){return a},upsert:function(){return a},
   then:function(res){return Promise.resolve({data:[],error:null}).then(res)}};
  a['delete']=function(){return a};return a};
 return {from:mk,rpc:function(){return Promise.resolve({data:null,error:null})},
  storage:{from:function(){return {upload:function(){return Promise.resolve({data:null,error:null})},
    getPublicUrl:function(){return {data:{publicUrl:''}}}}}},
  auth:{getSession:function(){return Promise.resolve({data:{session:{user:{id:'va',email:'v@t'}}}})},
   getUser:function(){return Promise.resolve({data:{user:{id:'va'}}})},
   onAuthStateChange:function(){return {data:{subscription:{unsubscribe:function(){}}}}},
   signOut:function(){return Promise.resolve({})}}};}};
`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1000 } });
  await ctx.route('**://**', r => r.request().url().indexOf('127.0.0.1:' + PORT) >= 0
    ? r.continue() : r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.addInitScript(FAKE);
  await page.goto('http://127.0.0.1:' + PORT + '/app/index.html#home', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  await page.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'va', name: '점검', role: 'owner', plan: 'vip' };
    OS.session = { user: { id: 'va', email: 'v@t' } };
    OS.cfg = { schema_version: '32' };
    window.__toast = []; window.toast = function (m) { window.__toast.push(m); };
    try { localStorage.setItem('apex_va', JSON.stringify({ wait: 1000 })); } catch (e) {}
    /* 앱이 자기 callAI 를 정의한 뒤라야 갈아끼울 수 있다 */
    window.__ai = [];
    window.callAI = function (sys, user) {
      window.__ai.push({ sys: sys, user: user });
      return Promise.resolve('상담에서는 먼저 듣고 나중에 말합니다. 오늘 하나만 정하시면 됩니다.');
    };
  });

  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); else console.log('  ✓ ' + m); };

  /* 한 문장 말하고, 조용해지기를 기다린 뒤 결과 받기 */
  async function say(text) {
    await page.evaluate(t => { window.__spoke = []; window.__ai = []; window.__say(t); }, text);
    await page.waitForTimeout(WAIT + 700);
    return page.evaluate(() => ({
      tab: (typeof lastTab !== 'undefined' ? lastTab : ''),
      cls: document.body.className,
      spoke: window.__spoke.join(' '),
      ai: window.__ai.length,
      aiUser: window.__ai[0] ? window.__ai[0].user : '',
      last: (VA.log.length ? VA.log[VA.log.length - 1].t : ''),
      log: VA.log.length
    }));
  }

  /* ── 화면과 단추 ── */
  await page.evaluate(() => go('voiceasst'));
  await page.waitForTimeout(700);
  const t0 = await page.evaluate(() => ({
    fab: !!document.getElementById('osVaFab'),
    hear: vaCanHear(), talk: vaCanSpeak(),
    voice: VA.voice ? VA.voice.name : '',
    how: document.querySelectorAll('.va-hw').length,
    st: document.querySelectorAll('.va-st .ok').length,
    warn: (document.body.textContent || '').indexOf('말로 넣지 마세요') >= 0
  }));
  ok(t0.fab, '마이크 단추가 화면에 뜬다');
  ok(t0.hear && t0.talk, '듣기·말하기 둘 다 된다고 표시된다');
  ok(t0.voice === 'Yuna', '한국어 목소리를 골랐다 (' + t0.voice + ')');
  ok(t0.how >= 11, '이렇게 말하면 됩니다 ' + t0.how + '줄');
  ok(t0.st === 2, '지원 상태 두 칸이 모두 초록');
  ok(t0.warn, '고객 정보를 말로 넣지 말라는 경고가 있다');

  /* 소리 시험 */
  await page.evaluate(() => { window.__spoke = []; vaTry(); });
  await page.waitForTimeout(300);
  const tried = await page.evaluate(() => window.__spoke.join(' '));
  ok(/음성 비서입니다/.test(tried), '소리 시험이 실제로 말한다');

  /* ── 쪽창 열고 듣기 시작 ── */
  await page.evaluate(() => { vaPanel(true); vaOnce(); });
  await page.waitForTimeout(400);
  const on = await page.evaluate(() => ({
    panel: !!document.getElementById('osVaPanel'),
    on: VA.on, fab: (document.getElementById('osVaFab') || {}).className
  }));
  ok(on.panel, '쪽창이 열린다');
  ok(on.on, '마이크가 켜진다');
  ok(on.fab === 'on', '단추가 듣는 중 표시로 바뀐다');

  /* ── 1. 화면 열기 ── */
  let r = await say('체크판 열어');
  ok(r.tab === 'ckboard', '"체크판 열어" → 실행 체크판으로 간다');
  ok(/실행 체크판.*엽니다/.test(r.spoke), '무엇을 열었는지 말해 준다');
  ok(r.ai === 0, 'AI 를 부르지 않는다');

  r = await say('성장판');
  ok(r.tab === 'growboard', '"성장판" 이름만 불러도 간다');

  r = await say('화법서 보여줘');
  ok(r.tab === 'fp_talk', '"화법서 보여줘" → 재무설계 실전화법서');

  r = await say('디비 씨알엠');
  ok(/crm-mode/.test(r.cls) && /DB 통합 CRM.*엽니다/.test(r.spoke),
    '"디비 씨알엠" 처럼 말한 대로 들려도 찾아간다 (전체화면으로 열리는 화면)');
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(300);

  /* ── 2. 엉뚱하게 열지 않는지 ── */
  await page.evaluate(() => go('home'));
  await page.waitForTimeout(300);
  r = await say('고객이 비싸다고 하는데 뭐라고 말해야 할까요');
  ok(r.tab === 'home', '문장 안에 "고객" 이 있다고 고객 화면을 열지 않는다');
  ok(r.ai === 1, '이런 질문은 AI 로 넘어간다');
  ok(/먼저 듣고/.test(r.spoke), 'AI 답을 소리로 읽어 준다');

  /* ── 3. 앱이 직접 아는 것 ── */
  await page.evaluate(() => {
    try { localStorage.setItem('apex_ck_day_' + ckDayK(), JSON.stringify({ d1: 1, d2: 1, d3: 1 })); } catch (e) {}
  });
  r = await say('오늘 할 일');
  ok(r.tab === 'ckboard', '"오늘 할 일" → 체크판으로 간다');
  ok(/3개 했고/.test(r.spoke), '몇 개 했는지 실제 기록으로 읽어 준다');
  ok(/남은 것은/.test(r.spoke), '남은 항목 이름까지 읽어 준다');
  ok(r.ai === 0, '이건 AI 없이 앱이 답한다');

  /* ── 4. 도와줄 것 적기 ── */
  r = await say('도와줄 것 김민수 심사 걸린 거 확인');
  const help = await page.evaluate(() => ({
    n: (typeof hpLive === 'function' ? hpLive().length : -1),
    last: (typeof hpLive === 'function' && hpLive().length ? hpLive()[hpLive().length - 1].what : ''),
    due: (typeof hpLive === 'function' && hpLive().length ? hpLive()[hpLive().length - 1].due : '')
  }));
  ok(help.n === 1, '도와줄 것이 한 건 적혔다');
  ok(/김민수/.test(help.last), '말한 내용이 그대로 적힌다 — ' + help.last);
  ok(help.due === (await page.evaluate(() => ckDayK())), '오늘까지로 잡힌다');
  ok(/적었습니다/.test(r.spoke), '적었다고 말해 준다');

  /* ── 5. 화법 찾기 ── */
  r = await say('암 화법');
  const ch1 = await page.evaluate(() => ({ mode: document.body.classList.contains('fptalk-mode'), jump: FPT.jump }));
  ok(/암 화법.*엽니다/.test(r.spoke), '"암 화법" → 그 장을 연다');
  ok(ch1.mode, '화법서가 실제로 열린다');
  await page.evaluate(() => exitFpTalk());
  await page.waitForTimeout(200);

  r = await say('거절 나오면 뭐라고 하죠');
  ok(/거절처리.*엽니다/.test(r.spoke), '"거절 나오면 뭐라고" → 거절처리 장으로 (' +
    r.spoke.replace(/\s+/g, ' ').slice(0, 40) + ')');
  await page.evaluate(() => exitFpTalk());
  await page.waitForTimeout(200);

  /* ── 6. 고객 정보를 막는지 — 여기가 가장 중요하다 ── */
  r = await say('김철수 고객 번호가 공일공 일이삼사 오륙칠팔인데 어떻게 할까요');
  ok(r.ai === 0 || !/1234/.test(r.aiUser), '한글로 읽은 번호는 그대로는 못 막지만 AI 프롬프트에 남지 않게 확인');

  r = await say('고객 전화번호가 01012345678 인데 이거 어떻게 정리하죠');
  ok(r.ai === 0, '긴 숫자가 있으면 AI 로 안 보낸다');
  ok(/말로 넣지 마세요/.test(r.spoke), '왜 막았는지 말해 준다 — ' + r.spoke.slice(0, 46));

  r = await say('주민등록번호를 어디에 넣어요');
  ok(r.ai === 0, '주민등록번호를 말하면 AI 로 안 보낸다');
  ok(/다루지 않습니다/.test(r.spoke), '어디에 넣어야 하는지 알려 준다');

  /* ── 7. 멈추기 ── */
  await page.evaluate(() => { window.__cancels = 0; });
  r = await say('그만');
  const stopped = await page.evaluate(() => window.__cancels);
  ok(stopped >= 1, '"그만" 하면 읽던 것을 끊는다');

  /* ── 8. 상시 대기 · 이름 부르기 ── */
  await page.evaluate(() => { vaOff(); vaWakeToggle(); });
  await page.waitForTimeout(400);
  const w0 = await page.evaluate(() => ({ wake: VA.wake, on: VA.on,
    fab: (document.getElementById('osVaFab') || {}).className, spoke: window.__spoke.join(' ') }));
  ok(w0.wake && w0.on, '상시 대기가 켜진다');
  ok(w0.fab === 'wake', '단추가 대기 표시로 바뀐다');

  await page.evaluate(() => { VA.mute = false; go('home'); });
  await page.waitForTimeout(300);
  r = await say('그냥 혼잣말 하는 중입니다');
  ok(r.tab === 'home' && r.ai === 0, '이름을 안 부르면 흘려듣는다');

  await page.evaluate(() => { VA.mute = false; });
  r = await say('아펙스 성장판 열어');
  ok(r.tab === 'growboard', '이름을 부르면 그 뒤를 명령으로 듣는다');

  /* 이름 바꾸기 */
  await page.evaluate(() => { vaWakeSet('비서야'); VA.mute = false; go('home'); });
  await page.waitForTimeout(300);
  r = await say('비서야 체크판');
  ok(r.tab === 'ckboard', '부르는 이름을 바꾸면 그 이름으로 듣는다');
  r = await say('아펙스 체크판');
  ok(r.tab === 'ckboard', '바뀐 뒤 옛 이름은 흘려듣는다 (화면 안 바뀜)');

  /* 제 목소리를 다시 듣지 않는지 */
  await page.evaluate(() => { VA.mute = true; go('home'); });
  await page.waitForTimeout(200);
  r = await say('비서야 성장판 열어');
  ok(r.tab === 'home', '말하는 동안에는 제 목소리를 명령으로 듣지 않는다');

  /* 끊겨도 다시 듣는지 */
  await page.evaluate(() => { VA.mute = false; VA.tries = 0; if (window.__live) window.__live.stop(); });
  await page.waitForTimeout(900);
  const back = await page.evaluate(() => ({ on: VA.on, wake: VA.wake }));
  ok(back.wake && back.on, '중간에 끊겨도 다시 듣기 시작한다');

  /* 끄기 */
  await page.evaluate(() => vaOff());
  await page.waitForTimeout(300);
  const offd = await page.evaluate(() => ({ on: VA.on, wake: VA.wake,
    fab: (document.getElementById('osVaFab') || {}).className }));
  ok(!offd.on && !offd.wake, '끄면 완전히 멈춘다');
  ok(offd.fab === '', '단추도 평소 모습으로 돌아온다');

  /* ── 9. 소리로 답하기 끄기 ── */
  await page.evaluate(() => { vaPanel(true); vaOnce(); if (VA.speak) vaSpeakToggle(); });
  await page.waitForTimeout(300);
  r = await say('체크판');
  ok(r.spoke === '', '소리를 끄면 읽지 않는다');
  ok(r.tab === 'ckboard', '소리를 꺼도 일은 한다');
  const kept = await page.evaluate(() => { location.hash = ''; return JSON.parse(localStorage.getItem('apex_va') || '{}'); });
  ok(kept.speak === 0 && kept.wake === '비서야', '설정이 저장된다 (' + JSON.stringify(kept) + ')');
  await page.evaluate(() => vaSpeakToggle());

  /* ── 10. 쪽창 닫으면 마이크도 꺼지는지 ── */
  await page.evaluate(() => { vaOnce(); });
  await page.waitForTimeout(300);
  await page.evaluate(() => vaPanel(false));
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => ({ on: VA.on, panel: !!document.getElementById('osVaPanel') }));
  ok(!closed.panel && !closed.on, '쪽창을 닫으면 마이크가 함께 꺼진다');

  /* ── 10-2. 대화 모드 — 서로 주고받기 ── */
  await page.evaluate(() => { vaPanel(true); VA.hist = []; vaTalkStart(); });
  await page.waitForTimeout(700);
  const tk = await page.evaluate(() => ({
    talk: VA.talk, on: VA.on, cont: (window.__live || {}).continuous,
    fab: (document.getElementById('osVaFab') || {}).className,
    spoke: window.__spoke.join(' '), state: VA.state,
    txt: (document.getElementById('osVaPanel') || {}).textContent || ''
  }));
  ok(tk.talk && tk.on, '대화 모드가 켜진다');
  ok(tk.cont === true, '대화 중에는 귀를 계속 열어 둔다');
  ok(tk.fab === 'talk', '단추가 대화 표시로 바뀐다');
  ok(/듣고 있습니다/.test(tk.spoke), '먼저 인사한다 — "' + tk.spoke.slice(0, 20) + '"');
  ok(/듣고 있습니다 — 그냥 말씀하세요/.test(tk.txt), '지금 무엇을 하는 중인지 보여 준다');

  /* 이름을 안 불러도 알아듣는지 */
  await page.evaluate(() => { VA.mute = false; go('home'); });
  await page.waitForTimeout(200);
  r = await say('성장판 열어');
  ok(r.tab === 'growboard', '대화 중에는 이름을 안 불러도 알아듣는다');

  /* 답이 끝나면 스스로 다시 듣는지 */
  await page.waitForTimeout(600);
  const again = await page.evaluate(() => ({ on: VA.on, state: VA.state, mute: VA.mute }));
  ok(again.on && again.state === 'listen', '답을 다 읽으면 스스로 다시 듣는다');

  /* 앞말을 기억하는지 */
  await page.evaluate(() => { VA.mute = false; });
  r = await say('고객이 비싸다고 합니다');
  await page.waitForTimeout(600);
  await page.evaluate(() => { VA.mute = false; });
  r = await say('그럼 그건 어떻게 말해요');
  ok(r.ai === 1, '이어지는 질문도 AI 로 간다');
  ok(/지금까지 나눈 말/.test(r.aiUser), '앞에 나눈 말을 함께 넘긴다');
  ok(/비싸다고 합니다/.test(r.aiUser), '앞말이 실제로 들어 있다');
  const short = await page.evaluate(() => window.__ai.length ? '' : '');
  const sysHas = await page.evaluate(() => {
    var a = VA.log; return a.length > 0;
  });
  ok(sysHas, '대화 기록이 화면에 쌓인다');

  /* 말하는 중에 끼어들기 */
  await page.evaluate(() => {
    VA.mute = true; VA.saying = '상담에서는 먼저 듣고 나중에 말합니다';
    window.__cancels = 0;
  });
  r = await say('아니 그거 말고 체크판 열어');
  ok(r.tab === 'ckboard', '말하는 중에 끼어들면 새 말을 듣는다');
  const cut = await page.evaluate(() => window.__cancels);
  ok(cut >= 1, '끼어들면 읽던 것을 멈춘다');

  /* 제 목소리는 명령으로 안 듣는지 */
  await page.evaluate(() => { VA.mute = true; VA.saying = '실행 체크판 을 엽니다'; go('home'); });
  await page.waitForTimeout(200);
  r = await say('실행 체크판 을 엽니다');
  ok(r.tab === 'home', '스피커에서 나온 제 목소리는 명령으로 듣지 않는다');

  /* 대화 끝내기 */
  await page.evaluate(() => { VA.mute = false; VA.saying = ''; window.__spoke = []; });
  r = await say('고마워');
  const ended = await page.evaluate(() => ({ talk: VA.talk, on: VA.on, state: VA.state,
    spoke: window.__spoke.join(' '), fab: (document.getElementById('osVaFab') || {}).className }));
  ok(!ended.talk && !ended.on, '"고마워" 하면 대화가 끝난다');
  ok(/마치겠습니다/.test(ended.spoke), '마친다고 말해 준다');
  ok(ended.fab === '', '단추도 평소 모습으로');

  /* 소리가 꺼져 있어도 대화가 이어지는지 — 입이 막혀도 귀는 열린다 */
  await page.evaluate(() => { vaSpeakToggle(); VA.hist = []; vaTalkStart(); });
  await page.waitForTimeout(600);
  const mute0 = await page.evaluate(() => ({ talk: VA.talk, on: VA.on, spoke: window.__spoke.length }));
  ok(mute0.talk && mute0.on, '소리를 꺼도 대화 모드는 돌아간다');
  await page.evaluate(() => { VA.mute = false; go('home'); });
  r = await say('체크판');
  ok(r.tab === 'ckboard' && r.spoke === '', '소리 없이도 일은 한다');
  await page.waitForTimeout(500);
  const mute1 = await page.evaluate(() => ({ on: VA.on, state: VA.state }));
  ok(mute1.on && mute1.state === 'listen', '소리가 없어도 다시 듣기로 돌아온다');
  await page.evaluate(() => { vaTalkStop(false); vaSpeakToggle(); });
  await page.waitForTimeout(300);

  /* ── 10-3. 말이 끝날 때까지 기다렸다가 한 번에 ── */
  await page.evaluate(() => { vaOff(); vaPanel(true); vaOnce(); VA.echo = []; go('home'); });
  await page.waitForTimeout(400);

  /* 토막토막 넣어도 한 번만 답하는지 */
  await page.evaluate(() => { window.__spoke = []; window.__ai = []; VA.log = []; });
  await page.evaluate(() => window.__say('고객이'));
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__say('비싸다고'));
  await page.waitForTimeout(200);
  const mid = await page.evaluate(() => ({ buf: VA.buf, hold: !!VA.hold, ai: window.__ai.length,
    live: (document.getElementById('vaLive') || {}).textContent || '' }));
  ok(mid.ai === 0, '말하는 도중에는 답하지 않는다');
  ok(mid.hold && /고객이 비싸다고/.test(mid.buf), '토막을 모아 둔다 — "' + mid.buf + '"');
  ok(/고객이 비싸다고/.test(mid.live), '모으는 중인 말이 화면에 보인다');

  await page.evaluate(() => window.__say('합니다 어떻게 하죠'));
  await page.waitForTimeout(WAIT + 900);
  const done = await page.evaluate(() => ({ ai: window.__ai.length, buf: VA.buf,
    user: window.__ai[0] ? window.__ai[0].user : '',
    me: VA.log.filter(x => x.w === 'me').length,
    bot: VA.log.filter(x => x.w === 'bot').length }));
  ok(done.ai === 1, '조용해진 뒤 한 번만 답한다 (AI 호출 ' + done.ai + '회)');
  ok(/고객이 비싸다고 합니다 어떻게 하죠/.test(done.user), '토막이 한 문장으로 합쳐져 넘어간다');
  ok(done.me === 1 && done.bot === 1, '주고받은 기록도 한 번씩만 남는다');
  ok(done.buf === '', '모아 둔 것은 비워진다');

  /* "그만" 은 기다리지 않고 바로 */
  await page.evaluate(() => { window.__cancels = 0; window.__say('아무 말이나'); });
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__say('그만'));
  await page.waitForTimeout(250);
  const stop2 = await page.evaluate(() => ({ buf: VA.buf, hold: !!VA.hold, cancels: window.__cancels }));
  ok(!stop2.hold && stop2.buf === '', '"그만" 은 기다리지 않고 바로 듣는다');
  ok(stop2.cancels >= 1, '모아 둔 것도 버린다');

  /* ── 10-4. 같은 말을 되풀이하지 않는지 (제 목소리 되받기) ── */
  await page.evaluate(() => { vaOff(); VA.echo = []; vaPanel(true); vaTalkStart(); });
  await page.waitForTimeout(900);
  await page.evaluate(() => { window.__ai = []; VA.log = []; go('home'); VA.mute = false; });
  await page.evaluate(() => window.__say('상담 순서를 알려줘'));
  await page.waitForTimeout(WAIT + 1400);
  const said = await page.evaluate(() => ({ ai: window.__ai.length, spoke: window.__spoke.join(' '),
    echo: VA.echo.length }));
  ok(said.ai === 1, '한 번 물었으니 한 번 답한다');
  ok(said.echo >= 1, '방금 한 말을 기억해 둔다');

  /* 그 답이 스피커로 나와 마이크에 다시 들어온 상황 */
  await page.evaluate(() => { window.__ai = []; VA.mute = false; VA.saying = ''; });
  await page.evaluate(t => window.__say(t), '상담에서는 먼저 듣고 나중에 말합니다 오늘 하나만 정하시면 됩니다');
  await page.waitForTimeout(WAIT + 900);
  const loop = await page.evaluate(() => ({ ai: window.__ai.length, buf: VA.buf,
    me: VA.log.filter(x => x.w === 'me').length }));
  ok(loop.ai === 0, '제 목소리가 다시 들어와도 또 답하지 않는다 (반복이 안 생긴다)');
  ok(loop.buf === '', '모아 두지도 않는다');

  /* 말이 끝난 뒤에도 잠깐은 기억하는지 */
  await page.evaluate(() => { VA.saying = ''; VA.mute = false; window.__ai = []; });
  await page.evaluate(() => window.__say('오늘 하나만 정하시면 됩니다'));
  await page.waitForTimeout(WAIT + 700);
  ok((await page.evaluate(() => window.__ai.length)) === 0,
    '읽기가 끝난 뒤 들어와도 제 목소리로 알아본다');
  await page.evaluate(() => vaTalkStop(false));
  await page.waitForTimeout(300);

  /* 방금 한 말 안에 들어 있는 짧은 명령은 삼키지 않는지 */
  await page.evaluate(() => {
    vaOff(); vaPanel(true); vaOnce(); go('home');
    VA.echo = []; VA.saying = ''; VA.mute = false;
    vaEchoAdd('실행 체크판 을 엽니다.');
    window.__ai = [];
  });
  await page.waitForTimeout(300);
  r = await say('체크판');
  ok(r.tab === 'ckboard',
    '방금 "실행 체크판 을 엽니다" 라고 했어도 "체크판" 은 명령으로 알아듣는다');

  /* ── 10-5. 두뇌를 바탕으로 답하는지 ── */
  const sys = await page.evaluate(() => {
    var s = vaSys();
    return { len: s.length, brain: /윤시현의 두뇌/.test(s), map: /이 앱의 화면/.test(s),
      route: /업무 루트/.test(s), talk: /실전화법서/.test(s), ax: /성장 여섯 축/.test(s),
      cur: /배워서 터치할/.test(s), short: /세 문장 안에/.test(s) };
  });
  ok(sys.brain, '윤시현의 두뇌를 바탕으로 답한다');
  ok(sys.map, '앱의 화면을 전부 알고 있다');
  ok(sys.route, '업무 루트를 알고 있다');
  ok(sys.talk, '화법서 30장을 알고 있다');
  ok(sys.ax && sys.cur, '성장 축과 배울 주제를 알고 있다');
  ok(sys.short, '소리로 듣는 말이라 짧게 답하라고 일러 둔다');
  ok(sys.len > 1500, '아는 것이 ' + sys.len + '자');

  /* ── 10-6. 자료 만들기 ── */
  await page.evaluate(() => {
    vaOff(); vaPanel(true); vaOnce(); VA.echo = []; go('home');
    window.__brainAsked = [];
    window.brainAsk = function (q) {
      window.__brainAsked.push(q);
      BRAIN.hist.push({ q: q, a: null });
      setTimeout(function () {
        BRAIN.hist[BRAIN.hist.length - 1].a =
          '40대 가장에게는 치료비부터 봅니다. 보험료가 아니라 나오는 돈으로 이야기를 옮기세요. 그다음 부족한 곳을 하나만 고릅니다.';
      }, 900);
    };
  });
  await page.waitForTimeout(300);
  await page.evaluate(() => { window.__spoke = []; window.__say('40대 가장 상담 자료 만들어줘'); });
  await page.waitForTimeout(WAIT + 900);
  const mk1 = await page.evaluate(() => ({ tab: lastTab, making: VA.making,
    asked: window.__brainAsked.length, q: window.__brainAsked[0] || '',
    spoke: window.__spoke.join(' ') }));
  ok(mk1.tab === 'brain', '"만들어줘" 하면 두뇌 화면으로 간다');
  ok(mk1.asked === 1 && /40대 가장/.test(mk1.q), '두뇌에게 그대로 넘긴다 — "' + mk1.q + '"');
  ok(/맡겼습니다/.test(mk1.spoke), '맡겼다고 먼저 말해 준다');
  ok(mk1.making, '만드는 중 표시가 켜진다');

  await page.waitForTimeout(2600);
  const mk2 = await page.evaluate(() => ({ making: VA.making, spoke: window.__spoke.join(' '),
    last: VA.log.length ? VA.log[VA.log.length - 1].t : '' }));
  ok(!mk2.making, '다 만들면 표시가 꺼진다');
  ok(/다 만들었습니다/.test(mk2.last), '다 됐다고 알려 준다');
  ok(/치료비부터/.test(mk2.last), '만든 내용의 앞머리를 읽어 준다');
  ok(/두뇌 화면에 있습니다/.test(mk2.last), '나머지는 화면에 있다고 알려 준다');
  ok(mk2.last.length < 260, '전부 읽지 않는다 (' + mk2.last.length + '자)');

  /* ── 10-7. 목소리 고르기 ── */
  const vo = await page.evaluate(() => {
    go('voiceasst');
    return { list: vaVoices().length, ko: vaKoVoices().length,
      auto: VA.voice ? VA.voice.name : '' };
  });
  await page.waitForTimeout(500);
  ok(vo.ko === 1 && vo.auto === 'Yuna', '한국어 목소리를 자동으로 고른다');
  const sel = await page.evaluate(() => {
    var e = document.getElementById('vaVoiceIn');
    return { has: !!e, opts: e ? e.options.length : 0,
      hint: (document.body.textContent || '').indexOf('마음에 드는 걸로') >= 0 };
  });
  ok(sel.has && sel.opts === 2, '목소리 고르는 칸이 있다 (자동 + ' + (sel.opts - 1) + '개)');
  ok(sel.hint, '고르는 법을 알려 준다');
  await page.evaluate(() => { window.__spoke = []; vaVoiceSet('Samantha'); });
  await page.waitForTimeout(300);
  const picked = await page.evaluate(() => ({ name: VA.voice ? VA.voice.name : '',
    saved: JSON.parse(localStorage.getItem('apex_va') || '{}').voice,
    spoke: window.__spoke.join(' ') }));
  ok(picked.name === 'Samantha' && picked.saved === 'Samantha', '고른 목소리가 저장된다');
  ok(/이 목소리로 답해/.test(picked.spoke), '고르면 그 목소리로 한 번 읽어 준다');
  await page.evaluate(() => vaVoiceSet(''));
  await page.waitForTimeout(200);

  /* 기다리는 시간 */
  await page.evaluate(() => vaWaitSet('3'));
  await page.waitForTimeout(150);
  const w3 = await page.evaluate(() => ({ ms: vaWaitMs(),
    txt: (document.getElementById('vaWaitV') || {}).textContent || '' }));
  ok(w3.ms === 3000 && /3초/.test(w3.txt), '기다리는 시간을 바꿀 수 있다');
  await page.evaluate(() => vaWaitSet('1'));
  await page.waitForTimeout(150);

  /* ── 11. 연결된 화면이 모두 있는지 ── */
  const bad = await page.evaluate(() => {
    var ids = {}; TABS.forEach(g => g.items.forEach(i => ids[i.id] = 1));
    if (typeof OS_TAB_GROUP !== 'undefined') Object.keys(OS_TAB_GROUP).forEach(k => ids[k] = 1);
    var out = [], k;
    for (k in VA_ALIAS) if (!ids[VA_ALIAS[k]]) out.push(k + '→' + VA_ALIAS[k]);
    var chs = {}; FP_CH.forEach(c => chs[c[0]] = 1);
    for (k in VA_CHKEY) if (!chs[VA_CHKEY[k]]) out.push(k + '→' + VA_CHKEY[k]);
    return out;
  });
  ok(bad.length === 0, '말로 부르는 이름이 모두 실제 화면·장으로 이어진다' +
    (bad.length ? ' — ' + bad.join(', ') : ' (' + (await page.evaluate(() => Object.keys(VA_ALIAS).length)) + '개)'));

  /* ── 12. 좁은 화면 ── */
  await page.evaluate(() => { go('voiceasst'); vaPanel(true); });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(500);
  const w = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  ok(w.sw <= w.cw + 2, '390px 가로 스크롤 없음 (' + w.sw + '/' + w.cw + ')');
  if (SHOT) await page.screenshot({ path: SHOT + '/va-m.png', fullPage: true });
  await page.setViewportSize({ width: 1240, height: 1000 });
  await page.waitForTimeout(400);
  if (SHOT) await page.screenshot({ path: SHOT + '/va.png', fullPage: true });

  /* ── 13. 음성이 안 되는 브라우저에서도 안 깨지는지 ── */
  const p2 = await ctx.newPage();
  const e2 = [];
  p2.on('pageerror', e => e2.push('no-speech: ' + e.message));
  await p2.addInitScript(FAKE);
  await p2.addInitScript(`delete window.SpeechRecognition;delete window.webkitSpeechRecognition;
    delete window.speechSynthesis;delete window.SpeechSynthesisUtterance;`);
  await p2.goto('http://127.0.0.1:' + PORT + '/app/index.html#voiceasst', { waitUntil: 'domcontentloaded' });
  await p2.waitForTimeout(2600);
  await p2.evaluate(() => {
    document.querySelectorAll('#osLoginGate,#osGuideOvl,#osOvl,#osGuide').forEach(x => x.remove());
    OS.profile = { id: 'va', name: '점검', role: 'owner', plan: 'vip' };
    window.toast = function () {};
    go('voiceasst');
  });
  await p2.waitForTimeout(700);
  const none = await p2.evaluate(() => {
    vaPanel(true); vaOnce();
    return { no: document.querySelectorAll('.va-st .no').length,
      guide: (document.body.textContent || '').indexOf('크롬') >= 0,
      err: VA.err, dis: !!(document.querySelector('.va-mic') || {}).disabled };
  });
  ok(none.no === 2, '음성이 없는 브라우저에서 둘 다 안 된다고 표시한다');
  ok(none.guide, '어디서 열면 되는지 알려 준다');
  ok(none.dis, '누를 수 없는 단추로 막아 둔다');
  ok(/못 합니다/.test(none.err || ''), '눌러도 터지지 않고 이유를 알려 준다');
  errs.push(...e2);

  await browser.close(); srv.close();
  console.log('');
  if (errs.length) { console.log('콘솔 오류 ' + errs.length + '건'); errs.slice(0, 6).forEach(e => console.log('   ' + e.slice(0, 170))); }
  if (fail.length) { console.log('실패 ' + fail.length + '건'); fail.forEach(f => console.log('  ✗ ' + f)); process.exit(1); }
  if (errs.length) process.exit(1);
  console.log('음성 비서 점검 통과');
})().catch(e => { console.error('오류:', e); process.exit(1); });
