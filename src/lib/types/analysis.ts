import { z } from "zod";

/**
 * "Analiz Paketi" — PDF yüklenir yüklenmez tek bir structured-output
 * çağrısıyla üretilir. Toplantı öncesi hazırlık ekranının tamamı budur.
 */

export const RiskSchema = z.object({
  title: z.string().describe("Riskin kısa başlığı"),
  detail: z.string().describe("Neden risk olduğunun 1-2 cümlelik açıklaması"),
  severity: z.enum(["low", "medium", "high"]),
  pageHint: z.number().nullable().describe("İlgili sayfa numarası, bilinmiyorsa null"),
});

export const KeyFigureSchema = z.object({
  label: z.string().describe("Rakamın ne olduğu, ör. 'Yıllık gelir'"),
  value: z.string().describe("Rakam, birimiyle birlikte"),
  context: z.string().describe("Kısa yorum — artış/azalış, karşılaştırma"),
});

export const AnalysisSchema = z.object({
  summary: z.string().describe("Raporun 3-5 cümlelik yönetici özeti"),
  keyPoints: z.array(z.string()).describe("En önemli 5-8 madde"),
  keyFigures: z.array(KeyFigureSchema).describe("Dikkat çeken sayısal veriler"),
  risks: z.array(RiskSchema).describe("Riskli veya dikkat gerektiren noktalar"),
  suggestedQuestions: z
    .array(z.string())
    .describe("Toplantıda sorulabilecek 5-7 keskin soru"),
});

export type Risk = z.infer<typeof RiskSchema>;
export type KeyFigure = z.infer<typeof KeyFigureSchema>;
export type Analysis = z.infer<typeof AnalysisSchema>;
