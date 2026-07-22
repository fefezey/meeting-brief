/**
 * Claude ile ilgili sabitler.
 *
 * Bu dosya bilerek ortam değişkeni (env) İÇERMEZ — böylece hem SvelteKit
 * sunucusundan hem de terminal betiklerinden sorunsuz import edilebilir.
 */

/** Kullandığımız model. Uzun doküman muhakemesi + 1M bağlam penceresi. */
export const MODEL = 'claude-opus-4-8';

/** PDF'i bir kez yükleyip file_id ile tekrar kullanmak için (Aşama 1). */
export const FILES_BETA = 'files-api-2025-04-14';
