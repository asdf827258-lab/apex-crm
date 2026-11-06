// 릴스 굽기 — node render.js [reel|story] [A B C]
//   reel  : 23.5초 글자형 (reel.html)
//   story : 43.5초 막막이 이야기형 (story.html) — A B C D (D 는 나를 알리기)
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
const NAMES = { A: 'A_직장인', B: 'B_육아맘', C: 'C_경력설계사', D: 'D_나를알리기' };
let args = process.argv.slice(2);
const PAGE = /^(reel|story)$/.test(args[0] || '') ? args.shift() : 'reel';
const want = args.length ? args : ['A', 'B', 'C'];

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
