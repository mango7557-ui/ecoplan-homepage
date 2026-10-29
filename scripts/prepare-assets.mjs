import { mkdir, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

await mkdir('assets', { recursive: true });
const local = 'C:/Users/cline/Desktop/에코플렌/';

async function fetchBuffer(url, fallbackLocal = 'mOGxtRG5.png') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return local + fallbackLocal;
  }
}

// 1. Local EcoPlan authentic assets with crisp optimization
const localAssets = [
  ['egHmVdV.png', 'trap.webp', 1000],
  ['mOGxtRG5.png', 'company.webp', 1200],
  ['47nkn3zF.png', 'technology.webp', 1200],
  ['YGo1DGbt.png', 'franchise.webp', 1200],
  ['nH3FCu8c.png', 'factory-banner.webp', 1200]
];
for (const [src, out, width] of localAssets) {
  await sharp(local + src)
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 86 })
    .toFile(`assets/${out}`);
}

// 2. Logo
const logoBuf = await fetchBuffer('https://www.genspark.ai/api/files/s/FXIFr2fR');
await sharp(logoBuf).resize({ width: 380, withoutEnlargement: true }).webp({ quality: 90 }).toFile('assets/logo.webp');

const xmlEsc = s => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Helper: build photo card with custom EcoPlan Science HUD / gradient overlay
async function buildDesignedPhoto({ url, localFile, out, width = 960, height = 640, badge, title, subtitle, accent = '#00d4b2', hudType = 'target' }) {
  const baseInput = localFile ? local + localFile : await fetchBuffer(url);
  const hudGraphics = {
    target: `
      <g stroke="${accent}" stroke-opacity="0.45" fill="none">
        <circle cx="${width - 130}" cy="130" r="68" stroke-width="1.5" stroke-dasharray="6 6"/>
        <circle cx="${width - 130}" cy="130" r="38" stroke-width="1.5"/>
        <circle cx="${width - 130}" cy="130" r="6" fill="${accent}" fill-opacity="0.85"/>
        <line x1="${width - 215}" y1="130" x2="${width - 45}" y2="130" stroke-width="1"/>
        <line x1="${width - 130}" y1="45" x2="${width - 130}" y2="215" stroke-width="1"/>
      </g>`,
    shield: `
      <g stroke="${accent}" stroke-opacity="0.45" fill="none">
        <path d="M${width - 130} 58 L${width - 72} 82 V132 C${width - 72} 174 ${width - 130} 200 ${width - 130} 200 C${width - 130} 200 ${width - 188} 174 ${width - 188} 132 V82 Z" stroke-width="2"/>
        <path d="M${width - 148} 128 L${width - 134} 144 L${width - 108} 114" stroke-width="3"/>
      </g>`,
    wave: `
      <g stroke="${accent}" stroke-opacity="0.45" fill="none">
        <path d="M${width - 240} 110 Q${width - 190} 65 ${width - 140} 110 T${width - 40} 110" stroke-width="2"/>
        <path d="M${width - 240} 138 Q${width - 190} 93 ${width - 140} 138 T${width - 40} 138" stroke-width="1.5" stroke-dasharray="5 5"/>
        <path d="M${width - 240} 166 Q${width - 190} 121 ${width - 140} 166 T${width - 40} 166" stroke-width="1"/>
      </g>`,
    grid: `
      <g stroke="${accent}" stroke-opacity="0.32" fill="none" stroke-width="1">
        <rect x="${width - 210}" y="64" width="140" height="140" rx="14"/>
        <line x1="${width - 163}" y1="64" x2="${width - 163}" y2="204"/>
        <line x1="${width - 117}" y1="64" x2="${width - 117}" y2="204"/>
        <line x1="${width - 210}" y1="110" x2="${width - 70}" y2="110"/>
        <line x1="${width - 210}" y1="157" x2="${width - 70}" y2="157"/>
      </g>`
  };

  const overlaySvg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="darkGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#051329" stop-opacity="0.18"/>
        <stop offset="50%" stop-color="#051329" stop-opacity="0.32"/>
        <stop offset="100%" stop-color="#041022" stop-opacity="0.88"/>
      </linearGradient>
      <linearGradient id="sideTint" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stop-color="#061a38" stop-opacity="0.58"/>
        <stop offset="65%" stop-color="#061a38" stop-opacity="0.08"/>
        <stop offset="100%" stop-color="#003da5" stop-opacity="0.22"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#darkGrad)"/>
    <rect width="${width}" height="${height}" fill="url(#sideTint)"/>
    ${hudGraphics[hudType] || hudGraphics.target}
    <rect x="32" y="28" width="${Math.max(160, badge.length * 10 + 44)}" height="34" rx="17" fill="#071d3b" fill-opacity="0.82" stroke="${accent}" stroke-opacity="0.7"/>
    <circle cx="50" cy="45" r="4.5" fill="${accent}"/>
    <text x="64" y="50" fill="#ffffff" font-family="Arial, Malgun Gothic, sans-serif" font-size="13" font-weight="700" letter-spacing="1.2">${xmlEsc(badge)}</text>
    ${title ? `<text x="34" y="${height - 62}" fill="#ffffff" font-family="Malgun Gothic, Arial, sans-serif" font-size="28" font-weight="700">${xmlEsc(title)}</text>` : ''}
    ${subtitle ? `<text x="34" y="${height - 30}" fill="#b7d4ec" font-family="Malgun Gothic, Arial, sans-serif" font-size="16" font-weight="500">${xmlEsc(subtitle)}</text>` : ''}
  </svg>`;

  await sharp(baseInput)
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .modulate({ brightness: 1.02, saturation: 1.08 })
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .webp({ quality: 86 })
    .toFile(`assets/${out}`);
}

// 3. Build Crystal-Clear Hero Visuals (No dark tint or overlapping SVG text so the background photo is 100% clear)
await sharp(local + '47nkn3zF.png')
  .resize(1440, 860, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 1.06, saturation: 1.08 })
  .webp({ quality: 90 })
  .toFile('assets/hero-space.webp');

await sharp('assets/hero-space.webp').toFile('assets/space.webp');

await sharp(local + 'mOGxtRG5.png')
  .resize(1440, 860, { fit: 'cover', position: 'top' })
  .modulate({ brightness: 1.04, saturation: 1.05 })
  .webp({ quality: 90 })
  .toFile('assets/hero-lab.webp');

await sharp(local + 'nH3FCu8c.png')
  .resize(1440, 860, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 1.06, saturation: 1.06 })
  .webp({ quality: 90 })
  .toFile('assets/hero-industrial.webp');

// 4. Build 6 Solution Visual Cards (Photo-designed cards with HUD overlays)
const solutionCards = [
  {
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-cockroach.webp',
    badge: 'COCKROACH CARE',
    title: '바퀴벌레 정밀 방제',
    subtitle: '서식처 3W 추적 · 독먹이 기피 로테이션',
    accent: '#00d4b2',
    hudType: 'target'
  },
  {
    url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-rodent.webp',
    badge: 'RODENT DEFENSE',
    title: '쥐 침입차단 · 방서 솔루션',
    subtitle: '외곽 디펜스라인 · 실내 이동경로 통제',
    accent: '#38bdf8',
    hudType: 'shield'
  },
  {
    url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-flying.webp',
    badge: 'FLYING INSECT CARE',
    title: '파리·초파리·나방파리 솔루션',
    subtitle: '배수·유기물 발생원 제거 · 포충기 파장 설계',
    accent: '#00d4b2',
    hudType: 'wave'
  },
  {
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-mosquito.webp',
    badge: 'MOSQUITO DUAL CARE',
    title: '모기 유충·성충 통합 방제',
    subtitle: '정화조·물고임 유충구제 · 열/CO2 유인 차단',
    accent: '#38bdf8',
    hudType: 'target'
  },
  {
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-disinfect.webp',
    badge: 'VIRUS & STERILIZATION',
    title: '바이러스 · 살균소독 케어',
    subtitle: '환경부 허가 3계열 살균제 · 공간별 정밀 소독',
    accent: '#00d4b2',
    hudType: 'shield'
  },
  {
    url: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1000&q=82',
    out: 'sol-analysis.webp',
    badge: 'CLAIM & ALIEN ANALYSIS',
    title: '이물확인 · 효소/유전자 분석',
    subtitle: '카탈라제 효소실험 · 3자 기관 유전자/이물 보고서',
    accent: '#38bdf8',
    hudType: 'grid'
  }
];

for (const item of solutionCards) {
  await buildDesignedPhoto({ ...item, width: 900, height: 600 });
}

// 5. Build 6 Place / Industry Photo Cards
const placeCards = [
  {
    url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=960&q=82',
    out: 'place-restaurant.webp',
    badge: 'RESTAURANT & FRANCHISE',
    title: '외식업장 · 카페 · 프랜차이즈',
    subtitle: '주방·배수구·식자재 창고 맞춤 위생관리',
    accent: '#00d4b2',
    hudType: 'target'
  },
  {
    localFile: 'nH3FCu8c.png',
    out: 'place-factory.webp',
    badge: 'HACCP · GMP · GSP FACTORY',
    title: '식품제조 · 공장 · 클린룸',
    subtitle: '국제 규격 대응 모니터링 및 이물관리 프로세스',
    accent: '#38bdf8',
    hudType: 'grid'
  },
  {
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=960&q=82',
    out: 'place-building.webp',
    badge: 'BUILDING & PUBLIC',
    title: '오피스 빌딩 · 공공기관',
    subtitle: '공용부·지하 기계실·정화조·외곽 통합 방제',
    accent: '#00d4b2',
    hudType: 'shield'
  },
  {
    url: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=960&q=82',
    out: 'place-hospital.webp',
    badge: 'MEDICAL & HOTEL',
    title: '병원 · 의료시설 · 호텔',
    subtitle: '민감 이용자 배려 약제 선정 · 객실/진료실 케어',
    accent: '#38bdf8',
    hudType: 'wave'
  },
  {
    url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=960&q=82',
    out: 'place-home.webp',
    badge: 'HOME & RESIDENCE',
    title: '가정집 · 아파트 · 공동주택',
    subtitle: '아이·반려동물 고려 안전 관리 · 침입경로 차단',
    accent: '#00d4b2',
    hudType: 'shield'
  },
  {
    url: 'https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=960&q=82',
    out: 'place-retail.webp',
    badge: 'RETAIL & LOGISTICS',
    title: '상업 · 유통 · 물류창고',
    subtitle: '하역장·포장 박스 유입 차단 · 120개 장소 유형 관리',
    accent: '#38bdf8',
    hudType: 'grid'
  }
];

for (const item of placeCards) {
  await buildDesignedPhoto({ ...item, width: 880, height: 580 });
}

// 6. KakaoTalk & OpenGraph Social Thumbnail (Using the user-provided EcoPlan image mOGxtRG5.png without cropping)
await sharp(local + 'mOGxtRG5.png')
  .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
  .jpeg({ quality: 92, mozjpeg: true })
  .toFile('assets/og-kakao.jpg');

await sharp(local + 'mOGxtRG5.png')
  .resize(1200, 900, { fit: 'inside', withoutEnlargement: true })
  .png({ compressionLevel: 8 })
  .toFile('assets/og.png');

// 7. Fetch Partners from https://www.ecoplan.co.kr/tables/partners?limit=100
const partnersRes = await fetch('https://www.ecoplan.co.kr/tables/partners?limit=100');
const partnersJson = await partnersRes.json();
const rawPartners = (partnersJson.data || []).sort((a, b) => {
  const ta = new Date(a.created_at || 0).getTime();
  const tb = new Date(b.created_at || 0).getTime();
  return ta - tb;
});

const savedPartners = [];
for (let i = 0; i < rawPartners.length; i++) {
  const p = rawPartners[i];
  const fileName = `partner-${i + 1}.webp`;
  const imgStr = p.image_url || '';
  if (imgStr.startsWith('data:image/')) {
    const base64Data = imgStr.split(',')[1];
    const buf = Buffer.from(base64Data, 'base64');
    await sharp(buf)
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(`assets/${fileName}`);
  } else if (imgStr.startsWith('http')) {
    const buf = await fetchBuffer(imgStr);
    await sharp(buf)
      .resize({ width: 720, withoutEnlargement: true })
      .webp({ quality: 88 })
      .toFile(`assets/${fileName}`);
  }
  savedPartners.push({
    index: i + 1,
    name: p.name || '',
    description: p.description || '',
    homepage_url: p.homepage_url || '',
    image: `assets/${fileName}`
  });
}
await writeFile('src/partners.json', JSON.stringify(savedPartners, null, 2), 'utf8');

console.log(`Photo assets designed and generated: 22 base visuals + ${savedPartners.length} partner images ready!`);
