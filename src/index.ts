/* ------------------------------------------------------------------ */
/* 0. Imports                                                          */
/* ------------------------------------------------------------------ */
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ChatInputCommandInteraction,
    Client,
    Collection,
    Events,
    GatewayIntentBits,
    Interaction,
    TextBasedChannel,
  } from 'discord.js';
  import * as dotenv from 'dotenv';
  import fs from 'node:fs';
  import path from 'node:path';
  import { lobbyManager } from './lib/LobbyManager';
  
  dotenv.config(); // loads DISCORD_TOKEN
  
  /* ------------------------------------------------------------------ */
  /* 1. Command type & Client extension                                  */
  /* ------------------------------------------------------------------ */
  type Command = {
    data: any;
    execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  };
  
  interface LobertClient extends Client<boolean> {
    commands: Collection<string, Command>;
  }
  
  /* ------------------------------------------------------------------ */
  /* 2. Instantiate client & load commands                               */
  /* ------------------------------------------------------------------ */
  const client = new Client({
    intents: [GatewayIntentBits.Guilds],
  }) as LobertClient;
  
  client.commands = new Collection<string, Command>();
  
  const commandsPath = path.join(__dirname, 'commands');
  for (const file of fs.readdirSync(commandsPath).filter((f) => f.endsWith('.ts'))) {
    const { data, execute } = require(path.join(commandsPath, file)) as Command;
    client.commands.set(data.name, { data, execute });
  }
  
  console.log('Loaded commands:', [...client.commands.keys()]);
  
  /* ------------------------------------------------------------------ */
  /* 3. Ready event                                                      */
  /* ------------------------------------------------------------------ */
  client.once(Events.ClientReady, (bot) => {
    console.log(`🤖 Logged in as ${bot.user.tag}`);
  });
  
  /* ------------------------------------------------------------------ */
  /* 4. Unified interaction handler                                      */
  /* ------------------------------------------------------------------ */
  client.on(Events.InteractionCreate, async (interaction: Interaction) => {
    // ─── Buttons first ─────────────────────────────────────────────────
    if (interaction.isButton()) {
      const btn = interaction as ButtonInteraction;
      try {
        await btn.deferUpdate(); // ACK within 3s
  
        // Parse & fetch lobby
        const [action, lobbyId] = btn.customId.split(':');
        console.log(`Button ${action} on lobby ${lobbyId}`);
        const lobby = lobbyManager.get(lobbyId);
        if (!lobby) return;
  
        // Join/Leave logic
        if (action === 'join') {
          if (
            !lobby.players.includes(btn.user.id) &&
            lobby.players.length < lobby.size
          ) {
            lobby.players.push(btn.user.id);
          }
        } else if (action === 'leave') {
          lobby.players = lobby.players.filter((id) => id !== btn.user.id);
        }
  
        // Update the embed
        const rawChannel = await client.channels.fetch(lobby.channelId);
        const channel = rawChannel as TextBasedChannel;
        const msg = await channel.messages.fetch(lobby.id);
        const embed = msg.embeds[0].toJSON();
        embed.title = `${lobby.game.toUpperCase()} lobby (${lobby.players.length}/${lobby.size})`;
        embed.description =
          lobby.players.map((id) => `<@${id}>`).join('\n') || '*Empty*';
        await msg.edit({ embeds: [embed] });
  
        // Ping when full
        if (lobby.players.length === lobby.size) {
          await (channel as any).send(
            `🚀 Lobby full! ${lobby.players.map((id) => `<@${id}>`).join(' ')}`
          );
        }
      } catch (err) {
        console.error('Button handler error:', err);
      }
      return; // done with button
    }
  
    // ─── Slash commands next ───────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const slash = interaction as ChatInputCommandInteraction;
      const command = client.commands.get(slash.commandName);
      if (!command) return;
  
      try {
        await command.execute(slash);
      } catch (err) {
        console.error('Slash handler error:', err);
        const replyOpts = {
          content: '💥 Something went wrong.',
          ephemeral: true,
        };
        if (slash.deferred || slash.replied) {
          await slash.followUp(replyOpts);
        } else {
          await slash.reply(replyOpts);
        }
      }
    }
  });
  
  /* ------------------------------------------------------------------ */
  /* 5. Log in                                                           */
  /* ------------------------------------------------------------------ */
  client.login(process.env.DISCORD_TOKEN);
  