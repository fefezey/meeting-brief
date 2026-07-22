<script lang="ts">
	// shadcn bileşenleri projemizin İÇİNDE duruyor (node_modules'da değil),
	// bu yüzden $lib üzerinden import ediliyorlar.
	import { Button } from '$lib/components/ui/button';
</script>

<main class="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-8">
	<div class="space-y-2">
		<h1 class="text-3xl font-semibold tracking-tight">Doküman Analiz</h1>
		<p class="text-muted-foreground">
			Uzun raporları toplantı öncesi hızlıca anlamak için. PDF yükle, özetini,
			risklerini ve sorulacak soruları gör.
		</p>
	</div>

	<div class="flex gap-2">
		<Button>PDF Yükle</Button>
		<Button variant="outline">Örnek raporu dene</Button>
	</div>

	<p class="text-muted-foreground text-sm">
		Aşama 2 — analiz motoru hazır. Terminalden dene:
		<code class="bg-muted rounded px-1.5 py-0.5 text-xs">npm run analyze -- ./rapor.pdf</code>
	</p>
</main>
