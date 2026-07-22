import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

/**
 * UÇTAN UCA TESTLER
 *
 * Birim testlerinden farkı: burada gerçek bir tarayıcı açılıyor,
 * gerçekten tıklanıyor, gerçek sunucuya istek gidiyor. Yani parçaların
 * birbirine doğru bağlandığını doğruluyoruz.
 *
 * Testler ÖRNEK VERİ modunda çalışır (playwright.config.ts). Gerçek
 * API'ye bağlansaydı: ücretli, yavaş ve model cevabı değiştiği gün
 * sebepsiz kırılan testler olurdu.
 */

const FIXTURE = fileURLToPath(new URL('./fixtures/ornek-rapor.pdf', import.meta.url));
const FIXTURE_BYTES = readFileSync(FIXTURE);

/**
 * TEST İZOLASYONU
 *
 * Her çalışmada benzersiz bir dosya adı üretiyoruz.
 *
 * Neden? Testler aynı depoyu paylaşıyor. Sabit bir ad kullansaydık,
 * yarıda kalan bir çalışmadan artan doküman bir sonraki testi bozardı —
 * nitekim bozdu: "ornek-rapor.pdf" hem yeni seçilen dosyada hem eski
 * kayıtta göründü ve seçici iki elemana denk geldiği için test patladı.
 *
 * Her test kendi verisiyle çalışmalı; başkasının bıraktığına
 * güvenmemeli, kendi bıraktığını da temizlemeli.
 */
function uniquePdfName() {
	return `test-${Date.now()}-${Math.round(Math.random() * 1e6)}.pdf`;
}

/**
 * Sayfayı açar ve JavaScript'in devreye girmesini (HİDRATLANMA) bekler.
 *
 * Neden gerekli? SvelteKit sayfayı önce sunucuda HTML olarak üretip
 * gönderir. O HTML'de form ve input vardır ama olay dinleyicileri
 * henüz bağlanmamıştır. Tarayıcı JS'i indirip çalıştırınca bağlanır.
 *
 * Playwright'ın varsayılanı ('load') bunu beklemez; test HTML gelir
 * gelmez dosyayı atar ve arayüz tepki vermez.
 *
 * ÖNCE 'networkidle' denedik, KARARSIZ çıktı: Vite geliştirme sunucusu
 * sürekli açık bir websocket tutuyor, "ağ boşaldı" anı öngörülemiyor.
 * Bunun yerine +layout.svelte hidratlanınca <html> etiketine
 * data-hydrated="true" koyuyor — kesin ve deterministik işaret.
 *
 * NOT: Bu bir ürün hatası değil. Gerçek kullanıcı o kadar hızlı
 * davranamaz; davransa bile form yine çalışırdı, çünkü <form> HTML'in
 * kendi özelliği ve JavaScript'e ihtiyaç duymaz.
 */
async function waitForHydration(page: import('@playwright/test').Page) {
	await page.waitForSelector('html[data-hydrated="true"]', { timeout: 30_000 });
}

async function openHome(page: import('@playwright/test').Page) {
	await page.goto('/');
	await waitForHydration(page);
}

test('ana sayfa açılıyor ve örnek veri modunu belirtiyor', async ({ page }) => {
	await openHome(page);

	// Hero başlığı (h1) — ürünün ilk mesajı
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Uzun belgeler');
	await expect(page.getByText('Örnek veri modu')).toBeVisible();
	await expect(page.getByText('Dosya seçmek için tıkla')).toBeVisible();
});

test('PDF olmayan dosya reddediliyor', async ({ page }) => {
	await openHome(page);

	// Sahte bir metin dosyası üret ve yüklemeye çalış
	await page.locator('input[type="file"]').setInputFiles({
		name: 'not-a-pdf.txt',
		mimeType: 'text/plain',
		buffer: Buffer.from('bu bir pdf değil')
	});

	await expect(page.getByText('Sadece PDF dosyası yükleyebilirsin.')).toBeVisible();
});

test('tam akış: yükle → analiz → sohbet → sil', async ({ page }) => {
	await openHome(page);

	/* --- 1. YÜKLE --- */
	const fileName = uniquePdfName();
	await page.locator('input[type="file"]').setInputFiles({
		name: fileName,
		mimeType: 'application/pdf',
		buffer: FIXTURE_BYTES
	});

	// Seçiciyi label'ın İÇİNE kısıtlıyoruz: aynı ad listede de
	// görünebilir, o zaman "hangisi?" belirsizliği doğar.
	await expect(page.locator('label').getByText(fileName)).toBeVisible();
	await page.getByRole('button', { name: 'Analiz et' }).click();

	// Yükleme bizi doküman sayfasına yönlendirmeli
	await expect(page).toHaveURL(/\/documents\/[a-f0-9-]+$/);
	const documentUrl = page.url();

	/* --- 2. ANALİZ ---
	   Sayfa önce "analiz ediliyor" gösterip sonra kendiliğinden
	   sonuçlara dönmeli. Burada asıl test edilen şey arka plan işi +
	   otomatik tazeleme mekanizması.                                  */
	/*
	   exact: true ŞART. Playwright'ın getByText'i varsayılan olarak
	   büyük/küçük harf ayırmadan "içinde geçiyor mu" diye bakar; tam
	   eşleşme istemezsek başlık, gövde metnindeki benzer kelimelere de
	   denk gelip "hangisini kastettin?" hatası verir.                 */
	await expect(page.getByText('Ana maddeler', { exact: true })).toBeVisible({
		timeout: 60_000
	});
	await expect(page.getByText('Kilit rakamlar', { exact: true })).toBeVisible();
	await expect(page.getByText('Riskli noktalar', { exact: true })).toBeVisible();
	await expect(page.getByText('Sorulabilecek sorular', { exact: true })).toBeVisible();

	/* --- 3. SOHBET --- */
	await page.getByRole('tab', { name: 'Sohbet' }).click();

	const question = 'Bu raporun en büyük riski ne?';
	await page.getByPlaceholder('Bir soru sor…').fill(question);
	await page.getByRole('button', { name: 'Gönder' }).click();

	// Sorumuz ekranda görünmeli
	await expect(page.getByText(question)).toBeVisible();
	// Cevap akarak gelmeli
	await expect(page.getByText(/ÖRNEK CEVAP/)).toBeVisible({ timeout: 30_000 });

	/* --- 4. GEÇMİŞ KALICI MI ---
	   Sayfayı yenileyince sohbet kaybolmamalı (sunucuya kaydedildi mi?) */
	await page.reload();
	await waitForHydration(page);
	await page.getByRole('tab', { name: 'Sohbet' }).click();
	await expect(page.getByText(question)).toBeVisible();

	/* --- 5. SİL ---
	   Silme onay kutusu açıyor; testte otomatik "evet" diyoruz.        */
	page.on('dialog', (dialog) => dialog.accept());

	await openHome(page);
	await page
		.getByRole('listitem')
		.filter({ hasText: fileName })
		.getByRole('button', { name: /sil/i })
		.click();

	await expect(page.getByText(fileName)).toBeHidden();

	// Silinen dokümanın sayfası artık 404 vermeli
	const response = await page.goto(documentUrl);
	expect(response?.status()).toBe(404);
});

test('karanlık mod tercihi sayfa yenilenince korunuyor', async ({ page }) => {
	await openHome(page);

	const html = page.locator('html');
	const wasDark = await html.evaluate((el) => el.classList.contains('dark'));

	await page.getByRole('button', { name: /tema/i }).click();
	await expect(html).toHaveClass(wasDark ? /^(?!.*dark).*$/ : /dark/);

	// Yenileme sonrası tercih hatırlanmalı (localStorage + app.html kodu)
	await page.reload();
	await waitForHydration(page);
	const stillFlipped = await html.evaluate((el) => el.classList.contains('dark'));
	expect(stillFlipped).toBe(!wasDark);
});
