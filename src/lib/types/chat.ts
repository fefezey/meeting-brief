/** Claude citations API'sinden gelen sayfa referansı */
export interface Citation {
  citedText: string;
  startPage: number;
  endPage: number;
}

export interface ChatMessage {
  id: string;
  documentId: string;
  role: "user" | "assistant";
  content: string;
  /** Sadece assistant mesajlarında dolu olur */
  citations: Citation[];
  createdAt: string;
}
