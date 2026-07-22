import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { getDocument, getAnalysis } from '$lib/server/storage/local';
import { isUsingMock } from '$lib/server/analysis';

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
		usingMock: isUsingMock()
	};
};
