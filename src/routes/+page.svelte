<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);

	// Kullanıcı dosyayı kutunun üzerine sürüklüyor mu?
	// Sadece görsel geri bildirim için (kutunun rengi değişsin diye)
	let dragging = $state(false);

	// Sürükle-bırakta oluşan hatalar (sunucuya gitmeden, tarayıcıda)
	let localError = $state('');

	// Gizli dosya kutusuna erişim — sürüklenen dosyayı ona koyacağız
	let fileInput = $state<HTMLInputElement | null>(null);

	function acceptFile(file: File | undefined | null) {
		localError = '';
		if (!file) return;

		if (file.type !== 'application/pdf') {
			localError = 'Sadece PDF dosyası yükleyebilirsin.';
			return;
		}
		selectedFile = file;
	}

	function onFileChange(event: Event) {
		/*
		 * event.target kullanıyoruz, currentTarget değil.
		 *
		 * Svelte 5 bazı olayları tek tek elemanlara değil, kök elemana
		 * bağlayıp topluca dinler (olay delegasyonu — daha az bellek).
		 * Bu durumda currentTarget dinleyen eleman, yani kök olur;
		 * target ise olayı ASIL çıkaran eleman — bize gereken bu.
		 */
		const input = event.target as HTMLInputElement;
		acceptFile(input.files?.[0]);
	}

	/*
	 * SÜRÜKLE-BIRAK
	 *
	 * preventDefault() şart: tarayıcının varsayılan davranışı, bırakılan
	 * dosyayı YENİ SEKMEDE AÇMAKTIR. Engellemezsek uygulamadan çıkarız.
	 */
	function onDragOver(event: DragEvent) {
		event.preventDefault();
		dragging = true;
	}

	function onDragLeave() {
		dragging = false;
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;

		const file = event.dataTransfer?.files?.[0];
		acceptFile(file);
		if (!file || file.type !== 'application/pdf') return;

		/*
		 * Dosyayı gizli <input>'a aktarıyoruz.
		 *
		 * Neden gerekli? Form gönderilirken tarayıcı sadece input'un
		 * içindeki dosyayı yollar; bizim JavaScript değişkenimizi bilmez.
		 * input.files doğrudan atanamaz — DataTransfer nesnesi üzerinden
		 * yapılır (tarayıcıların izin verdiği tek yol).
		 */
		const transfer = new DataTransfer();
		transfer.items.add(file);
		if (fileInput) fileInput.files = transfer.files;
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
	<header class="flex items-start justify-between gap-4">
		<div class="space-y-2">
			<h1 class="text-3xl font-semibold tracking-tight">Doküman Analiz</h1>
			<p class="text-muted-foreground">
				Uzun raporları toplantı öncesi hızlıca anla. PDF yükle; özetini, riskli
				noktalarını ve sorulabilecek soruları çıkarsın.
			</p>
		</div>
		<ThemeToggle />
	</header>

	{#if data.usingMock}
		<div class="border-border bg-muted text-muted-foreground rounded-lg border px-4 py-3 text-sm">
			<strong class="text-foreground">Örnek veri modu.</strong>
			AI bağlantısı henüz kurulmadı — analizler sahte veriyle üretiliyor. Gerçek
			analiz için <code class="bg-background rounded px-1">.env</code> dosyasına
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
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<label
					ondragover={onDragOver}
					ondragleave={onDragLeave}
					ondrop={onDrop}
					class="flex cursor-pointer flex-col items-center justify-center gap-2
					       rounded-lg border border-dashed px-6 py-10 text-center transition-colors
					       {dragging
						? 'border-primary bg-primary/5'
						: 'border-border hover:bg-muted/50'}"
				>
					<!-- sr-only = ekranda görünmez ama ekran okuyucular ve
					     form gönderimi için hâlâ mevcut -->
					<input
						bind:this={fileInput}
						type="file"
						name="file"
						accept="application/pdf"
						onchange={onFileChange}
						class="sr-only"
					/>
					{#if dragging}
						<span class="font-medium">Bırak, yüklensin</span>
					{:else if selectedFile}
						<span class="font-medium">{selectedFile.name}</span>
						<span class="text-muted-foreground text-sm">
							{formatSize(selectedFile.size)} — değiştirmek için tıkla
						</span>
					{:else}
						<span class="font-medium">Dosya seçmek için tıkla</span>
						<span class="text-muted-foreground text-sm">veya buraya sürükle</span>
					{/if}
				</label>

				{#if localError || form?.error}
					<p class="text-destructive text-sm">{localError || form?.error}</p>
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
				{#each data.documents as doc (doc.id)}
					<!--
						Bağlantı ve silme formu KARDEŞ elemanlar.
						Formu bağlantının içine koyamayız — geçersiz HTML olur
						ve tıklamalar birbirine karışır.
					-->
					<li
						class="border-border hover:bg-muted/50 flex items-center gap-2
						       rounded-lg border pr-2 transition-colors"
					>
						<a href="/documents/{doc.id}" class="min-w-0 flex-1 px-4 py-3">
							<p class="truncate font-medium">{doc.title}</p>
							<p class="text-muted-foreground text-xs">
								{doc.pageCount ?? '?'} sayfa · {formatSize(doc.sizeBytes)} · {formatDate(
									doc.createdAt
								)}
							</p>
						</a>

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

							<form
								method="POST"
								action="?/delete"
								use:enhance={({ cancel }) => {
									// Silme geri alınamaz — onay iste.
									// confirm() tarayıcının yerleşik onay kutusu.
									if (!confirm(`"${doc.title}" silinsin mi?`)) cancel();
									return async ({ update }) => update();
								}}
							>
								<input type="hidden" name="id" value={doc.id} />
								<Button
									type="submit"
									variant="ghost"
									size="icon-sm"
									aria-label="{doc.title} dosyasını sil"
									title="Sil"
								>
									<Trash2 />
								</Button>
							</form>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</section>
</main>
