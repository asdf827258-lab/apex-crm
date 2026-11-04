/* 📸 <b>자비스 새 판 목각의 「결과물」 이 지금 자비스와 같은가</b> (판 X328)
   몸통은 scripts/jvmock-shot.js 한 곳에 있습니다 — 여기서는 그것을 「견주기만」 으로 부릅니다 (5번).
   이름이 check- 로 시작해야 말씀 대장(check-ledger)이 재는 자로 알아봅니다.
   다르면: node scripts/jvmock-shot.js 를 한 번 돌려 목각의 결과를 새로 뽑으십시오. */
process.argv.push('--check');
require('./jvmock-shot.js');
