/* 🧭 상품전략기 「🔎 약관 분석」 공시실 어댑터 26곳 — 사장님 PC APEX_상품인사이트/_스킬/apex-insight/edge 의 bundle.mjs 가 만든다(adapters/*.mjs 를 Node 로 시험한 뒤). 여기서 고치지 말 것. */
const a_abl_life = (() => {
const BASE = 'https://www.abllife.co.kr';
const UA = { 'user-agent': 'APEX-insight/1.0' };
const txt = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const core = (s) => String(s || '').replace(/\s+/g, '').replace(/\([^)]*\)|\[[^\]]*\]/g, '').replace(/_?\d{4}$/, '').toLowerCase();
function groupsFor(q) {
if (/연금/.test(q)) return ['13', '11'];
if (/저축/.test(q)) return ['15', '13'];
if (/종신/.test(q)) return ['11', '14'];
return ['14', '11'];
}
return {
company: 'ABL생명',
hosts: ['www.abllife.co.kr'],
async find(q) {
const key = core(q);
let prods = [];
for (const g of groupsFor(String(q || ''))) {
const html = await (await fetch(`${BASE}/st/pban/prdtPban/whlPrdt/whlPrdt1/whlPrdt${g}?page=index`, { headers: UA })).text();
prods = [...html.matchAll(/href="(\/st\/pban\/prdtPban\/whlPrdt\?page=[0-9_]+)"[^>]*>\s*<span class="subject">([^<]*)<\/span>/g)]
.map((m) => ({ url: m[1], name: txt(m[2]) }))
.filter((p) => key && core(p.name).includes(key));
if (prods.length) break;
}
const out = [];
for (const p of prods.slice(0, 2)) {
const html = await (await fetch(BASE + p.url, { headers: UA })).text();
const tbody = (html.match(/판매기간, 사업방법서[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/) || [])[1] || '';
for (const tr of tbody.split(/<tr[\s>]/).slice(1)) {
const tds = tr.split(/<td[\s>]/).slice(1).map((td) => td.split('</td>')[0]);
if (tds.length < 4) continue;
const period = txt(tds[0].replace(/^[^<>]*?>/, ''));   // <td class=…> 의 남은 속성 꼬리 제거
for (const m of tds[3].matchAll(/href="([^"]+\.pdf)"/gi)) out.push({ title: p.name, period, ref: { path: m[1] } });
}
}
return out;
},
async pdf(ref) {
const path = /%[0-9A-Fa-f]{2}/.test(ref.path) ? ref.path : encodeURI(ref.path);
return fetch(BASE + path, { headers: UA });
},
};
})();
const a_aia_life = (() => {
const B = 'https://mypage.aia.co.kr';
const UA = 'APEX-insight/1.0';
const LIST = B + '/AIAHomepage/disclosure/our-products/selling/individual.do';
const strip = (s) => String(s || '').replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const ROMAN = { 'Ⅰ': 'I', 'Ⅱ': 'II', 'Ⅲ': 'III', 'Ⅳ': 'IV', 'Ⅴ': 'V', 'Ⅵ': 'VI', 'Ⅶ': 'VII', 'Ⅷ': 'VIII' };
const base = (s) => String(s || '').replace(/\((?:[^()]|\([^)]*\))*\)/g, (p) => (p === '(무)' ? '' : ' ')).replace(/무배당|AIA생명|AIA/gi, '')
.replace(/[ⅠⅡⅢⅣⅤⅥⅦⅧ]/g, (c) => ROMAN[c]).replace(/[\s_]/g, '').toLowerCase();
const parens = (s) => (String(s || '').replace(/\(무\)/g, '').replace(/\(구,[^)]*(\([^)]*\)[^)]*)*\)/g, '').match(/\(([^)]*)\)/g) || [])
.flatMap((p) => p.slice(1, -1).split(/[,\s/·-]+/)).filter(Boolean);
function score(title, q) {
const qa = parens(q);
let s = base(title) === base(q) ? 100 : 0;
for (const t of qa) if (title.includes(t)) s += 10;
for (const t of parens(title)) if (!qa.includes(t)) s -= 5;
return s;
}
const cells = (tr) => [...tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/gi)].map((m) => ({ attr: m[1], html: m[2] }));
const PERIOD = /(\d{8})\s*~\s*(\d{8}|현재)?/;
function parse(html) {
const rows = [];
for (const tb of html.split(/<table[\s>]/i).slice(1)) {
const head = (tb.match(/<thead>([\s\S]*?)<\/thead>/i) || [])[1];
if (!head) continue;
const hs = [...head.matchAll(/<th[^>]*>([\s\S]*?)<\/th>/gi)].map((m) => strip(m[1]).replace(/\s/g, ''));
const off = hs.indexOf('약관') - hs.indexOf('판매기간');
if (off <= 0) continue;
let name = '';
for (const tr of tb.split(/<tr[\s>]/i).slice(1)) {
const cs = cells(tr);
if (!cs.length) continue;
if (/text-left/.test(cs[0].attr)) name = strip(cs[0].html);
const p = cs.findIndex((c) => PERIOD.test(strip(c.html)));
if (p < 0 || !name) continue;
const per = strip(cs[p].html).match(PERIOD);
const yak = cs[p + off];
if (!yak) continue;
for (const m of yak.html.matchAll(/downLoad\('([^']+)'\s*,\s*'([^']+)'\)/g)) {
rows.push({ name, start: per[1], end: per[2] && per[2] !== '현재' ? per[2] : '', server: m[1], file: m[2] });
}
}
}
return rows;
}
const ymd = (s) => (s ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
return {
company: 'AIA생명',
hosts: ['mypage.aia.co.kr'],
async find(q) {
const r = await fetch(LIST, { headers: { 'user-agent': UA } });
const all = parse(await r.text());
const want = base(q);
const words = String(q || '').replace(/\((?:[^()]|\([^)]*\))*\)/g, ' ').split(/\s+/).map(base).filter(Boolean);
let hit = all.filter((x) => { const b = base(x.name); return (want && b.includes(want)) || (words.length > 0 && words.every((w) => b.includes(w))); });
if (!hit.length && want) hit = all.filter((x) => { const b = base(x.name); return b.length >= 4 && want.includes(b); });
const seen = new Set();
const out = [];
for (const x of hit) {
if (seen.has(x.server)) continue;
seen.add(x.server);
out.push({
title: x.name,
period: `${ymd(x.start)}~${ymd(x.end)}`,
file: x.file,
ref: { server: x.server, file: x.file },
_sc: score(x.name, q), _sale: x.end ? 0 : 1, _start: x.start,
});
}
out.sort((a, b) => b._sc - a._sc || b._sale - a._sale || (b._start > a._start ? 1 : b._start < a._start ? -1 : 0));
return out.map(({ _sc, _sale, _start, ...x }) => x);
},
async pdf(ref) {
if (!/\.pdf$/i.test(ref.server) || !/\.pdf$/i.test(ref.file)) throw new Error('AIA: pdf 파일만 받는다');
const u = `${B}/AIAHomepage/disclosure/download.do?serverFileNm=${encodeURIComponent(ref.server)}&usrFileNm=${encodeURIComponent(ref.file)}`;
return fetch(u, { headers: { 'user-agent': UA, referer: LIST } });
},
};
})();
const a_chubb = (() => {
const BASE = 'https://www.chubblife.co.kr';
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
async function list(q, cate, tab) {
const r = await fetch(BASE + '/front/official/sale/listSale.do', {
method: 'POST',
headers: FORM,
body: new URLSearchParams({ pageNo: '1', tabGubun: tab, searchCateCd: cate, searchCondition: 'pdtName', searchKeyword: q }),
});
if (!r.ok) throw new Error(`처브 목록 ${r.status}`);
const t = await r.text();
const out = [];
for (const m of t.matchAll(/<p class="ellipsis">([^<]*)<\/p>[\s\S]*?goPopup\('(\d+)','(\w+)'\)/g)) out.push({ name: unesc(m[1]), dis: m[2], type: m[3] });
return out;
}
async function versions(dis, type) {
const r = await fetch(BASE + '/front/official/sale/viewSaleAjax.do', {
method: 'POST',
headers: FORM,
body: new URLSearchParams({ disSeqNum: dis, disTypeCd: type }),
});
if (!r.ok) throw new Error(`처브 상세 ${r.status}`);
const j = await r.json();
return (j.salePopList || [])
.filter((x) => x.pdtClaufileSeqNum)
.sort((a, b) => String(b.salesStartDt).localeCompare(String(a.salesStartDt)));
}
return {
company: '처브라이프',
hosts: ['www.chubblife.co.kr'],
async find(q) {
let found = await list(q, '', '');
if (!found.length) found = await list(q, 'S5', '');
if (!found.length) found = await list(q, '', 'E');
const out = [];
for (const [i, p] of found.entries()) {
if (i < 2) {
for (const v of await versions(p.dis, p.type)) {
out.push({ title: v.pdtName || p.name, period: `${v.salesStartDt}~${v.salesEndDt || ''}`, ref: { file: v.pdtClaufileSeqNum } });
}
} else out.push({ title: p.name, period: '', ref: { dis: p.dis, type: p.type } });
}
return out;
},
async pdf(ref) {
let file = ref.file;
if (!file && ref.dis) file = (await versions(String(ref.dis), String(ref.type || 'S')))[0]?.pdtClaufileSeqNum;
if (!file || !/^[0-9a-zA-Z]+$/.test(file)) throw new Error('처브 약관 파일 없음');
return fetch(BASE + '/downloadFile.do', { method: 'POST', headers: FORM, body: new URLSearchParams({ fileSeqNum: file }) });
},
};
})();
const a_db_fire = (() => {
const U = 'https://www.idbins.com';
const H = { 'user-agent': 'APEX-insight/1.0', referer: U + '/FWMAIV1534.do' };
const unent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const ymd = (s) => String(s || '').replace(/\D/g, '');
return {
company: 'DB손해보험',
hosts: ['www.idbins.com'],
async find(q) {
const r = await fetch(U + '/insuPcPbanFindProductStep5_AX.do', {
method: 'POST',
headers: { ...H, 'content-type': 'application/json; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest' },
body: JSON.stringify({ searchCheck: '0', keyword: String(q).trim(), beginDate: '', endDate: '' }),
});
if (!r.ok) throw new Error('DB손보 검색 ' + r.status);
const rows = ((await r.json()).result || []).filter((x) => x.INPL_FINM);
rows.sort((a, b) => (b.ARC_PDC_SL_YN === '1') - (a.ARC_PDC_SL_YN === '1') || ymd(b.SALE_BEGIN_DAY).localeCompare(ymd(a.SALE_BEGIN_DAY)));
return rows.map((x) => ({
title: unent(x.PDC_NM),
period: x.SALE_BEGIN_DAY ? x.SALE_BEGIN_DAY + '~' + (x.ARC_PDC_SL_YN === '1' ? '' : ' (판매중지)') : '',
ref: { file: x.INPL_FINM },
}));
},
async pdf(ref) {
return fetch(U + '/cYakgwanDown.do?FilePath=InsProduct/' + encodeURIComponent(ref.file), { headers: H });
},
};
})();
const a_hana_fire = (() => {
const BASE = 'https://www.hanainsure.co.kr';
const PAGE = BASE + '/w/disclosure/product/saleProduct';
const ymd = (s) => (s && /^\d{8}$/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : '');
return {
company: '하나손해보험',
hosts: ['www.hanainsure.co.kr'],
async find(q) {
const p = await fetch(PAGE);
const cookie = p.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
await p.body?.cancel();
const r = await fetch(BASE + '/w/disclosure/product/searchProduct.json', {
method: 'POST',
headers: {
cookie,
referer: PAGE,
origin: BASE,
'content-type': 'application/json;charset=utf-8',
'x-requested-with': 'XMLHttpRequest',
},
body: JSON.stringify({ sKeyword: q, sSaleYn: '', sInsType: '', page: 1, pageSize: 200 }),
});
if (!r.ok) throw new Error(`하나손보 검색 ${r.status}`);
const j = await r.json();
if (!j.header?.success) throw new Error('하나손보 검색 실패: ' + (j.header?.message || ''));
const list = (j.body || []).filter((x) => x.sPolicyFileID);
list.sort((a, b) => (b.sSaleYn === 'Y') - (a.sSaleYn === 'Y') || String(b.sSaleStrDt).localeCompare(String(a.sSaleStrDt)));
return list.map((x) => ({
title: x.sPrdNm,
period: `${ymd(x.sSaleStrDt)}~${String(x.sSaleEndDt).startsWith('9999') ? '' : ymd(x.sSaleEndDt)}`,
ref: { id: x.sPolicyFileID },
}));
},
async pdf(ref) {
if (!/^[0-9a-zA-Z]+$/.test(ref.id)) throw new Error('잘못된 파일 id');
return fetch(`${BASE}/download/${ref.id}`, { headers: { referer: PAGE } });
},
};
})();
const a_hana_life = (() => {
const BASE = 'https://www.hanalife.co.kr';
const NRM = (s) => String(s || '').normalize('NFKC').toLowerCase()
.replace(/\(무\)|\(무\/갱\)|무배당/g, '').replace(/[\s·.,_\-–—/()[\]{}<>'"]/g, '');
const unparen = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)|\[[^\][]*\]/g, ' '); } while (s !== p); return s; };
function terms(q) {
let s = String(q || '').normalize('NFKC').split(/\s+[—–/]\s+|\s+-\s+/)[0].replace(/\(무\)|\(무\/갱\)|무배당/g, ' ');
const opt = [], req = [];
let p;   // 괄호 안(겹괄호는 안쪽부터) → 가산점
do { p = s; s = s.replace(/\(([^()]*)\)|\[([^\][]*)\]/g, (_, a, b) => { opt.push(...(a ?? b).split(/[·,]/)); return ' '; }); } while (s !== p);
for (let w of s.split(/\s+/)) {
const v = w.match(/^(.*[가-힣a-zA-Z])_?(2\d(?:0[1-9]|1[0-2]))$/);   // 판번호 꼬리
if (v) { opt.push(v[2]); w = v[1]; }
if (/^_?2\d(?:0[1-9]|1[0-2])$/.test(w)) { opt.push(w); continue; }
if (NRM(w)) req.push(NRM(w));
}
return { req, opt: opt.map(NRM).filter(Boolean) };
}
function hits(name, t) {
let best = { n: 0, len: 0 };
for (const n of [NRM(name), NRM(unparen(String(name || '')))]) {
let pos = 0, k = 0, len = 0;
for (const w of t.req) { const i = n.indexOf(w, pos); if (i < 0) break; k++; len += w.length; pos = i + w.length; }
if (k > best.n) best = { n: k, len };
}
const full = NRM(name);
return { ...best, opt: t.opt.filter((o) => full.includes(o)).length };
}
function pick(rows, q, nameOf) {
const t = terms(q);
if (!t.req.length) return [];
const sc = rows.map((r, i) => ({ r, i, w: NRM(nameOf(r)).length, ...hits(nameOf(r), t) }));
const top = Math.max(0, ...sc.map((x) => x.n));
return sc.filter((x) => x.n === top && x.n > 0 && x.len >= 4).sort((a, b) => b.opt - a.opt || a.w - b.w || a.i - b.i).map((x) => x.r);
}
const unesc = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const isDate = (s) => /^\d{4}\.\d{2}\.\d{2}\s*-/.test(s);
async function list(status) {
const r = await fetch(`${BASE}/anm/product/allProduct.do?status=${status}`);
if (!r.ok) throw new Error(`하나생명 목록 ${r.status}`);
const html = await r.text();
const body = html.slice(html.indexOf('<tbody'));
const out = [];
let name = '';
for (const tr of body.split(/<tr>/).slice(1)) {
const tds = [...tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)];
if (!tds.length) continue;
const nm = tds.find((m) => /txt-l/.test(m[1]) && !isDate(unesc(m[2])));
if (nm) name = unesc(nm[2]);
const pd = tds.find((m) => isDate(unesc(m[2])));
const last = tds[tds.length - 1][2];
if (!name || !pd) continue;
const period = unesc(pd[2]).replace(/\s*-\s*/, '~');
for (const m of last.matchAll(/\/anm\/product\/download\.do\?code=(\d+)&(?:amp;)?seq=(\d+)/g)) {
out.push({ title: name, period, ref: { code: m[1], seq: m[2] } });
}
}
return out;
}
return {
company: '하나생명',
hosts: ['www.hanalife.co.kr'],
async find(q) {
const [on, off] = await Promise.all([list('on'), list('off').catch(() => [])]);
const offHit = pick(off, q, (x) => x.title).sort((a, b) => b.period.localeCompare(a.period));
return [...pick(on, q, (x) => x.title), ...offHit];
},
async pdf(ref) {
if (!/^\d+$/.test(ref.code || '') || !/^\d+$/.test(ref.seq || '')) throw new Error('하나생명 약관 번호가 이상함');
return fetch(`${BASE}/anm/product/download.do?` + new URLSearchParams({ code: ref.code, seq: ref.seq }));
},
};
})();
const a_hanwha_life = (() => {
const WWW = 'https://www.hanwhalife.com/main/disclosure/goods/goodslist/';
const FILE = 'https://file.hanwhalife.com/www/announce/goods/download_chk.asp';
const H = {
'user-agent': 'APEX-insight/1.0',
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
'x-requested-with': 'XMLHttpRequest',
accept: 'application/json',
};
const MAX_GOODS = 3; // getList 1번 + getList3 최대 2번
async function post(path, form) {
const r = await fetch(WWW + path, { method: 'POST', headers: H, body: new URLSearchParams(form) });
if (!r.ok) throw new Error(`한화생명 ${path} ${r.status}`);
return r.json();
}
let REV;
function eucMap() {
if (REV) return REV;
REV = new Map();
const pairs = [];
for (let a = 0x81; a <= 0xfe; a++) for (let b = 0x41; b <= 0xfe; b++) pairs.push([a, b]);
const buf = new Uint8Array(pairs.length * 3);
pairs.forEach(([a, b], i) => buf.set([a, b, 0x0a], i * 3));
const out = new TextDecoder('euc-kr').decode(buf).split('\n');
pairs.forEach(([a, b], i) => {
const c = out[i];
if (c && c.length === 1 && c !== '�' && !REV.has(c)) REV.set(c, `%${a.toString(16).toUpperCase()}%${b.toString(16).toUpperCase()}`);
});
return REV;
}
function eucPct(s) {
const m = eucMap();
let o = '';
for (const ch of s) {
const cp = ch.codePointAt(0);
if (cp < 0x80) o += /[A-Za-z0-9_.~-]/.test(ch) ? ch : `%${cp.toString(16).toUpperCase().padStart(2, '0')}`;
else if (m.has(ch)) o += m.get(ch);
else throw new Error(`EUC-KR 로 못 바꾸는 글자: ${ch}`);
}
return o;
}
const rows3 = (j) => (Array.isArray(j?.list3) ? j.list3 : []);
return {
company: '한화생명',
hosts: ['www.hanwhalife.com', 'file.hanwhalife.com'],
async find(q) {
q = String(q || '').trim();
if (!q) return [];
let j = await post('getList.do', { schText: q, PType: '1', sellFlag: 'Y' });
let max = MAX_GOODS;
if (!j.list2?.length && /\s/.test(q)) {
q = q.replace(/\s+/g, '');
j = await post('getList.do', { schText: q, PType: '1', sellFlag: 'Y' });
max = MAX_GOODS - 1;
}
const goods = (Array.isArray(j.list2) ? j.list2 : []).slice(0, max);
let rows = rows3(j);
for (const g of goods) {
if (rows.some((x) => x.GOODS_NAME === g.GOODS_NAME)) continue; // 첫 상품의 판매이력은 getList 가 이미 줌
rows = rows.concat(rows3(await post('getList3.do', { schText: q, PType: '1', sellFlag: 'Y', goodsIndex: String(g.IDX) })));
}
const order = new Map(goods.map((g, i) => [g.GOODS_NAME, i]));
return rows
.filter((x) => x.FILE_NAME3 && String(x.FILE_NAME3).trim())
.map((x) => ({ ...x, end: String(x.SELL_END_DT || '').trim() }))
.sort((a, b) => (!b.end) - (!a.end) || String(b.SELL_START_DT).localeCompare(String(a.SELL_START_DT)) || (order.get(a.GOODS_NAME) ?? 9) - (order.get(b.GOODS_NAME) ?? 9))
.map((x) => ({
title: x.GOODS_NAME,
period: x.SELL_START_DT ? `${x.SELL_START_DT}~${x.end}` : '',
ref: { file_name: String(x.FILE_NAME3).trim() },
}));
},
async pdf(ref) {
const name = String(ref.file_name || '');
if (!name || /[\\/]|\.\./.test(name)) throw new Error('한화생명 파일명 형식 오류');
return fetch(FILE, {
method: 'POST',
headers: { 'user-agent': 'APEX-insight/1.0', 'content-type': 'application/x-www-form-urlencoded' },
body: `file_name=${eucPct(name)}`,
});
},
};
})();
const a_heungkuk_fire = (() => {
const BASE = 'https://www.heungkukfire.co.kr';
const LIST = BASE + '/FRW/announce/insGoodsGongsiSale.do';
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };
const unesc = (s) =>
s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
async function list(q, mode) {
const r = await fetch(LIST, { method: 'POST', headers: FORM, body: new URLSearchParams({ page: '1', mode, type: '1', searchvalue: q }) });
if (!r.ok) throw new Error(`흥국화재 목록 ${r.status}`);
const t = await r.text();
const out = [];
for (const row of t.split('<tr>').slice(1)) {
const nm = row.match(/class="t_left"><span>([^<]*)/);
if (!nm) continue;
const d = unesc(row.match(/class="fz14">([^<]*)/)?.[1] || '').replace(/\s*~\s*/, '~');
const period = d && !d.includes('~') ? d + '~' : d;
for (const m of row.matchAll(/fn_filedownX\('([^']*)',\s*'([^']*)',\s*'([^']*)'[^)]*\)[^>]*>([^<]*)</g)) {
const label = m[4].trim();
if (!label.includes('약관') || /사업방법|요약/.test(label)) continue;
out.push({ title: unesc(nm[1]), period, ref: { path: m[1], name: unesc(m[2]), save: m[3] } });
}
}
return out;
}
return {
company: '흥국화재',
hosts: ['www.heungkukfire.co.kr'],
async find(q) {
const [sale, stop] = await Promise.all([list(q, 'go'), list(q, 'stop')]);
return [...sale, ...stop]; // 판매중 먼저, 판매중지는 최근 판부터(공시실 순서 그대로)
},
async pdf(ref) {
if (!/^\/Upload\/[\w/]+\/$/.test(ref.path) || !/^[\w.-]+\.pdf$/i.test(ref.save)) throw new Error('잘못된 파일 경로');
return fetch(BASE + '/common/download.do', {
method: 'POST',
headers: FORM,
body: new URLSearchParams({ filePath: ref.path, fileRealName: ref.name, fileSaveName: ref.save, mode: 'View' }),
});
},
};
})();
const a_heungkuk_life = (() => {
const BASE = 'https://www.heungkuklife.co.kr';
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };
const NRM = (s) => String(s || '').normalize('NFKC').toLowerCase()
.replace(/\(무\)|\(무\/갱\)|무배당/g, '').replace(/[\s·.,_\-–—/()[\]{}<>'"]/g, '');
const unparen = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)|\[[^\][]*\]/g, ' '); } while (s !== p); return s; };
function terms(q) {
let s = String(q || '').normalize('NFKC').split(/\s+[—–/]\s+|\s+-\s+/)[0].replace(/\(무\)|\(무\/갱\)|무배당/g, ' ');
const opt = [], req = [];
let p;   // 괄호 안(겹괄호는 안쪽부터) → 가산점
do { p = s; s = s.replace(/\(([^()]*)\)|\[([^\][]*)\]/g, (_, a, b) => { opt.push(...(a ?? b).split(/[·,]/)); return ' '; }); } while (s !== p);
for (let w of s.split(/\s+/)) {
const v = w.match(/^(.*[가-힣a-zA-Z])_?(2\d(?:0[1-9]|1[0-2]))$/);   // 판번호 꼬리
if (v) { opt.push(v[2]); w = v[1]; }
if (/^_?2\d(?:0[1-9]|1[0-2])$/.test(w)) { opt.push(w); continue; }
if (NRM(w)) req.push(NRM(w));
}
return { req, opt: opt.map(NRM).filter(Boolean) };
}
function hits(name, t) {
let best = { n: 0, len: 0 };
for (const n of [NRM(name), NRM(unparen(String(name || '')))]) {
let pos = 0, k = 0, len = 0;
for (const w of t.req) { const i = n.indexOf(w, pos); if (i < 0) break; k++; len += w.length; pos = i + w.length; }
if (k > best.n) best = { n: k, len };
}
const full = NRM(name);
return { ...best, opt: t.opt.filter((o) => full.includes(o)).length };
}
function pick(rows, q, nameOf) {
const t = terms(q);
if (!t.req.length) return [];
const sc = rows.map((r, i) => ({ r, i, w: NRM(nameOf(r)).length, ...hits(nameOf(r), t) }));
const top = Math.max(0, ...sc.map((x) => x.n));
return sc.filter((x) => x.n === top && x.n > 0 && x.len >= 4).sort((a, b) => b.opt - a.opt || a.w - b.w || a.i - b.i).map((x) => x.r);
}
const enc2 = (s) => escape(encodeURIComponent(s));
async function ajax(flg, type1, type3) {
const body = `searchFlgSale=${flg}&beforeYn=${flg === 'N' ? 'N' : ''}&searchCdPublicPrtType1=${type1}&searchCdPublicPrtType2=`
+ `&searchCdPublicPrtType3=${enc2(type3.replace(/_/g, ' ').replace(/[+]/g, '%2b'))}&searchText=`;
const r = await fetch(BASE + '/front/public/saleProductAjax.do', { method: 'POST', headers: FORM, body });
if (!r.ok) throw new Error(`흥국생명 목록 ${r.status}`);
return new TextDecoder('euc-kr').decode(new Uint8Array(await r.arrayBuffer())).split('%||%');
}
const names = async (flg, type1) =>
(await ajax(flg, type1, ''))[0].split('%|%').map((x) => x.split('%,%')[0]).filter((x) => x && x !== 'null')
.map((name) => ({ name, flg, type1 }));
const dot = (s) => String(s || '').trim();
return {
company: '흥국생명',
hosts: ['www.heungkuklife.co.kr'],
async find(q) {
const [sale, stop] = await Promise.all([names('Y', 'I101'), names('N', 'I101')]);
let prods = [...pick(sale, q, (x) => x.name), ...pick(stop, q, (x) => x.name)];
if (!prods.length) prods = pick(await names('Y', 'I103'), q, (x) => x.name);
const out = [];
for (const [pi, p] of prods.slice(0, 2).entries()) {
const d = await ajax(p.flg, p.type1, p.name);
const rank = new Map();   // 판매판(시작일) 순번 — 같은 판의 주계약·갱신형 파일은 같은 순번
for (const row of String(d[2] || '').split('%|%')) {
const c = row.split('%,%');
if (c.length < 6 || !c[4] || c[4] === 'null') continue;
if (!rank.has(c[0])) rank.set(c[0], rank.size);
const tag = c[2].replace(/<[^>]*>/g, ' ').replace(/^[\sP\d~]+/, '').trim();   // 상품코드 칸의 「갱신형」 같은 구분
out.push({ title: p.name.trim() + (tag ? ` (${tag})` : ''), period: `${dot(c[0])}~${dot(c[1]) === 'null' ? '' : dot(c[1])}`, ref: { t: c[4] }, _o: rank.get(c[0]) * 10 + pi });
}
}
return out.sort((a, b) => a._o - b._o).map(({ _o, ...c }) => c);
},
async pdf(ref) {
if (!/^[A-Za-z0-9+/=]{20,600}$/.test(ref.t || '')) throw new Error('흥국생명 약관 토큰이 이상함');
const r = await fetch(BASE + '/servlet/DownLoadEnc.do', { method: 'POST', headers: FORM, body: new URLSearchParams({ encValue: ref.t }) });
if (/DOWN_LIMIT/.test(r.headers.get('content-disposition') || '')) throw new Error('흥국생명 공시실 하루 다운로드 횟수 초과');
return r;
},
};
})();
const a_hyundai_marine = (() => {
const BASE = 'https://www.hi.co.kr';
const MENU = '100932';
const ymd = (s) => {
const t = String(s || '').trim();
return /^\d{8}$/.test(t) ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6)}` : t;
};
async function xhi(tranId, request) {
const hex = Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
const gId = hex + String(Date.now()).padStart(18, '0');
const r = await fetch(BASE + '/ajax.xhi', {
method: 'POST',
headers: { 'content-type': 'application/json', referer: `${BASE}/serviceAction.do?menuId=${MENU}` },
body: JSON.stringify({ header: { gId, tranId, channelId: 'HI-HOME', clientIp: '127.0.0.1', menuId: MENU, loginId: null }, request }),
});
if (!r.ok) throw new Error(`현대해상 ${tranId} ${r.status}`);
const j = await r.json();
if (j.responseStatus?.exceptionOccurred) throw new Error(`현대해상 ${tranId} 오류`);
return (Array.isArray(j.data) ? j.data[0] : j.data) || {};
}
return {
company: '현대해상',
hosts: ['www.hi.co.kr'],
async find(q) {
const d = await xhi('HHCA0310M38S', { searchData: String(q), searchDate: '', searchType: '0', searchKeyword: 1 });
const pick = (arr, onSale) =>
(Array.isArray(arr) ? arr : [])
.filter((x) => x.clauApnflId)
.map((x) => ({ x, onSale, st: String(x.slStDt || '').trim() }));
return [...pick(d.slYProdList, 1), ...pick(d.slNProdList, 0)]
.sort((a, b) => b.onSale - a.onSale || b.st.localeCompare(a.st))
.map(({ x }) => ({
title: String(x.prodNm || '').trim(),
period: `${ymd(x.slStDt)}~${ymd(x.slEdDt)}`,
ref: { uuid: x.clauApnflId },
}));
},
async pdf(ref) {
if (!/^[0-9a-f-]{36}$/i.test(String(ref.uuid))) throw new Error('잘못된 uuid');
const f = await xhi('HHCA0310M26S', { apnflId: ref.uuid });
if (!f.savPath || !f.savFileNm || !/^\/[\w/]+$/.test(f.savPath)) throw new Error('현대해상 파일 정보 없음');
return fetch(`${BASE}/FileActionServlet/download/0${f.savPath}/${encodeURIComponent(f.savFileNm)}.${f.flExts || 'pdf'}`);
},
};
})();
const a_ibk_annuity = (() => {
const BASE = 'https://www.ibki.co.kr';
const NRM = (s) => String(s || '').normalize('NFKC').toLowerCase()
.replace(/\(무\)|\(무\/갱\)|무배당/g, '').replace(/[\s·.,_\-–—/()[\]{}<>'"]/g, '');
const unparen = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)|\[[^\][]*\]/g, ' '); } while (s !== p); return s; };
function terms(q) {
let s = String(q || '').normalize('NFKC').split(/\s+[—–/]\s+|\s+-\s+/)[0].replace(/\(무\)|\(무\/갱\)|무배당/g, ' ');
const opt = [], req = [];
let p;   // 괄호 안(겹괄호는 안쪽부터) → 가산점
do { p = s; s = s.replace(/\(([^()]*)\)|\[([^\][]*)\]/g, (_, a, b) => { opt.push(...(a ?? b).split(/[·,]/)); return ' '; }); } while (s !== p);
for (let w of s.split(/\s+/)) {
const v = w.match(/^(.*[가-힣a-zA-Z])_?(2\d(?:0[1-9]|1[0-2]))$/);   // 판번호 꼬리
if (v) { opt.push(v[2]); w = v[1]; }
if (/^_?2\d(?:0[1-9]|1[0-2])$/.test(w)) { opt.push(w); continue; }
if (NRM(w)) req.push(NRM(w));
}
return { req, opt: opt.map(NRM).filter(Boolean) };
}
function hits(name, t) {
let best = { n: 0, len: 0 };
for (const n of [NRM(name), NRM(unparen(String(name || '')))]) {
let pos = 0, k = 0, len = 0;
for (const w of t.req) { const i = n.indexOf(w, pos); if (i < 0) break; k++; len += w.length; pos = i + w.length; }
if (k > best.n) best = { n: k, len };
}
const full = NRM(name);
return { ...best, opt: t.opt.filter((o) => full.includes(o)).length };
}
function pick(rows, q, nameOf) {
const t = terms(q);
if (!t.req.length) return [];
const sc = rows.map((r, i) => ({ r, i, w: NRM(nameOf(r)).length, ...hits(nameOf(r), t) }));
const top = Math.max(0, ...sc.map((x) => x.n));
return sc.filter((x) => x.n === top && x.n > 0 && x.len >= 4).sort((a, b) => b.opt - a.opt || a.w - b.w || a.i - b.i).map((x) => x.r);
}
const unesc = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const isDate = (s) => /^\d{4}-\d{2}-\d{2}\s*~/.test(s);
async function list(page) {
const r = await fetch(`${BASE}/process/${page}`);
if (!r.ok) throw new Error(`IBK연금보험 목록 ${r.status}`);
const html = new TextDecoder('euc-kr').decode(new Uint8Array(await r.arrayBuffer()));
const out = [];
let name = '';
for (const tr of html.split(/<tr[\s>]/).slice(1)) {
const tds = [...tr.matchAll(/<td([^>]*)>([\s\S]*?)<\/td>/g)];
const nm = tds.find((m) => /txt_l/.test(m[1]));
if (nm) name = unesc(nm[2]);
const pd = tds.find((m) => isDate(unesc(m[2])));
const f = tr.match(/onDownload\('(HP_PBANO_PDT_SP)',\s*'(\d+)',\s*'#3'\)/);
if (name && pd && f) out.push({ title: name, period: unesc(pd[2]).replace(/\s*~\s*/, '~').replace(/~현재$/, '~'), ref: { seq: f[2] } });
}
return out;
}
return {
company: 'IBK연금보험',
hosts: ['www.ibki.co.kr'],
async find(q) {
const [on, off] = await Promise.all([list('HP_PBANO_PDT_SP_INDV'), list('HP_PBANO_PDT_NSP_INDV').catch(() => [])]);
const offHit = pick(off, q, (x) => x.title).sort((a, b) => b.period.localeCompare(a.period));
return [...pick(on, q, (x) => x.title), ...offHit];
},
async pdf(ref) {
if (!/^\d+$/.test(ref.seq || '')) throw new Error('IBK연금보험 약관 번호가 이상함');
return fetch(BASE + '/process/mFileDownload', {
method: 'POST',
headers: { 'content-type': 'application/x-www-form-urlencoded' },
body: new URLSearchParams({ pFidwSeq: ref.seq + '#3', pFilePath: 'HP_PBANO_PDT_SP' }),
});
},
};
})();
const a_im_life = (() => {
const BASE = 'https://www.imlifeins.co.kr';
const PAGE = `${BASE}/BA/BA_A020.do`;
const UA = { 'user-agent': 'APEX-insight/1.0' };
const cookieOf = (r) => (r.headers.getSetCookie?.() || []).map((c) => c.split(';')[0]).join('; ');
const txt = (s) => s.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function search(q, sellType) {
const r = await fetch(PAGE, {
method: 'POST',
headers: { ...UA, 'content-type': 'application/x-www-form-urlencoded' },
body: new URLSearchParams({ ddlSearch: '0', txtName: q, sellType }),
});
if (!r.ok) throw new Error(`iM라이프 공시실 ${r.status}`);
return parse(await r.text());
}
function parse(html) {
const out = [];
let name = '';
for (const tr of html.split(/<tr[\s>]/i).slice(1)) {
const row = tr.split(/<\/tr>/i)[0];
const al = row.match(/<td class="al"[^>]*>([\s\S]*?)<\/td>/i);
if (al) name = txt(al[1]);
const last = row.match(/<td class="last"[^>]*>([\s\S]*?)<\/td>/i);
if (!last) continue;
const file = last[1].match(/fileDownload\('([^']+)'\)/);
if (!file) continue;
const t = last[1].match(/title="([^"]*?)\s*보험약관 다운로드"/);
const plain = [...row.matchAll(/<td>([\s\S]*?)<\/td>/gi)].map((m) => txt(m[1]));
const [from = '', to = ''] = plain;
out.push({
title: name || (t && t[1].trim()) || "",
from: /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : '',
to: /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : '',
file: file[1],
});
}
return out;
}
return {
company: 'iM라이프',
hosts: ['www.imlifeins.co.kr'],
async find(q) {
q = String(q || '').trim();
if (!q) return [];
let rows = await search(q, '1'); // 판매 중
if (!rows.length && /\s/.test(q)) rows = await search(q.replace(/\s+/g, ''), '1');
if (!rows.length) rows = await search(q, '0'); // 판매 중지(지난 판)
const seen = new Set();
return rows
.filter((x) => !seen.has(x.file) && seen.add(x.file))
.sort((a, b) => (!b.to) - (!a.to) || b.from.localeCompare(a.from))
.map((x) => ({ title: x.title, period: x.from ? `${x.from}~${x.to}` : '', ref: { fileName: x.file } }));
},
async pdf(ref) {
const fileName = String(ref.fileName || '');
if (!fileName.startsWith('/Download/') || fileName.includes('..')) throw new Error('iM라이프 파일명 형식 오류');
const p = await fetch(PAGE, { headers: UA }); // 쿠키 받기
const cookie = cookieOf(p);
await p.body?.cancel();
return fetch(`${BASE}/www/downloadChk.do`, {
method: 'POST',
headers: { ...UA, 'content-type': 'application/x-www-form-urlencoded', referer: PAGE, ...(cookie ? { cookie } : {}) },
body: new URLSearchParams({ fileName }),
});
},
};
})();
const a_kb_fire = (() => {
const U = 'https://www.kbinsure.co.kr';
const H = { 'user-agent': 'APEX-insight/1.0', referer: U + '/CG802030001.ec' };
const FORM = { 'content-type': 'application/x-www-form-urlencoded' };
const dec = new TextDecoder('euc-kr');
const norm = (s) => String(s || '').toLowerCase().replace(/[\s·.\-_()\[\]]/g, '');
const unent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const ymd = (s) => (s && s.trim().length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
const base = (o) => new URLSearchParams({
devonTargetRow: '1', devonOrderBy: '', gubun: ' ', onsaleYn: ' ', bojongNo: '', bojongSeq: '', goodsNm: '',
search_onsale_yn: ' ', search_bojong_no: '', search_gubun: ' ', search_goods_nm: '', ...o,
});
async function post(path, params) {
const r = await fetch(U + path, { method: 'POST', headers: { ...H, ...FORM }, body: params });
if (!r.ok) throw new Error('KB손보 ' + path + ' ' + r.status);
const b = new Uint8Array(await r.arrayBuffer());
return { b, t: dec.decode(b) };
}
function rawFileNames(b) {
let s = '';
for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
return [...s.matchAll(/fileNm=([^"'&>\s]*)/g)].map((m) =>
[...m[1]].map((c) => { const k = c.charCodeAt(0); return /[A-Za-z0-9._~-]/.test(c) ? c : '%' + k.toString(16).toUpperCase().padStart(2, '0'); }).join(''));
}
async function detail(ref) {
const { b, t } = await post('/CG802030002.ec', base({ bojongNo: ref.no, gubun: ref.gubun, bojongSeq: ref.seq, onsaleYn: ref.onsale ? 'Y' : ' ' }));
const raws = rawFileNames(b);
let k = 0;
const marked = t.replace(/fileNm=[^"'&>\s]*/g, () => 'fileNm=@' + k++ + '@');
const title = unent((marked.match(/<td class="tit">([\s\S]*?)<\/td>/) || [])[1] || '');
const rows = [];
for (const tr of marked.split(/<tr>/).slice(1)) {
const d = [...tr.matchAll(/<td class="vfont_s02">([^<]*)<\/td>/g)].map((m) => m[1].trim());
const f = tr.match(/fileNm=@(\d+)@"[^>]*>\s*<img[^>]*alt="보험약관/);
if (d.length >= 1 && f) rows.push({ start: d[0], end: d[1] || '', file: raws[+f[1]] });
}
rows.sort((x, y) => y.start.localeCompare(x.start));
return { title, rows };
}
const G = { 1: '일반보험', 3: '퇴직보험', 4: '자동차보험', 5: '단체보험', 6: '개인연금', 7: '퇴직연금', a: '통합보험', b: '운전자보험', c: '상해보험', d: '질병보험', e: '화재/재물보험', f: '방카슈랑스', g: '제휴', h: '저축성보험', i: '독립특별약관', j: '제도성 특별약관', k: '기타보험' };
const period = (r) => (r ? `${ymd(r.start)}~${ymd(r.end)}` : '');
return {
company: 'KB손해보험',
hosts: ['www.kbinsure.co.kr'],
async find(q) {
const key = norm(q);
if (!key) return [];
let hits = [];
for (const onsale of ['Y', ' ']) { // 판매중에서 먼저, 없으면 전체(판매중지 포함)
const { t } = await post('/CG802030001.ec', base({ onsaleYn: onsale, search_onsale_yn: onsale, devonRowSize: onsale === 'Y' ? '2000' : '6000' }));
hits = [...t.matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>[\s\S]*?detail\('(\d+)','(\w*)','(\d+)'\);">([^<]*)</g)]
.map((m) => ({ onsale: !/판매중지/.test(m[1]), no: m[2], gubun: m[3], seq: m[4], name: unent(m[5]) }))
.filter((x) => norm(x.name).includes(key));
if (hits.length) break;
}
hits.sort((a, b) => b.onsale - a.onsale || (a.gubun === 'g') - (b.gubun === 'g') || +b.no - +a.no);
const out = await Promise.all(hits.map(async (h, i) => {
const ref = { no: h.no, gubun: h.gubun, seq: h.seq, onsale: h.onsale };
if (i >= 3) return { title: (G[h.gubun] ? '[' + G[h.gubun] + '] ' : '') + h.name, period: '', ref };
const d = await detail(ref);
const r = d.rows[0];
return { title: d.title || h.name, period: period(r), ref: { ...ref, file: r && r.file } };
}));
return out;
},
async pdf(ref) {
let file = ref.file;
if (!file) file = ((await detail(ref)).rows[0] || {}).file;
if (!file) throw new Error('KB손보 약관 파일 없음');
return fetch(U + '/CG802030003.ec?fileNm=' + file, { headers: H });
},
};
})();
const a_kb_life = (() => {
const BASE = 'https://www.kblife.co.kr';
const norm = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
async function list(tabType) {
const body = new URLSearchParams({ pageSize: '2000', paGroupCnt: '10', pageIndex: '1', tabType, srchType: '', pdNm: '' });
const r = await fetch(`${BASE}/customer-common/API/productList1.do`, {
method: 'POST',
headers: { 'user-agent': 'APEX-insight/1.0', 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest' },
body,
});
return (await r.json()).list || [];
}
return {
company: 'KB라이프',
hosts: ['www.kblife.co.kr'],
async find(q) {
const key = norm(q);
const out = [];
for (const tab of ['1', '2']) {
const rows = (await list(tab)).filter((x) => norm(x.NAME).includes(key));
for (const x of rows) {
const period = String(x.SALE_DATE || '').replace(/\//g, '.').trim();
const boxes = [['UPFILE2', '2'], ['UPFILE3', '8'], ['UPFILE4', '9']].filter(([f]) => x[f]);
boxes.forEach(([, box], i) => out.push({
title: x.NAME + (i ? ` (약관 ${i + 1})` : ''),
period,
ref: { seq: String(x.SEQNO), box },
_o: [+x.HEADER || 9, i],
}));
}
if (out.length) break;   // 판매상품에서 찾으면 판매중지 목록은 안 본다
}
out.sort((a, b) => a._o[0] - b._o[0] || a._o[1] - b._o[1]);
return out.map(({ _o, ...c }) => c);
},
async pdf(ref) {
return fetch(`${BASE}/api/archive/archives/download/product-terms/${encodeURIComponent(ref.seq)}/${encodeURIComponent(ref.box)}`, {
headers: { 'user-agent': 'APEX-insight/1.0' },
});
},
};
})();
const a_kyobo_life = (() => {
const BASE = 'https://www.kyobo.com';
const JSONH = { 'user-agent': 'APEX-insight/1.0', 'content-type': 'application/json; charset=UTF-8', 'x-requested-with': 'XMLHttpRequest' };
const squash = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
const core = (s) => squash(s).replace(/\([^)]*\)|\[[^\]]*\]/g, '');   // 괄호 묶음(무배당·간편·D 등) 제거
const post = async (path, body) => (await (await fetch(BASE + path, { method: 'POST', headers: JSONH, body: JSON.stringify(body) })).json()).body || {};
const listReq = (saleYn, searchTxt, size) => ({
dgtPdtAtrDvCd: 'M', dgtPdtAtrLclCd: '', dgtPdtAtrMclCd: '', dgtPdtAtrSmclCd: '', saleYn, dgtMseAddiPsYn: '',
searchTxt, currentPage: 1, pagePerSize: size, pageNumber: 1, deviceDv: 'PC',
});
const okDate = (d) => (d && d !== '0001-01-01 BC' ? d : '');
return {
company: '교보생명',
hosts: ['www.kyobo.com'],
async find(q) {
const a = squash(q), b = core(q);
const hit = (x) => { const n = x.dgtPdtAtrNm || ''; return squash(n).includes(a) || (b && core(n).includes(b)); };
let rows = ((await post('/dtc/product-official/find-allProductSearch', listReq('Y', '', 2000))).list || []).filter(hit);
if (!rows.length) {
const word = String(q || '').replace(/\([^)]*\)|\[[^\]]*\]/g, ' ').split(/\s+/).sort((x, y) => y.length - x.length)[0] || '';
rows = ((await post('/dtc/product-official/find-allProductSearch', listReq('N', word, 200))).list || []).filter(hit);
}
const out = [];
rows.forEach((x, i) => {
if (x.a2) out.push({ title: x.dgtPdtAtrNm, period: `${okDate(x.saleStDt)} ~ ${okDate(x.saleEdDt)}`.trim(), ref: { f: x.a2 }, _i: i });
});
const seen = new Set(out.map((c) => c.ref.f));
for (const x of rows.slice(0, 2)) {
try {
const d = await post('/dtc/product-official/find-allProductSearchDetail', { dgtPdtPdSeqtId: String(x.dgtPdtAtrSeqtId) });
(d.list2 || []).forEach((f, k) => {
if (!f || !f.temp02 || seen.has(f.temp02)) return;
seen.add(f.temp02);
const p = (d.list || [])[k] || {};
out.push({ title: x.dgtPdtAtrNm, period: `${okDate(p.saleStDt)} ~ ${okDate(p.saleEdDt)}`.trim(), ref: { f: f.temp02 }, _i: 1000 + k });
});
} catch {  }
}
return out.sort((p, r) => p._i - r._i).map(({ _i, ...c }) => c);
},
async pdf(ref) {
return fetch(`${BASE}/file/ajax/download?` + new URLSearchParams({ fName: '/dtc/pdf/mm/' + ref.f }), { headers: { 'user-agent': 'APEX-insight/1.0' } });
},
};
})();
const a_lina_fire = (() => {
const BASE = 'https://ec.aceinsurance.co.kr';
const NRM = (s) => String(s || '').normalize('NFKC').toLowerCase()
.replace(/\(무\)|\(무\/갱\)|무배당/g, '').replace(/[\s·.,_\-–—/()[\]{}<>'"]/g, '');
const unparen = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)|\[[^\][]*\]/g, ' '); } while (s !== p); return s; };
function terms(q) {
let s = String(q || '').normalize('NFKC').split(/\s+[—–/]\s+|\s+-\s+/)[0].replace(/\(무\)|\(무\/갱\)|무배당/g, ' ');
const opt = [], req = [];
let p;   // 괄호 안(겹괄호는 안쪽부터) → 가산점
do { p = s; s = s.replace(/\(([^()]*)\)|\[([^\][]*)\]/g, (_, a, b) => { opt.push(...(a ?? b).split(/[·,]/)); return ' '; }); } while (s !== p);
for (let w of s.split(/\s+/)) {
const v = w.match(/^(.*[가-힣a-zA-Z])_?(2\d(?:0[1-9]|1[0-2]))$/);   // 판번호 꼬리
if (v) { opt.push(v[2]); w = v[1]; }
if (/^_?2\d(?:0[1-9]|1[0-2])$/.test(w)) { opt.push(w); continue; }
if (NRM(w)) req.push(NRM(w));
}
return { req, opt: opt.map(NRM).filter(Boolean) };
}
function hits(name, t) {
let best = { n: 0, len: 0 };
for (const n of [NRM(name), NRM(unparen(String(name || '')))]) {
let pos = 0, k = 0, len = 0;
for (const w of t.req) { const i = n.indexOf(w, pos); if (i < 0) break; k++; len += w.length; pos = i + w.length; }
if (k > best.n) best = { n: k, len };
}
const full = NRM(name);
return { ...best, opt: t.opt.filter((o) => full.includes(o)).length };
}
function pick(rows, q, nameOf) {
const t = terms(q);
if (!t.req.length) return [];
const sc = rows.map((r, i) => ({ r, i, w: NRM(nameOf(r)).length, ...hits(nameOf(r), t) }));
const top = Math.max(0, ...sc.map((x) => x.n));
return sc.filter((x) => x.n === top && x.n > 0 && x.len >= 4).sort((a, b) => b.opt - a.opt || a.w - b.w || a.i - b.i).map((x) => x.r);
}
const unesc = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
async function list(status) {
const r = await fetch(`${BASE}/jsp/acelimited/notice/productNoticeV2.jsp?status=${status}`);
if (!r.ok) throw new Error(`라이나손보 목록 ${r.status}`);
const html = await r.text();
const out = [];
let name = '';
for (const tr of html.split(/<tr>/).slice(1)) {
const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
if (!tds.length) continue;
const lead = unesc(tds[0]);
if (!/^\d{4}\.\d{2}\.\d{2}\s*~/.test(lead)) { name = lead; tds.shift(); }
const period = unesc(tds[0] || '');
const f = tr.match(/WebProductFiledown\.jsp\?fileType=2&(?:amp;)?fileName=([^'"&]+)/);
if (name && f) out.push({ title: name, period, ref: { f: decodeURIComponent(f[1].replace(/\+/g, ' ')) } });
}
return out;
}
return {
company: '라이나손해보험',
hosts: ['ec.aceinsurance.co.kr'],
async find(q) {
const hit = pick(await list('Y'), q, (x) => x.title);
const first = new Map();
hit.forEach((x, i) => { if (!first.has(x.title)) first.set(x.title, i); });
return hit.map((x, i) => ({ x, g: first.get(x.title), i }))
.sort((a, b) => a.g - b.g || b.x.period.localeCompare(a.x.period) || a.i - b.i).map((o) => o.x);
},
async pdf(ref) {
const f = String(ref.f || '');
if (!/\.pdf$/i.test(f) || /[\/]|\.\./.test(f)) throw new Error('라이나손보 약관 파일명이 이상함');
return fetch(`${BASE}/jsp/file/WebProductFiledown.jsp?` + new URLSearchParams({ fileType: '2', fileName: f }));
},
};
})();
const a_lina_life = (() => {
const API = 'https://api.lina.co.kr/public/contents/v1/disclosure';
const WWW = 'https://www.lina.co.kr';
const NRM = (s) => String(s || '').normalize('NFKC').toLowerCase()
.replace(/\(무\)|\(무\/갱\)|무배당/g, '').replace(/[\s·.,_\-–—/()[\]{}<>'"]/g, '');
const unparen = (s) => { let p; do { p = s; s = s.replace(/\([^()]*\)|\[[^\][]*\]/g, ' '); } while (s !== p); return s; };
function terms(q) {
let s = String(q || '').normalize('NFKC').split(/\s+[—–/]\s+|\s+-\s+/)[0].replace(/\(무\)|\(무\/갱\)|무배당/g, ' ');
const opt = [], req = [];
let p;   // 괄호 안(겹괄호는 안쪽부터) → 가산점
do { p = s; s = s.replace(/\(([^()]*)\)|\[([^\][]*)\]/g, (_, a, b) => { opt.push(...(a ?? b).split(/[·,]/)); return ' '; }); } while (s !== p);
for (let w of s.split(/\s+/)) {
const v = w.match(/^(.*[가-힣a-zA-Z])_?(2\d(?:0[1-9]|1[0-2]))$/);   // 판번호 꼬리
if (v) { opt.push(v[2]); w = v[1]; }
if (/^_?2\d(?:0[1-9]|1[0-2])$/.test(w)) { opt.push(w); continue; }
if (NRM(w)) req.push(NRM(w));
}
return { req, opt: opt.map(NRM).filter(Boolean) };
}
function hits(name, t) {
let best = { n: 0, len: 0 };
for (const n of [NRM(name), NRM(unparen(String(name || '')))]) {
let pos = 0, k = 0, len = 0;
for (const w of t.req) { const i = n.indexOf(w, pos); if (i < 0) break; k++; len += w.length; pos = i + w.length; }
if (k > best.n) best = { n: k, len };
}
const full = NRM(name);
return { ...best, opt: t.opt.filter((o) => full.includes(o)).length };
}
function pick(rows, q, nameOf) {
const t = terms(q);
if (!t.req.length) return [];
const sc = rows.map((r, i) => ({ r, i, w: NRM(nameOf(r)).length, ...hits(nameOf(r), t) }));
const top = Math.max(0, ...sc.map((x) => x.n));
return sc.filter((x) => x.n === top && x.n > 0 && x.len >= 4).sort((a, b) => b.opt - a.opt || a.w - b.w || a.i - b.i).map((x) => x.r);
}
const ymd = (s) => (s && /^\d{8}$/.test(s) && !s.startsWith('9999') ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
const getJson = async (path, q) => {
const r = await fetch(`${API}/${path}?` + new URLSearchParams(q));
if (!r.ok) throw new Error(`라이나생명 ${path} ${r.status}`);
const j = await r.json();
return j.resultCode === '0' ? j.listDisclosure || [] : [];
};
const listQ = (mtrtDcd, searchKey) => ({ mtrtDcd, KliaProdClcd: '', KcisInsKcd: '', searchKey, inscd: '', prodPbanGrpCd: '', tabTitle: '' });
return {
company: '라이나생명',
hosts: ['api.lina.co.kr', 'www.lina.co.kr'],
async find(q) {
let prods = pick(await getJson('get-product-list', listQ('B', '')), q, (x) => x.insNm);
if (!prods.length) {
const w = [...terms(q).req].sort((a, b) => b.length - a.length)[0] || '';
if (w) prods = pick(await getJson('get-product-list', listQ('R', w.slice(0, 4))), q, (x) => x.insNm);
}
const out = [];
for (const [pi, p] of prods.slice(0, 3).entries()) {
const rows = await getJson('product-list-detail', { insureCd: p.insureCd, prodPbanGrpCd: p.prodPbanGrpCd || '' });
for (const [k, d] of rows.entries()) {
if (!/^[A-Z]\d+_\d+_P\.pdf$/.test(d.productProvision || '')) continue;
out.push({ title: d.insNm || p.insNm, period: `${ymd(d.sellOpnDt)}~${ymd(d.sellEndDt)}`, ref: { f: d.productProvision }, _o: k * 10 + pi });
}
}
return out.sort((a, b) => a._o - b._o).map(({ _o, ...c }) => c);
},
async pdf(ref) {
if (!/^[A-Z]\d+_\d+_P\.pdf$/.test(ref.f || '')) throw new Error('라이나생명 약관 파일명이 이상함');
return fetch(`${WWW}/cms/upload/upload/docs/disclosure/${ref.f}`);
},
};
})();
const a_lotte_fire = (() => {
const BASE = 'https://www.lotteins.co.kr';
const BODY =
'ops_tc=dfi.c.d.g.cmd.Cdg079Cmd&task=searchKey&rtnUri=/web/C/D/H/cdh190_result.jsp&issale=Y&srcPrdNm=';
const TTL = 10 * 60 * 1000;
let cache = null; // { at, rows }
const strip = (s) =>
s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const norm = (s) => s.toLowerCase().replace(/\s+/g, '');
async function allRows() {
if (cache && Date.now() - cache.at < TTL) return cache.rows;
const r = await fetch(BASE + '/CChannelSvl', {
method: 'POST',
headers: { 'content-type': 'application/x-www-form-urlencoded' },
body: BODY,
});
if (!r.ok) throw new Error(`롯데손보 목록 ${r.status}`);
const s = new TextDecoder('euc-kr').decode(await r.arrayBuffer());
const rows = [];
for (const part of s.split(/getElementById\("searchview/).slice(1)) {
const onSale = part.startsWith('issale');
for (const tr of part.split('<tr>').slice(1)) {
const td = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
if (td.length < 4) continue;
const file = td[3].match(/href=['"]?\/upload\/C\/newProduct\/([^\s'">]+)/)?.[1];
if (!file) continue;
const period = strip(td[2]).replace(/\s*~\s*/, '~').replace(/~현재$/, '~');
rows.push({ title: strip(td[1]), period, onSale, file });
}
}
cache = { at: Date.now(), rows };
return rows;
}
return {
company: '롯데손해보험',
hosts: ['www.lotteins.co.kr'],
async find(q) {
const toks = String(q).split(/\s+/).map(norm).filter(Boolean);
if (!toks.length) return [];
const seen = new Set();
return (await allRows())
.filter((x) => toks.every((t) => norm(x.title).includes(t)))
.filter((x) => !seen.has(x.title + x.period + x.file) && seen.add(x.title + x.period + x.file))
.sort((a, b) => b.onSale - a.onSale || b.period.localeCompare(a.period))
.map((x) => ({ title: x.title, period: x.period, ref: { file: x.file } }));
},
async pdf(ref) {
const f = String(ref.file);
if (!/^[^/\\?#]+\.pdf$/i.test(f) || f.includes('..')) throw new Error('잘못된 파일명');
return fetch(`${BASE}/upload/C/newProduct/${encodeURIComponent(f)}`);
},
};
})();
const a_metlife = (() => {
const B = 'https://brand.metlife.co.kr';
const UA = 'APEX-insight/1.0';
const LIST = B + '/pn/mcvrgProd/retrieveMcvrgProdMain.do';
const strip = (s) => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const base = (s) => String(s || '').replace(/메트라이프생명|\(무\)|무배당/g, '').replace(/\([^)]*\)/g, '').replace(/[\s_]/g, '');
const parens = (s) => (String(s || '').replace(/\(무\)/g, '').match(/\(([^)]*)\)/g) || [])
.flatMap((p) => p.slice(1, -1).split(/[,\s/·-]+/)).filter(Boolean);
function score(title, q) {
const qa = parens(q);
let s = base(title) === base(q) ? 100 : 0;
for (const t of qa) if (title.includes(t)) s += 10;
for (const t of parens(title)) if (!qa.includes(t)) s -= 5;
return s;
}
function collect(rows, q, ok) {
const out = [];
const seen = new Set();
for (const tr of rows) {
const m = tr.match(/mcvrgProdDownloadFile\.do\?insProdSeq=(\d+)&(?:amp;)?seq=(\d+)&(?:amp;)?fnum=03"[^>]*title='([^']*)'[^>]*>([\s\S]*?)<\/a>/);
if (!m) continue;
const [, insProdSeq, seq, rawTitle, rawFile] = m;
const key = insProdSeq + '/' + seq;
if (seen.has(key) || !ok(base(rawTitle))) continue;
seen.add(key);
const title = strip(rawTitle);
const p = tr.match(/(\d{4}\.\d{2}\.\d{2})\s*~\s*(\d{4}\.\d{2}\.\d{2})?/);
out.push({
title,
period: p ? `${p[1]}~${p[2] || ''}` : '',
file: strip(rawFile),
ref: { insProdSeq, seq },
_sc: score(title, q), _sale: p && !p[2] ? 1 : 0, _start: p ? p[1] : '',
});
}
return out;
}
return {
company: '메트라이프생명',
hosts: ['brand.metlife.co.kr'],
async find(q) {
const r = await fetch(LIST, { headers: { 'user-agent': UA } });
const rows = (await r.text()).split(/<tr[\s>]/i).slice(1);
const want = base(q);
const words = String(q || '').replace(/\(무\)|무배당|\([^)]*\)/g, ' ').split(/\s+/).map(base).filter(Boolean);
let out = collect(rows, q, (b) => (want && b.includes(want)) || (words.length > 0 && words.every((w) => b.includes(w))));
if (!out.length && want) out = collect(rows, q, (b) => b.length >= 4 && want.includes(b));
out.sort((a, b) => b._sc - a._sc || b._sale - a._sale || (b._start > a._start ? 1 : b._start < a._start ? -1 : 0));
return out.map(({ _sc, _sale, _start, ...x }) => x);
},
async pdf(ref) {
const u = `${B}/pn/mcvrgProd/mcvrgProdDownloadFile.do?insProdSeq=${encodeURIComponent(ref.insProdSeq)}&seq=${encodeURIComponent(ref.seq)}&fnum=03`;
return fetch(u, { headers: { 'user-agent': UA, referer: LIST } });
},
};
})();
const a_miraeasset_life = (() => {
const B = 'https://life.miraeasset.com';
const UA = 'APEX-insight/1.0';
const PAGE = B + '/micro/disclosure/product/PC-HO-080301-000000.do';
const clean = (s) => String(s || '')
.replace(/미래에셋생명/g, ' ')
.replace(/\(무\)|무배당/g, ' ')
.replace(/\([^)]*\)/g, ' ')
.replace(/\s+/g, ' ').trim();
const flat = (s) => String(s || '').replace(/미래에셋생명|\(무\)|무배당/g, '').replace(/[\s()]/g, '');
const parens = (s) => (String(s || '').replace(/\(무\)/g, '').match(/\(([^)]*)\)/g) || [])
.flatMap((p) => p.slice(1, -1).split(/[,\s/·]+/)).filter(Boolean);
function score(title, q) {
const qa = parens(q);
let s = flat(String(title).replace(/\([^)]*\)/g, '')) === flat(String(q).replace(/\([^)]*\)/g, '')) ? 100 : 0;
for (const t of qa) if (title.includes(t)) s += 10;
for (const t of parens(title)) if (!qa.some((x) => t === x)) s -= 5;
return s;
}
async function list(text3) {
const r = await fetch(B + '/micro/disclosure/selectWorkDvsnDataPaging.do', {
method: 'POST',
headers: {
'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
'x-requested-with': 'XMLHttpRequest',
accept: 'application/json, text/javascript, */*; q=0.01',
origin: B, referer: PAGE, 'user-agent': UA,
},
body: new URLSearchParams({ workDvsn: 'D', text1: '판매중인상품', text2: '', text3, pageNum: '0' }),
});
const t = await r.text();
if (!t.trim().startsWith('{')) throw new Error('미래에셋생명 공시실이 목록 대신 안내문을 돌려줌(공시실 중단?)');
return (JSON.parse(t).list || []).map((x) => { try { return JSON.parse(x.jsonData); } catch { return null; } }).filter(Boolean);
}
return {
company: '미래에셋생명',
hosts: ['life.miraeasset.com'],
async find(q) {
const c = clean(q) || String(q || '').trim();
let rows = await list(c);
if (!rows.length) {
const head = c.split(' ')[0].slice(0, 4);
if (head && head !== c) {
const all = await list(head);
const f = flat(c);
rows = all.filter((m) => flat(m.cell1).includes(f) || f.includes(flat(m.cell1)));
if (!rows.length) rows = all;
}
}
const seen = new Set();
const out = [];
for (const m of rows) {
const files = String(m.cell5 || '').split('\n').map((s) => s.trim()).filter(Boolean);
for (const fn of files) {
if (!/\.pdf$/i.test(fn) || seen.has(fn)) continue;
seen.add(fn);
out.push({
title: String(m.cell1 || '').trim(),
period: m.cell2 || m.cell3 ? `${m.cell2 || ''}~${m.cell3 || ''}` : '',
file: fn,
ref: { path: m.cell7 || '', file: fn },
_sc: score(String(m.cell1 || ''), q), _sale: m.cell3 ? 0 : 1, _start: m.cell2 || '',
});
}
}
out.sort((a, b) => b._sc - a._sc || b._sale - a._sale || (b._start > a._start ? 1 : b._start < a._start ? -1 : 0));
return out.map(({ _sc, _sale, _start, ...x }) => x);
},
async pdf(ref) {
return fetch(B + '/micro/cmmnFileDown.do', {
method: 'POST',
headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': UA, referer: PAGE, origin: B },
body: new URLSearchParams({
pathType: 'gongci_u1', fileName: ref.file, orgFileName: ref.file, filePath: '/uploadwas/life/' + ref.path,
}),
});
},
};
})();
const a_nh_fire = (() => {
const U = 'https://www.nhfire.co.kr';
const H = { 'user-agent': 'APEX-insight/1.0', referer: U + '/announce/productAnnounce/retrieveInsuranceProductsAnnounce.nhfire' };
const FORM = { ...H, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' };
const norm = (s) => String(s || '').toLowerCase().replace(/[\s·.\-_()\[\]]/g, '');
const unent = (s) => String(s || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
const ymd = (s) => (s && s.length === 8 && !/^(2999|9999)/.test(s) ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
const tag = (blk, k) => {
const a = blk.indexOf('<' + k + '>'), b = blk.indexOf('</' + k + '>');
if (a < 0 || b < a) return '';
return blk.slice(a + k.length + 2, b).replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '').trim();
};
async function list(sel) {
const r = await fetch(U + '/announce/productAnnounce/retrieveInsuranceProductsAnnounceSearch.nhfire', {
method: 'POST', headers: FORM, body: new URLSearchParams({ pdtSelYn: sel, basicDate: '', flag: '', searchWord: '' }),
});
if (!r.ok) throw new Error('NH손보 목록 ' + r.status);
const t = await r.text();
return [...t.matchAll(/fnRetrievePdtInfo\('([^']+)',this\)">([\s\S]*?)<\/a>/g)].map((m) => ({ cd: m[1], name: unent(m[2]), onsale: sel === 'Y' }));
}
async function info(cd) {
const r = await fetch(U + '/front/announce/retrievePdtInfo.ajax', { method: 'POST', headers: FORM, body: new URLSearchParams({ type: 'ajax', fileType: '05', pdtCd: cd }) });
if (!r.ok) throw new Error('NH손보 상품정보 ' + r.status);
const x = await r.text();
return [...x.matchAll(/<LMultiData[^>]*>([\s\S]*?)<\/LMultiData>/g)].map((m) => m[1])
.map((b) => ({
title: (tag(b, 'ntgDivdYn') === 'Y' ? '(무)' : '') + tag(b, 'pdtNm') + tag(b, 'addPdtNm'),
start: tag(b, 'pdtSelStDt'), end: tag(b, 'pdtSelEdDt'), cfmt: tag(b, 'cfmtYn'),
fileId: tag(b, 'fileId'), seq: tag(b, 'plcndAfileSeqn'), file: tag(b, 'plcndAfileNm'),
}))
.filter((v) => (v.cfmt === 'Y' || v.cfmt === '') && v.fileId && v.seq && v.file)
.sort((a, b) => b.start.localeCompare(a.start));
}
return {
company: 'NH농협손해보험',
hosts: ['www.nhfire.co.kr'],
async find(q) {
const key = norm(q);
if (!key) return [];
let hits = [];
for (const sel of ['Y', 'N']) {
hits = (await list(sel)).filter((x) => norm(x.name).includes(key));
if (hits.length) break;
}
const yymm = (s) => +((s.match(/(\d{4})(?:\([^)]*\))?\s*$/) || [])[1] || 0);
hits.sort((a, b) => yymm(b.name) - yymm(a.name));
return Promise.all(hits.map(async (h, i) => {
if (i >= 2) return { title: h.name, period: '', ref: { cd: h.cd } };
const v = (await info(h.cd))[0];
if (!v) return { title: h.name, period: '', ref: { cd: h.cd } };
return { title: v.title || h.name, period: `${ymd(v.start)}~${ymd(v.end)}`, ref: { cd: h.cd, fileId: v.fileId, seq: v.seq } };
}));
},
async pdf(ref) {
let { fileId, seq } = ref;
if (!fileId) ({ fileId, seq } = (await info(ref.cd))[0] || {});
if (!fileId) throw new Error('NH손보 약관 파일 없음');
return fetch(U + '/imageView/downloadFile.ajax', { method: 'POST', headers: FORM, body: new URLSearchParams({ fileId, afileSeqn: seq }) });
},
};
})();
const a_nh_life = (() => {
const BASE = 'https://www.nhlife.co.kr';
const UA = 'APEX-insight/1.0';
const FORM = { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' };
const dec = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const cookieOf = (r) => (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map((c) => c.split(';')[0]).join('; ');
return {
company: 'NH농협생명',
hosts: ['www.nhlife.co.kr'],
async find(q) {
q = String(q || '').trim();
let names = [], cookie = '', useyn = 'Y';
for (useyn of ['Y', '']) {
const r = await fetch(`${BASE}/ho/on/HOON0004M00.nhl`, {
method: 'POST', headers: FORM,
body: new URLSearchParams({ prsPagcn: '1', useyn, prodDcd: '', prodnm: q }),
});
cookie = cookieOf(r) || cookie;
const html = await r.text();
names = [...new Set([...html.matchAll(/goAnonm\(this\.value,\s*'\d+'\);"\s+value="([^"]*)"/g)].map((m) => m[1]))];
if (names.length) break;
}
const out = [];
for (const raw of names.slice(0, 3)) {
const r = await fetch(`${BASE}/ho/on/HOON0004P10.nhl`, {
method: 'POST', headers: cookie ? { ...FORM, cookie } : FORM,
body: new URLSearchParams({ prsPagcn: '1', selProdNm: dec(raw), useyn, prodDcd: '', prodnm: q }),
});
const html = await r.text();
const tbody = (html.match(/<tbody[\s\S]*?<\/tbody>/) || [''])[0];
for (const tr of tbody.split(/<tr[\s>]/).slice(1)) {
const tds = tr.split(/<td[\s>]/).slice(1);
if (tds.length < 4) continue;
const period = dec(tds[0].split('</td>')[0]);
for (const m of tds[3].matchAll(/popupPdfViewer\('([^']+)',\s*'(\d+)'\)/g)) {
out.push({ title: dec(raw), period, ref: { apdFlid: m[1], fileSeqn: m[2] } });
}
}
}
return out;
},
async pdf(ref) {
return fetch(`${BASE}/pdfViewer.nhl?` + new URLSearchParams({ apdFlid: ref.apdFlid, fileSeqn: ref.fileSeqn }), {
headers: { 'user-agent': UA },
});
},
};
})();
const a_samsung_fire = (() => {
const U = 'https://www.samsungfire.com';
const H = { 'user-agent': 'APEX-insight/1.0', referer: U + '/' };
const norm = (s) => String(s || '').toLowerCase().replace(/[\s·.\-_()\[\]]/g, '');
const ymd = (s) => (s && s.length === 8 && !s.startsWith('9999') ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
return {
company: '삼성화재',
hosts: ['www.samsungfire.com'],
async find(q) {
const key = norm(q);
if (!key) return [];
const r = await fetch(U + '/vh/data/VH.HDIF0114.do', { headers: { ...H, accept: 'application/json' } });
if (!r.ok) throw new Error('삼성화재 목록 ' + r.status);
const list = (await r.json())?.responseMessage?.body?.data?.list || [];
const onsale = (x) => !x.saleEnDt || x.saleEnDt.startsWith('9999');
return list
.filter((x) => x.prdfilename1 && norm(x.prdName).includes(key))
.sort((a, b) => onsale(b) - onsale(a) || String(b.saleStDt).localeCompare(String(a.saleStDt)))
.map((x) => ({ title: x.prdName, period: `${ymd(x.saleStDt)}~${ymd(x.saleEnDt)}`, ref: { path: x.prdfilename1 } }));
},
async pdf(ref) {
if (!/^\/publication\/pdf\/[\w.-]+\.pdf$/i.test(ref.path || '')) throw new Error('삼성화재 약관 경로가 이상함');
return fetch(U + ref.path, { headers: H });
},
};
})();
const a_samsung_life = (() => {
const UA = { 'user-agent': 'APEX-insight/1.0', accept: 'application/json' };
const LIST = 'https://www.samsunglife.com/gw/api/product/disclosure/product/prdt/salesAllPrdtList';
const PCMS = 'https://pcms.samsunglife.com';
const d = (s) => (s && /^\d{8}$/.test(s) && s !== '99999999' ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : '');
async function list(q) {
const u = `${LIST}?pageNo=1&pageRows=300&goodsName=${encodeURIComponent(q)}`;
const r = await fetch(u, { headers: UA });
if (!r.ok) throw new Error(`삼성생명 목록 ${r.status}`);
const j = await r.json();
return Array.isArray(j.response) ? j.response : [];
}
return {
company: '삼성생명',
hosts: ['www.samsunglife.com', 'pcms.samsunglife.com'],
async find(q) {
q = String(q || '').trim();
if (!q) return [];
let rows = await list(q);
if (!rows.length && /\s/.test(q)) rows = await list(q.replace(/\s+/g, '')); // 공시실 상품명엔 띄어쓰기가 없다
return rows
.filter((x) => x.filename3)
.sort((a, b) => (b.todate === '99999999') - (a.todate === '99999999') || String(b.fromdate).localeCompare(String(a.fromdate)))
.map((x) => ({
title: x.goodsName,
period: x.fromdate ? `${d(x.fromdate)}~${d(x.todate)}` : '',
ref: { docID: x.filename3 },
}));
},
async pdf(ref) {
const id = String(ref.docID || '');
if (!/^\d+$/.test(id)) throw new Error('삼성생명 docID 형식 오류');
const v = await fetch(`${PCMS}/XView.do?docID=${id}`, { headers: { 'user-agent': 'APEX-insight/1.0' } });
const html = await v.text();
const m = html.match(/uploadDir\/doc\/[0-9A-Za-z_\/.-]+?\.pdf/);
if (!m) throw new Error('삼성생명 약관 경로를 찾지 못함');
return fetch(`${PCMS}/${m[0]}`, { headers: { 'user-agent': 'APEX-insight/1.0' } });
},
};
})();
const a_shinhan_life = (() => {
const BASE = 'https://www.shinhanlife.co.kr';
const CAT = 'M160991914330045272'; // 공시실 > 상품공시 > 전체상품 > 판매중
const H = {
'user-agent': 'APEX-insight/1.0',
'content-type': 'application/json; charset=UTF-8',
'X-AJAX-CALL': 'true',
'Proworks-Body': 'Y',
'Proworks-Lang': 'ko',
accept: 'application/json',
};
const MAX_HIST = 2; // 목록 1번 + 지난 판 조회 최대 2번
async function call(trId, elData) {
const body = { elData: { catId: CAT, pageSize: 50, pageIndex: 1, scrnId: 'cdhi0030', ...elData }, userHeader: { scrnId: 'cdhi0030', appliDtptDutjCd: 'DH' } };
const r = await fetch(`${BASE}/${trId}.pwkjson`, { method: 'POST', headers: H, body: JSON.stringify(body) });
if (!r.ok) throw new Error(`신한라이프 ${trId} ${r.status}`);
const j = await r.json();
return Array.isArray(j?.elData?.nodeInfoVoList) ? j.elData.nodeInfoVoList : [];
}
const d = (s) => (s && /^\d{8}/.test(s) && !s.startsWith('9999') ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}` : '');
const isYakgwan = (p) => /\.pdf$/i.test(p || '') && !/요약서|방법서/.test(String(p).split('/').pop());
return {
company: '신한라이프',
hosts: ['www.shinhanlife.co.kr'],
async find(q) {
q = String(q || '').trim();
if (!q) return [];
const cur = await call('co/wcms/nodeInfoListPage', { method: 'selectListGoods', meta02: '', meta03: '', title: q, meta06: 'TRUE' });
let rows = cur.slice();
const seenName = new Set();
for (const x of cur) {
if (seenName.size >= MAX_HIST) break;
if (seenName.has(x.meta05) || !(Number(x.meta15) > 1)) continue;
seenName.add(x.meta05);
rows = rows.concat(await call('co/wcms/nodeInfoList', { method: 'selectAllListGoods', meta02: x.meta02, meta03: x.meta03, meta05: x.meta05, title: q, meta06: 'TRUE' }));
}
const seen = new Set();
return rows
.filter((x) => isYakgwan(x.meta11)) // 약관 칸에 요약서가 잘못 들어간 지난 판은 뺀다
.filter((x) => !seen.has(x.meta11) && seen.add(x.meta11)) // TM/일반 채널은 같은 파일
.sort((a, b) => String(b.meta08).localeCompare(String(a.meta08)) || String(b.meta07).localeCompare(String(a.meta07)))
.map((x) => ({
title: x.meta05,
period: x.meta07 ? `${d(x.meta07)}~${d(x.meta08)}` : '',
ref: { path: x.meta11, wsId: x.wsId || 'DigitalPlattform' },
}));
},
async pdf(ref) {
let p = String(ref.path || '');
const ws = String(ref.wsId || 'DigitalPlattform');
if (!p.startsWith(`/repo/${ws}/`) || p.includes('..')) throw new Error('신한라이프 약관 경로 형식 오류');
p = p.replace(`/repo/${ws}`, '/bizxpress');
return fetch(BASE + encodeURI(p), { headers: { 'user-agent': 'APEX-insight/1.0' } });
},
};
})();
const a_tongyang_life = (() => {
const BASE = 'https://pbano.myangel.co.kr';
const UA = 'APEX-insight/1.0';
const FORM = { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' };
const txt = (s) => String(s || '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const ymd = (s) => (s && s.length >= 8 ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : '');
return {
company: '동양생명',
hosts: ['pbano.myangel.co.kr'],
async find(q) {
const word = String(q || '').replace(/^\s*(\(무\)|무배당)\s*/, '').trim();
const words = [...new Set([word, word.replace(/\([^)]*\)/g, '').trim()])].filter(Boolean);
let html = '', cookie = '';
for (const w of words) {
const r = await fetch(`${BASE}/paging/WE_AC_WEPAAP020100L`, {
method: 'POST', headers: FORM,
body: new URLSearchParams({ _biz_op_code: 'IQY', pagenum: '1', sale_kind: 'ALL', goods_kind: 'ALL', nameStr: w, saleCode: 'ALL', goodsCode: 'ALL', searchWord: w }),
});
cookie = (r.headers.getSetCookie ? r.headers.getSetCookie() : []).map((c) => c.split(';')[0]).join('; ');
html = await r.text();
if (/selectDetailGoods\(this/.test(html)) break;
}
const out = [], prods = [];
for (const tr of html.split(/<tr[\s>]/).slice(1)) {
const g = tr.match(/selectDetailGoods\(this,\s*'([^']*)',\s*'\d+',\s*'(\d+)'/);
if (!g) continue;
const tds = tr.split(/<td[\s>]/).slice(1).map((td) => td.split('</td>')[0]);
const start = txt(tds[4]), end = txt(tds[5]);
const yak = tr.match(/MasFiledownload\('_N',\s*'([^']+)'\)"?\s*>\s*<img[^>]*alt="보험약관/);
prods.push({ name: g[1], kind: g[2] });
if (yak) out.push({ title: g[1], period: start ? `${start} ~ ${end}`.trim() : '', ref: { id: yak[1] } });
}
const seen = new Set(out.map((c) => c.ref.id));
for (const p of prods.slice(0, 2)) {
try {
const d = await fetch(`${BASE}/process/WE_AC_WEPAAP020100D`, {
method: 'POST', headers: cookie ? { ...FORM, cookie } : FORM,
body: new URLSearchParams({ _biz_op_code: 'IQY_D', GOODS_NM: p.name, SALE_KIND: p.kind }),
});
const j = JSON.parse((await d.text()).trim());
for (const v of (j.dw && j.dw.dw_00) || []) {
if (!v.FILE_GRP_ID3 || seen.has(v.FILE_GRP_ID3)) continue;
seen.add(v.FILE_GRP_ID3);
out.push({ title: v.GOODS_NM || p.name, period: `${ymd(v.SALE_START_DT)} ~ ${ymd(v.SALE_FINISH_DT)}`, ref: { id: v.FILE_GRP_ID3 } });
}
} catch {  }
}
return out;
},
async pdf(ref) {
return fetch(`${BASE}/process/CO_ComDownload`, {
method: 'POST', headers: FORM,
body: new URLSearchParams({ _biz_op_code: 'FDL', FILE_GRP_ID: ref.id, FILE_PATH: '', FILE_NAME: '', USER_FILE_NM: '' }),
});
},
};
})();
export default { 'abl-life': a_abl_life, 'aia-life': a_aia_life, 'chubb': a_chubb, 'db-fire': a_db_fire, 'hana-fire': a_hana_fire, 'hana-life': a_hana_life, 'hanwha-life': a_hanwha_life, 'heungkuk-fire': a_heungkuk_fire, 'heungkuk-life': a_heungkuk_life, 'hyundai-marine': a_hyundai_marine, 'ibk-annuity': a_ibk_annuity, 'im-life': a_im_life, 'kb-fire': a_kb_fire, 'kb-life': a_kb_life, 'kyobo-life': a_kyobo_life, 'lina-fire': a_lina_fire, 'lina-life': a_lina_life, 'lotte-fire': a_lotte_fire, 'metlife': a_metlife, 'miraeasset-life': a_miraeasset_life, 'nh-fire': a_nh_fire, 'nh-life': a_nh_life, 'samsung-fire': a_samsung_fire, 'samsung-life': a_samsung_life, 'shinhan-life': a_shinhan_life, 'tongyang-life': a_tongyang_life };
