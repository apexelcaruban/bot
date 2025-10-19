// command/lokasi.js

const APEXEL_LOCATION = {
    degreesLatitude: -7.504476,
    degreesLongitude: 111.703752,
    name: 'Apexel Caruban',
    address: 'Rumah di pertigaan a/n Riska, RT.03/RW.01, Tulung, Kec. Saradan, Kab. Madiun, Jawa Timur',
    url: 'https://maps.google.com/?cid=691112769252454610' 
};

const LOKASI_ALIASES = ["lokasi", "map"];

const handler = async (sock, m, args, groupCache, currentConfig) => {
    // Command handler sudah dipanggil karena aliasnya cocok.
    
    const client = sock; 
    m.chat = m.key.remoteJid;

    try {
        await client.sendMessage(m.chat, {
            location: APEXEL_LOCATION,
            contextInfo: {
                caption: `📍 *Lokasi Apexel Caruban*\n${APEXEL_LOCATION.address}\n\n[Klik di atas untuk navigasi]`,
            }
        }, { quoted: m });
    } catch (e) {
        console.error("Error di lokasi:", e);
        await client.sendMessage(m.chat, { text: "⚠️ Gagal mengirim info Lokasi." }, { quoted: m });
    }
};

const command = {
    name: 'lokasi',
    alias: LOKASI_ALIASES,
    tags: ['info'],
    help: ['lokasi'],
    description: 'Mengirimkan pin lokasi Apexel Caruban.',
    execute: handler
};

export default command;
