/* 광고 랜딩의 「상담 받기」 단추를 한 곳에서 정한다 — 판 X424
 *
 * 왜 한 파일인가: 랜딩이 둘(dbcompare · selfcheck)이고 앞으로 더 늘어난다.
 * 랜딩마다 「인스타에서 왔으면 DM」 을 각자 적어 두면 한쪽만 고쳐진다 (CLAUDE.md 5번).
 * 주소도 랜딩 코드에 박지 않는다 — ad_landings 한 줄(kakao_url · dm_url)만 본다.
 *
 * 지어내지 않는다 (1번):
 *   · dm_url 이 비어 있으면 DM 단추를 세우지 않는다. 「없음」을 그럴듯한 주소로 메우지 않는다.
 *   · 아는 자리가 아니면 평소 하던 카톡으로 간다. 모르는 것은 모르는 대로 둔다.
 *   · 둘 다 없으면 단추를 세우지 않고 왜 없는지 돌려준다. 죽은 단추를 보이지 않는다.
 *
 * 랜딩은 한 줄만 보탠다:
 *   <script src="https://<이사이트>/ad-dm.js"></script>
 */
(function (root) {
  'use strict';

  /* 비었나 — null·공백·빈 글자를 한 자리에서 판정한다 */
  function blank(v) { return v == null || String(v).trim() === ''; }

  /* 이 방문자에게 어느 단추를 세울지. 순수 함수 — 그래서 점검이 표로 잴 수 있다.
     row: ad_landings 한 줄 · src: utm_source (메타가 넣어 주는 자리 코드) */
  function adDmPick(row, src) {
    if (!row) return { kind: 'none', url: '', why: 'ad_landings 에 이 랜딩 줄이 없습니다' };

    var s = blank(src) ? '' : String(src).trim().toLowerCase();
    var list = row.dm_sources;
    if (typeof list === 'string') {
      /* 포스트그레스 text[] 가 '{ig,fb}' 로 올 때가 있다 */
      list = list.replace(/^\{|\}$/g, '').split(',');
    }
    var want = [];
    (list || []).forEach(function (x) {
      if (!blank(x)) want.push(String(x).trim().toLowerCase().replace(/^"|"$/g, ''));
    });

    var dm = blank(row.dm_url) ? '' : String(row.dm_url).trim();
    var ka = blank(row.kakao_url) ? '' : String(row.kakao_url).trim();

    if (s && want.indexOf(s) >= 0) {
      if (dm) return { kind: 'dm', url: dm, why: s + ' 에서 왔습니다' };
      return ka
        ? { kind: 'kakao', url: ka, why: 'DM 주소가 아직 비어 있어 카톡으로 보냅니다' }
        : { kind: 'none', url: '', why: 'DM·카톡 주소가 둘 다 비어 있습니다' };
    }
    if (ka) return { kind: 'kakao', url: ka, why: s ? s + ' 은 DM 자리가 아닙니다' : '어디서 왔는지 모릅니다' };
    return { kind: 'none', url: '', why: '카톡 주소가 비어 있습니다' };
  }

  /* 눌린 것을 남긴다 — 어느 자리에서 어느 단추를 눌렀는지 모르면 다음에도 못 고친다.
     ev 는 기존 랜딩이 쓰는 이름을 그대로 쓴다: 카톡은 'cta', DM 은 'dm'. */
  function adDmEv(pick) { return pick && pick.kind === 'dm' ? 'dm' : 'cta'; }

  root.adDmPick = adDmPick;
  root.adDmEv = adDmEv;
  if (typeof module === 'object' && module.exports) module.exports = { adDmPick: adDmPick, adDmEv: adDmEv };
})(typeof window === 'object' ? window : globalThis);
