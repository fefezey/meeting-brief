<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import Sun from '@lucide/svelte/icons/sun';
	import Moon from '@lucide/svelte/icons/moon';

	/**
	 * Açık/karanlık tema düğmesi.
	 *
	 * Tema, <html> etiketine "dark" sınıfı eklenip çıkarılarak
	 * değiştiriliyor — app.css'teki .dark bloğu böyle devreye giriyor.
	 * Tercih localStorage'a kaydediliyor ki sonraki ziyarette hatırlansın.
	 */

	let isDark = $state(false);

	// $effect ilk çizimden SONRA çalışır; o an "dark" sınıfı
	// app.html'deki koddan dolayı zaten doğru durumda olur.
	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}
</script>

<Button
	variant="ghost"
	size="icon"
	onclick={toggle}
	aria-label={isDark ? 'Açık temaya geç' : 'Karanlık temaya geç'}
	title={isDark ? 'Açık tema' : 'Karanlık tema'}
>
	{#if isDark}
		<Sun />
	{:else}
		<Moon />
	{/if}
</Button>
