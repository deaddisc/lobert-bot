import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();                                // loads DISCORD_TOKEN

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,                   // needed for slash‑commands
  ],
});

client.once(Events.ClientReady, (bot) => {
  console.log(`🤖 Logged in as ${bot.user.tag}`);
});

client.login(process.env.DISCORD_TOKEN);
