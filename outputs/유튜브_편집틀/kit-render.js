// 편집 틀 굽기 — node kit-render.js [모드 …]   (모드 없이 돌리면 한 벌 전부)
// kit.html 을 #모드 로 열어 한 장씩 찍고 ffmpeg 로 굽는다 · 소리는 kit_sound.py 가 합성한다.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const DIR = __dirname, OUT = path.join(DIR, 'out'), TMP = process.env.KIT_TMP || path.join(os.tmpdir(), 'kit');
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TMP, { recursive: true });
const JOBS = {
  intro169: { file: '01_인트로_가로.mp4', snd: 'intro' }, intro916: { file: '02_인트로_세로.mp4', snd: 'intro' },
  lower: { file: '03_이름표_초록배경_크로마키.mp4', snd: 'lower' }, lowerpng: { file: '03_이름표_투명.png' },
  chapter01: { file: '04_챕터01.mp4', snd: 'chapter' }, chapter02: { file: '04_챕터02.mp4', snd: 'chapter' }, chapter03: { file: '04_챕터03.mp4', snd: 'chapter' },
  chapter04: { file: '04_챕터04.mp4', snd: 'chapter' }, chapter05: { file: '04_챕터05.mp4', snd: 'chapter' }, chapter06: { file: '04_챕터06.mp4', snd: 'chapter' },
  end169: { file: '05_끝화면_가로_20초.mp4', snd: 'end' }, send916: { file: '06_쇼츠_끝카드.mp4', snd: 'send' },
  'thumb|치료 한 바퀴|암 진단 후 1년,|실제로 얼마 드나': { file: '07_썸네일견본_치료한바퀴.png' },
  'thumb|노후 연금|65세부터|매달 얼마 받나': { file: '07_썸네일견본_노후연금.png' },
  'thumb|설계사의 현실|4년 분급,|설계사는 어떻게 버티나': { file: '07_썸네일견본_설계사.png' },
};
const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(JOBS);
(async () => {
  const b = await chromium.launch();
  for (const mode of want) {
    const job = JOBS[mode]; if (!job) { console.log('모르는 모드 ' + mode); continue; }
    const page = await b.newPage({ viewport: { width: 1920, height: 1920 }, deviceScaleFactor: 1 });
    await page.goto('file://' + path.join(DIR, 'kit.html') + '#' + encodeURIComponent(mode));
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(300);
    const K = await page.evaluate(() => KIT);
    await page.setViewportSize({ width: K.w, height: K.h });
    const out = path.join(OUT, job.file);
    if (!K.dur) {   // 그림 한 장
      await page.evaluate(() => render(0));
      await page.screenshot({ path: out, omitBackground: !!K.transparent });
      console.log('→ ' + job.file); await page.close(); continue;
    }
    const wav = path.join(TMP, mode.replace(/\W/g, '') + '.wav');
    execFileSync('python3', [path.join(DIR, 'kit_sound.py'), job.snd, String(K.dur), wav]);
    const fps = 30, n = Math.round(K.dur * fps);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-i', wav,
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
    const done = new Promise((ok, no) => ff.on('close', c => (c ? no(new Error('ffmpeg ' + c)) : ok())));
    for (let i = 0; i < n; i++) {
      await page.evaluate(t => render(t), i / fps);
      const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await done; console.log('→ ' + job.file + ' (' + K.dur + '초 · ' + K.w + '×' + K.h + ')');
    await page.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
