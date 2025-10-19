// commands/read.js

export default {
    name: 'read',
    description: 'Mengatur status pesan dibaca (Read Receipt) bot. (on/off)',
    alias: ['autoread'],
    ownerOnly: true,
    /**
     * @param {import('@hassanfuad/baileys-ios-webview').WASocket} sock
     * @param {import('@hassanfuad/baileys-ios-webview').proto.IWebMessageInfo} m
     * @param {string[]} args
     * @param {import('../client.js').WAClient} client
     */
    async execute(sock, m, args, client) {
        const from = m.key.remoteJid;
        const action = (args[0] || '').toLowerCase();
        
        if (!['on', 'off'].includes(action)) {
            const currentStatus = client.config.AUTO_READ ? 'ON' : 'OFF';
            const text = `❌ Perintah tidak valid. Gunakan: *${client.config.PREFIX}read <on|off>*\n\nStatus saat ini: *${currentStatus}*.`;
            return sock.sendMessage(from, { text }, { quoted: m });
        }

        const newStatus = action === 'on';

        // Panggil fungsi global
        const updated = await client.updateConfig('AUTO_READ', newStatus); 

        if (updated) {
            const text = `✅ Status *Auto Read* bot berhasil diubah menjadi: *${action.toUpperCase()}*.\n\n_Bot akan di-reload otomatis._`;
            sock.sendMessage(from, { text }, { quoted: m });
        } else {
             sock.sendMessage(from, { text: '⚠️ Gagal mengubah status atau status sudah sama.' }, { quoted: m });
        }
    }
};
