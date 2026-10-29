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

// 6. Self-Diagnosis Form
const diagnosis = document.querySelector('#diagnosis-form');
diagnosis?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(diagnosis);
  const checks = data.getAll('sign');
  const urgent = checks.includes('repeated') || checks.includes('food') || checks.includes('traces');
  const advice = {
    cockroach: '음식물·물기를 정리하고 싱크대 하부, 가전 뒤편, 배관 틈새를 확인하세요. 발견 위치와 시간을 기록하면 현장 진단에 도움이 됩니다.',
    rodent: '식자재와 폐기물을 밀폐하고 출입문·배관 주변 틈새를 확인하세요. 배설물을 맨손으로 만지거나 마른 상태로 쓸어 날리지 마세요.',
    'flying-insects': '음식물과 빈 용기를 밀폐 관리하고 접근 가능한 배수구의 유기물막을 청소하세요. 종류에 따라 발생원이 달라 사진 확인이 도움이 됩니다.',
    mosquito: '주변의 불필요한 고인 물을 없애고 방충망을 확인하세요. 정화조나 밀폐 공간은 직접 진입하지 말고 시설 관리자에게 점검을 요청하세요.'
  };
  const result = document.querySelector('#diagnosis-result');
  result.querySelector('h3').textContent = urgent
    ? '반복 발생 원인에 대한 현장 점검을 권합니다.'
    : checks.length
      ? '발생 지점을 기록하고 환경을 점검해주세요.'
      : '예방 관리와 정기적인 관찰을 이어가세요.';
  result.querySelector('[data-advice]').textContent = advice[data.get('pest')];
  result.querySelector('[data-context]').textContent =
    `선택한 공간: ${data.get('space')} · 확인한 항목: ${checks.length}개. 이 결과는 입력한 관찰 내용에 따른 관리 안내이며, 해충 종류나 서식 규모를 확정하는 진단은 아닙니다.`;
  result.hidden = false;
  result.focus();
});
diagnosis?.addEventListener('reset', () => {
  document.querySelector('#diagnosis-result').hidden = true;
});

// 7. Consultation Message Builder
const consult = document.querySelector('#consult-form');
consult?.addEventListener('submit', event => {
  event.preventDefault();
  const data = new FormData(consult);
  const message = `[에코플랜 공간케어 상담 문의]\n시설: ${data.get('space')}\n지역: ${String(data.get('region')).trim()}\n관심 서비스: ${data.get('service')}\n내용: ${String(data.get('message')).trim() || '상담을 통해 확인하고 싶습니다.'}`;
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
