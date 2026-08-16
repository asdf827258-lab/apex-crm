/* ════════════════════════════════════════════════════════════════════════
   모의 포트폴리오 — 매 영업일 가상으로 굴리고 기록만 한다

   ⚠️ 주문은 한 건도 나가지 않는다. 증권사에 붙지도 않는다.
      가상 체결을 계산해 invest_txns / invest_holdings / invest_nav 에
      적을 뿐이다. 실제 계좌는 읽지도 쓰지도 않는다.

   대상은 kind='sim' 인 계좌뿐이다. 그래서 마이그레이션이 필요 없다 —
   기존 표를 그대로 쓰고, 실제 계좌(kind='stock')와는 account_id 로 갈린다.

   순서 (netlify.toml):
     market-daily  KST 16:10  종가 수집
     invest-sim    KST 16:40  ← 여기. 그날 종가로 가상 체결
     invest-daily  KST 07:00  다음날 아침 브리핑에 결과가 실린다

   계산은 scripts/sim-core.js 하나만 쓴다. 규칙(1% 룰·낙폭 정지·3종목·비용)이
   거기 모여 있고 검사가 붙어 있다 — node scripts/check-simcore.js

   필요한 환경변수: SUPABASE_SERVICE_ROLE_KEY (필수) · SUPABASE_URL (선택)
   ════════════════════════════════════════════════════════════════════════ */

const SIM = require('../../scripts/sim-core.js');

const SB_URL = process.env.SUPABASE_URL || 'https://miakdhxtqofpndtlyzxa.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function kst() { return new Date(Date.now() + 9 * 3600 * 1000); }
function ymd(d) { return d.toISOString().slice(0, 10); }
function n(v) { const x = parseFloat(v); return isFinite(x) ? x : null; }

async function sb(path, opts) {
  const r = await fetch(SB_URL + '/rest/v1/' + path, Object.assign({
    headers: {
      apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY,
      'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates'
    }
  }, opts || {}));
  if (!r.ok) throw new Error(path.split('?')[0] + ' → ' + r.status + ' ' + (await r.text()).slice(0, 140));
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

exports.handler = async function (event) {
  const started = Date.now();
  const log = [];
  const today = ymd(kst());
  const manual = !!(event && event.httpMethod);

  const dow = kst().getUTCDay();
  if (!manual && (dow === 0 || dow === 6)) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, skipped: '주말이라 건너뜀', today }) };
  }
  if (!SB_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'SUPABASE_SERVICE_ROLE_KEY 없음' }) };

  /* ── 모의 계좌만 고른다 ─────────────────────────────────────────── */
  let accounts = [];
  try {
    accounts = (await sb('invest_accounts?kind=eq.sim&select=id,owner_id,name,stop_loss')) || [];
  } catch (e) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, reason: '계좌 조회 실패: ' + e.message }) };
  }
  if (!accounts.length) {
    return { statusCode: 200, body: JSON.stringify({ ok: true, today, made: 0, reason: '모의 계좌가 없습니다. 앱에서 하나 만드세요.' }) };
  }
  log.push('모의 계좌 ' + accounts.length + '개');

  /* ── 그날 종가 (한 번만 받는다) ─────────────────────────────────── */
  let prices = {}, priceDate = null;
  try {
    const head = (await sb('invest_prices?select=price_date&order=price_date.desc&limit=1')) || [];
    if (head.length) {
      priceDate = head[0].price_date;
      const rows = (await sb('invest_prices?price_date=eq.' + priceDate + '&select=code,close&limit=2000')) || [];
      rows.forEach(r => { const c = n(r.close); if (c != null) prices[r.code] = c; });
      log.push('종가 ' + priceDate + ' · ' + rows.length + '종목');
    }
  } catch (e) { log.push('종가 없음: ' + String(e.message || e).slice(0, 60)); }

  if (!priceDate) {
    return { statusCode: 200, body: JSON.stringify({ ok: false, today, reason: '종가 스냅샷이 없습니다. market-daily 를 먼저 돌리세요.' }) };
  }

  let done = 0;
  for (const acc of accounts) {
    try {
      const q = 'account_id=eq.' + encodeURIComponent(acc.id);

      /* 이미 그날치를 돌렸으면 다시 하지 않는다 — 두 번 돌면 두 번 산다 */
      const already = (await sb('invest_nav?' + q + '&nav_date=eq.' + priceDate + '&select=nav_date&limit=1')) || [];
      if (already.length) { log.push((acc.name || acc.id) + ' — ' + priceDate + ' 이미 처리됨'); continue; }

      const holds = (await sb('invest_holdings?' + q + '&select=id,code,name,qty,avg_price')) || [];
      const navs = (await sb('invest_nav?' + q + '&select=nav_date,value&order=nav_date.desc&limit=400')) || [];

      /* 현금은 원장에서 되짚는다.
         ⚠️ 별도의 '현금 잔액' 행을 만들려다 막혔다 — invest_txns 의 kind 는
            buy·sell·deposit·withdraw·dividend·fee 만 허용한다(제약조건).
            잔액을 따로 적는 대신 원장을 더하고 빼서 구하는 게 맞기도 하다.
            잔액 행과 원장이 어긋나면 어느 쪽이 참인지 알 수 없게 된다. */
      const ledger = (await sb('invest_txns?' + q + '&select=kind,amount&limit=2000')) || [];
      let cash = 0;
      ledger.forEach(t => {
        const a = Math.abs(n(t.amount) || 0);
        if (t.kind === 'deposit' || t.kind === 'sell' || t.kind === 'dividend') cash += a;
        else if (t.kind === 'buy' || t.kind === 'withdraw' || t.kind === 'fee') cash -= a;
      });

      /* 첫 실행이면 시작 자금을 원장에 남긴다 — 어디서 온 돈인지 적어 둔다 */
      if (!ledger.length) {
        cash = 10_000_000;
        await sb('invest_txns', {
          method: 'POST',
          body: JSON.stringify([{
            account_id: acc.id, owner_id: acc.owner_id, txn_date: priceDate,
            kind: 'deposit', amount: cash, memo: '[모의] 시작 자금'
          }])
        });
        log.push((acc.name || '모의') + ' — 시작 자금 ' + cash.toLocaleString('ko-KR') + '원');
      }

      let peak = 0;
      navs.forEach(x => { const v = n(x.value); if (v != null && v > peak) peak = v; });

      /* 정지 여부는 따로 저장하지 않고 낙폭에서 다시 판정한다. 저장한 표시와
         실제 낙폭이 어긋날 자리를 아예 없앤다. 대신 모의 계좌는 평가액이
         정지선 위로 회복되면 스스로 재개한다 — 실전 봇은 사람이 resume 을
         눌러야 하는 것과 다르다. 연습이니 그 편이 낫다고 봤다. */
      const halted = false;

      /* 그날 신호 — paper 전용 표라 실주문과 섞일 수 없다.
         ⚠️ 계좌를 지정한 신호와 지정하지 않은 신호를 둘 다 받는다.
            전략이 "삼성전자 매수" 를 낼 때 어느 계좌인지 모르는 게 보통이라,
            account_id 로만 거르면 모의 계좌가 신호를 영영 못 본다.
            실제로 그렇게 짜서 주문이 0건이었다. */
      const signals = (await sb('invest_signals?ref_date=eq.' + priceDate +
                                '&owner_id=eq.' + encodeURIComponent(acc.owner_id) +
                                '&or=(account_id.eq.' + encodeURIComponent(acc.id) + ',account_id.is.null)' +
                                '&select=code,name,side,strategy,reason&limit=20')) || [];

      const state = {
        cash: cash,
        holdings: holds.map(h => ({ code: h.code, name: h.name, qty: n(h.qty), avg: n(h.avg_price) })),
        peak: peak, halted: halted
      };

      const out = SIM.decideDay(state, signals, prices);

      /* ── 기록 ── 실제 주문이 아니라 '가상 체결' 이라는 걸 memo 에 남긴다 */
      for (const o of out.orders) {
        await sb('invest_txns', {
          method: 'POST',
          body: JSON.stringify([{
            account_id: acc.id, owner_id: acc.owner_id,
            txn_date: priceDate, kind: o.side === 'buy' ? 'buy' : 'sell',
            amount: Math.abs(o.amount),
            memo: '[모의] ' + (o.name || o.code) + ' ' + o.qty + '주 @ ' + Math.round(o.price).toLocaleString('ko-KR') +
                  (o.forced ? ' · 낙폭 정지' : (o.reason ? ' · ' + String(o.reason).slice(0, 40) : ''))
          }])
        });
      }

      /* 보유를 새로 쓴다 — 지우고 다시 넣는 대신 있는 것만 갱신·추가한다 */
      const keep = new Set(out.state.holdings.map(h => h.code));
      for (const h of holds) {
        if (!keep.has(h.code)) await sb('invest_holdings?id=eq.' + h.id, { method: 'DELETE' });
      }
      for (const h of out.state.holdings) {
        const ex = holds.filter(x => x.code === h.code)[0];
        const row = {
          account_id: acc.id, owner_id: acc.owner_id, asset_type: 'stock',
          code: h.code, market: 'KRX', name: h.name || h.code,
          qty: h.qty, avg_price: Math.round(h.avg), currency: 'KRW',
          last_price: prices[h.code] != null ? prices[h.code] : null,
          updated_at: new Date().toISOString()
        };
        if (ex) row.id = ex.id;
        await sb('invest_holdings', { method: 'POST', body: JSON.stringify([row]) });
      }

      const val = SIM.value(out.state.holdings, prices);
      const nav = out.state.cash + val.value;
      await sb('invest_nav?on_conflict=account_id,nav_date', {
        method: 'POST',
        body: JSON.stringify([{
          account_id: acc.id, owner_id: acc.owner_id,
          nav_date: priceDate, value: nav, flow: 0, src: 'sim'
        }])
      });

      log.push((acc.name || '모의') + ' — 주문 ' + out.orders.length + '건 · 평가 ' +
               nav.toLocaleString('ko-KR') + '원' +
               (out.state.halted ? ' · 정지됨' : '') +
               (val.unknownPrices ? ' · 시세없음 ' + val.unknownPrices + '종목' : ''));
      out.notes.forEach(t => log.push('   · ' + t));
      done++;
    } catch (e) {
      log.push((acc.name || acc.id) + ' 실패: ' + String(e.message || e).slice(0, 110));
    }
  }

  try {
    await sb('ai_dept_reports?on_conflict=dept,period,ref_date', {
      method: 'POST',
      body: JSON.stringify([{
        dept: 'invest_sim', dept_name: '🧪 모의 포트폴리오', period: 'daily', ref_date: today,
        body: log.join('\n'), src: 'auto'
      }])
    });
  } catch (e) { /* 부서기록이 없어도 본 작업은 끝났다 */ }

  return { statusCode: 200, body: JSON.stringify({ ok: true, today, priceDate, done, ms: Date.now() - started, log }) };
};
