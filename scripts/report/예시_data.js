/* APEX 재무 리포트 — 견본 data (홍길동 · 점검·견본 전용 이름, CLAUDE.md 3번)

   ★ 숫자는 손으로 적지 않습니다. 금액은 전부 APEX_REPORT.calc 로 셉니다 —
     화면 글이 외운 숫자를 따로 들고 있으면 계산과 갈라집니다 (CLAUDE.md 5번).
   ★ 견본이라 가정이 많습니다. 가정한 값은 assumptions 에 적어 면책에 모읍니다 (1번).
   ★ 강조는 **굵게**, 줄바꿈은 \n 만 씁니다 (HTML 태그 금지).

   이 견본은 사장님이 주신 검증값과 같은 조건으로 짰습니다 —
     월 100만 · 10년납 · 42세 가입 · 65세 개시 · 보증 7% / 퇴직금 3.5억 · 근속 30년 /
     국민연금 B 659만 · 35년 가입.
   그래서 화면의 136만 · 1,506만 · 1,054만 · 903만 · 184만이 검증값 그대로 나와야 합니다
   (scripts/check-report.js 가 봅니다).

   쓰는 법:  node scripts/make-report.js scripts/report/예시_data.js <내보낼 폴더>      */
module.exports = function (APEX) {
  var C = APEX.calc, M = APEX.man;
  var age = 42, openAge = 65, retireAge = 60, thisYear = 2026;

  var pension = { premium: 100, payYears: 10, startAge: age, openAge: openAge, guaranteeRate: 0.07,
                  rates: [0.05, 0.07, 0.095], targetRate: 0.08 };
  var spouse = { premium: 30, payYears: 10, startAge: 40, openAge: openAge, guaranteeRate: 0.07,
                 rates: [0.05, 0.07, 0.095], targetRate: 0.08, assumed: true };

  var me = C.annuity(pension), tg = me.at(pension.targetRate);
  var np = C.nps(659, 35);                          /* 공단 조회액이 오면 이 줄을 그 값으로 바꿉니다 */
  var rt = C.retireTax(35000, 30);
  var save = rt.total - rt.irpLate;
  var goal = 400, now = np.monthly, gap0 = goal - now;   /* 지금 그대로면 — 제안 전에 이미 들어올 돈 */
  var after = now + tg.monthly + C.annuity(spouse).at(spouse.targetRate).monthly;
  var bridgeY = openAge - retireAge, bridge = goal * 12 * bridgeY;  /* 퇴직 → 연금 개시 사이, 연금 0원 */
  var lim1 = C.irpLimit(35000, 1);

  return {
    client: { name: '홍길동', age: age, family: '배우자·자녀 둘', region: '서울', job: '직장인', retireAge: retireAge },
    advisor: 'APEX 사업단 · 에이플러스에셋 온탑본부',
    date: '2026년 10월',
    topic: '노후 연금 준비',
    oneLine: '지금 그대로면 ' + openAge + '세부터 한 달 **' + M(goal) + '** 중 **' + M(now) + '**만 들어와요. 그리고 ' + retireAge + '세 퇴직부터 ' + openAge +
      '세까지 **' + bridgeY + '년은 연금이 0원**이에요.\n오늘은 이 두 빈칸을 같이 줄여 봐요.',

    kpis: [
      { label: '매월 낼 돈', value: pension.premium, sub: pension.payYears + '년만 내요 · 본인', icon: 'coin' },
      { label: '나중에 매월 받을 돈', value: tg.monthly, sub: openAge + '세부터 · 8% 가정\n최저보증 ' + M(me.guaranteedMonthly), icon: 'money', tone: 'blue' },
      { label: '얻는 이익', value: tg.base - me.principal, sub: '적립금 − 낸 돈\n**요건 충족 시** 비과세 대상', icon: 'gift', tone: 'green' },
      { label: '지금 그대로면 매달 비는 돈', value: gap0, sub: '목표 ' + M(goal) + ' 기준\n오늘 제안을 더하면 ' + (after >= goal ? M(after - goal) + ' 여유' : M(goal - after) + ' 부족'), icon: 'target', tone: 'red', assumed: true }
    ],

    proposalHeadline: '본인 연금 하나, 배우자 연금 하나로 나눠 담아요',
    proposalTitle: '매달 이렇게 나눠 담아요',
    principle: '**원칙은 하나예요 — 지금 월급에서 무리 없이, 은퇴 뒤 월급을 미리 만들어 두기.**\n본인은 최저보증이 있는 변액연금으로 바닥을 깔고, 배우자도 따로 연금을 가져 두 분이 각자 받도록 짰어요.',
    allocation: [
      { name: '본인 변액연금', value: pension.premium, tone: 'blue' },
      { name: '배우자 변액연금', value: spouse.premium, tone: 'purple', assumed: true },
      { name: '비상금 통장', value: 20, tone: 'mint', assumed: true }
    ],
    steps: [
      { age: age, label: '지금', sub: '가입' },
      { age: age + pension.payYears, label: '납입 완료', sub: thisYear + pension.payYears + '년' },
      { age: retireAge, label: '은퇴', sub: '퇴직금 → IRP' },
      { age: openAge, label: '연금 개시', sub: '월 ' + M(tg.monthly), tone: 'blue' }
    ],
    good: [
      '**국민연금을 오래 넣고 계세요** — 가입 35년이면 그것만으로 매달 **' + M(np.monthly) + '**(추정)이 바닥이 돼요.',
      '**퇴직금이 쌓이는 직장**에 오래 계세요 — 받는 방법만 잘 고르면 세금을 줄일 수 있어요.',
      '**은퇴 전에 미리 준비하려고** 오늘 시간을 내셨어요. 시작이 빠를수록 같은 돈이 더 커져요.'
    ],
    todo: [
      '**국민연금 공단 조회액** 확인하기 — 지금 숫자는 추정이에요.',
      '**회사에 퇴직금 예상액·근속연수** 물어보기',
      '**설계서로 최저보증 조건** 같이 읽기 — 보증이 붙는 기간·방식',
      '**은퇴 뒤 한 달 생활비**를 부부가 함께 정해 보기'
    ],

    pension: pension,
    spousePension: spouse,
    nationalPension: { monthly: np.monthly, estimated: true },
    goal: goal, goalAssumed: true,
    goalTitle: '은퇴 후 한 달 400만 원, 채워질까요?',

    sections: [
      { kicker: '핵심 이슈', icon: 'hourglass', title: retireAge + '세 퇴직부터 ' + openAge + '세까지, ' + bridgeY + '년의 빈칸',
        cards: [
          { type: 'days', now: 0, goal: goal, tone: 'red',
            text: '회사를 나온 뒤 연금이 시작되기 전까지 **' + bridgeY + '년**, 매달 들어오는 연금이 **0원**이에요.\n이 ' + bridgeY + '년을 지금 목표대로 살면 **' + M(bridge) + '**이 필요해요.' },
          { type: 'tiles', items: [
            { label: '빈칸 기간', value: bridgeY + '', unit: '년', sub: retireAge + '세 → ' + openAge + '세' },
            { label: '그동안 필요한 돈', value: bridge, sub: '월 ' + M(goal) + ' × ' + bridgeY * 12 + '개월', tone: 'red', assumed: true },
            { label: '퇴직금으로 버티면 남는 돈', value: rt.severance - bridge, sub: '퇴직금 ' + M(rt.severance) + ' − 빈칸 생활비\n(세금 빼기 전)', tone: 'orange', assumed: true },
            { label: '그다음 ' + openAge + '세부터', value: gap0, sub: '여전히 매달 비는 돈', tone: 'red' } ] }
        ],
        ask: '이 ' + bridgeY + '년, 어떻게 보내실 계획이세요? 퇴직금을 어떻게 받느냐가 여기서 갈려요.' },
      { kicker: '핵심 이슈', icon: 'bank', title: '퇴직금 ' + M(rt.severance) + ', 받는 방법에 따라 세금이 달라져요',
        cards: [
          { type: 'verdict', status: '가능', title: 'IRP로 옮겨 연금으로 나눠 받으면 세금이 줄어요',
            text: '근속 ' + rt.years + '년 · 퇴직금 ' + M(rt.severance) + '을 기준으로 계산했어요(추정).',
            reasons: ['한 번에 받으면 세금이 약 **' + M(rt.total) + '**',
                      '연금으로 나눠 받으면 초기 약 **' + M(rt.irpEarly) + '**, 오래 받으면 약 **' + M(rt.irpLate) + '** 수준이에요',
                      '차이는 최대 약 **' + M(save) + '** — 같은 퇴직금에서 그대로 남는 돈이에요'],
            checks: ['실제 퇴직금·근속연수 (회사 확인)', '연금으로 받기 시작하는 시점의 요건', '세무 전문가 최종 확인'] },
          { type: 'tiles3', title: '퇴직소득세 한눈에', icon: 'coin', items: [
            { label: '일시금', value: rt.total, sub: '지방세 포함', tone: 'red' },
            { label: '연금 · 초기', value: rt.irpEarly, sub: '나눠 받을 때', tone: 'orange' },
            { label: '연금 · 장기', value: rt.irpLate, sub: '오래 받을 때', tone: 'green' } ] },
          { type: 'rows', title: '어떻게 계산했나요', icon: 'memo', items: [
            { label: '근속연수공제', value: rt.serviceDeduct },
            { label: '환산급여', value: rt.converted, note: '(퇴직금 − 근속연수공제) × 12 ÷ 근속연수' },
            { label: '환산급여공제', value: rt.convDeduct },
            { label: '과세표준', value: rt.base },
            { label: '일시금 세금 (지방세 포함)', value: rt.total, strong: true } ],
            note: '1년차에 연금으로 꺼낼 수 있는 한도는 약 ' + M(lim1) + '이에요(퇴직금 전액을 IRP에 옮겼다고 볼 때). 한도를 넘겨 꺼낸 부분은 감면을 받지 못해요.' }
        ],
        ask: '퇴직 시점이 정해지면, IRP로 옮기는 순서를 같이 짚어 볼까요?' },
      { kicker: '핵심 이슈', icon: 'shield', title: '비과세는 요건을 지켜야 받을 수 있어요',
        cards: [
          { type: 'verdict', status: '주의', title: '요건 충족 시 비과세 — 지키는 게 핵심이에요',
            text: '변액연금의 이익은 **요건 충족 시** 비과세 대상이에요. 하나라도 어긋나면 이익에 세금이 붙을 수 있어요.',
            reasons: ['요건은 **납입 방식 · 납입 기간 · 유지 기간 · 월 한도** 네 가지예요',
                      '이번 설계는 매달 같은 금액을 내는 **월 적립식**으로 짰어요'],
            checks: ['중도 인출·감액·납입 중지 계획이 있는지', '다른 저축성 보험과 합친 월 한도', '가입 전 세무 전문가 확인'] }
        ] },
      { kicker: '스스로 점검', icon: 'speech', title: '이 질문에 바로 답할 수 있나요?',
        cards: [
          { type: 'quiz', items: [
            { q: '은퇴 후 한 달 생활비, 부부가 함께 정한 금액이 있나요?', hint: '정해 두지 않으면 얼마가 모자란지도 알 수 없어요.' },
            { q: '국민연금, 공단에서 예상액을 조회해 보셨나요?', hint: '오늘 숫자는 추정이에요. 조회액이 나오면 빈칸이 다시 계산돼요.' },
            { q: retireAge + '세에 회사를 나오면, 연금이 나오기 전까지 무엇으로 생활하나요?', hint: '그 ' + bridgeY + '년이 퇴직금을 가장 먼저 꺼내 쓰는 시간이에요.' },
            { q: '한 분이 먼저 떠나면, 남은 분에게 매달 얼마가 들어오나요?', hint: '연금이 한 사람 이름으로만 있으면 그 사람과 함께 줄어들 수 있어요.' },
            { q: '아프거나 간병이 필요해지면, 그 돈은 어디서 나오나요?', hint: '생활비와 따로 떼어 두지 않으면 생활비가 먼저 줄어요.' } ] }
        ],
        ask: '하나라도 막히셨다면, 그 질문부터 같이 답을 만들어 봐요.' }
    ],

    explain: [
      { q: '왜 변액연금인가요?', a: '은퇴까지 **20년 넘게** 남았어요. 긴 시간 동안은 펀드로 굴려야 물가를 이길 수 있어요. 대신 펀드가 부진할 때를 대비해 **최저보증**이 있는 상품을 골랐어요.' },
      { q: '최저보증이 뭐예요?', a: '펀드 결과와 상관없이 **개시 때 이만큼은 연금의 바탕으로 쳐 준다**는 약속이에요. 이번 설계에서는 그 바탕이 매달 **' + M(me.guaranteedMonthly) + '**이에요. 펀드가 더 잘 되면 더 많이 받아요.' },
      { q: '왜 ' + pension.payYears + '년납인가요?', a: '은퇴 전, 월급이 있을 때 **다 내고 끝내는** 구조예요. 그 뒤로는 내는 돈 없이 적립금이 혼자 커져요.' },
      { q: '퇴직금은 왜 IRP로 받나요?', a: '한 번에 받으면 세금도 한 번에 내요. **IRP로 옮겨 나눠 받으면** 세금이 줄고, 매달 들어오는 돈이 하나 더 생겨요.' }
    ],

    schedule: [
      { when: '이번 주', title: '설계서 함께 읽기', text: '최저보증 조건 · 사업비 · 해지환급금을 같이 확인해요.' },
      { when: '다음 달', title: '첫 납입 · 자동이체', text: '월급날 바로 다음 날로 맞추면 잊지 않아요.' },
      { when: (thisYear + pension.payYears) + '년 · ' + (age + pension.payYears) + '세', title: '납입 완료', text: '이후엔 내지 않고 적립금이 커져요.' },
      { when: (thisYear + retireAge - age) + '년 · ' + retireAge + '세', title: '퇴직 → IRP로 옮기기', text: '일시금 대신 IRP 계좌로 받는 걸 먼저 확인해요.' },
      { when: (thisYear + openAge - age) + '년 · ' + openAge + '세', title: '연금 개시', text: '국민연금과 함께 매달 받기 시작해요.', tone: 'green' }
    ],

    summary: [
      '지금 그대로면 은퇴 후 매달 **' + M(gap0) + '**이 비고, ' + retireAge + '세부터 ' + bridgeY + '년은 연금이 **0원**이에요.',
      '본인은 월 **' + M(pension.premium) + '** × **' + pension.payYears + '년**, ' + openAge + '세부터 받아요.',
      '최저보증 기준 매달 **' + M(me.guaranteedMonthly) + '**, 8%가 나면 **' + M(tg.monthly) + '**(가정)이에요.',
      '낸 돈 **' + M(me.principal) + '**이 개시 때 **' + M(tg.base) + '**(8% 가정)가 돼요.',
      '퇴직금은 **IRP로 나눠 받으면** 세금이 최대 약 **' + M(save) + '** 줄어요(추정).',
      '비과세·세금은 **요건 충족 시** — 가입 전에 세무 전문가와 꼭 확인해요.'
    ],
    assumptions: [
      '**견본 고객** — 홍길동 님은 점검용 이름이에요. 가족·지역·소득은 견본 값이에요.',
      '**연봉** — 9,000만 원(월 750만 원)으로 가정했어요.',
      '**목표 생활비** — 월 400만 원으로 가정했어요.',
      '**배우자 연금** — 월 30만 원 · 10년납 · 40세 가입으로 가정했어요.',
      '**비상금 통장** — 월 20만 원으로 가정했어요.',
      '**퇴직금** — 3.5억 원 · 근속 30년(30세 입사 → 60세 퇴직)으로 가정했어요.',
      '**국민연금** — 기준소득 상한 · 35년 가입 · ' + openAge + '세 개시로 추정했어요(공단 조회로 확인).',
      '**퇴직 후 생활비** — 퇴직한 뒤에도 목표 생활비만큼 쓴다고 봤어요.',
      '**목표 수익률** — 연 8%로 가정했어요(보장되지 않아요).'
    ]
  };
};
