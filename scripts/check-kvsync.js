/* ✍️ <b>내 업적 입력</b> 메뉴 · <b>기기에만 있던 기록을 서버로</b> (판 X300)

   사장님 말씀 2026-11-03 —
   「crm 메뉴에도 넣어주고, 가장중요한건 em운영센터나, 다른 crm에서 기록하는
    모든게 한군데서 입력하더라도 어디서든 기록이 공유 되도록 만들어줘」

   그날 재어 보니 교육 진도 · 4년 유지관리 · 하루 한 장 · 교육 캘린더 … 가
   <b>그 기기 localStorage 에만</b> 있어서 폰과 PC 가 따로 셌습니다.
   app/apex-kv-sync.js 가 정해 둔 열쇠만 서버(apex_user_kv · apex_org_kv)로 올립니다.

   ── 보는 것 (브라우저 없이 글자로 — 몇 초) ─────────────────────────
     [1] 메뉴 다섯 자리 — TABS · TAB_META · NAV_WHEN · T_SKIN · LINKS 에 myperf
     [2] EM 운영센터 주소는 EM_SITE <b>한 곳</b>, 내 업적은 EM_SITE+'/#mine'
     [3] 본체 · 하루 한 장이 apex-kv-sync.js 를 부른다
     [4] ★★ 실명 · 상담카드 · 지인 명단 · 비포&애프터 열쇠가 <b>올리는 목록에 없다</b> (3번)
     [5] 새 Supabase 클라이언트를 만들지 않는다 — 둘이 로그인 표를 서로 갱신하면 로그아웃됩니다
     [6] 목록 밖 열쇠는 안 올린다 — kindOf 가 목록으로만 판정한다                     */
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const SRC = fs.readFileSync(path.join(ROOT, 'app/index.html'), 'utf8');
const DAY = fs.readFileSync(path.join(ROOT, 'app/day.html'), 'utf8');
const KV = fs.readFileSync(path.join(ROOT, 'app/apex-kv-sync.js'), 'utf8');
/* 눈금 — <b>올라가는 것은 늘고 안 올라가는 것은 줄어야</b> 합니다 (0-1번).
   2026-11-15 (판 X449) 에 <b>재어 본</b> 값: apex_ 열쇠 169개 중 올림 <b>127</b> · 안 올림 <b>42</b>.
   그 전에는 올림 <b>13</b> · 안 올림 <b>156</b> 이었습니다.
   ⚠ 처음에 제가 140/33 이라고 <b>짐작으로</b> 적었다가 이 자가 울려 바로잡았습니다 —
     어림한 수를 적어 두면 그것이 사실로 읽힙니다 (1번).
   ★ 안 올라가는 42개는 <b>일부러</b>입니다 — 비밀 5 · 주민번호 1 · 이미 제 길로 가는 것 3 ·
     이 자의 살림 4 · 나머지는 이 기기 취향(탭 · 접힘 · 보기 · 봤나)입니다.
     [6] 이 그 42개 이름을 <b>전부 찍습니다</b> — 숨지 못하게 (0-1번). */
/* ⬆ 2026-11-15 (판 X450) · 안 올림 42 → <b>43</b>. 🗜 홈 짧게 보기(apex_hm_short_v1)를
     <b>일부러</b> 막았습니다 — 보기 취향이라 기기끼리 나누면 오히려 성가십니다.
     ⚠ 이 수가 느는 것은 <b>두 가지 뜻</b>이라 늘 때마다 까닭을 적습니다 — ① 일부러 막은
       것이 늘었다(괜찮음) ② 명단이 또 낡았다(고쳐야 함). 까닭을 안 적으면 다음 사람이
       어느 쪽인지 모릅니다 (0-1번). */
/* ⬆ 2026-11-15 (판 X452) · 안올림선 43 → <b>44</b>. 늘린 것은 <b>apex_vault_v1</b>(🔐 금고) 하나입니다.
     금고 안은 주민번호라, 사장님 규칙 「주민번호는 <b>서버 호출 0번</b>」(CLAUDE.md 3번) 그대로
     <b>일부러</b> 막았습니다. 명단이 낡아서가 아닙니다 — 까닭 없이 올리지 마십시오 (8번). */
const 올림선 = 127, 안올림선 = 44;
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };

console.log('[1] 메뉴 다섯 자리');
is(/\{id:'myperf',icon:'✍️',title:'내 업적 입력',cnt:'',ak:'홈'\}/.test(SRC), 'TABS 「하루 시작」 에 myperf (ak 홈 — 홈과 같은 문)');
is(/\n myperf:\{tag:'MY',title:'내 업적 입력',desc:'[^']{1,80}'\}/.test(SRC), 'TAB_META.myperf');
is(/airep:'today', myperf:'today'/.test(SRC), "NAV_WHEN.myperf = 'today'");
is(/var T_SKIN=\{myperf:1,/.test(SRC), 'T_SKIN.myperf');
is(/\{tab:'myperf',[^\n]*links:\[\{t:'[^']+',u:EM_SITE\+'\/#mine'\}\]\}/.test(SRC), "LINKS — 단추가 EM_SITE+'/#mine'");

console.log('[2] 주소는 한 곳');
is((SRC.match(/apex-hb-em\.netlify\.app/g) || []).length === 1, '본체에 EM 운영센터 주소가 한 번');
is(/var EM_SITE='https:\/\/apex-hb-em\.netlify\.app';/.test(SRC) && /u:EM_SITE\}/.test(SRC), 'EM 전용 운영센터 단추도 EM_SITE');

console.log('[3] 부르는 자리');
is(/<script src="apex-kv-sync\.js\?v=[^"]+"><\/script>/.test(SRC), '본체가 apex-kv-sync.js 를 부른다');
is(/<script src="apex-kv-sync\.js\?v=[^"]+"><\/script>/.test(DAY), '하루 한 장(day.html)도 부른다');

console.log('[4] ★★ <b>안 올리는 것</b> — 비밀 · 주민번호 · 이 기기 취향 (판 X449 에서 뒤집음)');
/* ⚠⚠ <b>2026-11-15 (판 X449) · 이 자의 약속을 뒤집어 적었습니다 — 무르지 않고 더 세게.</b>
   여태 「실명 · 상담카드 · 두뇌 · 비포&애프터가 <b>올리는 목록에 없다</b>」 를 물었습니다.
   그런데 사장님 말씀이 「<b>다른 곳에서 열면 안 보이는 것들이 있어서는 안 되</b> …
   "우리 APEX-PRO" <b>모든게</b>」 입니다. 재어 보니 apex_ 열쇠 169개 중 올라가는 것이
   <b>13개</b>뿐이고 <b>156개</b>가 그 기기에만 있었습니다 — 사장님이 노트북에서 빈 화면을
   보신 까닭입니다.
   ★ apex_user_kv 의 서버 규칙은 <b>user_id = auth.uid()</b> 입니다(재어 확인). <b>본인만</b>
     봅니다 — 팀도 관리자도 못 봅니다. 그래서 <b>실명도 올립니다</b>: 안 올리면 노트북에서
     모든 고객이 「홍○동」 이 되어, 사장님이 하루 전에 고치라 하신 그 불편이 <b>다른 기기에서
     되살아납니다</b>. 팀이 보는 자리(clients.name_masked)와 나가는 자리(AI · 폰 달력 ·
     엑셀 · 인쇄)는 <b>한 글자도 안 바뀝니다</b> — [4-2] 가 그것을 봅니다 (3번).
   ★ 그래서 묻는 것을 바꿉니다 — 「무엇이 목록에 없나」 가 아니라 <b>「정말 위험한 것이
     막혀 있나」</b> 입니다. 이쪽이 더 센 약속입니다 (8번).                                */
/* ★ kindOf 를 <b>쓰는 표와 함께</b> 떼어 옵니다 — 함수만 떼면 표가 안 와서 터집니다.
   처음에 그렇게 짜서 이 자가 터졌습니다(8번). 글자로만 보고 브라우저는 안 띄웁니다. */
const KVF = (() => {
  const a = KV.indexOf('var ORG_KEYS='), b = KV.indexOf('\n}', KV.indexOf('function kindOf(k){'));
  if (a < 0 || b < 0) return () => '';
  return new Function(KV.slice(a, b + 2) + '\nreturn kindOf;')();
})();
is(/var NEVER_EXACT=/.test(KV) && /var NEVER_PRE=/.test(KV) && /var NEVER_WORD=/.test(KV),
   '★★ 명단이 <b>뒤집혀</b> 있다 — 「안 올릴 것」 셋(NEVER_EXACT · NEVER_PRE · NEVER_WORD)을 적는 꼴');
is(!/var USER_KEYS=/.test(KV),
   '  옛 「올릴 것 명단」(USER_KEYS)이 <b>안 남아 있다</b> — 남으면 두 곳이 판정합니다 (5번)');
is(/NEVER_WORD\.test\(k\)/.test(KV) && KV.indexOf('NEVER_WORD.test(k)') < KV.indexOf("k.indexOf('apex_')===0"),
   '★★ <b>비밀 낌새를 제일 먼저</b> 막는다 — 목록을 하나 빠뜨려도 이름만으로 걸립니다');

console.log('[4-1] ★★ 위험한 것이 <b>정말</b> 막히나 — 하나씩 물어봅니다');
[['apex_cli_rrn_c1', '⛔ 주민등록번호 — 사장님 규칙 「서버 호출 0번」'],
 ['apex_personal_key', '⛔ 내 AI 열쇠'],
 ['apex_key', '⛔ 열쇠'],
 ['apex_toss_client_key', '⛔ 결제 열쇠'],
 ['apex_studio_apptoken', '⛔ 공유 토큰'],
 ['apex_studio_gproxy', '⛔ 프록시 설정'],
 ['apex_pay_cfg', '⛔ 결제 설정 — 잘못 덮이면 돈이 틀립니다'],
 ['apex_hm_hidenm', '⛔ 🙈 이름 가리기 — 사장님 「그 폰에서 가립니다」 (판 X399)'],
 ['apex_last_tab', '⛔ 어느 탭을 보던 중이었나 — 이 기기 취향'],
 ['apex_nav_fold', '⛔ 서랍 접힘'],
 ['apex_guide_seen_v2', '⛔ 둘러보기를 봤나'],
 ['apex_notice', '⛔ 공지 — 이미 제 길로 올라갑니다 (5번)'],
 ['apex_org_chart', '⛔ 조직도 — 이미 제 길로 (5번)'],
 ['apex_biz', '⛔ 사업자 — 이미 business_clients 로 (5번)'],
 ['apex_kv_meta', '⛔ 이 자의 살림'],
 ['gemini_api_key', '⛔ 우리 이름 밖의 열쇠'],
].forEach(([k, 뜻]) => is(KVF(k) === '', '  ' + 뜻 + ' — ' + k));

console.log('[4-2] ★ <b>나가는 자리는 그대로 가린다</b> (3번) — 공유는 내 기기끼리일 뿐입니다');
is(/name_masked/.test(SRC), '서버 명단은 <b>가린 이름</b>(name_masked)을 그대로 쓴다');
is(/function osMaskName\(/.test(SRC) && /function hmFullNm\(/.test(SRC),
   '가리는 자 · 홈에서 실명을 내는 자가 <b>둘 다 그대로</b> 있다 — 이 판이 그 둘을 안 건드렸습니다 (6번)');

console.log('[5] 새 클라이언트를 안 만든다');
is(!/createClient\s*\(/.test(KV), 'createClient 를 부르지 않는다 — 본체 OS.sb · 하루 한 장 SB 를 빌린다');

console.log('[6] ★★ <b>사장님 일은 다 올라가나</b> — 저장소의 열쇠를 전부 물어봅니다');
/* ★ 이름을 손으로 안 적습니다 — 저장소에서 긁어 <b>전부</b> 물어봅니다. 손으로 적으면
   새 화면이 늘 때 이 자도 같이 낡습니다(바로 그것이 이 판에서 고친 병입니다 · 8번). */
const 모든열쇠 = (() => {
  const out = new Set(), walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { if (e.name !== 'mokgak') walk(path.join(d, e.name)); continue; }
      if (!/\.(html|js)$/.test(e.name)) continue;
      const t = fs.readFileSync(path.join(d, e.name), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ' ');
      for (const m of t.matchAll(/['"](apex_[A-Za-z0-9_]{2,})['"]/g)) out.add(m[1]);
    }
  };
  walk(path.join(ROOT, 'app'));
  return [...out];
})();
const 올림 = 모든열쇠.filter(k => KVF(k) !== ''), 안올림 = 모든열쇠.filter(k => KVF(k) === '');
is(모든열쇠.length >= 120, '저장소에서 apex_ 열쇠 <b>' + 모든열쇠.length + '개</b>를 찾았다 (120 아래면 이 자가 눈이 먼 것입니다 · 8번)');
is(올림.length >= 올림선, '★★ <b>올라가는 열쇠 ' + 올림.length + '개</b> / 기준선 ' + 올림선 +
   ' — 판 X449 전에는 <b>13개</b>였습니다. 줄면 빨간불입니다');
is(안올림.length <= 안올림선, '  안 올라가는 열쇠 <b>' + 안올림.length + '개</b> / 기준선 ' + 안올림선 +
   (안올림.length > 안올림선 ? (' ← ' + 안올림.slice(0, 8).join(' · ')) : '') + ' — 늘면 또 명단이 낡은 것입니다');
console.log('      · 안 올라가는 ' + 안올림.length + '개: ' + 안올림.sort().join(' · '));

console.log('[6-1] ★★ <b>사장님 일</b>이라고 이름 박은 것은 꼭 올라간다');
/* 여기만 이름을 박습니다 — 이 열쇠들이 안 올라가면 사장님이 노트북에서 <b>빈 화면</b>을
   보십니다. 하나라도 막히면 그 자리에서 빨간불입니다. */
[['apex_baba_rows', '보장분석 전·후'], ['apex_mcal_my_me', '내 캘린더 일정'],
 ['apex_fact_cards_c1', '상담카드'], ['apex_brain_kb', '윤시현의 두뇌'],
 ['apex_cli_real_c1', '고객 실명'], ['apex_cli_tel_c1', '고객 번호'],
 ['apex_cli_clm_c1', '청구 이력'], ['apex_bcd_wb_v1', 'B·C·D 워크북'],
 ['apex_blog_mine_me', '내 블로그 글'], ['apex_grow_v1', '성장판'],
 ['apex_invest_v1', '투자'], ['apex_endorse', '배서'], ['apex_treatpay', '치료비'],
 ['apex_alib_v1', '보낼 말 모음'], ['apex_tsay_v1', '팀 한마디'],
 ['apex_owner_todo', '사장님 할 일'], ['apex_policy_delivery_v1', '증권 전달'],
 ['apex_s5_cases_v1', '실손 사례'], ['apex_wallets_meta', '8통장'],
 ['apex_day_pick', '하루 한 장 고른 것'], ['apex_nav_fav_me', '즐겨찾기'],
 ['ba_agent_v1', '보장분석 설정(우리 이름 밖)'], ['mikki_tv', '미끼 레이더(우리 이름 밖)'],
].forEach(([k, 뜻]) => is(KVF(k) === 'user', '  ' + 뜻 + ' — ' + k));
is(KVF('apex_edu_cal_v1') === 'org', '  교육 캘린더는 <b>조직 한 벌</b>(org)로 남는다');

console.log('[6-2] ★ <b>너무 큰 값은 안 올리고 말한다</b> (1번 · 7번)');
is(/v\.length>MAX_V/.test(KV) && /tooBig\[k\]=v\.length/.test(KV),
   '큰 값은 안 올리고 <b>안 올렸다고 남긴다</b> — 조용히 빠뜨리면 까닭을 영영 모르십니다');
is(/maxV:MAX_V/.test(KV) && /tooBig:tooBig/.test(KV), '바깥이 그것을 물어볼 수 있다');

console.log('[7] 업적 한 벌 (판 X303) — 월간보고 실적 칸');
const PL = fs.readFileSync(path.join(ROOT, 'app/apex-perf-link.js'), 'utf8');
is(/<script src="apex-perf-link\.js\?v=[^"]+"><\/script>/.test(SRC), '본체가 apex-perf-link.js 를 부른다');
is(/k!=='act_prem'&&k!=='act_case'/.test(PL), '저장할 때 실적 두 칸을 안 보낸다 — 서버가 원본에서 센 값을 덮지 않게');
is(/\['pf_act','pf_acase'\]/.test(PL) && /readOnly=true/.test(PL), '두 칸을 손으로 못 친다');
is(/finNum\('pf_act'/.test(SRC) && /act_prem:\+finV\('pf_act'/.test(SRC), '본체의 그 칸 · 저장 자리가 그대로 있다 — 이름이 바뀌면 잠금이 헛돕니다');

console.log('[8] 일정 한 벌 (판 X304) — EM 본부 · 팀 일정이 내 캘린더에');
const EC = fs.readFileSync(path.join(ROOT, 'app/apex-em-cal.js'), 'utf8');
is(/<script src="apex-em-cal\.js\?v=[^"]+"><\/script>/.test(SRC), '본체가 apex-em-cal.js 를 부른다');
is(/from\('em_events'\)/.test(EC) && /\.eq\('hidden',false\)/.test(EC), 'em_events 를 읽되 「이 달만 뺀」 일정(hidden)은 안 세운다');
is(/if\(opt&&opt\.apps\) load\(false\)/.test(EC) && !/window\.go=function/.test(EC), '★ 내 캘린더 카드(apps)를 그릴 때만 받는다 — 켤 때 · 홈에서는 안 부른다(check-boot 기준선 · 7번) · go 를 감싸지 않는다(check-bamake 가 go 의 글을 읽음)');
is(/typeof q\.lte==='function'/.test(EC) && /addEventListener\('click',[\s\S]*?,true\)/.test(EC), '서버 손이 모자라도 안 터진다 · 🏢 줄 누름은 잡는 단계에서 막는다');
is(/Date\.now\(\)-EMC\.at<TTL/.test(EC), '한 번 받으면 10분 동안 다시 안 받는다');
is(/window\.mcalItems=function/.test(EC) && !/who:/.test(EC), '달력 줄 모으는 자리 하나(mcalItems)에 덧붙이고, 임자(who)를 안 달아 담당자를 골라도 남는다');
is(!/\.(insert|upsert|update|delete)\(/.test(EC), '보기만 한다 — EM 일정의 원본은 EM 운영센터');
is(!/createClient\s*\(/.test(EC), '새 클라이언트를 만들지 않는다 — osClient 를 빌린다');
console.log('[9] 켤 때 안 부른다 — apex-kv-sync 는 처음 누를 때 받는다');
is(/function start\(\)/.test(KV) && /EV=\['keydown','pointerdown','touchstart'\]/.test(KV) && /else if\(armed\) armed\(\);/.test(KV), '처음 누르거나 · 치거나 · 창으로 돌아올 때 받는다');
is(!/ready=true; pull\(true\);\s*\n\s*\}\)\.then/.test(KV), '로그인 끝나자마자 바로 부르지 않는다 (켤 때 21 → 19번)');

console.log('\n──────────────────────────────');
console.log(bad ? '✗ ' + bad + '개 — 위를 보십시오' : '✓ 내 업적 입력이 메뉴에 서고, 정해 둔 기록만 서버로 갑니다.');
process.exit(bad ? 1 : 0);
