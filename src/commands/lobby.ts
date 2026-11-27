import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
  } from 'discord.js';
  import { lobbyManager, Lobby } from '../lib/LobbyManager';
  import { parseStartTime } from '../lib/startTime';

  export const data = new SlashCommandBuilder()
    .setName('lobby')
    .setDescription('Create or manage game lobbies')
    .addSubcommand(sc =>
      sc.setName('create')
        .setDescription('Create a new lobby')
        .addStringOption(o =>
          o.setName('game').setDescription('Game name').setRequired(true))
        .addIntegerOption(o =>
          o.setName('size').setDescription('Number of players').setRequired(true))
        .addStringOption(o =>
          o.setName('time').setDescription('HH:mm (19:00, not 1900) or 8PM / 8:30PM. Mauritius UTC+4; optional offset: 19:00-05:00')))
    .addSubcommand(sc =>
      sc.setName('list').setDescription('List open lobbies'))
    .addSubcommand(sc =>
      sc.setName('cancel').setDescription('Cancel your lobby'));

  function buildLobbyEmbed({ game, size, players, creatorId, startsAt }: Pick<Lobby, 'game' | 'size' | 'players' | 'creatorId' | 'startsAt'>) {
      const embed = new EmbedBuilder()
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

      if (startsAt === undefined) embed.addFields({ name: 'Scheduled start', value: 'Not scheduled. Set time when creating a lobby, e.g. 19:00 or 7PM (Mauritius UTC+4).' });
      return embed;
  }

  export async function execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    /* ──────────────── CREATE ──────────────── */
    if (sub === 'create') {
      const game = interaction.options.getString('game', true);
      const size = interaction.options.getInteger('size', true);
      const time = interaction.options.getString('time');
      let startsAt: number | undefined;
      if (time !== null) {
        try {
          startsAt = parseStartTime(time);
        } catch (error) {
          return interaction.reply({ content: (error as Error).message, ephemeral: true });
        }
      }

      const embed = buildLobbyEmbed({ game, size, players: [interaction.user.id], creatorId: interaction.user.id, startsAt });

      // Attach buttons only after the real message ID is available.
      await interaction.reply({ embeds: [embed] });
      const msg = await interaction.fetchReply();
      /* --- save lobby in memory --- */
      lobbyManager.create({
        id: msg.id,
        channelId: msg.channel.id,
        creatorId: interaction.user.id,
        game,
        size,
        players: [interaction.user.id],
        startsAt,
        expiresAt: startsAt ?? (Date.now() + 3 * 60 * 60 * 1000),
      });

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`join:${msg.id}`).setLabel('Join').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`leave:${msg.id}`).setLabel('Leave').setStyle(ButtonStyle.Secondary),
      );
      await msg.edit({ components: [row] });
    }
    /* ──────────────── LIST ──────────────── */
    else if (sub === 'list') {
      const open = lobbyManager.list();
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
        if (description.length + line.length + 2 > 4000) break;
        description += (description ? '\n\n' : '') + line;
        shown++;
      }
      if (shown < open.length) description += `\n\n${open.length - shown} more lobbies exceed Discord's single-embed limit.`;
      const embed = new EmbedBuilder()
        .setTitle('Active lobbies')
        .setColor(0x57f287)
        .setDescription(description)
        .setFooter({ text: `${open.length} active lobbies • Times shown in your local timezone` });
      await interaction.reply({ embeds: [embed], components: [], allowedMentions: { parse: [] } });
    }
    /* ──────────────── CANCEL ──────────────── */
    else if (sub === 'cancel') {
      const lobby = lobbyManager
        .list()
        .find(l => l.creatorId === interaction.user.id);

      if (!lobby) {
        return interaction.reply({
          content: 'You have no active lobby.',
          ephemeral: true,
        });
      }

      lobbyManager.delete(lobby.id);
      const channel = await interaction.client.channels.fetch(lobby.channelId);
      if (channel?.isTextBased()) {
        channel.messages.delete(lobby.id).catch(() => null);
      }
      await interaction.reply('❌  Lobby cancelled.');
    }
  }
