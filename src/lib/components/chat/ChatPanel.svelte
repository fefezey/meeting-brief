<script lang="ts">
	import { untrack } from 'svelte';
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
	 * untrack(): sunucudan gelen geçmişin sadece İLK halini al.
	 * Panel açıldıktan sonra listeyi kendisi yönetiyor; sunucu verisi
	 * tazelense bile kullanıcının yazdıkları silinmemeli.
	 */
	let messages = $state<ChatMessage[]>(untrack(() => [...initialMessages]));

	let question = $state('');
	let sending = $state(false);
	// Akmakta olan cevap: henüz listeye eklenmedi, hâlâ yazılıyor
	let streamingAnswer = $state('');
	let scrollBox = $state<HTMLDivElement | null>(null);

	function scrollToBottom() {
		// requestAnimationFrame: yeni içerik çizildikten SONRA kaydır
		requestAnimationFrame(() => {
			scrollBox?.scrollTo({ top: scrollBox.scrollHeight, behavior: 'smooth' });
		});
	}

	function newMessage(role: 'user' | 'assistant', content: string): ChatMessage {
		return {
			id: crypto.randomUUID(),
			documentId,
			role,
			content,
			citations: [],
			createdAt: new Date().toISOString()
		};
	}

	async function send(text: string) {
		const trimmed = text.trim();
		if (!trimmed || sending) return;

		sending = true;
		question = '';
		streamingAnswer = '';

		// İyimser güncelleme: sunucuyu beklemeden ekrana yaz.
		// Arayüz anında tepki verir, bekleme hissi oluşmaz.
		messages.push(newMessage('user', trimmed));
		scrollToBottom();

		try {
			const response = await fetch(`/documents/${documentId}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ question: trimmed })
			});
			if (!response.ok || !response.body) throw new Error(`Sunucu hatası (${response.status})`);

			/*
			 * Akışı okuma. TextDecoder'da { stream: true } kritik:
			 * Türkçe karakterler birden fazla bayttan oluşur ve parça
			 * sınırında ikiye bölünebilir; bu ayar yarım baytı saklar.
			 */
			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				streamingAnswer += decoder.decode(value, { stream: true });
				scrollToBottom();
			}

			messages.push(newMessage('assistant', streamingAnswer));
		} catch (err) {
			const reason = err instanceof Error ? err.message : 'bilinmeyen hata';
			messages.push(newMessage('assistant', `Cevap alınamadı: ${reason}`));
		} finally {
			streamingAnswer = '';
			sending = false;
			scrollToBottom();
		}
	}

	function onKeydown(event: KeyboardEvent) {
		// Enter gönderir, Shift+Enter alt satıra geçer
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			send(question);
		}
	}
</script>

<div class="flex h-full flex-col">
	<!-- ── MESAJLAR ── -->
	<div bind:this={scrollBox} class="flex-1 space-y-5 overflow-y-auto">
		{#if messages.length === 0 && !streamingAnswer}
			<div class="space-y-3 pt-2">
				<p class="text-muted-foreground text-sm">Belge hakkında soru sor</p>
				<!-- Analizden gelen sorular: tek tıkla sorulabilir.
				     Boş ekran bırakmak yerine yol gösteriyoruz. -->
				<div class="flex flex-col gap-2">
					{#each suggestedQuestions.slice(0, 3) as q (q)}
						<button
							type="button"
							onclick={() => send(q)}
							class="glass ease-cinematic rounded-2xl px-4 py-3 text-left text-sm
							       leading-relaxed transition-all duration-400 hover:bg-white/[0.06]"
						>
							{q}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#each messages as message (message.id)}
			<div class="flex" class:justify-end={message.role === 'user'}>
				<!-- Kullanıcı mesajı belirgin, cevap sade.
				     Cevap uzun olduğu için kutu içine almıyoruz —
				     kutusuz metin daha rahat okunur. -->
				<div
					class="text-sm leading-[1.7] whitespace-pre-wrap
					       {message.role === 'user'
						? 'bg-secondary text-secondary-foreground max-w-[85%] rounded-2xl px-4 py-2.5'
						: 'w-full'}"
				>
					{message.content}
				</div>
			</div>
		{/each}

		{#if streamingAnswer}
			<div class="text-sm leading-[1.7] whitespace-pre-wrap">
				{streamingAnswer}<span
					class="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em]
					       animate-pulse bg-[color:var(--glow)]"
				></span>
			</div>
		{:else if sending}
			<!-- Yavaşça nefes alan nokta: "düşünüyor" -->
			<div class="flex items-center gap-2">
				<span class="size-1.5 animate-pulse rounded-full bg-[color:var(--glow)]"></span>
				<span class="text-muted-foreground text-sm">Düşünüyor</span>
			</div>
		{/if}
	</div>

	<!-- ── SORU KUTUSU ── -->
	<div class="mt-5 shrink-0">
		<div
			class="glass ease-cinematic flex items-end gap-2 rounded-[18px] p-2
			       transition-colors duration-300 focus-within:bg-white/[0.055]"
		>
			<textarea
				bind:value={question}
				onkeydown={onKeydown}
				placeholder="Bir soru sor…"
				rows="1"
				disabled={sending}
				class="placeholder:text-muted-foreground/70 max-h-32 min-h-[2.25rem] flex-1
				       resize-none border-0 bg-transparent px-2.5 py-2 text-sm
				       leading-relaxed outline-none disabled:opacity-50"
			></textarea>
			<button
				type="button"
				onclick={() => send(question)}
				disabled={!question.trim() || sending}
				aria-label="Gönder"
				class="ease-cinematic bg-primary text-primary-foreground grid size-8 shrink-0
				       place-items-center rounded-full transition-all duration-300
				       hover:opacity-90 disabled:opacity-25"
			>
				<svg
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"
					aria-hidden="true"
				>
					<path d="M12 19V5M5 12l7-7 7 7" />
				</svg>
			</button>
		</div>
		<p class="text-muted-foreground/50 mt-2 px-1 text-xs">
			Enter gönderir · Shift+Enter alt satır
		</p>
	</div>
</div>
