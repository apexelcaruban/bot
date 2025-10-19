// commands/status.js

export default {
    name: 'status',
    aliases: ['online', 'offline', 'presence'],
    description: 'Mengatur status kehadiran default bot (online/offline). Cth: !status online',
    ownerOnly: true,
    /**
     * @param {import('@hassanfuad/baileys-ios-webview').WASocket} sock
     * @param {import('@hassanfuad/baileys-ios-webview').proto.IWebMessageInfo} m
     * @param {string[]} args
     * @param {import('../client.js').WAClient} client
     */
    async execute(sock, m, args, client) {
        const from = m.key.remoteJid;
        
        // 1. Ambil nama command/alias yang digunakan user.
        let userInputCmd = (m.aliasUsed || m.commandName).toLowerCase();
        
        let targetInput; // Input akhir yang harus diproses (e.g., 'online', 'off', 'unavailable')

        if (userInputCmd === 'status' || userInputCmd === 'presence') {
            // Jika user mengetik '!status' atau '!presence', ambil argumen pertama.
            targetInput = (args[0] || '').toLowerCase();
        } else {
            // Jika user mengetik alias ('!online' atau '!offline'), gunakan alias tersebut.
            targetInput = userInputCmd;
            
            // Khusus alias: Jika ada argumen kedua, gunakan argumen tersebut untuk override.
            // Contoh: !online off -> targetInput: 'off'
            if (args.length > 0) {
                targetInput = args[0].toLowerCase();
            }
        }

        // --- MAPPING INPUT KE NILAI PRESENCE BAILYS ---
        let newPresence;
        let displayAction; // Nilai yang akan ditampilkan ('online' atau 'offline')
        
        const validOnlineInputs = ['online', 'on', 'available'];
        const validOfflineInputs = ['offline', 'off', 'unavailable'];

        if (validOnlineInputs.includes(targetInput)) {
            newPresence = 'available';
            displayAction = 'online'; 
        } else if (validOfflineInputs.includes(targetInput)) {
            newPresence = 'unavailable';
            displayAction = 'offline'; 
        } else {
            // Input tidak valid
            const currentStatus = client.config.DEFAULT_PRESENCE;
            const text = `❌ Input tidak valid: *${targetInput}*. Status saat ini: *${currentStatus}*.\n\nGunakan: *${client.config.PREFIX}status [online/offline]* atau langsung *${client.config.PREFIX}online*.`;
            return sock.sendMessage(from, { text }, { quoted: m });
        }


        // --- EKSEKUSI DAN UPDATE CONFIG ---
        // Panggil updateConfig (akan memicu hot reload)
        const updated = await client.updateConfig('DEFAULT_PRESENCE', newPresence); 

        if (updated) {
            const text = `✅ Status kehadiran default bot berhasil diubah menjadi: *${displayAction.toUpperCase()}*.\n\n_Bot akan di-reload otomatis untuk menerapkan status standby ini._`;
            sock.sendMessage(from, { text }, { quoted: m });

            // Kirim update presence langsung ke chat saat ini sebagai konfirmasi visual
            await sock.sendPresenceUpdate(newPresence, from);
        } else {
             sock.sendMessage(from, { text: '⚠️ Gagal mengubah status atau status sudah sama.' }, { quoted: m });
        }
    }
};

