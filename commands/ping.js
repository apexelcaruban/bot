// Ping Command
export default {
    name: "ping",
    alias: ["p"],
    description: "Membalas dengan pong dan menampilkan kecepatan respons (latency).",
    async execute(sock, m, text, groupCache, currentConfig) {
        const from = m.key.remoteJid;
        
        // 1. Catat waktu saat command diterima
        const startTime = Date.now(); 

        // 2. Kirim pesan awal yang akan di-edit (placeholder)
        const placeholderMessage = await sock.sendMessage(from, { text: "Menghitung kecepatan..." }, { quoted: m });

        // 3. Hitung selisih waktu
        const endTime = Date.now();
        const latency = endTime - startTime; // Hasil dalam milidetik (ms)
        const latencySeconds = (latency / 1000).toFixed(2); // Hasil dalam detik (s)
        
        // 4. Buat pesan hasil
        const responseText = `*P O N G !* 🚀\n\n` + 
                             `*Kecepatan Respons:* ${latency} ms\n` +
                             `*Waktu Latency:* ${latencySeconds} detik`;

        // 5. Edit pesan placeholder dengan hasil akhir
        try {
            await sock.sendMessage(from, { 
                text: responseText,
                edit: placeholderMessage.key, // Mengedit pesan yang dikirim sebelumnya
            });
        } catch (error) {
             // Fallback jika edit gagal (misal, Baileys tidak mendukung edit di platform tertentu)
             await sock.sendMessage(from, { text: responseText + "\n\n(Gagal mengedit pesan, dikirim sebagai pesan baru.)" });
        }
    }
};

