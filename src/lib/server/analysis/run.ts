import type { DocumentRecord } from '$lib/types/document';
import { saveRecord, saveAnalysis, getDocument } from '$lib/server/storage/local';
import { generateAnalysis } from './index';

/**
 * Analizi ARKA PLANDA çalıştırır.
 *
 * Neden gerekli? Gerçek AI analizi 60-120 saniye sürüyor. Kullanıcının
 * yükleme isteğini bu kadar bekletmek olmaz:
 *   - kullanıcı boş ekrana bakar
 *   - tarayıcı veya sunucu isteği zaman aşımına uğratabilir
 *
 * Bunun yerine: yükleme isteği analizi BAŞLATIR ve hemen cevap döner.
 * Analiz arkada devam eder, bitince kaydı günceller. Ekran bu arada
 * "analiz ediliyor" gösterir ve düzenli olarak kontrol eder.
 *
 * ⚠️ SINIRI: Bu yöntem tek bir sunucu süreci çalıştığı sürece geçerli.
 * Vercel gibi "sunucusuz" (serverless) ortamlarda istek bitince süreç
 * kapanabilir ve arka plan işi yarıda kalır. Yayına çıkarken bunu
 * gerçek bir iş kuyruğuna (queue) taşımak gerekecek.
 */
export function startAnalysis(record: DocumentRecord, pdfBytes: Uint8Array): void {
	// await YOK — bilerek. Fonksiyon başlar, biz beklemeden devam ederiz.
	runAnalysis(record.id, pdfBytes).catch((err) => {
		// Arka plan işlerinde hata yakalamak ZORUNLU.
		// Yakalanmayan hata tüm sunucuyu çökertebilir.
		console.error(`[analiz] beklenmeyen hata (${record.id}):`, err);
	});
}

async function runAnalysis(id: string, pdfBytes: Uint8Array): Promise<void> {
	// Kaydı diskten tazeleyerek okuyoruz — arada değişmiş olabilir
	const record = await getDocument(id);
	if (!record) return;

	try {
		const analysis = await generateAnalysis(record, pdfBytes);
		await saveAnalysis(id, analysis);
		record.status = 'ready';
		record.errorMessage = null;
	} catch (err) {
		record.status = 'failed';
		record.errorMessage = toUserMessage(err);
		console.error(`[analiz] başarısız (${id}):`, err);
	}

	await saveRecord(record);
}

/**
 * Teknik hata mesajlarını kullanıcının anlayacağı dile çevirir.
 *
 * Neden? "429 rate_limit_error" kullanıcıya hiçbir şey ifade etmez.
 * "Çok fazla istek gönderildi, biraz bekleyip tekrar dene" eder.
 */
function toUserMessage(err: unknown): string {
	const raw = err instanceof Error ? err.message : String(err);

	if (raw.includes('401') || raw.includes('authentication')) {
		return 'API anahtarı geçersiz. .env dosyasındaki ANTHROPIC_API_KEY değerini kontrol et.';
	}
	if (raw.includes('429') || raw.includes('rate_limit')) {
		return 'Çok fazla istek gönderildi. Birkaç dakika bekleyip tekrar dene.';
	}
	if (raw.includes('529') || raw.includes('overloaded')) {
		return 'AI servisi şu an yoğun. Birkaç dakika sonra tekrar dene.';
	}
	if (raw.includes('credit') || raw.includes('billing')) {
		return 'API hesabında kredi kalmamış olabilir. Anthropic konsolunu kontrol et.';
	}
	if (raw.toLowerCase().includes('fetch') || raw.includes('ENOTFOUND')) {
		return 'AI servisine bağlanılamadı. İnternet bağlantını kontrol et.';
	}
	return raw;
}
