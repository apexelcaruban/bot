// Complex Interactive Message Command
export default {
    name: "ia_complex",
    alias: ["iia"],
    description: "Menguji tombol interaktif canggih (Copy, Webview, Single Select).",
    async execute(sock, m, text) {
        const from = m.key.remoteJid;
        
        const interactiveButtons = [
            // 1. Copy Button (Menyalin teks ke clipboard)
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: 'Salin Kode',
                    copy_code: 'BOT-CODE-2025' // Teks yang akan disalin
                })
            },
            // 2. Webview Button (Membuka browser in-app)
            {
                name: 'open_webview',
                buttonParamsJson: JSON.stringify({
                    title: 'Buka Web',
                    link: {
                        in_app_webview: true, 
                        url: 'https://www.google.com'
                    }
                })
            },
            // 3. Single Select (Dropdown/List modern)
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: 'Pilih Kategori',
                    sections: [
                        {
                            title: 'Layanan',
                            rows: [
                                { title: 'Dukungan', id: 'select_support' },
                                { title: 'Billing', id: 'select_billing' }
                            ]
                        }
                    ]
                })
            }
        ];

        const interactiveMessage = {
            text: '*Fitur Interaktif Canggih*',
            title: 'Test Menu',
            subtitle: 'Menguji tombol Copy, Webview, dan Single Select.', 
            footer: 'Pilih opsi Anda.',
            interactiveButtons: interactiveButtons, 
        };

        try {
            await sock.sendMessage(from, interactiveMessage, { quoted: m });
            console.log("✅ Pesan Interactive Canggih terkirim.");
        } catch (error) {
            console.error("❌ Gagal mengirim Interactive/Flows:", error);
            await sock.sendMessage(from, { 
                text: "❌ Gagal mengirim pesan Interaktif Canggih. (Memerlukan Akun Bisnis/API resmi)" 
            }, { quoted: m });
        }
    }
};

