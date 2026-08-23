/* 한국표준질병·사인분류(KCD) 3자리 코드를 <b>받아 와 표로 만드는</b> 스크립트.

   ★ 이것은 점검이 아닙니다. CI 에 넣지 마십시오.
     코드가 개정되면 사람이 한 번 돌려 app/질병가이드-코드.js 를 다시 만듭니다.

   왜 이 파일이 있나 —
     코드 이름을 <b>외워 적었다가 두 번 틀렸습니다.</b> 처음엔 뇌·심장 범위표에서
     아홉 자리(거미막밑출혈→거미막하출혈 …), 다음엔 새 질병을 넣으며 열셋 중 여섯.
     그래서 이제 <b>사람이 코드 이름을 타이핑하지 않습니다.</b> 여기서 받아 옵니다.

   받는 곳 — 질병분류기호(kcdcode.kr)의 색인. 초성 14쪽을 훑습니다.
     공식 조회처인 KOICD 는 로그인을 요구해 들어가지 못합니다.
     그래서 <b>여기서 받았다는 것을 파일에 적어 둡니다</b> — 나중에 누가
     「이 이름 어디서 났냐」 물으면 답할 수 있어야 하기 때문입니다.

   쓰는 법:  node scripts/kcd-fetch.js > /tmp/kcd.tsv                              */
'use strict';
const https = require('https');

const UA = 'Mozilla/5.0';
function get(url) {
  return new Promise((res, rej) => {
    https.get(url, { headers: { 'User-Agent': UA } }, r => {
      let b = ''; r.setEncoding('utf8');
      r.on('data', d => b += d); r.on('end', () => res(b));
    }).on('error', rej);
  });
}

/* 태그를 줄바꿈으로 바꿔 [코드] 다음 줄의 이름을 집는다 */
function pick(html) {
  const t = html.replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
                .replace(/<[^>]+>/g, '\n')
                .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const L = t.split('\n').map(s => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < L.length - 1; i++) {
    const m = /^\[([A-Z][0-9]{2})\]$/.exec(L[i]);
    if (m) out.push([m[1], L[i + 1]]);
  }
  return out;
}

(async () => {
  const seen = new Map();
  for (let p = 1; p <= 14; p++) {                     /* 초성 ㄱ~ㅎ 열넉 쪽 */
    const html = await get('https://kcdcode.kr/mobile/index/' + p);
    for (const [c, n0] of pick(html)) {
      /* 「English - 한글」 로 오는 줄이 섞인다. <b>한글만</b> 남긴다 */
      const n = n0.indexOf(' - ') >= 0 ? n0.slice(n0.indexOf(' - ') + 3).trim() : n0;
      if (!seen.has(c) || (seen.get(c).indexOf(' - ') >= 0 && n.indexOf(' - ') < 0)) seen.set(c, n);
    }
    process.stderr.write('색인 ' + p + '/14 · 지금까지 ' + seen.size + '개\n');
  }
  [...seen.keys()].sort().forEach(c => process.stdout.write(c + '\t' + seen.get(c) + '\n'));
  process.stderr.write('끝 — 코드 ' + seen.size + '개\n');
})();
