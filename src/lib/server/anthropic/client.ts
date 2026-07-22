import Anthropic from '@anthropic-ai/sdk';
import { env } from '$env/dynamic/private';

/**
 * SvelteKit sunucusunun kullandığı Claude bağlantısı.
 *
 * $env/dynamic/private -> SvelteKit'in gizli ortam değişkeni kapısı.
 * Neden "process.env" değil? Bu modülü yanlışlıkla tarayıcı tarafındaki
 * bir dosyadan import edersen SvelteKit projeyi DERLEMEZ. Yani API
 * anahtarının kullanıcıya sızması kaza eseri bile mümkün olmaz.
 *
 * Terminal betikleri bu dosyayı KULLANMAZ; kendi bağlantısını kurar.
 * (bkz. scripts/analyze-local.ts)
 */
if (!env.ANTHROPIC_API_KEY) {
	throw new Error('ANTHROPIC_API_KEY tanımlı değil — .env dosyasını kontrol et');
}

export const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

export { MODEL, FILES_BETA } from './config';
