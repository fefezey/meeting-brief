import { env } from '$env/dynamic/private';
import type { Analysis } from '$lib/types/analysis';
import type { DocumentRecord } from '$lib/types/document';
import { mockAnalysis } from './mock';
import { hasCredentials } from './credentials';

/**
 * Analiz üretiminin TEK giriş kapısı.
 *
 * Arayüz kodu her zaman bu fonksiyonu çağırır ve arkada mock mu gerçek
 * AI mı çalıştığını bilmez. Geçiş yapmak için tek yapılması gereken
 * .env dosyasına gerçek bir ANTHROPIC_API_KEY koymak.
 */

/** Şu an sahte veri mi kullanıyoruz? Arayüzde uyarı göstermek için. */
export function isUsingMock(): boolean {
	// Elle zorlama: kimlik bilgisi olsa bile örnek veri kullan
	if (env.USE_MOCK_AI === 'true') return true;
	// Elle zorlama: gerçek AI'ı dene (bağlantı hatası varsa görmek için)
	if (env.USE_MOCK_AI === 'false') return false;

	// Otomatik: kimlik bilgisi (API anahtarı VEYA OAuth profili) yoksa mock
	return !hasCredentials();
}

export async function generateAnalysis(
	doc: DocumentRecord,
	pdfBytes: Uint8Array
): Promise<Analysis> {
	if (isUsingMock()) {
		/*
		 * Yapay gecikme. Gerçek AI 60-120 saniye sürüyor; "analiz ediliyor"
		 * ekranının doğru çalıştığını test edebilmek için mock'u da
		 * yavaşlatabilmemiz gerekiyor.
		 *
		 * .env dosyasına MOCK_DELAY_MS=8000 yazarsan mock 8 saniye sürer.
		 * Number(...) || 800  ->  değer yoksa veya sayı değilse 800 kullan
		 */
		const delayMs = Number(env.MOCK_DELAY_MS) || 800;
		await new Promise((resolve) => setTimeout(resolve, delayMs));
		return mockAnalysis(doc);
	}

	/*
	 * DİNAMİK IMPORT (await import): dosyayı en tepede değil, tam
	 * burada yükler.
	 *
	 * Neden gerekli? client.ts, API anahtarı yoksa yüklenir yüklenmez
	 * hata fırlatıyor. Normal import kullansaydık mock modda bile o
	 * dosya çalışır ve uygulama açılmazdı.
	 */
	const { anthropic } = await import('../anthropic/client');
	const { analyzeDocument } = await import('../anthropic/analyze');

	// Buffer -> base64: PDF'i API'ye metin olarak taşımak için
	const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
	return await analyzeDocument(anthropic, pdfBase64);
}
