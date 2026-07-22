/**
 * Terminalden PDF analizi testi.
 *
 * Kullanım:  npm run analyze -- ./rapor.pdf
 *
 * Amaç: web arayüzü yazmadan önce "Claude gerçekten işe yarar bir analiz
 * çıkarıyor mu?" sorusunu ucuza cevaplamak.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { analyzeDocument } from '../src/lib/server/anthropic/analyze';
import { MAX_PDF_BYTES } from '../src/lib/types/document';

// .env dosyasındaki değişkenleri process.env'e yükler.
// (Node 22'nin yerleşik özelliği — ek kütüphane gerekmiyor)
try {
	process.loadEnvFile('.env');
} catch {
	// .env yoksa sorun değil; anahtar kabuktan da gelmiş olabilir
}

// process.argv = terminalden gelen kelimeler.
// [0] node'un yolu, [1] betiğin yolu, [2] bizim verdiğimiz dosya adı
const pdfPath = process.argv[2];

if (!pdfPath) {
	console.error('Kullanım: npm run analyze -- ./rapor.pdf');
	process.exit(1);
}

if (!process.env.ANTHROPIC_API_KEY) {
	console.error('ANTHROPIC_API_KEY bulunamadı. .env dosyasına ekle:');
	console.error('  ANTHROPIC_API_KEY=sk-ant-...');
	process.exit(1);
}

const absolutePath = resolve(pdfPath);
const pdfBuffer = readFileSync(absolutePath);

if (pdfBuffer.byteLength > MAX_PDF_BYTES) {
	console.error(
		`Dosya çok büyük: ${(pdfBuffer.byteLength / 1024 / 1024).toFixed(1)} MB ` +
			`(Claude sınırı 32 MB)`
	);
	process.exit(1);
}

// PDF ikili (binary) bir dosya; API'ye metin olarak taşımak için base64'e çeviriyoruz.
const pdfBase64 = pdfBuffer.toString('base64');

console.log(`Analiz ediliyor: ${absolutePath}`);
console.log(`Boyut: ${(pdfBuffer.byteLength / 1024).toFixed(0)} KB`);
console.log('Claude düşünüyor... (uzun dokümanlarda 1-2 dakika sürebilir)\n');

const startedAt = Date.now();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const analysis = await analyzeDocument(client, pdfBase64);
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

/* ---------- Sonucu okunabilir şekilde yazdır ---------- */

const line = '─'.repeat(60);

console.log(line);
console.log('ÖZET');
console.log(line);
console.log(analysis.summary);

console.log(`\n${line}`);
console.log('ANA MADDELER');
console.log(line);
analysis.keyPoints.forEach((point, i) => console.log(`${i + 1}. ${point}`));

console.log(`\n${line}`);
console.log('KİLİT RAKAMLAR');
console.log(line);
for (const figure of analysis.keyFigures) {
	console.log(`• ${figure.label}: ${figure.value}`);
	console.log(`  ${figure.context}`);
}

console.log(`\n${line}`);
console.log('RİSKLİ NOKTALAR');
console.log(line);
const severityLabel = { high: 'YÜKSEK', medium: 'ORTA', low: 'DÜŞÜK' } as const;
for (const risk of analysis.risks) {
	const page = risk.pageHint ? ` (s.${risk.pageHint})` : '';
	console.log(`[${severityLabel[risk.severity]}] ${risk.title}${page}`);
	console.log(`  ${risk.detail}`);
}

console.log(`\n${line}`);
console.log('TOPLANTIDA SORULABİLECEK SORULAR');
console.log(line);
analysis.suggestedQuestions.forEach((q, i) => console.log(`${i + 1}. ${q}`));

console.log(`\nTamamlandı — ${seconds} saniye`);
