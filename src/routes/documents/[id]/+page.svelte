<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Risk seviyelerini Türkçe etikete ve renge çeviren tablolar.
	// Kod içine dağıtmak yerine tek yerde tutmak, sonradan
	// değiştirmeyi kolaylaştırır.
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
</script>

<div class="flex h-screen flex-col">
	<!-- Üst çubuk -->
	<header class="border-border flex items-center gap-4 border-b px-4 py-3">
		<a href="/" class="text-muted-foreground hover:text-foreground text-sm">
			← Geri
		</a>
		<div class="min-w-0 flex-1">
			<h1 class="truncate font-medium">{data.doc.title}</h1>
			<p class="text-muted-foreground text-xs">
				{data.doc.pageCount ?? '?'} sayfa · {formatSize(data.doc.sizeBytes)}
			</p>
		</div>
		{#if data.usingMock}
			<Badge variant="outline">Örnek veri</Badge>
		{/if}
	</header>

	<!--
		İki sütunlu düzen.
		md:flex-row -> sadece orta boy ve üstü ekranlarda yan yana.
		Telefonda alt alta gelir (mobil öncelikli tasarım).
	-->
	<div class="flex min-h-0 flex-1 flex-col md:flex-row">
		<!-- SOL: PDF görüntüleyici -->
		<div class="border-border bg-muted min-h-[50vh] flex-1 md:min-h-0 md:border-r">
			{#if data.doc.hasExtractableText}
				<!-- iframe = sayfa içine gömülü başka bir sayfa.
				     Tarayıcının yerleşik PDF okuyucusu burada çalışır. -->
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

		<!-- SAĞ: Analiz paneli. overflow-y-auto = içerik taşarsa kaydırılsın -->
		<aside class="w-full shrink-0 overflow-y-auto p-4 md:w-[26rem] lg:w-[30rem]">
			{#if data.doc.status === 'failed'}
				<Card.Root>
					<Card.Header>
						<Card.Title>Analiz başarısız</Card.Title>
					</Card.Header>
					<Card.Content>
						<p class="text-muted-foreground text-sm">
							{data.doc.errorMessage ?? 'Bilinmeyen bir hata oluştu.'}
						</p>
					</Card.Content>
				</Card.Root>
			{:else if !data.analysis}
				<p class="text-muted-foreground text-sm">Analiz henüz hazır değil.</p>
			{:else}
				<div class="space-y-4">
					<!-- Özet -->
					<Card.Root>
						<Card.Header>
							<Card.Title>Özet</Card.Title>
						</Card.Header>
						<Card.Content>
							<p class="text-sm leading-relaxed">{data.analysis.summary}</p>
						</Card.Content>
					</Card.Root>

					<!-- Ana maddeler -->
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

					<!-- Kilit rakamlar -->
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

					<!-- Riskli noktalar -->
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

					<!-- Sorulabilecek sorular -->
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
			{/if}
		</aside>
	</div>
</div>
