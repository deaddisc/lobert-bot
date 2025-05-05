import {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ChatInputCommandInteraction,
  ButtonInteraction,
  TextBasedChannel,
} from 'discord.js';
import * as dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { lobbyManager } from './lib/LobbyManager';

dotenv.config(); // loads DISCORD_TOKEN, CLIENT_ID, GUILD_ID

/* ------------------------------------------------------------------ */
/* 1. Command type and extended client                                */
/* ------------------------------------------------------------------ */
type Command = {
  data: any;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
};

interface LobertClient extends Client<boolean> {
  commands: Collection<string, Command>;
}

/* ------------------------------------------------------------------ */
/* 2. Instantiate client and commands collection                      */
/* ------------------------------------------------------------------ */
const client = new Client({ intents: [GatewayIntentBits.Guilds] }) as LobertClient;
client.commands = new Collection<string, Command>();

/* ------------------------------------------------------------------ */
/* 3. Load command modules (.js in production, .ts in dev)             */
/* ------------------------------------------------------------------ */
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js') || file.endsWith('.ts'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file)) as Command;
  client.commands.set(command.data.name, command);
}
console.log('Loaded commands:', [...client.commands.keys()]);

/* ------------------------------------------------------------------ */
/* 4. Event handlers                                                   */
/* ------------------------------------------------------------------ */
client.once(Events.ClientReady, (bot) => {
  console.log(`🤖 Logged in as ${bot.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  // Handle buttons
  if (interaction.isButton()) {
    await handleButton(interaction);
    return;
  }

  // Handle slash commands
  if (interaction.isChatInputCommand()) {
    const command = client.commands.get(interaction.commandName);
    if (!command) return;
    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Command execution error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({ content: '💥 Something went wrong.', ephemeral: true });
      } else {
        await interaction.reply({ content: '💥 Something went wrong.', ephemeral: true });
      }
    }
  }
});

async function handleButton(interaction: ButtonInteraction) {
  try {
    await interaction.deferUpdate();
    const [action, lobbyId] = interaction.customId.split(':');
    const lobby = lobbyManager.get(lobbyId);
    if (!lobby) return;

    if (action === 'join') {
      if (!lobby.players.includes(interaction.user.id) && lobby.players.length < lobby.size) {
        lobby.players.push(interaction.user.id);
      }
    } else if (action === 'leave') {
      lobby.players = lobby.players.filter((id) => id !== interaction.user.id);
    }

    const channel = await interaction.client.channels.fetch(lobby.channelId);
    if (!channel?.isTextBased()) return;

    const msg = await channel.messages.fetch(lobby.id);
    const embed = msg.embeds[0].toJSON();
    embed.title = `${lobby.game.toUpperCase()} lobby (${lobby.players.length}/${lobby.size})`;
    embed.description = lobby.players.map((id) => `<@${id}>`).join('\n') || '*Empty*';
    await msg.edit({ embeds: [embed] });

    if (lobby.players.length === lobby.size && channel?.isTextBased()) {
      // Tell TS this is a TextBasedChannel so .send() is valid:
      const textCh = channel as TextBasedChannel;
      await textCh.send(
        `🚀  Lobby full! ${lobby.players.map((id) => `<@${id}>`).join(' ')}`
      );
    }
  } catch (error) {
    console.error('Button handler error:', error);
  }
}

/* ------------------------------------------------------------------ */
/* 5. Login                                                           */
/* ------------------------------------------------------------------ */
client.login(process.env.DISCORD_TOKEN);
