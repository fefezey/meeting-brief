<script lang="ts">
	import { enhance } from '$app/forms';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import DocumentPrism from '$lib/components/hero/DocumentPrism.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedFile = $state<File | null>(null);
	let uploading = $state(false);
	let dragging = $state(false);
	let localError = $state('');
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
		// currentTarget değil target: Svelte olayları kök elemanda
		// topluca dinliyor, currentTarget kök olur.
		acceptFile((event.target as HTMLInputElement).files?.[0]);
	}

	function onDragOver(event: DragEvent) {
		// Engellemezsek tarayıcı dosyayı yeni sekmede açar
		event.preventDefault();
		dragging = true;
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		dragging = false;
		const file = event.dataTransfer?.files?.[0];
		acceptFile(file);
		if (!file || file.type !== 'application/pdf') return;

		// Dosyayı gizli input'a aktar — form gönderiminde giden odur
		const transfer = new DataTransfer();
		transfer.items.add(file);
		if (fileInput) fileInput.files = transfer.files;
	}

	function formatSize(bytes: number) {
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('tr-TR', {
			day: 'numeric',
			month: 'long'
		});
	}
</script>

<div class="relative min-h-screen overflow-hidden">
	<!-- Sayfanın üstünde çok yumuşak bir aydınlanma: zeminin düz
	     görünmesini engeller, derinlik verir -->
	<div
		class="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-[0.055]"
		style="background: radial-gradient(60% 70% at 62% 0%, var(--glow) 0%, transparent 70%)"
		aria-hidden="true"
	></div>

	<!-- ══ ÜST ÇUBUK ══ -->
	<header class="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-7">
		<span class="text-[0.9rem] font-medium tracking-tight">Doküman Analiz</span>
		<ThemeToggle />
	</header>

	<!-- ══ HERO ══
	     Sol: değer önerisi + yükleme. Sağ: soyut görsel.
	     items-center ile iki sütun dikeyde ortalanıyor. -->
	<section
		class="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pt-10 pb-24
		       lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:gap-20 lg:pt-16"
	>
		<div class="max-w-xl">
			<!-- Başlık: büyük, sıkı harf aralığı, iki satır.
			     text-balance satırları dengeli böler (tek kelime alt satıra düşmez) -->
			<h1
				class="text-[2.6rem] leading-[1.06] font-semibold text-balance
				       sm:text-[3.2rem] lg:text-[3.5rem]"
			>
				Uzun belgeler.<br />
				<span class="text-muted-foreground">Net kararlar.</span>
			</h1>

			<p class="text-muted-foreground mt-6 max-w-md text-[1.05rem] leading-relaxed">
				Raporu yükle; özetini, riskli noktalarını ve toplantıda sorman gereken
				soruları çıkarsın. Okumak için değil, karar vermek için.
			</p>

			<!-- ── YÜKLEME ── -->
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
				class="mt-10"
			>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<label
					ondragover={onDragOver}
					ondragleave={() => (dragging = false)}
					ondrop={onDrop}
					class="glass ease-cinematic group relative flex cursor-pointer flex-col
					       items-center justify-center gap-2 rounded-[22px] px-8 py-14
					       text-center transition-all duration-500
					       {dragging
						? 'scale-[1.015] border-[color:var(--glow)]/45 bg-[color:var(--glow)]/[0.06]'
						: 'hover:bg-white/[0.055]'}"
				>
					<input
						bind:this={fileInput}
						type="file"
						name="file"
						accept="application/pdf"
						onchange={onFileChange}
						class="sr-only"
					/>

					{#if dragging}
						<span class="text-[0.95rem] font-medium">Bırak</span>
						<span class="text-muted-foreground text-sm">dosya yüklensin</span>
					{:else if selectedFile}
						<span class="text-[0.95rem] font-medium">{selectedFile.name}</span>
						<span class="text-muted-foreground text-sm">
							{formatSize(selectedFile.size)} · değiştirmek için tıkla
						</span>
					{:else}
						<span class="text-[0.95rem] font-medium">Dosya seçmek için tıkla</span>
						<span class="text-muted-foreground text-sm">veya buraya sürükle</span>
					{/if}
				</label>

				{#if localError || form?.error}
					<p class="text-destructive mt-4 text-sm">{localError || form?.error}</p>
				{/if}

				<div class="mt-6 flex flex-wrap items-center gap-4">
					<!-- Ana eylem: kırık beyaz, koyu yazı. Renkli bir buton
					     "uygulama" hissi verirdi; bu sakin bir otorite verir. -->
					<button
						type="submit"
						disabled={!selectedFile || uploading}
						class="ease-cinematic bg-primary text-primary-foreground rounded-full px-6
						       py-2.5 text-[0.9rem] font-medium transition-all duration-300
						       hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
					>
						{uploading ? 'İşleniyor' : 'Analiz et'}
					</button>
					<span class="text-muted-foreground text-xs">PDF · en fazla 32 MB</span>
				</div>
			</form>

			{#if data.usingMock}
				<p class="text-muted-foreground/70 mt-8 text-xs leading-relaxed">
					Örnek veri modu. Gerçek analiz için bir Claude kimlik bilgisi tanımla.
				</p>
			{/if}
		</div>

		<!-- Sağ: soyut görsel. Küçük ekranlarda gizleniyor —
		     telefonda dar alanda etkisini kaybeder ve yer kaplar. -->
		<div class="hidden lg:block">
			<DocumentPrism />
		</div>
	</section>

	<!-- ══ DOKÜMANLAR ══ -->
	{#if data.documents.length > 0}
		<section class="relative mx-auto max-w-6xl px-6 pb-32">
			<div class="mb-6 flex items-baseline justify-between">
				<h2 class="text-sm font-medium tracking-tight">Dokümanların</h2>
				<span class="text-muted-foreground text-xs">{data.documents.length}</span>
			</div>

			<ul class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
				{#each data.documents as doc (doc.id)}
					<li
						class="glass ease-cinematic group relative rounded-[20px] p-5
						       transition-all duration-500 hover:bg-white/[0.055]"
					>
						<a href="/documents/{doc.id}" class="block">
							<!-- Durum göstergesi: rozet yerine küçük bir nokta.
							     Daha sessiz, daha premium. -->
							<div class="mb-4 flex items-center gap-2">
								<span
									class="size-1.5 rounded-full
									       {doc.status === 'failed'
										? 'bg-destructive'
										: doc.status === 'ready'
											? 'bg-[color:var(--glow-soft)]'
											: 'animate-pulse bg-[color:var(--glow)]'}"
								></span>
								<span class="text-muted-foreground text-[0.7rem] tracking-wide uppercase">
									{doc.status === 'failed'
										? 'Hata'
										: doc.status === 'ready'
											? 'Hazır'
											: 'İşleniyor'}
								</span>
								{#if !doc.hasExtractableText}
									<span class="text-muted-foreground/60 text-[0.7rem]">· Taranmış</span>
								{/if}
							</div>

							<p class="truncate text-[0.95rem] font-medium">{doc.title}</p>
							<p class="text-muted-foreground mt-1.5 text-xs">
								{doc.pageCount ?? '?'} sayfa · {formatSize(doc.sizeBytes)} · {formatDate(
									doc.createdAt
								)}
							</p>
						</a>

						<!-- Sil: normalde görünmez, karta gelince beliriyor.
						     Arayüzü sakin tutar; yıkıcı eylem göz önünde durmaz. -->
						<form
							method="POST"
							action="?/delete"
							use:enhance={({ cancel }) => {
								if (!confirm(`"${doc.title}" silinsin mi?`)) cancel();
								return async ({ update }) => update();
							}}
							class="absolute top-4 right-4"
						>
							<input type="hidden" name="id" value={doc.id} />
							<button
								type="submit"
								aria-label="{doc.title} dosyasını sil"
								class="text-muted-foreground hover:text-foreground ease-cinematic
								       rounded-full p-1.5 opacity-0 transition-all duration-300
								       group-hover:opacity-100 focus-visible:opacity-100"
							>
								<svg
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
									class="size-4"
									aria-hidden="true"
								>
									<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
								</svg>
							</button>
						</form>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>
