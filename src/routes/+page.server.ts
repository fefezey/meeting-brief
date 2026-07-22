import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { Actions, PageServerLoad } from './$types';
import { listDocuments, saveDocument, deleteDocument } from '$lib/server/storage/local';
import { extractPdfInfo, makePreview } from '$lib/server/pdf/extract';
import { isUsingMock } from '$lib/server/analysis';
import { startAnalysis } from '$lib/server/analysis/run';
import { MAX_PDF_BYTES, MAX_PDF_PAGES, type DocumentRecord } from '$lib/types/document';

/**
 * load: Sayfa açılmadan ÖNCE sunucuda çalışır.
 * Döndürdüğü nesne, +page.svelte içinde "data" olarak kullanılabilir.
 */
export const load: PageServerLoad = async () => {
	return {
		documents: await listDocuments(),
		usingMock: isUsingMock()
	};
};

/**
 * actions: Sayfadaki formlar gönderildiğinde çalışır.
 * "upload" adı, formdaki action="?/upload" ile eşleşir.
 */
export const actions: Actions = {
	upload: async ({ request }) => {
		// Formdan gelen verileri oku
		const formData = await request.formData();
		const file = formData.get('file');

		/* ---------- Doğrulama (validation) ----------
		   Kullanıcıdan gelen HİÇBİR veriye güvenilmez.
		   Her koşulu tek tek kontrol ediyoruz.                */

		if (!(file instanceof File) || file.size === 0) {
			return fail(400, { error: 'Lütfen bir PDF dosyası seç.' });
		}

		if (file.type !== 'application/pdf') {
			return fail(400, { error: 'Sadece PDF dosyası yükleyebilirsin.' });
		}

		if (file.size > MAX_PDF_BYTES) {
			const mb = (file.size / 1024 / 1024).toFixed(1);
			return fail(400, {
				error: `Dosya çok büyük: ${mb} MB. Sınır 32 MB.`
			});
		}

		// Dosyayı belleğe al.
		// arrayBuffer() ham baytları verir, Uint8Array ise onu
		// "bayt dizisi" olarak kullanmamızı sağlar.
		const pdfBytes = new Uint8Array(await file.arrayBuffer());

		/* ---------- PDF'i incele ---------- */

		let pdfInfo;
		try {
			pdfInfo = await extractPdfInfo(pdfBytes);
		} catch {
			return fail(400, {
				error: 'PDF okunamadı. Dosya bozuk veya şifreli olabilir.'
			});
		}

		if (pdfInfo.pageCount > MAX_PDF_PAGES) {
			return fail(400, {
				error: `Doküman ${pdfInfo.pageCount} sayfa. Sınır ${MAX_PDF_PAGES} sayfa.`
			});
		}

		/* ---------- Kaydet ---------- */

		const record: DocumentRecord = {
			id: randomUUID(), // benzersiz kimlik üretir
			title: file.name,
			sizeBytes: file.size,
			pageCount: pdfInfo.pageCount,
			hasExtractableText: pdfInfo.hasExtractableText,
			textPreview: makePreview(pdfInfo.text),
			status: 'analyzing',
			errorMessage: null,
			createdAt: new Date().toISOString()
		};

		await saveDocument(record, pdfBytes);

		/* ---------- Analizi BAŞLAT (beklemeden) ----------
		   startAnalysis await EDİLMİYOR: analiz arkada çalışır,
		   biz kullanıcıyı hemen doküman sayfasına yollarız.
		   Orada "analiz ediliyor" gösterilip sonuç beklenecek.       */

		startAnalysis(record, pdfBytes);

		// Kullanıcıyı doküman sayfasına gönder.
		// 303 = "işlem bitti, şu adrese git" (form gönderiminden sonraki
		// standart yönlendirme kodu; sayfa yenilenince form tekrar
		// gönderilmesin diye)
		redirect(303, `/documents/${record.id}`);
	},

	/** Dokümanı ve ona ait tüm verileri siler. */
	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id');

		if (typeof id !== 'string' || !id) {
			return fail(400, { error: 'Geçersiz doküman kimliği.' });
		}

		await deleteDocument(id);
		return { deleted: true };
	}
};
