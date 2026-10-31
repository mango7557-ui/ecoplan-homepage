import { mkdir, writeFile, copyFile, readFile } from 'node:fs/promises';
import { company as c, pests, faqs, industries } from '../src/content.mjs';
import { buildAdminHtml } from '../src/admin-template.mjs';

const partners = JSON.parse(await readFile('src/partners.json', 'utf8'));
const shopProducts = JSON.parse(await readFile('src/shop.json', 'utf8'));

const esc = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const icons = {
  shield: '<path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  bug: '<ellipse cx="12" cy="13" rx="4" ry="6"/><path d="M10 7V5l-2-2m6 4V5l2-2M4 8l4 2m8 0 4-2M3 14h5m8 0h5M5 20l4-3m6 0 4 3M12 8v10"/>',
  fly: '<path d="m11 10-5-5c-4-2-5 4-1 6l6 2m2-3 5-5c4-2 5 4 1 6l-6 2M12 7v13m-3-3 3-2 3 2m-5-9 2-2 2 2"/>',
  building: '<path d="M5 21V4h14v17M3 21h18M9 8h1m4 0h1m-6 4h1m4 0h1m-5 9v-5h4v5"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
  chart: '<path d="M4 3v18h17M8 16v-4m5 4V7m5 9v-7"/>',
  phone: '<path d="m5 3 4 4-2 3c1 3 4 6 7 7l3-2 4 4-3 3C9 21 3 15 2 6z"/>',
  chat: '<path d="M21 11c0 5-4 8-9 8H7l-5 3 2-6a8 8 0 0 1-2-5c0-5 4-8 10-8s9 3 9 8Z"/><path d="M7 11h.1m5 0h.1m5 0h.1"/>',
  leaf: '<path d="M20 3c-1 8-1 15-9 16-8 0-9-10-2-12 4-1 7-1 11-4Z"/><path d="M4 22 16 10"/>',
  clipboard: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4V2h6v2M9 10h6m-6 4h6m-6 4h4"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  shop: '<path d="M4 8h16l-1 13H5zM8 8V6a4 4 0 0 1 8 0v2"/>'
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.shield}</svg>`;
const pages = [];
const link = (path, text, cls = '') => `<a href="${path}"${cls ? ` class="${cls}"` : ''}>${text}</a>`;
const btn = (path, text, style = '') => link(path, `${text}${icon('arrow')}`, `btn ${style}`);
const sectionHeading = (eyebrow, title, desc = '', href = '', more = '자세히 알아보기') => `<div class="section-heading"><div><span class="eyebrow"><span class="dot"></span>${eyebrow}</span><h2>${title}</h2>${desc ? `<p>${desc}</p>` : ''}</div>${href ? link(href, `${more} <span aria-hidden="true">↗</span>`, 'text-link') : ''}</div>`;
const faqHtml = (list, searchable = false) => `<div class="faq-list">${list.map((f, i) => `<details id="question-${i + 1}"${searchable ? ` data-faq data-category="${esc(f.category || '해충별')}"` : ''}><summary><span aria-hidden="true">Q</span>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>`;
const faqSchema = list => ({ '@type': 'FAQPage', mainEntity: list.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) });
const sources = `<div class="source-line"><strong>전문 정보 작성 · 검토 및 공인 기준 출처 안내</strong><br>• 작성·검토 주체: ${c.legalName} 기술연구소 · 위해생물방제사 기술지원팀 (대표 ${c.representative} · 고객센터 ${link('tel:16884587', c.phone)})<br>• 최초 구성일: <time datetime="${c.updated}">2026.10.28</time> &nbsp;|&nbsp; 최종 개정·검수일: <time datetime="2026-11-01">2026.11.01</time><br>• 참고 법령 및 1차 공공 기준: <a href="https://ecolife.me.go.kr" target="_blank" rel="noopener noreferrer">환경부 초록누리(살생물제 승인기준) ↗</a> · <a href="https://www.kdca.go.kr" target="_blank" rel="noopener noreferrer">질병관리청 감염병 매개체 종합방제(IPM) 지침 ↗</a> · <a href="https://www.haccp.or.kr" target="_blank" rel="noopener noreferrer">한국식품안전관리인증원(HACCP 방충·방서 기준) ↗</a> · <a href="https://www.law.go.kr" target="_blank" rel="noopener noreferrer">감염병예방법 소독기준 ↗</a><br>• 공식 채널 확인: <a href="https://www.ecoplan.co.kr/" target="_blank" rel="noopener noreferrer">에코플랜 공식 도메인(ecoplan.co.kr) ↗</a> · <a href="https://smartstore.naver.com/smartcatch" target="_blank" rel="noopener noreferrer">스마트캐치 공식 네이버 스마트스토어 ↗</a> · ${link('contact.html', '현장 맞춤 상담 신청')}</div>`;

const pestPhotos = {
  cockroach: 'assets/sol-cockroach.webp',
  rodent: 'assets/sol-rodent.webp',
  'flying-insects': 'assets/sol-flying.webp',
  mosquito: 'assets/sol-mosquito.webp'
};

const placePhotos = {
  restaurant: 'assets/place-restaurant.webp',
  factory: 'assets/place-factory.webp',
  building: 'assets/place-building.webp',
  hospital: 'assets/place-hospital.webp',
  home: 'assets/place-home.webp',
  retail: 'assets/place-retail.webp'
};

const serviceCards = () => `<div class="service-grid">${pests.map((p, i) => `<a class="service-card" href="${p.slug}.html"><div class="service-card-media"><img src="${pestPhotos[p.slug]}" alt="${p.name} 방제 비주얼 이미지" width="900" height="600" loading="lazy"></div><div class="service-card-body"><small>0${i + 1} · ${p.en}</small><h3>${p.name} 맞춤 솔루션</h3><p>${p.desc}. 3W 발생 원인 진단부터 서식처 원천 차단과 정기 모니터링까지 체계적으로 관리합니다.</p><div class="card-foot">${p.name} 방제 상세보기 <span aria-hidden="true">↗</span></div></div></a>`).join('')}</div>`;

const industryCards = () => `<div class="industry-grid">${industries.map(i => `<a href="industries.html#${i[0]}" class="industry-card"><div class="industry-card-media"><img src="${placePhotos[i[0]]}" alt="${i[1]} 위생관리 공간 이미지" width="880" height="580" loading="lazy"></div><div class="industry-card-body"><h3>${i[1]}</h3><p>${i[3]}</p><small><span>${i[4]}</span><span aria-hidden="true">↗</span></small></div></a>`).join('')}</div>`;

const partnerCards = (full = false) => `<div class="${full ? 'partner-grid-full' : 'partner-strip'}" data-cms-partners="${full ? 'full' : 'strip'}">${partners.map(p => `<a class="partner-card" href="${esc(p.homepage_url || 'partners.html')}"${p.homepage_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="partner-poster"><img src="${p.image}" alt="${esc(p.name)} 파트너사 포스터" width="420" height="594" loading="lazy"></div><div class="partner-info"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><span class="partner-link-badge">${esc(p.name)} 공식 안내 ↗</span></div></a>`).join('')}</div>`;

const shopCards = () => `<div class="shop-product-grid" data-cms-shop>${shopProducts.map(item => `<a class="shop-product-card" data-shop-cat="${esc(item.category || '업소·매장용 포충기')}" href="${esc(item.link_url || 'contact.html')}"${item.link_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="shop-product-thumb"><img src="${item.image}" alt="${esc(item.name)}" width="500" height="500" loading="lazy"></div><div class="shop-product-body"><span class="shop-cat-badge">${esc(item.category || '업소·매장용 포충기')}</span><h3>${esc(item.name)}</h3><div class="shop-price">${Number(item.price || 0).toLocaleString('ko-KR')}원</div><p>${esc(item.description)}</p><span class="shop-buy-btn">포충기 상세·구매하기 ↗</span></div></a>`).join('')}</div>`;

const stepsHtml = () => `<div class="steps">${[['사전조사 (3W 진단)', '발생 이유(Why)·침입 경로(Where)·활동 시간(When) 3W 정밀 분석', 'search'], ['계획수립 (IPM 설계)', '해충의 생활사·행동 패턴과 시설 기준에 맞춘 방제 전략·주기 수립', 'clipboard'], ['맞춤 방제 & 약제 로테이션', '계열별 허가 약제·장비 적용과 환경개선 제안을 동시에 실행', 'shield'], ['평가 · 사후 모니터링', '포획·발생 기록으로 현 수준을 평가하고 재발 방지 기준 고도화', 'chart']].map((s, i) => `<div class="step"><span class="step-num">0${i + 1}</span><div><h3>${s[0]}</h3><p>${s[1]}</p></div>${icon(s[2])}</div>`).join('')}</div>`;

const curatorSection = () => {
  const tabs = [
    {
      id: 'total',
      label: '보행해충 방제',
      icon: 'bug',
      photo: 'assets/sol-cockroach.webp',
      eyebrow: 'COCKROACH & RODENT CARE',
      title: '어디선가 나타나는 바퀴벌레와 쥐, 숨은 서식처까지 찾고 싶다면?',
      desc: '단순히 눈에 보이는 개체만 잡지 않습니다. 주방·배관 틈새·외곽 디펜스라인을 3W 기법으로 진단하고, 독먹이 당분 기피를 고려한 기간별 로테이션 약제로 근본 원인을 해결합니다.',
      points: ['주방·배관·틈새 3W 추적', '독먹이 기피 대응 로테이션', '외곽·실내 쥐 디펜스라인', '정기 포획·흔적 모니터링'],
      primary: ['cockroach.html', '바퀴벌레 솔루션'],
      secondary: ['rodent.html', '쥐 방서 솔루션']
    },
    {
      id: 'flying',
      label: '비래해충 케어',
      icon: 'fly',
      photo: 'assets/sol-flying.webp',
      eyebrow: 'FLYING INSECTS & MOSQUITO',
      title: '매장과 실내로 날아드는 파리·초파리·나방파리·모기가 고민이라면?',
      desc: '열·CO2·냄새에 끌리는 모기와 음식부패취·온도에 유인되는 파리의 침입 요인을 차단합니다. 배수구 유기물막·정화조 유충구제부터 고성능 포충기 배치까지 입체적으로 관리합니다.',
      points: ['배수구·정화조 유충원 관리', '열·CO2·부패취 유인 차단', '성충·유충·CS캡슐 맞춤 적용', '고성능 포충기 파장 설계'],
      primary: ['flying-insects.html', '파리·초파리·나방파리'],
      secondary: ['mosquito.html', '모기 통합 방제']
    },
    {
      id: 'virus',
      label: '바이러스 살균소독',
      icon: 'shield',
      photo: 'assets/sol-disinfect.webp',
      eyebrow: 'VIRUS & STERILIZATION',
      title: '사람이 모이는 다중이용공간과 사업장, 보이지 않는 세균·바이러스까지 케어하려면?',
      desc: '환경부 허가 3가지 계열 살균제를 공간 특성과 표면 재질에 맞게 선정합니다. 오염 가능 구역과 고빈도 접촉 표면을 법정 기준과 안전 수칙에 맞춰 체계적으로 살균 소독합니다.',
      points: ['환경부 허가 3계열 살균제', '공간·표면별 맞춤 소독 공법', '다중이용시설 법정소독 대응', '환기·재입실 안전 가이드'],
      primary: ['services.html#disinfection', '방역소독 솔루션'],
      secondary: ['products-safety.html', '사용약제·안전 기준']
    },
    {
      id: 'haccp',
      label: 'HACCP·산업위생',
      icon: 'building',
      photo: 'assets/place-factory.webp',
      eyebrow: 'HACCP · GMP · GSP STANDARD',
      title: '식품제조공장·외식 프랜차이즈의 까다로운 위생 규격과 정기 리포트가 필요하다면?',
      desc: 'HACCP, GMP, GSP 등 국제·국내 위생 규격에 맞춘 방충·방서 모니터링 프로세스를 구축합니다. 화장실·탕비실·생산구역·하역장 등 120개 장소 유형별 전략과 위생점검·교육을 지원합니다.',
      points: ['HACCP·GMP·GSP 맞춤 설계', '120개 세부 장소별 방제전략', '트랩·포획 추이 분석보고', '현장 위생점검 및 위생교육'],
      primary: ['industries.html#factory', '제조·HACCP 솔루션'],
      secondary: ['process.html', '4단계 방제 프로세스']
    },
    {
      id: 'analysis',
      label: '이물·클레임 분석',
      icon: 'search',
      photo: 'assets/sol-analysis.webp',
      eyebrow: 'CLAIM & ALIEN ANALYSIS',
      title: '제품 혼입이나 이상 해충 발생, 객관적인 원인 규명과 보고서가 필요하다면?',
      desc: '정확성·전문성·객관성 확보 전략으로 클레임에 대응합니다. DB 검토와 재현실험은 물론, 카탈라제 효소실험과 제3자 전문기관 유전자·이물분석을 통해 신뢰할 수 있는 이물확인보고서를 제공합니다.',
      points: ['카탈라제 효소 반응 실험', '제3자 기관 유전자·이물분석', '공정·보관 경로 재현실험', '객관적 이물확인보고서 작성'],
      primary: ['process.html#claims', '클레임·이물 프로세스'],
      secondary: ['contact.html', '분석·점검 상담신청']
    },
    {
      id: 'shop',
      label: '포충기·위생장비',
      icon: 'shop',
      photo: 'assets/trap.webp',
      eyebrow: 'INSECT TRAP & EQUIPMENT',
      title: '매장과 작업장의 동선을 해치지 않으면서 비래해충을 24시간 포획하고 싶다면?',
      desc: 'SMART CATCH ALPHA 등 검증된 포충기를 공간 면적·조도·출입구 동선에 맞춰 설계합니다. 식품 노출 구역과의 거리, 소모품 교체 주기까지 전문가가 함께 상담합니다.',
      points: ['출입구·동선 맞춤 위치 선정', '비래해충 포획 및 모니터링', '램프·끈끈이 주기적 관리', '공간 인테리어 조화 설계'],
      primary: ['shop.html', '에코플랜 쇼핑몰'],
      secondary: ['contact.html', '설치·구매 상담']
    }
  ];

  return `
  <div class="curator-tabs" role="tablist" aria-label="해결하고 싶은 문제 선택">
    ${tabs.map((t, i) => `<button type="button" class="curator-tab" role="tab" aria-selected="${i === 0}" data-curator-tab="${t.id}">${icon(t.icon)}${t.label}</button>`).join('')}
  </div>
  ${tabs.map((t, i) => `
    <div class="curator-panel" data-curator-panel="${t.id}"${i === 0 ? '' : ' hidden'}>
      <div class="curator-photo">
        <img src="${t.photo}" alt="${t.label} 대표 비주얼" width="900" height="600" loading="lazy">
      </div>
      <div class="curator-body">
        <span class="eyebrow"><span class="dot"></span>${t.eyebrow}</span>
        <h3>${t.title}</h3>
        <p>${t.desc}</p>
        <ul class="curator-points">
          ${t.points.map(pt => `<li>${icon('check')}${pt}</li>`).join('')}
        </ul>
        <div class="actions">
          ${btn(t.primary[0], t.primary[1])}
          ${btn(t.secondary[0], t.secondary[1], 'light')}
        </div>
      </div>
    </div>
  `).join('')}`;
};

const cta = () => `<section class="contact-banner"><div class="container"><div><span class="eyebrow"><span class="dot"></span>ECOPLAN SPACE CARE CONSULTING</span><h2>우리 집과 사업장에 꼭 맞는 방제 과학, 지금 상담하세요.</h2><p>발견한 해충 사진이나 공간 면적을 알려주시면 에코플랜 전문가가 맞춤 진단을 안내합니다.</p></div><div class="actions">${link('tel:16884587', `${icon('phone')}1688-4587 전화상담`, 'btn ghost')}${btn('contact.html', '무료 방문·상담 신청', 'cyan')}</div></div></section>`;

const siteUrl = (process.env.SITE_URL || 'https://mango7557-ui.github.io/ecoplan-homepage').replace(/\/$/, '');

function shell(page) {
  const url = siteUrl + (page.file === 'index.html' ? '/' : '/' + page.file);
  const org = {
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': siteUrl + '/#organization',
    name: c.name,
    legalName: c.legalName,
    alternateName: ['EcoPlan', '한국에코플랜', '주식회사 한국에코플랜'],
    url: siteUrl + '/',
    sameAs: [
      'https://www.ecoplan.co.kr/',
      'https://smartstore.naver.com/smartcatch',
      'https://qr.kakao.com/talk/w1n6i3156G3B8.ddp31b6kX62.g-'
    ],
    logo: siteUrl + '/assets/logo.webp',
    image: siteUrl + '/assets/og-kakao.jpg',
    telephone: c.phone,
    email: c.email,
    taxID: c.businessId,
    priceRange: '상담 후 현장 면적·오염도·주기별 산정 (포충기 단품 143,000원~1,210,000원)',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '양천로 489, 상가동 지하층 18호, 19호 (가양동, 가양우성아파트)',
      addressLocality: '강서구',
      addressRegion: '서울특별시',
      addressCountry: 'KR'
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: '서울특별시' },
      { '@type': 'AdministrativeArea', name: '경기도' },
      { '@type': 'AdministrativeArea', name: '인천광역시' },
      { '@type': 'Country', name: '대한민국 (전국 프랜차이즈·사업장 정기관리 협의)' }
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: c.phone,
      email: c.email,
      contactType: 'customer service',
      areaServed: 'KR',
      availableLanguage: ['Korean']
    },
    knowsAbout: [
      '해충방제',
      '방역소독',
      '3W 해충 원인진단 (Why·Where·When)',
      'IPM 통합해충관리',
      '독일바퀴·미국바퀴 방제 및 독먹이 로테이션',
      '쥐 방서 디펜스라인 구축',
      '나방파리·초파리·집파리 유충구제 및 포충기 설계',
      '정화조·집수정 모기 유충구제',
      'HACCP·GMP·GSP 사업장 위생관리',
      '카탈라제 효소 반응 실험 및 해충 이물분석',
      '스마트캐치(SMART CATCH) 포충기'
    ],
    publishingPrinciples: siteUrl + '/company.html',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: '에코플랜 공간케어 방제·방역 및 포충기 라인업',
      itemListElement: [
        { '@type': 'OfferCatalog', name: '해충별 3W·IPM 맞춤 방제 (바퀴벌레·쥐·파리류·모기·개미·먼지다듬이)' },
        { '@type': 'OfferCatalog', name: '환경부 허가 3계열 살균소독 및 HACCP·GMP·120개 장소별 위생관리' },
        { '@type': 'OfferCatalog', name: '스마트캐치 공식 포충기 라인업 (루미오키퍼·루미오·알파·포커스)' }
      ]
    }
  };
  const webpageNode = {
    '@type': page.type || 'WebPage',
    '@id': url + '#webpage',
    url,
    name: page.title,
    description: page.description,
    inLanguage: 'ko-KR',
    isPartOf: { '@id': siteUrl + '/#website' },
    about: { '@id': org['@id'] },
    author: { '@id': org['@id'] },
    reviewedBy: {
      '@type': 'Organization',
      name: '에코플랜 기술연구소 위해생물방제사 기술지원팀'
    },
    citation: [
      'https://ecolife.me.go.kr',
      'https://www.kdca.go.kr',
      'https://www.haccp.or.kr',
      'https://www.law.go.kr'
    ],
    datePublished: c.updated,
    dateModified: '2026-11-01',
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '.lead', '.answer-box', '.answer-strip']
    }
  };
  const graph = [org, { '@type': 'WebSite', '@id': siteUrl + '/#website', url: siteUrl + '/', name: '에코플랜', inLanguage: 'ko-KR', publisher: { '@id': org['@id'] } }, webpageNode];
  if (page.file !== 'index.html') {
    const items = [{ '@type': 'ListItem', position: 1, name: '홈', item: siteUrl + '/' }];
    if (page.parent) {
      items.push({ '@type': 'ListItem', position: 2, name: page.parent[1], item: siteUrl + '/' + page.parent[0] });
      items.push({ '@type': 'ListItem', position: 3, name: page.label, item: url });
    } else {
      items.push({ '@type': 'ListItem', position: 2, name: page.label, item: url });
    }
    graph.push({ '@type': 'BreadcrumbList', '@id': url + '#breadcrumb', itemListElement: items });
  }
  if (page.faqs?.length) graph.push({ ...faqSchema(page.faqs), '@id': url + '#faq' });
  if (page.service) graph.push({ '@type': 'Service', '@id': url + '#service', name: page.label, serviceType: page.service, description: page.description, url, provider: { '@id': org['@id'] } });
  if (page.itemList?.length) {
    graph.push({
      '@type': 'ItemList',
      '@id': url + '#products',
      name: '에코플랜 공식 포충기 라인업',
      numberOfItems: page.itemList.length,
      itemListElement: page.itemList.map((item, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: {
          '@type': 'Product',
          name: item.name,
          description: item.description,
          category: item.category,
          image: siteUrl + '/' + item.image,
          brand: { '@type': 'Brand', name: '스마트캐치 (SMART CATCH)' },
          offers: {
            '@type': 'Offer',
            price: String(item.price),
            priceCurrency: 'KRW',
            url: item.link_url,
            seller: { '@id': org['@id'] }
          }
        }
      }))
    });
  }

  const ogImageUrl = `${siteUrl}/assets/og-kakao.jpg`;
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"><link rel="canonical" href="${url}"><meta name="theme-color" content="#003da5"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="에코플랜"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImageUrl}"><meta property="og:image:secure_url" content="${ogImageUrl}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1024"><meta property="og:image:height" content="765"><meta property="og:image:alt" content="에코플랜 - 전문기업으로서 고객님께 안전한 서비스를 제공하기 위하여 에코플랜 연구소는 연구 개발에 몰두하고 있습니다."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(page.title)}"><meta name="twitter:description" content="${esc(page.description)}"><meta name="twitter:image" content="${ogImageUrl}"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700;800;900&display=swap"><link rel="stylesheet" href="assets/styles.css">${page.file === 'index.html' ? '<link rel="preload" as="image" href="assets/hero-space.webp" fetchpriority="high">' : ''}<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script><script src="assets/app.js" defer></script></head>
<body><a href="#main" class="skip">본문 바로가기</a>
<div class="utility"><div class="container"><div class="utility-badges"><span class="utility-pill">ECOPLAN SCIENCE</span><span>3W 원인진단 · IPM 통합해충관리 · HACCP/GMP 위생솔루션</span></div><div class="utility-links">${link('diagnosis.html', '해충 자가진단')}${link('process.html', '3W·IPM 과학공법')}${link('products-safety.html', '약제·안전기준')}${link('faq.html', 'FAQ ↗')}</div></div></div>
<header class="header"><div class="container header-inner"><div class="header-top"><a href="index.html" class="brand" aria-label="에코플랜 홈"><img src="assets/logo.webp" alt="에코플랜 EcoPlan" width="144" height="52"><span class="brand-sub">SCIENCE CARE</span></a><div class="header-action"><a class="header-phone" href="tel:16884587">${icon('phone')}1688-4587</a>${link('contact.html', '무료상담 ↗', 'btn small')}</div></div><nav class="nav" id="primary-nav" aria-label="주 메뉴">${[['company.html', '회사소개'], ['services.html', '서비스소개'], ['partners.html', '파트너사'], ['management.html', '관리현황'], ['shop.html', '쇼핑몰'], ['contact.html', '상담신청'], ['faq.html', 'FAQ']].map(([href, label]) => `<a href="${href}"${page.file === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></div></header>
<main id="main">${page.body}</main>
<footer class="footer"><div class="container"><div class="footer-top"><div class="footer-logo"><a href="index.html" aria-label="에코플랜 홈으로 이동"><img src="assets/logo.webp" alt="에코플랜" width="136" height="50" loading="lazy"></a><p>보이지 않는 원인까지 과학으로 설계하는 공간케어, 에코플랜.</p></div><div><nav class="footer-links" aria-label="하단 주요 메뉴">${link('company.html', '회사소개')}${link('services.html', '서비스소개')}${link('partners.html', '파트너사')}${link('management.html', '관리현황')}${link('shop.html', '포충기 쇼핑몰')}${link('diagnosis.html', '해충 자가진단')}${link('faq.html', '자주 묻는 질문')}${link('contact.html', '무료 상담신청')}${link('privacy.html', '개인정보 안내')}</nav><nav class="footer-links" aria-label="하단 해충·기술 상세 메뉴" style="margin-top:10px;font-size:12px;opacity:.88">${link('cockroach.html', '바퀴벌레 방제')}${link('rodent.html', '쥐 방서 솔루션')}${link('flying-insects.html', '파리·초파리·나방파리 방제')}${link('mosquito.html', '모기 유충·성충 방제')}${link('process.html', '3W·IPM 과학공법')}${link('products-safety.html', '사용약제·로테이션')}${link('industries.html', '업종·장소별 솔루션')}</nav></div></div><div class="footer-info"><div><p><strong>${c.legalName}</strong> &nbsp;|&nbsp; 대표 ${c.representative} &nbsp;|&nbsp; 사업자등록번호 ${c.businessId}</p><p>${c.address}</p><p>이메일 ${link('mailto:' + c.email, c.email)}</p></div><div class="footer-contact">에코플랜 고객상담센터<strong>${link('tel:16884587', c.phone)}</strong><span>가정집 · 사업장 · HACCP 시설 맞춤 상담</span></div></div><div class="copyright">© 2026 ECOPLAN. All rights reserved.</div></div></footer>
<a class="floating-contact" href="contact.html">${icon('chat')}무료 진단·상담</a>
<nav class="mobile-dock" aria-label="모바일 빠른 메뉴">
  <a href="index.html">${icon('home')}<span>홈</span></a>
  <a href="services.html">${icon('bug')}<span>솔루션</span></a>
  <a href="diagnosis.html">${icon('clipboard')}<span>자가진단</span></a>
  <a href="tel:16884587">${icon('phone')}<span>전화상담</span></a>
  <a href="contact.html" class="dock-cta">${icon('chat')}<span>상담신청</span></a>
</nav>
</body></html>`;
}

const pageHero = (label, title, lead, eyebrow = 'ECOPLAN SCIENCE CARE', parent = null) => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="현재 위치">${link('index.html', '홈')}${parent ? `<span aria-hidden="true">/</span>${link(parent[0], parent[1])}` : ''}<span aria-hidden="true">/</span><span aria-current="page">${label}</span></nav><span class="eyebrow"><span class="dot"></span>${eyebrow}</span><h1>${title}</h1><p class="lead">${lead}</p><div class="page-meta">작성·검수: 에코플랜 기술연구소·위해생물방제사 기술지원팀 · 구성일 <time datetime="2026-10-28">2026.10.28</time> · 최종 개정일 <time datetime="2026-11-01">2026.11.01</time></div></div></section>`;
const add = page => pages.push(page);

add({
  file: 'index.html',
  label: '홈',
  title: '에코플랜 | 과학으로 설계하는 해충방제·방역소독·공간케어 솔루션',
  description: '에코플랜의 3W 원인진단과 IPM 통합해충관리. 바퀴벌레·쥐·파리·모기 방제부터 HACCP/GMP 사업장 관리, 이물분석과 포충기 솔루션까지 확인하세요.',
  faqs: faqs.slice(0, 6),
  body: `
<section class="hero-showcase" data-section-id="hero">
  <div class="container">
    <div class="hero-frame">
      <div class="hero-main-card">
        <div class="hero-visual-window">
          <img class="hero-slide-bg active" src="assets/hero-space.webp" width="1440" height="860" fetchpriority="high" alt="에코플랜 3W & IPM 과학 방제 공간 이미지">
          <img class="hero-slide-bg" src="assets/hero-lab.webp" width="1440" height="860" loading="lazy" alt="에코플랜 연구소 및 정밀 진단 이미지">
          <img class="hero-slide-bg" src="assets/hero-industrial.webp" width="1440" height="860" loading="lazy" alt="에코플랜 HACCP 제조시설 위생관리 이미지">
        </div>
        <div class="hero-content">
          <span class="hero-badge" data-hero-badge>ECOPLAN SCIENCE · 3W & IPM</span>
          <h1 data-hero-title>보이지 않는 원인까지,<br><em>과학으로 설계하는 방제.</em></h1>
          <p data-hero-desc>해충의 실내 유인 요인(Why), 침입 경로(Where), 활동 시간(When)을 추적하는 3W 분석과 IPM 통합방제로 공간을 지킵니다.</p>
          <div class="actions">
            ${btn('contact.html', '무료 방문상담 신청', 'cyan')}
            ${btn('diagnosis.html', '1분 해충 자가진단', 'ghost')}
          </div>
          <div class="hero-slide-tabs" role="tablist" aria-label="메인 배너 선택">
            <button type="button" class="hero-tab" role="tab" aria-selected="true" data-hero-slide="0">01. 3W·IPM 방제</button>
            <button type="button" class="hero-tab" role="tab" aria-selected="false" data-hero-slide="1">02. R&D·이물분석</button>
            <button type="button" class="hero-tab" role="tab" aria-selected="false" data-hero-slide="2">03. HACCP·장소케어</button>
          </div>
        </div>
      </div>

      <div class="hero-side-panel">
        <div class="hud-card">
          <div>
            <div class="hud-header">
              <span>ECOPLAN 3W DIAGNOSTIC SYSTEM</span>
              <span class="hud-live"><span class="dot"></span>SCIENCE ON LIFE</span>
            </div>
            <h2>단순 살포가 아닌 원인 차단 시스템</h2>
            <p>모기(열→CO2→냄새), 파리(음식부패취→온도) 등 해충별 실내 유인 요인과 건물 침입 경로를 정밀 분석해 맞춤 방제 주기를 설계합니다.</p>
          </div>
          <div class="hud-metrics">
            <div class="hud-metric"><strong>3W</strong><span>Why·Where·When</span></div>
            <div class="hud-metric"><strong>120+</strong><span>장소별 세부전략</span></div>
            <div class="hud-metric"><strong>IPM</strong><span>통합해충관리</span></div>
          </div>
        </div>

        <div class="hud-photo-strip">
          <img src="assets/technology.webp" width="220" height="164" alt="에코플랜 정밀 해충 스캐닝 그래픽">
          <div>
            <h3>보이지 않는 곳까지 완벽하게</h3>
            <p>독일바퀴·파리·설치류 행동패턴 분석 및 계열별 약제 로테이션 적용</p>
            ${link('process.html', '핵심 방제공법 보기 ↗', 'text-link')}
          </div>
        </div>

        <div class="hud-photo-strip">
          <img src="assets/franchise.webp" width="220" height="164" alt="프랜차이즈 매장 해충 방역 이미지">
          <div>
            <h3>프랜차이즈 · 사업장 안심 위생</h3>
            <p>외식업장·카페·식품공장·빌딩 맞춤 정기 관리 및 모니터링 리포트</p>
            ${link('industries.html', '업종별 솔루션 보기 ↗', 'text-link')}
          </div>
        </div>
      </div>
    </div>

    <div class="concierge-bar">
      <div class="concierge-title">
        <strong>지금 당신의 공간 고민은 무엇인가요?</strong>
        <span>증상이나 해충 이름을 검색하거나 아래 키워드를 눌러 맞춤 솔루션을 바로 확인하세요.</span>
      </div>
      <div class="concierge-controls">
        <form id="concierge-form" class="concierge-search" role="search">
          <label for="concierge-input" class="visually-hidden">해충 또는 위생 고민 검색</label>
          <input id="concierge-input" type="search" placeholder="예: 주방 바퀴벌레, 배수구 나방파리, 식당 정기방역, 포충기">
          <button type="submit" class="btn small">솔루션 찾기</button>
        </form>
        <div class="concierge-tags" aria-label="인기 솔루션 키워드">
          ${link('cockroach.html', '#바퀴벌레퇴치', 'chip-link')}
          ${link('rodent.html', '#쥐침입차단', 'chip-link')}
          ${link('flying-insects.html', '#나방파리·초파리', 'chip-link')}
          ${link('mosquito.html', '#정화조모기유충', 'chip-link')}
          ${link('industries.html#factory', '#HACCP·GMP위생', 'chip-link')}
          ${link('process.html#claims', '#이물·효소분석', 'chip-link')}
          ${link('shop.html', '#스마트포충기', 'chip-link')}
          ${link('diagnosis.html', '#해충자가진단', 'chip-link')}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section soft" id="curator" data-section-id="curator">
  <div class="container">
    ${sectionHeading('CUSTOM SOLUTION CURATOR', '어떤 문제를 해결하고 싶나요?', '해충 퇴치부터 바이러스 살균, HACCP 위생관리, 이물분석까지 최적의 솔루션을 제안합니다.', 'services.html', '전체 서비스 안내')}
    ${curatorSection()}
  </div>
</section>

<section class="section" id="services" data-section-id="services">
  <div class="container">
    ${sectionHeading('PEST CONTROL LINEUP', '해충별 정밀 방제 솔루션', '해충의 생활사와 서식처 특성에 맞춘 에코플랜의 4대 핵심 방제 솔루션', 'services.html', '전체 솔루션 보기')}
    ${serviceCards()}
    <div class="answer-strip">
      <strong>${icon('shield')} 에코플랜 공간케어의 핵심 원칙</strong>
      <p>에코플랜은 환경부 허가 약제를 해충별·계열별로 로테이션 적용하며, 약제 살포에만 의존하지 않고 3W 원인 진단·침입 경로 차단·모니터링을 결합해 재발 가능성을 낮춥니다.</p>
    </div>
  </div>
</section>

<section class="section dark" id="places" data-section-id="places">
  <div class="container">
    ${sectionHeading('SOLUTIONS BY PLACE', '어느 곳에 에코플랜이 필요한가요?', '화장실·탕비실·주방·하역장 등 120개 세부 장소 유형과 업종별 기준에 맞춘 맞춤 솔루션을 제공합니다.', 'industries.html', '업종별 상세 보기')}
    ${industryCards()}
    <div class="diagnosis-banner">
      <div>
        <span class="eyebrow"><span class="dot"></span>1-MINUTE SELF DIAGNOSIS</span>
        <h3>우리 집·우리 매장의 해충 서식 단계가 궁금하신가요?</h3>
        <p>나방파리·초파리·독일바퀴·쥐 등 관찰된 마릿수와 흔적으로 서식 단계와 우선 조치 방법을 바로 확인해보세요.</p>
      </div>
      ${btn('diagnosis.html', '무료 해충 자가진단 시작', 'light')}
    </div>
  </div>
</section>

<section class="section soft" id="company" data-section-id="company">
  <div class="container">
    <div class="mid-photo-row">
      <figure class="company-image">
        <img src="assets/company.webp" width="1200" height="900" loading="lazy" alt="에코플랜 연구소 및 방제 전문가 서비스 이미지" data-cms-img="company_main">
        <figcaption>에코플랜 연구소 & 현장 방제 전문가 그룹 (Since 2008)</figcaption>
      </figure>
      <figure class="company-image">
        <img src="assets/technology.webp" width="1100" height="820" loading="lazy" alt="에코플랜 정밀 해충 탐지 및 방제 기술 이미지" data-cms-img="tech_main">
        <figcaption>보이지 않는 곳까지 완벽하게 책임지는 에코플랜 정밀 방제</figcaption>
      </figure>
    </div>

    <div class="system-grid" style="margin-top:32px">
      <div class="system-copy">
        <span class="eyebrow"><span class="dot"></span>3W ANALYSIS & ROTATION SCIENCE</span>
        <h2>퇴치에서 끝나지 않는,<br>원인을 찾는 4단계 과학 방제.</h2>
        <p>왜 침입하는지(Why), 어디로 들어오는지(Where), 언제 활동하는지(When) 분석하고, 피레스로이드·네오니코티노이드·CS캡슐제제 등 계열별 약제 로테이션으로 내성과 독먹이 기피를 극복합니다.</p>
        <div class="three-w">
          <div><strong>Why</strong><span>유인 요인 분석</span></div>
          <div><strong>Where</strong><span>침입·서식처 추적</span></div>
          <div><strong>When</strong><span>활동·발생 주기</span></div>
        </div>
        <div class="method-tags">
          <span class="tag">IPM 통합해충관리</span>
          <span class="tag">HACCP·GMP 프로세스</span>
          <span class="tag">계열별 약제 로테이션</span>
          <span class="tag">카탈라제 효소·이물분석</span>
        </div>
        <div class="credential-list">
          ${['법정교육 필수 수료', '방제전문가 교육 수료', '위해생물 방제사 수료', '모기 동정·관리 수료', '연 2회+ 세미나 참석', '현장 숙련 보수교육'].map(t => `<span>${icon('check')}${t}</span>`).join('')}
        </div>
        <div class="actions">
          ${btn('company.html', '회사소개·전문가 그룹 보기')}
          ${btn('process.html', '3W·IPM 전략 상세보기', 'light')}
        </div>
      </div>
      <div>
        ${stepsHtml()}
        <div class="inline-links">
          ${link('products-safety.html', '사용약제·로테이션 기준 ↗')}
          ${link('shop.html', '포충기 쇼핑몰 보기 ↗')}
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section" id="partners" data-section-id="partners">
  <div class="container">
    ${sectionHeading('FRANCHISE & PARTNERS', '함께하는 파트너사', '좌우로 스와이프하여 에코플랜과 함께 쾌적하고 안전한 위생 환경을 만들어가는 프랜차이즈·파트너사를 확인해보세요.', 'partners.html', '파트너사 전체보기')}
    ${partnerCards(false)}
  </div>
</section>

<section class="section soft" id="shop-section" data-section-id="shop">
  <div class="container">
    ${sectionHeading('ECOPLAN SHOPPING MALL', '에코플랜 포충기 쇼핑몰', '공간 특성에 맞춘 고효율 UV LED·BL램프 유인 포충기 라인업을 확인하고 바로 구매하실 수 있습니다.', 'shop.html', '쇼핑몰 전체보기')}
    ${shopCards()}
  </div>
</section>

<section class="section" id="faq-section" data-section-id="faq">
  <div class="container faq-layout">
    <div class="faq-bubble-card">
      <span class="eyebrow"><span class="dot"></span>ECOPLAN FAQ</span>
      <h2>많이 찾는 질문,<br>빠르게 확인하세요!</h2>
      <p>해충 방제 비용부터 반려동물 안전, HACCP 관리, 이물분석까지 궁금한 점을 정리했습니다.</p>
      <div class="bubble-cloud" aria-hidden="true">
        <span class="bubble-pill">💬 바퀴벌레 한 마리만 보여도 방제해야 하나요?</span>
        <span class="bubble-pill">🐶 아이·반려동물이 있어도 안전한가요?</span>
        <span class="bubble-pill">🏭 HACCP 공장 정기관리 리포트가 되나요?</span>
        <span class="bubble-pill">🔬 제품 이물 혼입 시 어떤 분석을 하나요?</span>
      </div>
      ${btn('faq.html', '전체 FAQ 바로가기', 'cyan')}
    </div>
    ${faqHtml(faqs.slice(0, 6))}
  </div>
</section>${cta()}`
});

const serviceFaqs = [
  { q: '식당·외식 매장의 바퀴벌레·해충 방역 비용은 어떻게 결정되나요?', a: '외식 매장의 방제 비용은 ① 매장 전용면적(평수)과 주방·창고·외부 테라스 구조, ② 현재 해충 서식 단계(1단계 초기 유입 vs 2~3단계 군집 번식), ③ 관리 방식(1회 초기 집중방제 vs 월 정기 모니터링 관리), ④ 포충기·방서 상자 등 장비 임대·구매 여부에 따라 산정됩니다. 정확한 견적은 무료 3W 현장 진단 후 안내합니다.' },
  { q: '해충방역 업체를 선택할 때 반드시 비교해야 할 기준은 무엇인가요?', a: '① 단순 살포가 아닌 3W(Why·Where·When) 사전 원인 진단을 수행하는지, ② 환경부 허가 약제를 사용하고 내성·당분 기피를 막는 계열별 로테이션 기준이 있는지, ③ 법정 교육 및 위해생물방제사 등 전문 교육을 수료한 인력이 직접 방문하는지, ④ 작업 후 6대 관리 기록(포획 추이·사용 약제·시설 개선 권고)과 이물·클레임 분석 지원이 가능한지 확인해야 합니다.' },
  { q: '프랜차이즈 본사에서 여러 가맹점을 통합해서 정기방역 계약을 맺을 수 있나요?', a: '네, 외식·유통 프랜차이즈 본사 기준에 맞춘 표준 3W·IPM 위생 매뉴얼을 수립하여 가맹점별 정기 점검, 신규 오픈 매장 사전 방충·방서 설계, 점포별 관리 기록과 클레임·이물 발생 시 신속 분석 대응을 통합 지원합니다.' }
];
add({ file: 'services.html', label: '서비스소개', faqs: serviceFaqs, title: '해충방제·방역소독 서비스 안내 | 비용 기준·업체 선택 비교·3W 진단 | 에코플랜', description: '가정·음식점·HACCP 제조시설·프랜차이즈를 위한 에코플랜 해충방제·방역소독 서비스. 업종·면적별 비용 결정 기준, 방역업체 선택 비교표, 8대 해충 맞춤 공법을 확인하세요.', service: '해충방제 및 방역소독', body: `${pageHero('서비스소개', '해충방제·방역소독 통합 서비스, 발생 원인(3W)과 공간 조건에 맞춰 설계합니다.', '에코플랜은 해충 종류와 생활사, 건물 구조, 이용자 및 영업 환경을 조사해 방제 방법을 정합니다. 3W 원인 진단부터 계열별 허가 약제 로테이션, 침입 경로 차단, 사후 모니터링까지 연결합니다.', 'OUR SOLUTIONS')}<section class="section"><div class="container">${sectionHeading('PEST-SPECIFIC CARE', '4대 핵심 위생해충 정밀 방제 솔루션', '해충의 실내 유인 요인(Why)·침입 경로(Where)·활동 주기(When)에 맞춘 해충별 전문 관리')}${serviceCards()}<div class="inline-links">${link('process.html', '3W·IPM 과학공법 상세보기')}${link('products-safety.html', '사용약제·로테이션 기준')}${link('process.html#claims', '이물·클레임 분석 프로세스')}${link('industries.html', '업종·120개 장소별 솔루션')}${link('diagnosis.html', '1분 해충 자가진단')}${link('faq.html', '자주 묻는 질문')}</div></div></section><section class="section soft" id="other-pests"><div class="container">${sectionHeading('EXTENDED PEST CARE', '개미·저곡해충·먼지다듬이·지네 3W 관리 안내', '4대 주요 해충 외에도 식자재 보관 공간과 주거·외곽 환경에서 발생하는 특수·침입 해충을 동정해 3W 기준으로 맞춤 관리합니다.')}<div class="info-cards"><div class="info-card">${icon('bug')}<h3>개미 · 저곡해충 (권연벌레·화랑곡나방)</h3><p>창틀·걸레받이·타일 줄눈의 개미 이동 통로에는 여왕개미까지 연쇄 작용하는 전용 독먹이 겔을 적용합니다. 곡물·건어물·반려동물 사료 포대에서 발생하는 권연벌레·화랑곡나방은 감염 원천 품목 판별과 페로몬 트랩 모니터링을 병행합니다.</p></div><div class="info-card">${icon('search')}<h3>먼지다듬이 · 진드기 (고습도 미세해충)</h3><p>신축 공동주택, 원목 가구, 책장·벽지 틈새의 고습도(상대습도 60% 이상)·결로 환경에서 발생하는 미세해충입니다. 정확한 해충 동정 후 미세 틈새 전용 약제 처리와 온·습도 환경개선 가이드를 함께 안내합니다.</p></div><div class="info-card">${icon('shield')}<h3>지네 · 노래기 등 외곽 침입 해충</h3><p>1층 매장·전원주택·지하층의 외벽 균열, 창틀 물구멍, 화단·낙엽 적치물 주변을 통해 유입됩니다. 건물 외곽 침입 차단 벨트(잔류 분무·입제 처리) 구축과 유입 틈새 보수 제안을 연결합니다.</p></div></div><div class="table-wrap" style="margin-top:24px"><table><thead><tr><th>대상 해충</th><th>3W 발생 원인 (Why · Where · When)</th><th>1~3단계 서식 판별 기준</th><th>에코플랜 핵심 처방 및 주의사항</th></tr></thead><tbody><tr><td>개미 · 저곡해충 (권연벌레·화랑곡나방)</td><td><strong>Why:</strong> 당분·단백질 잔여물, 오래 보관된 곡물·건어물·사료<br><strong>Where:</strong> 창틀·걸레받이·타일 줄눈, 팬트리·창고 개봉 포장재<br><strong>When:</strong> 페로몬 경로 형성 시 줄지어 이동, 장기 보관 시 급증</td><td><strong>1단계:</strong> 간헐적 1~5마리 미만 목격<br><strong>2단계:</strong> 줄지어 이동하거나 보관장 주변 10마리 내외<br><strong>3단계:</strong> 다수 구역 동시 출현 및 식자재 오염 우려</td><td>개미 이동 행렬에 에어로졸 살충제를 뿌리면 군집이 쪼개져 확산되므로 전용 독먹이 겔로 연쇄 제거하며, 저곡해충은 감염 포장재 밀봉 폐기 후 페로몬 트랩으로 관리합니다.</td></tr><tr><td>먼지다듬이 · 진드기 · 지네 (특수·외곽 침입충)</td><td><strong>Why:</strong> 실내 고습도(60% 이상)·결로·미세 곰팡이(먼지다듬이), 외부 화단·낙엽 습기(지네)<br><strong>Where:</strong> 신축 아파트·원목 가구·벽지 틈새, 1층·지하 외벽 틈<br><strong>When:</strong> 장마철·환절기·신축 입주 초기 및 야간 활동 증가</td><td><strong>1단계:</strong> 특정 위치 1~3마리 미만 간헐 목격<br><strong>2단계:</strong> 같은 방·가구·창틀에서 매주 반복 출현<br><strong>3단계:</strong> 여러 공간 매일 다수 목격 및 생활 불편 심화</td><td>실내 상대습도를 45~50% 이하로 낮추고 외벽 낙엽·화분 은신처를 정리합니다. 해충 동정 후 외곽 침입 차단 벨트 구축 및 미세 틈새 전용 약제 처리를 진행합니다.</td></tr></tbody></table></div></div></section><section class="section" id="disinfection"><div class="container">${sectionHeading('DISINFECTION', '방역소독은 어떻게 진행하나요?', '대상 공간과 표면의 상태, 환경부 허가 3가지 계열 살균제의 적용 범위를 먼저 확인합니다.')}<div class="info-cards">${[['대상과 범위 확인', '공간 용도와 이용자(영유아·환자·반려동물 유무), 고빈도 접촉 표면, 식품·조리도구 노출 여부를 사전 확인합니다.'], ['현장별 처리 방법 선정', '환경부 허가 3가지 계열 살균제의 용도, 오염도·표면 재질별 희석 농도, 적용 방법과 접촉시간 등 표시사항에 따라 작업 계획을 세웁니다.'], ['환기·재입실 안전 안내', '작업 후 환기 시간, 재입실 조건, 청소 가능 범위 및 접근 제한 등 제품과 작업 방식에 필요한 주의사항을 안내합니다.']].map(([h,p]) => `<div class="info-card">${icon('shield')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div><p class="note">소독의 효과와 적용 가능 범위는 대상, 제품, 작업 조건에 따라 달라집니다. 다중이용시설 법정 소독이나 사업장 정기 소독 여부는 상담 시 시설 특성을 알려주세요.</p></div></section><section class="section soft" id="conditions"><div class="container">${sectionHeading('PRICING & VENDOR SELECTION GUIDE', '업종·면적별 비용 결정 기준 및 해충방역 업체 선택 비교표', '식당·사업장·가정집 방제 견적 산정 기준과 전문 방제업체 선택 시 확인해야 할 핵심 기준입니다.')}<h3>1. 업종·면적·관리 방식별 방제 구성 및 비용 결정 기준</h3><div class="table-wrap"><table><thead><tr><th>공간 구분</th><th>주요 점검·적용 범위</th><th>권장 관리 주기</th><th>비용(견적) 산정 핵심 변수</th></tr></thead><tbody><tr><td>가정·공동주택 (원룸·빌라·아파트 세대)</td><td>주방 싱크대 경첩·가전 모터부 독먹이 도포, 욕실·발코니 배수구 유충/트랩 점검, 창틀·배관 유입 틈새 진단</td><td>초기 집중방제 (1~2회) 또는 분기·정기 케어</td><td>전용면적(평형), 발견 해충 종류(독일바퀴·미국바퀴·먼지다듬이 등), 서식 단계(1~3단계)</td></tr><tr><td>소형 외식업장·카페 (약 20평 이하)</td><td>화구·냉장고·제빙기 뒤편 바퀴벌레 군집 제어, 배수 트렌치·그리스트랩 유충구제, 매장 포충기 운영</td><td>월 1회 정기 IPM 관리 (초기 오염 시 집중케어 병행)</td><td>주방 설비 밀집도, 배수구·그리스트랩 구조, 영업 외 작업 시간대, 포충기 대수</td></tr><tr><td>중대형 식당·뷔페·프랜차이즈 (20~100평+)</td><td>홀·샐러드바·조리실·식자재 창고 구역 분리 관리, 외곽 방서 디펜스라인, 계열별 약제 로테이션 및 포획 추이 보고</td><td>월 1~2회 이상 정기 IPM + 본사·지점 표준 리포트</td><td>총 면적 및 구획 수, 외부 하역장·폐기물장 유무, 지점 수(프랜차이즈 다점포 계약 조건)</td></tr><tr><td>HACCP·GMP 식품공장 · 물류창고 · 빌딩</td><td>4대 방어선(외곽·외벽·내부·모니터링) 구축, 지하 정화조 유충구제, 해충 동정·카탈라제 효소/이물분석 및 법정 소독 연계</td><td>시설 규격 맞춤형 정기 관리 (월 1~4회 협의)</td><td>연면적·동수, 지하 정화조·집수정 규모, 모니터링 트랩·포충기 수량, 분석보고서 범위</td></tr></tbody></table></div><h3 style="margin-top:28px">2. 해충방역 업체 선택 기준 비교표 (일반 소독 vs 에코플랜 3W·IPM)</h3><div class="table-wrap"><table><thead><tr><th>비교 항목</th><th>일반 일회성 살포 소독</th><th>에코플랜 3W · IPM 과학 방제</th></tr></thead><tbody><tr><td>사전 원인 진단</td><td>육안 확인 후 일률적 약제 분무</td><td><strong>3W(Why 유인요인 · Where 침입경로 · When 활동주기)</strong> 및 1~3단계 서식 밀도 정밀 진단</td></tr><tr><td>약제 선정 및 내성 관리</td><td>단일 성분 반복 살포로 내성·기피 발생 가능</td><td>환경부 허가 약제 기준, <strong>피레스로이드·네오니코티노이드·CS캡슐 교차 및 독먹이 기간별 로테이션</strong></td></tr><tr><td>비래해충 · 정화조 모기 대응</td><td>날아다니는 성충 위주 일시적 연막·분무</td><td>배수구 슬러지·지하 정화조 <strong>유충(장구벌레·나방파리) 원천 구제 + 공간 동선별 포충기 파장 설계</strong></td></tr><tr><td>전문 인력 교육 및 자격</td><td>단순 작업 인력 파견 여부 확인 어려움</td><td><strong>법정교육·방제전문가·위해생물방제사·모기 동정 수료</strong> 및 연 2회 이상 학술 세미나·보수교육 이수</td></tr><tr><td>이물 · 클레임 원인 규명</td><td>육안 추정 위주로 제조·유통 분쟁 대응 한계</td><td><strong>카탈라제(Catalase) 효소 반응 실험, 공정 재현실험, 제3자 기관 유전자·이물분석</strong> 및 보고서 지원</td></tr><tr><td>사후 관리 기록 및 피드백</td><td>단순 작업 완료 확인서 위주</td><td><strong>6대 관리 기록(발생위치·포획추이·작업내역·시설개선 제안·사후확인·차기계획)</strong> 데이터 관리</td></tr></tbody></table></div><div class="system-grid" style="margin-top:28px"><div><span class="eyebrow"><span class="dot"></span>SERVICE PROCESS</span><h2>조사부터 평가까지,<br>연결된 4단계 관리</h2><p>작업 내역과 현장 변화 기록이 다음 관리의 기준이 됩니다.</p>${btn('process.html', '4단계 방제 프로세스 상세보기')}</div>${stepsHtml()}</div><div style="margin-top:32px"><h2>방제 서비스·비용·업체 선택 자주 묻는 질문</h2>${faqHtml(serviceFaqs)}</div>${sources}</div></section>${cta()}` });

for (const p of pests) {
  const questions = p.faqs.map(([q,a]) => ({q,a}));
  const otherPests = pests.filter(other => other.slug !== p.slug);
  const extraSection = p.slug === 'mosquito'
    ? `<section id="seasonal"><h2>아파트·빌딩 지하 정화조 모기 계절별 유충·성충 방제 기술</h2><p>도심 아파트와 오피스 빌딩의 실내 모기는 외부 화단뿐 아니라 지하 정화조·집수정·배수펌프실에서 연중 번식합니다. 성충 1마리가 수백 개의 알을 산란하므로 계절별 수온과 이동 경로에 맞춘 유충(장구벌레) 선제 구제가 핵심입니다.</p><div class="table-wrap"><table><thead><tr><th>계절 구분</th><th>정화조·건물 내 모기 생태 특성</th><th>에코플랜 중점 방제 기술</th></tr></thead><tbody><tr><td>봄철 (3~5월 · 해빙기)</td><td>지하 정화조·집수정에서 월동한 유충이 성충으로 우화해 배관·환풍구로 첫 유입 시작</td><td>정화조·집수정 유충 밀도 사전 조사 및 환경부 허가 유충구제제(IGR 등) 1차 집중 투여, 환기구 방충망 보수</td></tr><tr><td>여름철 (6~8월 · 장마·고온기)</td><td>외부 고인 물·우수관 번식과 지하 수역 번식이 동시에 급증하며 출입문을 통한 유입 극대화</td><td>실내외 유충구제 주기 단축 + 지하실·복도 벽면 서방형 CS(캡슐) 성충구제제 잔류 처리 + 유인 포충기 가동</td></tr><tr><td>가을철 (9~11월 · 실내 유입기)</td><td>외부 기온 하강으로 모기가 따뜻한 실내·로비·승강기 홀·지하 주차장으로 대거 이동</td><td>출입구·창틀 물구멍·환풍구 댐퍼 침입 차단 점검 및 공용부 휴식 벽면 집중 관리</td></tr><tr><td>겨울철 (12~2월 · 지하 월동기)</td><td>난방·오수열로 15~20℃가 유지되는 지하 정화조 내부에서 빨간집모기 유충이 사계절 번식 지속</td><td>동절기 지하 정화조·오수관 심부 유충 원천 구제로 봄철 대발생 사전 차단 (밀폐공간 안전장비 기준 준수)</td></tr></tbody></table></div></section>`
    : '';
  add({ file: `${p.slug}.html`, label: `${p.name} 방제`, parent: ['services.html', '서비스소개'], title: p.title, description: p.metaDesc, service: `${p.name} 방제`, faqs: questions, body: `${pageHero(`${p.name} 방제`, p.headline, p.answer, p.en + ' MANAGEMENT', ['services.html', '서비스소개'])}<section class="section"><div class="container article-grid"><aside class="toc"><strong>이 페이지에서 확인하세요</strong>${[['three-w','3W 원인·서식 단계'],['comparison','종류·구역별 방제 비교'],...(p.slug==='mosquito'?[['seasonal','계절별 정화조 유충방제']]:[]),['signs','주요 발생 신호'],['check','현장 점검 지점'],['prevention','상담 전 환경 관리'],['plan','에코플랜 방제 방법'],['faq','자주 묻는 질문']].map(([id,text]) => link('#'+id,text)).join('')}${link('diagnosis.html','1분 해충 자가진단 ↗')}${link('contact.html','무료 방문상담 신청 ↗')}</aside><article class="article"><div class="company-image" style="margin-bottom:28px"><img src="${pestPhotos[p.slug]}" alt="${p.name} 3W 현장 진단 및 방제 작업 안내 이미지" width="900" height="600" fetchpriority="high"></div><div class="answer-box"><strong>핵심 요약 · 왜 반복해서 발생할까요?</strong><p>${p.answer}</p></div><section id="three-w"><h2>${p.name} 3W 발생 원인 및 서식 단계 기준</h2><p>눈에 보이는 개체 수만으로 번식 규모를 단정하기보다 왜 유인되는지(Why), 어디로 들어와 숨는지(Where), 언제 활동하는지(When)와 관찰 빈도를 함께 대조해야 정확한 방제 범위를 정할 수 있습니다.</p><div class="table-wrap"><table><thead><tr><th>3W 분석 항목</th><th>${p.name} 현장 확인 내용</th></tr></thead><tbody><tr><td>Why · 유인·발생 요인</td><td>${p.why}</td></tr><tr><td>Where · 침입·서식 지점</td><td>${p.where}</td></tr><tr><td>When · 주요 활동 시점</td><td>${p.when}</td></tr></tbody></table></div><h3>${p.name} 관찰 마릿수·징후에 따른 1~3단계 서식 판별 기준</h3><div class="table-wrap"><table><thead><tr><th>서식 단계</th><th>관찰 빈도 및 징후</th><th>현장 상태 해석</th></tr></thead><tbody>${p.stages.map(([st,obs,desc]) => `<tr><td>${st}</td><td>${obs}</td><td>${desc}</td></tr>`).join('')}</tbody></table></div></section><section id="comparison"><h2>${p.comparisonTitle}</h2><div class="table-wrap"><table><thead><tr>${p.comparisonHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${p.comparisonRows.map(row => `<tr>${row.map(col => `<td>${col}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>${extraSection}${[['signs',`${p.name} 발생 의심 신호와 서식 흔적`,p.signs],['check',`${p.name} 방제를 위한 현장 핵심 점검 지점`,p.checks],['prevention',`${p.name} 상담 전 직접 할 수 있는 환경 관리 및 주의사항`,p.actions]].map(([id,title,items]) => `<section id="${id}"><h2>${title}</h2><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}<section id="plan"><h2>에코플랜의 ${p.name} 맞춤 방제 공법과 사후 관리</h2><p>${p.plan}</p><p>방문 횟수와 주기는 현장 조사와 모니터링 결과를 바탕으로 협의합니다. 공간 면적, 시설 구조, 발생 단계(1~3단계), 작업 범위에 따라 견적이 달라지며 한 번의 작업만으로 모든 재유입이 영구 차단되는 것은 아니므로 환경개선과 사후 점검을 함께 안내합니다.</p><div class="inline-links">${link('diagnosis.html',`${p.name} 서식단계 자가진단`)}${link('process.html','3W·IPM 4단계 프로세스')}${link('products-safety.html','사용약제·로테이션 기준')}${link('industries.html','업종·장소별 맞춤 관리')}${p.slug === 'flying-insects' || p.slug === 'mosquito' ? link('shop.html','비래해충 포충기 쇼핑몰') : ''}${otherPests.map(o => link(`${o.slug}.html`, `${o.name} 방제 솔루션`)).join('')}</div></section><section id="faq"><h2>${p.name} 방제 자주 묻는 질문</h2>${faqHtml(questions)}</section>${sources}</article></div></section>${cta()}` });
}

const processFaqs = [
  { q: '3W 분석은 일반 살충 소독과 무엇이 다른가요?', a: '일반 소독이 눈에 보이는 개체 살포에 집중한다면, 에코플랜의 3W 분석은 왜 유인되는지(Why: 열·CO2·부패취·먹이·수분), 어디로 침입·서식하는지(Where: 외곽 디펜스라인·배관·트랩), 언제 활동하는지(When: 야간·하역·계절 주기)를 먼저 파악해 차단·약제·모니터링을 결합합니다.' },
  { q: '제품에서 해충 이물이 발견되었을 때 카탈라제 효소실험은 무엇을 확인하나요?', a: '카탈라제(Catalase) 효소 반응 실험은 이물로 발견된 해충의 생체 효소 활성 여부를 점검해 가열·조리 공정 전후 등 혼입 시점과 생사 관련 단서를 검토하는 1차 실험입니다. 사안이 중대하거나 객관적 입증이 필요한 경우 공정 재현실험 및 제3자 전문기관 유전자·이물분석을 협의해 이물확인보고서를 작성합니다.' },
  { q: '정기 관리 후 제공되는 기록에는 어떤 항목이 포함되나요?', a: '현장 및 대상 해충, 점검 위치별 포획·활동 추이, 적용 약제·장비 작업 내역, 시설 틈새·위생 환경개선 제안, 사후 재발 확인, 다음 점검 계획 등 6대 관리 항목을 기준으로 기록하며 문서 형식은 계약 범위에 맞춰 협의합니다.' }
];
add({ file: 'process.html', label: '방제 전략·프로세스', parent: ['services.html', '서비스소개'], service: '3W 해충 원인진단·IPM 통합해충관리·이물분석', faqs: processFaqs, title: '3W 분석·IPM 방제 전략과 클레임 처리 | 에코플랜', description: '왜·어디로·언제 발생하는지 확인하는 3W 분석, IPM 통합해충관리, 사전조사부터 평가까지 4단계 서비스와 이물·클레임 대응을 안내합니다.', body: `${pageHero('방제 전략·프로세스', '제거를 넘어, 발생 이유를 찾는 관리', '에코플랜은 건물의 조건과 해충의 행동 패턴을 조사하고, 방제·차단·환경개선·평가를 연결합니다. 3W 분석과 IPM 접근은 현장에 맞는 방제 계획의 바탕입니다.', 'SYSTEM & PROCESS', ['services.html', '서비스소개'])}<section class="section"><div class="container article-grid"><aside class="toc"><strong>전략과 진행 과정</strong>${link('#strategy','3W 분석·IPM')}${link('#methods','주요 공법')}${link('#process','4단계 서비스')}${link('#claims','클레임·이물 대응')}${link('#records','관리 기록')}${link('#faq','자주 묻는 질문')}${link('diagnosis.html','해충 자가진단 ↗')}</aside><article class="article"><section id="strategy"><h2>3W 분석은 무엇인가요?</h2><p>왜 실내로 침입하는지(Why), 어디로 침입하는지(Where), 언제 침입하는지(When)를 확인합니다. 건물의 조건과 해충의 실내 유인 요인을 함께 분석해 지속적인 관리 솔루션을 수립합니다.</p><div class="table-wrap"><table><thead><tr><th>분석 기준</th><th>핵심 질문</th><th>현장 확인 항목 및 유인 요인</th></tr></thead><tbody><tr><td>Why · 왜</td><td>왜 실내로 침입하는지?</td><td>모기 실내 유인요인(열 → CO2 → 냄새), 파리 실내 유인요인(음식부패취 → 온도), 먹이·수분·은신처</td></tr><tr><td>Where · 어디로</td><td>어디로 침입하는지?</td><td>외부 디펜스라인, 출입문, 배관 관통부, 배수시설·정화조, 입고 물품과 실내 서식 지점</td></tr><tr><td>When · 언제</td><td>언제 침입하는지?</td><td>주·야간 활동 시간, 영업·하역 시간대, 계절 변화 및 청소 전후의 발생 변화</td></tr></tbody></table></div><h3>IPM 통합해충관리 및 8대 핵심 기법</h3><p>IPM(Integrated Pest Management)은 해충 확인과 모니터링을 바탕으로 위생관리, 침입 차단, 물리적 방법, 필요한 약제 적용을 조합하는 체계입니다. 에코플랜은 사전조사·계획수립·제거·평가를 위해 <strong>3W분석 기법, IPM 적용, 모니터링 시스템, HACCP/GMP 기준 프로세스, 분석보고, 이물확인(해충동정), 위생교육, 위생점검</strong>을 현장 조건에 맞게 운영합니다.</p></section><section id="methods"><h2>해충별 주요 공법</h2><div class="table-wrap"><table><thead><tr><th>대상</th><th>관리 방향 (디펜스라인·서식처)</th><th>확인 기록</th></tr></thead><tbody><tr><td>쥐</td><td>외부 침입경로 관리(디펜스라인 구축) 및 실내 발생장소 집중 관리</td><td>흔적·포획·차단 상태</td></tr><tr><td>바퀴벌레</td><td>모니터링 진행 및 성충 관리(먹이·수분·서식 장소 원천 관리)</td><td>활동 위치·발생 추이</td></tr><tr><td>모기</td><td>유충 관리(정화조·물고임 장소) 및 휴식장소 관리, 침입경로 차단</td><td>발생원·계절 변화</td></tr><tr><td>파리류</td><td>배수·폐기물 등 부패취·발생원 개선, 유입 차단과 포획 장비 검토</td><td>종류·포획 위치·발생량</td></tr></tbody></table></div><div class="inline-links">${pests.map(p => link(`${p.slug}.html`, `${p.name} 방제 상세보기`)).join('')}</div></section><section id="process"><h2>방제서비스 4단계 진행 프로세스</h2>${stepsHtml()}<p class="note">HACCP·GMP 시설은 국제 규격의 위생관리 기준과 현장 요구사항을 확인하여 방제 주기와 기록 범위를 협의합니다.</p></section><section id="claims"><h2>클레임·이물 문제는 어떻게 확인하나요?</h2><p>클레임은 <strong>정확성 확보, 전문성 확보, 객관성 확보</strong>의 전략으로 확인합니다. 일반 문의, 해충의 이상 발생, 제품 혼입 사례를 구분하여 이물확인보고서 작성 및 객관적 분석 절차를 진행합니다.</p><div class="table-wrap"><table><thead><tr><th>접수 구분</th><th>1차 확인 및 검토</th><th>정밀 실험 및 객관적 분석</th></tr></thead><tbody><tr><td>일반 문의</td><td>일반상담 및 현장 이력 확인</td><td>효소실험 (카탈라제 효소 반응 등 생사·혼입 시점 검토)</td></tr><tr><td>이상 발생</td><td>기존 방제 DB 검토 및 추이 비교</td><td>유전자 분석 (문제 심각 시 제3자 전문기관 의뢰 협의)</td></tr><tr><td>제품 혼입</td><td>공정·보관 경로 재현실험 및 동정</td><td>이물분석 (제3자 전문기관 객관적 분석 및 이물확인보고서)</td></tr></tbody></table></div><p>추가 출동, 재작업, 이물확인보고서 및 제3자 기관 분석 비용 범위는 계약 조건과 사안에 따라 안내합니다.</p></section><section id="records"><h2>관리 기록은 다음 조치의 근거입니다.</h2><p>현장·작업일·대상 해충·점검 위치·발생 흔적·장비 상태·적용 내용·개선 제안·다음 점검 계획을 관리 항목으로 활용합니다. 고객에게 제공할 문서와 형식은 계약 범위에 맞춰 협의합니다.</p><div class="inline-links">${link('management.html','관리현황 6대 기록 항목 보기 ↗')}${link('products-safety.html','사용약제·로테이션 기준 보기 ↗')}${link('industries.html','120개 장소·업종별 솔루션 보기 ↗')}${link('diagnosis.html','3W 해충 자가진단 시작 ↗')}</div></section><section id="faq"><h2>3W 분석·IPM·이물분석 자주 묻는 질문</h2>${faqHtml(processFaqs)}</section>${sources}</article></div></section>${cta()}` });

const safetyFaqs = [
  { q: '살충제를 한 종류만 계속 쓰지 않고 계열별로 로테이션하는 이유는 무엇인가요?', a: '동일한 성분의 액체형 살충제를 반복 사용하면 살아남은 개체군에서 약제 저항성(내성)이 빠르게 형성됩니다. 에코플랜은 피레스로이드 계열과 네오니코티노이드 계열, 서방형 CS(캡슐)제제, 유충구제제를 현장 이력에 맞춰 교차 적용해 내성 발생을 억제합니다.' },
  { q: '독먹이 약제의 당분 기피(Bait Aversion) 현상은 어떻게 관리하나요?', a: '일부 독일바퀴 군집은 특정 당분 성분이 포함된 독먹이를 기피하는 행태를 보일 수 있습니다. 에코플랜은 포획 추이와 섭식 흔적을 모니터링하며 유인 성분과 제형이 다른 독먹이 약제를 기간별로 로테이션해 적용합니다.' },
  { q: '어린이·반려동물이 있는 가정이나 식품 취급 매장에서 약제 안전은 어떻게 확보하나요?', a: '모든 살충·살서·살균제는 환경부 허가·승인 제품을 사용하며, 식품 노출 구역이나 어린이·반려동물 동선을 피해 틈새 내부 점적 도포 또는 잠금형 안전 약제상자 방식으로 배치합니다. 작업 후에는 제품별 환기·재입실·청소 주의사항을 담당자가 개별 안내합니다.' }
];
add({ file: 'products-safety.html', label: '사용약제 관리', parent: ['services.html', '서비스소개'], service: '환경부 허가 방제 약제 선정 및 계열별 로테이션 관리', faqs: safetyFaqs, title: '방제 약제 선정·로테이션·재입실 안전 기준 안내 | 에코플랜', description: '환경부 허가 살충제·살서제·살균제 선정 기준, 피레스로이드·네오니코티노이드 계열 로테이션, 독먹이 당분 기피 대응과 소독 후 재입실·환기 기준을 안내합니다.', body: `${pageHero('사용약제 관리', '약제보다 먼저, 사용 조건과 안전 기준을 확인합니다.', '살충제, 살서제, 살균제 모두 환경부에서 허가·승인된 약제만을 기준에 맞게 적용합니다. 내성과 기피 현상을 줄이기 위해 계열별·기간별 로테이션 기준을 수립해 운영합니다.', 'PRODUCT & APPLICATION', ['services.html', '서비스소개'])}<section class="section"><div class="container article-grid"><aside class="toc"><strong>약제 관리 안내</strong>${link('#selection','선정 기준')}${link('#rotation','계열별 로테이션')}${link('#reentry','약제·시설별 재입실 기준')}${link('#before','작업 전 확인')}${link('#after','작업 후 확인')}${link('#faq','자주 묻는 질문')}${link('process.html','3W·IPM 방제공법 ↗')}${link('faq.html','약제·안전 FAQ ↗')}</aside><article class="article"><div class="answer-box"><strong>핵심 요약 · 환경부 허가 약제 및 로테이션 원칙</strong><p>에코플랜은 환경부 생활환경안전정보시스템(초록누리) 기준 허가·승인 제품만 사용하며, 약제 저항성(내성)과 독먹이 당분 기피(Bait Aversion)를 예방하기 위해 계열별·기간별 교차 로테이션을 적용합니다.</p></div><section id="selection"><h2>어떤 기준으로 약제를 선택하나요?</h2><p>살충·살서·살균 제품의 용도와 적용 대상을 구분합니다. 동일한 성분 계열이라도 제품별 사용 장소·방법·주의사항은 다를 수 있어 개별 제품의 허가·표시사항이 기준이 됩니다.</p><ul><li>대상 해충과 생활 단계: 성충구제제·유충구제제 등 적용 대상 확인</li><li>제형과 처리 방법: 독먹이, 액상, CS(캡슐)제제 등 현장 적합성 검토</li><li>사용 장소: 식품 취급 구역, 실내외, 이용자 접근 가능성</li><li>제품 정보: 환경부 허가·승인 사항, 사용량·농도, 주의사항 및 보관 조건</li></ul></section><section id="rotation"><h2>약제 계열 구성과 로테이션 프로세스</h2><p>액체형 살충제의 핵심 이슈인 <strong>내성 발생</strong>을 극복하기 위해 계열별 로테이션 기준을 수립해 적용하며, 독먹이 약제는 <strong>당분 기피(Bait Aversion)</strong> 현상을 고려해 기간별 로테이션 기준을 운영합니다.</p><div class="table-wrap"><table><thead><tr><th>약제 분류</th><th>적용 목적 및 특징</th><th>운영 기준</th></tr></thead><tbody><tr><td>피레스로이드 계열</td><td>주요 위생해충 성충 구제 및 빠른 녹다운 효과</td><td>네오니코티노이드 등 타 계열과 교차 로테이션</td></tr><tr><td>네오니코티노이드 계열</td><td>기존 약제 내성 개체 대응 및 잔효성 관리</td><td>현장 발생 이력과 내성 모니터링에 따른 주기적 전환</td></tr><tr><td>성충구제제 · 유충구제제 · CS(캡슐)제제</td><td>해충 생활사(성충·유충) 동시 타깃 및 서방형 캡슐 잔효 유지</td><td>정화조·배수구·은신처 등 서식 환경별 제형 선택</td></tr><tr><td>살서제</td><td>현장 경험과 섭식 행태를 반영한 쥐 방제용 약제</td><td>외곽·실내 전용 약제상자 내 안전 배치 및 섭식 모니터링</td></tr><tr><td>3가지 계열 살균제</td><td>공간·표면 위생 관리를 위한 살균 소독</td><td>오염도·표면 재질·접촉시간에 맞춘 계열별 선정</td></tr></tbody></table></div><p class="note">현장 사용 제품의 구체적인 제품명·승인번호·물질안전보건자료(MSDS)는 작업 전후 담당자에게 확인할 수 있습니다.</p></section><section id="reentry"><h2>소독·방제 후 언제 입실할 수 있나요? (제형·시설별 안전 안내표)</h2><p>재입실 및 공간 이용 가능 시점은 적용한 약제의 제형(비휘발성 겔 vs 수성 분무 vs 표면 살균소독)과 환기 여건에 따라 다릅니다.</p><div class="table-wrap"><table><thead><tr><th>처리 방식 및 제형</th><th>주요 적용 공간</th><th>작업 중·직후 이용 및 재입실 기준</th><th>청소 및 사후 주의사항</th></tr></thead><tbody><tr><td>독먹이 겔 (Bait Gel) 점적 도포</td><td>가정집 주방, 음식점 조리대 하부, 가전 모터부, 싱크대 경첩 틈새</td><td>공기 중 분사·휘발이 없어 <strong>작업 직후 정상 재입실 및 공간 이용 가능</strong></td><td>약제 도포 지점을 물걸레나 세제로 닦아내지 말고, 그 위에 에어로졸 살충제를 뿌리지 마세요.</td></tr><tr><td>수성 잔류분무 · CS(캡슐)제제</td><td>배관 관통부, 걸레받이 하단, 창고·기계실 벽면, 건물 외곽</td><td>처리 표면이 완전히 건조되고 <strong>충분한 자연·기계 환기(통상 30분~2시간 이상 현장 안내 기준) 후 재입실 권장</strong></td><td>영유아·반려동물·노약자는 건조 전 접촉을 피하고, 벽면 하단 잔효 구역은 물청소를 유예합니다.</td></tr><tr><td>살서제 안전상자 · 점착 트랩</td><td>건물 외곽 디펜스라인, 하역장, 천장 텍스 내부, 창고 코너</td><td>비휘발성 고정 배치 방식으로 <strong>일상 공간 이용에 영향 없음</strong></td><td>잠금장치가 된 약제상자를 임의로 개봉하거나 위치를 옮기지 마세요.</td></tr><tr><td>환경부 허가 3계열 살균소독</td><td>오피스·빌딩 공용부, 병원·호텔, 학원·다중이용시설 표면</td><td>제품 표시사항의 <strong>표면 접촉시간 준수 및 실내 환기 완료 후 입실</strong></td><td>식탁·손잡이·조리대 등 손과 입이 직접 닿는 표면은 소독 후 깨끗한 천으로 닦아낸 뒤 사용합니다.</td></tr><tr><td>유충구제제 (IGR·미생물 제제 등)</td><td>지하 정화조, 집수정, 화장실·주방 바닥 배수 트랩 내부</td><td>배수관·지하 수역 내부에 한정 투여되어 <strong>실내 거주·영업 공간 즉시 이용 가능</strong></td><td>투여 직후 대량의 뜨거운 물이나 강산·강알칼리 배수관 세정제 동시 투입을 피합니다.</td></tr></tbody></table></div></section><section id="before"><h2>작업 전에 알려주세요.</h2><ul><li>어린이·반려동물·임산부·호흡기 민감 이용자의 유무</li><li>식품, 조리 도구, 반려동물 사료/식기, 유아 장난감 등 노출 가능한 물품</li><li>영업·가동 시간과 작업 가능 구역, 창문·환풍기 등 환기 조건</li><li>기존에 자체 사용한 살충제·독먹이 제품과 처리 위치</li></ul></section><section id="after"><h2>작업 후 무엇을 확인해야 하나요?</h2><p>제품명, 처리 위치, 환기·재입실 조건, 청소 가능한 범위, 접근 제한과 장비 취급 방법을 확인합니다. 모든 작업에 동일한 대기시간을 적용할 수는 없습니다. 안내받은 조건을 따르고 궁금한 점은 담당자에게 문의하세요.</p><div class="inline-links">${pests.map(p => link(`${p.slug}.html`, `${p.name} 방제 안내`)).join('')}${link('process.html','3W·IPM 방제 전략')}${link('faq.html','자주 묻는 질문 보기')}</div></section><section id="faq"><h2>사용약제·로테이션·재입실 자주 묻는 질문</h2>${faqHtml(safetyFaqs)}</section>${sources}</article></div></section>${cta()}` });

const industryFaqs = [
  { q: '에코플랜의 120개 세부 장소별 방제 전략은 어떻게 적용되나요?', a: '같은 건물이라도 주방 조리실, 그리스트랩, 원료 창고, 하역장, 공용 화장실, 탕비실, 객실, 지하 정화조·기계실 등 세부 구역마다 온·습도와 유인 요인이 다릅니다. 에코플랜은 해충별 기본 전략에 120개 세부 장소 유형과 업종별 프로세스를 결합해 구역마다 다른 약제 제형과 트랩을 배치합니다.' },
  { q: '외식 프랜차이즈나 식품공장의 영업·가동 시간을 피해서 작업할 수 있나요?', a: '네, 조리·생산 라인 가동 시간과 식품 노출 여부를 사전 확인하여 영업 전후 시간대 또는 구역별 부분 통제 방식으로 일정을 협의합니다.' },
  { q: 'HACCP·GMP 제조시설 관리 시 어떤 위생 지원이 함께 제공되나요?', a: '외곽 방서 디펜스라인 및 실내 포획·포충기 모니터링 기록, 추이 분석보고, 해충 동정(이물확인), 현장 위생점검 및 작업자 위생교육을 시설 요구사항에 맞춰 협의 제공합니다. 다만 방제 서비스 계약 자체가 HACCP·GMP 인증 취득을 보장하는 것은 아닙니다.' }
];
add({ file: 'industries.html', label: '장소별 추천', parent: ['services.html', '서비스소개'], service: '업종별·120개 장소별 맞춤 해충방제 및 HACCP 위생관리', faqs: industryFaqs, title: '음식점·HACCP 공장·빌딩·가정 업종별 해충관리 솔루션 | 에코플랜', description: '음식점·카페, HACCP·GMP·GSP 제조시설, 빌딩·공공기관, 병원·호텔, 공동주택, 물류·유통시설 등 6대 업종과 120개 세부 장소 유형별 해충방제 전략을 안내합니다.', body: `${pageHero('장소별 추천', '음식점·HACCP 제조시설·빌딩·가정, 120개 장소 유형에 맞춘 업종별 해충관리', '해충별 기본 전략에 화장실·탕비실·주방·창고·하역장 등 120개 세부 장소별 전략과 업종별 프로세스를 결합합니다. 바퀴벌레·쥐·파리·모기·소형파리(나방파리·초파리)·먼지다듬이·진드기·지네까지 공간 조건에 맞춰 관리합니다.', 'SOLUTIONS BY PLACE', ['services.html', '서비스소개'])}<section class="section"><div class="container article-grid"><aside class="toc"><strong>내 공간 찾아보기</strong>${industries.map(i => link('#'+i[0],i[1])).join('')}${link('#haccp-check','HACCP 공장 4대 방어선')}${link('#matrix','120개 장소·해충 매트릭스')}${link('#prepare','상담 전 준비 사항')}${link('#faq','자주 묻는 질문')}${link('diagnosis.html','1분 해충 자가진단 ↗')}</aside><article class="article">${industries.map(i => `<section id="${i[0]}"><div class="company-image" style="margin-bottom:20px"><img src="${placePhotos[i[0]]}" alt="${i[1]} 위생 및 해충관리 현장 이미지" width="880" height="580" loading="lazy"></div><span class="eyebrow"><span class="dot"></span>${i[2]}</span><h2>${i[1]} 해충관리</h2><p>${i[3]}</p><div class="answer-box"><strong>주요 확인 구역</strong><p>${i[4]}</p></div><h3>${i[1]} 중점 관리 대상 및 취약 포인트</h3><ul>${i[5].map(pt => `<li>${pt}</li>`).join('')}</ul>${link('contact.html',i[1]+' 맞춤 방문상담 신청 ↗','text-link')}</section>`).join('')}<section id="haccp-check"><h2>HACCP·GMP 식품·제조시설 4대 방어선 방충·방서 표준 점검표</h2><p>식품제조·가공·포장 시설은 생산 구역 내부에서 화학 약제 살포가 제한되므로, 외곽에서 내부로 이어지는 <strong>4대 방어선(Defense Line)</strong> 모니터링과 시설 밀폐도 점검이 핵심입니다.</p><div class="table-wrap"><table><thead><tr><th>방어 구역</th><th>관리 대상 해충</th><th>배치 장비 및 적용 방법</th><th>정기 점검·기록 항목</th></tr></thead><tbody><tr><td>1선 · 부지 외곽 경계선</td><td>시궁쥐·생쥐 등 외부 설치류, 외곽 보행해충</td><td>건물 외벽 둘레 잠금형 살서제 약제상자(Bait Station) 일정 간격 고정 설치, 외부 폐기물장·정화조 유충 관리</td><td>장비 파손·유실 여부, 살서제 섭식 흔적, 외곽 잡초·적치물 환경점검</td></tr><tr><td>2선 · 건물 외벽 · 하역장 · 전실</td><td>집파리·나방파리·모기 등 비래해충, 침입 쥐·바퀴</td><td>출입문 하단 유격(0.6cm 이하)·방충망·에어커튼·양압 상태 확인, 전실·하역장 통로 유인 포충기 및 기계식 포획기 배치</td><td>출입구 개폐 동선, 포충기 포획지 해충 종류·마릿수 계수, 유입 틈새 보수 권고</td></tr><tr><td>3선 · 원료·포장·생산 구역 내부</td><td>독일바퀴·개미 등 보행해충, 권연벌레·화랑곡나방 등 저곡해충</td><td>비독성 점착 트랩(모니터링 트랩), 저곡해충 페로몬 트랩, 배수 트렌치·그리스트랩 유충 관리 (식품 노출 구역 약제 비노출 원칙)</td><td>구역별 트랩 도면 관리, 포획 추이 그래프, 이상 급증 구역 3W 원인 추적</td></tr><tr><td>4선 · 이물분석 · 위생교육 · 문서화</td><td>공정·보관 중 혼입 의심 이물 및 작업자 위생 관리</td><td>해충 동정, 카탈라제 효소 반응 실험, 공정 재현실험, 제3자 전문기관 유전자·이물분석 협의 및 현장 위생교육</td><td>방충·방서 점검일지, 약제 허가증·MSDS, 추이 분석보고서, 이물확인보고서</td></tr></tbody></table></div></section><section id="matrix"><h2>업종·규격·대상 해충 통합 관리 체계</h2><p>에코플랜은 모든 업종의 고객 환경에 맞춰 <strong>해충별 기본전략 × 120개 세부 장소별 전략 × 업종별 프로세스</strong>를 결합합니다. HACCP·GMP·GSP 시설 관리 상담은 각 시설의 위생 관리 기준 충족을 돕기 위한 모니터링·개선 서비스이며, 인증 취득 자체를 보장하는 것은 아닙니다.</p><div class="table-wrap"><table><thead><tr><th>구분</th><th>세부 적용 범위</th></tr></thead><tbody><tr><td>주요 업종 및 시설</td><td>빌딩, 공공기관, 병원·호텔, 상업시설, 주택·공동주택, 식품·제조시설</td></tr><tr><td>관리 기준 연계</td><td>HACCP, GMP, GSP, 일반 제조시설 위생기준, 주거 생활환경 기준</td></tr><tr><td>세부 장소 구분</td><td>주방, 조리실, 창고, 하역장, 화장실, 탕비실, 객실, 기계실, 정화조 등 120개 장소 유형별 맞춤 적용</td></tr><tr><td>관리 대상 해충</td><td>바퀴벌레, 쥐, 파리, 모기, 소형파리(나방파리·초파리), 개미·저곡해충, 먼지다듬이, 진드기, 지네 등</td></tr></tbody></table></div></section><section id="prepare"><h2>방문 진단·상담 전에 준비하면 좋은 정보</h2><ul><li>시설 위치(시·군·구)와 대략적인 면적, 영업·운영 시간, 식품 노출 및 접근 제한 구역</li><li>주요 목격 해충(또는 사진)과 발견 장소·시간대, 기존 자체 처리 또는 방제 업체 이용 이력</li><li>영유아·반려동물·민감 이용자 유무 및 사업장 내부 위생 점검·기록 양식 필요 여부</li></ul><div class="inline-links">${link('diagnosis.html','공간별 해충 서식단계 자가진단')}${link('process.html','3W·IPM 4단계 프로세스')}${link('management.html','관리현황 6대 기록 항목')}${link('contact.html','무료 방문상담 신청')}</div></section><section id="faq"><h2>업종·장소별 해충관리 자주 묻는 질문</h2>${faqHtml(industryFaqs)}</section>${sources}</article></div></section>${cta()}` });

const companyFaqs = [
  { q: '에코플랜의 현장 방문 인력은 어떤 교육과 자격을 갖추고 있나요?', a: '감염병예방법에 따른 법정 소독교육 이수는 물론, 사내외 방제전문가 교육과정, 위해생물방제사 과정, 모기 종 동정 및 유충관리 전문 교육을 수료한 기술 인력이 현장을 방문합니다. 또한 연 2회 이상 외부 학술 세미나·전시회 참석과 정기 보수교육을 통해 최신 약제 저항성 및 IPM 기법을 업데이트합니다.' },
  { q: '기업 고객이나 시설 관리자가 에코플랜의 법정 서류나 약제 증빙을 요청할 수 있나요?', a: '네, 사업자등록증, 소독업 신고 관련 확인 서류, 현장 적용 약제의 환경부 승인·허가 자료 및 물질안전보건자료(MSDS), 법정·전문 교육 수료 증빙은 계약 및 상담 시 요청하시면 제공 범위에 맞춰 안내해 드립니다.' }
];
add({ file: 'company.html', label: '회사소개', service: '3W·IPM 해충방제 및 방역소독 전문기업 안내', faqs: companyFaqs, title: '에코플랜 회사소개·전문가 교육·기업 정보 | 주식회사 한국에코플랜', description: '주식회사 한국에코플랜의 공간케어 철학, 위해생물방제사·모기동정 전문가 교육 체계, R&D 이물분석 역량과 공식 기업 정보를 확인하세요. 대표 김영태, 1688-4587.', type: 'AboutPage', body: `${pageHero('회사소개', '더 나은 일상은, 건강한 공간에서.', '에코플랜은 방역소독과 해충방제를 통해 고객의 공간을 과학적으로 관리합니다. 눈앞의 문제와 발생 환경을 함께 살피고, 현장에 필요한 해결 방법을 찾습니다.', 'ABOUT ECOPLAN')}<section class="section"><div class="container company-grid"><figure class="company-image"><img src="assets/company.webp" alt="에코플랜 제공 기업 소개 이미지" width="1200" height="900" loading="lazy"><figcaption>에코플랜 연구소 및 방제 전문가 그룹</figcaption></figure><div><span class="eyebrow"><span class="dot"></span>OUR APPROACH</span><h2>방제전문가가 직접 방문하고,<br>기록을 바탕으로 관리합니다.</h2><p>법정교육은 물론 별도의 전문가 교육프로그램을 수료하였으며, 지속적으로 세미나·관련 전시회 등에 참석하여 기술을 업데이트합니다. 현장에서 숙련된 인력이 보수교육을 통해 최신 서비스를 제공합니다.</p><div class="credential-list">${['법정교육 수료', '방제전문가 교육 수료', '위해생물 방제사 수료', '모기 동정·관리 수료', '1년 2회 이상 세미나 참석', '지속적 현장 보수교육'].map(t=>`<span>${icon('check')}${t}</span>`).join('')}</div><p class="note">교육 과정과 수료 범위는 담당 인력별로 다를 수 있습니다. 관련 확인 자료는 상담 시 요청해주세요.</p></div></div></section><section class="section soft"><div class="container">${sectionHeading('EXPERTISE & VERIFICATION STANDARDS','에코플랜 전문가 교육·기술 검증 6대 체계','현장 진단의 정확성과 약제 적용의 안전성을 높이기 위해 운영하는 기술 관리 기준입니다.')}<div class="table-wrap"><table><thead><tr><th>검증 영역</th><th>운영 내용 및 기술 기준</th><th>고객 현장 제공 증빙 (요청·계약 시)</th></tr></thead><tbody><tr><td>01. 법정·전문 자격 교육</td><td>감염병예방법 법정 소독교육, 위해생물방제사, 방제전문가 과정, 모기 종 동정·유충관리 전문 과정 수료</td><td>교육 수료 확인 안내 및 담당 컨설턴트 배정</td></tr><tr><td>02. 3W 원인 진단 프로토콜</td><td>해충 유인요인(Why)·침입경로(Where)·활동주기(When) 및 1~3단계 서식 밀도 표준 조사표 운영</td><td>사전 환경진단 결과 및 구역별 방제 계획 안내</td></tr><tr><td>03. 환경부 허가 약제 로테이션</td><td>피레스로이드·네오니코티노이드·CS캡슐 교차 적용 및 독먹이 당분 기피(Bait Aversion) 기간별 로테이션</td><td>사용 약제 목록, 환경부 승인 사항, 물질안전보건자료(MSDS)</td></tr><tr><td>04. R&D 해충 동정 · 이물분석</td><td>실체현미경 해충 종 동정, 카탈라제(Catalase) 효소 반응 실험, 공정 재현실험, 제3자 기관 유전자 분석 연계</td><td>이물확인보고서 및 제3자 기관 분석 의뢰 협의</td></tr><tr><td>05. 비래해충 포충기 파장 설계</td><td>스마트캐치(SMART CATCH) UV LED·BL램프 라인업 공간 조도·동선별 위치 선정 및 포획지 모니터링</td><td>포충기 포획 해충 추이 기록 및 소모품 교체 안내</td></tr><tr><td>06. 지속 보수교육 · 학술 교류</td><td>연 2회 이상 국내외 방제 세미나·전시회 참가 및 신종·저항성 해충 현장 사례 공유 보수교육</td><td>업종별 개정 위생기준(HACCP·GMP 등) 반영 점검</td></tr></tbody></table></div></div></section><section class="section"><div class="container">${sectionHeading('COMPANY INFORMATION','에코플랜 공식 기업 정보 및 검증 채널')}<div class="table-wrap"><table><tbody>${[['상호 (법인명)',c.legalName],['브랜드명','에코플랜 · EcoPlan'],['대표자',c.representative],['사업자등록번호',c.businessId],['본사 주소',c.address],['고객상담센터',c.phone],['공식 이메일',c.email],['공식 서비스 권역','서울·경기·인천 수도권 방문 진단 및 전국 프랜차이즈·제조시설 정기관리 상담'],['공식 외부 채널','대표 도메인(ecoplan.co.kr) · 스마트캐치 네이버 스마트스토어(smartstore.naver.com/smartcatch) · 카카오톡 상담채널']].map(([a,b])=>`<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join('')}</tbody></table></div></div></section><section class="section soft"><div class="container">${sectionHeading('FIELD & CREDENTIALS','표창장·작업사진·관리기록 확인 안내','공개 가능한 현장 작업 자료와 증빙을 통해 서비스 내용을 확인할 수 있습니다.')}<div class="info-cards"><div class="info-card">${icon('clipboard')}<h3>표창장 · 교육 수료 증빙</h3><p>표창명, 발급기관, 발급일 및 법정·전문 교육 수료 확인 자료는 상담 시 안내받으실 수 있습니다.</p></div><div class="info-card">${icon('search')}<h3>현장 작업사진</h3><p>구역별 진단, 트랩 설치, 약제·소독 처리 등 작업사진은 고객 보호 범위를 준수하여 관리합니다.</p></div><div class="info-card">${icon('shield')}<h3>맞춤 관리 기록</h3><p>방문 일자, 점검 위치, 적용 내용, 개선 제안 사항을 체계적으로 기록하여 다음 관리에 반영합니다.</p></div></div><div style="margin-top:32px"><h2>회사소개·전문가 자격 자주 묻는 질문</h2>${faqHtml(companyFaqs)}</div>${sources}</div></section>${cta()}` });

const partnerFaqs = [
  { q: '프랜차이즈 본사에서 전국 또는 다수 가맹점의 위생·해충관리를 통합 의뢰할 수 있나요?', a: '네, 쿠우쿠우·홍콩반점·153구포국수·삼청동샤브가든·완미족발 등 다양한 외식·유통 브랜드 관리 경험을 바탕으로, 본사 슈퍼바이저 기준에 맞춘 가맹점 표준 3W·IPM 매뉴얼, 신규 출점 매장 사전 방충·방서 설계, 지점별 정기 점검 리포트 및 클레임·이물 긴급 대응을 지원합니다.' },
  { q: '외식 매장 외에 일반 제조공장이나 가구·물류창고도 파트너 관리가 가능한가요?', a: '네, (주)트루맨엠앤엘(비닐·포장재 제조), (주)티오피퍼니쳐(가구·리빙 물류) 등 제조·유통 파트너사와 같이 생산 라인 포충기 모니터링, 원료·완제품 창고 저곡해충 관리, 하역장 외곽 방서 디펜스라인 구축을 업종 특성에 맞춰 수행합니다.' }
];
add({ file: 'partners.html', label: '파트너사', service: '외식 프랜차이즈 본사·가맹점 및 제조·물류 기업 통합 해충방제', faqs: partnerFaqs, title: '함께하는 파트너사·프랜차이즈 전국 매장 통합관리 | 에코플랜', description: '쿠우쿠우, 153구포국수, 홍콩반점, 삼청동샤브가든, 완미족발, (주)티오피퍼니쳐, (주)트루맨엠앤엘 등 15개 파트너사와 프랜차이즈 본사·가맹점 통합 방제 프로그램을 소개합니다.', body: `${pageHero('파트너사', '외식 프랜차이즈부터 제조·물류까지, 에코플랜과 함께하는 파트너사', '대형 뷔페·외식 프랜차이즈부터 포장재 제조·가구 물류 브랜드까지, 에코플랜의 체계적인 3W·IPM 공간케어와 함께하는 15개 공식 파트너사와 프랜차이즈 통합관리 프로그램을 소개합니다.', 'FRANCHISE & PARTNERS')}<section class="section"><div class="container">${sectionHeading('OUR PARTNERS', '함께하는 프랜차이즈 & 기업 파트너 (' + partners.length + '곳)', '에코플랜 공식 사이트에 등록된 파트너사 포스터와 업종별 중점 위생관리 영역입니다.')}<div class="table-wrap" style="margin-bottom:28px"><table><thead><tr><th>업종 분류</th><th>주요 파트너사 브랜드</th><th>중점 위생·방제 관리 영역 및 적용 솔루션</th></tr></thead><tbody><tr><td>대형 뷔페 · 샤브 · 가족 외식</td><td>쿠우쿠우, 삼청동샤브가든, 고기굽는정원</td><td>대형 홀·샐러드바·조리실·식기세척실·그리스트랩 구역 분리 진단, 독먹이 로테이션 및 UV LED/BL램프 포충기 동선 설계</td></tr><tr><td>면류 · 중식 · 한식 · 육류 프랜차이즈</td><td>홍콩반점, 153구포국수, 완미족발, 갈비명가궁, 육회로, 도라보울, 이가네양꼬치, 이용성국수맛집, 구름산추어탕, 청정화푸드</td><td>고온 주방 화구·육수 조리 열원·배수 트렌치·식자재 입고 박스의 독일바퀴·나방파리·초파리·쥐 3W 집중 케어</td></tr><tr><td>포장재 · 산업 제조시설</td><td>(주)트루맨엠앤엘</td><td>비닐·맞춤형 포장재 제조 라인 비래해충 유입 차단, 포충기 포획 모니터링 및 제품 이물혼입 예방 관리</td></tr><tr><td>가구 · 리빙 · 물류 유통</td><td>(주)티오피퍼니쳐</td><td>전시장·목재/원자재 보관 창고·하역장 입출고 동선의 외곽 설치류 디펜스라인 및 고습도·침입 해충 관리</td></tr></tbody></table></div>${partnerCards(true)}</div></section><section class="section soft" id="franchise-program"><div class="container">${sectionHeading('FRANCHISE TOTAL CARE','프랜차이즈 본사 · 가맹점 통합 위생관리 프로그램','본사 품질관리(QA)·슈퍼바이저 팀과 가맹점주 모두를 위한 4단계 표준 공간케어 체계입니다.')}<div class="info-cards"><div class="info-card">${icon('clipboard')}<h3>01. 신규 오픈 매장 사전 방충·방서 설계</h3><p>인테리어 마감·설비 반입 단계에서 배관 관통부, 출입문 유격, 그리스트랩 구조와 포충기 최적 설치 위치를 사전 진단해 오픈 초기 해충 유입을 예방합니다.</p></div><div class="info-card">${icon('shield')}<h3>02. 전 가맹점 표준 3W·IPM 프로토콜</h3><p>매장마다 들쭉날쭉한 소독 대신, 브랜드 조리 특성에 맞춘 표준 약제 로테이션과 구역별 트랩 점검 기준을 동일하게 적용합니다.</p></div><div class="info-card">${icon('search')}<h3>03. 이물·클레임 신속 분석 및 리포트</h3><p>조리·배달·유통 과정에서 해충 이물 문의가 접수되면 해충 동정, 카탈라제 효소 반응 실험, 현장 DB 대조를 통해 객관적 원인 규명과 재발 방지를 지원합니다.</p></div></div><div style="margin-top:32px"><h2>파트너사·프랜차이즈 통합관리 자주 묻는 질문</h2>${faqHtml(partnerFaqs)}</div>${sources}</div></section>${cta()}` });

const managementFaqs = [
  { q: '정기 방제 관리를 시작하면 해충 개체 수는 어떤 과정으로 줄어드나요?', a: '1차 방문(사전 3W 조사 및 초기 집중 처리) 직후에는 숨어 있던 개체가 약제에 반응해 일시적으로 노출되거나 기산란된 알집이 부화할 수 있습니다. 이후 2~4주 차 모니터링에서 잔존 군집 지점에 약제 로테이션과 시설 틈새 보수를 병행하면 포획 지수가 단계적으로 감소하며 안정화 단계로 진입합니다.' },
  { q: '점검 후 받게 되는 관리 기록은 내부 위생점검이나 거래처 제출용으로 활용할 수 있나요?', a: '네, 작업 일자, 점검 구역, 대상 해충 및 포획 추이, 적용 약제·장비 내역, 시설 개선 권고 사항이 포함된 관리 기록과 약제 허가·MSDS 자료는 사업장 자체 위생관리 및 거래처·심사 대응 기초 자료로 활용하실 수 있도록 계약 범위에 맞춰 제공합니다.' }
];
add({ file: 'management.html', label: '관리현황', service: '정기 해충방제 모니터링 기록 및 현장 개선 리포트 관리', faqs: managementFaqs, title: '방제 관리현황·모니터링 기록·현장 개선 사례 안내 | 에코플랜', description: '해충 발생 위치, 포획 추이, 시설 개선과 다음 점검 계획까지. 에코플랜의 6대 관리 기록 체계, 익명화된 업종별 현장 개선 사례와 표준 점검표를 확인하세요.', body: `${pageHero('관리현황', '기록을 통해, 공간의 변화를 데이터로 확인합니다.', '해충 관리는 작업 당일의 처리에서 끝나지 않습니다. 발생 위치와 빈도, 장비 상태, 시설 개선 여부를 6대 항목으로 기록하고 다음 관리 계획에 반영합니다.', 'MANAGEMENT & MONITORING')}<section class="section"><div class="container">${sectionHeading('MANAGEMENT RECORDS','우리 공간에서 확인할 6대 관리 항목','아래는 에코플랜의 표준 관리 기록 체계 안내입니다.')}<div class="management-list">${[['01','현장과 대상 해충','시설별 구역을 나누고 관찰한 해충과 흔적, 최초 발견 시점을 기록합니다.'],['02','점검·포획 기록','장비 위치, 점검 일자, 포획 또는 활동 흔적을 연결해 발생 추이를 확인합니다.'],['03','작업 내역','적용 범위와 처리 방법, 사용 제품·장비와 작업 전후 안내를 확인합니다.'],['04','환경개선 제안','틈새, 누수, 적치물, 폐기물 관리 등 고객과 함께 개선할 과제를 정리합니다.'],['05','사후 확인','재발 위치와 상황을 기존 기록과 비교하고 관리 방향을 조정합니다.'],['06','다음 점검 계획','현장 상태와 계약 범위에 따라 다음 방문 및 확인 항목을 협의합니다.']].map(([n,h,p])=>`<div class="management-card"><strong>RECORD ${n}</strong><h3>${h}</h3><p>${p}</p><div class="status-line"><span class="dot"></span>현장별 맞춤 관리 기록</div></div>`).join('')}</div></div></section><section class="section soft" id="case-examples"><div class="container">${sectionHeading('ANONYMIZED FIELD CASES','업종별 3W·IPM 현장 진단 및 개선 사례 (익명화 요약)','고객사 비밀유지 및 개인정보 보호를 위해 상호와 세부 주소는 익명화한 에코플랜의 실제 현장 관리 프로세스 적용 사례입니다.')}<div class="table-wrap"><table><thead><tr><th>현장 유형 (익명)</th><th>도입 전 문제 상황 (Before)</th><th>에코플랜 3W 원인 진단 및 핵심 처방</th><th>관리 후 모니터링 변화 및 개선 결과 (After)</th></tr></thead><tbody><tr><td>사례 A · 수도권 대형 외식·뷔페 매장 (약 120평)</td><td>주방 세척실·조리대 하부에서 소형 독일바퀴 약충이 야간마다 반복 목격되고, 음료 디스펜서 주변 초파리 민원 발생</td><td><strong>Why/Where:</strong> 식기세척기 모터 열원·싱크대 실리콘 들뜸 부위 군집 및 배수 트렌치 슬러지 확인<br><strong>처방:</strong> 당분 기피 대응 독먹이 겔 2종 교차 도포 + 트렌치 슬러지 세척·유충구제제 투여 + 출입구·음료대 이격 벽면에 스마트캐치 포충기 배치</td><td>초기 집중 케어 후 4주 차 트랩 모니터링에서 주방 독일바퀴 포획 급감, 실리콘 보수 및 배수구 일일 마감 매뉴얼 정착으로 안정화 유지</td></tr><tr><td>사례 B · 경기권 식품 포장재 제조·보관 시설</td><td>하역장 개방 시간대 대형 파리·나방 유입 및 외곽 팔레트 적치 구역에서 설치류(생쥐) 배설물 흔적 발견</td><td><strong>Why/Where:</strong> 야간 하역 시 공장 내부 조명 유인 및 하역 도어 하단 1.2cm 유격 확인<br><strong>처방:</strong> 공장 외벽 둘레 잠금형 살서제 디펜스라인 구축 + 하역장 브러시·방서 보수 권고 + 전실·생산구역 입구 BL램프 포충기 포획지 주간/월간 계수 관리</td><td>외곽 약제상자에서 침입 개체 사전 차단 후 실내 창고 트랩 포획 0건 유지, 월간 포충기 포획 추이 리포트로 거래처 위생심사 대응 지원</td></tr><tr><td>사례 C · 서울 중형 오피스 빌딩 (지하 2층~지상 8층)</td><td>늦가을·겨울철에도 승강기 홀과 공용 화장실에서 모기와 나방파리가 지속 출현해 입주사 민원 발생</td><td><strong>Why/Where:</strong> 지하 2층 정화조·집수정 내부(수온 18℃ 유지) 빨간집모기 유충 서식 및 환기배관 방충망 파손 확인<br><strong>처방:</strong> 지하 정화조·집수정 환경부 허가 유충구제제 주기 투여 + 환기통 방충망 교체 + 지하 복도 벽면 서방형 CS제제 잔류 처리</td><td>유충구제 2주기 경과 후 지하층·승강기 홀 성충 목격 빈도 현저히 감소, 동절기·해빙기 정화조 정기 유충 점검 체계로 전환</td></tr></tbody></table></div><h3 style="margin-top:28px">정기 방문 점검 리포트 표준 기록 항목 예시</h3><div class="table-wrap"><table><thead><tr><th>기록 구분</th><th>세부 기록 데이터 예시</th><th>활용 목적</th></tr></thead><tbody><tr><td>구역별 모니터링 코드</td><td>주방-01(냉장고 하부 트랩), 주방-02(세척기 뒤), 창고-01(입고대), 외곽-01~04(방서상자), 포충기-01(출입구)</td><td>발생 지점을 도면·코드로 특정해 재발 구역 정밀 추적</td></tr><tr><td>적용 약제 및 로테이션 이력</td><td>적용 제형(독먹이 겔 / CS캡슐 / 유충구제제 / 3계열 살균제), 성분 계열 전환 주기, 작업 후 환기·주의사항</td><td>약제 저항성(내성)·당분 기피 예방 및 MSDS·허가 기준 증빙</td></tr><tr><td>시설·환경개선 권고 (IPM)</td><td>배관 관통부 우레탄폼/방서망 마감 필요, 그리스트랩 슬러지 청소 주기 조정, 입고 골판지 박스 즉시 해체 권고</td><td>화학적 약제 처리만으로는 막을 수 없는 재유입 구조 차단</td></tr></tbody></table></div><div class="diagnosis-banner" style="margin-top:28px"><div><h3>이미 에코플랜의 관리를 받고 계신가요?</h3><p>현장명과 계약 담당 정보를 준비해 고객센터(1688-4587)로 문의하시면 해당 현장의 관리 기록과 확인 절차를 안내합니다.</p></div>${btn('contact.html','관리 기록 및 점검 문의','light')}</div><div style="margin-top:32px"><h2>관리현황·점검 리포트 자주 묻는 질문</h2>${faqHtml(managementFaqs)}</div>${sources}</div></section>${cta()}` });

const shopFaqs = [
  { q: '업소용 포충기 선택 시 UV LED 모델(루미오)과 BL램프 모델(알파)은 어떤 차이가 있나요?', a: '스마트캐치 루미오(154,000원)는 UV LED 광원을 적용해 음식점·카페·베이커리 등 일반 상업 매장 실내 벽면에 적합하며, 스마트캐치 알파(187,000원)는 BL(Black Light) 유인 램프를 적용해 외식 매장·조리실 주변 통로·식자재 창고·작업장 환경에 폭넓게 활용됩니다. 야외 단지·외곽 조경에는 야외용 루미오키퍼(1,210,000원), 화장실·세면장 등 소형 공간에는 포커스(143,000원)를 권장합니다.' },
  { q: '포충기를 설치할 때 피해야 하는 위치가 있나요?', a: '조리대나 식기·식품 노출 구역 바로 위쪽은 포획된 해충 사체 낙하 우려가 있으므로 이격해 설치해야 하며, 외부 유리창 바로 옆에 설치하면 실외 해충을 유인할 수 있습니다. 출입구 유입 동선과 주변 조명 간섭을 고려해 벽면에 배치하는 것이 좋습니다.' },
  { q: '포충기 대량 구매나 전문가 방문 설치·정기 소모품 관리도 신청할 수 있나요?', a: '네, 단품 즉시 구매는 연결된 공식 네이버 스마트스토어에서 가능하며, 사업장 다수 설치·위치 선정 상담이나 정기 해충방제와 연계한 포획지·램프 관리 문의는 에코플랜 고객센터(1688-4587) 또는 온라인 상담신청을 통해 안내받으실 수 있습니다.' }
];
add({ file: 'shop.html', label: '쇼핑몰', service: '업소용·야외용·화장실용 포충기 공급 및 설치 상담', itemList: shopProducts, faqs: shopFaqs, title: '포충기 쇼핑몰·설치 상담 | 스마트캐치 루미오·알파·포커스 공식 라인업 | 에코플랜', description: '스마트캐치 루미오키퍼(야외·단지용), 루미오·알파(업소·매장용), 포커스(화장실·소형) 공식 포충기 4종의 광원·설치 공간·가격을 비교하고 구매 또는 설치 상담을 신청하세요.', body: `${pageHero('쇼핑몰','에코플랜 공식 포충기 쇼핑몰, 유인 파장과 설치 동선까지 공간에 맞게 선택하세요.','날아다니는 비래해충(파리·나방파리·초파리·모기)의 포획과 모니터링을 돕는 포충기 라인업입니다. 설치 공간(야외·매장·화장실)별 사양을 비교하고 네이버 스마트스토어 구매 또는 전문가 설치 상담을 이용하세요.','ECOPLAN SHOP')}<section class="section"><div class="container">${sectionHeading('OFFICIAL PRODUCT LINEUP','에코플랜 공식 포충기 라인업 (4종)','카테고리를 선택하거나 제품을 클릭하면 공식 네이버 스마트스토어 상세 구매 페이지로 이동합니다.')}<div class="filter-row" id="shop-cat-filters" aria-label="상품 카테고리 분류">${['전체','업소·매장용 포충기','야외·단지용 포충기','소형·화장실용 포충기'].map((cat,idx)=>`<button type="button" class="filter-btn" data-shop-filter="${cat}" aria-pressed="${idx===0}">${cat}</button>`).join('')}</div>${shopCards()}<div class="table-wrap" style="margin-top:28px"><table><thead><tr><th>모델명</th><th>분류</th><th>유인 광원 · 방식</th><th>권장 설치 공간</th><th>공식 판매가</th></tr></thead><tbody><tr><td>스마트캐치 루미오키퍼</td><td>야외·단지용 포충기</td><td>UV LED 유인 포충등</td><td>아파트 단지, 건물 외곽 조경, 야외 보행로 주변</td><td>1,210,000원</td></tr><tr><td>스마트캐치 루미오</td><td>업소·매장용 포충기</td><td>UV LED 유인 포충기</td><td>음식점, 카페, 베이커리, 일반 상업 매장 실내 벽면</td><td>154,000원</td></tr><tr><td>스마트캐치 알파 (ALPHA)</td><td>업소·매장용 포충기</td><td>BL(Black Light) 램프 유인</td><td>외식 매장, 조리실 주변 통로, 식자재 창고, 작업장</td><td>187,000원</td></tr><tr><td>포커스 (FOCUS)</td><td>소형·화장실용 포충기</td><td>소형 유인 포충등</td><td>화장실, 세면장, 소형 매장, 탕비실 등 국소 공간</td><td>143,000원</td></tr></tbody></table></div><p class="note">표시 가격은 에코플랜 공식 등록 기준이며, 실제 재고·배송비·할인·소모품 옵션 및 교환·보증 조건은 연결된 스마트스토어 상세 페이지 또는 고객센터(1688-4587) 상담 기준을 따릅니다.</p></div></section><section class="section soft"><div class="container shop-grid"><figure class="shop-image"><img src="assets/trap.webp" alt="SMART CATCH ALPHA 업소용 포충기 외관 및 설치 안내 이미지" width="1000" height="877" loading="lazy"><figcaption class="source-line">SMART CATCH ALPHA · 설치 환경별 사양 및 유지관리 상담 가능</figcaption></figure><div><span class="eyebrow"><span class="dot"></span>INSECT LIGHT TRAP CONSULTING</span><h2>공간에 맞는 포충기<br>선택·설치 상담</h2><p>매장, 주방 주변, 창고 등 설치 장소와 식품 노출 여부를 먼저 확인합니다. 포충기는 날아다니는 성충의 포획과 모니터링을 돕는 장비이므로, 배수구 유기물막·정화조 유충 등 발생원 제거와 출입구 유입 차단을 병행해야 효과가 유지됩니다.</p><div class="credential-list"><span>${icon('check')}식품 노출 피한 위치 선정</span><span>${icon('check')}출입구·조도 간섭 점검</span><span>${icon('check')}공간 면적별 사양 상담</span><span>${icon('check')}램프·포획지 교체 안내</span></div><div class="actions">${btn('contact.html','설치·대량구매 상담')}${btn('flying-insects.html','파리·나방파리 방제 솔루션 ↗','light')}</div></div></div></section><section class="section"><div class="container">${sectionHeading('BEFORE YOU CHOOSE','구매·설치 전 꼭 확인할 세 가지')}<div class="info-cards">${[['설치 위치와 동선','조리대·식품 바로 위나 외부 유리창 밀착 설치를 피하고, 출입구 유입 동선과 벽면 전원 위치를 확인합니다.'],['유지관리와 소모품','포획지(끈끈이 등) 점검 편의성과 UV LED·BL램프 등 소모품 교체 주기, 정기방제 연계 여부를 함께 확인합니다.'],['발생원 병행 관리','화장실 배수구 나방파리나 주방 초파리가 다량 발생할 때는 유충 서식원 세척·약제 처리를 함께 진행해야 합니다.']].map(([h,p])=>`<div class="info-card">${icon('shop')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div><div style="margin-top:32px"><h2>포충기 구매·설치 자주 묻는 질문</h2>${faqHtml(shopFaqs)}</div>${sources}</div></section>${cta()}` });

const contactFaqs = [
  { q: '에코플랜 방문 상담과 방제 시공이 가능한 지역은 어디인가요?', a: '서울특별시 강서구 본사를 거점으로 서울 전 자치구(25개 구) 및 경기도·인천광역시 수도권 전역의 가정·음식점·빌딩·제조시설 방문 진단이 가능합니다. 외식·유통 프랜차이즈 가맹점이나 HACCP·GMP 제조시설 등 사업장 정기관리는 전국 단위로 일정을 협의해 진행합니다.' },
  { q: '홈페이지에서 작성한 문의 문안은 어떻게 접수되나요?', a: '개인정보 보호를 위해 웹 브라우저에 입력하신 내용은 제3자 외부 서버에 무단 저장되지 않으며, 작성 즉시 문의 문안으로 변환됩니다. 복사 후 공식 카카오톡 상담채널에 붙여넣거나 이메일 앱 열기(eco@ecoplan.co.kr) 또는 대표번호 1688-4587 유선 연결을 통해 담당 컨설턴트에게 바로 접수하실 수 있습니다.' }
];

const allFaqs = [
  ...faqs,
  ...pests.flatMap(p => p.faqs.map(([q,a])=>({category:'해충별',q,a}))),
  ...serviceFaqs.map(f => ({ category: '비용·상담', ...f })),
  ...processFaqs.map(f => ({ category: '서비스', ...f })),
  ...safetyFaqs.map(f => ({ category: '약제·안전', ...f })),
  ...industryFaqs.map(f => ({ category: '사업장', ...f })),
  ...companyFaqs.map(f => ({ category: '서비스', ...f })),
  ...partnerFaqs.map(f => ({ category: '사업장', ...f })),
  ...managementFaqs.map(f => ({ category: '사후관리', ...f })),
  ...shopFaqs.map(f => ({ category: '비용·상담', ...f })),
  ...contactFaqs.map(f => ({ category: '비용·상담', ...f }))
];
add({ file: 'faq.html', label: '자주 묻는 질문', title: `해충방제 FAQ (${allFaqs.length}문항) | 비용·약제·HACCP·사후관리 | 에코플랜`, description: `방제 비용, 아이·반려동물 약제 안전, 재입실, 3W·IPM, HACCP·GMP 시설 관리와 해충별 퇴치 방법까지. 에코플랜 상담 전 자주 묻는 질문 ${allFaqs.length}가지를 확인하세요.`, faqs: allFaqs, body: `${pageHero('자주 묻는 질문','궁금한 질문에, 명확한 답변을.','방제 비용과 과정, 약제 사용, 업종별 관리, 해충별 대응 방법을 확인하세요. 현장별 조건은 상담을 통해 구체적으로 안내합니다.','QUESTIONS & ANSWERS')}<section class="section"><div class="container faq-page"><label class="visually-hidden" for="faq-search">질문과 답변 검색</label><input type="search" id="faq-search" class="search-field" placeholder="궁금한 내용을 검색해보세요. 예: 비용, 반려동물, 바퀴벌레, HACCP"><div class="filter-row" aria-label="질문 분류">${['전체','서비스','비용·상담','약제·안전','사업장','사후관리','해충별'].map((x,i)=>`<button class="filter-btn" type="button" data-filter="${x}" aria-pressed="${i===0}">${x}</button>`).join('')}</div><p class="result-count" id="faq-count" aria-live="polite">${allFaqs.length}개의 질문을 확인할 수 있습니다.</p>${faqHtml(allFaqs,true)}<p id="faq-empty" class="empty" hidden>일치하는 질문이 없습니다. 다른 검색어를 입력하거나 전체 분류를 선택해주세요.</p>${sources}</div></section>${cta()}` });

add({ file: 'diagnosis.html', label: '해충 자가진단', service: '8대 해충 3W 원인분석 및 1~3단계 서식단계 자가진단', title: '정밀 해충 자가진단 | 3W 원인분석·서식단계·자가처리 리포트 | 에코플랜', description: '독일바퀴·쥐·나방파리·초파리·집파리·집모기·개미·먼지다듬이 등 8대 해충별 출현 빈도와 3W 환경 신호를 점검하고 서식 단계와 맞춤 처방을 확인하세요.', body: `${pageHero('해충 자가진단','우리 공간의 해충 서식 단계와 3W 원인을 정밀 진단하세요.','공간과 주요 출현 구역, 해충 종류별 관찰 마릿수(1~3단계), 3W 환경 징후를 선택하면 예상 서식 수준과 즉시 실행할 자가처리 수칙, 에코플랜 전문 방제 처방을 리포트로 안내합니다.','3W PRECISION SELF DIAGNOSIS')}<section class="section"><div class="container"><div class="form-panel"><form id="diagnosis-form"><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 01</span>진단할 공간과 주요 출현 구역을 선택해주세요</legend><div class="form-grid"><div class="field"><label for="check-space">공간 유형</label><select id="check-space" name="space"><option>가정·공동주택</option><option>외식업장·카페·프랜차이즈</option><option>식품제조·HACCP·공장</option><option>오피스 빌딩·공공기관</option><option>병원·호텔·숙박시설</option><option>물류·창고·상업유통시설</option></select></div><div class="field"><label for="check-zone">주요 발견·의심 구역</label><select id="check-zone" name="zone"><option>주방·조리실·싱크대 주변</option><option>화장실·배수구·정화조 주변</option><option>식자재 창고·하역장·보관실</option><option>홀·거실·침실·객실 내부</option><option>출입문·창틀·외곽 화단 주변</option><option>천장 내부·벽체 틈새·지하 기계실</option></select></div></div></fieldset><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 02</span>관찰되거나 의심되는 해충 종류를 선택해주세요 (선택 시 STEP 03 기준이 변경됩니다)</legend><div class="pest-select-grid">${[
  ['cockroach','독일바퀴 · 미국바퀴','주방·배관·가전 뒤편 야간 출몰'],
  ['rodent','쥐 (생쥐·시궁쥐)','배설물·천장 소음·포장재 갉은 흔적'],
  ['moth-fly','나방파리 (하수구 날파리)','화장실·배수구 벽면에 붙어 있는 날벌레'],
  ['fruit-fly','초파리 · 벼룩파리','음식물·쓰레기통·음료 주변 작은 파리'],
  ['house-fly','집파리 · 대형 파리','출입문·외부 쓰레기장 유입 파리'],
  ['mosquito','집모기 · 지하모기','화장실·지하 정화조·겨울철 실내 모기'],
  ['ant','개미 · 저곡해충','줄지어 이동하는 개미·곡물/사료 벌레'],
  ['other','먼지다듬이 · 진드기 · 지네','고습도 벽지/책장 미세벌레·외곽 침입충']
].map(([val,title,sub],idx)=>`<label class="pest-choice"><input type="radio" name="pest" value="${val}"${idx===0?' checked':''}><strong>${title}</strong><span>${sub}</span></label>`).join('')}</div></fieldset><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 03</span>현재 관찰되는 마릿수와 출현 빈도 단계(1~3단계)를 선택해주세요</legend><div id="stage-options-container" class="stage-choice-list"><label class="stage-choice"><input type="radio" name="stage" value="1"><div><strong>1단계 · 초기 침입 의심 (가끔 1마리 목격)</strong><span>외부 택배 박스나 배관 틈새를 통해 최근 유입되었을 가능성이 있는 단계입니다.</span></div></label><label class="stage-choice"><input type="radio" name="stage" value="2" checked><div><strong>2단계 · 실내 서식 단계 (구석 물건을 치우면 2~3마리 목격)</strong><span>주방 가구·가전 주변에 이미 은신처와 알집(난협)이 형성된 서식 단계입니다.</span></div></label><label class="stage-choice"><input type="radio" name="stage" value="3"><div><strong>3단계 · 확산·대량 서식 단계 (전등을 켜면 5마리 이상 또는 약충 다수 목격)</strong><span>번식이 빠르게 진행되어 인접 구역까지 확산 중인 집중 방제 필요 단계입니다.</span></div></label></div></fieldset><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 04</span>3W 환경·위험 신호 중 해당하는 항목을 모두 체크해주세요 (복수 선택)</legend><div class="check-grid-2">${[
  ['traces','배설물(검은 점·쥐 변), 알집(난협), 허물, 갉은 흔적이 보입니다.'],
  ['larva','새끼(약충·유충) 또는 알집이 함께 발견되어 실내 번식이 의심됩니다.'],
  ['night','소등 후·야간 또는 아침 첫 출근 시점에 집중적으로 목격됩니다.'],
  ['water','배수구 슬러지·악취, 싱크대 누수, 정화조·화분 등 물고임이 있습니다.'],
  ['entry','출입문 하단 유격, 방충망 파손, 배관 관통부 틈새, 택배 박스 적치가 있습니다.'],
  ['food','조리대·식자재·완제품 주변에서 발견되어 위생·이물 혼입이 우려됩니다.'],
  ['resisted','시중 살충제나 독먹이를 사용해 보았으나 며칠 뒤 다시 나타납니다.'],
  ['season','겨울철이나 비수기에도 줄어들지 않고 사계절 내내 보입니다.']
].map(([v,t])=>`<label class="check-option"><input type="checkbox" name="sign" value="${v}"><span>${t}</span></label>`).join('')}</div></fieldset><div class="actions" style="margin-top:20px"><button class="btn" type="submit">3W 정밀 진단 리포트 생성 ${icon('arrow')}</button><button class="btn light" type="reset">초기화</button></div></form><div id="diagnosis-result" class="result-box" tabindex="-1" role="region" aria-label="정밀 자가진단 리포트" hidden><div class="diag-result-header"><span class="eyebrow" style="margin:0"><span class="dot"></span>ECOPLAN 3W SELF-DIAGNOSIS REPORT</span><span class="diag-level-badge" data-level-badge></span></div><div class="diag-meter-wrap" aria-hidden="true"><div class="diag-meter-bar" data-meter-bar></div></div><h3></h3><p data-stage-summary style="font-weight:600;color:var(--ink)"></p><div class="diag-report-grid"><div class="diag-report-card"><small>WHY · 예상 유인 요인</small><p data-why></p></div><div class="diag-report-card"><small>WHERE · 핵심 점검 지점</small><p data-where></p></div><div class="diag-report-card"><small>WHEN · 활동·발생 특성</small><p data-when></p></div></div><div class="diag-report-card" style="margin-bottom:12px"><small>STEP-BY-STEP · 즉시 실천할 자가처리 및 주의사항</small><ul class="diag-action-list" data-diy-list></ul></div><div class="diag-report-card" style="margin-bottom:18px;background:var(--blue-soft);border-color:#bfd6ff"><small>ECOPLAN SOLUTION · 에코플랜 권장 전문 방제 처방</small><p data-plan></p></div><div class="actions"><a data-consult-link class="btn" href="contact.html">이 진단 결과로 무료 상담 신청 ${icon('arrow')}</a><button type="button" id="copy-diagnosis" class="btn light">진단 요약 복사</button><a data-pest-link class="btn light" href="services.html">해충별 상세 솔루션 보기 ↗</a></div><p id="diag-copy-status" role="status" style="margin-top:10px;font-weight:700;color:var(--blue)"></p><p class="note" style="margin-top:12px;margin-bottom:0">본 리포트는 선택하신 관찰 항목에 기반한 1차 관리 가이드이며, 정확한 종 동정과 서식 규모 판별은 에코플랜 전문가의 현장 3W 진단을 통해 확정됩니다. 입력 정보는 서버에 저장되지 않습니다.</p></div><noscript><p class="note">브라우저에서 자바스크립트가 비활성화되어 있으면 대화형 리포트 대신 아래 8대 해충별 1~3단계 판별 기준표 또는 1688-4587 전화상담을 통해 3W 기준을 확인하실 수 있습니다.</p></noscript></div><div style="margin-top:40px"><h2>8대 해충별 관찰 빈도에 따른 1~3단계 서식 판별 기준표</h2><p>대화형 진단 전후에 참고할 수 있는 에코플랜의 해충별 서식 단계 기준과 3W 핵심 점검 포인트입니다.</p><div class="table-wrap"><table><thead><tr><th>해충 종류</th><th>1단계 (초기 침입·탐색)</th><th>2단계 (실내·주변 서식)</th><th>3단계 (확산·대량 서식)</th><th>핵심 3W 방제 처방</th></tr></thead><tbody><tr><td>독일바퀴 · 미국바퀴</td><td>가끔 1마리 목격 (택배 박스·배관 유입 의심)</td><td>구석 물건 이동 시 2~3마리 목격 (은신처·알집 형성)</td><td>점등 시 5마리 이상 또는 약충 다수 목격</td><td>트랩 군집 특정 + 당분 기피 대응 독먹이 로테이션</td></tr><tr><td>쥐 (생쥐·시궁쥐)</td><td>배설물이나 포장재 갉은 흔적 발견</td><td>천장·벽체 소음과 함께 실제 쥐 목격</td><td>쥐 소리·배설물·개체 2마리 이상 반복 목격</td><td>외곽 디펜스라인 약제상자·차단 + 실내 물리적 포획</td></tr><tr><td>나방파리 (하수구 날파리)</td><td>벽면에 가끔 5마리 내외 붙어 있음</td><td>아침 출근 시 벽면에 10마리 내외 붙어 있음</td><td>5일 이상 지속적으로 20마리 내외 다수 출현</td><td>배수구·정화조 슬러지 유충구제제(IGR)·트랩 차단</td></tr><tr><td>초파리 · 벼룩파리</td><td>눈앞에 날리는 개체 5마리 내외</td><td>쓰레기통·조리대 주변 10마리 내외 날림</td><td>움직일 때마다 20마리 내외 떼 지어 날림</td><td>숨은 발효·부패 산란처 원천 제거 + 유충·포충기 관리</td></tr><tr><td>집파리 · 대형 파리</td><td>출입문 개폐 시 3마리 내외 일시 유입</td><td>천장·벽면에 10마리 내외 붙어 휴식</td><td>개문 시 20마리 내외 지속 유입</td><td>출입구 차단(도어클로저) + 외곽 방제 + 포충기 설계</td></tr><tr><td>집모기 · 지하모기</td><td>실내에서 간헐적으로 1~3마리 목격</td><td>화장실·복도 벽면에 5마리 내외 붙어 있음</td><td>매일 또는 겨울철에도 10마리 내외 지속 출현</td><td>지하 정화조·집수정 유충구제 + 성충 휴식 벽면 처리</td></tr><tr><td>개미 · 저곡해충</td><td>간헐적으로 1~5마리 미만 탐색 목격</td><td>줄지어 이동하거나 보관장 주변 10마리 내외</td><td>여러 구역 동시 출현 및 식자재 오염 우려</td><td>여왕개미 연쇄 독먹이 겔 + 저곡해충 페로몬 트랩</td></tr><tr><td>먼지다듬이 · 진드기 · 지네</td><td>특정 위치에서 1~3마리 미만 간헐 발견</td><td>같은 방·가구·창틀에서 매주 반복 출현</td><td>여러 공간 매일 다수 목격 및 생활 불편 심화</td><td>실내 제습(45~50% 이하) + 외곽 차단 벨트·미세 틈새 처리</td></tr></tbody></table></div>${sources}</div></div></section>${cta()}` });

add({ file: 'contact.html', label: '상담신청', service: '해충방제·방역소독 무료 방문상담 및 견적 안내', faqs: contactFaqs, title: '해충방제 무료 방문상담·서비스 가능 지역 | 1688-4587 | 에코플랜', description: '서울·경기·인천 수도권 및 전국 프랜차이즈·제조시설 에코플랜 해충방제·방역소독 상담. 전화 1688-4587, 카카오톡, 이메일 eco@ecoplan.co.kr 접수 안내.', type: 'ContactPage', body: `${pageHero('상담신청','공간의 고민, 에코플랜에 들려주세요.','해충 사진과 발견 위치, 공간의 종류를 알려주시면 상담에 도움이 됩니다. 서울·경기·인천 수도권 및 전국 사업장 방문 일정, 작업 범위와 비용을 안내합니다.','CONTACT ECOPLAN')}<section class="section"><div class="container contact-grid"><div><span class="eyebrow"><span class="dot"></span>SPACE CARE CENTER</span><h2>편한 방법으로<br>상담을 시작하세요.</h2><a href="tel:16884587" class="contact-number">1688-4587</a><div class="contact-detail"><p>현장 지역·시설 종류·면적을 준비해주세요.<br>방문과 작업 일정은 현장 조건에 따라 협의합니다.</p></div><div class="actions">${link(c.kakao,`${icon('chat')}카카오톡 상담 ↗`,'btn light')}${link('mailto:'+c.email,'이메일 문의 ↗','btn light')}</div><p class="source-line">${c.email}<br>${c.address}</p><div class="answer-box"><strong>상담 준비 체크</strong><p>① 현장 위치(시·군·구)와 대략적인 면적<br>② 해충 사진·발견 시간·주요 출현 위치<br>③ 기존 방제 이력 및 자체 사용한 약제<br>④ 영업·가동 시간과 영유아·반려동물 유무</p></div></div><div class="form-panel"><h3>문의 내용을 미리 정리해보세요.</h3><p>입력 내용으로 표준 문의 문안을 만듭니다. 복사 후 카카오톡으로 보내거나 이메일 앱에서 즉시 전송해주세요.</p><form id="consult-form"><div class="form-grid"><div class="field"><label for="consult-space">공간 유형</label><select id="consult-space" name="space"><option>가정·공동주택</option><option>음식점·카페</option><option>식품·제조시설</option><option>빌딩·공공기관</option><option>병원·호텔</option><option>상업·유통시설</option><option>기타</option></select></div><div class="field"><label for="consult-region">현장 지역 <span aria-hidden="true">*</span></label><input id="consult-region" name="region" placeholder="예: 서울 강서구" required maxlength="80" autocomplete="address-level2"></div><div class="field full"><label for="consult-service">관심 서비스</label><select id="consult-service" name="service"><option>해충방제</option><option>방역소독</option><option>정기 위생관리</option><option>포충기 구매·설치</option><option>기존 관리 현황 문의</option><option>이물·클레임 상담</option></select></div><div class="field full"><label for="consult-message">발견한 상황 또는 문의 내용</label><textarea id="consult-message" name="message" placeholder="예: 주방 싱크대 주변에서 밤마다 작은 바퀴벌레가 보입니다. 면적은 약 25평입니다." maxlength="600"></textarea></div></div><div class="actions"><button type="submit" class="btn">문의 문안 만들기 ${icon('arrow')}</button><button type="button" id="copy-consult" class="btn light">내용 복사</button><a id="mail-consult" class="btn light" href="mailto:${c.email}">이메일 앱 열기</a></div><p class="note">이 입력칸은 개인정보 보호를 위해 제3자 외부 서버에 무단 저장되지 않으며, 복사 후 공식 카카오톡 또는 이메일로 전송할 문안을 생성합니다. ${link('privacy.html','개인정보 안내')}</p></form><div id="consult-output" class="result-box" role="status" aria-live="polite" hidden></div></div></div></section><section class="section soft" id="service-area"><div class="container">${sectionHeading('SERVICE COVERAGE & CHANNELS','방문 진단 가능 권역 및 3대 공식 접수 채널 안내','서울 강서구 본사를 거점으로 수도권 직영 방문 진단 및 전국 프랜차이즈·사업장 정기 관리를 지원합니다.')}<div class="table-wrap"><table><thead><tr><th>구분</th><th>대상 지역 및 적용 범위</th><th>접수 방법 및 진행 절차</th></tr></thead><tbody><tr><td>수도권 직영 방문 진단 · 방제</td><td><strong>서울특별시 전 자치구(강서·양천·영등포·마포·강남·서초·송파 등 25개 구), 경기도, 인천광역시</strong> (가정·외식매장·빌딩·병원·제조시설)</td><td>1688-4587 전화 또는 카카오톡 접수 → 담당 컨설턴트 배정 → 현장 3W 진단 및 맞춤 견적·시공</td></tr><tr><td>전국 프랜차이즈 · 제조·물류 사업장</td><td><strong>전국 주요 시·도</strong> 외식 프랜차이즈 가맹점, HACCP·GMP 식품공장, 물류센터, 다점포 상업시설</td><td>본사·사업장 담당자 유선/이메일(eco@ecoplan.co.kr) 문의 → 표준 IPM 관리 범위·주기 협의 → 권역별 정기 관리</td></tr><tr><td>공식 포충기 구매 · 기술 지원</td><td>전국 택배 발송 (네이버 스마트스토어) 및 방문 설치 상담</td><td>단품 온라인 구매(스마트스토어) 또는 다량 설치·유지관리 고객센터(1688-4587) 접수</td></tr></tbody></table></div><div style="margin-top:32px"><h2>방문상담·서비스 지역 자주 묻는 질문</h2>${faqHtml(contactFaqs)}</div>${sources}</div></section>` });

add({ file: 'privacy.html', label: '개인정보 안내', title: '웹사이트 개인정보 안내 | 에코플랜', description: '에코플랜 홈페이지의 자가점검 및 문의 문안 작성 기능, 외부 상담 채널과 개인정보 관련 문의처를 안내합니다.', noindex: true, body: `${pageHero('개인정보 안내','웹사이트 개인정보 안내','이 안내는 현재 제작된 홈페이지 기능에서 처리하는 정보와 외부 상담 채널 연결 방식에 관한 설명입니다.','PRIVACY INFORMATION')}<section class="section"><div class="container article"><section><h2>1. 자가점검과 문의 문안 작성</h2><p>자가점검 선택값과 문의 문안 입력 내용은 브라우저 화면에서 결과를 생성하는 데 사용합니다. 이 사이트의 해당 기능은 입력 내용을 서버로 전송하거나 로컬 저장소에 보관하지 않습니다. 문의 내용 복사 버튼을 누르면 기기의 클립보드에 문안이 복사됩니다.</p></section><section><h2>2. 전화·카카오톡·이메일 연결</h2><p>이용자가 상담 채널을 열고 직접 전송하는 내용은 해당 채널을 통해 전달됩니다. 카카오톡 등 외부 서비스의 정보 처리는 해당 서비스의 정책을 따릅니다. 이메일 앱 열기만으로 이메일이 발송되는 것은 아니며, 이용자가 전송을 완료해야 합니다.</p></section><section><h2>3. 접속 정보와 외부 리소스</h2><p>사이트의 배포 호스팅 및 외부 글꼴 제공 서비스(Google Fonts)는 서비스 제공 과정에서 IP 주소·요청 정보 등 접속 정보를 처리할 수 있습니다. 현재 파일에는 별도 광고·방문 분석 스크립트가 포함되어 있지 않습니다. 실제 운영 환경에 접속 분석 또는 상담 저장 기능을 추가하는 경우 운영자는 처리 항목·목적·보유기간·수탁자 등을 실제 설정에 맞게 안내해야 합니다.</p></section><section><h2>4. 문의</h2><p>${c.legalName}<br>전화 ${link('tel:16884587',c.phone)}<br>이메일 ${link('mailto:'+c.email,c.email)}</p><p>기능 안내 작성일: 2026년 10월 28일</p></section></div></section>` });

await mkdir('assets', { recursive: true });
await copyFile('src/styles.css', 'assets/styles.css');
await copyFile('src/app.js', 'assets/app.js');
await writeFile('assets/favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#003da5"/><circle cx="32" cy="32" r="18" fill="none" stroke="#00d4b2" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#00d4b2"/></svg>');
for (const page of pages) await writeFile(page.file, shell(page));
const indexed = pages.filter(p => !p.noindex);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map(p=>`  <url><loc>${siteUrl}${p.file==='index.html'?'/':'/'+p.file}</loc></url>`).join('\n')}\n</urlset>\n`);
const nonPublicPaths = ['/src/', '/scripts/', '/docs/', '/node_modules/', '/test-results/', '/manager.html', '/admin.html', '/ecoplan-homepage/manager.html', '/ecoplan-homepage/admin.html'];
const disallowBlock = nonPublicPaths.map(p => `Disallow: ${p}`).join('\n');
await writeFile('robots.txt', `# Search & AI Search/Citation Crawlers Policy\nUser-agent: *\nAllow: /\n${disallowBlock}\n\n# Search & AI Search Indexing / User-Triggered Citation Bots\nUser-agent: Googlebot\nUser-agent: Bingbot\nUser-agent: Yeti\nUser-agent: OAI-SearchBot\nUser-agent: ChatGPT-User\nUser-agent: Claude-SearchBot\nUser-agent: Claude-User\nUser-agent: PerplexityBot\nUser-agent: Perplexity-User\nAllow: /\n${disallowBlock}\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
const llmsContent = `# 에코플랜 (EcoPlan) | ${c.legalName} 공식 AI 팩트 시트

> ${c.legalName}(브랜드명: 에코플랜 · EcoPlan)의 3W 원인진단, IPM 통합해충관리, 환경부 허가 약제 로테이션, HACCP·GMP 사업장 위생관리, 이물분석 및 공식 포충기 라인업 안내 문서입니다.

## 1. 기업 기본 정보
- 상호: ${c.legalName} (브랜드: ${c.name} / EcoPlan)
- 대표자: ${c.representative}
- 사업자등록번호: ${c.businessId}
- 고객상담센터: ${c.phone}
- 공식 이메일: ${c.email}
- 소재지: ${c.address}
- 공식 웹사이트: ${siteUrl}/

## 2. 핵심 방제 과학 체계 (3W & IPM 8대 기법)
- **3W 원인 분석**:
  - **Why (유인·발생 요인)**: 모기(열 → CO2 → 냄새), 파리(음식부패취 → 온도), 나방파리(배수관 유기물 슬러지), 초파리(발효취), 바퀴벌레·쥐(먹이·수분·열원·은신처)
  - **Where (침입·서식 경로)**: 외곽 디펜스라인, 출입문 하단(0.6cm 이상), 배관 관통부, 그리스트랩·배수구, 지하 정화조·집수정, 입고 골판지 박스
  - **When (활동·발생 시점)**: 야간·소등 직후, 주간 영업·하역 개문 시간대, 계절·수온 변화 및 청소 전후 추이
- **IPM 통합해충관리 8대 핵심 기법**: 3W분석 기법, IPM 적용, 모니터링 시스템, HACCP/GMP 기준 프로세스, 분석보고, 이물확인(해충동정·카탈라제 효소실험·제3자 기관 유전자/이물분석), 위생교육, 위생점검
- **약제 선정 및 로테이션 기준**: 환경부 허가·승인 살충제(피레스로이드·네오니코티노이드 계열 교차, 성충·유충·CS캡슐제제), 당분 기피(Bait Aversion) 대응 독먹이 기간별 로테이션, 전용 약제상자 살서제, 3가지 계열 살균제 적용

## 3. 대상 해충별 핵심 방제 기준
| 대상 해충 | 주요 유인·서식 지점 | 에코플랜 핵심 방제 공법 |
| --- | --- | --- |
| 바퀴벌레 (독일바퀴·미국바퀴) | 주방 가전 모터 열원, 싱크대 경첩·배관 틈새, 택배 박스, 배수구 | 포획 트랩 군집 특정 + 당분 기피 대응 독먹이 로테이션 + 피레스로이드·네오니코티노이드·CS제제 교차 적용 |
| 쥐 (생쥐·시궁쥐·지붕쥐) | 하역장·출입문 하단(0.6cm+), 배관 관통부, 천장 텍스, 식자재 창고 | 건물 외곽 디펜스라인(살서제 상자·방서망 차단) 구축 + 실내 이동 통로 물리적 포획·모니터링 |
| 나방파리·초파리·집파리 | 배수구·정화조 슬러지(나방파리), 음료·음식물 발효취(초파리), 출입구(집파리) | 유충 서식원 세척·유충구제제/CS제제 처리 + 출입구 유입 차단 + 공간 동선별 포충기 파장 설계 |
| 모기 (집모기·지하모기) | 지하 정화조·집수정(사계절 유충 번식), 환풍구, 방충망 물구멍, 고인 물 | 정화조·집수정 유충(장구벌레) 구제제 투여 + 성충 휴식 벽면 잔류 처리 + 침입 틈새 차단 |
| 개미·저곡해충 (권연벌레·화랑곡나방) | 창틀·타일 줄눈 이동 통로, 개봉 곡물·건어물·사료 포대 | 여왕개미 연쇄 제거 전용 독먹이 겔 + 감염 식자재 원천 분리 + 저곡해충 페로몬 트랩 모니터링 |
| 먼지다듬이·진드기·지네 | 신축·고습도(60%+) 결로 벽지/가구, 1층·전원주택 외벽 틈새·화단 | 해충 동정 + 실내 제습(45~50% 이하) 가이드 + 외곽 침입 차단 벨트 및 미세 틈새 전용 약제 처리 |

## 4. 공식 포충기 쇼핑몰 라인업 (4종)
| 모델명 | 분류 | 유인 광원·방식 | 권장 설치 공간 | 공식 판매가 | 구매 URL |
| --- | --- | --- | --- | --- | --- |
${shopProducts.map(item => `| ${item.name} | ${item.category} | ${item.name.includes('UV LED') ? 'UV LED 유인' : item.name.includes('BL램프') ? 'BL램프 유인' : '유인 포충등'} | ${item.description} | ${Number(item.price).toLocaleString('ko-KR')}원 | ${item.link_url} |`).join('\n')}

## 5. 함께하는 주요 파트너사 (${partners.length}곳)
- 외식·뷔페·프랜차이즈: 쿠우쿠우, 153구포국수, 도라보울, 육회로, 이가네양꼬치, 갈비명가궁, 이용성국수맛집, 구름산추어탕, 고기굽는정원, 홍콩반점, 삼청동샤브가든, 청정화푸드, 완미족발
- 가구·리빙: (주)티오피퍼니쳐
- 포장재·제조: (주)트루맨엠앤엘

## 6. 주요 공개 페이지 안내 (${indexed.length}개 대표 URL)
${indexed.map(p => `- [${p.label}](${siteUrl}${p.file === 'index.html' ? '/' : '/' + p.file}): ${p.description}`).join('\n')}

## 7. 정보 해석 및 제한 조건
- 사이트의 본문과 각 페이지의 설명을 기준으로 확인합니다.
- 1회 방제 작업만으로 모든 해충의 영구 박멸이나 재유입 차단을 보장하지 않으며, 시설 환경개선과 정기 모니터링이 병행되어야 합니다.
- HACCP·GMP·GSP 시설 관리 상담은 위생 관리 기준 충족을 지원하는 서비스이며 인증 취득 자체를 보장하지 않습니다.
- 온라인 해충 자가진단(diagnosis.html)은 관찰 정보 기반 1차 안내이며 전문가 현장 3W 진단을 대신하지 않습니다.
- 관리현황(management.html)의 6대 항목은 관리 기록 체계 설명이며 개별 고객의 실시간 실적 데이터가 아닙니다.
- 서비스 방문 가능 지역·일정·견적과 포충기 재고·배송·보증 조건은 상담(1688-4587) 또는 스마트스토어 상세 페이지 확인 사항입니다.
`;
await writeFile('llms.txt', llmsContent);
await writeFile('404.html', shell({ file:'404.html', label:'페이지를 찾을 수 없습니다', title:'페이지를 찾을 수 없습니다 | 에코플랜', description:'요청한 페이지가 없습니다. 에코플랜 홈 또는 서비스 안내를 확인해주세요.', noindex:true, body:`${pageHero('페이지 없음','페이지를 찾을 수 없습니다.','주소를 확인하거나 아래에서 필요한 서비스를 찾아주세요.','404 · PAGE NOT FOUND')}<section class="section"><div class="container actions">${btn('index.html','홈으로 이동')}${btn('services.html','서비스 둘러보기','light')}</div></section>` }));
const adminHtml = buildAdminHtml({ partners, shopProducts, company: c });
await writeFile('manager.html', adminHtml);
await writeFile('admin.html', adminHtml);
console.log(`Built ${pages.length} content pages + 404 + manager.html/admin.html; ${indexed.length} sitemap URLs; static JSON-LD, robots.txt and llms.txt ready.`);