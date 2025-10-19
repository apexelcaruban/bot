// commands/mode.js

export default {
    name: 'mode',
    description: 'Mengatur mode operasi bot: all, group, atau private.',
    alias: ['botmode'],
    ownerOnly: true,
    /**
     * @param {import('@hassanfuad/baileys-ios-webview').WASocket} sock
     * @param {import('@hassanfuad/baileys-ios-webview').proto.IWebMessageInfo} m
     * @param {string[]} args
     * @param {import('../client.js').WAClient} client
     */
    async execute(sock, m, args, client) {
        const from = m.key.remoteJid;
        const availableModes = ['all', 'group', 'private'];
        const mode = (args[0] || '').toLowerCase();
        
        if (!availableModes.includes(mode)) {
            const currentMode = client.config.BOT_MODE;
            const text = `❌ Mode tidak valid. Gunakan: *${client.config.PREFIX}mode <all|group|private>*\n\nMode saat ini: *${currentMode}*.`;
            return sock.sendMessage(from, { text }, { quoted: m });
        }

        const newMode = mode === 'all' ? 'ALL' : mode.toUpperCase() + '_ONLY';

        // Panggil fungsi global
        const updated = await client.updateConfig('BOT_MODE', newMode); 

        if (updated) {
            const text = `✅ Mode bot berhasil diubah menjadi: *${newMode}*.\n\n_Bot akan di-reload otomatis._`;
            sock.sendMessage(from, { text }, { quoted: m });
        } else {
             sock.sendMessage(from, { text: '⚠️ Gagal mengubah mode atau mode sudah sama.' }, { quoted: m });
        }
    }
};
