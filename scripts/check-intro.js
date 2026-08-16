/* 내 소개 — 기기가 아니라 <b>아이디</b>를 따라다니는가.

   상담자료 맨 앞에 나가는 얼굴이 기기 저장칸에만 있었다. 아이디별로
   칸을 나눠 놔서 한 컴퓨터를 같이 써도 남의 값에 안 덮이긴 했지만,
   집에서 적은 소개가 사무실에서는 안 보이고 태블릿은 빈 칸이었다.

   여기서 확인한다.

     1. 저장하면 서버로 올라가는가
     2. 다른 기기로 들어오면 서버 것이 내려오는가
     3. 서버가 비어 있으면 이 기기 것을 대신 올려 주는가 (처음 한 번)
     4. 이 기기 것이 더 새것이면 서버를 덮지 않고 올려 주는가
     5. 담을 자리가 없을 때 상담이 멈추지 않고, 무엇을 하라고 말하는가 */
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path'), url = require('url');

const ROOT = process.cwd();
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
               '.css': 'text/css; charset=utf-8' };
const srv = http.createServer((rq, rs) => {
  let p = decodeURIComponent(url.parse(rq.url).pathname.split('?')[0]);
  let f = path.join(ROOT, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { rs.writeHead(404); rs.end('no'); return; }
  rs.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'text/plain' });
  fs.createReadStream(f).pipe(rs);
});

let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* 서버를 흉내 낸다 — 넣은 것이 그대로 나와야 한다.
   missing 을 켜면 「표가 없다」 는 답을 준다. */
const STUB = `
window.__srv={rows:{},missing:false,calls:0};
window.osClient=function(){
  return {from:function(t){
    var flt=null,pend=null;
    var a={
      select:function(){return a},
      eq:function(k,v){flt=v;return a},
      /* 앱의 다른 곳이 같은 흉내를 타고 지나갈 수 있다 — 사슬을 다 받아 준다 */
      neq:function(){return a},gt:function(){return a},gte:function(){return a},
      lt:function(){return a},lte:function(){return a},like:function(){return a},
      ilike:function(){return a},is:function(){return a},in:function(){return a},
      not:function(){return a},or:function(){return a},filter:function(){return a},
      order:function(){return a},limit:function(){return a},range:function(){return a},
      single:function(){return a.maybeSingle()},
      insert:function(r){pend=r;return a},update:function(r){pend=r;return a},
      delete:function(){return a},
      maybeSingle:function(){
        window.__srv.calls++;
        if(window.__srv.missing)
          return Promise.resolve({error:{code:'42P01',message:'relation "public.advisor_intro" does not exist'}});
        var r=window.__srv.rows[flt];
        return Promise.resolve({data:r?{data:r}:null,error:null});
      },
      upsert:function(row){pend=row;return a},
      then:function(res,rej){
        window.__srv.calls++;
        if(window.__srv.missing)
          return Promise.resolve({error:{code:'42P01',message:'relation "public.advisor_intro" does not exist'}}).then(res,rej);
        if(pend)window.__srv.rows[pend.owner_id]=JSON.parse(JSON.stringify(pend.data||{}));
        return Promise.resolve({error:null}).then(res,rej);
      }
    };
    return a;
  }};
};
`;

(async () => {
  await new Promise(r => srv.listen(0, r));
  const base = 'http://127.0.0.1:' + srv.address().port;
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e).slice(0, 140)));
  await page.goto(base + '/app/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2600);
  /* 페이지가 osClient 를 스스로 선언하므로 <b>다 뜬 뒤에</b> 갈아 끼운다 */
  await page.evaluate(STUB);
  await page.evaluate(() => { OS.profile = { id: 'u-홍길동', name: '홍길동', role: 'member' }; });
  is(await page.evaluate(() => !!window.__srv), '서버 흉내가 붙었다');

  console.log('\n[1] 저장하면 서버로 올라간다');
  const up = await page.evaluate(async () => {
    advSet({ name: '홍길동', title: '사업단장', motto: '한 사람의 인생에 꼭 맞는 보장' });
    await new Promise(r => setTimeout(r, 250));
    return { srv: window.__srv.rows['u-홍길동'] || null, on: ADV_SRV.on };
  });
  is(!!up.srv && up.srv.title === '사업단장', '적은 것이 서버에 올라갔다 — ' + (up.srv ? up.srv.title : '없음'));
  is(!!up.srv && +up.srv.at > 0, '언제 적었는지 도장이 찍혔다');
  is(up.on === true, '화면이 「서버에 올라갔다」 로 바뀐다');

  console.log('\n[2] 다른 기기로 들어오면 서버 것이 내려온다');
  const down = await page.evaluate(async () => {
    /* 이 기기 저장칸을 비운다 = 처음 켜는 다른 컴퓨터 */
    try { localStorage.removeItem(advKey()); } catch (e) {}
    const before = advGet();
    await new Promise(res => advFromServer(res));
    await new Promise(r => setTimeout(r, 200));
    return { before: before.title || '', after: advGet().title || '', motto: advGet().motto || '' };
  });
  is(down.before === '', '빈 기기에서 시작했다');
  is(down.after === '사업단장', '서버에 있던 소개가 내려왔다 — ' + down.after);
  is(/한 사람의 인생/.test(down.motto), '한 줄 소개까지 그대로 따라왔다');

  console.log('\n[3] 서버가 비어 있으면 이 기기 것을 올려 준다 (처음 한 번)');
  const seed = await page.evaluate(async () => {
    window.__srv.rows = {};
    OS.profile = { id: 'u-새사람', name: '새사람', role: 'member' };
    advSet({ name: '새사람', title: '설계사' }, true);   /* 서버에 안 올리고 기기에만 */
    await new Promise(res => advFromServer(res));
    await new Promise(r => setTimeout(r, 250));
    return window.__srv.rows['u-새사람'] || null;
  });
  is(!!seed && seed.title === '설계사', '기기에만 있던 것이 서버로 옮겨 갔다 — 사람이 다시 안 적어도 된다');

  console.log('\n[4] 새것이 이긴다');
  const win = await page.evaluate(async () => {
    OS.profile = { id: 'u-비교', name: '비교', role: 'member' };
    window.__srv.rows['u-비교'] = { name: '비교', title: '서버쪽 옛것', at: 1000 };
    advSet({ name: '비교', title: '기기쪽 새것', at: 9000 }, true);
    await new Promise(res => advFromServer(res));
    await new Promise(r => setTimeout(r, 250));
    const a = { here: advGet().title, srv: window.__srv.rows['u-비교'].title };
    /* 이번엔 서버가 새것 */
    window.__srv.rows['u-비교'] = { name: '비교', title: '서버쪽 새것', at: 99000 };
    await new Promise(res => advFromServer(res));
    await new Promise(r => setTimeout(r, 250));
    return { a, b: { here: advGet().title } };
  });
  is(win.a.here === '기기쪽 새것' && win.a.srv === '기기쪽 새것',
     '기기 것이 새것이면 서버를 덮어쓴다 — 옛 서버값이 새 기기값을 지우지 않는다');
  is(win.b.here === '서버쪽 새것', '서버 것이 새것이면 기기가 받아 온다 — ' + win.b.here);

  console.log('\n[5] 담을 자리가 없어도 상담은 멈추지 않는다');
  const off = await page.evaluate(async () => {
    window.__srv.missing = true;
    OS.profile = { id: 'u-표없음', name: '표없음', role: 'member' };
    advSet({ name: '표없음', title: '그래도 저장' });
    await new Promise(r => setTimeout(r, 300));
    return { here: advGet().title, on: ADV_SRV.on, line: advSrvLine() };
  });
  is(off.here === '그래도 저장', '서버가 안 돼도 이 기기에는 그대로 남는다');
  is(off.on === false, '「아직 이 기기에만 남습니다」 로 바뀐다');
  is(/서버 준비 SQL/.test(off.line), '무엇을 해야 하는지 말해 준다 — 준비 SQL');

  console.log('\n[6] 준비 SQL 안에 담을 자리가 들어 있는가');
  const sql = await page.evaluate(() => ({
    txt: HX_SQL['00'].lines.join('\n'),
    ver: (typeof SETUP_VER !== 'undefined') ? SETUP_VER : 0
  }));
  is(/create table if not exists public\.advisor_intro/.test(sql.txt), 'advisor_intro 표를 만든다');
  is(/advisor_intro_read[\s\S]{0,200}owner_id = auth\.uid\(\)/.test(sql.txt), '본인 것만 읽는다');
  is(/advisor_intro_insert[\s\S]{0,160}with check \(owner_id = auth\.uid\(\)\)/.test(sql.txt),
     '남의 이름으로 못 쓴다');
  is(sql.ver === 34, '앱이 기다리는 준비 SQL 판이 34 다 — ' + sql.ver);
  is(/'schema_version', '34'/.test(sql.txt), 'SQL 이 끝나면 서버에 34 라고 남긴다');

  is(errs.length === 0, '중간에 터진 곳이 없다' + (errs.length ? ' — ' + errs[0] : ''));

  await browser.close();
  srv.close();
  console.log('\n──────────────────────────────');
  console.log(bad ? '내 소개 점검 실패 — ' + bad + '가지 어긋납니다.'
                  : '내 소개 점검 통과 — 다 맞습니다.');
  process.exit(bad ? 1 : 0);
})();
