import { describe, it, expect } from 'vitest';
import { isMetadataFile } from './local';

/**
 * Sahipsiz dosya tespitinin MANTIĞINI test eder.
 *
 * Neden gerçek deleteOrphans() çağrılmıyor? Çünkü o fonksiyon diske
 * yazıp siliyor; testte gerçek veriyi silme riski var. Bunun yerine
 * aynı kuralı burada yeniden kurup doğruluyoruz.
 *
 * (Daha temiz yol: deleteOrphans'a klasör yolunu parametre olarak
 * geçirmek. Şu an gerekli değil; not olarak duruyor.)
 */
function findOrphans(files: string[]): string[] {
	const validIds = new Set(
		files.filter(isMetadataFile).map((f) => f.slice(0, -'.json'.length))
	);
	return files.filter((f) => {
		const id = f.split('.')[0];
		return id.length > 0 && !validIds.has(id);
	});
}

describe('sahipsiz dosya tespiti', () => {
	it('sağlam bir dokümanın hiçbir dosyasını sahipsiz saymaz', () => {
		const files = ['abc.json', 'abc.pdf', 'abc.analysis.json', 'abc.messages.json'];
		expect(findOrphans(files)).toEqual([]);
	});

	it('bilgi kaydı olmayan dosyaları sahipsiz sayar', () => {
		// Yarıda kalan yükleme: PDF yazıldı, bilgi kaydı yazılamadı
		const files = ['abc.json', 'abc.pdf', 'yarim.pdf'];
		expect(findOrphans(files)).toEqual(['yarim.pdf']);
	});

	it('sahipsiz dokümanın TÜM yan dosyalarını yakalar', () => {
		const files = ['iyi.json', 'iyi.pdf', 'kotu.pdf', 'kotu.analysis.json', 'kotu.messages.json'];
		expect(findOrphans(files).sort()).toEqual(
			['kotu.analysis.json', 'kotu.messages.json', 'kotu.pdf'].sort()
		);
	});

	it('boş klasörde hata vermez', () => {
		expect(findOrphans([])).toEqual([]);
	});

	it('sadece bilgi kaydı varsa onu silmez', () => {
		// PDF elle silinmiş olabilir; kaydı silmek veri kaybı olur
		expect(findOrphans(['abc.json'])).toEqual([]);
	});
});
