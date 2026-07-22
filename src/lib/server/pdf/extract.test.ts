import { describe, it, expect } from 'vitest';
import { hasEnoughText, makePreview } from './extract';

describe('hasEnoughText — taranmış PDF tespiti', () => {
	it('normal metinli sayfayı metin olarak sayar', () => {
		// Tipik bir metin sayfası binlerce karakter içerir
		expect(hasEnoughText(3000, 1)).toBe(true);
		expect(hasEnoughText(60_000, 20)).toBe(true);
	});

	it('taranmış (fotoğraf) sayfayı metinsiz sayar', () => {
		// Taranmış PDF'ten genelde hiç metin çıkmaz
		expect(hasEnoughText(0, 10)).toBe(false);
		// Bazen filigran/sayfa numarası gibi birkaç karakter gelir —
		// bu gürültü metin sayılmamalı
		expect(hasEnoughText(120, 10)).toBe(false);
	});

	it('eşiği sayfa başına ölçer, toplam üzerinden değil', () => {
		// 500 karakter 1 sayfa için bol, 100 sayfa için yok denecek kadar az.
		// Eşik sabit olsaydı uzun taranmış belgeler "metinli" sayılırdı.
		expect(hasEnoughText(500, 1)).toBe(true);
		expect(hasEnoughText(500, 100)).toBe(false);
	});

	it('sıfır sayfayı güvenli şekilde ele alır', () => {
		// Sıfıra bölme veya "0 >= 0 dolayısıyla true" tuzağına düşmemeli
		expect(hasEnoughText(0, 0)).toBe(false);
		expect(hasEnoughText(1000, 0)).toBe(false);
	});
});

describe('makePreview', () => {
	it('kısa metni olduğu gibi bırakır', () => {
		expect(makePreview('Kısa bir metin')).toBe('Kısa bir metin');
	});

	it('uzun metni keser ve üç nokta ekler', () => {
		const uzun = 'a'.repeat(500);
		const sonuc = makePreview(uzun, 100);
		expect(sonuc).toHaveLength(101); // 100 karakter + '…'
		expect(sonuc.endsWith('…')).toBe(true);
	});

	it('kesme noktasındaki boşluğu temizler', () => {
		// "...kelime " gibi boşlukla biten bir kesme çirkin görünür
		const sonuc = makePreview('abc def ghi', 4);
		expect(sonuc).toBe('abc…');
	});

	it('tam sınırdaki metni kesmez', () => {
		expect(makePreview('abcde', 5)).toBe('abcde');
	});
});
