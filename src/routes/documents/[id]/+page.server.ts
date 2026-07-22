import { error, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	getDocument,
	getAnalysis,
	getMessages,
	readPdfBytes,
	saveRecord
} from '$lib/server/storage/local';
import { isUsingMock } from '$lib/server/analysis';
import { startAnalysis } from '$lib/server/analysis/run';

/**
 * Sayfa açılmadan önce sunucuda çalışır ve ekranın ihtiyaç duyduğu
 * her şeyi hazırlar.
 *
 * params.id -> adresteki [id] kısmının gerçek değeri
 *              (/documents/abc-123  =>  params.id === "abc-123")
 */
export const load: PageServerLoad = async ({ params }) => {
	const doc = await getDocument(params.id);

	// error(404, ...) -> SvelteKit otomatik olarak hata sayfası gösterir
	if (!doc) error(404, 'Doküman bulunamadı');

	return {
		doc,
		analysis: await getAnalysis(params.id),
		messages: await getMessages(params.id),
		usingMock: isUsingMock()
	};
};

export const actions: Actions = {
	/**
	 * Analizi yeniden çalıştırır.
	 *
	 * Neden gerekli? Gerçek API geçici olarak hata verebilir (yoğunluk,
	 * ağ kopması, istek limiti). Kullanıcı PDF'i baştan yüklemek zorunda
	 * kalmamalı — dosya zaten diskte duruyor.
	 */
	retry: async ({ params }) => {
		const doc = await getDocument(params.id);
		if (!doc) return fail(404, { error: 'Doküman bulunamadı' });

		const pdfBytes = await readPdfBytes(params.id);
		if (!pdfBytes) return fail(404, { error: 'PDF dosyası bulunamadı' });

		// Durumu "analiz ediliyor"a çevir ki ekran bekleme moduna geçsin
		doc.status = 'analyzing';
		doc.errorMessage = null;
		await saveRecord(doc);

		startAnalysis(doc, pdfBytes);

		return { started: true };
	}
};
