import Anthropic from '@anthropic-ai/sdk';

/**
 * SvelteKit sunucusunun kullandığı Claude bağlantısı.
 *
 * DİKKAT: Yapıcıya bilerek hiçbir şey vermiyoruz.
 *
 * SDK kimlik bilgisini kendisi arar ve İLK bulduğunu kullanır:
 *   1. ANTHROPIC_API_KEY       (ortam değişkeni)
 *   2. ANTHROPIC_AUTH_TOKEN    (ortam değişkeni)
 *   3. OAuth profili           ("ant auth login" ile oluşan)
 *
 * Bu yüzden hem API anahtarıyla hem OAuth ile aynı kod çalışır.
 * apiKey'i elle verseydik OAuth yolu hiç denenmezdi.
 *
 * Bu dosya sadece gerçek AI modunda yükleniyor (dinamik import ile),
 * bkz. lib/server/analysis/index.ts
 */
export const anthropic = new Anthropic();

export { MODEL, FILES_BETA } from './config';
