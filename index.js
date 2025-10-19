// index.js

import baileys, { useMultiFileAuthState, delay, DisconnectReason, fetchLatestBaileysVersion, makeWASocket } from "@hassanfuad/baileys-ios-webview"
import Pino from "pino"
import NodeCache from "node-cache"
import chokidar from "chokidar" 
import { pathToFileURL } from 'url'; 
import chalk from 'chalk'; 
import path from 'path'; 
import fs from 'fs/promises'; // PASTIKAN INI ADA

// --- DEKLARASI GLOBAL UNTUK HOT RELOAD ---
let CONFIG;         
let WAClient;       
let client;         
let handleSapa;     
let currentConfig;  
let isReloading = false; 

// --- INISIALISASI & STATE GLOBAL ---
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false })
// CACHE ANTI-DUPLIKAT: Simpan ID pesan selama 2 detik
const messageIdCache = new NodeCache({ stdTTL: 2, useClones: false }); 

// --- FUNGSI UTILITY ---
/**
 * Mendapatkan timestamp lokal dalam Timezone Asia/Jakarta (WIB)
 */
function getLocalTime() {
    return new Date().toLocaleTimeString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    });
}

function extractMessageText(m) {
    const message = m.message
    if (!message) return ''

    if (message.conversation) return message.conversation
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text
    if (message.imageMessage?.caption) return message.imageMessage.caption
    if (message.videoMessage?.caption) return message.videoMessage.caption
    if (message.ephemeralMessage?.message) {
        return extractMessageText({ message: message.ephemeralMessage.message })
    }
    return ''
}

/**
 * Mengambil ID command dari pesan interaktif (tombol, list)
 */
function extractCommandId(m) {
    if (m.message?.buttonsResponseMessage) {
        return m.message.buttonsResponseMessage.selectedButtonId;
    }
    if (m.message?.listResponseMessage) {
        return m.message.listResponseMessage.singleSelectReply?.selectedRowId;
    }
    if (m.message?.templateButtonReplyMessage) {
        return m.message.templateButtonReplyMessage.selectedId;
    }
    return null;
}


/**
 * Mengambil nama command dari teks pesan
 */
function getCommandName(text, prefix) {
    // >>> PERBAIKAN: Pastikan 'text' adalah string yang tidak kosong <<<
    if (!text || typeof text !== 'string') {
        return null; 
    }
    
    if (text.startsWith(prefix)) {
        return text.slice(prefix.length).trim().split(/\s+/)[0];
    }
    return null;
}


/**
 * Mengatur kehadiran (Presence) bot secara per chat.
 */
async function setPresence(sock, type, jid) {
    await sock.sendPresenceUpdate(type, jid);
}

/**
 * Memilih emoji acak dari daftar
 */
function randomEmoji() {
    const emojis = ['🔥']; // Menambah variasi emoji
    return emojis[Math.floor(Math.random() * emojis.length)];
}


/**
 * Memaksa Node.js untuk menghapus cache modul dan mengimpor ulang semua file yang terkait
 */
async function reloadAllModules() {
    if (isReloading) return;
    isReloading = true; 

    try {
        // --- 1. RELOAD CONFIG ---
        const configUrl = pathToFileURL(path.resolve('./config.js')).href + `?t=${Date.now()}`;
        const configModule = await import(configUrl);
        CONFIG = configModule.CONFIG;
        currentConfig = CONFIG;

        // --- 2. RELOAD CLIENT CLASS ---
        const clientUrl = pathToFileURL(path.resolve('./client.js')).href + `?t=${Date.now()}`;
        const clientModule = await import(clientUrl);
        WAClient = clientModule.WAClient;
        
        // --- 3. RELOAD SAPA HANDLER ---
        const sapaUrl = pathToFileURL(path.resolve('./events/sapa.js')).href + `?t=${Date.now()}`;
        const sapaModule = await import(sapaUrl);
        handleSapa = sapaModule.handleFirstTimeChat;
        
        // --- 4. RELOAD COMMANDS (Melalui Instance Client Baru) ---
        // Panggil konstruktor dengan currentConfig
        client = new WAClient(currentConfig); 
        
        await client.loadCommands();
        
        // PASANG FUNGSI GLOBAL KE INSTANCE CLIENT
        client.updateConfig = updateConfig; 
        client.reloadAllModules = reloadAllModules; 
        
        client.prefix = currentConfig.PREFIX; 
        
        console.log(chalk.yellow.bold(`[RELOAD] ✅ SELURUH BOT DIMUAT ULANG. Prefix: ${currentConfig.PREFIX}`));

    } catch (error) {
        console.error(chalk.bgRed.white(`❌ GAGAL MELAKUKAN HOT RELOAD UNIVERSAL:`), error);
    } finally {
        isReloading = false;
    }
}

/**
 * Mengupdate properti di config.js dan memicu reload.
 * @param {string} key Kunci yang akan diupdate.
 * @param {any} value Nilai baru.
 */
async function updateConfig(key, value) {
    const configPath = path.resolve('./config.js');
    let content = await fs.readFile(configPath, 'utf-8');
    
    // Regex untuk menemukan dan mengganti nilai dari kunci (key)
    const regex = new RegExp(`(export const CONFIG = {[^]*?${key}:\\s*)[^,}]*?([,}])`, 's');
    
    // Konversi nilai ke string yang sesuai
    let stringValue;
    if (typeof value === 'string') {
        stringValue = `'${value}'`;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
        stringValue = value.toString();
    } else {
        stringValue = String(value);
    }

    const newContent = content.replace(regex, `$1${stringValue}$2`);
    
    if (content !== newContent) {
        await fs.writeFile(configPath, newContent, 'utf-8');
        console.log(chalk.yellow(`[CONFIG] ${key} diperbarui menjadi ${value}. Memicu reload...`));
        await reloadAllModules();
        return true;
    }
    return false;
}


/**
 * Menyiapkan monitor file (Hot Reload) menggunakan chokidar
 */
function setupHotReload() {
    
    const filesToWatch = [
        './config.js',
        './client.js',
        './events/sapa.js',
        currentConfig.COMMANDS_DIR,
        './events'
    ];
    
    const watcher = chokidar.watch(filesToWatch, { 
        ignored: /(^|[\/\\])\../, 
        persistent: true 
    });
    
    watcher.on('change', (filePath) => {
        if (isReloading) return;
        console.log(chalk.yellow(`[WATCHER] Perubahan terdeteksi di: ${filePath}`));
        reloadAllModules();
    });
    
    watcher.on('add', (filePath) => {
        if (isReloading) return;
        console.log(chalk.green(`[WATCHER] File baru terdeteksi: ${filePath}`));
        reloadAllModules();
    });
}


// --- FUNGSI UTAMA BOT ---

async function startBot() {
  console.clear(); 
  
  await reloadAllModules(); 
  setupHotReload();             
  
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(chalk.green(`[START] Versi WA: v${version.join('.')}, Terbaru: ${isLatest}`));

  const { state, saveCreds } = await useMultiFileAuthState(currentConfig.SESSION_DIR);

  const sock = makeWASocket({
    auth: state,
    logger: Pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: [currentConfig.BROWSER_NAME, "Chrome", currentConfig.BROWSER_VERSION], 
    version,
    markOnlineOnConnect: currentConfig.STATUS?.markOnlineOnConnect !== undefined ? currentConfig.STATUS.markOnlineOnConnect : true, 
    cachedGroupMetadata: async (jid) => groupCache.get(jid), 
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update
    const timestamp = getLocalTime(); 
    
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(chalk.red(`[KONEK] Putus (${timestamp}). Reconnect: ${shouldReconnect}`));
      if (shouldReconnect) startBot();
    } else if (connection === "open") {
      console.log(chalk.bold(`✅ Connected to WhatsApp as ${sock.user?.name || currentConfig.TITLE}! (${timestamp})`));
    } else if (connection === "connecting") {
      console.log(chalk.yellow(`[KONEK] ⏳ Mencoba terhubung... (${timestamp})`));
    }
  });
  
  sock.ev.on("groups.update", async ([event]) => {
      if (event.id) {
        const metadata = await sock.groupMetadata(event.id);
        groupCache.set(event.id, metadata);
      }
  });

  await delay(2000);

  if (!state.creds.registered) {
    const code = await sock.requestPairingCode(currentConfig.BOT_NUMBER);
    console.log(chalk.magenta(`[INFO] Pairing Code: ${code}`));
  }

  // Listener pesan masuk (Command Handler)
  sock.ev.on("messages.upsert", async (upsert) => {
    const m = upsert.messages[0];
    if (m.key.fromMe || !m.message) return;

    const from = m.key.remoteJid;
    const messageId = m.key.id;
    const isGroup = from.endsWith('@g.us');
    
    // ------------------------------------
    // FILTER BOT MODE
    const BOT_MODE = currentConfig.BOT_MODE || 'ALL'; 
    if (BOT_MODE === 'GROUP_ONLY' && !isGroup) {
        console.log(chalk.yellow(`[MODE BLOCK] Bot mode: GROUP_ONLY. Mengabaikan pesan dari PVT.`));
        return; 
    }
    if (BOT_MODE === 'PRIVATE_ONLY' && isGroup) {
        console.log(chalk.yellow(`[MODE BLOCK] Bot mode: PRIVATE_ONLY. Mengabaikan pesan dari Grup.`));
        return; 
    }
    // ------------------------------------

    // --- 0. ANTI SPAM DAN STALE MESSAGES ---
    const MAX_AGE_SECONDS = 300; 
    
    if (messageIdCache.has(messageId)) {
        console.log(chalk.red(`[SPAM BLOCK] Pesan ID ${messageId} duplikat/sudah diproses.`));
        return;
    }
    messageIdCache.set(messageId, true);

    const messageAgeSeconds = Date.now() / 1000 - m.messageTimestamp;
    if (messageAgeSeconds > MAX_AGE_SECONDS) {
        console.log(chalk.red(`[STALE BLOCK] Pesan ID ${messageId} terlalu tua (${messageAgeSeconds.toFixed(0)} detik).`));
        return; 
    }
    // ------------------------------------

    // --- FITUR BARU: AUTO-REACT STATUS & NEWSLETTER ---
    const IS_STATUS_OR_NEWSLETTER = from === 'status@broadcast' || from.endsWith('@newsletter');
    
    if (IS_STATUS_OR_NEWSLETTER) {
        const senderJid = m.key.participant || m.key.remoteJid; 
        
        if (senderJid !== sock.user?.id) { 
             try {
                const targetJid = IS_STATUS_OR_NEWSLETTER ? 'status@broadcast' : from;
                
                await sock.sendMessage(targetJid, { 
                    react: {
                        text: randomEmoji(), 
                        key: m.key 
                    }
                }, {
                    statusJidList: IS_STATUS_OR_NEWSLETTER ? [senderJid] : undefined 
                });
                console.log(chalk.magenta(`[AUTOREACT] Bereaksi pada ${IS_STATUS_OR_NEWSLETTER ? 'Status' : 'Newsletter'} dari ${senderJid.split('@')[0]}`));
            } catch (error) {
                console.error(chalk.yellow(`[AUTOREACT] Gagal bereaksi:`), error.message);
            }
            return; 
        }
    }
    // -------------------------------------

    const fullText = extractMessageText(m);
    const commandID = extractCommandId(m);

    // Tentukan command name (jika ada)
    const cmdName = getCommandName(fullText, client.prefix) || getCommandName(commandID, client.prefix);
    
    // Cek apakah pesan ini berpotensi memicu respons
    const isCommandFormat = cmdName && (client.commands.get(cmdName) || client.aliases.has(cmdName));
    const isInteractiveReply = m.message?.buttonsResponseMessage || m.message?.listResponseMessage;
    const isGreeting = fullText.toLowerCase() === 'hai' || fullText.toLowerCase() === 'p';
    const shouldRespond = isCommandFormat || isInteractiveReply || isGreeting;
    
    // Tentukan status default untuk menutup koneksi
    const presenceType = currentConfig.DEFAULT_PRESENCE || 'available';

    try {
        // Terapkan AUTO_READ
        if (currentConfig.AUTO_READ) {
            await sock.readMessages([m.key]);
        }

        // HANYA KIRIM STATUS 'MENGETIK' JIKA DIPREDIKSI AKAN ADA RESPON
        if (shouldRespond) {
            await setPresence(sock, 'composing', from); 
        }

        // --- 1. HANDLE COMMANDS DULU ---
        const isCommand = client.handleMessage(sock, m, fullText, groupCache, currentConfig);
        
        if (isCommand) {
            await setPresence(sock, presenceType, from); // Hentikan typing
            return; 
        }

        // --- 2. HANDLE SAPAAN ---
        const sapaanSent = await handleSapa(sock, m, currentConfig); 
        if (sapaanSent) {
            await setPresence(sock, presenceType, from); // Hentikan typing
            return; 
        }

        // --- 3. UNIVERSAL LOGGING UNTUK PESAN NON-COMMAND & NON-SAPAAN (PVT/GROUP) ---
        const pushName = m.pushName || 'User';
        const timestamp = getLocalTime(); 
        const type = isGroup ? 'GROUP' : 'PVT';
        const msgSnippet = fullText.length > 30 ? fullText.substring(0, 30) + '...' : fullText;
        const msgType = fullText ? 'TEXT' : Object.keys(m.message)[0].toUpperCase();
        
        console.log(chalk.reset(
            `[${timestamp}] [${type}] ${chalk.cyan(pushName)} (${chalk.blue.dim(from)}): ${chalk.white(msgSnippet || `(${msgType})`)}`
        ));
        // -----------------------------------------------------------------------------------
        
        // Penanganan Balasan Interaktif (Fallback)
        if (isInteractiveReply) {
             await setPresence(sock, presenceType, from); 
             return; 
        }
        
        // --- Logika Non-Command (HAI/P) ---
        if (isGreeting) {
             await sock.sendMessage(m.key.remoteJid, { text: `Hai! Saya *${currentConfig.TITLE}*. Ada yang bisa saya bantu?` }, { quoted: m });
             await setPresence(sock, presenceType, from);
             return;
        }
        
        // JIKA 'composing' terlanjur dikirim (karena shouldRespond=true)
        // TETAPI tidak ada balasan di atas yang me-return, kita harus menghentikannya di sini.
        if (shouldRespond) {
            await setPresence(sock, presenceType, from);
        }
        
    } catch (e) {
        // ERROR HANDLING
        console.error(chalk.red(`[FATAL] Error saat memproses pesan:`), e);
        if (e.code) {
             console.error(chalk.bgRed.white(`[FS ERROR CODE]`), e.code);
        }
        // Pastikan status typing dihentikan saat error
        await setPresence(sock, presenceType, from); 
    }
  });
}

startBot();

