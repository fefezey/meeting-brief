import type Anthropic from '@anthropic-ai/sdk';
import { MODEL } from '../anthropic/config';
import { CHAT_SYSTEM_PROMPT } from '../anthropic/prompts';
import type { ChatMessage } from '$lib/types/chat';

/**
 * Gerçek Claude sohbeti — cevabı parça parça (streaming) döndürür.
 *
 * İmzası mockChatStream ile aynı şekilde: ikisi de metin parçaları
 * üreten bir asenkron üreteç. Bu sayede çağıran kod hangisinin
 * çalıştığını bilmek zorunda değil.
 */
export async function* claudeChatStream(
	client: Anthropic,
	pdfBase64: string,
	history: ChatMessage[],
	question: string
): AsyncGenerator<string> {
	const stream = client.messages.stream({
		model: MODEL,
		max_tokens: 4096,

		// Sabit talimat — önbelleğe alınıyor
		system: [
			{
				type: 'text',
				text: CHAT_SYSTEM_PROMPT,
				cache_control: { type: 'ephemeral' }
			}
		],

		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'document',
						source: {
							type: 'base64',
							media_type: 'application/pdf',
							data: pdfBase64
						},
						/*
						 * citations: Claude'un her iddiayı dokümandaki hangi
						 * sayfadan aldığını belirtmesini sağlar. Kullanıcının
						 * cevaba güvenebilmesi için kritik — "uydurdu mu,
						 * gerçekten yazıyor mu?" sorusunu ortadan kaldırır.
						 */
						citations: { enabled: true },
						/*
						 * PDF'i önbelleğe al. İlk soru pahalı, sonraki
						 * sorular ~%90 daha ucuz — çünkü Claude aynı PDF'i
						 * tekrar tekrar işlemek zorunda kalmıyor.
						 */
						cache_control: { type: 'ephemeral' }
					},
					{
						type: 'text',
						text: 'Bu doküman hakkındaki sorularımı yanıtla.'
					}
				]
			},

			/*
			 * Sohbet geçmişi. API "durumsuz" (stateless) çalışır: önceki
			 * konuşmayı hatırlamaz, her seferinde tamamını göndeririz.
			 * Yoksa "peki ya ikincisi?" gibi bağlama dayalı sorular
			 * anlamsız olurdu.
			 */
			...history.map((m) => ({
				role: m.role,
				content: m.content
			})),

			{ role: 'user' as const, content: question }
		]
	});

	/*
	 * stream.on('text', ...) yerine olayları tek tek geziyoruz.
	 * Sebep: sadece metin parçalarını istiyoruz; citations gibi diğer
	 * blokları ileride ayrı işleyeceğiz.
	 */
	for await (const event of stream) {
		if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
			yield event.delta.text;
		}
	}
}
