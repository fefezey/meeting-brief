export type DocumentStatus =
	| 'processing' // metin çıkarılıyor
	| 'analyzing' // analiz üretiliyor
	| 'ready' // hazır
	| 'failed'; // hata

export interface DocumentRecord {
	/** Benzersiz kimlik — dosya adlarında da kullanılır */
	id: string;
	/** Kullanıcının yüklediği dosyanın adı */
	title: string;
	sizeBytes: number;
	pageCount: number | null;
	/**
	 * PDF'ten metin çıkabildi mi?
	 * false ise dosya büyük ihtimalle TARANMIŞ (fotoğraf) bir belgedir.
	 */
	hasExtractableText: boolean;
	/** Metnin ilk birkaç yüz karakteri — arayüzde önizleme için */
	textPreview: string;
	status: DocumentStatus;
	errorMessage: string | null;
	/** ISO 8601 tarih metni, ör. "2026-07-22T13:45:00.000Z" */
	createdAt: string;
}

/* --- Claude API limitleri: yükleme sırasında kontrol edilir --- */
export const MAX_PDF_BYTES = 32 * 1024 * 1024; // 32 MB
export const MAX_PDF_PAGES = 600;
