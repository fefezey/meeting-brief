<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import type { PageData, ActionData } from './$types';

	// $props() = bu bileşenin dışarıdan aldığı veriler.
	// data  -> +page.server.ts içindeki load'un döndürdüğü nesne
	// form  -> action'ın döndürdüğü nesne (hata mesajı vb.)
	let { data, form }: { data: PageData; form: ActionData } = $props();

	// $state() = değiştiğinde ekranı otomatik yenileyen değişken.
	// Svelte'nin reaktivite mekanizmasının temeli budur.
	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);

	function onFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		selectedFile = input.files?.[0] ?? null;
	}

	function formatSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleString('tr-TR', {
			day: '2-digit',
			month: 'short',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<main class="mx-auto max-w-3xl space-y-8 p-6 md:p-10">
	<header class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Doküman Analiz</h1>
		<p class="text-muted-foreground">
			Uzun raporları toplantı öncesi hızlıca anla. PDF yükle; özetini, riskli
			noktalarını ve sorulabilecek soruları çıkarsın.
		</p>
	</header>

	{#if data.usingMock}
		<div
			class="border-border bg-muted text-muted-foreground rounded-lg border px-4 py-3 text-sm"
		>
			<strong class="text-foreground">Örnek veri modu.</strong>
			AI bağlantısı henüz kurulmadı — analizler sahte veriyle üretiliyor.
			Gerçek analiz için <code class="bg-background rounded px-1">.env</code> dosyasına
			<code class="bg-background rounded px-1">ANTHROPIC_API_KEY</code> ekle.
		</div>
	{/if}

	<!-- Yükleme formu -->
	<Card.Root>
		<Card.Header>
			<Card.Title>PDF yükle</Card.Title>
			<Card.Description>En fazla 32 MB, 600 sayfa.</Card.Description>
		</Card.Header>
		<Card.Content>
			<!--
				enctype="multipart/form-data" -> dosya göndermek için ZORUNLU.
				action="?/upload"             -> sunucudaki "upload" action'ını çağırır.
				use:enhance                   -> formu JavaScript ile gönderir
				                                 (sayfa yenilenmez, daha akıcı)
			-->
			<form
				method="POST"
				action="?/upload"
				enctype="multipart/form-data"
				use:enhance={() => {
					uploading = true;
					return async ({ update }) => {
						await update();
						uploading = false;
					};
				}}
				class="space-y-4"
			>
				<label
					class="border-border hover:bg-muted/50 flex cursor-pointer flex-col
					       items-center justify-center gap-2 rounded-lg border border-dashed
					       px-6 py-10 text-center transition-colors"
				>
					<input
						type="file"
						name="file"
						accept="application/pdf"
						onchange={onFileChange}
						class="sr-only"
					/>
					{#if selectedFile}
						<span class="font-medium">{selectedFile.name}</span>
						<span class="text-muted-foreground text-sm">
							{formatSize(selectedFile.size)} — değiştirmek için tıkla
						</span>
					{:else}
						<span class="font-medium">Dosya seçmek için tıkla</span>
						<span class="text-muted-foreground text-sm">veya buraya sürükle</span>
					{/if}
				</label>

				{#if form?.error}
					<p class="text-destructive text-sm">{form.error}</p>
				{/if}

				<Button type="submit" disabled={!selectedFile || uploading}>
					{uploading ? 'İşleniyor…' : 'Yükle ve analiz et'}
				</Button>
			</form>
		</Card.Content>
	</Card.Root>

	<!-- Yüklenmiş dokümanlar -->
	<section class="space-y-3">
		<h2 class="text-lg font-medium">Dokümanların</h2>

		{#if data.documents.length === 0}
			<p class="text-muted-foreground text-sm">
				Henüz doküman yok. Yukarıdan bir PDF yükle.
			</p>
		{:else}
			<ul class="space-y-2">
				<!-- {#each} = liste döngüsü. (doc.id) = Svelte'nin her satırı
				     benzersiz takip etmesini sağlayan anahtar -->
				{#each data.documents as doc (doc.id)}
					<li>
						<a
							href="/documents/{doc.id}"
							class="border-border hover:bg-muted/50 flex items-center
							       justify-between gap-4 rounded-lg border px-4 py-3
							       transition-colors"
						>
							<div class="min-w-0 space-y-1">
								<p class="truncate font-medium">{doc.title}</p>
								<p class="text-muted-foreground text-xs">
									{doc.pageCount ?? '?'} sayfa · {formatSize(doc.sizeBytes)} · {formatDate(
										doc.createdAt
									)}
								</p>
							</div>

							<div class="flex shrink-0 items-center gap-2">
								{#if !doc.hasExtractableText}
									<Badge variant="outline">Taranmış</Badge>
								{/if}
								{#if doc.status === 'failed'}
									<Badge variant="destructive">Hata</Badge>
								{:else if doc.status === 'ready'}
									<Badge variant="secondary">Hazır</Badge>
								{:else}
									<Badge variant="outline">İşleniyor</Badge>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
