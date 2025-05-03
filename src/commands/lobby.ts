import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChatInputCommandInteraction,
    EmbedBuilder,
    SlashCommandBuilder,
  } from 'discord.js';
  import { lobbyManager } from '../lib/LobbyManager';
  
  export const data = new SlashCommandBuilder()
    .setName('lobby')
    .setDescription('Create or manage game lobbies')
    .addSubcommand(sc =>
      sc.setName('create')
        .setDescription('Create a new lobby')
        .addStringOption(o =>
          o.setName('game').setDescription('Game name').setRequired(true))
        .addIntegerOption(o =>
          o.setName('size').setDescription('Number of players').setRequired(true)))
    .addSubcommand(sc =>
      sc.setName('list').setDescription('List open lobbies'))
    .addSubcommand(sc =>
      sc.setName('cancel').setDescription('Cancel your lobby'));
  
  export async function execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();
  
    /* ──────────────── CREATE ──────────────── */
    if (sub === 'create') {
      const game = interaction.options.getString('game', true);
      const size = interaction.options.getInteger('size', true);
  
      const embed = new EmbedBuilder()
        .setTitle(`${game.toUpperCase()} lobby (${1}/${size})`)
        .setDescription(`<@${interaction.user.id}> *(creator)*`)
        .setColor(0x57f287);
  
      const tempRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`join:${interaction.id}`)        // placeholder; fix after send
          .setLabel('Join')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId(`leave:${interaction.id}`)
          .setLabel('Leave')
          .setStyle(ButtonStyle.Secondary)
      );
  
      // Send the message first
      const reply = await interaction.reply({
        embeds: [embed],
        components: [tempRow],
      });
      const msg = await reply.fetch();
  
      /* --- save lobby in memory --- */
      lobbyManager.create({
        id: msg.id,
        channelId: msg.channel.id,
        creatorId: interaction.user.id,
        game,
        size,
        players: [interaction.user.id],
      });
  
      /* --- replace temp IDs with the real message ID (TS‑safe casts) --- */
      const fixedRow = ActionRowBuilder.from(
        tempRow as any
      ) as ActionRowBuilder<ButtonBuilder>;
  
      fixedRow.components.forEach(btn => {
        const b = btn as ButtonBuilder & { data: { custom_id?: string } };
        b.setCustomId(b.data.custom_id!.replace(interaction.id, msg.id));
      });
  
      await msg.edit({ components: [fixedRow as any] });
    }
  
    /* ──────────────── LIST ──────────────── */
    else if (sub === 'list') {
      const open = lobbyManager.list();
      if (!open.length) {
        return interaction.reply({ content: 'No open lobbies.', ephemeral: true });
      }
      const lines = open.map(l =>
        `• **${l.game}**  (${l.players.length}/${l.size}) – <@${l.creatorId}>`);
      await interaction.reply({ content: lines.join('\n'), ephemeral: true });
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
  