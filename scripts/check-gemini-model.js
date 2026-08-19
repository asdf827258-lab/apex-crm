/* ════════════════════════════════════════════════════════════════════════
   Gemini 모델 고르기 — 이름을 박아 두지 않는가

     node scripts/check-gemini-model.js     (네트워크 안 탐)

   저장소가 'gemini-2.0-flash' 를 여섯 군데에 박아 두고 있었는데 실서버에서
   404 가 났다. 모델은 이름이 바뀌고 내려간다. 박아 두면 그날 조용히 죽고,
   화면에는 "AI 연결이 없어" 만 뜬다 — 키가 멀쩡한데도.
   ════════════════════════════════════════════════════════════════════════ */

const G = require('./gemini-model.js');

let pass = 0, fail = 0;
function ok(name, cond, got) {
  if (cond) { pass++; console.log('  ✅ ' + name); }
  else { fail++; console.log('  ❌ ' + name + (got === undefined ? '' : '  → ' + JSON.stringify(got))); }
}

console.log('\n① 목록에서 고르는 규칙');

ok('선호 순서대로 고른다',
   G.pickModel(['models/gemini-2.0-flash', 'models/gemini-2.5-flash']) === 'gemini-2.5-flash',
   G.pickModel(['models/gemini-2.0-flash', 'models/gemini-2.5-flash']));
ok('models/ 접두사를 벗긴다', G.pickModel(['models/gemini-2.0-flash']) === 'gemini-2.0-flash');
ok('선호 목록에 없으면 flash 계열을 집는다',
   G.pickModel(['models/gemini-9.9-pro', 'models/gemini-9.9-flash']) === 'gemini-9.9-flash',
   G.pickModel(['models/gemini-9.9-pro', 'models/gemini-9.9-flash']));
ok('flash 도 없으면 남은 것 중 하나',
   G.pickModel(['models/gemini-9.9-pro']) === 'gemini-9.9-pro');

console.log('\n② 글을 못 쓰는 모델을 집지 않는가');

/* ⚠️ 목록에는 임베딩·이미지·음성 모델이 섞여 온다. 그걸 집으면 호출은
      되는데 결과가 우리가 원하는 글이 아니다 — 더 찾기 어려운 고장이다. */
ok('임베딩 모델을 거른다',
   G.pickModel(['models/text-embedding-004', 'models/gemini-9.9-flash']) === 'gemini-9.9-flash');
ok('이미지 모델을 거른다',
   G.pickModel(['models/imagen-3.0', 'models/gemini-9.9-flash']) === 'gemini-9.9-flash');
ok('flash 이름이라도 embedding 이면 안 집는다',
   G.pickModel(['models/gemini-embedding-flash', 'models/gemini-9.9-pro']) === 'gemini-9.9-pro',
   G.pickModel(['models/gemini-embedding-flash', 'models/gemini-9.9-pro']));
ok('쓸 만한 게 하나도 없으면 null', G.pickModel(['models/text-embedding-004', 'models/imagen-3.0']) === null);
ok('빈 목록이면 null', G.pickModel([]) === null && G.pickModel(null) === null);

console.log('\n③ 실패했을 때 원인을 알려 주는가');

(async () => {
  G._reset();
  const fake401 = () => Promise.resolve({
    ok: false, status: 401,
    text: () => Promise.resolve('{"error":{"message":"API key not valid"}}')
  });
  try {
    await G.resolveModel('bad', fake401);
    ok('키가 틀리면 예외를 던진다', false);
  } catch (e) {
    ok('키가 틀리면 예외를 던진다', true);
    /* ⚠️ 상태 코드만 던지면 원인을 못 찾는다. 본문에 답이 적혀 있다. */
    ok('본문을 같이 준다 (401 만 던지지 않는다)', /API key not valid/.test(e.message), e.message);
  }

  G._reset();
  const empty = () => Promise.resolve({
    ok: true, status: 200,
    text: () => Promise.resolve(JSON.stringify({ models: [
      { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] }
    ] }))
  });
  try {
    await G.resolveModel('k', empty);
    ok('쓸 모델이 없으면 예외', false);
  } catch (e) {
    ok('쓸 모델이 없으면 예외', true);
    ok('무엇이 있었는지 알려 준다', /text-embedding-004/.test(e.message), e.message);
  }

  console.log('\n④ 받아 온 목록에서 고른다');

  G._reset();
  let calls = 0;
  const good = () => { calls++; return Promise.resolve({
    ok: true, status: 200,
    text: () => Promise.resolve(JSON.stringify({ models: [
      { name: 'models/text-embedding-004', supportedGenerationMethods: ['embedContent'] },
      { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
      { name: 'models/gemini-2.5-pro', supportedGenerationMethods: ['generateContent'] }
    ] }))
  }); };
  const m1 = await G.resolveModel('k', good);
  ok('generateContent 되는 것만 후보로 삼는다', m1 === 'gemini-2.5-flash', m1);
  const m2 = await G.resolveModel('k', good);
  ok('두 번째부터는 다시 묻지 않는다 (호출 1회)', calls === 1 && m2 === m1, calls);

  G._reset();
  try { await G.resolveModel('', good); ok('키가 없으면 바로 예외', false); }
  catch (e) { ok('키가 없으면 바로 예외', /GEMINI_API_KEY/.test(e.message)); }


  console.log('\n⑤ 되는 모델을 찾을 때까지 내려가는가');

  /* ⚠️ 실제로 이런 일이 있었다 — 목록에 gemini-2.5-flash 가 있어서 그걸 골랐는데
        generateContent 로 부르면 404 였다. 하나만 고르면 그때 방법이 없다. */
  G._reset();
  let hit = [];
  const flaky = (u, o) => {
    if (String(u).indexOf('?key=') > 0 && String(u).indexOf(':generateContent') < 0) {
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }
      ] })) });
    }
    const m = String(u).match(/models\/([^:]+):generateContent/)[1];
    hit.push(m);
    if (m === 'gemini-2.5-flash') return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('{"error":{"code":404}}') });
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ candidates: [] }) });
  };
  const got = await G.callGemini('k', { x: 1 }, flaky);
  ok('404 나면 다음 후보로 내려간다', got.model === 'gemini-2.0-flash', got.model);
  ok('막힌 것도 시도는 해 봤다', hit[0] === 'gemini-2.5-flash', hit);

  hit = [];
  await G.callGemini('k', { x: 1 }, flaky);
  ok('되던 모델을 기억해 바로 쓴다', hit.length === 1 && hit[0] === 'gemini-2.0-flash', hit);

  /* ⚠️ 429(한도)·500(서버)에서 다음 모델로 넘어가면 멀쩡한 모델을 버리고
        한도만 더 쓴다. 404·400 에서만 내려가야 한다. */
  G._reset();
  let tries = 0;
  const rate = (u) => {
    if (String(u).indexOf(':generateContent') < 0)
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-2.0-flash', supportedGenerationMethods: ['generateContent'] }
      ] })) });
    tries++;
    return Promise.resolve({ ok: false, status: 429, text: () => Promise.resolve('rate limit') });
  };
  try { await G.callGemini('k', {}, rate); ok('429 면 즉시 멈춘다', false); }
  catch (e) { ok('429 면 즉시 멈춘다 (다음 모델로 안 넘어간다)', tries === 1, tries);
              ok('429 라고 알려 준다', /429/.test(e.message)); }

  G._reset();
  const allGone = (u) => {
    if (String(u).indexOf(':generateContent') < 0)
      return Promise.resolve({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({ models: [
        { name: 'models/gemini-2.5-flash', supportedGenerationMethods: ['generateContent'] }
      ] })) });
    return Promise.resolve({ ok: false, status: 404, text: () => Promise.resolve('nope') });
  };
  try { await G.callGemini('k', {}, allGone); ok('전부 막히면 예외', false); }
  catch (e) {
    ok('전부 막히면 예외', true);
    ok('무엇을 시도했는지 남긴다', /gemini-2.5-flash=404/.test(e.message), e.message.slice(0, 110));
  }

  console.log('\n' + (fail ? '❌' : '✅') + '  ' + pass + ' 통과 · ' + fail + ' 실패\n');
  process.exit(fail ? 1 : 0);
})();
