import { error, json } from '@sveltejs/kit';
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from './$types';
import { getDocument, readPdfBytes, getMessages, appendMessage } from '$lib/server/storage/local';
import { streamChatAnswer } from '$lib/server/chat';
import type { ChatMessage } from '$lib/types/chat';

/**
 * Soru sorulan ve cevabın AKARAK döndüğü API ucu.
 *
 * Adres: POST /documents/<id>/chat
 * Gövde: { "question": "..." }
 * Cevap: düz metin akışı (parça parça gelir)
 */
export const POST: RequestHandler = async ({ params, request }) => {
	const doc = await getDocument(params.id);
	if (!doc) error(404, 'Doküman bulunamadı');

	const body = await request.json().catch(() => null);
	const question = typeof body?.question === 'string' ? body.question.trim() : '';

	if (!question) error(400, 'Soru boş olamaz');
	if (question.length > 2000) error(400, 'Soru çok uzun (en fazla 2000 karakter)');

	const pdfBytes = await readPdfBytes(params.id);
	if (!pdfBytes) error(404, 'PDF dosyası bulunamadı');

	// Geçmişi ŞİMDİ oku — yeni soruyu eklemeden önce
	const history = await getMessages(params.id);

	// Kullanıcının sorusunu hemen kaydet.
	// Cevap üretimi yarıda kesilse bile soru kaybolmasın.
	const userMessage: ChatMessage = {
		id: randomUUID(),
		documentId: params.id,
		role: 'user',
		content: question,
		citations: [],
		createdAt: new Date().toISOString()
	};
	await appendMessage(params.id, userMessage);

	/*
	 * ReadableStream = "veriyi parça parça gönderen boru".
	 *
	 * start(controller) içinde:
	 *   controller.enqueue(...) -> boruya bir parça koy (anında gider)
	 *   controller.close()      -> boruyu kapat (akış bitti)
	 *
	 * TextEncoder metni baytlara çevirir; ağ üzerinden bayt taşınır.
	 */
	const encoder = new TextEncoder();
	let fullAnswer = '';

	const stream = new ReadableStream({
		async start(controller) {
			/*
			 * Kullanıcı sekmeyi kapatırsa boru KOPAR ve ona yazmak hata
			 * fırlatır. Her enqueue çağrısını tek tek korumak yerine
			 * güvenli bir yardımcı yazıyoruz.
			 */
			let broken = false;
			const push = (text: string) => {
				if (broken) return;
				try {
					controller.enqueue(encoder.encode(text));
				} catch {
					broken = true; // bağlantı koptu, bundan sonra yazmayı bırak
				}
			};

			try {
				for await (const chunk of streamChatAnswer(doc, pdfBytes, history, question)) {
					fullAnswer += chunk;
					push(chunk);
					if (broken) break; // dinleyen kimse yoksa üretmeye devam etme
				}
			} catch (err) {
				console.error('[sohbet] hata:', err);
				// Akış başladıktan sonra HTTP hata kodu gönderemeyiz
				// (başlıklar çoktan gitti). Bu yüzden hatayı metnin
				// içine yazıyoruz — kullanıcı en azından ne olduğunu görsün.
				push('\n\n[Cevap üretilirken hata oluştu. Tekrar dene.]');
			} finally {
				/*
				 * SIRALAMA ÖNEMLİ: önce kaydet, sonra kapat.
				 *
				 * Bağlantı kopmuşsa controller.close() hata fırlatır.
				 * Kapatmayı önce yazsaydık, o hata finally'yi keser ve
				 * kaydetme satırına hiç sıra gelmezdi — testte tam olarak
				 * bu oldu.
				 */

				/*
				 * Cevabı kaydet.
				 *
				 * Boşsa bile bir kayıt bırakıyoruz. Neden? Kullanıcının
				 * sorusunu yukarıda zaten kaydettik. Cevap hiç yazılmazsa
				 * (kullanıcı sekmeyi kapattı, bağlantı koptu) geçmişte
				 * CEVAPSIZ bir soru kalır. Bunlar birikince hem sohbet
				 * kafa karıştırıcı olur hem de her yeni soruda Claude'a
				 * gereksiz yere gönderilir.
				 */
				await appendMessage(params.id, {
					id: randomUUID(),
					documentId: params.id,
					role: 'assistant',
					content: fullAnswer.trim() || '[Cevap yarıda kesildi.]',
					citations: [],
					createdAt: new Date().toISOString()
				});

				// Zaten kapalıysa hata verir — yutuyoruz, yapacak bir şey yok
				try {
					controller.close();
				} catch {
					/* boru zaten kapalı */
				}
			}
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/plain; charset=utf-8',
			// Ara sunucuların akışı tamponlamasını (biriktirmesini) engeller
			'Cache-Control': 'no-cache',
			'X-Accel-Buffering': 'no'
		}
	});
};

/** Sohbet geçmişini döndürür (sayfa yenilenince eski mesajlar gelsin diye) */
export const GET: RequestHandler = async ({ params }) => {
	return json(await getMessages(params.id));
};
