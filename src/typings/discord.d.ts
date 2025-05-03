import 'discord.js';
import type { Collection } from 'discord.js';
import type { Command } from '../commands/lobby';   // adjust path if needed

declare module 'discord.js' {
  interface Client {
    commands: Collection<string, Command>;
  }
}
