/* ════════════════════════════════════════════════════════════════════════
   토스 중계가 오래된 값을 현재가로 내보내지 않는가

     node scripts/check-toss-relay.js

   집·서버에서 도는 toss-agent 가 Supabase 에 넣은 값을 웹이 읽어 쓴다. 집
   인터넷은 IP 가 바뀌고 PC 는 꺼지므로 중계가 끊기는 건 예외가 아니라 일상이다.
   끊긴 줄 모르고 어제 값을 현재가 자리에 놓으면, 연결이 아예 없는 것보다 나쁘다.

   그래서 15분이 넘으면 건너뛴다. 아래 검사는 그 경계와 자정 넘김을 건다.

   오류 문구도 같이 건다. 토스가 돌려주는 원문(access_denied 따위)만 던지면
   매번 문서를 뒤지게 되므로 '그래서 뭘 해야 하는지' 로 바꿔서 보여 준다.
   그 번역이 틀리면 엉뚱한 곳을 고치게 된다.
   ════════════════════════════════════════════════════════════════════════ */

const { _relay } = require('../netlify/functions/market.js');

let pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (got === undefined ? '' : '  → ' + JSON.stringify(got))); }
}

/* 지금 시각(KST)을 기준으로 'n분 전' 을 src 문자열로 만든다 */
function srcAgo(min) {
  const d = new Date(Date.now() + 9 * 3600 * 1000 - min * 60000);
  return 'toss ' + String(d.getUTCHours()).padStart(2, '0') + ':' + String(d.getUTCMinutes()).padStart(2, '0');
}

console.log('\n① 몇 분 전 값인지 되짚는가');

ok('방금 넣은 값은 0~1분', [0, 1].indexOf(_relay.ageMin(srcAgo(0))) >= 0, _relay.ageMin(srcAgo(0)));
ok('10분 전', Math.abs(_relay.ageMin(srcAgo(10)) - 10) <= 1, _relay.ageMin(srcAgo(10)));
ok('90분 전', Math.abs(_relay.ageMin(srcAgo(90)) - 90) <= 1, _relay.ageMin(srcAgo(90)));

/* ⚠️ 자정을 넘기면 뺄셈이 음수가 된다. 음수를 '방금' 으로 읽으면 어제 값이
      현재가가 된다 — 정확히 막으려던 사고다. */
ok('자정을 넘겨도 음수가 나오지 않는다',
   _relay.ageMin(srcAgo(180)) > 0 && _relay.ageMin(srcAgo(600)) > 0,
   [_relay.ageMin(srcAgo(180)), _relay.ageMin(srcAgo(600))]);

console.log('\n② 중계가 아닌 값을 중계로 착각하지 않는가');

ok('market-daily 가 넣은 종가(src=api)는 나이를 못 잰다', _relay.ageMin('api') === null);
ok('공개 시세(src=public)도 마찬가지', _relay.ageMin('public') === null);
ok('src 가 비어 있어도 터지지 않는다', _relay.ageMin('') === null && _relay.ageMin(null) === null);
ok('모양이 비슷해도 형식이 다르면 거른다', _relay.ageMin('toss 3:5') === null);
ok('시각이 없는 toss 는 거른다 — 언제 값인지 모르면 쓸 수 없다', _relay.ageMin('toss') === null);

console.log('\n③ 신선도 경계');

ok('경계값 15분은 15로 잰다', Math.abs(_relay.ageMin(srcAgo(15)) - 15) <= 1);
ok('기준이 15분으로 잡혀 있다', _relay.freshMin === 15, _relay.freshMin);

console.log('\n④ 내보내는 모양');

const q = _relay.shape({ code: '005930', close: '274500', change_rate: '2.43', currency: 'KRW', name: '삼성전자', src: srcAgo(2) });
ok('현재가를 숫자로 바꾼다', q.price === 274500, q.price);
ok('등락률을 숫자로 바꾼다', q.changeRate === 2.43, q.changeRate);
ok('중계는 지연이 아니다 — 토스 실시간 값이다', q.delayed === false);
ok('출처를 toss-relay 로 밝힌다', q.src === 'toss-relay', q.src);
ok('종목명을 살린다', q.name === '삼성전자');

const bad = _relay.shape({ code: 'X', close: null, change_rate: null });
ok('값이 없으면 지어내지 않는다', bad.price === null && bad.changeRate === null);

console.log('\n' + (fail ? '❌' : '✅') + '  ' + pass + ' 통과 · ' + fail + ' 실패\n');
process.exit(fail ? 1 : 0);
