"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.data = void 0;
exports.execute = execute;
const discord_js_1 = require("discord.js");
const LobbyManager_1 = require("../lib/LobbyManager");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('lobby')
    .setDescription('Create or manage game lobbies')
    .addSubcommand(sc => sc.setName('create')
    .setDescription('Create a new lobby')
    .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true))
    .addIntegerOption(o => o.setName('size').setDescription('Number of players').setRequired(true)))
    .addSubcommand(sc => sc.setName('list').setDescription('List open lobbies'))
    .addSubcommand(sc => sc.setName('cancel').setDescription('Cancel your lobby'));
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const sub = interaction.options.getSubcommand();
        /* ──────────────── CREATE ──────────────── */
        if (sub === 'create') {
            const game = interaction.options.getString('game', true);
            const size = interaction.options.getInteger('size', true);
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle(`${game.toUpperCase()} lobby (${1}/${size})`)
                .setDescription(`<@${interaction.user.id}> *(creator)*`)
                .setColor(0x57f287);
            const tempRow = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder()
                .setCustomId(`join:${interaction.id}`) // placeholder; fix after send
                .setLabel('Join')
                .setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder()
                .setCustomId(`leave:${interaction.id}`)
                .setLabel('Leave')
                .setStyle(discord_js_1.ButtonStyle.Secondary));
            // Send the message first
            const reply = yield interaction.reply({
                embeds: [embed],
                components: [tempRow],
            });
            const msg = yield reply.fetch();
            /* --- save lobby in memory --- */
            LobbyManager_1.lobbyManager.create({
                id: msg.id,
                channelId: msg.channel.id,
                creatorId: interaction.user.id,
                game,
                size,
                players: [interaction.user.id],
            });
            /* --- replace temp IDs with the real message ID (TS‑safe casts) --- */
            const fixedRow = discord_js_1.ActionRowBuilder.from(tempRow);
            fixedRow.components.forEach(btn => {
                const b = btn;
                b.setCustomId(b.data.custom_id.replace(interaction.id, msg.id));
            });
            yield msg.edit({ components: [fixedRow] });
        }
        /* ──────────────── LIST ──────────────── */
        else if (sub === 'list') {
            const open = LobbyManager_1.lobbyManager.list();
            if (!open.length) {
                return interaction.reply({ content: 'No open lobbies.', ephemeral: true });
            }
            const lines = open.map(l => `• **${l.game}**  (${l.players.length}/${l.size}) – <@${l.creatorId}>`);
            yield interaction.reply({ content: lines.join('\n'), ephemeral: true });
        }
        /* ──────────────── CANCEL ──────────────── */
        else if (sub === 'cancel') {
            const lobby = LobbyManager_1.lobbyManager
                .list()
                .find(l => l.creatorId === interaction.user.id);
            if (!lobby) {
                return interaction.reply({
                    content: 'You have no active lobby.',
                    ephemeral: true,
                });
            }
            LobbyManager_1.lobbyManager.delete(lobby.id);
            const channel = yield interaction.client.channels.fetch(lobby.channelId);
            if (channel === null || channel === void 0 ? void 0 : channel.isTextBased()) {
                channel.messages.delete(lobby.id).catch(() => null);
            }
            yield interaction.reply('❌  Lobby cancelled.');
        }
    });
}
