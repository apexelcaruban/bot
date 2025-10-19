// command/pembayaran.js

const PEMBAYARAN_ALIASES = ["pembayaran", "payment", "qris", "bayar"];

const handler = async (sock, m, args, groupCache, currentConfig) => {
    // Command handler sudah dipanggil karena aliasnya cocok.
    
    const client = sock; 
    m.chat = m.key.remoteJid;
    
    try {
        await client.sendMessage(m.chat, {
            image: { url: "https://files.catbox.moe/ngvt07.jpg" },
            caption: "Scan kode QRIS berikut untuk melakukan pembayaran. . ."
        }, { quoted: m });
    } catch (e) {
        console.error("Error di pembayaran:", e);
        await client.sendMessage(m.chat, { text: "⚠️ Gagal mengirim info Pembayaran." }, { quoted: m });
    }
};

const command = {
    name: 'pembayaran',
    alias: PEMBAYARAN_ALIASES,
    tags: ['info'],
    help: ['pembayaran'],
    description: 'Mengirimkan kode QRIS untuk pembayaran.',
    execute: handler
};

export default command;
