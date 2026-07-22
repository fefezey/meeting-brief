import type { DocumentRecord } from '$lib/types/document';
import type { ChatMessage } from '$lib/types/chat';
import { isUsingMock } from '../analysis';
import { mockChatStream } from './mock';

/**
 * Sohbetin TEK giriş kapısı — analizdeki generateAnalysis ile aynı desen.
 *
 * Çağıran kod mock mu gerçek AI mı çalıştığını bilmez; .env dosyasına
 * anahtar eklendiği an otomatik geçiş olur.
 */
export async function* streamChatAnswer(
	doc: DocumentRecord,
	pdfBytes: Uint8Array,
	history: ChatMessage[],
	question: string
): AsyncGenerator<string> {
	if (isUsingMock()) {
		yield* mockChatStream(doc, question);
		return;
	}

	// Dinamik import: client.ts anahtar yoksa yüklenirken hata fırlatıyor,
	// bu yüzden sadece gerçekten ihtiyaç olduğunda yüklüyoruz.
	const { anthropic } = await import('../anthropic/client');
	const { claudeChatStream } = await import('./claude');

	const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

	// yield* = başka bir üretecin ürettiği her parçayı olduğu gibi aktar
	yield* claudeChatStream(anthropic, pdfBase64, history, question);
}
