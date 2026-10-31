import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const port = 4198;
const base = `http://127.0.0.1:${port}`;

const server = spawn('node', ['scripts/serve.mjs'], {
  env: { ...process.env, PORT: String(port) },
  stdio: ['ignore', 'pipe', 'pipe']
});

await new Promise((resolve, reject) => {
  const timer = setTimeout(() => reject(new Error('Preview server start timeout')), 8000);
  server.stdout.on('data', chunk => {
    if (String(chunk).includes('EcoPlan preview ready')) {
      clearTimeout(timer);
      resolve();
    }
  });
  server.on('error', err => {
    clearTimeout(timer);
    reject(err);
  });
});

let browser;
try {
  browser = await chromium.launch({ headless: true });

  // 1. Desktop Verification
  const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await desktopContext.newPage();
  const runtimeErrors = [];
  page.on('pageerror', err => runtimeErrors.push(err.message));

  for (const path of ['/', '/services.html', '/cockroach.html', '/flying-insects.html', '/industries.html', '/shop.html', '/faq.html']) {
    const res = await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    if (res?.status() !== 200) throw new Error(`Expected 200 on ${path}, got ${res?.status()}`);
    const h1Visible = await page.locator('h1').first().isVisible();
    if (!h1Visible) throw new Error(`H1 not visible on ${path}`);
  }

  // Verify 404 status code and X-Robots-Tag header
  const res404 = await page.goto(base + '/not-a-real-page.html', { waitUntil: 'domcontentloaded' });
  if (res404?.status() !== 404) throw new Error(`Expected 404 status code, got ${res404?.status()}`);
  if (!res404?.headers()['x-robots-tag']?.includes('noindex')) {
    throw new Error('Missing X-Robots-Tag: noindex on 404 response');
  }

  // 2. Conversion Flow Verification: diagnosis.html -> contact.html
  await page.goto(base + '/diagnosis.html', { waitUntil: 'domcontentloaded' });
  await page.locator('#diagnosis-form button[type="submit"]').click();
  const diagResultVisible = await page.locator('#diagnosis-result').isVisible();
  if (!diagResultVisible) throw new Error('Diagnosis result box did not appear after submit');

  const consultHref = await page.locator('[data-consult-link]').getAttribute('href');
  if (!consultHref || !consultHref.startsWith('contact.html?')) {
    throw new Error(`Invalid consult link generated: ${consultHref}`);
  }

  await page.goto(base + '/' + consultHref, { waitUntil: 'domcontentloaded' });
  const prefilledMsg = await page.locator('#consult-message').inputValue();
  if (!prefilledMsg.includes('[자가진단 요약]')) {
    throw new Error('Consultation message was not pre-filled from diagnosis summary');
  }

  await page.locator('#consult-region').fill('서울 강서구');
  await page.locator('#consult-form button[type="submit"]').click();

  const consultOutVisible = await page.locator('#consult-output').isVisible();
  if (!consultOutVisible) throw new Error('#consult-output did not become visible after submitting #consult-form');
  const mailHref = await page.locator('#mail-consult').getAttribute('href');
  if (!mailHref || !mailHref.includes('subject=') || !mailHref.includes('body=')) {
    throw new Error(`#mail-consult href was not updated: ${mailHref}`);
  }

  // 3. Mobile Viewport Verification (390x844)
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobileContext.newPage();
  mobilePage.on('pageerror', err => runtimeErrors.push(err.message));

  await mobilePage.goto(base + '/', { waitUntil: 'domcontentloaded' });
  const navLinksCount = await mobilePage.locator('#primary-nav a').count();
  const dockLinksCount = await mobilePage.locator('.mobile-dock a').count();
  const overflowX = await mobilePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (navLinksCount !== 7) throw new Error(`Expected 7 mobile nav links, got ${navLinksCount}`);
  if (dockLinksCount !== 5) throw new Error(`Expected 5 mobile dock links, got ${dockLinksCount}`);
  if (overflowX > 2) throw new Error(`Horizontal overflow detected on mobile home: ${overflowX}px`);

  if (runtimeErrors.length > 0) {
    throw new Error(`Browser runtime errors detected: ${runtimeErrors.join('; ')}`);
  }

  console.log('Browser verification passed: desktop & mobile viewports, 200/404 status codes, and diagnosis -> contact conversion flow verified with 0 runtime errors.');
} finally {
  if (browser) await browser.close();
  server.kill();
}
