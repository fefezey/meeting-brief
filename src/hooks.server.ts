import { deleteOrphans } from '$lib/server/storage/local';

/**
 * hooks.server.ts — SvelteKit'in sunucu tarafı "kanca" dosyası.
 *
 * Bu dosyanın gövdesi sunucu başladığında BİR KEZ çalışır. Açılışta
 * yapılması gereken işler için doğru yer burasıdır.
 *
 * Burada: yarıda kalmış yüklemelerden artan sahipsiz dosyaları
 * temizliyoruz. Uygulama onları zaten görmüyor (liste sadece bilgi
 * kayıtlarını okur), ama diskte yer kaplıyorlar.
 *
 * Neden açılışta? Çünkü o an hiçbir yükleme sürmüyor — "yarıda kalmış"
 * ile "şu anda devam eden" karışma riski yok.
 */
const removed = await deleteOrphans();
if (removed > 0) {
	console.log(`[temizlik] ${removed} sahipsiz dosya silindi`);
}
