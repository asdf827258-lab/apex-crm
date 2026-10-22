/* ✏️ <b>직접 그린 선 그림 한 벌</b> — 이모지를 걷어낸 자리에 섭니다.

   사장님 말씀 2026-10-21 — 「이모지 선 그림으로 바꿔줘」 ·
   고르신 것 「<b>전부 선 그림으로</b> — 아래 띠도 같이 바꿉니다」.

   ★★ 왜 바꾸나 — 재어 보니 한 화면에 이모지가 <b>최대 58가지</b> 섞여
     있었고, 메뉴 하나만 해도 <b>74가지</b>였습니다. 이모지는 기기마다
     굵기·색·크기가 달라 줄이 들쭉날쭉하고, <b>인쇄에서 뭉개집니다</b>.
     우리가 뽑은 종이를 우리가 다시 읽는 앱이라 더 그렇습니다 (4-1번).
   ★ CLAUDE.md 9번 — 「남의 자료 삽화를 복제하지 않는다 — <b>직접 SVG 로
     그린다</b>. 사진은 인쇄에서 뭉개지고 화면 크기마다 달라지지만, SVG 는
     어디서나 같은 선으로 선다.」 여기 선은 전부 손으로 적은 좌표입니다.

   ── 꼴 ──────────────────────────────────────────────────────────
     · 24×24 칸 · 선 굵기 <b>1.8</b> · 끝과 모서리는 둥글게
     · 색은 <b>글자색을 따릅니다</b>(currentColor) — 켜진 칸은 저절로 같이 켜집니다
     · 칠하지 않습니다(fill:none) — 작게 줄여도 안 뭉갭니다

   ── 왜 74가지를 30가지로 줄이나 ────────────────────────────────
     이모지가 74가지라는 것 자체가 <b>문제의 다른 얼굴</b>입니다. 📕📘📒📓
     를 따로 기억할 사람은 없습니다. 뜻이 같은 것은 <b>한 그림</b>으로 모으고,
     어느 이모지가 어느 그림이 되는지는 아래 <b>표 하나</b>가 압니다 (5번).

   ⚠ 여기 없는 이모지는 <b>그대로 둡니다</b> — 모르는 것을 아무 그림에나
     붙이면 엉뚱한 그림이 서고, 그것이 이모지보다 나쁩니다 (1번).          */
var APEX_ICON = {
  /* 사람·집 */
  home:   '<path d="M3.6 10.6 12 4l8.4 6.6"/><path d="M6 9.8V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.8"/>',
  user:   '<circle cx="12" cy="8" r="3.3"/><path d="M4.8 20c.6-3.7 3.6-5.5 7.2-5.5S18.6 16.3 19.2 20"/>',
  users:  '<circle cx="9" cy="8.4" r="3"/><path d="M3 19.5c.5-3.2 3-4.8 6-4.8s5.5 1.6 6 4.8"/><path d="M16 5.6a3 3 0 0 1 0 5.6"/><path d="M17.4 14.9c2 .6 3.3 2.1 3.6 4.6"/>',
  teacher:'<path d="M3.5 8.6 12 4.6l8.5 4-8.5 4z"/><path d="M7.5 10.6v4.2c0 1.5 2 2.6 4.5 2.6s4.5-1.1 4.5-2.6v-4.2"/><path d="M20.5 8.6v5"/>',
  /* 고객·카드 */
  card:   '<rect x="3" y="5.5" width="18" height="13" rx="2.4"/><path d="M3 10h18"/><path d="M6.6 14.2h4"/>',
  idcard: '<rect x="3" y="4.6" width="18" height="14.8" rx="2.4"/><circle cx="8.6" cy="10.4" r="2"/><path d="M5.4 16.4c.4-1.6 1.7-2.4 3.2-2.4s2.8.8 3.2 2.4"/><path d="M14.6 9.6h4M14.6 13.2h4"/>',
  /* 도구·글 */
  tools:  '<rect x="3" y="7.4" width="18" height="12" rx="2.2"/><path d="M9 7.4V5.6a1.4 1.4 0 0 1 1.4-1.4h3.2A1.4 1.4 0 0 1 15 5.6v1.8"/><path d="M3 12.6h18"/>',
  pen:    '<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z"/><path d="M14 6.4 17.6 10"/>',
  doc:    '<path d="M6 3.4h7.4L18.6 8.6V20a.9.9 0 0 1-.9.9H6a.9.9 0 0 1-.9-.9V4.3A.9.9 0 0 1 6 3.4z"/><path d="M13.2 3.6v5.2h5.2"/><path d="M8.4 13h7M8.4 16.4h5"/>',
  book:   '<path d="M4.4 5.2A2 2 0 0 1 6.4 3.4H19v15.2H6.4a2 2 0 0 0-2 2z"/><path d="M4.4 5.2v15.4"/><path d="M8.2 7.6h6.6"/>',
  list:   '<path d="M5 6.6h14M5 12h14M5 17.4h9"/>',
  clip:   '<rect x="5.4" y="4.6" width="13.2" height="15.4" rx="2"/><path d="M9 4.6V3.4h6v1.2"/><path d="M9 10.4h6M9 14.2h4"/>',
  /* 달력·시간 */
  calendar:'<rect x="3.4" y="5.4" width="17.2" height="14.4" rx="2.2"/><path d="M3.4 10h17.2"/><path d="M8 3.6v3.4M16 3.6v3.4"/>',
  clock:  '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3.2 2"/>',
  /* 수·돈 */
  chart:  '<path d="M4 19.4h16"/><path d="M7 16V11M11.6 16V6.6M16.2 16v-6.4"/>',
  trend:  '<path d="M4 16.4 9.4 11l3.4 3.2L20 7.2"/><path d="M15.4 7.2H20v4.6"/>',
  money:  '<circle cx="12" cy="12" r="8.2"/><path d="M9.4 9.4h4.2a1.9 1.9 0 0 1 0 3.8H9.4"/><path d="M9.4 12v3.6M12 7.4v9.2"/>',
  coin:   '<ellipse cx="12" cy="7.2" rx="7" ry="2.8"/><path d="M5 7.2v9.6c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8V7.2"/><path d="M5 12c0 1.6 3.1 2.8 7 2.8s7-1.2 7-2.8"/>',
  calc:   '<rect x="4.6" y="3.4" width="14.8" height="17.2" rx="2.2"/><path d="M7.8 7.6h8.4"/><path d="M8.4 12h.01M12 12h.01M15.6 12h.01M8.4 16h.01M12 16h.01M15.6 16h.01"/>',
  bank:   '<path d="M3.4 9.6 12 4.4l8.6 5.2"/><path d="M5.6 9.6v8.2M10 9.6v8.2M14 9.6v8.2M18.4 9.6v8.2"/><path d="M3.4 20.2h17.2"/>',
  /* 지킴·알림 */
  shield: '<path d="M12 3.4 5 6.2v5.2c0 4.1 2.8 7.4 7 9.2 4.2-1.8 7-5.1 7-9.2V6.2z"/>',
  bell:   '<path d="M6.6 10.4a5.4 5.4 0 0 1 10.8 0c0 4 1.6 5.4 1.6 5.4H5s1.6-1.4 1.6-5.4z"/><path d="M10.4 18.8a1.9 1.9 0 0 0 3.2 0"/>',
  warn:   '<path d="M12 4.2 2.8 19.4h18.4z"/><path d="M12 10v4"/><path d="M12 17h.01"/>',
  check:  '<circle cx="12" cy="12" r="8.4"/><path d="M8.4 12.2 11 14.8l4.6-5"/>',
  flag:   '<path d="M6 20.4V4.6"/><path d="M6 5.4h10.6l-1.8 3.4 1.8 3.4H6"/>',
  /* 말·소리 */
  chat:   '<path d="M20.4 11.6c0 3.9-3.8 7-8.4 7a9.8 9.8 0 0 1-2.6-.35L4.4 19.8l1.3-3.4A6.6 6.6 0 0 1 3.6 11.6c0-3.9 3.8-7 8.4-7s8.4 3.1 8.4 7z"/>',
  phone:  '<path d="M6.4 4.4h3l1.6 4-2 1.4a11 11 0 0 0 5.2 5.2l1.4-2 4 1.6v3a1.6 1.6 0 0 1-1.7 1.6C11.2 18.8 5.2 12.8 4.8 6.1a1.6 1.6 0 0 1 1.6-1.7z"/>',
  mic:    '<rect x="9.4" y="3.4" width="5.2" height="10" rx="2.6"/><path d="M6.2 11.4a5.8 5.8 0 0 0 11.6 0"/><path d="M12 17.2v3.2"/>',
  megaphone:'<path d="M4 10.4v3.2l9.6 4.4V6z"/><path d="M13.6 8.6a3.4 3.4 0 0 1 0 6.8"/><path d="M6.6 14.6v3.6a1.4 1.4 0 0 0 2.8 0v-2.4"/>',
  /* 찾기·길 */
  search: '<circle cx="11" cy="11" r="6.4"/><path d="M15.8 15.8 20.4 20.4"/>',
  map:    '<path d="M3.6 6.4 9 4.4v13.2l-5.4 2z"/><path d="M9 4.4 15 6.6v13l-6-2.2z"/><path d="M15 6.6l5.4-2v13.2l-5.4 2z"/>',
  compass:'<circle cx="12" cy="12" r="8.4"/><path d="M15.2 8.8 13.4 13.4 8.8 15.2l1.8-4.6z"/>',
  car:    '<path d="M4 15.4v-2.2l1.8-4.4A2 2 0 0 1 7.6 7.6h8.8a2 2 0 0 1 1.8 1.2l1.8 4.4v2.2"/><path d="M4 15.4h16v2.4h-3v-2.4M7 17.8v-2.4H4"/><path d="M7.4 12.6h9.2"/>',
  globe:  '<circle cx="12" cy="12" r="8.4"/><path d="M3.6 12h16.8"/><path d="M12 3.6c2.2 2.3 3.4 5.3 3.4 8.4s-1.2 6.1-3.4 8.4c-2.2-2.3-3.4-5.3-3.4-8.4S9.8 5.9 12 3.6z"/>',
  /* 몸·공부 */
  heart:  '<path d="M12 19.6S4.4 15.2 4.4 9.9a4 4 0 0 1 7.6-1.8 4 4 0 0 1 7.6 1.8c0 5.3-7.6 9.7-7.6 9.7z"/>',
  stetho: '<path d="M6.4 4v4.4a3.6 3.6 0 0 0 7.2 0V4"/><path d="M6.4 4H4.8M13.6 4h1.6"/><path d="M10 12v2.6a4.4 4.4 0 0 0 8.8 0v-1.2"/><circle cx="18.8" cy="11.6" r="2"/>',
  cap:    '<path d="M2.8 9 12 5l9.2 4-9.2 4z"/><path d="M6.6 11.2v4.2c0 1.6 2.4 2.8 5.4 2.8s5.4-1.2 5.4-2.8v-4.2"/>',
  brain:  '<path d="M9.6 4.6A3 3 0 0 0 6.8 8a3 3 0 0 0-1.6 5.2A3.2 3.2 0 0 0 7 19a2.8 2.8 0 0 0 2.6 0V4.6z"/><path d="M14.4 4.6A3 3 0 0 1 17.2 8a3 3 0 0 1 1.6 5.2A3.2 3.2 0 0 1 17 19a2.8 2.8 0 0 1-2.6 0V4.6z"/><path d="M12 4.4v15.4"/>',
  robot:  '<rect x="4.4" y="7.6" width="15.2" height="11" rx="2.6"/><path d="M12 4v3.6"/><circle cx="12" cy="3.2" r="1"/><path d="M9.2 12.2h.01M14.8 12.2h.01"/><path d="M9.8 15.6h4.4"/>',
  /* 설정·열쇠 */
  gear:   '<circle cx="12" cy="12" r="3"/><path d="M19.2 14.6a1.6 1.6 0 0 0 .3 1.8l.1.1a1.9 1.9 0 1 1-2.7 2.7l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.2a1.9 1.9 0 1 1-3.8 0v-.1a1.6 1.6 0 0 0-2.7-1.2l-.1.1a1.9 1.9 0 1 1-2.7-2.7l.1-.1a1.6 1.6 0 0 0-1.1-2.7h-.2a1.9 1.9 0 1 1 0-3.8h.1a1.6 1.6 0 0 0 1.2-2.7l-.1-.1a1.9 1.9 0 1 1 2.7-2.7l.1.1a1.6 1.6 0 0 0 1.8.3h.1a1.6 1.6 0 0 0 1-1.5v-.2a1.9 1.9 0 1 1 3.8 0v.1a1.6 1.6 0 0 0 2.7 1.2l.1-.1a1.9 1.9 0 1 1 2.7 2.7l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.2a1.9 1.9 0 1 1 0 3.8h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  key:    '<circle cx="8.2" cy="15.8" r="3.4"/><path d="M10.6 13.4 19 5"/><path d="M16.4 7.6 18.6 9.8M14.2 9.8l2.2 2.2"/>',
  link:   '<path d="M10.2 13.8a3.8 3.8 0 0 0 5.6.4l2.4-2.4a3.8 3.8 0 0 0-5.4-5.4l-1.4 1.4"/><path d="M13.8 10.2a3.8 3.8 0 0 0-5.6-.4l-2.4 2.4a3.8 3.8 0 0 0 5.4 5.4l1.4-1.4"/>',
  upload: '<path d="M4.6 15.6v2.8a1.6 1.6 0 0 0 1.6 1.6h11.6a1.6 1.6 0 0 0 1.6-1.6v-2.8"/><path d="M8.4 8.4 12 4.8l3.6 3.6"/><path d="M12 5v10.4"/>',
  mail:   '<rect x="3.4" y="5.6" width="17.2" height="12.8" rx="2.2"/><path d="m3.8 7.4 8.2 5.4 8.2-5.4"/>',
  camera: '<rect x="3" y="7" width="18" height="12.4" rx="2.4"/><path d="M8.6 7 10 4.6h4L15.4 7"/><circle cx="12" cy="13.2" r="3.2"/>',
  /* 그 밖 */
  target: '<circle cx="12" cy="12" r="8.2"/><circle cx="12" cy="12" r="4.4"/><circle cx="12" cy="12" r="1"/>',
  trophy: '<path d="M8 4.4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5.6v1.4A2.8 2.8 0 0 0 8 10.1M16 6h2.4v1.4A2.8 2.8 0 0 1 16 10.1"/><path d="M12 13.4v3.2M9 19.6h6"/>',
  sprout: '<path d="M12 20.4v-7.2"/><path d="M12 13.2C12 9.6 9.2 7.4 5.6 7.4c0 3.6 2.8 5.8 6.4 5.8z"/><path d="M12 13.2c0-3 2.4-5 5.4-5 0 3-2.4 5-5.4 5z"/>',
  fish:   '<path d="M3.6 12c2.6-3.6 6-5.4 9.4-5.4 3.4 0 6.2 1.8 7.4 5.4-1.2 3.6-4 5.4-7.4 5.4-3.4 0-6.8-1.8-9.4-5.4z"/><path d="M16.4 10.6h.01"/><path d="M3.6 12 1.8 8.6M3.6 12l-1.8 3.4"/>',
  film:   '<rect x="3.2" y="5.4" width="17.6" height="13.2" rx="2.2"/><path d="M8 5.4v13.2M16 5.4v13.2M3.2 12h17.6"/>',
  umbrella:'<path d="M3.4 12a8.6 8.6 0 0 1 17.2 0z"/><path d="M12 12v6.2a2.2 2.2 0 0 0 4.4 0"/>',
  thermo: '<path d="M14 13.6V5.6a2 2 0 1 0-4 0v8a4 4 0 1 0 4 0z"/>',
  syringe:'<path d="M14.4 4.8 19.2 9.6"/><path d="M11.4 7.8 16.2 12.6"/><path d="m8.6 10.6 4.8 4.8-3.2 3.2a1.6 1.6 0 0 1-2.2 0l-2.6-2.6a1.6 1.6 0 0 1 0-2.2z"/><path d="M5.6 18.4 3.4 20.6"/><path d="M11 13.2 9.4 14.8"/>',
  lightning:'<path d="M12.8 3.4 5.6 13.2h5.4l-.8 7.4 7.2-9.8h-5.4z"/>',
  grid:   '<rect x="3.6" y="3.6" width="7" height="7" rx="1.6"/><rect x="13.4" y="3.6" width="7" height="7" rx="1.6"/><rect x="3.6" y="13.4" width="7" height="7" rx="1.6"/><rect x="13.4" y="13.4" width="7" height="7" rx="1.6"/>',
  swap:   '<path d="M4.4 8.2h12.2"/><path d="m13.6 5.2 3 3-3 3"/><path d="M19.6 15.8H7.4"/><path d="m10.4 12.8-3 3 3 3"/>',
  ruler:  '<rect x="2.6" y="8.6" width="18.8" height="6.8" rx="1.8" transform="rotate(-45 12 12)"/><path d="M9.2 7.4 10.8 9M12 10.2l1.6 1.6M14.8 13l1.6 1.6"/>',
  thread: '<circle cx="12" cy="12" r="8.2"/><path d="M12 3.8c-2.6 2.6-2.6 13.8 0 16.4"/><path d="M9.4 5.6c3.6 2.2 3.6 10.6 0 12.8"/>',
  building:'<rect x="4.6" y="3.6" width="14.8" height="17" rx="2"/><path d="M8.4 7.4h2M13.6 7.4h2M8.4 11.2h2M13.6 11.2h2M10.4 20.6v-4.2h3.2v4.2"/>',
  temple: '<path d="M3.4 9.6 12 4.4l8.6 5.2"/><path d="M4.6 20.4h14.8"/><path d="M7 9.6v10.8M12 9.6v10.8M17 9.6v10.8"/>'
};

/* ── 이모지 → 그림 ──────────────────────────────────────────────
   ★ 뜻이 같은 것은 <b>한 그림</b>으로 모읍니다 — 📕📘📒📓📜 를 따로 기억할
     사람은 없습니다. 여기 <b>없는 이모지는 그대로 둡니다</b> (1번).     */
var APEX_ICON_OF = {
  '🏠':'home','🏢':'building','🏛️':'temple','🏦':'bank',
  '🧑‍🏫':'teacher','👥':'users','🙋':'user','💼':'tools','🧰':'tools',
  '📇':'idcard','🗂️':'card','🗄️':'card','💳':'card',
  '✍️':'pen','📝':'pen','📋':'clip','📑':'doc','🧾':'doc','📄':'doc','📜':'doc',
  '📕':'book','📘':'book','📒':'book','📓':'book','📖':'book',
  '📅':'calendar','📆':'calendar','🗓️':'calendar',
  '📊':'chart','📈':'trend','💯':'chart','📐':'ruler','🧮':'calc',
  '💰':'money','🪙':'coin','💠':'coin',
  '🛡️':'shield','⚠️':'warn','✅':'check','✳️':'check','🚦':'flag','🏆':'trophy',
  '💬':'chat','🗣️':'chat','☎️':'phone','📞':'phone','📲':'phone',
  '🎙':'mic','🎙️':'mic','📢':'megaphone','📣':'megaphone',
  '🔎':'search','🗺️':'map','🧭':'compass','🚗':'car','🌐':'globe',
  '🩺':'stethoscope','💉':'syringe','🌡️':'thermo','🎓':'cap','🧠':'brain','🤖':'robot',
  '⚙️':'gear','🔑':'key','🔗':'link','📤':'upload','📮':'mail','📸':'camera','🎬':'film',
  '🎯':'target','🌱':'sprout','🎣':'fish','☂️':'umbrella','⚡':'lightning',
  '📰':'list','🔀':'swap','🧵':'thread','🥊':'target','🔪':'ruler'
};
/* 긴 이름도 받습니다 — 표에 적은 이름이 길면 그림 이름이 안 맞을 수 있어서 */
APEX_ICON.stethoscope = APEX_ICON.stetho;

/* 그림 하나를 내어 줍니다. 이름이 없으면 <b>빈 글자</b>를 돌려주어,
   부르는 쪽이 「그러면 옛 이모지를 그대로 쓴다」 로 떨어지게 둡니다 (1번). */
function icoSvg(name, size){
  var d = APEX_ICON[name];
  if (!d) return '';
  var s = size || 20;
  return '<svg class="ico" viewBox="0 0 24 24" width="' + s + '" height="' + s +
         '" fill="none" stroke="currentColor" stroke-width="1.8" ' +
         'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
}
/* 이모지를 그림으로 — <b>못 바꾸면 그대로</b> 돌려줍니다 */
function icoFromEmoji(e, size){
  var k = APEX_ICON_OF[String(e || '').replace(/️/g, '')] || APEX_ICON_OF[e];
  var svg = k ? icoSvg(k, size) : '';
  return svg || ('<span class="ico-emo">' + (e || '') + '</span>');
}
/* 이 파일이 바뀌었는지 자가 볼 수 있게 — 그림 가짓수 */
function icoCount(){ var n = 0, k; for (k in APEX_ICON) if (APEX_ICON.hasOwnProperty(k)) n++; return n; }

/* ══ 판 X151 에서 보탠 그림 스물아홉 ═════════════════════════════════
   사장님 말씀 (2026-10-21) — 「남은 이모지도 바꿔」. 재 보니 그림 자리
   <b>234곳</b> 가운데 158곳만 표에 있고 <b>76곳</b>이 표에 없어 이모지로
   남아 있었습니다. 그 가운데 많이 쓰이는 것부터 그렸습니다.
   ★ <b>표에 없으면 그대로 둡니다</b> — 모르는 것을 아무 그림에나 붙이면
     엉뚱한 그림이 섭니다 (1번).                                      */
APEX_ICON.scale  = '<path d="M12 4v16"/><path d="M5 8h14"/><path d="M5 8 2 14h6L5 8Z"/><path d="M19 8l-3 6h6l-3-6Z"/><path d="M8 20h8"/>';
APEX_ICON.lock   = '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>';
APEX_ICON.unlock = '<rect x="4.5" y="10.5" width="15" height="9.5" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 7.5-2"/>';
APEX_ICON.pin    = '<path d="M12 13v8"/><path d="M8 4h8l-1 5 3 4H6l3-4-1-5Z"/>';
APEX_ICON.crown  = '<path d="M3 8l3.5 3L12 5l5.5 6L21 8l-2 10H5L3 8Z"/>';
APEX_ICON.rocket = '<path d="M12 3c3 2.5 5 6 5 10l-2.5 3h-5L7 13c0-4 2-7.5 5-10Z"/><circle cx="12" cy="10" r="1.6"/><path d="M9.5 19.5 8 22M14.5 19.5 16 22"/>';
APEX_ICON.ring   = '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="3.8"/><path d="M12 3.5v4.7M12 15.8v4.7M3.5 12h4.7M15.8 12h4.7"/>';
APEX_ICON.eyeoff = '<path d="M3 3l18 18"/><path d="M10.6 6.3A9 9 0 0 1 12 6c5 0 9 6 9 6a16 16 0 0 1-2.3 2.9"/><path d="M6.5 7.9A16 16 0 0 0 3 12s4 6 9 6a9 9 0 0 0 3.3-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>';
APEX_ICON.hands  = '<path d="M8 12 5 9a2 2 0 0 1 2.8-2.8L11 9.3"/><path d="M13 9.3l3.2-3.1A2 2 0 0 1 19 9l-3 3"/><path d="M4 13.5 8.5 18a2 2 0 0 0 2.8 0l.7-.7.7.7a2 2 0 0 0 2.8 0L20 13.5"/>';
APEX_ICON.refresh= '<path d="M20 11A8 8 0 0 0 6.3 6.3L4 8.5"/><path d="M4 4v4.5h4.5"/><path d="M4 13a8 8 0 0 0 13.7 4.7L20 15.5"/><path d="M20 20v-4.5h-4.5"/>';
APEX_ICON.plug   = '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v2.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8Z"/><path d="M12 16.5V21"/>';
APEX_ICON.keyb   = '<rect x="2.5" y="6.5" width="19" height="11" rx="2"/><path d="M6 10h.01M9.5 10h.01M13 10h.01M16.5 10h.01M7.5 14h9"/>';
APEX_ICON.siren  = '<path d="M6 19h12"/><path d="M8 19v-5a4 4 0 0 1 8 0v5"/><path d="M12 5V3M5.5 8 4 6.6M18.5 8 20 6.6"/>';
APEX_ICON.save   = '<path d="M5 4h11l4 4v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/><path d="M8 4v5h7V4"/><rect x="8" y="13" width="8" height="8"/>';
APEX_ICON.folder = '<path d="M3 7.5a1.5 1.5 0 0 1 1.5-1.5H9l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 19.5H4.5A1.5 1.5 0 0 1 3 18V7.5Z"/>';
APEX_ICON.moon   = '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z"/>';
APEX_ICON.sunup  = '<path d="M3 19h18"/><path d="M6.5 15.5a5.5 5.5 0 0 1 11 0"/><path d="M12 4v3M5 7l2 2M19 7l-2 2M2.5 15.5h2M19.5 15.5h2"/>';
APEX_ICON.pill   = '<rect x="2.8" y="9" width="18.4" height="6" rx="3" transform="rotate(-45 12 12)"/><path d="M8.5 8.5 15.5 15.5"/>';
APEX_ICON.puzzle = '<path d="M10 4.5a1.8 1.8 0 0 1 3.6 0V6h3a1 1 0 0 1 1 1v3h1.5a1.8 1.8 0 0 1 0 3.6H17.6v3a1 1 0 0 1-1 1h-3v-1.5a1.8 1.8 0 0 0-3.6 0V17.6h-3a1 1 0 0 1-1-1v-3H4.5a1.8 1.8 0 0 1 0-3.6H6V7a1 1 0 0 1 1-1h3V4.5Z"/>';
APEX_ICON.spark  = '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z"/>';
APEX_ICON.gift   = '<rect x="3.5" y="8.5" width="17" height="11.5" rx="1.5"/><path d="M3.5 12.5h17M12 8.5V20"/><path d="M12 8.5S10.5 4 8 4a2 2 0 0 0 0 4.5M12 8.5S13.5 4 16 4a2 2 0 0 1 0 4.5"/>';
APEX_ICON.cake   = '<path d="M4 20h16"/><path d="M5 20v-5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2V20"/><path d="M12 12.5V9M12 5.5V7"/>';
APEX_ICON.x      = '<path d="M6 6l12 12M18 6 6 18"/>';
APEX_ICON.ticket = '<path d="M3 9.5V7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2.5a2.5 2.5 0 0 0 0 5V17a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2.5a2.5 2.5 0 0 0 0-5Z"/><path d="M9.5 6v12"/>';
APEX_ICON.sun    = '<circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/>';
APEX_ICON.bulb   = '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.8c.6.5 1 1.2 1 2V18h5v-2.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>';
APEX_ICON.image  = '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 4 3.5 3-2.5 4 3.5"/>';
APEX_ICON.palette= '<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2-1 2-2s-.8-2-.8-2.6c0-.9.8-1.4 1.8-1.4h1.6c2.1 0 3.9-1.7 3.9-3.9 0-4-4.1-7.1-8.5-7.1Z"/><circle cx="8.3" cy="9" r="1.1"/><circle cx="12" cy="7.3" r="1.1"/><circle cx="7.6" cy="13" r="1.1"/>';
APEX_ICON.dots   = '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>';
/* 판 X153 에서 둘 더 — 🔥 연속 가동 · 🔁 돌아가기 */
APEX_ICON.fire   = '<path d="M12 3s4.5 3.6 4.5 8a4.5 4.5 0 0 1-9 0c0-1.6.7-3 1.6-4.1.3 1 1 1.8 1.9 2.1C11.6 7.4 12 5.2 12 3Z"/><path d="M6.8 12.5A7 7 0 0 0 6 15.6C6 18.6 8.7 21 12 21s6-2.4 6-5.4a7 7 0 0 0-.8-3.1"/>';
APEX_ICON.turn   = '<path d="M4 7h11a4.5 4.5 0 0 1 0 9H9"/><path d="M11.5 12.5 8 16l3.5 3.5"/><path d="M7.5 3.5 4 7l3.5 3.5"/>';

/* 옮기는 표에 보탭니다 — 왼쪽이 화면에 서 있던 이모지입니다 */
APEX_ICON_OF['🔔']='bell';     APEX_ICON_OF['⚖']='scale';    APEX_ICON_OF['⚖️']='scale';
APEX_ICON_OF['🔒']='lock';     APEX_ICON_OF['🔐']='lock';     APEX_ICON_OF['🔓']='unlock';
APEX_ICON_OF['📌']='pin';      APEX_ICON_OF['🧷']='pin';      APEX_ICON_OF['👑']='crown';
APEX_ICON_OF['🚀']='rocket';   APEX_ICON_OF['📚']='book';     APEX_ICON_OF['🛟']='ring';
APEX_ICON_OF['✓']='check';     APEX_ICON_OF['✔']='check';     APEX_ICON_OF['✔️']='check';
APEX_ICON_OF['🙈']='eyeoff';   APEX_ICON_OF['🤝']='hands';    APEX_ICON_OF['🧑']='user';
APEX_ICON_OF['🧍']='user';     APEX_ICON_OF['🔄']='refresh';  APEX_ICON_OF['🔌']='plug';
APEX_ICON_OF['🪪']='idcard';   APEX_ICON_OF['🛂']='idcard';   APEX_ICON_OF['🖼']='image';
APEX_ICON_OF['🖼️']='image';   APEX_ICON_OF['🪞']='image';    APEX_ICON_OF['🎨']='palette';
APEX_ICON_OF['⋯']='dots';      APEX_ICON_OF['📱']='phone';    APEX_ICON_OF['🦾']='robot';
APEX_ICON_OF['⌨']='keyb';      APEX_ICON_OF['⌨️']='keyb';     APEX_ICON_OF['🚨']='siren';
APEX_ICON_OF['🔍']='search';   APEX_ICON_OF['⏱']='clock';     APEX_ICON_OF['⏱️']='clock';
APEX_ICON_OF['💾']='save';     APEX_ICON_OF['📂']='folder';   APEX_ICON_OF['💌']='mail';
APEX_ICON_OF['🌙']='moon';     APEX_ICON_OF['🌅']='sunup';    APEX_ICON_OF['💊']='pill';
APEX_ICON_OF['🧩']='puzzle';   APEX_ICON_OF['✨']='spark';     APEX_ICON_OF['✒']='pen';
APEX_ICON_OF['✒️']='pen';     APEX_ICON_OF['💵']='money';    APEX_ICON_OF['💱']='swap';
APEX_ICON_OF['🎁']='gift';     APEX_ICON_OF['🎂']='cake';     APEX_ICON_OF['✕']='x';
APEX_ICON_OF['✖']='x';         APEX_ICON_OF['🏭']='building'; APEX_ICON_OF['🎫']='ticket';
APEX_ICON_OF['☀']='sun';       APEX_ICON_OF['☀️']='sun';      APEX_ICON_OF['💡']='bulb';
APEX_ICON_OF['🏅']='trophy';   APEX_ICON_OF['🆘']='warn';     APEX_ICON_OF['🏠']='home';
APEX_ICON_OF['🔥']='fire';     APEX_ICON_OF['🔁']='turn';     APEX_ICON_OF['♻']='turn';
APEX_ICON_OF['♻️']='turn';

/* ══ 🖼 <b>그림 자리를 제자리에서 바꿔 끼운다</b> (판 X151) ═══════════
   사장님 말씀 — 「남은 이모지도 바꿔」.

   ── 왜 글을 안 고치고 화면에서 바꾸나 ──────────────────────────────
   카드 머리의 그림은 <b>app/index.html 안의 글자 195곳</b>에 박혀 있습니다
   (`<span class="ci">📊</span>`). 그 195곳을 손으로 고치면 ① 한 줄씩 틀릴
   자리가 195개 생기고 ② 다음에 카드를 하나 더 만들 때 또 이모지로 돌아갑니다.
   그래서 <b>자리(class)를 보고 한 곳에서</b> 바꿔 끼웁니다 (5번).

   ── 안 건드리는 것 ─────────────────────────────────────────────────
   ★ <b>표에 있는 것만</b> 바꿉니다 — 표에 없으면 그대로 둡니다 (1번).
   ★ <b>안에 다른 칸이 있으면</b> 손대지 않습니다 — 글이 섞인 자리입니다.
   ★ <b>글 가운데 있는 이모지</b>는 안 건드립니다. 「🔔 새 소식이 없습니다」
     처럼 글과 한 줄인 자리는 바꾸면 글이 쪼개져, 수를 세거나 글을 견주는
     자리가 조용히 틀립니다. 그 자리는 <b>부르는 쪽에서</b> icoFromEmoji 로
     바꿉니다(아래 띠·서랍·접이가 그렇게 바뀌었습니다).
   ★ <b>두 번 해도 같습니다</b> — 바꾼 뒤에는 안에 <svg> 가 있어 건너뜁니다.
   ★ 무엇이었는지 <b>data-emo</b> 에 남깁니다 — 되돌릴 때 손에 쥘 것이 있게.  */
/* ⚠ <b>span.e 가 이 앱의 그림 자리입니다.</b> 처음에 뺐다가 재 보고 넣었습니다 —
   「도구」 한 화면에만 <b>107곳</b>이 span.e 이고 전부 이모지였습니다. 뺐던 까닭은
   「오늘 할 일」 칸의 차례 동그라미(.hm-nxs-r .e)가 같은 이름이기 때문인데, 그 안은
   <b>「1」 「2」 같은 숫자</b>라 표에 없어 저절로 건너뜁니다 — 표에 있는 것만 바꾸는
   규칙(1번)이 그 자리를 이미 지켜 주고 있었습니다. 겁내서 뺄 일이 아니었습니다. */
var ICO_SLOT = 'span.e,div.e,b.e,i.e,span.ci,span.ic,div.ic,span.sbg-ic,span.myk-ic,' +
               'span.stp-ic,div.dz-ic,span.hmc-i,span.blk-ic,span.mst-ic,span.tnv-ic,' +
               'span.ngl-ic,span.nf-ic,span.mdimg-ic,span.bx,span.fx,span.ck,' +
               'span.mnu-ic,span.hd-ic,span.bd-ic';
function icoSlots(root){
  var R = root || document, L, i, e, t, k, n = 0;
  if (!R || !R.querySelectorAll) return 0;
  try { L = R.querySelectorAll(ICO_SLOT); } catch (x) { return 0; }
  for (i = 0; i < L.length; i++){
    e = L[i];
    if (e.firstElementChild) continue;                 /* 안에 칸이 있으면 그대로 */
    t = (e.textContent || '').replace(/\s/g, '');
    if (!t || t.length > 6) continue;                  /* 글이 섞인 자리는 그대로 */
    k = APEX_ICON_OF[t.replace(/️/g, '')] || APEX_ICON_OF[t];
    if (!k || !APEX_ICON[k]) continue;                 /* 표에 없으면 그대로 (1번) */
    e.setAttribute('data-emo', t);
    e.innerHTML = icoSvg(k, +(e.getAttribute('data-ico') || 0) || 20);
    n++;
  }
  return n;
}
/* 화면이 다시 그려질 때마다 한 번 — <b>보는 자리는 여기 하나</b>입니다 (5번).
   ★ 한 틀(rAF)에 한 번으로 묶습니다 — 안 그러면 한 번 그릴 때 수십 번 돕니다.
   ★ 제 손으로 고친 것이 다시 저를 부르지만, 바꾼 자리는 건너뛰므로 멈춥니다. */
/* ══ ✍️ <b>글과 한 줄인 이모지</b> — 앞머리 한 글자만 그림으로 (판 X152) ══
   사장님 말씀 (2026-10-21) — 「남은 이모지도 바꿔」 · 「그대로인 것들을 전부 고치고」.

   ── 왜 따로 다루나 ─────────────────────────────────────────────────
   위 icoSlots 는 <b>이모지만 든 칸</b>(`<span class="e">🏠</span>`)을 바꿉니다.
   그런데 화면에 더 많은 것은 <b>글과 한 줄</b>인 자리입니다 — 「🔔 오늘 남은
   알람 1번」 「🗂️ DB통합CRM」 「📊 상담현황 — 지금 어디에 몇 분」.
   홈 한 화면에만 <b>50곳</b>이었습니다.

   ── 무엇을 하나 ────────────────────────────────────────────────────
   첫 <b>글 토막</b>이 「이모지 + 빈칸」 으로 시작하면 그 <b>한 글자만</b>
   그림으로 바꿔 끼우고 <b>나머지 글은 그대로</b> 둡니다.

   ── 안 건드리는 것 ─────────────────────────────────────────────────
   ★ <b>표에 없는 이모지</b>는 그대로 (1번).
   ★ 첫 자식이 글이 아니면 그대로 — 이미 칸이 있는 자리입니다.
   ★ 적는 칸·코드·그림(input · textarea · svg · code · pre) 안은 그대로.
   ★ <b>글 가운데</b>의 이모지는 그대로 — 「🎯 한 번은 받으시게 한다 ·
     📑 카드 없음」 에서 앞의 🎯 만 바꾸고 📑 는 둡니다. 가운데를 건드리면
     글이 쪼개져 수를 세거나 글을 견주는 자리가 조용히 틀립니다.
   ★ <b>data-noico</b> 가 붙은 칸과 그 속은 통째로 건너뜁니다 — 글자 그대로
     보여야 하는 자리(견본·받아쓴 글)를 위해 둔 문입니다.
   ⚠ <b>글자가 바뀝니다.</b> 「🗂️ DB통합CRM」 의 textContent 가 「DB통합CRM」
     이 됩니다 — 재 보니 옮길 이모지를 글에서 견주는 자가 <b>26개</b>
     있었습니다. 그 자들은 <b>이모지가 아니라 이름</b>을 보도록 고쳤습니다
     (약속은 그대로이고 보는 자리만 바꿨습니다 · 8번).                   */
var ICO_LEAD_NO = { INPUT:1, TEXTAREA:1, OPTION:1, SELECT:1, SCRIPT:1, STYLE:1,
                    CODE:1, PRE:1, SVG:1, TITLE:1, IFRAME:1 };
function icoLead(root){
  var R = root || document, L, i, e, tn, m, k, sp, n = 0;
  if (!R || !R.querySelectorAll) return 0;
  try { L = R.querySelectorAll('.tab-pane.on *, #sidebar *, #tabbar *, .t-top *, .os-ovl *'); }
  catch (x) { return 0; }
  for (i = 0; i < L.length; i++){
    e = L[i];
    if (ICO_LEAD_NO[e.tagName] || e.hasAttribute('data-emo')) continue;
    if (e.namespaceURI && e.namespaceURI.indexOf('svg') >= 0) continue;
    if (e.closest && e.closest('[data-noico]')) continue;
    tn = e.firstChild;
    if (!tn || tn.nodeType !== 3) continue;             /* 첫 자식이 글이 아니면 그대로 */
    m = /^\s*(\S{1,3}?)\s+(?=\S)/.exec(tn.nodeValue || '');
    if (!m) continue;
    k = APEX_ICON_OF[m[1].replace(/️/g, '')] || APEX_ICON_OF[m[1]];
    if (!k || !APEX_ICON[k]) continue;                  /* 표에 없으면 그대로 (1번) */
    e.setAttribute('data-emo', m[1]);
    /* ★★ <b>뒤 빈칸은 남깁니다</b> — 그림과 글이 붙으면 줄을 끊을 자리가
       없어집니다. 빈칸을 남기면 예전처럼 거기서 줄이 끊깁니다.         */
    tn.nodeValue = (tn.nodeValue || '').slice(
      (tn.nodeValue || '').indexOf(m[1]) + m[1].length);
    sp = document.createElement('span');
    sp.className = 'ico-l';
    sp.innerHTML = icoSvg(k, 17);
    e.insertBefore(sp, tn);
    n++;
  }
  return n;
}
/* 선 그림이 글 옆에 설 때의 결 — <b>한 곳에만</b> 적습니다 (5번) */
function icoLeadCss(){
  if (document.getElementById('icoLeadCss')) return;
  var st = document.createElement('style'); st.id = 'icoLeadCss';
  /* ⚠ <b>줄 높이를 안 밀어 올립니다.</b> 처음에 17px 짜리를 그냥 끼웠더니
     줄마다 몇 px 씩 커져 <b>홈이 3,526 → 3,591px(4.25화면)</b> 이 되었습니다
     — 홈의 선은 4.2화면입니다(check-homeone). 그래서 크기를 <b>글자에 매어</b>
     (1.15em) 두고 line-height:0 으로 줄 상자를 안 늘립니다. 글자가 커지는
     자리에서는 그림도 같이 커집니다.                                    */
  st.textContent = '.ico-l{display:inline-block;width:1.05em;height:1.05em;' +
                   'vertical-align:-.15em;line-height:0;flex:none}' +
                   '.ico-l svg.ico{display:block;width:100%;height:100%}';
  (document.head || document.documentElement).appendChild(st);
}
var ICO_ON = false, ICO_RAF = 0;
function icoWatch(){
  if (ICO_ON) return;
  /* ★★ <b>본체에서만</b> 돕니다 — #dynPane 이 있는 화면이 본체입니다.
     보장 전·후(ba.html) 같은 따로 선 쪽이 이 파일을 읽더라도(그 쪽은
     icoSvg·icoFromEmoji 만 부릅니다) <b>고객에게 보여주는 화면을 제 손으로
     건드리지 않게</b> 문을 여기서 닫습니다 — 사장님 말씀 「고객에게
     보여주는 건 지금 좋으니까 냅두고」 (1번·6번).                      */
  if (!document.getElementById('dynPane')) return;
  ICO_ON = true;
  icoLeadCss();
  icoSlots(document); icoLead(document);
  if (typeof MutationObserver !== 'function') return;
  var raf = window.requestAnimationFrame || function(f){ return setTimeout(f, 16); };
  new MutationObserver(function(){
    if (ICO_RAF) return;
    ICO_RAF = raf(function(){ ICO_RAF = 0; icoSlots(document); icoLead(document); });
  }).observe(document.body || document.documentElement, { childList: true, subtree: true });
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', function(){ icoWatch(); });
else icoWatch();
