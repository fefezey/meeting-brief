import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';

/**
 * Claude'a bağlanmak için elimizde bir kimlik bilgisi var mı?
 *
 * Üç yol da kabul edilir — SDK hangisini bulursa onu kullanır:
 *   1. ANTHROPIC_API_KEY     .env dosyasındaki klasik API anahtarı
 *   2. ANTHROPIC_AUTH_TOKEN  kısa ömürlü belirteç
 *   3. OAuth profili         "ant auth login" ile oluşturulan
 *
 * Neden dosya sistemine bakıyoruz? OAuth'ta ortam değişkeni YOK —
 * kimlik bilgisi işletim sisteminin ayar klasöründe duruyor. Sadece
 * ANTHROPIC_API_KEY'e baksaydık, OAuth kurulu olsa bile uygulama
 * sonsuza kadar örnek veri modunda kalırdı.
 */
export function hasCredentials(): boolean {
	if (env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN) return true;
	return hasOAuthProfile();
}

function hasOAuthProfile(): boolean {
	// ANTHROPIC_CONFIG_DIR ile klasör değiştirilebilir; yoksa varsayılan
	const configDir = env.ANTHROPIC_CONFIG_DIR || join(homedir(), '.config', 'anthropic');
	const credentialsDir = join(configDir, 'credentials');

	try {
		// Klasör var ama BOŞSA kimlik yok demektir
		// (ör. "ant auth logout" sonrası)
		return existsSync(credentialsDir) && readdirSync(credentialsDir).length > 0;
	} catch {
		// Okuma izni yoksa vb. — yok say, örnek veriye düş
		return false;
	}
}
