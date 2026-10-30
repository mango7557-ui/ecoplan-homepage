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
const sources = `<div class="source-line">내용 기준: 에코플랜 제공 서비스 자료 및 공식 홈페이지 · 구성일 <time datetime="${c.updated}">2026.10.28</time><br>시설별 적용 범위와 작업 조건은 현장 확인 후 안내합니다. ${link('contact.html', '서비스 내용 문의')}</div>`;

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

const serviceCards = () => `<div class="service-grid">${pests.map((p, i) => `<a class="service-card" href="${p.slug}.html"><div class="service-card-media"><img src="${pestPhotos[p.slug]}" alt="${p.name} 방제 비주얼 이미지" width="900" height="600" loading="lazy"></div><div class="service-card-body"><small>0${i + 1} · ${p.en}</small><h3>${p.name} 맞춤 솔루션</h3><p>${p.desc}. 3W 발생 원인 진단부터 서식처 원천 차단과 정기 모니터링까지 체계적으로 관리합니다.</p><div class="card-foot">솔루션 상세보기 <span aria-hidden="true">↗</span></div></div></a>`).join('')}</div>`;

const industryCards = () => `<div class="industry-grid">${industries.map(i => `<a href="industries.html#${i[0]}" class="industry-card"><div class="industry-card-media"><img src="${placePhotos[i[0]]}" alt="${i[1]} 위생관리 공간 이미지" width="880" height="580" loading="lazy"></div><div class="industry-card-body"><h3>${i[1]}</h3><p>${i[3]}</p><small><span>${i[4]}</span><span aria-hidden="true">↗</span></small></div></a>`).join('')}</div>`;

const partnerCards = (full = false) => `<div class="${full ? 'partner-grid-full' : 'partner-strip'}" data-cms-partners="${full ? 'full' : 'strip'}">${partners.map(p => `<a class="partner-card" href="${esc(p.homepage_url || 'partners.html')}"${p.homepage_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="partner-poster"><img src="${p.image}" alt="${esc(p.name)} 파트너사 포스터" width="420" height="594" loading="lazy"></div><div class="partner-info"><h3>${esc(p.name)}</h3><p>${esc(p.description)}</p><span class="partner-link-badge">공식 사이트·안내 ↗</span></div></a>`).join('')}</div>`;

const shopCards = () => `<div class="shop-product-grid" data-cms-shop>${shopProducts.map(item => `<a class="shop-product-card" data-shop-cat="${esc(item.category || '업소·매장용 포충기')}" href="${esc(item.link_url || 'contact.html')}"${item.link_url ? ' target="_blank" rel="noopener noreferrer"' : ''}><div class="shop-product-thumb"><img src="${item.image}" alt="${esc(item.name)}" width="500" height="500" loading="lazy"></div><div class="shop-product-body"><span class="shop-cat-badge">${esc(item.category || '업소·매장용 포충기')}</span><h3>${esc(item.name)}</h3><div class="shop-price">${Number(item.price || 0).toLocaleString('ko-KR')}원</div><p>${esc(item.description)}</p><span class="shop-buy-btn">제품 상세·구매하기 ↗</span></div></a>`).join('')}</div>`;

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

function shell(page) {
  const url = c.url + (page.file === 'index.html' ? '/' : '/' + page.file);
  const org = { '@type': 'Organization', '@id': c.url + '/#organization', name: c.name, legalName: c.legalName, alternateName: 'EcoPlan', url: c.url + '/', logo: c.url + '/assets/logo.webp', telephone: c.phone, email: c.email, taxID: c.businessId, address: { '@type': 'PostalAddress', streetAddress: '양천로 489, 상가동 지하층 18호, 19호 (가양동, 가양우성아파트)', addressLocality: '강서구', addressRegion: '서울특별시', addressCountry: 'KR' }, contactPoint: { '@type': 'ContactPoint', telephone: c.phone, contactType: 'customer service', availableLanguage: 'Korean' } };
  const graph = [org, { '@type': 'WebSite', '@id': c.url + '/#website', url: c.url + '/', name: '에코플랜', inLanguage: 'ko-KR', publisher: { '@id': org['@id'] } }, { '@type': page.type || 'WebPage', '@id': url + '#webpage', url, name: page.title, description: page.description, inLanguage: 'ko-KR', isPartOf: { '@id': c.url + '/#website' }, about: { '@id': org['@id'] } }];
  if (page.file !== 'index.html') graph.push({ '@type': 'BreadcrumbList', itemListElement: [{ '@type': 'ListItem', position: 1, name: '홈', item: c.url + '/' }, { '@type': 'ListItem', position: 2, name: page.label, item: url }] });
  if (page.faqs?.length) graph.push({ ...faqSchema(page.faqs), '@id': url + '#faq' });
  if (page.service) graph.push({ '@type': 'Service', '@id': url + '#service', name: page.label, serviceType: page.service, description: page.description, url, provider: { '@id': org['@id'] } });

  const ogImageUrl = 'https://mango7557-ui.github.io/ecoplan-homepage/assets/og-kakao.jpg?v=2';
  return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${esc(page.title)}</title><meta name="description" content="${esc(page.description)}"><meta name="robots" content="${page.noindex ? 'noindex,follow' : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'}"><link rel="canonical" href="${url}"><meta name="theme-color" content="#003da5"><meta property="og:type" content="website"><meta property="og:locale" content="ko_KR"><meta property="og:site_name" content="에코플랜"><meta property="og:title" content="${esc(page.title)}"><meta property="og:description" content="${esc(page.description)}"><meta property="og:url" content="${url}"><meta property="og:image" content="${ogImageUrl}"><meta property="og:image:secure_url" content="${ogImageUrl}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="1024"><meta property="og:image:height" content="765"><meta property="og:image:alt" content="에코플랜 - 전문기업으로서 고객님께 안전한 서비스를 제공하기 위하여 에코플랜 연구소는 연구 개발에 몰두하고 있습니다."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${ogImageUrl}"><link rel="icon" href="assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="assets/styles.css">${page.file === 'index.html' ? '<link rel="preload" as="image" href="assets/hero-space.webp" fetchpriority="high">' : ''}<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c')}</script><script src="assets/app.js" defer></script></head>
<body><a href="#main" class="skip">본문 바로가기</a>
<div class="utility"><div class="container"><div class="utility-badges"><span class="utility-pill">ECOPLAN SCIENCE</span><span>3W 원인진단 · IPM 통합해충관리 · HACCP/GMP 위생솔루션</span></div><div class="utility-links">${link('diagnosis.html', '해충 자가진단')}${link('process.html', '3W·IPM 과학공법')}${link('products-safety.html', '약제·안전기준')}${link('faq.html', 'FAQ ↗')}</div></div></div>
<header class="header"><div class="container header-inner"><div class="header-top"><a href="index.html" class="brand" aria-label="에코플랜 홈"><img src="assets/logo.webp" alt="에코플랜 EcoPlan" width="144" height="52"><span class="brand-sub">SCIENCE CARE</span></a><div class="header-action"><a class="header-phone" href="tel:16884587">${icon('phone')}1688-4587</a>${link('contact.html', '무료상담 ↗', 'btn small')}</div></div><nav class="nav" id="primary-nav" aria-label="주 메뉴">${[['company.html', '회사소개'], ['services.html', '서비스소개'], ['partners.html', '파트너사'], ['management.html', '관리현황'], ['shop.html', '쇼핑몰'], ['contact.html', '상담신청'], ['faq.html', 'FAQ']].map(([href, label]) => `<a href="${href}"${page.file === href ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav></div></header>
<main id="main">${page.body}</main>
<footer class="footer"><div class="container"><div class="footer-top"><div class="footer-logo"><a href="manager.html" title="관리자 페이지로 이동"><img src="assets/logo.webp" alt="에코플랜" width="136" height="50" loading="lazy"></a><p>보이지 않는 원인까지 과학으로 설계하는 공간케어, 에코플랜.</p></div><nav class="footer-links" aria-label="하단 메뉴">${link('company.html', '회사소개')}${link('services.html', '서비스소개')}${link('partners.html', '파트너사')}${link('process.html', '3W·IPM 공법')}${link('products-safety.html', '사용약제 안내')}${link('industries.html', '장소별 솔루션')}${link('faq.html', '자주 묻는 질문')}${link('privacy.html', '개인정보 안내')}${link('contact.html', '고객센터')}${link('manager.html', '관리자 시스템')}</nav></div><div class="footer-info"><div><p><strong>${c.legalName}</strong> &nbsp;|&nbsp; 대표 ${c.representative} &nbsp;|&nbsp; 사업자등록번호 ${c.businessId}</p><p>${c.address}</p><p>이메일 ${link('mailto:' + c.email, c.email)}</p></div><div class="footer-contact">에코플랜 고객상담센터<strong>${link('tel:16884587', c.phone)}</strong><span>가정집 · 사업장 · HACCP 시설 맞춤 상담</span></div></div><div class="copyright">© 2026 ECOPLAN. All rights reserved.</div></div></footer>
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

const pageHero = (label, title, lead, eyebrow = 'ECOPLAN SCIENCE CARE') => `<section class="page-hero"><div class="container"><nav class="breadcrumb" aria-label="현재 위치">${link('index.html', '홈')}<span aria-hidden="true">/</span><span aria-current="page">${label}</span></nav><span class="eyebrow"><span class="dot"></span>${eyebrow}</span><h1>${title}</h1><p class="lead">${lead}</p><div class="page-meta">에코플랜 공간케어 공식 안내 · 구성일 <time datetime="2026-10-28">2026.10.28</time></div></div></section>`;
const add = page => pages.push(page);

add({
  file: 'index.html',
  label: '홈',
  title: '에코플랜 | 과학으로 설계하는 해충방제·방역소독·공간케어 솔루션',
  description: '에코플랜의 3W 원인진단과 IPM 통합해충관리. 바퀴벌레·쥐·파리·모기 방제부터 HACCP/GMP 사업장 관리, 이물분석과 포충기 솔루션까지 확인하세요.',
  faqs: faqs.slice(0, 5),
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
      ${btn('faq.html', '전체 22개 FAQ 바로가기', 'cyan')}
    </div>
    ${faqHtml(faqs.slice(0, 6))}
  </div>
</section>${cta()}`
});

add({ file: 'services.html', label: '서비스소개', title: '해충방제·방역소독 서비스 | 에코플랜 공간케어', description: '바퀴벌레·쥐·파리·모기 방제와 방역소독. 주요 공법, 약제 관리, 3W 전략, 업종별 방제와 사후관리 과정을 자세히 안내합니다.', service: '해충방제 및 방역소독', body: `${pageHero('서비스소개', '해충과 공간을 함께 이해하는 솔루션', '에코플랜은 해충 종류, 건물 구조, 이용자와 운영 환경을 조사해 방제 방법을 정합니다. 발생 원인 확인부터 맞춤 처리, 환경개선과 모니터링까지 연결합니다.', 'OUR SOLUTIONS')}<section class="section"><div class="container">${sectionHeading('PEST-SPECIFIC CARE', '어떤 해충으로 고민하고 계신가요?', '각 해충의 유입 경로와 생활사를 고려한 정밀 방제 솔루션')}${serviceCards()}<div class="inline-links">${link('process.html', '주요 공법·서비스 전략')}${link('products-safety.html', '사용약제 관리')}${link('process.html#claims', '클레임 처리 프로세스')}${link('industries.html', '업종별 서비스')}${link('diagnosis.html', '자가점검')}${link('faq.html', 'FAQ')}</div></div></section><section class="section soft" id="disinfection"><div class="container">${sectionHeading('DISINFECTION', '방역소독은 어떻게 진행하나요?', '대상 공간과 표면의 상태, 사용 제품의 적용 범위를 먼저 확인합니다.')}<div class="info-cards">${[['대상과 범위 확인', '공간 용도와 이용자, 접촉이 잦은 표면, 식품·물품 노출 여부를 확인합니다.'], ['현장별 처리 방법 선정', '환경부 허가 3가지 계열 살균제의 용도, 희석 및 적용 방법, 접촉시간 등 표시사항에 따라 작업 계획을 세웁니다.'], ['이용 전 안내', '환기, 재입실, 청소 및 접근 제한 등 제품과 작업 방식에 필요한 주의사항을 안내합니다.']].map(([h,p]) => `<div class="info-card">${icon('shield')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div><p class="note">소독의 효과와 적용 가능 범위는 대상, 제품, 작업 조건에 따라 달라집니다. 상담 시 관리 목적과 시설 특성을 알려주세요.</p></div></section><section class="section"><div class="container system-grid"><div><span class="eyebrow"><span class="dot"></span>SERVICE PROCESS</span><h2>조사부터 평가까지,<br>연결된 4단계 관리</h2><p>작업 내역과 현장 변화가 다음 관리의 기준이 됩니다.</p>${btn('process.html', '전체 프로세스 보기')}</div>${stepsHtml()}</div></section>${cta()}` });

for (const p of pests) {
  const questions = p.faqs.map(([q,a]) => ({q,a}));
  add({ file: `${p.slug}.html`, label: `${p.name} 방제`, title: `${p.name} 방제 방법·발생 원인·관리 안내 | 에코플랜`, description: p.answer, service: `${p.name} 방제`, faqs: questions, body: `${pageHero(`${p.name} 방제`, `${p.name}, 발생 원인부터 살핍니다.`, p.answer, p.en + ' MANAGEMENT')}<section class="section"><div class="container article-grid"><aside class="toc"><strong>이 페이지에서 확인하세요</strong>${[['signs','발생 신호'],['check','주요 점검 지점'],['prevention','직접 할 수 있는 관리'],['plan','에코플랜 방제 방법'],['faq','자주 묻는 질문']].map(([id,text]) => link('#'+id,text)).join('')}${link('contact.html','상담 문의 ↗')}</aside><article class="article"><div class="company-image" style="margin-bottom:28px"><img src="${pestPhotos[p.slug]}" alt="${p.name} 전문 방제 비주얼" width="900" height="600"></div><div class="answer-box"><strong>핵심 요약</strong><p>${p.desc}. 눈에 보이는 개체 수뿐 아니라 반복 출현, 발생 흔적과 주변 환경을 함께 확인해야 합니다.</p></div>${[['signs','이런 신호가 있다면 확인해주세요',p.signs],['check','현장에서는 무엇을 점검하나요?',p.checks],['prevention','상담 전 직접 할 수 있는 환경 관리',p.actions]].map(([id,title,items]) => `<section id="${id}"><h2>${title}</h2><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></section>`).join('')}<section id="plan"><h2>에코플랜은 어떻게 관리하나요?</h2><p>${p.plan}</p><p>방문 횟수와 주기는 현장 조사와 모니터링 결과를 바탕으로 협의합니다. 면적, 구조, 발생 정도, 작업 범위에 따라 견적이 달라집니다.</p><div class="inline-links">${link('process.html','4단계 서비스 프로세스')}${link('products-safety.html','약제·안전 안내')}${link('industries.html','업종별 관리')}</div></section><section id="faq"><h2>${p.name} 방제 FAQ</h2>${faqHtml(questions)}</section>${sources}</article></div></section>${cta()}` });
}

add({ file: 'process.html', label: '방제 전략·프로세스', title: '3W 분석·IPM 방제 전략과 클레임 처리 | 에코플랜', description: '왜·어디로·언제 발생하는지 확인하는 3W 분석, IPM 통합해충관리, 사전조사부터 평가까지 4단계 서비스와 이물·클레임 대응을 안내합니다.', body: `${pageHero('방제 전략·프로세스', '제거를 넘어, 발생 이유를 찾는 관리', '에코플랜은 건물의 조건과 해충의 행동 패턴을 조사하고, 방제·차단·환경개선·평가를 연결합니다. 3W 분석과 IPM 접근은 현장에 맞는 방제 계획의 바탕입니다.', 'SYSTEM & PROCESS')}<section class="section"><div class="container article-grid"><aside class="toc"><strong>전략과 진행 과정</strong>${link('#strategy','3W 분석·IPM')}${link('#methods','주요 공법')}${link('#process','4단계 서비스')}${link('#claims','클레임·이물 대응')}${link('#records','관리 기록')}</aside><article class="article"><section id="strategy"><h2>3W 분석은 무엇인가요?</h2><p>왜 실내로 침입하는지(Why), 어디로 침입하는지(Where), 언제 침입하는지(When)를 확인합니다. 건물의 조건과 해충의 실내 유인 요인을 함께 분석해 지속적인 관리 솔루션을 수립합니다.</p><div class="table-wrap"><table><thead><tr><th>분석 기준</th><th>핵심 질문</th><th>현장 확인 항목 및 유인 요인</th></tr></thead><tbody><tr><td>Why · 왜</td><td>왜 실내로 침입하는지?</td><td>모기 실내 유인요인(열 → CO2 → 냄새), 파리 실내 유인요인(음식부패취 → 온도), 먹이·수분·은신처</td></tr><tr><td>Where · 어디로</td><td>어디로 침입하는지?</td><td>외부 디펜스라인, 출입문, 배관 관통부, 배수시설·정화조, 입고 물품과 실내 서식 지점</td></tr><tr><td>When · 언제</td><td>언제 침입하는지?</td><td>주·야간 활동 시간, 영업·하역 시간대, 계절 변화 및 청소 전후의 발생 변화</td></tr></tbody></table></div><h3>IPM 통합해충관리 및 8대 핵심 기법</h3><p>IPM(Integrated Pest Management)은 해충 확인과 모니터링을 바탕으로 위생관리, 침입 차단, 물리적 방법, 필요한 약제 적용을 조합하는 체계입니다. 에코플랜은 사전조사·계획수립·제거·평가를 위해 <strong>3W분석 기법, IPM 적용, 모니터링 시스템, HACCP/GMP 기준 프로세스, 분석보고, 이물확인(해충동정), 위생교육, 위생점검</strong>을 현장 조건에 맞게 운영합니다.</p></section><section id="methods"><h2>해충별 주요 공법</h2><div class="table-wrap"><table><thead><tr><th>대상</th><th>관리 방향 (디펜스라인·서식처)</th><th>확인 기록</th></tr></thead><tbody><tr><td>쥐</td><td>외부 침입경로 관리(디펜스라인 구축) 및 실내 발생장소 집중 관리</td><td>흔적·포획·차단 상태</td></tr><tr><td>바퀴벌레</td><td>모니터링 진행 및 성충 관리(먹이·수분·서식 장소 원천 관리)</td><td>활동 위치·발생 추이</td></tr><tr><td>모기</td><td>유충 관리(정화조·물고임 장소) 및 휴식장소 관리, 침입경로 차단</td><td>발생원·계절 변화</td></tr><tr><td>파리류</td><td>배수·폐기물 등 부패취·발생원 개선, 유입 차단과 포획 장비 검토</td><td>종류·포획 위치·발생량</td></tr></tbody></table></div></section><section id="process"><h2>방제서비스 4단계 진행 프로세스</h2>${stepsHtml()}<p class="note">HACCP·GMP 시설은 국제 규격의 위생관리 기준과 현장 요구사항을 확인하여 방제 주기와 기록 범위를 협의합니다.</p></section><section id="claims"><h2>클레임·이물 문제는 어떻게 확인하나요?</h2><p>클레임은 <strong>정확성 확보, 전문성 확보, 객관성 확보</strong>의 전략으로 확인합니다. 일반 문의, 해충의 이상 발생, 제품 혼입 사례를 구분하여 이물확인보고서 작성 및 객관적 분석 절차를 진행합니다.</p><div class="table-wrap"><table><thead><tr><th>접수 구분</th><th>1차 확인 및 검토</th><th>정밀 실험 및 객관적 분석</th></tr></thead><tbody><tr><td>일반 문의</td><td>일반상담 및 현장 이력 확인</td><td>효소실험 (카탈라제 효소 반응 등 생사·혼입 시점 검토)</td></tr><tr><td>이상 발생</td><td>기존 방제 DB 검토 및 추이 비교</td><td>유전자 분석 (문제 심각 시 제3자 전문기관 의뢰 협의)</td></tr><tr><td>제품 혼입</td><td>공정·보관 경로 재현실험 및 동정</td><td>이물분석 (제3자 전문기관 객관적 분석 및 이물확인보고서)</td></tr></tbody></table></div><p>추가 출동, 재작업, 이물확인보고서 및 제3자 기관 분석 비용 범위는 계약 조건과 사안에 따라 안내합니다.</p></section><section id="records"><h2>관리 기록은 다음 조치의 근거입니다.</h2><p>현장·작업일·대상 해충·점검 위치·발생 흔적·장비 상태·적용 내용·개선 제안·다음 점검 계획을 관리 항목으로 활용합니다. 고객에게 제공할 문서와 형식은 계약 범위에 맞춰 협의합니다.</p>${link('management.html','관리 항목 자세히 보기 ↗','text-link')}</section>${sources}</article></div></section>${cta()}` });

add({ file: 'products-safety.html', label: '사용약제 관리', title: '방제 약제 선정·로테이션·작업 전후 안내 | 에코플랜', description: '환경부 허가 살충제·살서제·살균제 선정 기준, 피레스로이드·네오니코티노이드 계열 로테이션, 독먹이 당분 기피 대응과 작업 전후 주의사항을 안내합니다.', body: `${pageHero('사용약제 관리', '약제보다 먼저, 사용 조건을 확인합니다.', '살충제, 살서제, 살균제 모두 환경부에서 허가·승인된 약제만을 기준에 맞게 적용합니다. 내성과 기피 현상을 줄이기 위해 계열별·기간별 로테이션 기준을 수립해 운영합니다.', 'PRODUCT & APPLICATION')}<section class="section"><div class="container article-grid"><aside class="toc"><strong>약제 관리 안내</strong>${link('#selection','선정 기준')}${link('#rotation','계열별 로테이션')}${link('#before','작업 전 확인')}${link('#after','작업 후 확인')}</aside><article class="article"><section id="selection"><h2>어떤 기준으로 약제를 선택하나요?</h2><p>살충·살서·살균 제품의 용도와 적용 대상을 구분합니다. 동일한 성분 계열이라도 제품별 사용 장소·방법·주의사항은 다를 수 있어 개별 제품의 허가·표시사항이 기준이 됩니다.</p><ul><li>대상 해충과 생활 단계: 성충구제제·유충구제제 등 적용 대상 확인</li><li>제형과 처리 방법: 독먹이, 액상, CS(캡슐)제제 등 현장 적합성 검토</li><li>사용 장소: 식품 취급 구역, 실내외, 이용자 접근 가능성</li><li>제품 정보: 환경부 허가·승인 사항, 사용량·농도, 주의사항 및 보관 조건</li></ul></section><section id="rotation"><h2>약제 계열 구성과 로테이션 프로세스</h2><p>액체형 살충제의 핵심 이슈인 <strong>내성 발생</strong>을 극복하기 위해 계열별 로테이션 기준을 수립해 적용하며, 독먹이 약제는 <strong>당분 기피(Bait Aversion)</strong> 현상을 고려해 기간별 로테이션 기준을 운영합니다.</p><div class="table-wrap"><table><thead><tr><th>약제 분류</th><th>적용 목적 및 특징</th><th>운영 기준</th></tr></thead><tbody><tr><td>피레스로이드 계열</td><td>주요 위생해충 성충 구제 및 빠른 녹다운 효과</td><td>네오니코티노이드 등 타 계열과 교차 로테이션</td></tr><tr><td>네오니코티노이드 계열</td><td>기존 약제 내성 개체 대응 및 잔효성 관리</td><td>현장 발생 이력과 내성 모니터링에 따른 주기적 전환</td></tr><tr><td>성충구제제 · 유충구제제 · CS(캡슐)제제</td><td>해충 생활사(성충·유충) 동시 타깃 및 서방형 캡슐 잔효 유지</td><td>정화조·배수구·은신처 등 서식 환경별 제형 선택</td></tr><tr><td>살서제</td><td>현장 경험과 섭식 행태를 반영한 쥐 방제용 약제</td><td>외곽·실내 전용 약제상자 내 안전 배치 및 섭식 모니터링</td></tr><tr><td>3가지 계열 살균제</td><td>공간·표면 위생 관리를 위한 살균 소독</td><td>오염도·표면 재질·접촉시간에 맞춘 계열별 선정</td></tr></tbody></table></div><p class="note">현장 사용 제품의 구체적인 제품명·승인번호·물질안전보건자료(MSDS)는 작업 전후 담당자에게 확인할 수 있습니다.</p></section><section id="before"><h2>작업 전에 알려주세요.</h2><ul><li>어린이·반려동물·민감한 이용자의 유무</li><li>식품, 조리 도구, 사료, 장난감 등 노출 가능한 물품</li><li>영업시간과 작업 가능 구역, 환기 조건</li><li>기존에 사용한 방제 제품과 처리 위치</li></ul></section><section id="after"><h2>작업 후 무엇을 확인해야 하나요?</h2><p>제품명, 처리 위치, 환기·재입실 조건, 청소 가능한 범위, 접근 제한과 장비 취급 방법을 확인합니다. 모든 작업에 동일한 대기시간을 적용할 수는 없습니다. 안내받은 조건을 따르고 궁금한 점은 담당자에게 문의하세요.</p><p>약제나 장비를 임의로 옮기거나 다른 제품을 혼용하기 전에 담당자와 확인합니다.</p></section>${sources}</article></div></section>${cta()}` });

add({ file: 'industries.html', label: '장소별 추천', title: '음식점·공장·빌딩·가정 장소별 해충관리 | 에코플랜', description: '음식점, HACCP·GMP·GSP 제조시설, 빌딩, 공공기관, 병원·호텔, 주택과 상업시설의 120개 장소 유형별 해충관리 전략을 안내합니다.', body: `${pageHero('장소별 추천', '어느 곳에 에코플랜이 필요한가요?', '해충별 기본 전략에 화장실·탕비실·주방·창고 등 120개 세부 장소별 전략과 업종별 프로세스를 결합합니다. 바퀴벌레·쥐·파리·모기·소형파리(나방파리·초파리)·먼지다듬이·진드기·지네까지 공간에 맞춰 관리합니다.', 'SOLUTIONS BY PLACE')}<section class="section"><div class="container article-grid"><aside class="toc"><strong>내 공간 찾아보기</strong>${industries.map(i => link('#'+i[0],i[1])).join('')}${link('#matrix','120개 장소·해충 매트릭스')}</aside><article class="article">${industries.map(i => `<section id="${i[0]}"><div class="company-image" style="margin-bottom:20px"><img src="${placePhotos[i[0]]}" alt="${i[1]} 대표 공간 이미지" width="880" height="580" loading="lazy"></div><span class="eyebrow"><span class="dot"></span>${i[2]}</span><h2>${i[1]} 해충관리</h2><p>${i[3]}</p><div class="answer-box"><strong>주요 확인 구역</strong><p>${i[4]}</p></div><h3>상담 전에 준비하면 좋은 정보</h3><ul><li>시설 위치와 면적, 영업·운영 시간, 접근 제한 구역</li><li>주요 발생 해충과 발견 장소·시간, 기존 방제 이력</li><li>필요한 작업·점검 기록과 내부 시설 관리 기준</li></ul>${link('contact.html',i[1]+' 맞춤 상담 ↗','text-link')}</section>`).join('')}<section id="matrix"><h2>업종·규격·대상 해충 통합 관리 체계</h2><p>에코플랜은 모든 업종의 고객 환경에 맞춰 <strong>해충별 기본전략 × 120개 세부 장소별 전략 × 업종별 프로세스</strong>를 결합합니다.</p><div class="table-wrap"><table><thead><tr><th>구분</th><th>세부 적용 범위</th></tr></thead><tbody><tr><td>주요 업종 및 시설</td><td>빌딩, 공공기관, 병원·호텔, 상업시설, 주택·공동주택, 식품·제조시설</td></tr><tr><td>관리 기준 연계</td><td>HACCP, GMP, GSP, 일반 제조시설 위생기준, 주거 생활환경 기준</td></tr><tr><td>세부 장소 구분</td><td>주방, 조리실, 창고, 하역장, 화장실, 탕비실, 객실, 기계실, 정화조 등 120개 장소 유형별 맞춤 적용</td></tr><tr><td>관리 대상 해충</td><td>바퀴벌레, 쥐, 파리, 모기, 소형파리(나방파리·초파리), 먼지다듬이, 진드기, 지네 등</td></tr></tbody></table></div></section>${sources}</article></div></section>${cta()}` });

add({ file: 'company.html', label: '회사소개', title: '에코플랜 회사소개·전문가 교육·기업 정보', description: '주식회사 한국에코플랜의 공간케어 철학, 전문가 교육과 기업 정보를 확인하세요. 대표 김영태, 고객센터 1688-4587, 서울 강서구 소재.', type: 'AboutPage', body: `${pageHero('회사소개', '더 나은 일상은, 건강한 공간에서.', '에코플랜은 방역소독과 해충방제를 통해 고객의 공간을 과학적으로 관리합니다. 눈앞의 문제와 발생 환경을 함께 살피고, 현장에 필요한 해결 방법을 찾습니다.', 'ABOUT ECOPLAN')}<section class="section"><div class="container company-grid"><figure class="company-image"><img src="assets/company.webp" alt="에코플랜 제공 기업 소개 이미지" width="1200" height="900" loading="lazy"><figcaption>에코플랜 연구소 및 방제 전문가 그룹</figcaption></figure><div><span class="eyebrow"><span class="dot"></span>OUR APPROACH</span><h2>방제전문가가 직접 방문하고,<br>기록을 바탕으로 관리합니다.</h2><p>법정교육은 물론 별도의 전문가 교육프로그램을 수료하였으며, 지속적으로 세미나·관련 전시회 등에 참석하여 기술을 업데이트합니다. 현장에서 숙련된 인력이 보수교육을 통해 최신 서비스를 제공합니다.</p><div class="credential-list">${['법정교육 수료', '방제전문가 교육 수료', '위해생물 방제사 수료', '모기 동정·관리 수료', '1년 2회 이상 세미나 참석', '지속적 현장 보수교육'].map(t=>`<span>${icon('check')}${t}</span>`).join('')}</div><p class="note">교육 과정과 수료 범위는 담당 인력별로 다를 수 있습니다. 관련 확인 자료는 상담 시 요청해주세요.</p></div></div></section><section class="section soft"><div class="container">${sectionHeading('COMPANY INFORMATION','에코플랜 기업 정보')}<div class="table-wrap"><table><tbody>${[['상호',c.legalName],['브랜드','에코플랜 · EcoPlan'],['대표',c.representative],['사업자등록번호',c.businessId],['주소',c.address],['고객센터',c.phone],['이메일',c.email]].map(([a,b])=>`<tr><th scope="row">${a}</th><td>${b}</td></tr>`).join('')}</tbody></table></div><p class="source-line">기업 정보 출처: ${link(c.url+'/', '에코플랜 공식 홈페이지')} · 확인 기준일 2026.10.28</p></div></section><section class="section"><div class="container">${sectionHeading('FIELD & CREDENTIALS','표창장 및 작업사진 안내','공개 가능한 현장 작업 자료와 증빙을 통해 서비스 내용을 확인할 수 있습니다.')}<div class="info-cards"><div class="info-card">${icon('clipboard')}<h3>표창장 · 교육 수료 증빙</h3><p>표창명, 발급기관, 발급일 및 법정·전문 교육 수료 확인 자료는 상담 시 안내받으실 수 있습니다.</p></div><div class="info-card">${icon('search')}<h3>현장 작업사진</h3><p>구역별 진단, 트랩 설치, 약제·소독 처리 등 작업사진은 고객 보호 범위를 준수하여 관리·안내합니다.</p></div><div class="info-card">${icon('chart')}<h3>정기 관리 리포트</h3><p>현장 조건, 작업 범위와 점검 기록을 함께 제공해 공간의 위생 개선 추이를 명확히 공유합니다.</p></div></div></div></section>${cta()}` });

add({ file: 'partners.html', label: '파트너사', title: '함께하는 파트너사·프랜차이즈 | 에코플랜 공간케어', description: '쿠우쿠우, 153구포국수, 홍콩반점, 삼청동샤브가든, 완미족발, (주)티오피퍼니쳐, (주)트루맨엠앤엘 등 에코플랜과 함께하는 15개 파트너사를 소개합니다.', body: `${pageHero('파트너사', '에코플랜과 함께하는 파트너사', '외식 프랜차이즈부터 제조·유통·리빙 브랜드까지, 에코플랜의 체계적인 공간케어와 함께하는 파트너사를 소개합니다. 카드를 클릭하면 각 파트너사 공식 안내 페이지로 이동합니다.', 'FRANCHISE & PARTNERS')}<section class="section"><div class="container">${sectionHeading('OUR PARTNERS', '함께하는 프랜차이즈 & 기업 파트너 (' + partners.length + '곳)', '에코플랜 공식 사이트에 등록된 파트너사 포스터와 브랜드 소개입니다.')}${partnerCards(true)}${sources}</div></section>${cta()}` });

add({ file: 'management.html', label: '관리현황', title: '방제 관리현황·모니터링 기록 안내 | 에코플랜', description: '해충 발생 위치, 포획 추이, 시설 개선과 다음 점검 계획까지. 에코플랜의 관리현황 확인 항목과 고객별 관리 기록 문의 방법을 안내합니다.', body: `${pageHero('관리현황', '기록을 통해, 공간의 변화를 확인합니다.', '해충 관리는 작업 당일의 처리에서 끝나지 않습니다. 발생 위치와 빈도, 장비 상태, 시설 개선 여부를 기록하고 다음 관리 계획에 반영합니다.', 'MANAGEMENT & MONITORING')}<section class="section"><div class="container">${sectionHeading('MANAGEMENT RECORDS','우리 공간에서 확인할 6대 관리 항목','아래는 관리 항목 안내이며, 개별 고객의 실제 실적이나 실시간 데이터가 아닙니다.')}<div class="management-list">${[['01','현장과 대상 해충','시설별 구역을 나누고 관찰한 해충과 흔적, 최초 발견 시점을 기록합니다.'],['02','점검·포획 기록','장비 위치, 점검 일자, 포획 또는 활동 흔적을 연결해 발생 추이를 확인합니다.'],['03','작업 내역','적용 범위와 처리 방법, 사용 제품·장비와 작업 전후 안내를 확인합니다.'],['04','환경개선 제안','틈새, 누수, 적치물, 폐기물 관리 등 고객과 함께 개선할 과제를 정리합니다.'],['05','사후 확인','재발 위치와 상황을 기존 기록과 비교하고 관리 방향을 조정합니다.'],['06','다음 점검 계획','현장 상태와 계약 범위에 따라 다음 방문 및 확인 항목을 협의합니다.']].map(([n,h,p])=>`<div class="management-card"><strong>RECORD ${n}</strong><h3>${h}</h3><p>${p}</p><div class="status-line"><span class="dot"></span>현장별 맞춤 관리 기록</div></div>`).join('')}</div><div class="diagnosis-banner"><div><h3>이미 에코플랜의 관리를 받고 계신가요?</h3><p>현장명과 계약 담당 정보를 준비해 고객센터로 문의하시면 공개 가능한 관리 기록과 확인 절차를 안내합니다.</p></div>${btn('contact.html','관리 기록 문의','light')}</div></div></section>${cta()}` });

add({ file: 'shop.html', label: '쇼핑몰', title: '포충기 쇼핑몰·설치 상담 | 스마트캐치 공식 라인업 | 에코플랜', description: '스마트캐치 루미오키퍼, 루미오, 알파, 포커스 등 업소용·야외용·화장실용 포충기 라인업을 확인하고 바로 구매하거나 맞춤 설치를 상담하세요.', body: `${pageHero('쇼핑몰','포충기 선택도, 공간 과학에 맞게.','날아다니는 비래해충의 포획과 모니터링을 돕는 포충기. 공간별 추천 라인업을 확인하고 네이버 스마트스토어 구매 또는 전문가 설치 상담을 이용하세요.','ECOPLAN SHOP')}<section class="section"><div class="container">${sectionHeading('OFFICIAL PRODUCT LINEUP','에코플랜 공식 포충기 쇼핑몰','카테고리를 선택하거나 제품을 클릭하면 상세 구매 페이지로 이동합니다.')}<div class="filter-row" id="shop-cat-filters" aria-label="상품 카테고리 분류">${['전체','업소·매장용 포충기','야외·단지용 포충기','소형·화장실용 포충기'].map((cat,idx)=>`<button type="button" class="filter-btn" data-shop-filter="${cat}" aria-pressed="${idx===0}">${cat}</button>`).join('')}</div>${shopCards()}</div></section><section class="section soft"><div class="container shop-grid"><figure class="shop-image"><img src="assets/trap.webp" alt="SMART CATCH ALPHA 포충기 제품 이미지" width="1000" height="877" loading="lazy"><figcaption class="source-line">SMART CATCH ALPHA · 설치 환경별 사양 및 유지관리 상담 가능</figcaption></figure><div><span class="eyebrow"><span class="dot"></span>INSECT LIGHT TRAP CONSULTING</span><h2>공간에 맞는 포충기<br>선택·설치 상담</h2><p>매장, 주방 주변, 창고 등 설치 장소와 식품 노출 여부를 확인합니다. 포충기를 설치하더라도 발생원 관리와 유입 차단을 병행하는 것이 중요합니다.</p><div class="credential-list"><span>${icon('check')}설치 위치 정밀 선정</span><span>${icon('check')}유지관리 조건 확인</span><span>${icon('check')}공간별 사양 상담</span><span>${icon('check')}소모품 교체 안내</span></div><div class="actions">${btn('contact.html','설치·대량구매 상담')}${btn('manager.html','관리자 상품 등록 ↗','light')}</div></div></div></section><section class="section"><div class="container">${sectionHeading('BEFORE YOU CHOOSE','구매 전 꼭 확인할 세 가지')}<div class="info-cards">${[['설치 환경','공간 크기, 벽면·전원, 출입구와 주변 조명, 식품과 이용자 동선을 확인합니다.'],['관리 방식','포획 방식과 점검 편의성, 소모품 교체 주기 및 비용을 함께 확인합니다.'],['제품 조건','실제 모델의 적용 범위, 인증·표시사항, 설치 조건, 교환·반품 및 보증 기준을 확인합니다.']].map(([h,p])=>`<div class="info-card">${icon('shop')}<h3>${h}</h3><p>${p}</p></div>`).join('')}</div></div></section>${cta()}` });

const allFaqs = [...faqs, ...pests.flatMap(p => p.faqs.map(([q,a])=>({category:'해충별',q,a})))];
add({ file: 'faq.html', label: '자주 묻는 질문', title: '해충방제 FAQ | 비용·약제·HACCP·사후관리 | 에코플랜', description: '방제 비용, 아이·반려동물, 재입실, IPM, HACCP·GMP 시설 관리와 해충별 관리 방법까지. 에코플랜 상담 전 궁금한 질문 22가지를 확인하세요.', faqs: allFaqs, body: `${pageHero('자주 묻는 질문','궁금한 질문에, 명확한 답변을.','방제 비용과 과정, 약제 사용, 업종별 관리, 해충별 대응 방법을 확인하세요. 현장별 조건은 상담을 통해 구체적으로 안내합니다.','QUESTIONS & ANSWERS')}<section class="section"><div class="container faq-page"><label class="visually-hidden" for="faq-search">질문과 답변 검색</label><input type="search" id="faq-search" class="search-field" placeholder="궁금한 내용을 검색해보세요. 예: 비용, 반려동물, 바퀴벌레, HACCP"><div class="filter-row" aria-label="질문 분류">${['전체','서비스','비용·상담','약제·안전','사업장','사후관리','해충별'].map((x,i)=>`<button class="filter-btn" type="button" data-filter="${x}" aria-pressed="${i===0}">${x}</button>`).join('')}</div><p class="result-count" id="faq-count" aria-live="polite">${allFaqs.length}개의 질문을 확인할 수 있습니다.</p>${faqHtml(allFaqs,true)}<p id="faq-empty" class="empty" hidden>일치하는 질문이 없습니다. 다른 검색어를 입력하거나 전체 분류를 선택해주세요.</p>${sources}</div></section>${cta()}` });

add({ file: 'diagnosis.html', label: '해충 자가진단', title: '정밀 해충 자가진단 | 3W 원인분석·서식단계·자가처리 리포트 | 에코플랜', description: '독일바퀴·쥐·나방파리·초파리·집파리·집모기·개미·먼지다듬이 등 8대 해충별 출현 빈도와 3W 환경 신호를 점검하고 서식 단계와 맞춤 처방을 확인하세요.', body: `${pageHero('해충 자가진단','우리 공간의 해충 서식 단계와 3W 원인을 정밀 진단하세요.','공간과 주요 출현 구역, 해충 종류별 관찰 마릿수(1~3단계), 3W 환경 징후를 선택하면 예상 서식 수준과 즉시 실행할 자가처리 수칙, 에코플랜 전문 방제 처방을 리포트로 안내합니다.','3W PRECISION SELF DIAGNOSIS')}<section class="section"><div class="container"><div class="form-panel"><form id="diagnosis-form"><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 01</span>진단할 공간과 주요 출현 구역을 선택해주세요</legend><div class="form-grid"><div class="field"><label for="check-space">공간 유형</label><select id="check-space" name="space"><option>가정·공동주택</option><option>외식업장·카페·프랜차이즈</option><option>식품제조·HACCP·공장</option><option>오피스 빌딩·공공기관</option><option>병원·호텔·숙박시설</option><option>물류·창고·상업유통시설</option></select></div><div class="field"><label for="check-zone">주요 발견·의심 구역</label><select id="check-zone" name="zone"><option>주방·조리실·싱크대 주변</option><option>화장실·배수구·정화조 주변</option><option>식자재 창고·하역장·보관실</option><option>홀·거실·침실·객실 내부</option><option>출입문·창틀·외곽 화단 주변</option><option>천장 내부·벽체 틈새·지하 기계실</option></select></div></div></fieldset><fieldset class="diag-step-box"><legend><span class="diag-step-badge">STEP 02</span>관찰되거나 의심되는 해충 종류를 선택해주세요 (선택 시 STEP 03 기준이 변경됩니다)</legend><div class="pest-select-grid">${[
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
].map(([v,t])=>`<label class="check-option"><input type="checkbox" name="sign" value="${v}"><span>${t}</span></label>`).join('')}</div></fieldset><div class="actions" style="margin-top:20px"><button class="btn" type="submit">3W 정밀 진단 리포트 생성 ${icon('arrow')}</button><button class="btn light" type="reset">초기화</button></div></form><div id="diagnosis-result" class="result-box" tabindex="-1" role="region" aria-label="정밀 자가진단 리포트" hidden><div class="diag-result-header"><span class="eyebrow" style="margin:0"><span class="dot"></span>ECOPLAN 3W SELF-DIAGNOSIS REPORT</span><span class="diag-level-badge" data-level-badge></span></div><div class="diag-meter-wrap" aria-hidden="true"><div class="diag-meter-bar" data-meter-bar></div></div><h3></h3><p data-stage-summary style="font-weight:600;color:var(--ink)"></p><div class="diag-report-grid"><div class="diag-report-card"><small>WHY · 예상 유인 요인</small><p data-why></p></div><div class="diag-report-card"><small>WHERE · 핵심 점검 지점</small><p data-where></p></div><div class="diag-report-card"><small>WHEN · 활동·발생 특성</small><p data-when></p></div></div><div class="diag-report-card" style="margin-bottom:12px"><small>STEP-BY-STEP · 즉시 실천할 자가처리 및 주의사항</small><ul class="diag-action-list" data-diy-list></ul></div><div class="diag-report-card" style="margin-bottom:18px;background:var(--blue-soft);border-color:#bfd6ff"><small>ECOPLAN SOLUTION · 에코플랜 권장 전문 방제 처방</small><p data-plan></p></div><div class="actions"><a data-consult-link class="btn" href="contact.html">이 진단 결과로 무료 상담 신청 ${icon('arrow')}</a><button type="button" id="copy-diagnosis" class="btn light">진단 요약 복사</button><a data-pest-link class="btn light" href="services.html">해충별 상세 솔루션 보기 ↗</a></div><p id="diag-copy-status" role="status" style="margin-top:10px;font-weight:700;color:var(--blue)"></p><p class="note" style="margin-top:12px;margin-bottom:0">본 리포트는 선택하신 관찰 항목에 기반한 1차 관리 가이드이며, 정확한 종 동정과 서식 규모 판별은 에코플랜 전문가의 현장 3W 진단을 통해 확정됩니다. 입력 정보는 서버에 저장되지 않습니다.</p></div><noscript><p class="note">인터랙티브 진단 리포트를 보려면 JavaScript를 활성화해주세요. 아래 기준표에서 해충별 1~3단계 진단 기준을 바로 확인할 수 있습니다.</p></noscript></div></div></section><section class="section soft"><div class="container">${sectionHeading('SELF-DIAGNOSIS GUIDE','해충별 3단계 자가진단 및 대처 기준표','관찰된 현상(마릿수·빈도)에 따른 예상 서식 단계와 우선 조치 방법을 한눈에 확인하세요.')}<div class="table-wrap"><table><thead><tr><th>대상 해충</th><th>관찰 증상 (1~3단계)</th><th>예상 관리·서식 수준</th><th>권장 자가처리 및 조치 방법</th></tr></thead><tbody><tr><td>나방파리</td><td>1. 가끔 벽에 붙어 있음(5마리 내외)<br>2. 아침 출근 시 벽에 붙어 있음(10마리 내외)<br>3. 5일 이상 지속적으로 많이 보임(20마리 내외)</td><td>1. 실내 서식 초기 단계<br>2. 실내 서식 확산 단계<br>3. 대량 서식 단계</td><td>1. 배수로 솔질 청소<br>2. 배수로 및 구석진 곳 온수·유기물 청소<br>3. 정화조·배수 설비 점검, 방제회사 문의 및 포충기 설치 검토</td></tr><tr><td>초파리</td><td>1. 눈앞에 날리는 것이 보임(5마리 내외)<br>2. 쓰레기통 주변에 날림(10마리 내외)<br>3. 움직일 때마다 날림(20마리 내외)</td><td>1. 실내 침입 단계<br>2. 실내 서식 단계<br>3. 대량 서식 단계</td><td>1. 외부 쓰레기통 확인 및 뚜껑 밀폐<br>2. 실내 쓰레기 밀봉 후 외부 배출<br>3. 대량 서식 단계로 방제회사 문의 및 포충기 설치 검토</td></tr><tr><td>집파리</td><td>1. 눈앞에 날리는 것이 보임(3마리 내외)<br>2. 천장 및 벽면에 붙어 있음(10마리 내외)<br>3. 문을 열어 놓으면 많이 유입됨(20마리 내외)</td><td>1. 외부 침입 단계<br>2. 주변 서식 단계<br>3. 대량 서식 단계</td><td>1. 출입문·방충망 확인 및 닫힘 유지<br>2. 외부 쓰레기통 확인 및 뚜껑 밀폐<br>3. 방제회사 문의 및 포충기 설치 검토</td></tr><tr><td>집모기</td><td>1. 가끔 1~2마리 보임(3마리 내)<br>2. 화장실 벽면에 붙어 있음(5마리 내외)<br>3. 매일 보이거나 겨울에도 보임(10마리 내외)</td><td>1. 외부 침입 단계<br>2. 주변 서식 단계<br>3. 대량 서식 단계</td><td>1. 출입문·방충망 확인 및 닫힘 유지<br>2. 주변 물고임 장소 확인 및 제거<br>3. 정화조·지하 물고임 점검, 방제회사 문의 및 포충기 설치 검토</td></tr><tr><td>독일바퀴</td><td>1. 아주 가끔 보임(1마리 내)<br>2. 구석진 곳 물건을 치우면 보임(3마리 내외)<br>3. 출근하여 전등을 켜면 보임(5마리 내외)</td><td>1. 침입 단계<br>2. 서식 단계<br>3. 확산 단계</td><td>1. 구석진 곳 방치된 물건·박스 정리 및 청소<br>2. 서식처 확산을 막기 위해 방제회사 문의<br>3. 집중 방제를 위해 방제회사 문의</td></tr><tr><td>쥐</td><td>1. 쥐 변(배설물)을 확인할 수 있음<br>2. 쥐 소리와 쥐를 볼 수 있음<br>3. 소리, 쥐 변, 움직이는 쥐가 보임(2마리 이상)</td><td>1. 침입 단계<br>2. 서식 단계<br>3. 확산 단계</td><td>1. 쥐 구멍·침입 틈새 확인 및 철수세미 등으로 차단<br>2. 방제회사에 문의하여 포획·방서 계획 수립<br>3. 방제회사에 문의하여 외곽·실내 통합 방서 진행</td></tr><tr><td>개미·저곡해충</td><td>1. 간헐적으로 1~5마리 미만 목격<br>2. 줄지어 이동하거나 식자재 주변 10마리 내외<br>3. 여러 구역 동시 출현 및 식품·포장재 침투</td><td>1. 탐색·초기 유입 단계<br>2. 이동경로·국소 번식 단계<br>3. 군집 확산·품목 감염 단계</td><td>1. 스프레이 분사 자제(군집 분산 방지) 및 먹이원 밀폐<br>2. 감염 의심 곡물·사료 즉시 밀봉 폐기<br>3. 여왕개미 연쇄 살충 독먹이 및 페로몬 트랩 방제 문의</td></tr><tr><td>먼지다듬이·지네</td><td>1. 특정 위치에서 1~3마리 미만 발견<br>2. 같은 방·창틀·화장실에서 매주 반복 목격<br>3. 여러 공간에서 매일 다수 목격</td><td>1. 국소 발생·외부 유입 단계<br>2. 습기 구역 정착·서식 단계<br>3. 공간 전체 확산 단계</td><td>1. 실내 습도 45~50% 이하 제습 및 결로·곰팡이 제거<br>2. 외벽 화단·낙엽 정리 및 창틀 물구멍·틈새 차단<br>3. 해충 동정(종 판별) 및 미세 틈새·외곽 방제 문의</td></tr></tbody></table></div></div></section>${cta()}` });

add({ file: 'contact.html', label: '상담신청', title: '해충방제 무료 상담 | 1688-4587 | 에코플랜', description: '에코플랜 해충방제·방역소독 상담. 전화 1688-4587, 카카오톡, 이메일 eco@ecoplan.co.kr로 공간 유형과 발생 상황을 알려주세요.', type: 'ContactPage', body: `${pageHero('상담신청','공간의 고민, 에코플랜에 들려주세요.','해충 사진과 발견 위치, 공간의 종류를 알려주시면 상담에 도움이 됩니다. 방문 가능 지역과 일정, 작업 범위와 비용은 상담 후 확인합니다.','CONTACT ECOPLAN')}<section class="section"><div class="container contact-grid"><div><span class="eyebrow"><span class="dot"></span>SPACE CARE CENTER</span><h2>편한 방법으로<br>상담을 시작하세요.</h2><a href="tel:16884587" class="contact-number">1688-4587</a><div class="contact-detail"><p>현장 지역·시설 종류·면적을 준비해주세요.<br>방문과 작업 일정은 현장 조건에 따라 협의합니다.</p></div><div class="actions">${link(c.kakao,`${icon('chat')}카카오톡 상담 ↗`,'btn light')}${link('mailto:'+c.email,'이메일 문의 ↗','btn light')}</div><p class="source-line">${c.email}<br>${c.address}</p><div class="answer-box"><strong>상담 준비 체크</strong><p>① 현장 위치와 면적<br>② 해충 사진·발견 시간·위치<br>③ 기존 방제 이력<br>④ 영업시간과 이용자 특성</p></div></div><div class="form-panel"><h3>문의 내용을 미리 정리해보세요.</h3><p>입력 내용으로 문의 문안을 만듭니다. 복사 후 카카오톡으로 보내거나 이메일 앱에서 전송해주세요.</p><form id="consult-form"><div class="form-grid"><div class="field"><label for="consult-space">공간 유형</label><select id="consult-space" name="space"><option>가정·공동주택</option><option>음식점·카페</option><option>식품·제조시설</option><option>빌딩·공공기관</option><option>병원·호텔</option><option>상업·유통시설</option><option>기타</option></select></div><div class="field"><label for="consult-region">현장 지역 <span aria-hidden="true">*</span></label><input id="consult-region" name="region" placeholder="예: 서울 강서구" required maxlength="80" autocomplete="address-level2"></div><div class="field full"><label for="consult-service">관심 서비스</label><select id="consult-service" name="service"><option>해충방제</option><option>방역소독</option><option>정기 위생관리</option><option>포충기 구매·설치</option><option>기존 관리 현황 문의</option><option>이물·클레임 상담</option></select></div><div class="field full"><label for="consult-message">발견한 상황 또는 문의 내용</label><textarea id="consult-message" name="message" maxlength="1500" placeholder="어디에서, 언제부터, 어떤 해충이 보이는지 알려주세요."></textarea></div></div><p style="margin-top:16px">입력 내용은 이 페이지에서 서버에 저장·전송하지 않습니다. 연락처 등 개인정보는 실제 상담 채널에서 필요한 범위로 전달해주세요.</p><button class="btn" type="submit">문의 문안 만들기 ${icon('arrow')}</button></form><div id="consult-result" class="result-box" tabindex="-1" role="region" aria-label="작성한 문의 내용" hidden><h3>문의 문안이 준비되었습니다.</h3><p>아직 상담이 접수되지 않았습니다. 아래 내용을 복사해 카카오톡에 전송하거나 이메일 앱에서 보내기를 완료해주세요.</p><pre class="email-preview"></pre><div class="actions"><button class="btn small" type="button" id="copy-inquiry">문의 내용 복사</button>${link(c.kakao,'카카오톡 열기 ↗','btn small light')}<a data-email class="btn small light" href="mailto:eco@ecoplan.co.kr">이메일 앱 열기 ↗</a></div><p id="copy-status" role="status"></p></div><noscript><p class="note">문의 문안 작성 기능에는 JavaScript가 필요합니다. 전화·카카오톡·이메일로 직접 상담할 수 있습니다.</p></noscript></div></div></section>` });

add({ file: 'privacy.html', label: '개인정보 안내', title: '웹사이트 개인정보 안내 | 에코플랜', description: '에코플랜 홈페이지의 자가점검 및 문의 문안 작성 기능, 외부 상담 채널과 개인정보 관련 문의처를 안내합니다.', noindex: true, body: `${pageHero('개인정보 안내','웹사이트 개인정보 안내','이 안내는 현재 제작된 홈페이지 기능에서 처리하는 정보와 외부 상담 채널 연결 방식에 관한 설명입니다.','PRIVACY INFORMATION')}<section class="section"><div class="container article"><section><h2>1. 자가점검과 문의 문안 작성</h2><p>자가점검 선택값과 문의 문안 입력 내용은 브라우저 화면에서 결과를 생성하는 데 사용합니다. 이 사이트의 해당 기능은 입력 내용을 서버로 전송하거나 로컬 저장소에 보관하지 않습니다. 문의 내용 복사 버튼을 누르면 기기의 클립보드에 문안이 복사됩니다.</p></section><section><h2>2. 전화·카카오톡·이메일 연결</h2><p>이용자가 상담 채널을 열고 직접 전송하는 내용은 해당 채널을 통해 전달됩니다. 카카오톡 등 외부 서비스의 정보 처리는 해당 서비스의 정책을 따릅니다. 이메일 앱 열기만으로 이메일이 발송되는 것은 아니며, 이용자가 전송을 완료해야 합니다.</p></section><section><h2>3. 접속 정보와 외부 리소스</h2><p>사이트의 배포 호스팅 및 외부 글꼴 제공 서비스(Google Fonts)는 서비스 제공 과정에서 IP 주소·요청 정보 등 접속 정보를 처리할 수 있습니다. 현재 파일에는 별도 광고·방문 분석 스크립트가 포함되어 있지 않습니다. 실제 운영 환경에 접속 분석 또는 상담 저장 기능을 추가하는 경우 운영자는 처리 항목·목적·보유기간·수탁자 등을 실제 설정에 맞게 안내해야 합니다.</p></section><section><h2>4. 문의</h2><p>${c.legalName}<br>전화 ${link('tel:16884587',c.phone)}<br>이메일 ${link('mailto:'+c.email,c.email)}</p><p>기능 안내 작성일: 2026년 10월 28일</p></section></div></section>` });

await mkdir('assets', { recursive: true });
await copyFile('src/styles.css', 'assets/styles.css');
await copyFile('src/app.js', 'assets/app.js');
await writeFile('assets/favicon.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#003da5"/><circle cx="32" cy="32" r="18" fill="none" stroke="#00d4b2" stroke-width="3"/><circle cx="32" cy="32" r="5" fill="#00d4b2"/></svg>');
for (const page of pages) await writeFile(page.file, shell(page));
const indexed = pages.filter(p => !p.noindex);
await writeFile('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexed.map(p=>`  <url><loc>${c.url}${p.file==='index.html'?'/':'/'+p.file}</loc></url>`).join('\n')}\n</urlset>\n`);
await writeFile('robots.txt', `User-agent: *\nAllow: /\nDisallow: /src/\nDisallow: /scripts/\nDisallow: /docs/\nDisallow: /node_modules/\nDisallow: /test-results/\n\nSitemap: ${c.url}/sitemap.xml\n`);
await writeFile('llms.txt', `# 에코플랜 (EcoPlan)\n\n> ${c.legalName}의 해충방제·방역소독 공간케어 서비스 안내.\n\n## 기업 정보\n- 대표: ${c.representative}\n- 상담: ${c.phone}\n- 이메일: ${c.email}\n- 주소: ${c.address}\n- 서비스 지역과 일정, 가격은 상담 시 확인합니다.\n\n## 주요 페이지\n${indexed.map(p=>`- [${p.label}](${c.url}${p.file==='index.html'?'/':'/'+p.file}): ${p.description}`).join('\n')}\n\n## 정보 해석\n- 사이트의 본문과 각 페이지의 설명을 기준으로 확인합니다.\n- HACCP·GMP 시설 관리 상담은 인증 취득 보장을 의미하지 않습니다.\n- 자가점검은 관찰 정보 기반 안내이며 현장 진단을 대신하지 않습니다.\n- 관리현황 페이지는 관리 항목 설명이며 실제 고객 실적 데이터가 아닙니다.\n- 제품 가격·재고·보증 조건은 상담 확인 사항입니다.\n\n이 파일은 보조적인 사이트 안내이며 검색엔진 또는 AI의 사용과 노출을 보장하지 않습니다.\n`);
await writeFile('404.html', shell({ file:'404.html', label:'페이지를 찾을 수 없습니다', title:'페이지를 찾을 수 없습니다 | 에코플랜', description:'요청한 페이지가 없습니다. 에코플랜 홈 또는 서비스 안내를 확인해주세요.', noindex:true, body:`${pageHero('페이지 없음','페이지를 찾을 수 없습니다.','주소를 확인하거나 아래에서 필요한 서비스를 찾아주세요.','404 · PAGE NOT FOUND')}<section class="section"><div class="container actions">${btn('index.html','홈으로 이동')}${btn('services.html','서비스 둘러보기','light')}</div></section>` }));
const adminHtml = buildAdminHtml({ partners, shopProducts, company: c });
await writeFile('manager.html', adminHtml);
await writeFile('admin.html', adminHtml);
console.log(`Built ${pages.length} content pages + 404 + manager.html/admin.html; ${indexed.length} sitemap URLs; static JSON-LD, robots.txt and llms.txt ready.`);