<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import * as Tabs from '$lib/components/ui/tabs';
	import ChatPanel from '$lib/components/chat/ChatPanel.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let isAnalyzing = $derived(data.doc.status === 'analyzing');
	let elapsedSeconds = $state(0);

	// Analiz sürerken 2 saniyede bir sunucuya sor; bitince dur.
	// return ile dönen fonksiyon temizlik yapar — olmazsa zamanlayıcılar
	// sayfadan çıkıldıktan sonra da dönmeye devam eder.
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

	// Renk yerine YOĞUNLUK ile ayırıyoruz. Üç farklı renk kullanmak
	// arayüzü gürültülü yapardı; aynı ailede üç ton sakin kalıyor.
	const severityDot = {
		high: 'bg-destructive',
		medium: 'bg-foreground/55',
		low: 'bg-muted-foreground/40'
	} as const;

	function formatSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatElapsed(seconds: number) {
		if (seconds < 60) return `${seconds} saniye`;
		return `${Math.floor(seconds / 60)} dk ${seconds % 60} sn`;
	}
</script>

<div class="flex h-screen flex-col">
	<!-- ══ ÜST ÇUBUK ══ İnce, sessiz, yolunuzdan çekiliyor -->
	<header class="flex shrink-0 items-center gap-5 px-5 py-4">
		<a
			href="/"
			class="text-muted-foreground hover:text-foreground ease-cinematic
			       text-sm transition-colors duration-300"
		>
			← Geri
		</a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate text-sm font-medium">{data.doc.title}</h1>
			<p class="text-muted-foreground mt-0.5 text-xs">
				{data.doc.pageCount ?? '?'} sayfa · {formatSize(data.doc.sizeBytes)}
				{#if data.usingMock}· Örnek veri{/if}
			</p>
		</div>
		<ThemeToggle />
	</header>

	<div class="flex min-h-0 flex-1 flex-col gap-4 px-5 pb-5 lg:flex-row">
		<!-- ══ SOL: BELGE ══ -->
		<div class="glass min-h-[45vh] flex-1 overflow-hidden rounded-[22px] lg:min-h-0">
			{#if data.doc.hasExtractableText}
				<iframe
					src="/documents/{data.doc.id}/file"
					title={data.doc.title}
					class="h-full w-full"
				></iframe>
			{:else}
				<div class="flex h-full flex-col items-center justify-center gap-3 p-10 text-center">
					<p class="text-sm font-medium">Bu belge taranmış görünüyor</p>
					<p class="text-muted-foreground max-w-xs text-sm leading-relaxed">
						Dosyadan metin çıkarılamadı — sayfalar muhtemelen fotoğraf olarak
						kaydedilmiş.
					</p>
					<a
						href="/documents/{data.doc.id}/file"
						target="_blank"
						rel="noreferrer"
						class="text-muted-foreground hover:text-foreground mt-1 text-sm
						       underline underline-offset-4 transition-colors"
					>
						Yeni sekmede aç
					</a>
				</div>
			{/if}
		</div>

		<!-- ══ SAĞ: BRİFİNG ══ -->
		<aside class="glass flex w-full shrink-0 flex-col rounded-[22px] lg:w-[27rem] xl:w-[31rem]">
			{#if isAnalyzing}
				<!-- Bekleme: dönen çark yerine yavaşça nefes alan bir nokta.
				     Çark "yükleniyor" der; bu "düşünüyor" der. -->
				<div class="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
					<span class="relative flex size-2">
						<span
							class="absolute inline-flex size-full animate-ping rounded-full
							       bg-[color:var(--glow)] opacity-60"
						></span>
						<span
							class="relative inline-flex size-2 rounded-full bg-[color:var(--glow)]"
						></span>
					</span>
					<p class="text-sm font-medium">Okunuyor</p>
					<p class="text-muted-foreground max-w-[16rem] text-sm leading-relaxed">
						{#if data.usingMock}
							Örnek veri üretiliyor.
						{:else}
							Uzun belgelerde birkaç dakika sürebilir. Sonuç hazır olunca
							kendiliğinden görünecek.
						{/if}
					</p>
					<p class="text-muted-foreground/60 text-xs">{formatElapsed(elapsedSeconds)}</p>
				</div>
			{:else if data.doc.status === 'failed'}
				<div class="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
					<p class="text-sm font-medium">Analiz tamamlanamadı</p>
					<p class="text-muted-foreground max-w-[18rem] text-sm leading-relaxed">
						{data.doc.errorMessage ?? 'Bilinmeyen bir hata oluştu.'}
					</p>
					<!-- Belge zaten diskte; baştan yüklemeye gerek yok -->
					<form method="POST" action="?/retry" use:enhance>
						<button
							type="submit"
							class="ease-cinematic bg-primary text-primary-foreground mt-1 rounded-full
							       px-5 py-2 text-sm font-medium transition-opacity duration-300
							       hover:opacity-90"
						>
							Yeniden dene
						</button>
					</form>
				</div>
			{:else if !data.analysis}
				<p class="text-muted-foreground p-10 text-sm">Analiz henüz hazır değil.</p>
			{:else}
				<Tabs.Root value="analysis" class="flex min-h-0 flex-1 flex-col gap-0">
					<!--
						Sekmeler: kutu değil, iki kelime ve altında ince bir çizgi.

						variant="line" bileşenin kendi sade varyantı — alt çizgiyi
						ve aktif rengi o yönetiyor. Bizim eklediğimiz tek şey
						hizalama: flex-none olmadan tetikleyiciler flex-1 alıp
						tüm genişliğe eşit bölünüyordu.
					-->
					<Tabs.List
						variant="line"
						class="h-auto w-full justify-start gap-7 border-b border-[color:var(--border)]
						       px-6 pt-5 pb-0 [&>button]:flex-none [&>button]:px-0 [&>button]:pb-3"
					>
						<Tabs.Trigger value="analysis" class="text-sm font-medium">
							Brifing
						</Tabs.Trigger>
						<Tabs.Trigger value="chat" class="text-sm font-medium">Sohbet</Tabs.Trigger>
					</Tabs.List>

					<!-- ── BRİFİNG ──
					     Kutular yerine bol boşlukla ayrılmış bölümler.
					     Kutu "dashboard", boşluk "belge" hissi verir. -->
					<Tabs.Content value="analysis" class="min-h-0 flex-1 overflow-y-auto px-6 py-7">
						<div class="space-y-10">
							<section>
								<p class="text-[0.95rem] leading-[1.7]">{data.analysis.summary}</p>
							</section>

							<section>
								<h2
									class="text-muted-foreground mb-4 text-[0.7rem] tracking-[0.12em] uppercase"
								>
									Ana maddeler
								</h2>
								<ul class="space-y-3">
									{#each data.analysis.keyPoints as point, i (i)}
										<li class="flex gap-3 text-sm leading-relaxed">
											<span class="text-muted-foreground/50 shrink-0 tabular-nums">
												{String(i + 1).padStart(2, '0')}
											</span>
											<span>{point}</span>
										</li>
									{/each}
								</ul>
							</section>

							{#if data.analysis.keyFigures.length > 0}
								<section>
									<h2
										class="text-muted-foreground mb-4 text-[0.7rem] tracking-[0.12em] uppercase"
									>
										Kilit rakamlar
									</h2>
									<div class="space-y-4">
										{#each data.analysis.keyFigures as figure, i (i)}
											<div class="space-y-1">
												<div class="flex items-baseline justify-between gap-4">
													<span class="text-muted-foreground text-sm">{figure.label}</span>
													<!-- tabular-nums: rakamlar eşit genişlikte, alt alta hizalı -->
													<span class="text-sm font-medium tabular-nums">{figure.value}</span>
												</div>
												<p class="text-muted-foreground/70 text-xs leading-relaxed">
													{figure.context}
												</p>
											</div>
										{/each}
									</div>
								</section>
							{/if}

							{#if data.analysis.risks.length > 0}
								<section>
									<h2
										class="text-muted-foreground mb-4 text-[0.7rem] tracking-[0.12em] uppercase"
									>
										Riskli noktalar
									</h2>
									<div class="space-y-5">
										{#each data.analysis.risks as risk, i (i)}
											<div>
												<div class="flex items-center gap-2.5">
													<span class="size-1.5 shrink-0 rounded-full {severityDot[risk.severity]}"
													></span>
													<span class="text-sm font-medium">{risk.title}</span>
													<span class="text-muted-foreground/60 ml-auto shrink-0 text-xs">
														{severityLabel[risk.severity]}
														{#if risk.pageHint}· s.{risk.pageHint}{/if}
													</span>
												</div>
												<p class="text-muted-foreground mt-1.5 pl-[1.05rem] text-sm leading-relaxed">
													{risk.detail}
												</p>
											</div>
										{/each}
									</div>
								</section>
							{/if}

							<section>
								<h2
									class="text-muted-foreground mb-4 text-[0.7rem] tracking-[0.12em] uppercase"
								>
									Sorulabilecek sorular
								</h2>
								<ul class="space-y-3">
									{#each data.analysis.suggestedQuestions as question, i (i)}
										<li class="flex gap-3 text-sm leading-relaxed">
											<span class="text-muted-foreground/50 shrink-0 tabular-nums">
												{String(i + 1).padStart(2, '0')}
											</span>
											<span>{question}</span>
										</li>
									{/each}
								</ul>
							</section>
						</div>
					</Tabs.Content>

					<Tabs.Content value="chat" class="min-h-0 flex-1 px-6 pt-5 pb-6">
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
