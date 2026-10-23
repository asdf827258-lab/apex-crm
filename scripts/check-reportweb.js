/* 고객 결과지 — 계산기에서 단추를 눌러 실제로 열어 보기 (판 X161 · 브라우저 갈래)

   check-report.js 는 엔진과 글자만 봅니다. 여기서는 app/finance.html 을 열어
   「📄 고객 결과지 보기」 → 「결과지 열기」 를 실제로 누릅니다.

     자. 가린 이름(홍○○)으로 열리고 실명이 HTML 어디에도 안 새나 (CLAUDE.md 3번)
         연금 시뮬레이션 탭과 <b>같은 최저보증</b>을 말하나 — 한 고객에게 연금 숫자가
         둘이면 안 됩니다 (0-1번 · 5번)
         근속연수를 적으면 퇴직소득세 장이 서나 · 실명은 칸을 켜고 확인해야만 · 취소하면 꺼지나
         결과지 창의 단추·칸 44px · 페이지 오류 0

   ★ 판 X169 — 「지금 준비된 돈」 이 탭의 「지금 준비된 것」 과 같나 · 뺀 저축을 밝히나 · 시작을 미루면

   되돌려 보기 — rptData 의 rptMask(raw) 를 raw 로 → 「실명이 안 샌다」 가 웁니다.
                rptPension 에서 rows 를 빼면 → 결과지가 안 열려 빨간불입니다.            */
const path = require('path');
const ROOT = path.join(__dirname, '..');
let bad = 0;
const is = (ok, m) => { console.log((ok ? '  ✓ ' : '  ✗ ') + m); if (!ok) bad++; };
const head = (t) => console.log('\n' + t);
const strip = (h) => h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/src="data:[^"]+"/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

(async () => {
  {
    head('자. 계산기에서 실제로 열어 보면');
    const { chromium } = require('playwright');
    const b = await chromium.launch();
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    /* 바깥은 막습니다 — 결과지는 계산기 안에서만 만들어집니다(check-netblock · 7번) */
    await ctx.route('**://**', (r) => /^(file|data|blob):/.test(r.request().url()) ? r.continue() : r.abort());
    const pg = await ctx.newPage(); const errs = [];
    pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto('file://' + path.join(ROOT, 'app', 'finance.html'));
    await pg.waitForFunction(() => window.APEX_REPORT && window.PENSION && document.getElementById('pension-sim'), null, { timeout: 15000 });
    await pg.evaluate(() => {
      const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input', { bubbles: true })); };
      set('s_name', '홍길동'); set('s_age', '42'); set('s_rage', '65'); set('s_gross', '9000'); set('s_target', '400'); set('s_severance', '35000');
    });
    await pg.waitForTimeout(500);
    const tabNow = await pg.evaluate(() => {
      const box = [...document.querySelectorAll('#pension-sim div')].find((x) => x.children.length >= 2 && /^지금 준비된 것$/.test((x.children[0].textContent || '').trim()));
      return box ? box.children[1].textContent.replace(/[^\d]/g, '') : null;
    });
    const tab = await pg.evaluate(() => {
      const rows = [...document.querySelectorAll('#pension-sim .cmp-row')];
      const r = rows.find((x) => /받는 연금 — 최저보증/.test(x.textContent));
      return r ? r.querySelector('.cmp-val').textContent : null;
    });
    await pg.click('.gen-btn.rpt-btn'); await pg.waitForSelector('#rptPanel');
    await pg.fill('#rptYears', '30');
    const [pop] = await Promise.all([ctx.waitForEvent('page'), pg.click('#rptPanel .rpt-b button:first-child')]);
    await pop.waitForLoadState();
    const h = await pop.content(), t = strip(h);
    is(/홍○○ 님/.test(t) && !/홍길동/.test(h), '가린 이름(홍○○)으로 열리고 실명이 안 샌다');
    is(!/NaN|undefined|Infinity/.test(t), 'NaN · undefined 가 없다');
    is(/1,506만 원/.test(t), '근속연수를 적으면 퇴직소득세 장이 선다');
    /* 판 X169 — 결과지의 「지금 준비된 돈」 이 연금 시뮬레이션 탭의 「지금 준비된 것」 과 같은가 (한 고객 두 답 금지 · 5번) */
    const ready = (t.replace(/\s+/g, '').match(/지금준비된돈\(([\d,]+)만원\)/) || [])[1];
    is(tabNow && ready && tabNow === ready.replace(/,/g, ''), '「지금 준비된 돈」 이 탭과 같다 — 탭 ' + tabNow + '만 · 결과지 ' + (ready || '없음'));
    is(/쌓인 금액을 몰라 넣지 않았어요/.test(t), '넣고 있는 연금저축·IRP 를 빼고 셌다고 밝힌다');
    is(/시작을 미루면/.test(t) && /5년 뒤 시작/.test(t), '시작을 미루면 — 상품 엔진이 받아 주는 나이로 셈한다');
    const tabN = tab && tab.replace(/[^\d]/g, ''), rep = (t.match(/최저보증 보증 월 ([\d,]+)만 원/) || [])[1];
    is(tabN && rep && tabN === rep.replace(/,/g, ''), '연금 시뮬레이션 탭과 같은 최저보증 — 탭 ' + tab + ' · 결과지 ' + (rep ? rep + '만 원' : '없음'));
    is(/점검 필요/.test(t) && !/불가/.test(t), '「불가」 대신 「점검 필요」 (판 X170)');
    await pop.close();

    /* 판 X170 — 「쌓인 금액」 을 넣으면 탭과 결과지가 같은 값으로 더하나 · 「모른다」 쪽지가 사라지나 */
    await pg.evaluate(() => { const e = document.getElementById('s_pen_acc'); e.value = '3000'; e.dispatchEvent(new Event('input', { bubbles: true })); });
    await pg.waitForTimeout(400);
    const tabNow2 = await pg.evaluate(() => {
      const box = [...document.querySelectorAll('#pension-sim div')].find((x) => x.children.length >= 2 && /^지금 준비된 것$/.test((x.children[0].textContent || '').trim()));
      return box ? box.children[1].textContent.replace(/[^\d]/g, '') : null;
    });
    const [popA] = await Promise.all([ctx.waitForEvent('page'), pg.click('#rptPanel .rpt-b button:first-child')]);
    await popA.waitForLoadState();
    const tA = strip(await popA.content()), readyA = (tA.replace(/\s+/g, '').match(/지금준비된돈\(([\d,]+)만원\)/) || [])[1];
    is(tabNow2 && tabNow2 !== tabNow && readyA && readyA.replace(/,/g, '') === tabNow2, '쌓인 금액 3,000만 → 탭 ' + tabNow + ' → ' + tabNow2 + '만 · 결과지 ' + (readyA || '없음') + ' (한 곳에서 셈)');
    is(!/쌓인 금액을 몰라 넣지 않았어요/.test(tA) && /연금저축·IRP·달러·변액/.test(tA), '칸을 채우면 「모른다」 쪽지 대신 그 돈이 더해진다');
    await popA.close();
    await pg.evaluate(() => { const e = document.getElementById('s_pen_acc'); e.value = ''; e.dispatchEvent(new Event('input', { bubbles: true })); });
    pg.once('dialog', (d) => d.accept());
    await pg.check('#rptReal');
    const [pop2] = await Promise.all([ctx.waitForEvent('page'), pg.click('#rptPanel .rpt-b button:first-child')]);
    await pop2.waitForLoadState();
    is(/홍길동 님/.test(strip(await pop2.content())), '실명 칸을 켜고 확인하면 그때만 실명이 들어간다');
    await pop2.close();
    pg.once('dialog', (d) => d.dismiss());
    await pg.uncheck('#rptReal'); await pg.click('#rptReal');
    is(!(await pg.isChecked('#rptReal')), '확인에서 「취소」 하면 실명 칸이 다시 꺼진다');
    const tiny = await pg.evaluate(() => [...document.querySelectorAll('#rptPanel button, #rptPanel input')].filter((e) => e.type !== 'checkbox' && e.getBoundingClientRect().height < 44).length);
    is(tiny === 0, '결과지 창의 단추·칸이 44px 이상');
    is(!errs.length, '페이지 오류 0' + (errs.length ? ' — ' + errs.join(' / ') : ''));
    await b.close();
  }
  console.log('\n' + (bad ? '✗ ' + bad + '개 어긋남 — 고객 결과지를 믿을 수 없습니다' : '✓ 고객 결과지 — 계산기에서 가린 이름으로 열리고, 탭과 같은 연금을 말합니다'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
