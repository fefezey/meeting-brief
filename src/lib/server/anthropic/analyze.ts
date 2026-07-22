import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { MODEL } from './config';
import { ANALYSIS_SYSTEM_PROMPT } from './prompts';
import { AnalysisSchema, type Analysis } from '$lib/types/analysis';

/**
 * Bir PDF'i Claude'a gönderip "Analiz Paketi" üretir.
 *
 * @param client    Claude bağlantısı. Dışarıdan veriliyor ki bu fonksiyon
 *                  hem SvelteKit sunucusundan hem terminalden çalışabilsin.
 * @param pdfBase64 PDF dosyasının base64'e çevrilmiş hali.
 *                  (base64 = ikili dosyayı düz metne çeviren kodlama;
 *                   API'ler dosyaları böyle taşır)
 */
export async function analyzeDocument(
	client: Anthropic,
	pdfBase64: string
): Promise<Analysis> {
	const response = await client.messages.parse({
		model: MODEL,
		max_tokens: 16000,

		// Modelin kim olduğunu ve nasıl davranacağını söyleyen sabit talimat.
		// cache_control: bu bölümü önbelleğe al -> tekrar tekrar işlenmesin.
		system: [
			{
				type: 'text',
				text: ANALYSIS_SYSTEM_PROMPT,
				cache_control: { type: 'ephemeral' }
			}
		],

		// "adaptive" = modelin ne kadar düşüneceğine kendisi karar versin.
		thinking: { type: 'adaptive' },
		output_config: {
			// "high" = analiz kalitesi hız/maliyetten önemli.
			effort: 'high',
			// Zod şemasını API'ye KURAL olarak veriyoruz.
			// Model artık bu yapının dışına çıkamaz — cevabı ayrıştırmak
			// zorunda kalmayız, doğrudan nesne olarak gelir.
			format: zodOutputFormat(AnalysisSchema)
		},

		messages: [
			{
				role: 'user',
				content: [
					{
						// "document" bloğu: Claude PDF'i doğrudan okur.
						// Metni ayrıca çıkarmamıza gerek yok — tabloları ve
						// grafikleri de görsel olarak anlıyor.
						type: 'document',
						source: {
							type: 'base64',
							media_type: 'application/pdf',
							data: pdfBase64
						},
						// PDF önbelleğe alınır: aynı doküman için sonraki
						// çağrılar ~%90 daha ucuz olur.
						cache_control: { type: 'ephemeral' }
					},
					{
						type: 'text',
						text: 'Bu raporu analiz et ve toplantı öncesi hazırlık paketini oluştur.'
					}
				]
			}
		]
	});

	// Model güvenlik sebebiyle cevap vermeyi reddederse parsed_output boş gelir.
	// Sessizce çökmek yerine anlaşılır bir hata veriyoruz.
	if (!response.parsed_output) {
		throw new Error(
			`Analiz üretilemedi (stop_reason: ${response.stop_reason}). ` +
				`Doküman çok uzun olabilir veya model isteği reddetmiş olabilir.`
		);
	}

	return response.parsed_output;
}
