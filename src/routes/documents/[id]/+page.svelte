<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import ChatPanel from '$lib/components/chat/ChatPanel.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// $derived = başka bir değerden TÜRETİLEN değer.
	// data.doc.status her değiştiğinde bu da otomatik güncellenir.
	let isAnalyzing = $derived(data.doc.status === 'analyzing');

	// Bekleme süresini saniye olarak göstermek için
	let elapsedSeconds = $state(0);

	/*
	 * $effect = "bağımlı olduğu değerler değişince çalış" bloğu.
	 *
	 * Burada iki iş yapıyor:
	 *   1. Her 2 saniyede bir invalidateAll() çağırıp sunucudan
	 *      güncel durumu ister (analiz bitti mi?)
	 *   2. Geçen süreyi sayar
	 *
	 * return ile döndürülen fonksiyon TEMİZLİK fonksiyonudur:
	 * durum değişince veya kullanıcı sayfadan çıkınca çalışır.
	 * Olmazsa zamanlayıcılar arka planda sonsuza kadar döner
	 * (bellek sızıntısı).
	 */
	$effect(() => {
		if (!isAnalyzing) {
			elapsedSeconds = 0;
			return;
		}

		const tick = setInterval(() => elapsedSeconds++, 1000);
		const poll = setInterval(() => invalidateAll(), 2000);

		return () => {
			clearInterval(tick);
			clearInterval(poll);
		};
	});

	const severityLabel = { high: 'Yüksek', medium: 'Orta', low: 'Düşük' } as const;
	const severityVariant = {
		high: 'destructive',
		medium: 'default',
		low: 'secondary'
	} as const;

	function formatSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatElapsed(seconds: number) {
		if (seconds < 60) return `${seconds} sn`;
		return `${Math.floor(seconds / 60)} dk ${seconds % 60} sn`;
	}
</script>

<div class="flex h-screen flex-col">
	<!-- Üst çubuk -->
	<header class="border-border flex items-center gap-4 border-b px-4 py-3">
		<a href="/" class="text-muted-foreground hover:text-foreground text-sm">← Geri</a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate font-medium">{data.doc.title}</h1>
			<p class="text-muted-foreground text-xs">
				{data.doc.pageCount ?? '?'} sayfa · {formatSize(data.doc.sizeBytes)}
			</p>
		</div>
		{#if data.usingMock}
			<Badge variant="outline">Örnek veri</Badge>
		{/if}
		<ThemeToggle />
	</header>

	<div class="flex min-h-0 flex-1 flex-col md:flex-row">
		<!-- SOL: PDF görüntüleyici -->
		<div class="border-border bg-muted min-h-[50vh] flex-1 md:min-h-0 md:border-r">
			{#if data.doc.hasExtractableText}
				<iframe
					src="/documents/{data.doc.id}/file"
					title={data.doc.title}
					class="h-full w-full"
				></iframe>
			{:else}
				<div class="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
					<p class="font-medium">Bu PDF taranmış görünüyor</p>
					<p class="text-muted-foreground max-w-sm text-sm">
						Dosyadan metin çıkarılamadı — muhtemelen sayfalar fotoğraf olarak
						kaydedilmiş. Yine de görüntüleyebilirsin.
					</p>
					<a
						href="/documents/{data.doc.id}/file"
						target="_blank"
						rel="noreferrer"
						class="text-sm underline underline-offset-4"
					>
						PDF'i yeni sekmede aç
					</a>
				</div>
			{/if}
		</div>

		<!-- SAĞ: Analiz + sohbet paneli -->
		<aside
			class="flex min-h-0 w-full shrink-0 flex-col p-4 md:w-[26rem] lg:w-[30rem]"
		>
			{#if isAnalyzing}
				<!-- BEKLEME DURUMU -->
				<Card.Root>
					<Card.Content class="flex flex-col items-center gap-3 py-10 text-center">
						<!-- animate-spin = Tailwind'in sürekli döndürme animasyonu -->
						<div
							class="border-muted-foreground/30 border-t-foreground size-6
							       animate-spin rounded-full border-2"
						></div>
						<p class="font-medium">Analiz ediliyor…</p>
						<p class="text-muted-foreground max-w-xs text-sm">
							{#if data.usingMock}
								Örnek veri üretiliyor.
							{:else}
								Uzun raporlarda 1-2 dakika sürebilir. Bu sayfada
								kalabilirsin, sonuç hazır olunca kendiliğinden görünecek.
							{/if}
						</p>
						<p class="text-muted-foreground text-xs">
							Geçen süre: {formatElapsed(elapsedSeconds)}
						</p>
					</Card.Content>
				</Card.Root>
			{:else if data.doc.status === 'failed'}
				<!-- HATA DURUMU -->
				<Card.Root>
					<Card.Header>
						<Card.Title>Analiz başarısız</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-4">
						<p class="text-muted-foreground text-sm">
							{data.doc.errorMessage ?? 'Bilinmeyen bir hata oluştu.'}
						</p>
						<!-- PDF zaten diskte; baştan yüklemeye gerek yok -->
						<form method="POST" action="?/retry" use:enhance>
							<Button type="submit" variant="outline">Yeniden dene</Button>
						</form>
					</Card.Content>
				</Card.Root>
			{:else if !data.analysis}
				<p class="text-muted-foreground text-sm">Analiz henüz hazır değil.</p>
			{:else}
				<!-- SONUÇ: iki sekme — Analiz ve Sohbet -->
				<Tabs.Root value="analysis" class="flex min-h-0 flex-1 flex-col">
					<Tabs.List class="w-full">
						<Tabs.Trigger value="analysis" class="flex-1">Analiz</Tabs.Trigger>
						<Tabs.Trigger value="chat" class="flex-1">Sohbet</Tabs.Trigger>
					</Tabs.List>

					<!-- min-h-0 = "içeriğin taşmasına izin ver, kaydırma çubuğu çıksın".
					     Bu olmadan flex kutular içeriği sonsuza kadar uzatır. -->
					<Tabs.Content value="analysis" class="min-h-0 flex-1 overflow-y-auto pt-2">
						<div class="space-y-4">
					<Card.Root>
						<Card.Header>
							<Card.Title>Özet</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm leading-relaxed">{data.analysis.summary}</p>
						</Card.Content>
					</Card.Root>

					<Card.Root>
						<Card.Header>
							<Card.Title>Ana maddeler</Card.Title>
						</Card.Header>
						<Card.Content>
							<ul class="space-y-2 text-sm">
								{#each data.analysis.keyPoints as point, i (i)}
									<li class="flex gap-2">
										<span class="text-muted-foreground shrink-0">{i + 1}.</span>
										<span>{point}</span>
									</li>
								{/each}
							</ul>
						</Card.Content>
					</Card.Root>

					{#if data.analysis.keyFigures.length > 0}
						<Card.Root>
							<Card.Header>
								<Card.Title>Kilit rakamlar</Card.Title>
							</Card.Header>
							<Card.Content class="space-y-3">
								{#each data.analysis.keyFigures as figure, i (i)}
									{#if i > 0}<Separator />{/if}
									<div class="space-y-0.5">
										<div class="flex items-baseline justify-between gap-3">
											<span class="text-muted-foreground text-sm">{figure.label}</span>
											<span class="font-medium">{figure.value}</span>
										</div>
										<p class="text-muted-foreground text-xs">{figure.context}</p>
									</div>
								{/each}
							</Card.Content>
						</Card.Root>
					{/if}

					{#if data.analysis.risks.length > 0}
						<Card.Root>
							<Card.Header>
								<Card.Title>Riskli noktalar</Card.Title>
							</Card.Header>
							<Card.Content class="space-y-3">
								{#each data.analysis.risks as risk, i (i)}
									{#if i > 0}<Separator />{/if}
									<div class="space-y-1">
										<div class="flex items-start justify-between gap-2">
											<span class="text-sm font-medium">{risk.title}</span>
											<Badge variant={severityVariant[risk.severity]} class="shrink-0">
												{severityLabel[risk.severity]}
											</Badge>
										</div>
										<p class="text-muted-foreground text-sm">{risk.detail}</p>
										{#if risk.pageHint}
											<p class="text-muted-foreground text-xs">Sayfa {risk.pageHint}</p>
										{/if}
									</div>
								{/each}
							</Card.Content>
						</Card.Root>
					{/if}

					<Card.Root>
						<Card.Header>
							<Card.Title>Toplantıda sorulabilecek sorular</Card.Title>
						</Card.Header>
						<Card.Content>
							<ul class="space-y-2 text-sm">
								{#each data.analysis.suggestedQuestions as question, i (i)}
									<li class="flex gap-2">
										<span class="text-muted-foreground shrink-0">{i + 1}.</span>
										<span>{question}</span>
									</li>
								{/each}
							</ul>
						</Card.Content>
						</Card.Root>
						</div>
					</Tabs.Content>

					<Tabs.Content value="chat" class="min-h-0 flex-1 pt-2">
						<ChatPanel
							documentId={data.doc.id}
							initialMessages={data.messages}
							suggestedQuestions={data.analysis.suggestedQuestions}
						/>
					</Tabs.Content>
				</Tabs.Root>
			{/if}
		</aside>
	</div>
</div>
