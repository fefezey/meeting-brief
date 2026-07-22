<script lang="ts">
	import { untrack } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { ChatMessage } from '$lib/types/chat';

	let {
		documentId,
		initialMessages = [],
		suggestedQuestions = []
	}: {
		documentId: string;
		initialMessages?: ChatMessage[];
		suggestedQuestions?: string[];
	} = $props();

	/*
	 * Ekranda görünen mesajlar. Sunucudan gelen geçmişle başlıyor.
	 *
	 * untrack(): "bu değerin sadece İLK halini al, sonraki
	 * değişikliklerini takip etme" demek. Bilerek böyle yapıyoruz —
	 * panel açıldıktan sonra mesaj listesini kendisi yönetiyor;
	 * sunucu verisi tazelense bile kullanıcının yazdıkları silinmemeli.
	 */
	let messages = $state<ChatMessage[]>(untrack(() => [...initialMessages]));

	let question = $state('');
	let sending = $state(false);

	// Akmakta olan cevap. Henüz "messages" listesine eklenmedi çünkü
	// hâlâ yazılıyor — bittiğinde listeye taşınacak.
	let streamingAnswer = $state('');

	// Mesaj listesinin DOM elemanı — otomatik aşağı kaydırmak için lazım
	let scrollBox = $state<HTMLDivElement | null>(null);

	function scrollToBottom() {
		// tick beklemeden çağırırsak yeni içerik henüz çizilmemiş olur;
		// requestAnimationFrame bir sonraki çizim karesini bekler
		requestAnimationFrame(() => {
			scrollBox?.scrollTo({ top: scrollBox.scrollHeight, behavior: 'smooth' });
		});
	}

	async function send(text: string) {
		const trimmed = text.trim();
		if (!trimmed || sending) return;

		sending = true;
		question = '';
		streamingAnswer = '';

		// Kullanıcının mesajını HEMEN ekrana koy (sunucuyu beklemeden).
		// Buna "iyimser güncelleme" denir — arayüz anında tepki verir.
		messages.push({
			id: crypto.randomUUID(),
			documentId,
			role: 'user',
			content: trimmed,
			citations: [],
			createdAt: new Date().toISOString()
		});
		scrollToBottom();

		try {
			const response = await fetch(`/documents/${documentId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: trimmed })
			});

			if (!response.ok || !response.body) {
				throw new Error(`Sunucu hatası (${response.status})`);
			}

			/*
			 * AKIŞI OKUMA
			 *
			 * response.body.getReader() -> boruyu okuyan "okuyucu"
			 * reader.read()             -> bir sonraki parçayı bekler
			 *   done  = akış bitti mi?
			 *   value = gelen baytlar
			 *
			 * TextDecoder baytları tekrar metne çevirir.
			 * { stream: true } önemli: Türkçe karakterler birden fazla
			 * bayttan oluşur ve parça sınırında ikiye bölünebilir;
			 * bu ayar yarım kalan baytı bir sonraki parçaya saklar.
			 */
			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				streamingAnswer += decoder.decode(value, { stream: true });
				scrollToBottom();
			}

			// Akış bitti: tamamlanmış cevabı listeye taşı
			messages.push({
				id: crypto.randomUUID(),
				documentId,
				role: 'assistant',
				content: streamingAnswer,
				citations: [],
				createdAt: new Date().toISOString()
			});
		} catch (err) {
			messages.push({
				id: crypto.randomUUID(),
				documentId,
				role: 'assistant',
				content: `Cevap alınamadı: ${err instanceof Error ? err.message : 'bilinmeyen hata'}`,
				citations: [],
				createdAt: new Date().toISOString()
			});
		} finally {
			streamingAnswer = '';
			sending = false;
			scrollToBottom();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		// Enter = gönder, Shift+Enter = alt satır
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send(question);
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- Mesaj listesi -->
	<div bind:this={scrollBox} class="flex-1 space-y-3 overflow-y-auto p-1">
		{#if messages.length === 0 && !streamingAnswer}
			<div class="space-y-3 py-6">
				<p class="text-muted-foreground text-sm">
					Doküman hakkında soru sor. Örneğin:
				</p>
				<!-- Analizden gelen önerilen sorular: tek tıkla sorulabilir -->
				<div class="flex flex-col gap-2">
					{#each suggestedQuestions.slice(0, 3) as q (q)}
						<button
							type="button"
							onclick={() => send(q)}
							class="border-border hover:bg-muted/50 rounded-lg border px-3 py-2
							       text-left text-sm transition-colors"
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as message (message.id)}
			<div class="flex" class:justify-end={message.role === 'user'}>
				<div
					class="max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap
					       {message.role === 'user'
						? 'bg-primary text-primary-foreground'
						: 'bg-muted'}"
				>
					{message.content}
				</div>
			</div>
		{/each}

		<!-- Akmakta olan cevap -->
		{#if streamingAnswer}
			<div class="flex">
				<div class="bg-muted max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap">
					{streamingAnswer}<span class="animate-pulse">▍</span>
				</div>
			</div>
		{:else if sending}
			<div class="flex">
				<div class="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-sm">
					Düşünüyor…
				</div>
			</div>
		{/if}
	</div>

	<!-- Soru kutusu -->
	<div class="border-border mt-2 border-t pt-3">
		<div class="flex gap-2">
			<Textarea
				bind:value={question}
				onkeydown={onKeydown}
				placeholder="Doküman hakkında bir soru sor…"
				rows={2}
				class="resize-none"
				disabled={sending}
			/>
			<Button onclick={() => send(question)} disabled={!question.trim() || sending}>
				Gönder
			</Button>
		</div>
		<p class="text-muted-foreground mt-1.5 text-xs">
			Enter ile gönder, Shift+Enter ile alt satıra geç
		</p>
	</div>
</div>
