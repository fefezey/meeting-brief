import { defineConfig } from '@playwright/test';

export default defineConfig({
	testDir: 'e2e',

	// CI'da test dosyaya "sadece bunu çalıştır" (test.only) kalmışsa
	// başarısız et — yanlışlıkla tek test çalıştırıp "hepsi geçti"
	// sanmayalım.
	forbidOnly: !!process.env.CI,

	// CI ortamları ara sıra yavaşlar; bir kez tekrar dene
	retries: process.env.CI ? 1 : 0,

	/*
	 * Test başına süre sınırı (varsayılan 30 sn — bize yetmiyor).
	 *
	 * Neden? Geliştirme sunucusu modülleri İLK istendiğinde derliyor.
	 * İlk PDF yüklemesinde "unpdf" (içinde koca bir pdf.js var) o an
	 * derleniyor ve bu tek başına 20+ saniye sürebiliyor. Uygulamanın
	 * kendisi yavaş değil; derleme bir kereye mahsus.
	 */
	timeout: 120_000,

	use: {
		baseURL: 'http://localhost:5178',
		// Test başarısız olursa son adımın ekran görüntüsünü ve
		// tarayıcı kaydını sakla — hatayı görmeden çözmek zordur
		screenshot: 'only-on-failure',
		trace: 'retain-on-failure'
	},

	/*
	 * Testten önce uygulamayı otomatik başlatır, bitince kapatır.
	 *
	 * USE_MOCK_AI=true: testler ASLA gerçek API'ye gitmemeli.
	 *   - ücretsiz olur
	 *   - hızlı olur
	 *   - her seferinde AYNI sonucu verir (belirlenimci)
	 * Gerçek AI'a bağlı test, model cevabı değiştiği gün sebepsiz kırılır.
	 *
	 * Ayrı port (5178): geliştirirken açık olan sunucuyla çakışmasın.
	 */
	webServer: {
		command: 'npm run dev -- --port 5178',
		port: 5178,
		reuseExistingServer: !process.env.CI,
		env: { USE_MOCK_AI: 'true', MOCK_DELAY_MS: '300' },
		timeout: 120_000
	}
});
