/* 노출 자리별 — 화면·SQL·DM 규칙이 서로 어긋나지 않나 (판 X424)
 *
 * 왜 이 점검인가: 자리별로 갈라 보니 오디언스 네트워크가 방문의 절반인데
 * 글을 읽는 사람은 0.9% 였다. 그 판단을 화면에 세우면서 두 가지가 걱정됐다 —
 *   ① 자리별 「지출」을 지어 적는 것. 메타 insights 는 자리별 지출을 안 내려 준다.
 *   ② DM 주소가 비었는데 DM 단추를 세우는 것. 고객이 빈 곳으로 간다.
 * 둘 다 1번(지어내지 않는다) 위반이라, 되돌리면 빨간불이 켜지게 못 박는다.
 *
 * 브라우저를 안 띄운다 — 몇 초. 갈래는 fast.
 */
var fs = require('fs');
var path = require('path');
var R = path.join(__dirname, '..');

var bad = 0, n = 0;
function ok(cond, what) {
  n++;
  if (!cond) { bad++; console.log('  ✗ ' + what); }
}

var sql = fs.readFileSync(path.join(R, 'migration_74_ad_place.sql'), 'utf8');
var page = fs.readFileSync(path.join(R, '광고성과.html'), 'utf8');

/* ── 1. SQL ─────────────────────────────────────────── */
ok(/create\s+or\s+replace\s+view\s+public\.ad_v_place/i.test(sql), 'ad_v_place 뷰를 세우지 않습니다');
ok(/security_invoker\s*=\s*on/i.test(sql), 'security_invoker=on 이 없습니다 — 남의 줄이 보일 수 있습니다');

/* 자리별 지출은 메타가 안 준다. 뷰에 지출 칸이 생기면 어디선가 만들어 넣은 것이다 */
var view = (sql.match(/create\s+or\s+replace\s+view\s+public\.ad_v_place[\s\S]*?;/i) || [''])[0];
ok(view.length > 200, 'ad_v_place 뷰 본문을 못 찾았습니다');
ok(!/"?지출"?\s*,|as\s+"지출"|\bspend\b/i.test(view), 'ad_v_place 에 지출 칸이 있습니다 — 메타는 자리별 지출을 안 줍니다 (1번)');
/* 비율도 뷰에 두지 않는다 — 화면이 합계에서 한 번만 센다 (5번) */
ok(!/as\s+"(카톡율|이탈률|읽음율)"/.test(view), 'ad_v_place 가 비율을 같이 셉니다 — 세는 곳이 둘이 됩니다 (5번)');

/* dm_url 에 기본값이 붙으면 「주소 없음」이 사라진다 → 빈 곳으로 가는 단추가 선다 */
var dmcol = (sql.match(/add\s+column\s+if\s+not\s+exists\s+dm_url[^;]*/i) || [''])[0];
ok(dmcol !== '', 'ad_landings.dm_url 칸을 안 만듭니다');
ok(!/default/i.test(dmcol), 'dm_url 에 기본값이 붙었습니다 — 빈 주소를 메우면 안 됩니다 (1번)');
ok(/add\s+column\s+if\s+not\s+exists\s+dm_sources/i.test(sql), 'ad_landings.dm_sources 칸을 안 만듭니다');

/* ── 2. 화면 ─────────────────────────────────────────── */
ok(page.indexOf('ad_v_place') > 0, '화면이 ad_v_place 를 안 읽습니다');
ok(/id="byPlace"/.test(page), '노출 자리별 표 자리(byPlace)가 없습니다');

/* 화면이 모으는 칸이 전부 뷰에 있나 — 이름이 어긋나면 전부 0 으로 찍힌다 */
var fields = (page.match(/\["방문","읽음","카톡","즉시이탈","이탈기록"\]/) || [''])[0];
ok(fields !== '', '자리별이 모으는 칸 목록을 못 찾았습니다');
['방문', '읽음', '카톡', '즉시이탈', '이탈기록', '자리이름'].forEach(function (f) {
  ok(new RegExp('as\\s+"' + f + '"').test(view), '뷰에 "' + f + '" 칸이 없는데 화면이 찾습니다');
});

/* 자리별 칸에 $ 가 찍히면 어디선가 지출을 만들어 넣은 것이다 */
var card = (page.match(/<h2>노출 자리별<\/h2>[\s\S]*?<\/div>\s*<\/div>/) || [''])[0];
ok(card !== '', '노출 자리별 칸을 못 찾았습니다');
ok(card.indexOf('$') < 0, '노출 자리별 칸에 $ 가 있습니다 — 자리별 지출은 지어낼 수 없습니다 (1번)');
var dp = (page.match(/function drawPlace\(rows\)[\s\S]*?\n}/) || [''])[0];
ok(dp !== '', 'drawPlace 를 못 찾았습니다');
ok(dp.indexOf('usd(') < 0, 'drawPlace 가 돈을 찍습니다 — 자리별 지출은 없습니다 (1번)');
ok(/100 \* o\.카톡 \/ o\.방문/.test(dp), '카톡율을 화면에서 합계로 세지 않습니다');

/* ── 2-나. 화면이 자리마다 틀린 병을 말하지 않나 ──────
   ★★ 처음에 한 말로 묶었다가 인스타그램까지 「글을 안 읽습니다」 로 몰았습니다.
   인스타는 읽음 93(8.1%) 이고 AN 은 11(0.8%) 입니다 — 읽는데 안 누르는 것과
   아예 안 읽는 것은 다른 병인데, 한 말로 묶으면 멀쩡한 자리를 끄게 만듭니다(1번).
   그래서 라이브에서 읽어 둔 실제 숫자를 그대로 먹여 봅니다. */
var say = (page.match(/function placeSay\(ps\)[\s\S]*?\n}/) || [''])[0];
ok(say !== '', 'placeSay 를 못 찾았습니다');
var fn = new Function('adv', 'esc', 'return (' + say.replace(/^function placeSay/, 'function') + ')');
var placeSay = fn(
  function (cls, ic, t, d) { return '[' + cls + ']' + t + '|' + d + '\n'; },
  function (x) { return String(x); });

function P(name, 방문, 읽음, 카톡, 즉시이탈, 이탈기록) {
  return [name, { 방문: 방문, 읽음: 읽음, 카톡: 카톡, 즉시이탈: 즉시이탈, 이탈기록: 이탈기록 }];
}
var AN = P('오디언스 네트워크', 1310, 11, 6, 730, 1020);   /* 읽음 0.8% */
var IG = P('인스타그램',       1142, 93, 6, 733, 1109);   /* 읽음 8.1% */
var FB = P('페이스북',          189, 23, 19, 40, 156);    /* 카톡 10.1% */
var said = placeSay([AN, IG, FB]);

ok(/오디언스 네트워크[^|\n]*글을 아예 안 읽습니다/.test(said),
  '읽음이 백에 둘도 안 되는 자리를 「안 읽는다」 고 말하지 않습니다');
ok(!/글을 아예 안 읽습니다[^\n]*인스타그램|인스타그램[^|\n]*글을 아예 안 읽습니다/.test(said),
  '★ 읽음 8.1% 인 인스타그램을 「글을 안 읽는다」 고 말합니다 — 거짓입니다 (1번)');
ok(/인스타그램[^|\n]*읽는데 카톡을 안 누릅니다/.test(said),
  '읽는데 안 누르는 자리를 따로 말하지 않습니다 — 단추에서 막히는 것일 수 있습니다');
ok(said.indexOf('페이스북') < 0, '성적이 제일 좋은 페이스북에 대고 뭐라 합니다 (8번 — 헛것)');
ok(placeSay([FB]) === '', '기준을 넘는 자리가 없는데도 무슨 말을 합니다 (8번 — 헛것)');
ok(placeSay([]) === '', '자리가 하나도 없는데 무슨 말을 합니다');
ok(placeSay([P('적은자리', 150, 1, 0, 100, 120)]) === '',
  '방문 150뿐인 자리에 대고 끄라고 합니다 — 적은 수로 단정하지 않습니다 (1번)');
ok(said.indexOf('$') < 0, '제 입으로 하는 말에 $ 가 있습니다 — 자리별 지출은 없습니다');

/* ── 3. DM 규칙 — 한 벌인가, 빈 주소를 메우지 않나 ───── */
var dm = path.join(R, 'ad-dm.js');
ok(fs.existsSync(dm), 'ad-dm.js 가 없습니다');
var P = require(dm);
var row = { kakao_url: 'https://pf.kakao.com/_x', dm_url: 'https://ig.me/m/apex', dm_sources: ['ig'] };

var t = [
  ['ig 에서 오면 DM', P.adDmPick(row, 'ig').kind, 'dm'],
  ['DM 주소를 그대로 쓴다', P.adDmPick(row, 'ig').url, row.dm_url],
  ['DM 자리가 아니면 카톡', P.adDmPick(row, 'fb').kind, 'kakao'],
  ['어디서 왔는지 모르면 카톡', P.adDmPick(row, '').kind, 'kakao'],
  ['DM 주소가 비면 DM 단추를 안 세운다',
    P.adDmPick({ kakao_url: row.kakao_url, dm_url: null, dm_sources: ['ig'] }, 'ig').kind, 'kakao'],
  ['DM 주소가 공백만이어도 안 세운다',
    P.adDmPick({ kakao_url: row.kakao_url, dm_url: '   ', dm_sources: ['ig'] }, 'ig').kind, 'kakao'],
  ['랜딩 줄이 없으면 단추를 안 세운다', P.adDmPick(null, 'ig').kind, 'none'],
  ['주소가 둘 다 비면 단추를 안 세운다',
    P.adDmPick({ kakao_url: '', dm_url: '', dm_sources: ['ig'] }, 'ig').kind, 'none'],
  ['text[] 가 글자로 와도 읽는다',
    P.adDmPick({ kakao_url: row.kakao_url, dm_url: row.dm_url, dm_sources: '{ig,fb}' }, 'fb').kind, 'dm'],
  ['대소문자·공백을 가린다', P.adDmPick(row, ' IG ').kind, 'dm'],
  ['DM 은 dm 으로 남긴다', P.adDmEv({ kind: 'dm' }), 'dm'],
  ['카톡은 cta 로 남긴다', P.adDmEv({ kind: 'kakao' }), 'cta']
];
t.forEach(function (c) { ok(c[1] === c[2], c[0] + ' — 받은 것: ' + JSON.stringify(c[1])); });

/* 규칙이 한 벌인가 — 랜딩 주소를 코드에 박아 두면 ad_landings 를 고쳐도 안 바뀐다 */
var src = fs.readFileSync(dm, 'utf8');
ok(!/pf\.kakao\.com|ig\.me|instagram\.com\/direct/.test(src), 'ad-dm.js 에 주소가 박혀 있습니다 — ad_landings 만 봐야 합니다 (5번)');

console.log(bad ? '\n✗ 노출 자리별 — ' + bad + '/' + n + ' 어긋남'
                : '✓ 노출 자리별 — ' + n + '가지 맞음');
process.exit(bad ? 1 : 0);
