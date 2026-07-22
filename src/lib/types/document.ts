export type DocumentStatus =
  | "uploading"
  | "processing" // Claude Files API'ye yükleniyor
  | "analyzing" // Analiz Paketi üretiliyor
  | "ready"
  | "failed";

export interface DocumentRecord {
  id: string;
  title: string;
  /** Supabase Storage içindeki yol */
  storagePath: string;
  /** Claude Files API file_id — sohbette document block olarak referans verilir */
  anthropicFileId: string | null;
  pageCount: number | null;
  sizeBytes: number;
  status: DocumentStatus;
  errorMessage: string | null;
  createdAt: string;
}

/** Claude API limitleri — upload sırasında kontrol edilir */
export const MAX_PDF_BYTES = 32 * 1024 * 1024;
export const MAX_PDF_PAGES = 600;
