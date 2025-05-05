"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* ------------------------------------------------------------------ */
/* 0. Imports                                                          */
/* ------------------------------------------------------------------ */
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const LobbyManager_1 = require("./lib/LobbyManager");
dotenv.config(); // loads DISCORD_TOKEN
/* ------------------------------------------------------------------ */
/* 2. Instantiate client & load commands                               */
/* ------------------------------------------------------------------ */
const client = new discord_js_1.Client({
    intents: [discord_js_1.GatewayIntentBits.Guilds],
});
client.commands = new discord_js_1.Collection();
const commandsPath = node_path_1.default.join(__dirname, 'commands');
for (const file of node_fs_1.default.readdirSync(commandsPath).filter((f) => f.endsWith('.ts'))) {
    const { data, execute } = require(node_path_1.default.join(commandsPath, file));
    client.commands.set(data.name, { data, execute });
}
console.log('Loaded commands:', [...client.commands.keys()]);
/* ------------------------------------------------------------------ */
/* 3. Ready event                                                      */
/* ------------------------------------------------------------------ */
client.once(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`🤖 Logged in as ${bot.user.tag}`);
});
/* ------------------------------------------------------------------ */
/* 4. Unified interaction handler                                      */
/* ------------------------------------------------------------------ */
client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    // ─── Buttons first ─────────────────────────────────────────────────
    if (interaction.isButton()) {
        const btn = interaction;
        try {
            yield btn.deferUpdate(); // ACK within 3s
            // Parse & fetch lobby
            const [action, lobbyId] = btn.customId.split(':');
            console.log(`Button ${action} on lobby ${lobbyId}`);
            const lobby = LobbyManager_1.lobbyManager.get(lobbyId);
            if (!lobby)
                return;
            // Join/Leave logic
            if (action === 'join') {
                if (!lobby.players.includes(btn.user.id) &&
                    lobby.players.length < lobby.size) {
                    lobby.players.push(btn.user.id);
                }
            }
            else if (action === 'leave') {
                lobby.players = lobby.players.filter((id) => id !== btn.user.id);
            }
            // Update the embed
            const rawChannel = yield client.channels.fetch(lobby.channelId);
            const channel = rawChannel;
            const msg = yield channel.messages.fetch(lobby.id);
            const embed = msg.embeds[0].toJSON();
            embed.title = `${lobby.game.toUpperCase()} lobby (${lobby.players.length}/${lobby.size})`;
            embed.description =
                lobby.players.map((id) => `<@${id}>`).join('\n') || '*Empty*';
            yield msg.edit({ embeds: [embed] });
            // Ping when full
            if (lobby.players.length === lobby.size) {
                yield channel.send(`🚀 Lobby full! ${lobby.players.map((id) => `<@${id}>`).join(' ')}`);
            }
        }
        catch (err) {
            console.error('Button handler error:', err);
        }
        return; // done with button
    }
    // ─── Slash commands next ───────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
        const slash = interaction;
        const command = client.commands.get(slash.commandName);
        if (!command)
            return;
        try {
            yield command.execute(slash);
        }
        catch (err) {
            console.error('Slash handler error:', err);
            const replyOpts = {
                content: '💥 Something went wrong.',
                ephemeral: true,
            };
            if (slash.deferred || slash.replied) {
                yield slash.followUp(replyOpts);
            }
            else {
                yield slash.reply(replyOpts);
            }
        }
    }
}));
/* ------------------------------------------------------------------ */
/* 5. Log in                                                           */
/* ------------------------------------------------------------------ */
client.login(process.env.DISCORD_TOKEN);
