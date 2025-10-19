// command/pricelist.js

const PRICELIST_TEXT = `*Pricelist Apexel Caruban*

• *PAKET A* — Rp30.000/hari  
  - Lensa Apexel  
  - Remote Bluetooth  

• *PAKET B* — Rp50.000/hari  
  - Lensa Apexel  
  - Remote Bluetooth  
  - Tripod 2 Meter  

• *PAKET C* — Rp70.000/hari  
  - Lensa Apexel  
  - Remote Bluetooth  
  - Tripod 2 Meter  
  - Kursi Lipat 2 pcs  

• *PAKET LENGKAP* — Rp75.000/hari  
  - Lensa Apexel  
  - Remote Bluetooth  
  - Tripod 2 Meter  
  - Kursi Lipat 2 pcs  
  - Meja Lipat  

• *PAKET 1* — Rp20.000/hari  
  - Kursi Lipat 2 pcs  

• *PAKET 2* — Rp25.000/hari  
  - Kursi Lipat 2 pcs  
  - Meja Lipat  

• *PAKET 3* — Rp30.000/hari  
  - Kursi Lipat 2 pcs  
  - Meja Lipat  
  - Tripod 2 Meter  

• *TIKAR PIKNIK* — Rp15.000/hari  
  - Ukuran 200x200cm, muat 6–8 orang  

• *KOMPOR PORTABLE* — Rp50.000/hari  
  - Include gas, koper, wajan anti lengket, capit, & sumpit  

• *SEWA SATUAN* (per hari)  
  - Tripod 2m — Rp10.000  
  - Kursi Lipat — Rp12.000  
  - Meja Lipat — Rp8.000  
  - Kacamata — Rp5.000  
  - Topi Bucket — Rp5.000  
  - Keranjang Piknik — Rp10.000`;

const PRICELIST_ALIASES = ["pricelist", "price", "harga"];

const handler = async (sock, m, args, groupCache, currentConfig) => {
    // Command handler sudah dipanggil karena aliasnya cocok.
    // Kita hanya perlu menjalankan aksi.
    
    const client = sock; 
    m.chat = m.key.remoteJid;

    try {
        await client.sendMessage(m.chat, { text: PRICELIST_TEXT }, { quoted: m });
    } catch (e) {
        console.error("Error di pricelist:", e);
        await client.sendMessage(m.chat, { text: "⚠️ Gagal mengirim Pricelist." }, { quoted: m });
    }
};

const command = {
    name: 'pricelist',
    alias: PRICELIST_ALIASES,
    tags: ['info'],
    help: ['pricelist'],
    description: 'Menampilkan daftar harga sewa Apexel Caruban.',
    execute: handler
};

export default command;
