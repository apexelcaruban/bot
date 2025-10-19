// command/peraturan.js

const PERATURAN_TEXT = `📌 *Syarat & Ketentuan Sewa di Apexel Caruban*

1. *Proses Penyewaan* 📝  
   Penyewaan hanya dapat dilakukan berdasarkan kesepakatan antara penyewa dan pihak Apexel. Penyewa wajib menyerahkan KTP/KTA/KARTUPELAJAR/SIM sebagai jaminan resmi saat melakukan booking.

2. *Pembayaran* 💳  
   Pembayaran dilakukan *di awal* (sebelum barang digunakan), sesuai harga yang telah disepakati bersama.  
   - Untuk pembayaran *non-tunai* (transfer), harap *mengirim bukti transfer yang jelas* kepada admin.  
   - Pembayaran dianggap sah setelah dana diterima oleh pihak Apexel.

3. *Durasi Sewa & Pengembalian* ⏰  
   - Durasi sewa berlaku *24 jam* per hari, terhitung dari waktu serah terima barang.  
   - Keterlambatan pengembalian dikenakan denda sebesar *Rp3.000 per jam*.  
   - Barang wajib dikembalikan dalam kondisi *baik, bersih, lengkap*, dan tanpa kerusakan.  
   - Pengecekan kondisi akan dilakukan saat pengembalian.

4. *Tanggung Jawab Penyewa* ⚖️  
   Penyewa bertanggung jawab penuh atas *kerusakan, kehilangan, atau kekurangan perlengkapan* selama masa sewa.  
   - Biaya penggantian dikenakan sesuai *nilai barang* atau *biaya perbaikan*.  
   - Kerusakan karena kelalaian tetap menjadi tanggung jawab penyewa, meskipun tidak disengaja.

5. *Pembatalan & Perubahan Jadwal* 🔄  
   - Pembatalan hanya dapat dilakukan *minimal 24 jam* sebelum waktu pengambilan.  
   - Pembatalan mendadak (<24 jam) dapat menyebabkan *uang sewa hangus*.  
   - Perubahan jadwal hanya dapat dilakukan jika barang masih tersedia dan mendapat persetujuan dari pihak Apexel.

6. *Komunikasi & Konfirmasi* 📲  
   - Segala bentuk komunikasi seperti booking, konfirmasi pembayaran, dan perubahan jadwal *harus melalui kontak resmi Apexel*.  
   - Harap tidak melakukan perubahan sepihak tanpa pemberitahuan dan persetujuan.

📝 *Catatan Penting:* Syarat dan ketentuan ini dapat berubah sewaktu-waktu tanpa pemberitahuan. Pastikan selalu mengecek versi terbaru sebelum menyewa.

🚨 *MENYEWA = SETUJU DENGAN SELURUH SYARAT DI ATAS* ⚠️`;

const PERATURAN_ALIASES = ["peraturan", "carasewa", "sk", "syarat"];

const handler = async (sock, m, args, groupCache, currentConfig) => {
    // Command handler sudah dipanggil karena aliasnya cocok.
    
    const client = sock; 
    m.chat = m.key.remoteJid;

    try {
        await client.sendMessage(m.chat, { text: PERATURAN_TEXT }, { quoted: m });
    } catch (e) {
        console.error("Error di peraturan:", e);
        await client.sendMessage(m.chat, { text: "⚠️ Gagal mengirim Peraturan." }, { quoted: m });
    }
};

const command = {
    name: 'peraturan',
    alias: PERATURAN_ALIASES,
    tags: ['info'],
    help: ['peraturan'],
    description: 'Menampilkan syarat dan ketentuan sewa.',
    execute: handler
};

export default command;
