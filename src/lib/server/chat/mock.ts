import type { DocumentRecord } from '$lib/types/document';

/**
 * Sahte sohbet cevabı üreticisi.
 *
 * "async function*" = asenkron üreteç (async generator).
 *   - normal fonksiyon: return ile BİR kez değer döndürür, biter
 *   - üreteç fonksiyon: yield ile PARÇA PARÇA döndürür, her seferinde
 *     kaldığı yerden devam eder
 *
 * Streaming için tam olarak bu lazım: "işte bir kelime… işte bir tane daha…"
 * Gerçek AI üreticisi de aynı şekli kullanacak, böylece ikisi
 * birbirinin yerine geçebilir.
 */
export async function* mockChatStream(
	doc: DocumentRecord,
	question: string
): AsyncGenerator<string> {
	const answer =
		`[ÖRNEK CEVAP] "${question}" sorusunu aldım. ` +
		`Gerçek AI bağlantısı kurulduğunda bu cevap, "${doc.title}" ` +
		`dokümanının içeriğine dayanarak üretilecek ve hangi sayfadan ` +
		`geldiği belirtilecek. Şu an sadece arayüzün nasıl çalıştığını ` +
		`gösteriyorum — yazının kelime kelime akmasına dikkat et; ` +
		`gerçek cevaplar da böyle görünecek.`;

	// Kelimelere böl ve tek tek gönder.
	// Aradaki gecikme, gerçek AI'ın yazma hızını taklit ediyor.
	for (const word of answer.split(' ')) {
		await new Promise((resolve) => setTimeout(resolve, 35));
		yield word + ' ';
	}
}
