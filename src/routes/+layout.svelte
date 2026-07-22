<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	/*
	 * HİDRATLANMA İŞARETİ
	 *
	 * Sayfa sunucuda HTML olarak üretilip gönderiliyor; JavaScript
	 * devreye girip olay dinleyicilerini bağlamasına "hidratlanma" denir.
	 * $effect sadece tarayıcıda ve hidratlanma bittikten sonra çalışır,
	 * dolayısıyla bu satırın çalışması "artık etkileşime hazırım" demek.
	 *
	 * Neden gerekli? Otomatik testler, düğmelere dinleyici bağlanmadan
	 * tıklayabilecek kadar hızlı. İşaret olmadan testler bazen geçip
	 * bazen kalıyordu (flaky test) — en can sıkıcı test türü.
	 *
	 * Maliyeti bir HTML özniteliği; kullanıcıya hiçbir etkisi yok.
	 */
	$effect(() => {
		document.documentElement.dataset.hydrated = 'true';
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
