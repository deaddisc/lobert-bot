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
const discord_js_1 = require("discord.js");
const dotenv = __importStar(require("dotenv"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const LobbyManager_1 = require("./lib/LobbyManager");
dotenv.config(); // loads DISCORD_TOKEN, CLIENT_ID, GUILD_ID
/* ------------------------------------------------------------------ */
/* 2. Instantiate client and commands collection                      */
/* ------------------------------------------------------------------ */
const client = new discord_js_1.Client({ intents: [discord_js_1.GatewayIntentBits.Guilds] });
client.commands = new discord_js_1.Collection();
/* ------------------------------------------------------------------ */
/* 3. Load command modules (.js in production, .ts in dev)             */
/* ------------------------------------------------------------------ */
const commandsPath = node_path_1.default.join(__dirname, 'commands');
const commandFiles = node_fs_1.default
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
    const command = require(node_path_1.default.join(commandsPath, file));
    client.commands.set(command.data.name, command);
}
console.log('Loaded commands:', [...client.commands.keys()]);
/* ------------------------------------------------------------------ */
/* 4. Event handlers                                                   */
/* ------------------------------------------------------------------ */
client.once(discord_js_1.Events.ClientReady, (bot) => {
    console.log(`🤖 Logged in as ${bot.user.tag}`);
});
client.on(discord_js_1.Events.InteractionCreate, (interaction) => __awaiter(void 0, void 0, void 0, function* () {
    // Handle buttons
    if (interaction.isButton()) {
        yield handleButton(interaction);
        return;
    }
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command)
            return;
        try {
            yield command.execute(interaction);
        }
        catch (error) {
            console.error('Command execution error:', error);
            if (interaction.deferred || interaction.replied) {
                yield interaction.followUp({ content: '💥 Something went wrong.', ephemeral: true });
            }
            else {
                yield interaction.reply({ content: '💥 Something went wrong.', ephemeral: true });
            }
        }
    }
}));
function handleButton(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield interaction.deferUpdate();
            const [action, lobbyId] = interaction.customId.split(':');
            const lobby = LobbyManager_1.lobbyManager.get(lobbyId);
            if (!lobby)
                return;
            if (action === 'join') {
                if (!lobby.players.includes(interaction.user.id) && lobby.players.length < lobby.size) {
                    lobby.players.push(interaction.user.id);
                }
            }
            else if (action === 'leave') {
                lobby.players = lobby.players.filter((id) => id !== interaction.user.id);
            }
            const channel = yield interaction.client.channels.fetch(lobby.channelId);
            if (!(channel === null || channel === void 0 ? void 0 : channel.isTextBased()))
                return;
            const msg = yield channel.messages.fetch(lobby.id);
            const embed = msg.embeds[0].toJSON();
            embed.title = `${lobby.game.toUpperCase()} lobby (${lobby.players.length}/${lobby.size})`;
            embed.description = lobby.players.map((id) => `<@${id}>`).join('\n') || '*Empty*';
            yield msg.edit({ embeds: [embed] });
            if (lobby.players.length === lobby.size && (channel === null || channel === void 0 ? void 0 : channel.isTextBased())) {
                yield channel.send(`🚀  Lobby full! ${lobby.players.map((id) => `<@${id}>`).join(' ')}`);
            }
        }
        catch (error) {
            console.error('Button handler error:', error);
        }
    });
}
/* ------------------------------------------------------------------ */
/* 5. Login                                                           */
/* ------------------------------------------------------------------ */
client.login(process.env.DISCORD_TOKEN);
