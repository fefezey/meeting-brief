import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readPdfBytes, getDocument } from '$lib/server/storage/local';

/**
 * PDF'in ham baytlarını döndüren API ucu.
 *
 * +server.ts = sayfa değil, API. Ekranda bir şey çizmez; veri döndürür.
 * Bu adres <iframe src="..."> içinde kullanılınca tarayıcının kendi
 * PDF okuyucusu devreye girer.
 *
 * Adres: /documents/<id>/file
 */
export const GET: RequestHandler = async ({ params }) => {
	const doc = await getDocument(params.id);
	if (!doc) error(404, 'Doküman bulunamadı');

	const bytes = await readPdfBytes(params.id);
	if (!bytes) error(404, 'PDF dosyası bulunamadı');

	/*
	 * Baytları Blob'a ("dosya benzeri nesne") sarıyoruz — Response gövdesi
	 * Node'un ham bayt dizisini doğrudan kabul etmiyor.
	 *
	 * new Uint8Array(bytes) neden gerekli? Node'un döndürdüğü dizinin tipi
	 * "normal bellek VEYA paylaşımlı bellek" olabilir; Blob paylaşımlı
	 * belleği kabul etmiyor. Yeni bir diziye kopyalayınca sonucun normal
	 * bellekte olduğu kesinleşir ve tipler uyuşur.
	 */
	return new Response(new Blob([new Uint8Array(bytes)]), {
		headers: {
			// Tarayıcıya "bu bir PDF" der; okuyucusunu açmasını sağlar
			'Content-Type': 'application/pdf',
			// inline = sayfada göster (attachment olsaydı indirirdi)
			// filename = indirme durumunda kullanılacak ad
			'Content-Disposition': `inline; filename="${encodeURIComponent(doc.title)}"`,
			// Aynı dosyayı tekrar tekrar indirmesin diye 1 saat önbellek.
			// private = sadece kullanıcının tarayıcısı saklasın, ara sunucular değil
			'Cache-Control': 'private, max-age=3600'
		}
	});
};
