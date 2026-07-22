import type { Analysis } from '$lib/types/analysis';
import type { DocumentRecord } from '$lib/types/document';

/**
 * Sahte analiz üreticisi.
 *
 * Neden var? Arayüzü geliştirirken gerçek AI çağrısı yapmak yavaş ve
 * ücretlidir. Bu fonksiyon anında, bedava ve her seferinde aynı cevabı
 * döndürür — böylece ekran tasarımına odaklanabiliriz.
 *
 * ÖNEMLİ: İmzası gerçek üreticiyle birebir aynı (aynı girdi, aynı çıktı
 * tipi). Bu sayede gerçek API'ye geçiş tek satırlık bir değişiklik olur.
 */
export function mockAnalysis(doc: DocumentRecord): Analysis {
	// Sahte olduğu belli olsun diye dokümanın gerçek bilgilerini
	// metne karıştırıyoruz — böylece "veri gerçekten bu dosyaya mı ait?"
	// sorusunu ekranda anında görebiliriz.
	const pages = doc.pageCount ?? 0;

	return {
		summary:
			`[ÖRNEK VERİ] "${doc.title}" adlı ${pages} sayfalık doküman için ` +
			`örnek analiz. Gerçek AI bağlantısı henüz kurulmadı; bu metin ` +
			`arayüzün nasıl görüneceğini test etmek için üretildi. Gerçek ` +
			`analizde burada raporun 3-5 cümlelik yönetici özeti yer alacak.`,

		keyPoints: [
			'Gelir geçen yılın aynı dönemine göre %12 azaldı',
			'Operasyonel giderler bütçenin %8 üzerinde seyrediyor',
			'İki büyük müşteri sözleşmesi önümüzdeki çeyrekte yenilenecek',
			'Yeni ürün hattı planlanandan bir çeyrek gecikti',
			'Nakit rezervi 14 aylık işletme giderini karşılıyor'
		],

		keyFigures: [
			{
				label: 'Yıllık gelir',
				value: '₺142,8 milyon',
				context: 'Geçen yıl ₺162,3 milyondu — %12 düşüş'
			},
			{
				label: 'Brüt kâr marjı',
				value: '%31,4',
				context: 'Sektör ortalaması %38 — belirgin şekilde altında'
			},
			{
				label: 'Nakit rezervi',
				value: '₺48,2 milyon',
				context: 'Mevcut harcama hızıyla yaklaşık 14 ay yeter'
			}
		],

		risks: [
			{
				title: 'Müşteri yoğunlaşması',
				detail:
					'Gelirin %47\'si sadece iki müşteriden geliyor. Birinin ' +
					'kaybı ciddi gelir açığı yaratır.',
				severity: 'high',
				pageHint: 12
			},
			{
				title: 'Gider artışı bütçeyi aşıyor',
				detail:
					'Operasyonel giderler üç çeyrektir bütçenin üzerinde. ' +
					'Raporda düzeltici bir eylem planı belirtilmemiş.',
				severity: 'high',
				pageHint: 18
			},
			{
				title: 'Ürün lansmanı gecikmesi',
				detail:
					'Yeni ürün hattı bir çeyrek gecikti; gelir tahmini ' +
					'buna göre güncellenmemiş görünüyor.',
				severity: 'medium',
				pageHint: 24
			},
			{
				title: 'Kur riski açıklanmamış',
				detail:
					'Gelirin bir kısmı dövizli ancak kur riskine karşı ' +
					'korunma yapılıp yapılmadığı belirtilmemiş.',
				severity: 'low',
				pageHint: null
			}
		],

		suggestedQuestions: [
			'İki büyük müşterinin sözleşmeleri yenilenmezse gelir tahmini ne olur?',
			'Operasyonel giderler üç çeyrektir bütçeyi aşıyor — hangi somut adım atıldı?',
			'Brüt marj sektör ortalamasının 7 puan altında; bunun ana sebebi fiyatlama mı, maliyet mi?',
			'Ürün gecikmesi gelir tahminine yansıtıldı mı? Yansıtılmadıysa neden?',
			'Dövizli gelirler için korunma (hedge) stratejisi var mı?',
			'14 aylık nakit rezervi hangi senaryolara göre hesaplandı?'
		]
	};
}
