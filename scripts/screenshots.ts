/**
 * README için ekran görüntüsü alır.
 *
 * Kullanım (dev sunucusu ayakta olmalı):
 *   npm run screenshots
 *
 * Playwright = tarayıcıyı program ile sürmeye yarayan araç.
 * Burada sadece ekran görüntüsü için kullanıyoruz; asıl işi
 * otomatik testtir (ileride test yazarken de aynı araç işe yarar).
 */

import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const BASE = process.env.BASE_URL ?? 'http://localhost:5177';
const OUT = 'docs/screenshots';

await mkdir(OUT, { recursive: true });

/*
 * channel: 'chrome' -> Playwright'ın indirdiği sade tarayıcı yerine
 * bilgisayarda kurulu GERÇEK Chrome'u kullan.
 *
 * Neden gerekli? Sade sürümde PDF okuyucu eklentisi YOK; iframe içindeki
 * PDF boş görünür. Gerçek Chrome'da yerleşik okuyucu çalışır.
 * Chrome kurulu değilse sade sürüme düşüyoruz (PDF alanı boş çıkar).
 */
let browser;
try {
	browser = await chromium.launch({ channel: 'chrome' });
	console.log('→ gerçek Chrome kullanılıyor (PDF görüntülenir)');
} catch {
	browser = await chromium.launch();
	console.log('! Chrome bulunamadı — PDF alanı boş çıkacak');
}

/** Belirtilen temada bir sayfanın görüntüsünü alır. */
async function shoot(name: string, path: string, dark: boolean, wide = false) {
	const context = await browser.newContext({
		viewport: { width: wide ? 1440 : 1100, height: 900 },
		// deviceScaleFactor: 2 -> retina kalitesinde, net görüntü
		deviceScaleFactor: 2,
		colorScheme: dark ? 'dark' : 'light'
	});
	const page = await context.newPage();

	// Tema tercihini önceden yaz ki sayfa doğru temayla açılsın
	await page.addInitScript((isDark: boolean) => {
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}, dark);

	await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' });
	// Animasyonların ve PDF görüntüleyicinin oturması için kısa bekleme
	await page.waitForTimeout(1500);

	const file = `${OUT}/${name}.png`;
	await page.screenshot({ path: file });
	console.log(`✓ ${file}`);

	await context.close();
}

// Ana sayfa — açık ve karanlık tema
await shoot('home-light', '/', false);
await shoot('home-dark', '/', true);

// Doküman ekranı — ilk dokümanı bul
const context = await browser.newContext();
const page = await context.newPage();
await page.goto(BASE, { waitUntil: 'networkidle' });
const href = await page.locator('a[href^="/documents/"]').first().getAttribute('href');
await context.close();

if (href) {
	await shoot('document-light', href, false, true);
	await shoot('document-dark', href, true, true);
} else {
	console.warn('! Doküman bulunamadı — önce bir PDF yükle');
}

await browser.close();
