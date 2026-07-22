import { describe, it, expect } from 'vitest';
import { isMetadataFile } from './local';

/**
 * Testlerin okunuşu:
 *   describe -> konu başlığı
 *   it       -> tek bir davranış ("... yapmalı")
 *   expect   -> beklenti
 *
 * Amaç sadece "çalışıyor mu" değil, davranışı YAZIYA DÖKMEK.
 * Test dosyası aynı zamanda dokümantasyondur.
 */

describe('isMetadataFile', () => {
	it('doküman bilgi dosyasını kabul eder', () => {
		expect(isMetadataFile('abc.json')).toBe(true);
		expect(isMetadataFile('7836ff6c-174a-4f5d-bd06-355e94214076.json')).toBe(true);
	});

	it('analiz dosyasını reddeder', () => {
		expect(isMetadataFile('abc.analysis.json')).toBe(false);
	});

	/*
	 * GERİLEME TESTİ (regression test)
	 *
	 * Bu tam olarak yaşanmış bir hata. Sohbet özelliği eklendiğinde
	 * ".messages.json" dosyaları filtreden geçti, doküman kaydı sanıldı
	 * ve ana sayfa 500 hatası verdi.
	 *
	 * Gerileme testi = düzeltilmiş bir hatanın geri gelmediğini garanti
	 * eden test. Bir hatayı iki kez yaşamamanın en ucuz yolu.
	 */
	it('sohbet geçmişi dosyasını reddeder (geçmişte ana sayfayı çökertmişti)', () => {
		expect(isMetadataFile('abc.messages.json')).toBe(false);
	});

	it('ileride eklenecek yeni türleri de reddeder', () => {
		// Filtre "bilinen kötüleri say" değil "sadece iyiyi kabul et"
		// mantığında olduğu için bunlar kendiliğinden eleniyor
		expect(isMetadataFile('abc.citations.json')).toBe(false);
		expect(isMetadataFile('abc.embeddings.json')).toBe(false);
		expect(isMetadataFile('abc.v2.backup.json')).toBe(false);
	});

	it('json olmayan dosyaları reddeder', () => {
		expect(isMetadataFile('abc.pdf')).toBe(false);
		expect(isMetadataFile('abc')).toBe(false);
		expect(isMetadataFile('.DS_Store')).toBe(false);
	});

	it('bozuk isimleri reddeder', () => {
		expect(isMetadataFile('.json')).toBe(false); // adı boş
		expect(isMetadataFile('')).toBe(false);
	});
});
