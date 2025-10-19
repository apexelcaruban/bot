// client.js
import fs from "fs/promises";
import path from "path";
import chalk from "chalk";
import { pathToFileURL } from "url";

/**
 * Mendapatkan timestamp lokal dalam Timezone Asia/Jakarta (WIB)
 */
function getLocalTime() {
    return new Date().toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });
}

/**
 * Decode JID lid ke format standar WhatsApp (628xxxx@s.whatsapp.net)
 */
function decodeJid(jid) {
    if (!jid) return jid;
    if (jid.endsWith("@lid")) {
        // Konversi ke @s.whatsapp.net agar seragam
        return jid.replace("@lid", "@s.whatsapp.net");
    }
    if (/:\d+@/gi.test(jid)) {
        // Format MD (multi-device) kadang 628xxxx:123@s.whatsapp.net
        const [user] = jid.split("@")[0].split(":");
        return `${user}@s.whatsapp.net`;
    }
    return jid;
}

/**
 * Normalize nomor dari jid (tanpa domain dan karakter non-digit)
 */
function normalizeNumber(jid) {
    if (!jid) return "";
    return jid.replace(/[^0-9]/g, "");
}

/**
 * Kelas utama WAClient
 */
export class WAClient {
    constructor(currentConfig) {
        this.commands = new Map();
        this.aliases = new Map();
        this.config = currentConfig;
        this.prefix = currentConfig.PREFIX;

        // Fungsi placeholder (akan diisi dari index.js)
        this.updateConfig = async () => {
            console.error(chalk.red("[ERROR] updateConfig tidak terpasang."));
            return false;
        };
        this.reloadAllModules = async () => {
            console.error(chalk.red("[ERROR] reloadAllModules tidak terpasang."));
            return false;
        };
    }

    /**
     * Memuat semua file command dari folder commands
     */
    async loadCommands() {
        console.log(`[LOADER] Memuat perintah dari ${this.config.COMMANDS_DIR}...`);
        try {
            const commandFiles = await fs.readdir(this.config.COMMANDS_DIR);
            for (const file of commandFiles) {
                if (file.endsWith(".js")) {
                    const resolvedPath = path.resolve(this.config.COMMANDS_DIR, file);
                    const fileUrl = pathToFileURL(resolvedPath);
                    const { default: command } = await import(fileUrl.href + `?t=${Date.now()}`);

                    if (command.name && command.execute) {
                        this.commands.set(command.name.toLowerCase(), command);
                        if (command.alias && Array.isArray(command.alias)) {
                            command.alias.forEach(alias => {
                                this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
                            });
                        }
                    }
                }
            }
            console.log(`[LOADER] Total ${this.commands.size} perintah dimuat.`);
        } catch (error) {
            console.error(chalk.red(`[ERROR] Gagal memuat commands:`), error.message);
        }
    }

    /**
     * Reload command individual
     */
    async reloadCommand(filePath, type) {
        if (!["unlink", "change", "add"].includes(type)) return;
        const filename = path.basename(filePath);
        const cmdName = filename.replace(/\.js$/, "").toLowerCase();

        const oldCommand = this.commands.get(cmdName);
        if (oldCommand) {
            if (oldCommand.alias) oldCommand.alias.forEach(alias => this.aliases.delete(alias.toLowerCase()));
            this.commands.delete(cmdName);
        }

        try {
            const resolvedPath = path.resolve(filePath);
            const fileUrl = pathToFileURL(resolvedPath);
            const { default: command } = await import(fileUrl.href + `?t=${Date.now()}`);
            if (command.name && command.execute) {
                this.commands.set(command.name.toLowerCase(), command);
                if (command.alias) {
                    command.alias.forEach(alias =>
                        this.aliases.set(alias.toLowerCase(), command.name.toLowerCase())
                    );
                }
            }
        } catch (error) {
            console.error(chalk.red(`[ERROR] Gagal memuat ulang /${cmdName}:`), error.message);
        }
    }

    /**
     * Menangani pesan masuk dan menjalankan command
     */
    handleMessage(sock, m, fullText, groupCache, currentConfig) {
        const from = m.key.remoteJid;
        let messageBody = fullText;
        let commandID = "";

        // Deteksi command dari button, list, atau template reply
        if (m.message?.buttonsResponseMessage) {
            commandID = m.message.buttonsResponseMessage.selectedButtonId;
        } else if (m.message?.listResponseMessage) {
            commandID = m.message.listResponseMessage.singleSelectReply?.selectedRowId;
        } else if (m.message?.templateButtonReplyMessage) {
            commandID = m.message.templateButtonReplyMessage.selectedId;
        }

        if (commandID) messageBody = commandID;

        // --- Parsing command ---
        if (messageBody.startsWith(this.prefix)) {
            const parts = messageBody.slice(this.prefix.length).trim().split(/\s+/);
            const cmdName = parts[0];
            const args = parts.slice(1);
            if (!cmdName) return false;

            const actualCmdName = this.aliases.get(cmdName) || cmdName;
            const command = this.commands.get(actualCmdName);

            if (command) {
                const timestamp = getLocalTime();
                const senderJid = decodeJid(m.key.participant || m.key.remoteJid);
                const cleanSender = normalizeNumber(senderJid);

                // === Filter OWNER ===
                if (command.ownerOnly) {
                    const ownerList = currentConfig.OWNER_JIDS.map(n => normalizeNumber(n));
                    const isOwner = ownerList.includes(cleanSender);
                    if (!isOwner) {
                        sock.sendMessage(from, { text: currentConfig.MESSAGE.OWNER_ONLY }, { quoted: m });
                        console.log(
                            chalk.red(`[CMD BLOCK] OWNER_ONLY | ${this.prefix}${command.name} | FROM: ${cleanSender}`)
                        );
                        return true;
                    }
                }

                console.log(chalk.yellow(`[${timestamp}] [CMD] ${this.prefix}${command.name} | FROM: ${cleanSender}`));

                try {
                    command.execute(sock, m, args, this);
                } catch (error) {
                    console.error(chalk.red(`[ERROR] Saat menjalankan /${command.name}:`), error);
                    sock.sendMessage(from, { text: "❌ Terjadi error saat menjalankan perintah." }, { quoted: m });
                }

                return true;
            }
        }

        // === Default /menu atau /help ===
        const lowerBody = messageBody.toLowerCase();
        if (lowerBody === this.prefix + "help" || lowerBody === this.prefix + "menu") {
            const timestamp = getLocalTime();
            const senderJid = decodeJid(m.key.participant || m.key.remoteJid);
            const cleanSender = normalizeNumber(senderJid);
            const ownerList = currentConfig.OWNER_JIDS.map(n => normalizeNumber(n));
            const isOwnerRequest = ownerList.includes(cleanSender);

            console.log(chalk.greenBright(`[${timestamp}] [HELP] FROM: ${cleanSender}`));

            const commandList = Array.from(this.commands.values())
                .filter(cmd => !cmd.ownerOnly || isOwnerRequest)
                .map(cmd => {
                    const aliases = cmd.alias ? ` (${cmd.alias.join(", ")})` : "";
                    return `*${this.prefix}${cmd.name}*${aliases}: ${cmd.description || "Tidak ada deskripsi"}`;
                })
                .join("\n");

            const reply =
                `*Daftar Perintah Bot ${currentConfig.TITLE}*\n\n${commandList}\n\n${currentConfig.FOOTER}` +
                (isOwnerRequest ? "\n\nAnda adalah *OWNER BOT*" : "");

            sock.sendMessage(from, { text: reply }, { quoted: m });
            return true;
        }

        return false;
    }
}
