// config.js

export const CONFIG = {
    // --- Pengaturan Sesi & Koneksi ---
    OWNER_JIDS: [
        '6285732607746@s.whatsapp.net', // JID utama (Nomor telepon)
        '30116428140554@lid'             // JID perangkat tertaut (LID ID)
    ], 
    BOT_NUMBER: '6289671172929', 
    PAIRING_CODE: '12345678', 
    SESSION_DIR: './session', 
    
    // PENTING: Prefix dan Path
    PREFIX: '.', 
    COMMANDS_DIR: './commands', 
    
    // Header Browser
    BROWSER_NAME: 'Ubuntu',
    BROWSER_VERSION: '20.0.04',
    
    // --- Pengaturan Tampilan & Pesan ---
    TITLE: "Apexel Caruban ✅",
    DESCRIPTION: "Piknik Jadi Makin Aesthetic✨",
    AUTHOR_URL: 'https://www.kyuurzy.tech',
    FOOTER: "Apexel Caruban",
    PACKNAME: '-wabot', 
    
    // Status Bot
    STATUS: {
        PUBLIC: true,
        TERMINAL_LOGS: true, 
        REACT_SW: true, 
        // markOnlineOnConnect di index.js akan mengambil nilai default jika tidak ada di sini
    },

    // =========================================================
    // >>> BARU: STATUS KONTROL BOT DARI COMMAND <<<
    // =========================================================
    // Mode pesan: 'ALL', 'GROUP_ONLY', atau 'PRIVATE_ONLY'
    BOT_MODE: 'PRIVATE_ONLY', 
    
    // Status pesan dibaca (read receipt): true atau false
    AUTO_READ: false, 
    
    // Kontrol Presence (Online/Offline): 'available' atau 'unavailable'
    DEFAULT_PRESENCE: 'available',
    
    // =========================================================

    // Pesan Akses Ditolak
    MESSAGE: {
        OWNER_ONLY: "❌ Maaf, perintah ini hanya untuk *Owner* bot.",
        GROUP_ONLY: "❌ Perintah ini hanya bisa digunakan di *Grup*.",
        ADMIN_ONLY: "❌ Perintah ini hanya untuk *Admin* grup.",
        PRIVATE_ONLY: "❌ Perintah ini khusus untuk *Private Chat*."
    },

    // Metadata & Sosial Media
    THUMBNAIL_URL: "https://files.catbox.moe/kzph46.jpg",
    NEWSLETTER_ID: "120363297591152843@newsletter",
    
    SOCIAL_MEDIA: {
        YouTube: "https://youtube.com/@kyuurzy",
        GitHub: "https://github.com/kiuur",
        Telegram: "https://www.instagram.com/apexel.caruban",
        ChannelWA: "https://whatsapp.com/channel/0029Vaeqym9IHphHwvXk9k1s"
    },

    // Pengaturan Waktu
    TIMEZONE: 'Asia/Jakarta', 
};

