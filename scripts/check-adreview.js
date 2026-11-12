/* 광고 저녁 자가 점검 — 거짓말을 할 수 있는 자리마다 못을 박는다 (판 X427)
 *
 * 사장님 말씀 2026-11-12 「매일 저녁 스스로 피드백 하고, 성장하는 광고 시스템」
 *
 * ★ 이 자가 지키는 것은 셋입니다.
 *   ① <b>눈이 멀었을 때 효율을 말하지 않는다</b> — 2026-11-12 에 광고비가 35일,
 *      카톡이 20일 멈춰 있었습니다. 그 숫자로 「문의당 얼마」 를 세면 멀쩡한
 *      판단을 지어내는 것입니다 (1번). 가장 중요한 못입니다.
 *   ② <b>문구 초안이 심의 밖으로 안 나간다</b> — 비과세 단정·시행령 숫자·
 *      수익률·원금보장. 보험 광고에서 이것이 나가면 고객 앞에서 무너집니다 (2번).
 *   ③ <b>모델 이름을 박지 않는다</b> — 저장소가 날짜 박힌 이름을 일곱 군데
 *      두고 있습니다. gemini-model.js 를 만든 그 병입니다 (5번).
 *
 * 바깥 서버를 한 번도 안 부릅니다 — fetch 를 갈아 끼웁니다. 갈래는 fast.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const R = path.join(__dirname, '..');

let bad = 0, n = 0;
function ok(cond, what) { n++; if (!cond) { bad++; console.log('  ✗ ' + what); } }

const AMP = path.join(R, 'scripts/anthropic-model.js');
const RVP = path.join(R, 'netlify/functions/ad-review.js');
const amSrc = fs.readFileSync(AMP, 'utf8');
const rvSrc = fs.readFileSync(RVP, 'utf8');
const page = fs.readFileSync(path.join(R, '광고성과.html'), 'utf8');
const sql = fs.readFileSync(path.join(R, 'migration_75_ad_review.sql'), 'utf8');
const toml = fs.readFileSync(path.join(R, 'netlify.toml'), 'utf8');

/* ══ ③ 모델 이름을 박지 않나 ═══════════════════════════════════════ */
const DATED = /claude-[a-z.]+-\d[\w.-]*-?\d{8}/;
ok(!DATED.test(amSrc.replace(/^[\s\S]*?\*\//, '')),
  'anthropic-model.js 에 날짜 박힌 모델 이름이 있습니다 — 물어보라고 만든 자입니다');
ok(!DATED.test(rvSrc), 'ad-review.js 에 날짜 박힌 모델 이름이 있습니다 (5번 — 여덟 번째 사본)');
ok(/require\('\.\.\/\.\.\/scripts\/anthropic-model\.js'\)/.test(rvSrc),
  'ad-review.js 가 모델을 묻는 자를 안 부릅니다');

const AM = require(AMP);
ok(AM.FAMILIES[0] === 'sonnet', '갈래 선호 첫째가 sonnet 이 아닙니다 (돈 · 글 솜씨)');
const ids = ['claude-opus-9-0-20991231', 'claude-haiku-9-0-20991231',
             'claude-sonnet-9-0-20991231', 'claude-sonnet-8-0-20990101', 'voice-embedding-1'];
ok(AM.pickModel(ids) === 'claude-sonnet-9-0-20991231',
  '모르는 새 이름들 중에서 sonnet 을 못 고릅니다 — 받은 것: ' + AM.pickModel(ids));
const rk = AM.rankModels(ids);
ok(rk.indexOf('claude-sonnet-9-0-20991231') < rk.indexOf('claude-sonnet-8-0-20990101'),
  '같은 갈래에서 서버가 준 순서(새것 먼저)를 안 지킵니다');
ok(rk.indexOf('claude-haiku-9-0-20991231') < rk.indexOf('claude-opus-9-0-20991231'),
  'opus 를 haiku 보다 먼저 씁니다 — 같은 일에 몇 배 비쌉니다');
ok(rk.indexOf('voice-embedding-1') < 0, '글을 못 쓰는 모델을 후보에 넣습니다');
ok(AM.pickModel([]) === null, '빈 목록에서 아무거나 지어 고릅니다');
ok(AM.rankModels(['claude-새이름-없는갈래']).length === 1,
  '갈래 이름이 안 든 새 모델을 버립니다 — 버리면 새 판이 나온 날 죽습니다');

/* ★ 404·400 에서만 내려가나 — 429 에서 내려가면 멀쩡한 모델을 버리고 한도만 더 씁니다 */
async function callWith(statuses) {
  AM._reset();
  const tried = [];
  const stub = async (url, opt) => {
    if (String(url).indexOf('/v1/models') >= 0 && (!opt || opt.method !== 'POST')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ data: [
        { id: 'claude-sonnet-9-0-20991231' }, { id: 'claude-haiku-9-0-20991231' }] }) };
    }
    const m = JSON.parse(opt.body).model;
    tried.push(m);
    const st = statuses[tried.length - 1] || 200;
    return { ok: st === 200, status: st,
             text: async () => 'stub ' + st,
             json: async () => ({ content: [{ type: 'text', text: '{"ok":1}' }] }) };
  };
  let err = null, out = null;
  try { out = await AM.askClaude('k', { system: 's', user: 'u' }, stub); }
  catch (e) { err = String(e.message || e); }
  return { tried: tried, err: err, out: out };
}

(async () => {
  const a = await callWith([404, 200]);
  ok(a.tried.length === 2 && !a.err, '404 면 다음 후보로 내려가야 합니다 — ' + JSON.stringify(a.tried));
  const b = await callWith([429]);
  ok(b.tried.length === 1, '★ 429(한도)에서 다음 모델로 넘어갑니다 — 한도만 더 씁니다 (' + b.tried.length + '번 시도)');
  ok(b.err && /429/.test(b.err), '429 를 그대로 알려 주지 않습니다');
  const c = await callWith([500]);
  ok(c.tried.length === 1, '★ 500(서버)에서 다음 모델로 넘어갑니다 (' + c.tried.length + '번 시도)');
  const d = await callWith([200, 200]);
  ok(d.out && d.out.model === 'claude-sonnet-9-0-20991231', '성공한 모델 이름을 안 돌려줍니다');

  /* ══ ① 눈이 멀었을 때 효율을 말하지 않나 ════════════════════════ */
  const RV = require(RVP)._rules;
  const T = '2026-11-12';
  const blindOf = (o) => RV.blindList(Object.assign(
    { today: T, spendLast: T, spendCloudRows: 5, eventsLast: T, placeView: true }, o));

  ok(blindOf({}).length === 0, '다 보이는데도 못 봤다고 합니다');
  ok(blindOf({ spendLast: '2026-10-08' }).some(x => /광고비가 2026-10-08/.test(x)),
    '광고비가 35일 멈춘 것을 못 봅니다 — 실제로 그랬던 자리입니다');
  ok(blindOf({ spendLast: null }).some(x => /한 줄도 없/.test(x)), '광고비가 아예 없는 것을 못 봅니다');
  ok(blindOf({ spendCloudRows: 0 }).some(x => /클라우드가 쓴/.test(x)),
    '아침 보고가 한 번도 안 돈 것을 못 봅니다');
  ok(blindOf({ placeView: false }).some(x => /ad_v_place/.test(x)), '자리별 뷰가 없는 것을 못 봅니다');
  ok(blindOf({ spendLast: '2026-11-11' }).length === 0, '하루 밀린 것을 눈이 멀었다고 합니다 — 헛것 (8번)');

  const F = { v7: 900, r7: 300, cta7: 40, v21: 2000, spend7: 400, inq: 0, places: [] };
  const 멀었을때 = RV.judge(F, ['광고비가 2026-10-08 에서 멈췄습니다'], '돌아감');
  ok(!/문의당 \$/.test(멀었을때) && !/\$\d/.test(멀었을때),
    '★★ 눈이 멀었는데 효율을 셈해 찍습니다 — 멈춘 숫자로 단정하는 것입니다 (1번)');
  ok(/재지 않았습니다|먼저 고칠/.test(멀었을때), '왜 효율을 안 재는지 말하지 않습니다');
  ok(/2026-10-08/.test(멀었을때), '못 본 것이 무엇인지 그대로 적지 않습니다');

  const 밝을때 = RV.judge(F, [], '돌아감');
  ok(/\$300|멈출 때|여유/.test(밝을때), '눈이 밝은데도 중단 기준을 안 말합니다');
  const 문의있음 = RV.judge(Object.assign({}, F, { inq: 4 }), [], '돌아감');
  ok(/문의당 \$100/.test(문의있음), '문의당 단가를 틀리게 셉니다 — 받은 것: ' + 문의있음.slice(0, 60));

  /* ② 광고가 멈췄으면 최적화 조언을 안 합니다 */
  ok(RV.stateOf({ v7: 10, v21: 300 }) === '멈춤', '7일 방문 10명을 멈춤으로 안 봅니다');
  ok(RV.stateOf({ v7: 900, v21: 2000 }) === '돌아감', '900명을 돌아간다고 안 봅니다');
  ok(RV.stateOf({ v7: 150, v21: 2000 }) === '적음', '많이 줄어든 것을 못 봅니다');
  /* ⚠️ 하루 4명은 광고가 도는 것이 아닙니다 — 2026-11-12 에 31명을 「돌아감」 이라
     적었던 자리입니다. 카톡율 1~2% 를 가리려면 방문 100명은 있어야 합니다. */
  ok(RV.stateOf({ v7: 31, v21: 94 }) === '멈춤',
    '★ 7일 방문 31명(하루 4명)을 돌아간다고 봅니다 — 그 수로는 아무 소재도 못 가립니다');
  ok(RV.RULE.deadVisits7 >= 100, '멈춤 기준이 100 아래입니다 — 동전 던지기를 판단이라 부르게 됩니다');
  ok(RV.stateOf({ v7: 0, v21: 0 }) === '모름', '한 명도 없을 때 모른다고 안 합니다');
  const 멈춤말 = RV.judge({ v7: 10, v21: 300, spend7: 0, inq: 0, places: [] }, [], '멈춤');
  ok(/켜는 것이 먼저/.test(멈춤말), '멈췄는데 켜라고 말하지 않습니다');
  ok(!/문의당/.test(멈춤말), '멈춘 광고에 문의당 단가를 셉니다 — 그 수는 뜻이 없습니다');

  /* 자리별 — 판 X424 와 같이 병을 둘로 가릅니다 */
  const AN = { 자리이름: '오디언스 네트워크', 방문: 1310, 읽음: 11, 카톡: 6, 즉시이탈: 730, 이탈기록: 1020 };
  const IG = { 자리이름: '인스타그램', 방문: 1142, 읽음: 93, 카톡: 6, 즉시이탈: 733, 이탈기록: 1109 };
  const 자리말 = RV.judge(Object.assign({}, F, { places: [AN, IG] }), [], '돌아감');
  ok(/오디언스 네트워크 — 글을 아예 안 읽습니다/.test(자리말), '안 읽는 자리를 못 집어냅니다');
  ok(!/인스타그램 — 글을 아예 안 읽습니다/.test(자리말),
    '★ 읽음 8.1% 인 인스타를 「안 읽는다」 고 합니다 — 거짓이고 멀쩡한 자리를 끄게 만듭니다');
  ok(/인스타그램 — 읽는데 안 누릅니다/.test(자리말), '읽는데 안 누르는 자리를 따로 말하지 않습니다');
  const 적은자리 = RV.judge(Object.assign({}, F, {
    places: [{ 자리이름: '작은곳', 방문: 150, 읽음: 1, 카톡: 0, 즉시이탈: 100, 이탈기록: 120 }] }), [], '돌아감');
  ok(!/작은곳/.test(적은자리), '방문 150뿐인 자리에 대고 끄라고 합니다 (1번)');

  /* ④ 부탁할 것 */
  const asks = RV.asksOf(blindOf({ spendLast: '2026-10-08', placeView: false }), F, '돌아감');
  ok(asks.some(x => /META_ADS_TOKEN/.test(x)), '토큰을 넣어 달라고 안 합니다');
  ok(asks.some(x => /migration_74/.test(x)), '뷰를 세워 달라고 안 합니다');
  ok(RV.asksOf([], { v7: 900, r7: 300, cta7: 0, places: [] }, '돌아감')
       .some(x => /카톡 단추/.test(x)), '카톡이 0인데 단추를 눌러 보라고 안 합니다');
  ok(RV.asksOf([], F, '돌아감').length === 0, '아무 문제가 없는데도 부탁을 지어냅니다 (8번)');

  /* ⑤ 어제를 돌아보나 — 이 칸이 성장의 전부입니다 */
  ok(/첫 줄/.test(RV.lookBack(null, F, [])), '기록이 없을 때 첫 줄이라고 말하지 않습니다');
  const prev = { d: '2026-11-11', state: '멈춤', blind: ['광고비가 2026-10-08 에서 멈췄습니다', '자리별 뷰(ad_v_place)가 아직 없습니다'],
                 asks: ['Netlify 에 META_ADS_TOKEN 넣고 Trigger deploy'], facts: { v7: 20 } };
  const back = RV.lookBack(prev, F, ['자리별 뷰(ad_v_place)가 아직 없습니다']);
  ok(/2026-11-11/.test(back), '어느 날 판단인지 안 적습니다');
  ok(/부탁: Netlify/.test(back), '어제 부탁한 것을 다시 안 읽습니다 — 지켜졌나를 볼 길이 없습니다');
  ok(/✅ 고쳐졌습니다 — 광고비가 2026-10-08/.test(back), '고쳐진 것을 고쳐졌다고 안 합니다');
  ok(/⏳ 아직 그대로/.test(back), '안 고쳐진 것을 그대로라고 안 합니다');
  ok(/다시 돌기 시작/.test(back), '★ 어제 멈췄다고 한 것이 틀렸을 때 그렇게 안 적습니다 (1번)');
  const back2 = RV.lookBack(prev, { v7: 20, places: [] }, prev.blind);
  ok(!/다시 돌기/.test(back2), '아직 멈춰 있는데 다시 돈다고 합니다');
  ok(/🆕 새로 막혔습니다/.test(RV.lookBack(prev, F, ['랜딩 기록이 한 줄도 없습니다'])),
    '새로 막힌 것을 새로 막혔다고 안 합니다');

  /* ══ ② 문구 초안이 심의 밖으로 안 나가나 ═══════════════════════ */
  const CS = RV.COPY_SYSTEM;
  ok(/요건 충족 시/.test(CS), '★ 비과세에 「요건 충족 시」 를 붙이라고 안 시킵니다 (2번)');
  ok(/단정하지 않습니다/.test(CS), '비과세를 단정하지 말라고 안 시킵니다');
  ok(/한도·나이|시행령/.test(CS), '시행령 숫자를 적지 말라고 안 시킵니다 (2번)');
  ok(/심사 결과에 따릅니다/.test(CS), '「심사 결과에 따릅니다」 를 빼지 말라고 안 시킵니다');
  ok(/원금보장/.test(CS) && /수익률/.test(CS), '원금보장·수익률 단정을 막지 않습니다');
  ok(/숫자 밖의 수치를 새로 만들지 않습니다/.test(CS), '주어진 숫자 밖을 지어내지 말라고 안 시킵니다 (1번)');
  ok(/빈 배열/.test(CS), '확신이 없으면 비우라고 안 시킵니다 — 지어내는 쪽으로 몰립니다');

  const noKey = await RV.draftCopy(F, '돌아감', async () => { throw new Error('부르면 안 됩니다'); });
  ok(noKey.draft === null, '★ AI 키가 없는데 문구 초안을 지어냅니다 (1번)');
  ok(/ANTHROPIC_API_KEY/.test(noKey.why || ''), '키가 없다는 것을 말하지 않습니다');
  const dead = await RV.draftCopy(F, '멈춤', async () => { throw new Error('부르면 안 됩니다'); });
  ok(dead.draft === null && /안 돌아/.test(dead.why || ''),
    '광고가 멈췄는데 어느 문구가 안 먹히는지 가려 초안을 짓습니다');

  /* 화면 쪽 */
  ok(/id="revCard"[^>]*hidden/.test(page), '기록이 없을 때 칸을 감추지 않습니다 — 빈 칸이 「문제 없음」 으로 읽힙니다');

  ok(/심의를 받지 않은 초안/.test(page), '왜 그냥 쓰면 안 되는지 화면이 말하지 않습니다');
  const rh = (page.match(/function revHtml\(n\)[\s\S]*?\n}/) || [''])[0];
  ok(rh !== '', 'revHtml 을 못 찾았습니다');
  /* ⚠️ page 전체에서 찾으면 <b>주석</b>에도 「심의 전」 이 있어 딱지를 떼도 통과합니다.
     주석으로 만족되는 알람은 알람이 아닙니다 (8번). 그려 내는 글에서만 찾습니다. */
  const rhNoCmt = rh.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  ok(/심의 전/.test(rhNoCmt), '★ 화면이 그리는 글에 「심의 전」 딱지가 없습니다 (2번)');
  ok(/심의 전[^<]*<\/b><\/summary>/.test(rhNoCmt),
    '접는 칸 머리에 「심의 전」 이 안 붙습니다 — 펴 보기 전에 알아야 합니다');
  ok(!/문의당|\/ o\.|reduce\(/.test(rh),
    '화면이 판단을 다시 셉니다 — 저녁에 적은 것과 낮에 보이는 것이 달라집니다 (5번)');
  ok(/ad_notes/.test(page), '화면이 ad_notes 를 안 읽습니다');

  /* 시각·껍데기·SQL */
  ok(/\[functions\."ad-review-cron"\]/.test(toml), 'netlify.toml 에 저녁 시각이 없습니다');
  const sch = (toml.match(/\[functions\."ad-review-cron"\][\s\S]*?schedule\s*=\s*"([^"]+)"/) || [])[1];
  ok(sch === '10 12 * * *', '저녁 시각이 KST 21:10(UTC 12:10)이 아닙니다 — 받은 것: ' + sch);
  const shell = fs.readFileSync(path.join(R, 'netlify/functions/ad-review-cron.js'), 'utf8');
  const code = shell.split('\n').filter(l => l.trim() && !/^\s*(\/\*|\*|\*\/|\/\/)/.test(l));
  ok(code.length === 1, '껍데기에 코드가 ' + code.length + '줄 있습니다 — 일은 한 곳에만 (5번)');
  ok(/require\('\.\/ad-review\.js'\)/.test(shell), '껍데기가 일하는 함수를 안 부릅니다');

  ok(/create table if not exists public\.ad_notes/.test(sql), 'ad_notes 표를 안 만듭니다');
  ok(/ad_notes\s+enable row level security/.test(sql), 'ad_notes 에 RLS 를 안 켭니다');
  ok(/grant select on public\.ad_notes to authenticated/.test(sql),
    '설계사에게 읽기를 안 줍니다');
  ok(!/grant[^;]*insert[^;]*on public\.ad_notes to authenticated/.test(sql),
    '★ 설계사가 판단을 고쳐 쓸 수 있습니다 — 기록이 기록이 아니게 됩니다');
  ok(/looked_back/.test(sql) && /copy_draft/.test(sql) && /blind/.test(sql),
    '돌아봄·초안·못본것 칸이 다 있지 않습니다');
  ok(sql.indexOf('--') < 0, 'SQL 에 -- 주석이 있습니다 (9번)');
  ok(/null 이면 AI 를 안 썼/.test(sql), 'model 이 비었을 때의 뜻을 안 적어 둡니다 (1번)');

  console.log(bad ? '\n✗ 저녁 자가 점검 — ' + bad + '/' + n + ' 어긋남'
                  : '✓ 저녁 자가 점검 — ' + n + '가지 맞음');
  process.exit(bad ? 1 : 0);
})();
