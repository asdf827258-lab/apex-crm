/* ══ APEX 폰 알람 — <b>앱을 안 켜 두어도 울리는 자리</b> ═══════════════
   브라우저가 앱과 따로 돌려 주는 작은 일꾼(서비스워커)입니다. 앱이 닫혀
   있어도 살아 있어서, 서버가 보낸 알람을 받아 폰에 띄웁니다.

   <b>여기서 화면 파일을 저장(캐시)하지 않습니다.</b> 일부러 안 합니다.
   이 앱은 하루에도 몇 번씩 새로 올라갑니다. 저장해 두면 폰이 <b>어제 판</b>
   을 열고, 고객 앞에서 <b>어제 숫자</b>를 보여 줍니다. 그래서 fetch 를
   아예 안 가로챕니다 — 화면은 언제나 서버에서 바로 받습니다.

   <b>여기서 숫자를 만들지 않습니다</b> (1번). 보낸 쪽이 적어 준 글만
   그대로 띄웁니다. 못 읽으면 못 읽었다고 띄우지, 그럴듯하게 채우지
   않습니다.

   <b>여기에 고객 이름이 오지 않습니다</b> (3번). 서버가 보내는 알람은
   「확인할 시간입니다」 까지고, 사람 이름·건수는 앱을 열어야 나옵니다.
   앱이 직접 띄우는 알람(열려 있을 때)은 이름 없이 건수만 담습니다.   */
'use strict';

var TAG = 'apex-today';                       /* 같은 딱지면 <b>덮어씁니다</b> — 알람이 쌓이지 않습니다 */
var HOME = '/app/index.html';

function show(d) {
  d = d || {};
  var title = d.title || 'APEX YUN PRO';
  var body  = d.body  || '';
  return self.registration.showNotification(title, {
    body: body,
    tag: d.tag || TAG,
    renotify: true,
    icon: d.icon || '/app/icons/icon-192.png',
    badge: d.badge || '/app/icons/icon-192.png',
    data: { go: d.go || HOME }
  });
}

self.addEventListener('install',  function (e) { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

/* 서버가 보낸 알람 — 글을 못 읽어도 <b>조용히 삼키지 않습니다</b>.
   알람이 왔는데 아무것도 안 뜨면 사장님은 「안 온다」 고 아십니다. */
self.addEventListener('push', function (e) {
  var d = null;
  try { d = e.data ? e.data.json() : null; } catch (err) { d = null; }
  if (!d && e.data) { try { d = { body: e.data.text() }; } catch (err2) { d = null; } }
  e.waitUntil(show(d || { body: '열어서 오늘 챙길 분을 확인하세요.' }));
});

/* 앱이 열려 있을 때 — 앱이 직접 「이렇게 띄워 줘」 하고 넘깁니다.
   iOS 는 홈 화면에 설치해야만 알람이 뜨는데, 그때도 이 길로 뜹니다. */
self.addEventListener('message', function (e) {
  var m = e.data || {};
  if (m.t === 'alm') e.waitUntil(show(m.d));
});

/* 눌렀을 때 — <b>이미 열려 있는 앱이 있으면 그것을 앞으로</b> 가져옵니다.
   새 탭을 또 열면 로그인부터 다시 하게 되는 일이 있습니다. */
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var go = (e.notification.data && e.notification.data.go) || HOME;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
      for (var i = 0; i < cs.length; i++) {
        if (cs[i].url.indexOf('/app/') >= 0 && 'focus' in cs[i]) return cs[i].focus();
      }
      return self.clients.openWindow ? self.clients.openWindow(go) : null;
    })
  );
});
