# -*- coding: utf-8 -*-
"""12차 — 새로 넣은 자리들의 모양. 읽기 쉬운 것이 첫째 기준이다."""
import sys
sys.stdout.reconfigure(encoding="utf8")
S = open("book-final.html", encoding="utf8").read()

CSS = """
/* ── 로드맵 — 크게, 여백 넉넉히 ─────────────────────────── */
.rd-line{display:flex;align-items:center;gap:6px;margin:26px 0 20px}
.rd-line i{flex:1;height:2px;background:var(--line-2);border-radius:2px}
.rd-p{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;
  font-size:15px;font-weight:800;color:var(--g500);background:var(--fill);
  border:2px solid var(--line-2);flex:none}
.rd-p.on{color:#fff;background:var(--blue);border-color:var(--blue)}

.rd-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:6px 0 22px}
@media(max-width:760px){.rd-grid{grid-template-columns:1fr}}
.rd-c{border:1px solid var(--line);border-radius:20px;padding:24px 24px 22px;
  background:var(--bg);position:relative;border-top:4px solid var(--blue)}
.rd-2{border-top-color:#7C5CE6} .rd-3{border-top-color:var(--green)}
.rd-4{border-top-color:var(--amber)}
.rd-n{position:absolute;top:-2px;right:22px;font-size:56px;font-weight:800;
  color:var(--fill);line-height:1;letter-spacing:-.05em;pointer-events:none}
.rd-t{margin:2px 0 8px;font-size:25px;font-weight:800;letter-spacing:-.045em;
  color:var(--g900);line-height:1.25}
.rd-s{margin:0 0 16px;font-size:16.5px;line-height:1.7;color:var(--g700);font-weight:500}
.rd-s b{color:var(--g900)}
.rd-b{margin-top:14px}
.rd-k{margin:0 0 7px;font-size:12.5px;font-weight:800;color:var(--g500);
  letter-spacing:.03em}
.rd-u{margin:0;padding-left:18px}
.rd-u li{font-size:15.5px;line-height:1.72;color:var(--g700);font-weight:500;margin-bottom:3px}
.rd-w{display:flex;flex-wrap:wrap;gap:6px}
.rd-go{margin:16px 0 0;padding-top:14px;border-top:1px dashed var(--line-2);
  font-size:15px;line-height:1.7;color:var(--g600);font-weight:500}
.rd-go b{color:var(--blue-ink)}

.rd-note{background:var(--fill);border-radius:18px;padding:20px 24px;margin:22px 0}
.rd-nh{margin:0 0 8px;font-size:17px;font-weight:800;color:var(--g900);letter-spacing:-.03em}
.rd-note p{margin:0;font-size:16px;line-height:1.78;color:var(--g700);font-weight:500}
.rd-note p b{color:var(--g900)}

/* ── 이용 방향 — 흐르는 표 ──────────────────────────────── */
.ue-p{border:1px solid var(--line);border-radius:20px;overflow:hidden;margin:20px 0}
.ue-h{background:#101B29;padding:17px 24px;display:flex;align-items:baseline;
  gap:12px;flex-wrap:wrap}
.ue-mgr .ue-h{background:#1C2A3A}
.ue-who{font-size:22px;font-weight:800;color:#fff;letter-spacing:-.04em}
.ue-sub{font-size:14.5px;color:#9FB6CC;font-weight:600}
.ue-r{display:grid;grid-template-columns:130px 1fr 210px;gap:18px;
  padding:18px 24px;border-top:1px solid var(--line);align-items:start}
@media(max-width:820px){.ue-r{grid-template-columns:1fr;gap:10px;padding:18px}}
.ue-w b{display:block;font-size:17px;font-weight:800;color:var(--g900);letter-spacing:-.03em}
.ue-w span{display:block;font-size:13.5px;color:var(--blue-ink);font-weight:700;margin-top:2px}
.ue-sc{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:9px}
.ue-x{margin:0;font-size:16px;line-height:1.72;color:var(--g700);font-weight:500}
.ue-x b{color:var(--g900);font-weight:700}
.ue-d{background:var(--green-fill);border-radius:12px;padding:11px 14px}
.ue-d span{display:block;font-size:11.5px;font-weight:800;color:var(--green);
  letter-spacing:.03em;margin-bottom:3px}
.ue-d b{font-size:15px;font-weight:700;color:var(--g900);letter-spacing:-.02em;line-height:1.5}

/* ── 상담 ───────────────────────────────────────────────── */
.tk-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:20px 0}
@media(max-width:760px){.tk-two{grid-template-columns:1fr}}
.tk-t{border:1px solid var(--line);border-radius:18px;padding:22px 22px 20px;background:var(--bg)}
.tk-t1{border-top:4px solid var(--blue)} .tk-t2{border-top:4px solid #7C5CE6}
.tk-ic{font-size:26px;line-height:1}
.tk-t h3{margin:9px 0 2px;font-size:21px;font-weight:800;letter-spacing:-.04em;color:var(--g900)}
.tk-tl{margin:0 0 13px;font-size:13.5px;font-weight:800;color:var(--blue-ink);letter-spacing:.02em}
.tk-t2 .tk-tl{color:#7C5CE6}
.tk-t ul{margin:0;padding-left:18px}
.tk-t li{font-size:15.5px;line-height:1.72;color:var(--g700);font-weight:500;margin-bottom:6px}
.tk-t li b{color:var(--g900)}
.tk-when{margin:14px 0 0;padding-top:12px;border-top:1px dashed var(--line-2);
  font-size:15px;color:var(--g600);font-weight:500;line-height:1.7}
.tk-when b{color:var(--g900)}

.tk-deck{margin:20px 0}
.tk-ch{border-left:4px solid var(--ch);padding-left:20px;margin-bottom:26px}
.tk-ch-h{display:flex;align-items:baseline;gap:11px;margin-bottom:13px;flex-wrap:wrap}
.tk-no{font-size:11.5px;font-weight:800;color:var(--ch);letter-spacing:.08em}
.tk-ch-h b{font-size:20px;font-weight:800;color:var(--g900);letter-spacing:-.04em}
.tk-s{display:grid;grid-template-columns:78px 1fr;gap:16px;padding:15px 0;
  border-top:1px solid var(--line)}
@media(max-width:600px){.tk-s{grid-template-columns:1fr;gap:6px}}
.tk-sn{font-size:13px;font-weight:800;color:var(--g500);background:var(--fill);
  border-radius:8px;text-align:center;padding:5px 0;height:fit-content;
  font-variant-numeric:tabular-nums}
.tk-sb h4{margin:0 0 6px;font-size:17.5px;font-weight:800;color:var(--g900);
  letter-spacing:-.03em;line-height:1.4}
.tk-do{margin:0;font-size:16px;line-height:1.74;color:var(--g700);font-weight:500}
.tk-do b{color:var(--g900)}
.tk-tip{margin:9px 0 0;font-size:14.5px;line-height:1.7;color:var(--g600);
  background:var(--fill);border-radius:10px;padding:10px 13px;font-weight:500}
.tk-tip b{color:var(--blue-ink);margin-right:5px}

/* ── 고객 365일 ─────────────────────────────────────────── */
.cs-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0 26px}
@media(max-width:760px){.cs-grid{grid-template-columns:1fr}}
.cs-c{border:1px solid var(--line);border-radius:18px;padding:20px 22px;background:var(--bg)}
.cs-n{width:28px;height:28px;border-radius:9px;background:var(--blue);color:#fff;
  display:grid;place-items:center;font-size:14px;font-weight:800;margin-bottom:10px}
.cs-c h4{margin:0 0 8px;font-size:19px;font-weight:800;letter-spacing:-.04em;color:var(--g900)}
.cs-c p{margin:0;font-size:15.5px;line-height:1.74;color:var(--g700);font-weight:500}
.cs-c p b{color:var(--g900)}
.cs-x{margin-top:10px !important;background:var(--fill);border-radius:11px;
  padding:11px 13px;font-size:14.5px !important}
.cs-warn{background:var(--amber-fill)}
.cs-warn b{color:var(--amber)}

.cs-flow{display:flex;align-items:stretch;gap:8px;margin:18px 0 24px;flex-wrap:wrap}
.cs-f{flex:1;min-width:150px;border:1px solid var(--line);border-radius:14px;
  padding:14px 16px;background:var(--bg)}
.cs-f b{display:block;font-size:16.5px;font-weight:800;color:var(--g900);
  letter-spacing:-.03em;margin-bottom:4px}
.cs-f span{display:block;font-size:14px;color:var(--g600);font-weight:500;line-height:1.6}
.cs-ok{border-color:var(--green);background:var(--green-fill)}
.cs-ok b{color:var(--green)}
.cs-no{border-color:var(--red)} .cs-no b{color:var(--red)}
.cs-ar{align-self:center;color:var(--g500);font-weight:800;font-size:17px}
@media(max-width:760px){.cs-ar{display:none}}

@media print{
  .rd-c,.rd-note,.ue-r,.tk-t,.tk-s,.cs-c,.cs-f{break-inside:avoid}
  .rd-n{color:#F2F4F6}
}
"""
k = S.rfind("</style>")
S = S[:k] + CSS + S[k:]
open("book-final.html", "w", encoding="utf8").write(S)
print(f"CSS 추가 · {len(S.encode()):,} bytes")
