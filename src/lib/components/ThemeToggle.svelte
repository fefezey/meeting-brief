<script lang="ts">
	/**
	 * Açık/karanlık tema düğmesi.
	 *
	 * İkonlar elle çizilmiş SVG — ikon kütüphanesi yerine.
	 * Neden? İki ikon için paket bağımlılığı taşımak gereksiz; ayrıca
	 * çizgi kalınlığını tasarımın geri kalanıyla birebir eşleştirebiliyoruz.
	 */
	let isDark = $state(true);

	// $effect ilk çizimden sonra çalışır; o an sınıf app.html'deki
	// koddan dolayı zaten doğru durumdadır.
	$effect(() => {
		isDark = document.documentElement.classList.contains('dark');
	});

	function toggle() {
		isDark = !isDark;
		document.documentElement.classList.toggle('dark', isDark);
		localStorage.setItem('theme', isDark ? 'dark' : 'light');
	}
</script>

<button
	type="button"
	onclick={toggle}
	aria-label={isDark ? 'Açık temaya geç' : 'Karanlık temaya geç'}
	title={isDark ? 'Açık tema' : 'Karanlık tema'}
	class="text-muted-foreground hover:text-foreground ease-cinematic rounded-full
	       p-2 transition-colors duration-300"
>
	<svg
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.5"
		stroke-linecap="round"
		class="size-[18px]"
		aria-hidden="true"
	>
		{#if isDark}
			<!-- Güneş: açık temaya geçiş -->
			<circle cx="12" cy="12" r="4" />
			<path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
		{:else}
			<!-- Ay: karanlık temaya geçiş -->
			<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
		{/if}
	</svg>
</button>
