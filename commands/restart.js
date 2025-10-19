// commands/restart.js

export default {
    name: 'restart',
    description: 'Memuat ulang seluruh modul bot (Hot Reload).',
    ownerOnly: true,
    /**
     * @param {import('@hassanfuad/baileys-ios-webview').WASocket} sock
     * @param {import('@hassanfuad/baileys-ios-webview').proto.IWebMessageInfo} m
     * @param {string[]} args
     * @param {import('../client.js').WAClient} client
     */
    async execute(sock, m, args, client) {
        const from = m.key.remoteJid;
        
        await sock.sendMessage(from, { text: '🔄 Memuat ulang seluruh modul bot (Hot Reload)...' }, { quoted: m });
        
        // Panggil fungsi global yang di-pass dari index.js
        await client.reloadAllModules();
        
        // Pesan sukses akan dikirim setelah reload selesai (setelah proses messages.upsert kembali)
        // Kita tidak bisa kirim balasan di sini karena koneksi akan terputus sebentar
    }
};
