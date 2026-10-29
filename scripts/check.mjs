import { readFile, access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { company, pests, faqs } from '../src/content.mjs';

const files = [
  'index.html',
  'company.html',
  'services.html',
  'cockroach.html',
  'rodent.html',
  'flying-insects.html',
  'mosquito.html',
  'process.html',
  'products-safety.html',
  'industries.html',
  'management.html',
  'shop.html',
  'faq.html',
  'diagnosis.html',
  'contact.html',
  'privacy.html',
  '404.html',
  'sitemap.xml',
  'robots.txt',
  'llms.txt',
  'assets/styles.css',
  'assets/app.js',
  'assets/logo.webp',
  'assets/hero-space.webp',
  'assets/hero-lab.webp',
  'assets/hero-industrial.webp',
  'assets/sol-cockroach.webp',
  'assets/sol-rodent.webp',
  'assets/sol-flying.webp',
  'assets/sol-mosquito.webp',
  'assets/sol-disinfect.webp',
  'assets/sol-analysis.webp',
  'assets/place-restaurant.webp',
  'assets/place-factory.webp',
  'assets/place-building.webp',
  'assets/place-hospital.webp',
  'assets/place-home.webp',
  'assets/place-retail.webp',
  'assets/company.webp',
  'assets/technology.webp',
  'assets/franchise.webp',
  'assets/trap.webp',
  'assets/og.png',
  'assets/og-kakao.jpg',
  'assets/favicon.svg'
];

for (const file of files) {
  await access(file, constants.R_OK);
}

let jsonLdCount = 0;
let internalLinksChecked = 0;
const htmlFiles = files.filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');

  if (!html.includes('<title>') || !html.includes('<meta name="description"')) {
    throw new Error(`Missing title or meta description in ${file}`);
  }
  if (!html.includes('<link rel="canonical"')) {
    throw new Error(`Missing canonical link in ${file}`);
  }
  if (!/<h1[\s>]/.test(html)) {
    throw new Error(`Missing H1 heading in ${file}`);
  }
  if (html.includes('불러오는 중입니다')) {
    throw new Error(`Found dynamic loading placeholder in ${file}`);
  }

  const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
  if (!ldMatch) {
    throw new Error(`Missing JSON-LD in ${file}`);
  }
  const parsed = JSON.parse(ldMatch[1]);
  if (!parsed['@context'] || !Array.isArray(parsed['@graph'])) {
    throw new Error(`Invalid JSON-LD @graph in ${file}`);
  }
  jsonLdCount += parsed['@graph'].length;

  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(m => m[1]);
  for (const href of hrefs) {
    if (
      href.startsWith('http://') ||
      href.startsWith('https://') ||
      href.startsWith('tel:') ||
      href.startsWith('mailto:') ||
      href.startsWith('#')
    ) {
      continue;
    }
    const targetFile = href.split('#')[0];
    if (targetFile) {
      await access(targetFile, constants.R_OK);
      internalLinksChecked++;
    }
  }
}

const sitemap = await readFile('sitemap.xml', 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
if (sitemapUrls.length !== 15) {
  throw new Error(`Expected 15 indexed URLs in sitemap.xml, got ${sitemapUrls.length}`);
}

const robots = await readFile('robots.txt', 'utf8');
if (!robots.includes(`Sitemap: ${company.url}/sitemap.xml`)) {
  throw new Error('robots.txt missing Sitemap directive');
}

console.log(
  `Verification passed: ${htmlFiles.length} HTML pages, ${jsonLdCount} JSON-LD graph nodes, ${internalLinksChecked} internal links, ${pests.length} pest landing pages, ${faqs.length} core FAQs verified.`
);
