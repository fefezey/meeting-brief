import { env } from '$env/dynamic/private';
import type { Analysis } from '$lib/types/analysis';
import type { DocumentRecord } from '$lib/types/document';
import { mockAnalysis } from './mock';

/**
 * Analiz üretiminin TEK giriş kapısı.
 *
 * Arayüz kodu her zaman bu fonksiyonu çağırır ve arkada mock mu gerçek
 * AI mı çalıştığını bilmez. Geçiş yapmak için tek yapılması gereken
 * .env dosyasına gerçek bir ANTHROPIC_API_KEY koymak.
 */

/** Şu an sahte veri mi kullanıyoruz? Arayüzde uyarı göstermek için. */
export function isUsingMock(): boolean {
	// USE_MOCK_AI=true yazılmışsa anahtar olsa bile mock kullan
	if (env.USE_MOCK_AI === 'true') return true;
	// Anahtar yoksa mecburen mock
	return !env.ANTHROPIC_API_KEY;
}

export async function generateAnalysis(
	doc: DocumentRecord,
	pdfBytes: Uint8Array
): Promise<Analysis> {
	if (isUsingMock()) {
		// Gerçekçi hissettirmesi için küçük bir gecikme ekliyoruz —
		// "yükleniyor" durumlarının doğru çalıştığını böyle test ederiz.
		await new Promise((resolve) => setTimeout(resolve, 800));
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
