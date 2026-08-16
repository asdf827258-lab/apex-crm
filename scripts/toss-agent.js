#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   토스증권 연결기 — 고정 IP 가 있는 곳에서 돌린다

     node scripts/toss-agent.js --check     연결만 확인하고 등록할 IP 를 알려준다
     node scripts/toss-agent.js --once      한 번 받아서 저장하고 끝낸다
     node scripts/toss-agent.js             장중에 계속 돈다 (기본 60초 간격)

   ── 왜 이게 필요한가 ────────────────────────────────────────────────────
   토스는 호출 IP 를 등록해야 토큰을 준다. 그런데 Netlify 함수가 나갈 때 쓰는
   IP 는 배포마다 바뀐다(3.144.168.102 → 18.222.65.41 → 3.16.137.242 을 확인).
   등록해 두어도 다음 배포에 깨진다. 서버리스에서는 풀 수 없는 문제다.

   그래서 토스에 닿는 부분만 떼어 IP 가 변하지 않는 곳(집 PC·상시 켜 두는 작은
   서버)에서 돌린다. 받은 값은 Supabase 에 넣고, 웹은 그걸 읽는다. 토스와
   말을 섞는 건 이 파일 하나뿐이다.

       [집·서버]  toss-agent.js ──토스 API──> 시세·수급
                        │
                        └─> Supabase ─> Netlify 함수 ─> 앱 화면

   ── 마이그레이션이 필요 없다 ────────────────────────────────────────────
   이미 있는 표만 쓴다. invest_prices(시세) · invest_briefs(수급·랭킹).
   새 표를 만들자고 하면 그것부터 해야 해서 오늘 못 쓴다.

   ⚠️ 주문은 넣지 않는다. 이 파일에는 주문 코드가 아예 없다.
      토스 규격의 /orders 계열을 부르는 곳이 한 군데도 없다.

   ── 필요한 값 (.env 또는 환경변수) ──────────────────────────────────────
     TOSS_CLIENT_ID · TOSS_CLIENT_SECRET     토스증권 PC 웹 → 설정 → Open API
     SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
     TOSS_CODES        (선택) 받아올 종목. 비우면 Supabase 보유종목에서 읽는다
     TOSS_INTERVAL_SEC (선택) 반복 간격, 기본 60
   ════════════════════════════════════════════════════════════════════════ */

'use strict';

const fs = require('fs');
const path = require('path');

/* ── .env 를 읽는다 (python-dotenv 처럼) ──────────────────────────────── */
(function loadEnv() {
  for (const p of ['.env', path.join(__dirname, '..', '.env')]) {
    try {
      fs.readFileSync(p, 'utf8').split('\n').forEach(line => {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      });
      return;
    } catch (e) { /* 없으면 환경변수만 쓴다 */ }
  }
})();

const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'config', 'market.json'), 'utf8'));
const T = (CFG.providers || {}).toss || {};

const ID = process.env.TOSS_CLIENT_ID || '';
const SEC = process.env.TOSS_CLIENT_SECRET || '';
const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const INTERVAL = Math.max(20, parseInt(process.env.TOSS_INTERVAL_SEC || '60', 10));

const argv = process.argv.slice(2);
const MODE = argv.includes('--check') ? 'check' : (argv.includes('--once') ? 'once' : 'loop');

function log(...a) { console.log(new Date().toTimeString().slice(0, 8), ...a); }
function kst() { return new Date(Date.now() + 9 * 3600 * 1000); }
function ymd(d) { return d.toISOString().slice(0, 10); }
function n(v) { const x = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(x) ? x : null; }

/* ── 나가는 IP ─────────────────────────────────────────────────────────
   토스에 등록해야 하는 바로 그 값이다. 집 인터넷은 IP 가 바뀔 수 있으므로
   바뀌면 조용히 넘어가지 않고 크게 알린다 — 안 그러면 "어제는 됐는데" 로
   한참을 헤매게 된다. */
let lastIp = null;
async function outboundIp() {
  for (const u of ['https://api.ipify.org?format=json', 'https://ifconfig.me/all.json']) {
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(8000) });
      const j = await r.json();
      const ip = j.ip || j.ip_addr;
      if (ip) return String(ip).trim();
    } catch (e) { /* 다음 곳에서 물어본다 */ }
  }
  return null;
}

/* ── 토스 토큰 ─────────────────────────────────────────────────────────── */
let tok = null, tokExp = 0;
async function token() {
  if (tok && tokExp > Date.now()) return tok;
  const url = String(T.base).replace(/\/+$/, '') + T.token_path;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: ID, client_secret: SEC }).toString(),
    signal: AbortSignal.timeout(15000)
  });
  const txt = await r.text();
  let j = {}; try { j = JSON.parse(txt); } catch (e) { /* 아래에서 원문으로 알린다 */ }
  if (!r.ok || !j.access_token) {
    const e = new Error(explain(r.status, txt));
    e.raw = txt; e.status = r.status;
    throw e;
  }
  tok = j.access_token;
  tokExp = Date.now() + (Math.max(n(j.expires_in) || 3600, 120) - 60) * 1000;
  return tok;
}

/* 토스가 돌려준 오류를 '그래서 뭘 해야 하는지' 로 바꿔 준다.
   여기서 원문만 던지면 매번 문서를 뒤지게 된다. */
function explain(status, txt) {
  const s = String(txt || '');
  if (/ip address not allowed/i.test(s))
    return 'IP 가 등록돼 있지 않습니다 (403). 아래 IP 를 토스증권 PC 웹 → 설정 → Open API 의 허용 IP 에 넣으세요.';
  if (/invalid_client/i.test(s))
    return '키가 틀렸습니다 (401). TOSS_CLIENT_ID / TOSS_CLIENT_SECRET 를 다시 확인하세요. 앞뒤 공백이 흔한 원인입니다.';
  if (/unauthorized_client|access_denied/i.test(s))
    return '이 키에 권한이 없습니다. 토스에서 신청한 범위(scope)에 시세가 들어 있는지 확인하세요.';
  if (status === 429) return '호출이 너무 잦습니다 (429). TOSS_INTERVAL_SEC 를 늘리세요.';
  return '토스 응답 ' + status + ' — ' + s.slice(0, 200);
}

async function tossGet(pathname, params) {
  const t = await token();
  const qs = new URLSearchParams(params || {}).toString();
  const url = String(T.base).replace(/\/+$/, '') + pathname + (qs ? '?' + qs : '');
  const r = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: 'Bearer ' + t },
    signal: AbortSignal.timeout(15000)
  });
  const txt = await r.text();
  if (!r.ok) throw new Error(explain(r.status, txt));
  try { return JSON.parse(txt); } catch (e) { throw new Error('JSON 이 아닙니다: ' + txt.slice(0, 160)); }
}

/* ── Supabase ─────────────────────────────────────────────────────────── */
async function sb(p, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + p, Object.assign({
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
    },
    signal: AbortSignal.timeout(20000)
  }, opts || {}));
  if (!r.ok) throw new Error('Supabase ' + p.split('?')[0] + ' → ' + r.status + ' ' + (await r.text()).slice(0, 160));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

/* 받아올 종목 — 설정에 없으면 실제 보유 종목에서 가져온다.
   쓰지도 않는 종목을 부르면 호출 한도만 깎아 먹는다. */
async function codes() {
  const fromEnv = (process.env.TOSS_CODES || '').split(',').map(s => s.trim()).filter(Boolean);
  if (fromEnv.length) return fromEnv.slice(0, 200);
  if (!SB_KEY) return [];
  const rows = (await sb('invest_holdings?select=code,market&limit=500')) || [];
  const out = [];
  rows.forEach(h => {
    const c = String(h.code || '').trim();
    if (c && String(h.market || 'KRX').toUpperCase() === 'KRX' && out.indexOf(c) < 0) out.push(c);
  });
  return out.slice(0, 200);
}

/* ── ① 현재가 ──────────────────────────────────────────────────────────
   /api/v1/prices 는 symbol·timestamp·lastPrice·currency 넷만 준다.
   등락률이 없으므로 전일 종가는 우리 표(invest_prices)의 어제 값에서 구한다.
   토스에 한 번 더 물어볼 수도 있지만(candles) 호출을 아끼는 쪽을 골랐다. */
async function pullPrices(list) {
  if (!list.length) return { rows: [], note: '받아올 종목이 없습니다' };
  const j = await tossGet('/api/v1/prices', { symbols: list.join(',') });
  const items = (j.result || []).filter(x => x && x.symbol);
  if (!items.length) return { rows: [], note: '토스가 빈 목록을 돌려줬습니다' };

  /* 어제 종가 — 등락률 계산용 */
  let prev = {};
  try {
    const today = ymd(kst());
    const rows = (await sb('invest_prices?price_date=lt.' + today +
                           '&select=code,close,price_date&order=price_date.desc&limit=1000')) || [];
    rows.forEach(r => { if (prev[r.code] == null) prev[r.code] = n(r.close); });
  } catch (e) { /* 없으면 등락률만 비운다 */ }

  const today = ymd(kst());
  const rows = items.map(x => {
    const px = n(x.lastPrice);
    const p0 = prev[x.symbol];
    return {
      code: x.symbol, market: 'KRX', price_date: today,
      close: px,
      change_rate: (px != null && p0) ? Math.round((px / p0 - 1) * 10000) / 100 : null,
      currency: x.currency || 'KRW',
      /* 몇 시 값인지 남긴다 — 장중 값이 '종가' 로 오해되면 안 된다 */
      src: 'toss ' + String(x.timestamp || '').slice(11, 16)
    };
  }).filter(r => r.close != null);

  if (rows.length && SB_KEY) {
    await sb('invest_prices?on_conflict=code,market,price_date', {
      method: 'POST', body: JSON.stringify(rows)
    });
  }
  return { rows: rows, note: rows.length + '종목' };
}

/* ── ② 수급 — 사람들이 실제로 무엇을 샀는가 ─────────────────────────────
   토스 Open API 에 종목토론·댓글은 없다(규격 33개를 다 확인했다). 대신
   투자자별 매매동향을 준다. 말이 아니라 돈이 움직인 기록이라 이쪽이 낫다.
   호출이 종목당 한 번이라 상위 몇 개만 받는다 — 한도를 다 쓰면 시세가 멈춘다. */
async function pullFlows(list) {
  const pick = list.slice(0, 8);
  const out = [];
  for (const c of pick) {
    try {
      const j = await tossGet('/api/v1/stocks/' + encodeURIComponent(c) + '/investor-trading', { count: 1 });
      const rec = ((j.result || {}).records || [])[0];
      if (rec) out.push(Object.assign({ code: c }, rec));
    } catch (e) {
      out.push({ code: c, error: String(e.message || e).slice(0, 80) });
    }
  }
  return out;
}

/* ── ③ 랭킹 ───────────────────────────────────────────────────────────── */
async function pullRankings() {
  try {
    const j = await tossGet('/api/v1/rankings', {
      type: 'TOP_TRADING_AMOUNT', marketCountry: 'KR', duration: 'realtime', count: 10
    });
    return ((j.result || {}).rankings || []);
  } catch (e) { return { error: String(e.message || e).slice(0, 120) }; }
}

async function saveExtras(flows, ranks) {
  if (!SB_KEY) return;
  const today = ymd(kst());
  await sb('invest_briefs?on_conflict=kind,ref_date', {
    method: 'POST',
    body: JSON.stringify([{
      kind: 'toss_flows', ref_date: today,
      title: today + ' 토스 수급·랭킹',
      body: JSON.stringify({ at: new Date().toISOString(), flows: flows, rankings: ranks }, null, 1).slice(0, 60000),
      src: 'toss-agent'
    }])
  });
}

/* ── 장이 열려 있나 (대략) ──────────────────────────────────────────────
   토스에 /market-calendar/KR 이 있지만 그것도 호출 한 번이다. 주말과 시간대만
   여기서 걸러 내고, 공휴일은 굳이 따지지 않는다 — 헛돌아도 값이 안 바뀔 뿐
   틀린 값이 들어가지는 않는다. */
function marketLikelyOpen() {
  const d = kst(), dow = d.getUTCDay();
  if (dow === 0 || dow === 6) return false;
  const hm = d.getUTCHours() * 60 + d.getUTCMinutes();
  return hm >= 8 * 60 + 50 && hm <= 15 * 60 + 40;
}

/* ── 한 바퀴 ──────────────────────────────────────────────────────────── */
async function cycle(withExtras) {
  const list = await codes();
  const px = await pullPrices(list);
  log('시세 ' + px.note + (px.rows.length ? ' · 예: ' + px.rows[0].code + ' ' +
      Number(px.rows[0].close).toLocaleString('ko-KR') + '원' : ''));
  if (withExtras && list.length) {
    const flows = await pullFlows(list);
    const ranks = await pullRankings();
    await saveExtras(flows, ranks);
    const bad = flows.filter(f => f.error).length;
    log('수급 ' + (flows.length - bad) + '종목' + (bad ? ' (' + bad + '건 실패)' : '') +
        ' · 랭킹 ' + (Array.isArray(ranks) ? ranks.length + '건' : '실패'));
  }
}

/* ── IP 를 확인하고, 바뀌었으면 크게 알린다 ────────────────────────────── */
async function checkIp(first) {
  const ip = await outboundIp();
  if (!ip) { log('⚠️  나가는 IP 를 확인하지 못했습니다'); return; }
  if (first) {
    log('나가는 IP: ' + ip + '  ← 이 값이 토스 허용 IP 에 등록돼 있어야 합니다');
  } else if (lastIp && ip !== lastIp) {
    console.log('\n' + '='.repeat(70));
    console.log('  ⚠️  나가는 IP 가 바뀌었습니다:  ' + lastIp + '  →  ' + ip);
    console.log('     토스증권 PC 웹 → 설정 → Open API 에서 허용 IP 를 새 값으로 바꾸세요.');
    console.log('     바꾸기 전까지는 토스 호출이 전부 403 으로 막힙니다.');
    console.log('='.repeat(70) + '\n');
  }
  lastIp = ip;
}

async function main() {
  console.log('\n토스증권 연결기 — 주문 기능 없음 (읽기 전용)\n');

  const missing = [];
  if (!ID) missing.push('TOSS_CLIENT_ID');
  if (!SEC) missing.push('TOSS_CLIENT_SECRET');
  if (!SB_KEY && MODE !== 'check') missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (missing.length) {
    console.log('필요한 값이 없습니다: ' + missing.join(', '));
    console.log('.env 파일에 넣거나 환경변수로 주세요. 예시는 docs/토스_연결.md 를 보세요.\n');
    process.exit(1);
  }
  if (!(T.paths || {}).quote) {
    console.log('config/market.json 의 providers.toss.paths.quote 가 비어 있습니다.\n');
    process.exit(1);
  }

  await checkIp(true);

  try {
    await token();
    log('✅ 토큰 발급 성공 — 연결됐습니다');
  } catch (e) {
    console.log('\n❌ ' + e.message);
    if (lastIp) console.log('   등록할 IP:  ' + lastIp);
    console.log('');
    process.exit(2);
  }

  if (MODE === 'check') {
    /* 실제로 값이 나오는지까지 확인해야 '연결됐다' 고 말할 수 있다 */
    try {
      const j = await tossGet('/api/v1/prices', { symbols: '005930' });
      const x = (j.result || [])[0] || {};
      log('✅ 시세 확인 — 삼성전자 ' + Number(x.lastPrice).toLocaleString('ko-KR') + '원 (' +
          String(x.timestamp || '').slice(11, 19) + ')');
      console.log('\n연결에 문제가 없습니다. 이제 --once 나 반복 실행으로 쓰세요.\n');
    } catch (e) { console.log('\n❌ 시세 호출 실패 — ' + e.message + '\n'); process.exit(3); }
    return;
  }

  if (MODE === 'once') { await cycle(true); console.log(''); return; }

  log('반복 실행 시작 — ' + INTERVAL + '초 간격, 장중에만 받습니다 (Ctrl+C 로 종료)');
  let ticks = 0;
  for (;;) {
    try {
      if (marketLikelyOpen()) {
        /* 수급·랭킹은 자주 안 바뀐다. 10바퀴에 한 번만 받아 호출을 아낀다 */
        await cycle(ticks % 10 === 0);
        ticks++;
      } else if (ticks !== -1) {
        log('장 시간이 아닙니다 — 쉬는 중');
        ticks = -1;                      /* 같은 말을 계속 찍지 않는다 */
      }
      if (ticks % 10 === 0) await checkIp(false);
    } catch (e) {
      log('❌ ' + String(e.message || e).slice(0, 160));
      if (/IP 가 등록/.test(String(e.message))) await checkIp(false);
      tok = null;                        /* 다음 바퀴에 토큰부터 다시 받는다 */
    }
    await new Promise(r => setTimeout(r, INTERVAL * 1000));
  }
}

main().catch(e => { console.error('\n예상 못 한 오류:', e); process.exit(9); });
