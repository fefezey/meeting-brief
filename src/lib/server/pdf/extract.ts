import { extractText } from 'unpdf';

export interface PdfInfo {
	pageCount: number;
	/** PDF'ten çıkarılan tüm metin */
	text: string;
	/**
	 * Metin çıkarılabildi mi?
	 * false ise dosya taranmış (fotoğraf) bir belgedir.
	 */
	hasExtractableText: boolean;
}

/**
 * Sayfa başına bu kadar karakterden az metin çıkıyorsa,
 * dosyayı "taranmış" kabul ediyoruz.
 *
 * Neden 50? Taranmış bir PDF'ten genelde HİÇ metin çıkmaz, ama bazen
 * sayfa numarası veya filigran gibi birkaç karakter gelir. 50 eşiği
 * bu gürültüyü eler, gerçek metinli sayfalarda ise 50'nin çok üstüne
 * çıkılır — yani ikisini rahatça ayırır.
 */
const MIN_CHARS_PER_PAGE = 50;

/**
 * Çıkarılan metin miktarı, dosyanın "gerçekten metin içerdiği"
 * sonucuna varmak için yeterli mi?
 *
 * Ayrı bir fonksiyon olmasının sebebi TEST EDİLEBİLİRLİK: bu kuralı
 * denemek için gerçek bir PDF dosyasına ihtiyaç kalmıyor, sadece iki
 * sayı veriyoruz. Saf fonksiyon = aynı girdi, hep aynı çıktı.
 */
export function hasEnoughText(textLength: number, pageCount: number): boolean {
	if (pageCount <= 0) return false;
	return textLength >= pageCount * MIN_CHARS_PER_PAGE;
}

/**
 * PDF baytlarını okuyup sayfa sayısı ve metin bilgisini döndürür.
 *
 * NOT: Bu metin, Claude'a GÖNDERİLEN şey değil — Claude PDF'in kendisini
 * okuyor (tabloları ve grafikleri de görerek). Buradaki metni sadece
 * sayfa sayısı, taranmış belge tespiti ve önizleme için kullanıyoruz.
 */
export async function extractPdfInfo(pdfBytes: Uint8Array): Promise<PdfInfo> {
	/*
	 * ÖNEMLİ: Kütüphaneye bir KOPYA veriyoruz.
	 *
	 * Neden? Arka plandaki pdf.js, kendisine verilen bayt dizisinin
	 * SAHİPLİĞİNİ alır ve işi bitince onu boşaltır ("detached" hale
	 * getirir). Orijinali verseydik, bu fonksiyondan sonra çağıran kod
	 * PDF'i diske yazamazdı — dizi artık boş olurdu.
	 *
	 * Kopyayı burada, modülün içinde alıyoruz ki çağıran taraf bu
	 * tuzağı hiç bilmek zorunda kalmasın.
	 */
	const copy = new Uint8Array(pdfBytes);

	// mergePages: true -> tüm sayfaların metnini tek bir metinde birleştir
	const { totalPages, text } = await extractText(copy, { mergePages: true });

	// Arka arkaya gelen boşluk/satır sonlarını tek boşluğa indir.
	// PDF'ten çıkan metin genelde çok dağınık olur.
	const cleaned = text.replace(/\s+/g, ' ').trim();

	return {
		pageCount: totalPages,
		text: cleaned,
		hasExtractableText: hasEnoughText(cleaned.length, totalPages)
	};
}

/** Arayüzde göstermek için metnin başından kısa bir parça alır. */
export function makePreview(text: string, maxChars = 300): string {
	if (text.length <= maxChars) return text;
	return text.slice(0, maxChars).trimEnd() + '…';
}
