import { mkdir, readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { DocumentRecord } from '$lib/types/document';
import type { Analysis } from '$lib/types/analysis';
import type { ChatMessage } from '$lib/types/chat';

/**
 * Basit, dosya tabanlı depo.
 *
 * Neden veritabanı değil? Şu aşamada sistemi görmek istiyoruz; harici
 * servis kurmak gereksiz sürtünme yaratır. Bu modülün DIŞARIYA açtığı
 * fonksiyonlar (saveDocument, listDocuments, ...) sabit kaldığı sürece
 * ileride içini Supabase'e çevirmek, çağıran kodu hiç değiştirmeden mümkün.
 *
 * Dosya yerleşimi:
 *   .data/documents/<id>.pdf            -> PDF'in kendisi
 *   .data/documents/<id>.json           -> DocumentRecord (bilgiler)
 *   .data/documents/<id>.analysis.json  -> Analysis (analiz sonucu)
 */

const DATA_DIR = join(process.cwd(), '.data', 'documents');

/** Klasör yoksa oluşturur. recursive: ara klasörleri de aç. */
async function ensureDir() {
	await mkdir(DATA_DIR, { recursive: true });
}

const pdfPath = (id: string) => join(DATA_DIR, `${id}.pdf`);
const metaPath = (id: string) => join(DATA_DIR, `${id}.json`);
const analysisPath = (id: string) => join(DATA_DIR, `${id}.analysis.json`);
const messagesPath = (id: string) => join(DATA_DIR, `${id}.messages.json`);

/* ------------------------------------------------------------------ */
/* Doküman                                                             */
/* ------------------------------------------------------------------ */

/** PDF baytlarını ve bilgi kaydını diske yazar. */
export async function saveDocument(
	record: DocumentRecord,
	pdfBytes: Uint8Array
): Promise<void> {
	await ensureDir();
	await writeFile(pdfPath(record.id), pdfBytes);
	await saveRecord(record);
}

/** Sadece bilgi kaydını günceller (ör. durum "ready" oldu). */
export async function saveRecord(record: DocumentRecord): Promise<void> {
	await ensureDir();
	// JSON.stringify(nesne, null, 2) -> okunabilir, girintili JSON üretir
	await writeFile(metaPath(record.id), JSON.stringify(record, null, 2), 'utf8');
}

/** Tek bir dokümanın bilgilerini okur. Yoksa null döner. */
export async function getDocument(id: string): Promise<DocumentRecord | null> {
	if (!existsSync(metaPath(id))) return null;
	const raw = await readFile(metaPath(id), 'utf8');
	return JSON.parse(raw) as DocumentRecord;
}

/** PDF'in ham baytlarını okur (tarayıcıya göndermek için). */
export async function readPdfBytes(id: string): Promise<Uint8Array | null> {
	if (!existsSync(pdfPath(id))) return null;
	return await readFile(pdfPath(id));
}

/** Tüm dokümanları, en yeniden eskiye doğru sıralı listeler. */
export async function listDocuments(): Promise<DocumentRecord[]> {
	await ensureDir();
	const files = await readdir(DATA_DIR);

	// Sadece bilgi dosyalarını al: "<id>.json" evet, "<id>.analysis.json" hayır
	const metaFiles = files.filter(
		(f) => f.endsWith('.json') && !f.endsWith('.analysis.json')
	);

	const records = await Promise.all(
		metaFiles.map(async (f) => {
			const raw = await readFile(join(DATA_DIR, f), 'utf8');
			return JSON.parse(raw) as DocumentRecord;
		})
	);

	// Tarihe göre tersten sırala (en yeni en üstte)
	return records.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ------------------------------------------------------------------ */
/* Analiz                                                              */
/* ------------------------------------------------------------------ */

export async function saveAnalysis(id: string, analysis: Analysis): Promise<void> {
	await ensureDir();
	await writeFile(analysisPath(id), JSON.stringify(analysis, null, 2), 'utf8');
}

export async function getAnalysis(id: string): Promise<Analysis | null> {
	if (!existsSync(analysisPath(id))) return null;
	const raw = await readFile(analysisPath(id), 'utf8');
	return JSON.parse(raw) as Analysis;
}

/* ------------------------------------------------------------------ */
/* Sohbet mesajları                                                    */
/* ------------------------------------------------------------------ */

/** Bir dokümanın tüm sohbet geçmişini okur. Hiç mesaj yoksa boş dizi. */
export async function getMessages(id: string): Promise<ChatMessage[]> {
	if (!existsSync(messagesPath(id))) return [];
	const raw = await readFile(messagesPath(id), 'utf8');
	return JSON.parse(raw) as ChatMessage[];
}

/**
 * Sohbet geçmişine yeni bir mesaj ekler.
 *
 * Tüm listeyi okuyup, sona ekleyip, hepsini geri yazıyoruz.
 * Verimsiz gibi görünse de bir dokümanın sohbeti onlarca mesajı
 * geçmez — basitlik burada doğru tercih.
 */
export async function appendMessage(id: string, message: ChatMessage): Promise<void> {
	await ensureDir();
	const messages = await getMessages(id);
	messages.push(message);
	await writeFile(messagesPath(id), JSON.stringify(messages, null, 2), 'utf8');
}
