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
const startTime_1 = require("../lib/startTime");
exports.data = new discord_js_1.SlashCommandBuilder()
    .setName('lobby')
    .setDescription('Create or manage game lobbies')
    .addSubcommand(sc => sc.setName('create')
    .setDescription('Create a new lobby')
    .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true))
    .addIntegerOption(o => o.setName('size').setDescription('Number of players').setRequired(true))
    .addStringOption(o => o.setName('time').setDescription('HH:mm (19:00, not 1900) or 8PM / 8:30PM. Mauritius UTC+4; optional offset: 19:00-05:00')))
    .addSubcommand(sc => sc.setName('list').setDescription('List open lobbies'))
    .addSubcommand(sc => sc.setName('cancel').setDescription('Cancel your lobby'));
function buildLobbyEmbed({ game, size, players, creatorId, startsAt }) {
    const embed = new discord_js_1.EmbedBuilder()
        .setTitle(`${game.toUpperCase()} lobby (${players.length}/${size})`)
        .setDescription(players.map(id => `<@${id}>${id === creatorId ? " *(creator)*" : ""}`).join("\n") || "*Empty*")
        .setColor(0x57f287);
    if (startsAt !== undefined) {
        const mauritiusTime = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'Indian/Mauritius',
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
        }).format(startsAt);
        const timestamp = Math.floor(startsAt / 1000);
        embed.addFields({
            name: 'Scheduled start (Mauritius, UTC+4)',
            value: `**${mauritiusTime}**\nYour local time: <t:${timestamp}:F>\nStarts <t:${timestamp}:R>`,
        });
    }
    if (startsAt === undefined)
        embed.addFields({ name: 'Scheduled start', value: 'Not scheduled. Set time when creating a lobby, e.g. 19:00 or 7PM (Mauritius UTC+4).' });
    return embed;
}
function execute(interaction) {
    return __awaiter(this, void 0, void 0, function* () {
        const sub = interaction.options.getSubcommand();
        /* ──────────────── CREATE ──────────────── */
        if (sub === 'create') {
            const game = interaction.options.getString('game', true);
            const size = interaction.options.getInteger('size', true);
            const time = interaction.options.getString('time');
            let startsAt;
            if (time !== null) {
                try {
                    startsAt = (0, startTime_1.parseStartTime)(time);
                }
                catch (error) {
                    return interaction.reply({ content: error.message, ephemeral: true });
                }
            }
            const embed = buildLobbyEmbed({ game, size, players: [interaction.user.id], creatorId: interaction.user.id, startsAt });
            // Attach buttons only after the real message ID is available.
            yield interaction.reply({ embeds: [embed] });
            const msg = yield interaction.fetchReply();
            /* --- save lobby in memory --- */
            LobbyManager_1.lobbyManager.create({
                id: msg.id,
                channelId: msg.channel.id,
                creatorId: interaction.user.id,
                game,
                size,
                players: [interaction.user.id],
                startsAt,
                expiresAt: startsAt !== null && startsAt !== void 0 ? startsAt : (Date.now() + 3 * 60 * 60 * 1000),
            });
            const row = new discord_js_1.ActionRowBuilder().addComponents(new discord_js_1.ButtonBuilder().setCustomId(`join:${msg.id}`).setLabel('Join').setStyle(discord_js_1.ButtonStyle.Primary), new discord_js_1.ButtonBuilder().setCustomId(`leave:${msg.id}`).setLabel('Leave').setStyle(discord_js_1.ButtonStyle.Secondary));
            yield msg.edit({ components: [row] });
        }
        /* ──────────────── LIST ──────────────── */
        else if (sub === 'list') {
            const open = LobbyManager_1.lobbyManager.list();
            if (!open.length) {
                return interaction.reply({ content: 'No open lobbies.', ephemeral: true });
            }
            const lines = open.map(lobby => {
                const game = lobby.game.replace(/[\r\n]/g, ' ').replace(/([\\*_`~|\[\]])/g, '\\$1');
                const schedule = lobby.startsAt === undefined
                    ? 'Not scheduled'
                    : `<t:${Math.floor(lobby.startsAt / 1000)}:f>`;
                return `**${game}** (${lobby.players.length}/${lobby.size}) — <@${lobby.creatorId}>\n${schedule}`;
            });
            // Discord limits a single embed description to 4096 characters.
            let description = '';
            let shown = 0;
            for (const line of lines) {
                if (description.length + line.length + 2 > 4000)
                    break;
                description += (description ? '\n\n' : '') + line;
                shown++;
            }
            if (shown < open.length)
                description += `\n\n${open.length - shown} more lobbies exceed Discord's single-embed limit.`;
            const embed = new discord_js_1.EmbedBuilder()
                .setTitle('Active lobbies')
                .setColor(0x57f287)
                .setDescription(description)
                .setFooter({ text: `${open.length} active lobbies • Times shown in your local timezone` });
            yield interaction.reply({ embeds: [embed], components: [], allowedMentions: { parse: [] } });
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
