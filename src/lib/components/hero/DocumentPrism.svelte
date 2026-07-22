<script lang="ts">
	/**
	 * HERO GÖRSELİ — "Bir belge anlayışa dönüşüyor"
	 *
	 * Soyut kompozisyon:
	 *   · üst üste duran yarı saydam cam paneller = belgenin katmanları
	 *   · aralarından çıkıp yüzen kartlar        = çıkarılan içgörüler
	 *   · geçen ince ışık çizgileri              = okuma / tarama
	 *   · sürüklenen parçacıklar                 = bilgi kırıntıları
	 *
	 * Bilerek YOK: robot, beyin, PDF ikonu, devre deseni, sinir ağı.
	 * Bunlar klişe ve ucuz görünür. Işık, cam ve katman yeterli.
	 *
	 * Animasyonun tamamı CSS. Neden? JavaScript'ten daha akıcı çalışır
	 * (tarayıcı ekran kartına devredebilir) ve "hareketi azalt" sistem
	 * tercihine app.css'teki kural sayesinde kendiliğinden uyar.
	 *
	 * aria-hidden: ekran okuyucular için hiçbir bilgi taşımıyor —
	 * tamamen dekoratif. Okutmak gürültü olurdu.
	 */
</script>

<div class="scene" aria-hidden="true">
	<!-- Arkadaki yumuşak aydınlanma -->
	<div class="glow glow-blue"></div>
	<div class="glow glow-cyan"></div>

	<!-- Belge katmanları: 3B perspektifte üst üste duran cam paneller -->
	<div class="stack">
		<div class="panel panel-back"></div>
		<div class="panel panel-mid">
			<!-- Panelin üzerinden geçen ışık çizgisi: tarama hissi -->
			<div class="scanline"></div>
		</div>
		<div class="panel panel-front">
			<!-- İçerik satırları: metin değil, metnin RİTMİ.
			     Başlık daha kalın, gövde satırları ince — gerçek bir
			     sayfanın silueti. Okunacak bir şey yok, sadece "belge" hissi. -->
			<div class="lines">
				<span class="head" style="width: 54%"></span>
				<span style="width: 86%"></span>
				<span style="width: 72%"></span>
				<span style="width: 90%"></span>
				<span style="width: 63%"></span>
				<span class="gap"></span>
				<span class="head" style="width: 42%"></span>
				<span style="width: 80%"></span>
				<span style="width: 88%"></span>
				<span style="width: 55%"></span>
				<span style="width: 76%"></span>
				<span class="gap"></span>
				<span style="width: 84%"></span>
				<span style="width: 48%"></span>
			</div>
			<div class="scanline scanline-delayed"></div>
		</div>
	</div>

	<!-- Katmanların arasından çıkıp yüzen içgörü kartları -->
	<div class="insight insight-a">
		<span class="dot"></span>
		<i style="width: 70%"></i>
		<i style="width: 46%"></i>
	</div>
	<div class="insight insight-b">
		<span class="dot dot-cyan"></span>
		<i style="width: 58%"></i>
		<i style="width: 74%"></i>
	</div>
	<div class="insight insight-c">
		<span class="dot"></span>
		<i style="width: 64%"></i>
	</div>

	<!-- Sürüklenen ışık parçacıkları -->
	<div class="particles">
		{#each Array(7) as _, i (i)}
			<span style="--i: {i}"></span>
		{/each}
	</div>
</div>

<style>
	.scene {
		position: relative;
		width: 100%;
		aspect-ratio: 1 / 1;
		/* perspective = 3B derinlik hissi. Küçük değer = güçlü perspektif.
		   1400px yumuşak, sinematik bir derinlik verir. */
		perspective: 1400px;
		perspective-origin: 60% 45%;
		/* Kenarlarda içerik kesilmesin diye taşmaya izin */
		overflow: visible;
		isolation: isolate;
	}

	/* ─── ARKA AYDINLANMA ───
	   Renk doğrudan değil, ÇOK yumuşak bir hâle olarak geliyor.
	   Zeminle karışsın diye blur ve düşük opaklık. */
	.glow {
		position: absolute;
		border-radius: 9999px;
		filter: blur(70px);
		pointer-events: none;
	}
	.glow-blue {
		inset: 12% 18% 30% 8%;
		background: radial-gradient(circle, var(--glow) 0%, transparent 68%);
		opacity: 0.16;
		animation: breathe 14s ease-in-out infinite;
	}
	.glow-cyan {
		inset: 40% 6% 12% 34%;
		background: radial-gradient(circle, var(--glow-soft) 0%, transparent 68%);
		opacity: 0.11;
		animation: breathe 18s ease-in-out infinite reverse;
	}

	/* ─── BELGE KATMANLARI ─── */
	.stack {
		position: absolute;
		inset: 14% 26% 18% 6%;
		transform-style: preserve-3d;
		animation: drift 24s ease-in-out infinite;
	}

	.panel {
		position: absolute;
		inset: 0;
		border-radius: 20px;
		/* Zeminden AYRIŞSIN diye biraz daha aydınlık.
		   Çok koyu olsaydı "belge" değil "boşluk" gibi okunurdu. */
		background: linear-gradient(
			148deg,
			rgb(255 255 255 / 0.1) 0%,
			rgb(255 255 255 / 0.045) 42%,
			rgb(255 255 255 / 0.075) 100%
		);
		border: 1px solid rgb(255 255 255 / 0.11);
		box-shadow:
			/* üst kenarda ince ışık: cam kalınlığı hissi */
			0 1px 0 rgb(255 255 255 / 0.11) inset,
			0 30px 70px rgb(0 0 0 / 0.45);
		/* Her panel 3B uzayda farklı derinlikte duruyor */
		transform: rotateX(6deg) rotateY(-19deg);
	}

	/* Arka panel: en derinde, en sönük */
	.panel-back {
		transform: rotateX(6deg) rotateY(-19deg) translate3d(-4%, -7%, -90px);
		opacity: 0.4;
	}
	/* Orta panel */
	.panel-mid {
		transform: rotateX(6deg) rotateY(-19deg) translate3d(-2%, -3.5%, -45px);
		opacity: 0.65;
		overflow: hidden;
	}
	/* Ön panel: en net, içerik burada. Tek backdrop-filter burada —
	   çok sayıda bulanıklık katmanı performansı düşürür. */
	.panel-front {
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		overflow: hidden;
	}

	/* ─── İÇERİK SATIRLARI ───
	   Sahte metin değil, metnin ritmi. Okunacak bir şey yok;
	   sadece "bu bir belge" hissi. */
	.lines {
		/* Sayfanın tamamına yayılıyor: sadece üstte toplanınca
		   "yarım kalmış" görünüyordu. */
		position: absolute;
		inset: 11% 13% 11% 11%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}
	.lines span {
		display: block;
		height: 4px;
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			rgb(255 255 255 / 0.2),
			rgb(255 255 255 / 0.07)
		);
	}
	/* Başlık satırı: daha kalın ve parlak */
	.lines .head {
		height: 7px;
		background: linear-gradient(
			90deg,
			rgb(255 255 255 / 0.34),
			rgb(255 255 255 / 0.12)
		);
	}
	/* Paragraf arası boşluk — ritmi kırar, daha gerçekçi */
	.lines .gap {
		height: 4px;
		background: none;
	}

	/* ─── TARAMA IŞIĞI ───
	   Panelin üzerinden yavaşça geçen ince ışık bandı.
	   "Bu yapay zeka okuyor / düşünüyor" hissinin kaynağı. */
	.scanline {
		position: absolute;
		left: -10%;
		right: -10%;
		/* Daha ince ve daha sönük: geniş/parlak olunca leke gibi
		   görünüyordu. Işık huzmesi olmalı, vurgu değil. */
		height: 54px;
		top: -20%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			rgb(106 166 255 / 0.06) 40%,
			rgb(127 211 226 / 0.11) 50%,
			rgb(106 166 255 / 0.06) 60%,
			transparent 100%
		);
		/* Kenarları yumuşat: keskin bant yerine dağılan ışık */
		filter: blur(6px);
		animation: scan 9s cubic-bezier(0.5, 0, 0.3, 1) infinite;
	}
	.scanline-delayed {
		animation-delay: 4.5s;
		animation-duration: 11s;
	}

	/* ─── İÇGÖRÜ KARTLARI ───
	   Katmanların arasından çıkıp sağa doğru yüzen küçük kartlar.
	   Ürünün yaptığı işin görsel karşılığı: belgeden bilgi çıkıyor. */
	.insight {
		position: absolute;
		display: flex;
		flex-direction: column;
		gap: 7px;
		padding: 14px 16px;
		border-radius: 15px;
		background: rgb(23 26 33 / 0.72);
		border: 1px solid var(--glass-edge);
		backdrop-filter: blur(14px) saturate(150%);
		-webkit-backdrop-filter: blur(14px) saturate(150%);
		box-shadow:
			0 1px 1px rgb(255 255 255 / 0.05) inset,
			0 18px 44px rgb(0 0 0 / 0.42);
	}
	.insight i {
		display: block;
		height: 4px;
		border-radius: 999px;
		background: rgb(255 255 255 / 0.16);
	}
	.dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
		background: var(--glow);
		box-shadow: 0 0 12px 2px rgb(106 166 255 / 0.5);
	}
	.dot-cyan {
		background: var(--glow-soft);
		box-shadow: 0 0 12px 2px rgb(127 211 226 / 0.45);
	}

	/* Üç kart, üç farklı yörünge ve zamanlama —
	   düzenli tekrar mekanik görünür, hafif kayma canlı hissettirir. */
	.insight-a {
		top: 18%;
		right: 2%;
		width: 40%;
		animation: emerge 15s cubic-bezier(0.16, 1, 0.3, 1) infinite;
	}
	.insight-b {
		top: 46%;
		right: 9%;
		width: 35%;
		animation: emerge 15s cubic-bezier(0.16, 1, 0.3, 1) infinite 3.4s;
	}
	.insight-c {
		top: 71%;
		right: 4%;
		width: 30%;
		animation: emerge 15s cubic-bezier(0.16, 1, 0.3, 1) infinite 6.8s;
	}

	/* ─── PARÇACIKLAR ───
	   Çok az, çok sönük. Fark edilmemeli, sadece hissedilmeli. */
	.particles {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.particles span {
		position: absolute;
		width: 2px;
		height: 2px;
		border-radius: 999px;
		background: var(--glow-soft);
		opacity: 0;
		left: calc(24% + var(--i) * 9%);
		top: calc(30% + var(--i) * 7%);
		animation: float 13s ease-in-out infinite;
		animation-delay: calc(var(--i) * 1.6s);
	}

	/* ═══ HAREKETLER ═══
	   Hepsi YAVAŞ (9-24 sn). Hızlı animasyon ucuz görünür;
	   yavaş ve sürekli hareket pahalı ve sakin hissettirir. */

	@keyframes breathe {
		0%,
		100% {
			opacity: 0.1;
			transform: scale(1);
		}
		50% {
			opacity: 0.2;
			transform: scale(1.09);
		}
	}

	/* Katmanların tamamı çok hafifçe salınıyor:
	   sabit durmuyor ama hareket ettiği de fark edilmiyor. */
	@keyframes drift {
		0%,
		100% {
			transform: translate3d(0, 0, 0) rotateZ(0deg);
		}
		50% {
			transform: translate3d(0, -14px, 0) rotateZ(-0.5deg);
		}
	}

	@keyframes scan {
		0% {
			top: -22%;
			opacity: 0;
		}
		12% {
			opacity: 1;
		}
		84% {
			opacity: 1;
		}
		100% {
			top: 104%;
			opacity: 0;
		}
	}

	/* Kart belirir, hafifçe yükselip sağa süzülür, solar.
	   Görünür süresi uzun (%55-75 arası tam opak) — göz yakalayabilsin. */
	@keyframes emerge {
		0% {
			opacity: 0;
			transform: translate3d(-26px, 14px, 0) scale(0.95);
		}
		14% {
			opacity: 1;
			transform: translate3d(0, 0, 0) scale(1);
		}
		68% {
			opacity: 1;
			transform: translate3d(0, -8px, 0) scale(1);
		}
		86%,
		100% {
			opacity: 0;
			transform: translate3d(16px, -22px, 0) scale(0.985);
		}
	}

	@keyframes float {
		0%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0);
		}
		30%,
		70% {
			opacity: 0.5;
		}
		100% {
			transform: translate3d(38px, -70px, 0);
		}
	}
</style>
