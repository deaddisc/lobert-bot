import * as dotenv from 'dotenv';
dotenv.config();

import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const commands = [
  new SlashCommandBuilder()
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
          o.setName('time').setDescription('Optional start time (21:00)')))
    .addSubcommand(sc =>
      sc.setName('list')
        .setDescription('List all open lobbies'))
    .addSubcommand(sc =>
      sc.setName('cancel')
        .setDescription('Cancel your lobby'))
    .toJSON(),       // convert to raw data
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN!);

(async () => {
  try {
    console.log('🔄  Refreshing slash commands…');

 // ── add these two lines ↓↓↓ for sanity check
 console.log('CLIENT_ID =', process.env.CLIENT_ID);
 console.log('GUILD_ID  =', process.env.GUILD_ID);

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID!,
        process.env.GUILD_ID!
      ),
      { body: commands },
    );

    console.log('✅  Commands deployed to guild.');
  } catch (err) {
    console.error(err);
  }
})();
