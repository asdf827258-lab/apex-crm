/* 🎣 <b>걱정별 이번 달 상품 작은 목록</b> 뽑기 — app/hm-door-top.js (판 X479)
   사장님 말씀 2026-11-18 「응 상품명도 띄워」 — 오늘 카드 「🎣 이분께 꺼낼 한 줄」 에
   그 걱정으로 이어 갈 이번 달 상품 이름이 바로 보이게.

   ★ 순위를 여기서 새로 세지 않습니다 (5번). 상품전략기(app/insight/index.html) 의
     점수·고르기 코드(score · ranked · tkCats · tkFitHTML)를 <b>그 쪽 글자 그대로</b> 떼어 돌려,
     「🎣 문 열기」 오른쪽 「이 이야기로 이어 갈 상품」 에 서는 셋과 <b>같은 것</b>을 적습니다.
     걱정을 모르는 분은 「이번 달 상품으로」 의 1위(tkNow) 를 적습니다.
   ★ 상품전략기는 달마다 통째로 바뀝니다. 바뀐 뒤 이 목록을 안 다시 뽑으면
     check-hmdoor 가 「다시 뽑으세요」 로 멈춥니다 — 홈에 지난달 상품이 서지 않게.

     node scripts/door-top.js          ← 다시 뽑기 (app/hm-door-top.js 를 새로 씀)
     node scripts/door-top.js --check  ← 지금 파일이 상품전략기와 같은지만 봄           */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const PAGE = path.join(ROOT, 'app/insight/index.html');
const TALK = path.join(ROOT, 'app/상담자료/mikki-talk-data.js');
const OUT = path.join(ROOT, 'app/hm-door-top.js');

function build() {
  const H = fs.readFileSync(PAGE, 'utf8');
  const tag = (id) => { const m = H.match(new RegExp('<script id="' + id + '" type="application/json">([\\s\\S]*?)</script>')); return m ? m[1] : '{}'; };
  // 본 스크립트에서 「함수 정의 + 상수」 구간만 — 첫 줄(const D = JSON.parse …) 부터 tkType 앞까지
  const a = H.indexOf('const D = JSON.parse(');
  const b = H.indexOf('function tkType(', a);
  if (a < 0 || b < 0) throw new Error('상품전략기에서 점수·고르기 코드를 못 찾았습니다 (const D … function tkType)');
  const code = H.slice(a, b);
  const el = { seed: { textContent: tag('seed') }, imgs: { textContent: tag('imgs') } };
  const noop = () => {};
  const ctx = {
    console, JSON, Math, Date, Object, Array, String, Number, RegExp, Set, Map, Promise,
    document: { getElementById: (id) => el[id] || null, querySelectorAll: () => [], addEventListener: noop, createElement: () => ({ style: {} }), head: { appendChild: noop }, body: { appendChild: noop } },
    location: { hash: '', search: '', href: '' }, localStorage: { getItem: () => null, setItem: noop },
    addEventListener: noop, setTimeout: noop, clearTimeout: noop, innerWidth: 1280, navigator: {}
  };
  ctx.window = ctx; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(TALK, 'utf8'), ctx, { filename: 'mikki-talk-data.js' });
  vm.runInContext(code, ctx, { filename: 'insight/index.html' });
  // 오른쪽 칸 그리기(tkFitHTML)를 그대로 부르되, 줄 하나(rowHTML)만 상품 번호로 받아 냅니다
  const r = vm.runInContext(`(function(){
    rowHTML = function(x){ return '\\u0001' + x.p.id + '\\u0002'; };
    var ids = function(h){ return (String(h).match(/\\u0001[^\\u0002]*\\u0002/g) || []).map(function(s){ return s.slice(1, -1); }); };
    var one = function(p){ return { id: p.id, nm: nm(p), co: p.company }; };
    var out = { month: CUR, cats: {}, top: null };
    Object.keys(window.MK_TALK.CATS).forEach(function(k){
      TK.mode = 'sit'; TK.cats = [k]; TK.pid = '';
      out.cats[k] = ids(tkFitHTML()).map(function(id){ return one(byId(id)); });
    });
    TK.mode = 'prod'; TK.cats = []; TK.pid = '';
    var n = tkNow(); out.top = n && n.p ? one(n.p) : null;
    return JSON.stringify(out);
  })()`, ctx);
  const o = JSON.parse(r);
  return '/* 🎣 걱정별 이번 달 상품 — scripts/door-top.js 가 상품전략기(app/insight/index.html)에서 뽑은 것입니다.\n' +
    '   손으로 고치지 마세요. 상품전략기가 바뀌면 node scripts/door-top.js 로 다시 뽑습니다 (판 X479). */\n' +
    'window.HM_DOOR_TOP=' + JSON.stringify(o, null, 1).replace(/\n\s*/g, ' ') + ';\n';
}

if (require.main === module) {
  const s = build();
  if (process.argv.includes('--check')) {
    const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8').replace(/\r\n/g, '\n') : '';
    if (cur === s) { console.log('같음'); process.exit(0); }
    console.log('다름 — node scripts/door-top.js 로 다시 뽑으세요'); process.exit(1);
  }
  fs.writeFileSync(OUT, s);
  console.log(s);
}
module.exports = { build };
