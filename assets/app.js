// 1. Mobile Navigation Toggle
const menu = document.querySelector('.menu-toggle');
const nav = document.querySelector('#primary-nav');
function closeMenu() {
  nav?.classList.remove('open');
  menu?.setAttribute('aria-expanded', 'false');
}
menu?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menu.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    closeMenu();
    menu.focus();
  }
});
nav?.addEventListener('click', event => {
  if (event.target.closest('a')) closeMenu();
});

// 2. Hero Science Visual Slider
const heroSlides = [
  {
    badge: 'ECOPLAN SCIENCE · 3W & IPM',
    title: '보이지 않는 원인까지,<br><em>과학으로 설계하는 방제.</em>',
    desc: '해충의 실내 유인 요인(Why), 침입 경로(Where), 활동 시간(When)을 추적하는 3W 분석과 IPM 통합방제로 공간을 지킵니다.',
    imgIndex: 0
  },
  {
    badge: 'R&D LAB · BIO & ALIEN ANALYSIS',
    title: '효소·유전자·이물까지,<br><em>데이터로 검증하는 연구소.</em>',
    desc: '계열별 약제 로테이션 설계부터 카탈라제 효소실험, 제3자 기관 유전자·이물분석까지 객관적 근거로 관리합니다.',
    imgIndex: 1
  },
  {
    badge: 'HACCP · GMP · 120 PLACES',
    title: '가정집부터 제조공장까지,<br><em>120개 장소별 맞춤 케어.</em>',
    desc: '외식 프랜차이즈, HACCP·GMP·GSP 제조시설, 빌딩, 병원, 공동주택의 구조에 맞춘 공간케어 솔루션을 제안합니다.',
    imgIndex: 2
  }
];

const heroTabs = document.querySelectorAll('[data-hero-slide]');
const heroBgs = document.querySelectorAll('.hero-slide-bg');
const heroBadge = document.querySelector('[data-hero-badge]');
const heroTitle = document.querySelector('[data-hero-title]');
const heroDesc = document.querySelector('[data-hero-desc]');
let currentSlide = 0;

function setHeroSlide(index) {
  currentSlide = index;
  const item = heroSlides[index];
  if (!item || !heroTitle) return;
  heroBgs.forEach((img, idx) => img.classList.toggle('active', idx === item.imgIndex));
  heroTabs.forEach((btn, idx) => btn.setAttribute('aria-selected', String(idx === index)));
  if (heroBadge) heroBadge.textContent = item.badge;
  heroTitle.innerHTML = item.title;
  if (heroDesc) heroDesc.textContent = item.desc;
}

heroTabs.forEach((btn, idx) => {
  btn.addEventListener('click', () => setHeroSlide(idx));
});

if (heroTabs.length > 1) {
  setInterval(() => {
    setHeroSlide((currentSlide + 1) % heroSlides.length);
  }, 6500);
}

// 3. Interactive Solution Curator Tabs ("어떤 문제를 해결하고 싶나요?")
const curatorTabs = document.querySelectorAll('[data-curator-tab]');
const curatorPanels = document.querySelectorAll('[data-curator-panel]');
curatorTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.curatorTab;
    curatorTabs.forEach(t => t.setAttribute('aria-selected', String(t === tab)));
    curatorPanels.forEach(panel => {
      panel.hidden = panel.dataset.curatorPanel !== target;
    });
  });
});

// 4. Concierge Quick Search Bar
const conciergeForm = document.querySelector('#concierge-form');
conciergeForm?.addEventListener('submit', event => {
  event.preventDefault();
  const q = (conciergeForm.querySelector('input')?.value || '').trim();
  if (!q) {
    window.location.href = 'services.html';
    return;
  }
  if (/바퀴|독먹이|개미/.test(q)) window.location.href = 'cockroach.html';
  else if (/쥐|방서|구멍/.test(q)) window.location.href = 'rodent.html';
  else if (/파리|초파리|나방파리|날파리/.test(q)) window.location.href = 'flying-insects.html';
  else if (/모기|정화조|유충/.test(q)) window.location.href = 'mosquito.html';
  else if (/포충기|쇼핑|트랩/.test(q)) window.location.href = 'shop.html';
  else if (/haccp|gmp|공장|식당|음식점|매장|빌딩/i.test(q)) window.location.href = 'industries.html';
  else if (/이물|클레임|효소|유전자/.test(q)) window.location.href = 'process.html#claims';
  else if (/약제|안전|반려동물|아이|로테이션/.test(q)) window.location.href = 'products-safety.html';
  else window.location.href = `faq.html?q=${encodeURIComponent(q)}`;
});

// 5. FAQ Search & Category Filter
const search = document.querySelector('#faq-search');
let category = '전체';
function filterFaq() {
  const query = (search?.value || '').trim().toLowerCase();
  let count = 0;
  document.querySelectorAll('[data-faq]').forEach(item => {
    const visible = (category === '전체' || item.dataset.category === category) && item.textContent.toLowerCase().includes(query);
    item.hidden = !visible;
    if (visible) count++;
  });
  const status = document.querySelector('#faq-count');
  if (status) status.textContent = `${count}개의 질문을 확인할 수 있습니다.`;
  const empty = document.querySelector('#faq-empty');
  if (empty) empty.hidden = count > 0;
}
if (search) {
  const urlQ = new URLSearchParams(window.location.search).get('q');
  if (urlQ) {
    search.value = urlQ;
    filterFaq();
  }
  search.addEventListener('input', filterFaq);
}
document.querySelectorAll('[data-filter]').forEach(button =>
  button.addEventListener('click', () => {
    category = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    filterFaq();
  })
);

// 6. Detailed 3W Self-Diagnosis System
const pestProfiles = {
  cockroach: {
    name: '독일바퀴 · 미국바퀴',
    link: 'cockroach.html',
    why: '주방 음식물 잔여물, 조리기기 열기(모터부), 싱크대 하부 수분·결로가 주요 유인 요인입니다.',
    where: '싱크대 경첩·하부 배관 관통부, 냉장고·제빙기 모터 뒤편, 입고된 택배·식자재 골판지 박스 틈새.',
    when: '소등 직후 및 야간 시간대에 활동이 급증하며, 낮이나 점등 시에도 보이면 서식 밀도가 높은 상태입니다.',
    stages: [
      { value: '1', title: '1단계 · 초기 침입 의심 (가끔 1마리 목격)', desc: '외부 택배 박스나 배관 틈새를 통해 최근 유입되었을 가능성이 있는 단계입니다.' },
      { value: '2', title: '2단계 · 실내 서식 단계 (구석 물건을 치우면 2~3마리 목격)', desc: '주방 가구·가전 주변에 이미 은신처와 알집(난협)이 형성된 서식 단계입니다.' },
      { value: '3', title: '3단계 · 확산·대량 서식 단계 (전등을 켜면 5마리 이상 또는 약충 다수 목격)', desc: '번식이 빠르게 진행되어 인접 구역까지 확산 중인 집중 방제 필요 단계입니다.' }
    ],
    diy: [
      '구석진 곳에 방치된 택배 박스·종이류·비닐 적치물을 즉시 정리하고 조리 후 물기와 음식물 찌꺼기를 밀폐하세요.',
      '싱크대 하부 배관 주변 틈새와 바닥 배수구 트랩의 벌어짐 여부를 확인해 차단하세요.',
      '에어로졸 살충제를 무작정 분사하면 바퀴벌레가 다른 틈새로 흩어지고 독먹이 기피가 생길 수 있으니 서식 위치를 기록해 두세요.'
    ],
    plan: '포획 트랩 모니터링으로 핵심 군집지를 특정한 뒤, 당분 기피(Bait Aversion)를 고려한 기간별 독먹이 겔 로테이션과 피레스로이드·네오니코티노이드·CS(캡슐)제제를 맞춤 적용합니다.'
  },
  rodent: {
    name: '쥐 (생쥐 · 시궁쥐 · 지붕쥐)',
    link: 'rodent.html',
    why: '식자재 보관소, 음식물 쓰레기, 동절기·야간 실내 온기와 은폐된 천장·벽체 공간이 주요 유인 요인입니다.',
    where: '외곽 하역장·출입문 하단 틈새(0.6cm 이상), 외부 배관·전선 관통부, 천장 텍스 상부 및 가벽 내부 이동 통로.',
    when: '인적이 드문 심야·새벽 시간대에 주로 이동하며, 천장 소음이나 갉은 흔적이 반복되면 실내 정착 가능성이 높습니다.',
    stages: [
      { value: '1', title: '1단계 · 침입 초기 단계 (쥐 배설물이나 포장재 갉은 흔적 발견)', desc: '외부에서 침입 경로를 통해 유입되어 먹이를 탐색하는 단계입니다.' },
      { value: '2', title: '2단계 · 실내 서식 단계 (천장 소음과 함께 실제 쥐가 목격됨)', desc: '실내 천장·창고·벽체 내부에 이동 경로와 은신처를 확보한 단계입니다.' },
      { value: '3', title: '3단계 · 확산 단계 (쥐 소리·배설물·움직이는 쥐가 2마리 이상 반복 목격)', desc: '복수 개체가 유입되었거나 실내 번식·영역 확장이 진행 중인 긴급 방서 단계입니다.' }
    ],
    diy: [
      '쥐 구멍·배관 관통부·출입문 하단 틈새를 확인하고 철수세미·금속망 등으로 우선 차단을 검토하세요.',
      '식자재와 사료·폐기물은 플라스틱이나 비닐 대신 단단한 밀폐 용기에 보관하세요.',
      '쥐 배설물이나 사체는 맨손으로 만지거나 빗자루로 쓸어 먼지를 날리지 말고 장갑·마스크 착용 후 소독 티슈로 처리하세요.'
    ],
    plan: '건물 외곽 디펜스라인(Defense Line) 구축으로 추가 유입을 차단하고, 실내 이동 경로에는 현장 경험을 반영한 전용 살서제 상자와 물리적 포획 장비를 안전하게 배치·모니터링합니다.'
  },
  'moth-fly': {
    name: '나방파리 (하수구·화장실 날파리)',
    link: 'flying-insects.html',
    why: '배수관·트랩·정화조 내부에 쌓인 머리카락·기름때·유기물 슬러지(생물막)가 알과 유충의 직접적인 서식원입니다.',
    where: '화장실 바닥 배수구, 주방 트렌치·그리스트랩, 세면대 오버플로우 구멍, 지하 집수정 및 정화조 환기 배관.',
    when: '비행력이 약해 주로 아침 출근 시나 습도가 높은 시간대에 화장실·주방 타일 벽면에 가만히 붙어 있습니다.',
    stages: [
      { value: '1', title: '1단계 · 실내 서식 초기 (가끔 벽면에 5마리 내외 붙어 있음)', desc: '배수구 트랩 주변 유기물막에서 소수 개체가 우화하기 시작한 초기 단계입니다.' },
      { value: '2', title: '2단계 · 실내 서식 확산 (아침 출근 시 벽면에 10마리 내외 붙어 있음)', desc: '배수로 내부와 구석진 습기 구역에서 유충 서식이 활발해진 단계입니다.' },
      { value: '3', title: '3단계 · 대량 서식 단계 (5일 이상 지속적으로 20마리 내외 많이 보임)', desc: '배수 설비 깊은 곳이나 정화조·집수정에서 대량 번식하여 지속 유입되는 단계입니다.' }
    ],
    diy: [
      '1단계: 배수로 거름망과 트랩 내부의 유기물 슬러지를 긴 솔과 세제로 문질러 물리적으로 제거하세요.',
      '2단계: 배수로 및 구석진 물고임 구역을 온수와 전용 세정제로 청소하고 사용하지 않는 배수구는 덮개로 막으세요.',
      '3단계: 정화조·지하 배수 설비 내부 유충까지 관리해야 하므로 방제 전문기업 점검 및 포충기 설치를 권장합니다.'
    ],
    plan: '배수구·트랩·정화조의 유충 서식원을 진단해 유충구제제(IGR)·CS제제를 적용하고, 배수 트랩 밀폐 및 SMART CATCH 포충기 배치로 성충까지 동시 관리합니다.'
  },
  'fruit-fly': {
    name: '초파리 · 벼룩파리',
    link: 'flying-insects.html',
    why: '과일 껍질, 음료 시럽, 맥주·주류 잔여물, 음식물 쓰레기의 발효취와 주방 바닥의 부패 유기물이 핵심 유인원입니다.',
    where: '음식물 쓰레기통 주변, 음료 디스펜서·커피머신 하부, 빈 병 보관함, 싱크대 배수구 및 주방 걸레·청소도구.',
    when: '기온이 올라가는 봄~가을철 및 주방 조리·마감 전후에 음식물과 쓰레기통 주변에서 집중적으로 날아다닙니다.',
    stages: [
      { value: '1', title: '1단계 · 실내 침입 단계 (눈앞에 날리는 개체가 5마리 내외 보임)', desc: '외부에서 발효취를 따라 유입되었거나 소량의 잔여물에서 막 발생하기 시작한 단계입니다.' },
      { value: '2', title: '2단계 · 실내 서식 단계 (쓰레기통·조리대 주변에 10마리 내외 날림)', desc: '실내 쓰레기통 하부, 배수구, 조리기기 틈새 유기물에 산란하여 자체 번식 중인 단계입니다.' },
      { value: '3', title: '3단계 · 대량 서식 단계 (움직일 때마다 20마리 내외가 떼 지어 날림)', desc: '주방 하부·배수관·폐기물 구역 전반에 유충과 번데기가 퍼져 전문 방제가 필요한 단계입니다.' }
    ],
    diy: [
      '1단계: 외부·실내 쓰레기통을 확인하고 뚜껑을 반드시 밀폐하며 과일·식자재를 상온에 노출하지 마세요.',
      '2단계: 실내 음식물 쓰레기는 즉시 밀봉해 외부로 배출하고 음료 디스펜서·배수구 잔여물을 마감 시 세척하세요.',
      '3단계: 숨은 산란처 제거와 유입 차단이 동시에 필요하므로 방제 전문가 진단 및 포충기 설치를 검토하세요.'
    ],
    plan: '3W 분석으로 주방·매장 내 숨은 발효·부패 산란처를 찾아 원천 제거하고, 유충·성충 동시 처리 및 식품 안전 구역에 맞춘 포충기 파장 설계를 적용합니다.'
  },
  'house-fly': {
    name: '집파리 · 대형 파리류',
    link: 'flying-insects.html',
    why: '음식부패취 → 실내외 온도차 및 조리 냄새, 외부 폐기물 보관소의 유기물이 파리를 실내로 강하게 유인합니다.',
    where: '매장 주 출입문, 하역장 개방 도어, 찢어진 방충망, 외부 쓰레기 적치장 및 음식물 수거함 주변.',
    when: '주간 영업시간, 식자재 납품·하역 시점, 출입문 개폐가 잦은 시간대에 외부에서 실내로 집중 유입됩니다.',
    stages: [
      { value: '1', title: '1단계 · 외부 침입 단계 (눈앞에 날리는 파리가 3마리 내외 보임)', desc: '출입문 개폐 시 외부에서 일시적으로 유입된 초기 단계입니다.' },
      { value: '2', title: '2단계 · 주변 서식 단계 (천장 및 벽면에 10마리 내외가 붙어 있음)', desc: '건물 외곽 폐기물장이나 인근 발생원에서 지속적으로 유입·휴식하는 단계입니다.' },
      { value: '3', title: '3단계 · 대량 서식·유입 단계 (문을 열어 놓으면 20마리 내외가 지속 유입됨)', desc: '외부 발생원 밀도가 매우 높고 출입구 차단 체계가 취약해 즉각적인 방제·포획 설계가 필요한 단계입니다.' }
    ],
    diy: [
      '1단계: 출입문 자동 닫힘 장치(도어클로저), 에어커튼, 방충망의 틈새를 확인하고 개방 시간을 줄이세요.',
      '2단계: 건물 외부 쓰레기통의 위치를 출입구에서 멀리 이격하고 뚜껑을 상시 밀폐하세요.',
      '3단계: 외곽 유인원 방제와 실내 동선별 전문 포충기 설치를 위해 방제회사 상담을 권장합니다.'
    ],
    plan: '파리의 실내 유인 요인(음식부패취→온도)과 출입구 동선을 분석해 외곽 잔류 분무·독먹이 처리, 물리적 침입 차단, 출입구 유인 포충기 배치를 결합합니다.'
  },
  mosquito: {
    name: '집모기 · 지하모기 (빨간집모기)',
    link: 'mosquito.html',
    why: '사람의 체열(열) → 호흡 이산화탄소(CO2) → 체취(냄새) 순서로 유인되며, 고인 물이 유충(장구벌레)의 서식처가 됩니다.',
    where: '지하 정화조·집수정·배수 펌프실(겨울철 포함 연중 서식), 화분 받침대, 옥상·외곽 고인 물, 화장실 환풍구·배관 틈새.',
    when: '야간 및 새벽 시간대에 흡혈 활동이 활발하며, 겨울철에도 실내에서 보인다면 건물 지하·정화조 내부 번식 신호입니다.',
    stages: [
      { value: '1', title: '1단계 · 외부 침입 단계 (가끔 실내에서 1~3마리 내외 보임)', desc: '출입문이나 창문 방충망 틈새로 외부 성충이 유입된 단계입니다.' },
      { value: '2', title: '2단계 · 주변 서식 단계 (화장실·복도 벽면에 5마리 내외 붙어 있음)', desc: '건물 주변 물고임 장소나 지하 배수 설비에서 모기가 발생해 유입되는 단계입니다.' },
      { value: '3', title: '3단계 · 대량 서식 단계 (매일 보이거나 겨울철에도 10마리 내외 지속 출현)', desc: '건물 정화조·집수정 등 내부 수역에서 유충이 대량 번식하여 배관을 타고 올라오는 단계입니다.' }
    ],
    diy: [
      '1단계: 창문 방충망 물구멍·틀 틈새와 출입문 닫힘 상태를 점검해 외부 유입을 막으세요.',
      '2단계: 화분 받침, 건물 주변 폐용기, 배수로 등 고인 물을 찾아 제거하세요.',
      '3단계: 정화조·밀폐 지하 공간은 직접 들어가지 말고 방제 전문기업에 유충구제 및 환기구 망 설치를 요청하세요.'
    ],
    plan: '정화조·집수정 등 유충 서식 수역에 환경부 허가 유충구제제를 투여해 발생원을 차단하고, 성충 휴식 장소 잔류 처리와 실내 유입 통로 차단을 병행합니다.'
  },
  ant: {
    name: '개미 · 저곡해충 (권연벌레·화랑곡나방)',
    link: 'services.html',
    why: '당분·단백질 음식물 조각, 오래 보관된 곡물·건어물·반려동물 사료, 습하고 따뜻한 벽체·바닥 틈새가 주요 원인입니다.',
    where: '창틀·걸레받이·타일 줄눈 틈새(개미 이동 통로), 팬트리·식자재 창고의 개봉된 포장재 및 종이 포대 내부.',
    when: '개미는 먹이 탐색 경로가 형성되면 줄지어 이동하며, 권연벌레·나방류는 건조 식자재 보관 기간이 길어질수록 급증합니다.',
    stages: [
      { value: '1', title: '1단계 · 탐색·초기 발견 (간헐적으로 1~5마리 미만 목격)', desc: '정찰 개미가 먹이를 탐색하거나 입고된 물품에서 소수 개체가 나온 초기 단계입니다.' },
      { value: '2', title: '2단계 · 경로 형성·국소 번식 (일정한 줄을 지어 이동하거나 보관장 주변 10마리 내외)', desc: '군집과 연결된 페로몬 이동 경로가 형성되었거나 특정 식자재 내부에서 번식 중인 단계입니다.' },
      { value: '3', title: '3단계 · 다발 확산 단계 (여러 구역에서 동시 출현 및 식자재·제품 오염 우려)', desc: '벽체 내부 여왕개미 군집 확장 또는 창고 내 다수 품목으로 감염이 번진 단계입니다.' }
    ],
    diy: [
      '줄지어 이동하는 개미에 스프레이 살충제를 뿌리면 군집이 쪼개져 확산될 수 있으니 이동 경로 끝 지점을 먼저 확인하세요.',
      '오래된 곡물·분말·건어물·드라이플라워·사료 포장을 점검해 작은 구멍이나 가루가 보이면 즉시 밀봉 폐기하세요.',
      '식자재는 지퍼백이나 비닐 대신 밀폐 용기에 옮겨 담고 바닥에서 이격해 보관하세요.'
    ],
    plan: '여왕개미까지 연쇄 제거하는 전용 독먹이 겔 처리와 저곡해충 페로몬 트랩 모니터링을 통해 감염 원천 품목과 서식 틈새를 정밀 관리합니다.'
  },
  other: {
    name: '먼지다듬이 · 진드기 · 지네 · 기타',
    link: 'industries.html',
    why: '실내 고습도(60% 이상)·결로·미세 곰팡이(먼지다듬이), 외부 화단·낙엽·습기 틈새(지네·노래기)가 주요 발생 원인입니다.',
    where: '신축 아파트·원목 가구·책장·벽지 틈새(먼지다듬이), 1층·전원주택·지하층 출입문 및 외벽 갈라진 틈(지네·외래해충).',
    when: '장마철·환절기 고습도 환경이나 신축 입주 초기에 집중 발생하며 야간에 활동성이 높아집니다.',
    stages: [
      { value: '1', title: '1단계 · 간헐적 목격 (특정 위치에서 1~3마리 미만 발견)', desc: '외부에서 우연히 유입되었거나 국소 습기 구역에서 막 발생한 단계입니다.' },
      { value: '2', title: '2단계 · 반복 출현 (같은 방·가구·창틀 주변에서 매주 반복 목격)', desc: '실내 습도·곰팡이 조건이 맞아 번식 중이거나 외벽 침입 통로가 열려 있는 단계입니다.' },
      { value: '3', title: '3단계 · 광범위 확산 (여러 공간에서 매일 다수 목격 및 생활 불편 심화)', desc: '온·습도 환경 개선과 함께 공간 전체의 정밀 약제 처리·침입 차단이 필요한 단계입니다.' }
    ],
    diy: [
      '제습기와 환기를 통해 실내 상대습도를 45~50% 이하로 낮추고 가구 뒤편·창틀의 결로와 곰팡이를 제거하세요.',
      '건물 외벽과 1층 출입문 주변의 낙엽·화분·돌무더기 등 습한 은신처를 치우고 창틀 물구멍을 점검하세요.',
      '정확한 해충 동정(종류 판별)을 위해 발견한 개체를 테이프나 용기에 보존하거나 접사 사진을 남겨두세요.'
    ],
    plan: '해충 동정으로 정확한 종과 생활사를 판별한 뒤, 외곽 침입 차단 벨트 구축(지네·보행해충) 및 미세 틈새 전용 약제 처리(먼지다듬이 등)를 진행합니다.'
  }
};

const diagnosis = document.querySelector('#diagnosis-form');
const stageContainer = document.querySelector('#stage-options-container');

function renderStageOptions(pestKey) {
  if (!stageContainer) return;
  const profile = pestProfiles[pestKey] || pestProfiles.cockroach;
  stageContainer.innerHTML = profile.stages
    .map(
      (st, idx) => `
    <label class="stage-choice">
      <input type="radio" name="stage" value="${st.value}" ${idx === 1 ? 'checked' : ''}>
      <div>
        <strong>${st.title}</strong>
        <span>${st.desc}</span>
      </div>
    </label>`
    )
    .join('');
}

document.querySelectorAll('input[name="pest"]').forEach(radio => {
  radio.addEventListener('change', () => renderStageOptions(radio.value));
});
const initialPest = document.querySelector('input[name="pest"]:checked')?.value;
if (initialPest) renderStageOptions(initialPest);

diagnosis?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(diagnosis);
  const pestKey = data.get('pest') || 'cockroach';
  const profile = pestProfiles[pestKey] || pestProfiles.cockroach;
  const space = data.get('space') || '가정·공동주택';
  const zone = data.get('zone') || '주방·조리실·싱크대';
  const stageVal = Number(data.get('stage') || 2);
  const signs = data.getAll('sign');

  let score = stageVal === 1 ? 32 : stageVal === 2 ? 64 : 86;
  score += Math.min(14, signs.length * 4);
  if (signs.includes('food') || signs.includes('larva')) score = Math.min(98, score + 6);

  const stageObj = profile.stages.find(s => Number(s.value) === stageVal) || profile.stages[1];
  const levelText =
    stageVal === 3 || score >= 80
      ? '3단계 · 확산·대량서식 위험 (전문가 정밀방제 권장)'
      : stageVal === 2 || score >= 55
        ? '2단계 · 실내·주변 서식 진행 (원인 차단 및 방제 점검 필요)'
        : '1단계 · 초기 침입·관찰 단계 (즉시 환경정비 및 예방 관리)';

  const levelClass = stageVal === 3 || score >= 80 ? 'high' : stageVal === 2 || score >= 55 ? 'mid' : '';

  const result = document.querySelector('#diagnosis-result');
  const badgeEl = result.querySelector('[data-level-badge]');
  badgeEl.textContent = `${levelText} · 위험도 ${score}점`;
  badgeEl.className = `diag-level-badge ${levelClass}`;

  result.querySelector('[data-meter-bar]').style.width = `${score}%`;
  result.querySelector('h3').textContent = `[${space} · ${zone}] ${profile.name} 정밀 진단 리포트`;
  result.querySelector('[data-stage-summary]').textContent = `관찰 상태: ${stageObj.title} — ${stageObj.desc}`;

  result.querySelector('[data-why]').textContent = profile.why;
  result.querySelector('[data-where]').textContent = `${zone} 중심 점검 — ${profile.where}`;
  result.querySelector('[data-when]').textContent = profile.when;

  const diyList = result.querySelector('[data-diy-list]');
  diyList.innerHTML = profile.diy.map(item => `<li>${item}</li>`).join('');

  result.querySelector('[data-plan]').textContent = profile.plan;
  result.querySelector('[data-pest-link]').href = profile.link;

  const summaryForConsult = `[자가진단 요약] ${space}(${zone}) / 대상: ${profile.name} / 단계: ${stageObj.title} (위험도 ${score}점) / 추가징후 ${signs.length}건`;
  result.querySelector('[data-consult-link]').href = `contact.html?space=${encodeURIComponent(space)}&summary=${encodeURIComponent(summaryForConsult)}`;
  result.dataset.summary = summaryForConsult;

  result.hidden = false;
  result.focus();
});

diagnosis?.addEventListener('reset', () => {
  setTimeout(() => {
    renderStageOptions('cockroach');
    const result = document.querySelector('#diagnosis-result');
    if (result) result.hidden = true;
  }, 10);
});

document.querySelector('#copy-diagnosis')?.addEventListener('click', async () => {
  const result = document.querySelector('#diagnosis-result');
  const status = document.querySelector('#diag-copy-status');
  const text = result?.dataset.summary || '';
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    if (status) status.textContent = '진단 요약을 복사했습니다. 상담 문의 시 붙여넣어 전달해 주세요.';
  } catch {
    if (status) status.textContent = '복사가 지원되지 않는 환경입니다. 상담 신청하기 버튼을 눌러 바로 이동하세요.';
  }
});

// Pre-fill consultation form if redirected from self-diagnosis
const consultMsgField = document.querySelector('#consult-message');
if (consultMsgField) {
  const params = new URLSearchParams(window.location.search);
  const summary = params.get('summary');
  if (summary && !consultMsgField.value) {
    consultMsgField.value = `${summary}\n현장 방문 가능 일정과 맞춤 방제 견적 상담을 요청합니다.`;
  }
}

// 7. Consultation Message Builder & Admin Inquiry Log
const consult = document.querySelector('#consult-form');
consult?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(consult);
  const space = data.get('space');
  const region = String(data.get('region')).trim();
  const service = data.get('service');
  const msgText = String(data.get('message')).trim() || '상담을 통해 확인하고 싶습니다.';
  const message = `[에코플랜 공간케어 상담 문의]\n시설: ${space}\n지역: ${region}\n관심 서비스: ${service}\n내용: ${msgText}`;

  try {
    const raw = localStorage.getItem('ecoplan_cms_v1');
    const cms = raw ? JSON.parse(raw) : {};
    cms.consultations = cms.consultations || [];
    cms.consultations.unshift({
      id: 'inq-' + Date.now(),
      created_at: new Date().toISOString(),
      name: `${space} (${region})`,
      phone: '온라인 문의',
      service_type: service,
      message: msgText,
      status: '접수대기'
    });
    localStorage.setItem('ecoplan_cms_v1', JSON.stringify(cms));
  } catch {}

  const result = document.querySelector('#consult-result');
  result.querySelector('pre').textContent = message;
  result.querySelector('[data-email]').href = `mailto:eco@ecoplan.co.kr?subject=${encodeURIComponent('에코플랜 공간케어 상담 문의')}&body=${encodeURIComponent(message)}`;
  result.hidden = false;
  result.focus();
});
document.querySelector('#copy-inquiry')?.addEventListener('click', async () => {
  const preview = document.querySelector('#consult-result pre');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(preview.textContent);
    status.textContent = '문의 내용을 복사했습니다. 카카오톡 대화창에 붙여넣고 전송해주세요.';
  } catch {
    const range = document.createRange();
    range.selectNodeContents(preview);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = '자동 복사가 지원되지 않습니다. 선택된 문의 내용을 직접 복사해주세요.';
  }
});

// 8. Shop Category Filter
function bindShopFilter() {
  document.querySelectorAll('[data-shop-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.shopFilter;
      document.querySelectorAll('[data-shop-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === btn)));
      document.querySelectorAll('[data-cms-shop] .shop-product-card').forEach(card => {
        card.style.display = cat === '전체' || card.dataset.shopCat === cat ? '' : 'none';
      });
    });
  });
}
bindShopFilter();

// 9. EcoPlan Dynamic CMS Sync Engine & Visual Live Editor
function escHtml(val) {
  return String(val ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function applyCmsOverrides() {
  let cms;
  try {
    const raw = localStorage.getItem('ecoplan_cms_v1');
    if (!raw) return;
    cms = JSON.parse(raw);
  } catch {
    return;
  }
  if (!cms || typeof cms !== 'object') return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // A. Top Categories / Navigation Menu Override
  if (Array.isArray(cms.navItems) && cms.navItems.length > 0 && nav) {
    const visibleNav = cms.navItems.filter(item => item.visible !== false);
    nav.innerHTML = visibleNav
      .map(item => `<a href="${escHtml(item.href)}"${item.href === currentPage ? ' aria-current="page"' : ''}>${escHtml(item.label)}</a>`)
      .join('');
    nav.style.gridTemplateColumns = window.innerWidth <= 820 ? `repeat(${Math.max(1, visibleNav.length)}, 1fr)` : '';
  }

  // B. Hero Slides Text Override
  if (Array.isArray(cms.heroSlides) && cms.heroSlides.length === 3) {
    cms.heroSlides.forEach((custom, idx) => {
      if (heroSlides[idx]) {
        if (custom.badge) heroSlides[idx].badge = custom.badge;
        if (custom.title) heroSlides[idx].title = custom.title;
        if (custom.desc) heroSlides[idx].desc = custom.desc;
        if (custom.tabLabel && heroTabs[idx]) heroTabs[idx].textContent = custom.tabLabel;
      }
    });
    setHeroSlide(currentSlide);
  }

  // C. Global Image Replacements (Any image path mapped in cms.images)
  if (cms.images && typeof cms.images === 'object') {
    document.querySelectorAll('img').forEach(img => {
      const rawAttr = img.getAttribute('src');
      if (rawAttr && cms.images[rawAttr]) {
        img.src = cms.images[rawAttr];
      }
    });
  }

  // D. Section Visibility, Order, Title & Subtitle Management
  if (Array.isArray(cms.sections) && currentPage === 'index.html') {
    const mainEl = document.querySelector('#main');
    cms.sections.forEach(sec => {
      const el = document.querySelector(`[data-section-id="${sec.id}"]`);
      if (!el) return;
      el.style.display = sec.visible === false ? 'none' : '';
      if (sec.eyebrow) {
        const ey = el.querySelector('.section-heading .eyebrow');
        if (ey) ey.innerHTML = `<span class="dot"></span>${escHtml(sec.eyebrow)}`;
      }
      if (sec.title) {
        const h2 = el.querySelector('.section-heading h2');
        if (h2) h2.innerHTML = sec.title;
      }
      if (sec.desc) {
        const p = el.querySelector('.section-heading p');
        if (p) p.textContent = sec.desc;
      }
      if (mainEl) mainEl.appendChild(el);
    });
    const banner = mainEl?.querySelector('.contact-banner');
    if (banner) mainEl.appendChild(banner);
  }

  // E. Partners Dynamic Render
  if (Array.isArray(cms.partners)) {
    document.querySelectorAll('[data-cms-partners]').forEach(container => {
      const list = [...cms.partners];
      if (cms.partnerSort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      else if (cms.partnerSort === '-created_at') list.reverse();

      container.innerHTML = list
        .map(
          p => `<a class="partner-card" href="${escHtml(p.homepage_url || 'partners.html')}"${p.homepage_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="partner-poster"><img src="${escHtml(p.image)}" alt="${escHtml(p.name)} 파트너사 포스터" width="420" height="594" loading="lazy"></div><div class="partner-info"><h3>${escHtml(p.name)}</h3><p>${escHtml(p.description)}</p><span class="partner-link-badge">공식 사이트·안내 ↗</span></div></a>`
        )
        .join('');
    });
  }

  // F. Shop Products Dynamic Render & Categories
  if (Array.isArray(cms.shopProducts)) {
    const list = [...cms.shopProducts];
    if (cms.shopSort === 'price') list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    else if (cms.shopSort === '-price') list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    else if (cms.shopSort === 'created_at') list.reverse();

    document.querySelectorAll('[data-cms-shop]').forEach(container => {
      container.innerHTML = list
        .map(
          item => `<a class="shop-product-card" data-shop-cat="${escHtml(item.category || '업소·매장용 포충기')}" href="${escHtml(item.link_url || 'contact.html')}"${item.link_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="shop-product-thumb"><img src="${escHtml(item.image)}" alt="${escHtml(item.name)}" width="500" height="500" loading="lazy"></div><div class="shop-product-body"><span class="shop-cat-badge">${escHtml(item.category || '업소·매장용 포충기')}</span><h3>${escHtml(item.name)}</h3><div class="shop-price">${Number(item.price || 0).toLocaleString('ko-KR')}원</div><p>${escHtml(item.description)}</p><span class="shop-buy-btn">제품 상세·구매하기 ↗</span></div></a>`
        )
        .join('');
    });

    const filterRow = document.querySelector('#shop-cat-filters');
    if (filterRow && Array.isArray(cms.shopCategories) && cms.shopCategories.length > 0) {
      const cats = ['전체', ...cms.shopCategories];
      filterRow.innerHTML = cats
        .map((cat, idx) => `<button type="button" class="filter-btn" data-shop-filter="${escHtml(cat)}" aria-pressed="${idx === 0}">${escHtml(cat)}</button>`)
        .join('');
      bindShopFilter();
    }
  }

  // G. Company Info Overrides (Phone, Representative, Address, Email)
  if (cms.companyInfo) {
    const info = cms.companyInfo;
    if (info.phone) {
      document.querySelectorAll('.header-phone, .footer-contact strong a, .contact-number').forEach(el => {
        el.textContent = info.phone;
        if (el.tagName === 'A') el.href = 'tel:' + info.phone.replace(/[^0-9]/g, '');
      });
    }
  }

  // H. Page-specific Visual Text & Image Edits (Saved via Visual Live Editor)
  if (cms.pageEdits && cms.pageEdits[currentPage]) {
    const pageData = cms.pageEdits[currentPage];
    if (pageData.texts) {
      const textNodes = document.querySelectorAll('h1, h2, h3, h4, p, span, small, li, figcaption, td, th, summary');
      Object.entries(pageData.texts).forEach(([idx, htmlVal]) => {
        if (textNodes[idx]) textNodes[idx].innerHTML = htmlVal;
      });
    }
    if (pageData.imgs) {
      const imgNodes = document.querySelectorAll('main img, header img, footer img');
      Object.entries(pageData.imgs).forEach(([idx, srcVal]) => {
        if (imgNodes[idx]) imgNodes[idx].src = srcVal;
      });
    }
  }
}

applyCmsOverrides();

// 10. Visual Live Editor Mode (?edit=1) — Click any text or photo on the page to edit directly
if (new URLSearchParams(window.location.search).get('edit') === '1') {
  document.body.classList.add('cms-visual-edit');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  const bar = document.createElement('div');
  bar.className = 'cms-edit-bar';
  bar.innerHTML = `
    <span>✏️ 실시간 비주얼 편집 모드 (글씨 클릭=수정 / 사진 클릭=교체)</span>
    <button type="button" id="cms-save-visual" style="background:#00b89c;color:#fff;cursor:pointer">현재 페이지 저장</button>
    <a href="manager.html" style="background:#fff;color:#0b1b32">관리자 홈으로</a>
    <a href="${currentPage}" style="background:rgba(255,255,255,0.18);color:#fff">편집 종료</a>
  `;
  document.body.appendChild(bar);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';
  document.body.appendChild(fileInput);

  const textNodes = document.querySelectorAll('main h1, main h2, main h3, main h4, main p, main span:not(.dot), main small, main li, main figcaption, main td, main th, main summary');
  textNodes.forEach(node => {
    node.setAttribute('contenteditable', 'true');
    node.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      node.focus();
    });
  });

  let activeImg = null;
  const imgNodes = document.querySelectorAll('main img, header img, footer img');
  imgNodes.forEach(img => {
    img.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      activeImg = img;
      fileInput.click();
    });
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    if (!file || !activeImg) return;
    const reader = new FileReader();
    reader.onload = () => {
      activeImg.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

  document.querySelector('#cms-save-visual')?.addEventListener('click', () => {
    const raw = localStorage.getItem('ecoplan_cms_v1');
    const cms = raw ? JSON.parse(raw) : {};
    cms.pageEdits = cms.pageEdits || {};
    cms.pageEdits[currentPage] = { texts: {}, imgs: {} };

    const allTexts = document.querySelectorAll('h1, h2, h3, h4, p, span, small, li, figcaption, td, th, summary');
    allTexts.forEach((node, idx) => {
      if (node.closest('.cms-edit-bar')) return;
      cms.pageEdits[currentPage].texts[idx] = node.innerHTML;
    });

    const allImgs = document.querySelectorAll('main img, header img, footer img');
    allImgs.forEach((img, idx) => {
      cms.pageEdits[currentPage].imgs[idx] = img.getAttribute('src');
    });

    localStorage.setItem('ecoplan_cms_v1', JSON.stringify(cms));
    alert('현재 페이지의 모든 글씨와 사진 수정사항이 저장되었습니다!');
  });
}
