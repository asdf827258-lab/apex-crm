// 릴스 굽기 — node render.js [reel|story] [A B C]
//   reel  : 23.5초 글자형 (reel.html)
//   story : 65초 끝까지 (story.html) — 상황 넷 cancer brain heart care
//   expert: 56초 전문가를 만듭니다 (expert.html) — 교육시스템 EM 다섯 챕터
//   game  : 「APEX : 설계사」 게임판 (game.html) — 1회차 신입 · 2회차 경력 · 길드 · 칩튠 · 내레이션 대화창
//   edu   : 교육시스템 EM 자세히 (edu.html) — 신입 · 경력 · 공통 + 내레이션 자막
//           narration/edu/01.wav … (또는 .m4a .mp3) 가 있으면 그 걸음 시작에 소리로 넣는다 · 대본은 내레이션_대본.md
// reel.html 을 1080×1920 으로 열어 render(t) 를 한 장씩 부르고 찍어 ffmpeg 로 넘긴다.
// 비트는 beat.py 가 화면의 순간(쾅·휙·딸깍)에 맞춰 합성한다.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const OUT = path.join(DIR, 'out');
const TMP = process.env.REEL_TMP || path.join(require('os').tmpdir(), 'reel');
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(TMP, { recursive: true });
const NAMES = { A: 'A_직장인', B: 'B_육아맘', C: 'C_경력설계사', D: 'D_나를알리기',
  cancer: '1_암', brain: '2_뇌혈관', heart: '3_심혈관', care: '4_돌봄',   // story 는 상황 넷
  main: '교육시스템EM', full: '자세히', play: '1회차_2회차', clean: '1회차_2회차_자막없음', nosub: '자막없음' };                                                    // expert 는 한 편
let args = process.argv.slice(2);
const PAGE = /^(reel|story|expert|edu|game)$/.test(args[0] || '') ? args.shift() : 'reel';
const want = args.length ? args : (PAGE === 'story' ? ['cancer', 'brain', 'heart', 'care'] : PAGE === 'expert' ? ['main'] : PAGE === 'edu' ? ['full'] : PAGE === 'game' ? ['play'] : ['A', 'B', 'C']);

(async () => {
  const browser = await chromium.launch();
  for (const v of want) {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.join(DIR, PAGE + '.html') + '#' + v);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => (REEL.ready ? REEL.ready() : null));  // 배경 그림·실제 앱 화면이 다 풀릴 때까지
    await page.waitForTimeout(300);
    const cues = await page.evaluate(() => {
      if (REEL.cues) return REEL.cues();
      const ins = s => [...document.querySelectorAll(s)].map(e => +e.getAttribute('data-in'));
      return {
        total: REEL.total,
        impacts: ins('[data-a="slam"],[data-a="stamp"]').filter((t, i, a) => a.indexOf(t) === i),
        cuts: [3, 5.5, 7.5, 14, 19.5],
        pops: ins('[data-a="pop"]').concat([7.5, 9.25, 10.75, 12.25]),
        ticks: [0, 1, 2, 3].map(i => 12.55 + i * 0.28),
        types: [...document.querySelectorAll('[data-a="type"]')].map(e => {
          const a = +e.getAttribute('data-in'), d = +e.getAttribute('data-dur') || 0.8;
          return [a, a + d, e._txt.length];
        }),
        hush: [17.75, 18.0],
        riser: [16.5, 17.75],
      };
    });
    const cueFile = path.join(TMP, PAGE + v + '.json'), wav = path.join(TMP, PAGE + v + '.wav');
    const prefix = await page.evaluate(() => REEL.prefix || '리쿠르팅릴스');
    // 내레이션 — 대본을 파일로 내고, 녹음이 있으면 소리로 넣는다
    const narr = await page.evaluate(() => REEL.narr ? { key: REEL.narr, lines: REEL.script() } : null);
    if (narr) {
      const md = ['# 내레이션 대본 — ' + prefix, '',
        '걸음마다 한 줄입니다. 한 줄씩 따로 녹음해 `narration/' + narr.key + '/01.wav`, `02.wav` … 로 두고 `node render.js ' + PAGE + '` 를 다시 돌리면',
        '그 걸음이 시작하는 순간에 들어가고, 그동안 배경 음악은 저절로 줄어듭니다. (.m4a · .mp3 도 됩니다)',
        '시간 칸은 그 줄에 주어진 길이입니다 — 이보다 길면 다음 걸음과 겹칩니다. 천천히, 또박또박.', '',
        '| # | 시작 | 길이 | 트랙 | 대본 |', '|---|---|---|---|---|']
        .concat(narr.lines.map(l => `| ${String(l.no).padStart(2, '0')} | ${l.at} | ${l.dur.toFixed(1)}초 | ${l.trk} | ${l.text} |`));
      fs.writeFileSync(path.join(DIR, narr.key === 'edu' ? '내레이션_대본.md' : '내레이션_대본_' + narr.key + '.md'), md.join('\n') + '\n');
      // 자막 파일(.srt) — 캡컷 · 프리미어에서 불러오거나, 녹음할 때 보면서 읽는다
      const ts = x => { const ms = Math.round(x * 1000), h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
        return [h, m, sec].map(v => String(v).padStart(2, '0')).join(':') + ',' + String(ms % 1000).padStart(3, '0'); };
      const srt = narr.lines.map((l, i) => (i + 1) + '\n' + ts(l.a + 0.2) + ' --> ' + ts(l.a + l.dur - 0.15) + '\n' + l.text + '\n').join('\n');
      fs.writeFileSync(path.join(DIR, '내레이션_' + narr.key + '.srt'), srt);
      cues.narr = [];
      for (const l of narr.lines) {
        const base = path.join(DIR, 'narration', narr.key, String(l.no).padStart(2, '0'));
        const src = ['.wav', '.m4a', '.mp3'].map(e => base + e).find(f => fs.existsSync(f));
        if (!src) continue;
        const out = path.join(TMP, narr.key + '_' + l.no + '.wav');
        execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '44100', '-sample_fmt', 's16', out]);
        cues.narr.push([l.a + 0.15, out]);
      }
      console.log('내레이션 대본 · 자막(.srt) → ' + narr.key + ' · 녹음 ' + cues.narr.length + ' / ' + narr.lines.length + '줄');
    }
    fs.writeFileSync(cueFile, JSON.stringify(cues));
    execFileSync('python3', [path.join(DIR, 'beat.py'), cueFile, wav], { stdio: 'inherit' });

    const fps = 30, n = Math.round(cues.total * fps);
    const mp4 = path.join(OUT, `${prefix}_${NAMES[v]}.mp4`);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
      '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
      '-i', wav,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
      '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', mp4], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, no) => ff.on('close', c => (c ? no(new Error('ffmpeg ' + c)) : ok())));
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => render(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 90 === 0) process.stdout.write(`${v} ${i}/${n}\r`);
    }
    ff.stdin.end();
    await done;
    console.log(`${v} → ${mp4} (${((Date.now() - t0) / 1000).toFixed(0)}초)`);
    // 썸네일(표지) 한 장 — 후킹 글이 다 선 순간
    await page.evaluate(() => render(2.6));
    await page.screenshot({ path: path.join(OUT, `표지_${prefix}_${NAMES[v]}.jpg`), type: 'jpeg', quality: 90 });
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
