import { Collection, Snowflake } from 'discord.js';

export interface Lobby {
  id: string;
  channelId: Snowflake;
  creatorId: Snowflake;
  game: string;
  size: number;
  players: Snowflake[];
  startsAt?: number;
  expiresAt: number;
}

interface LobbyActions {
  start(lobby: Lobby): Promise<void>;
  expire(lobby: Lobby): Promise<void>;
}

export class LobbyManager {
  #lobbies = new Collection<string, Lobby>();
  #timers = new Map<string, ReturnType<typeof setTimeout>[]>();

  constructor(private actions: LobbyActions) {}

  create(lobby: Lobby) {
    this.delete(lobby.id);
    this.#lobbies.set(lobby.id, lobby);
    const timers: ReturnType<typeof setTimeout>[] = [];
    this.#timers.set(lobby.id, timers);
    // One lifecycle timer prevents expiration from racing the start ping.
    timers.push(setTimeout(() => {
      if (this.get(lobby.id) !== lobby) return;
      // Stop accepting joins and exclude this lobby from fresh lists immediately.
      this.delete(lobby.id);
      void this.finish(lobby);
    }, Math.max(0, (lobby.startsAt ?? lobby.expiresAt) - Date.now())));
  }

  private async finish(lobby: Lobby) {
    if (lobby.startsAt !== undefined) {
      try {
        await this.actions.start(lobby);
      } catch (error) {
        console.error('Lobby start ping failed:', error);
      }
    }
    // Delete the original message after the ping attempt, even if sending failed.
    try {
      await this.actions.expire(lobby);
    } catch (error) {
      console.error('Lobby expiration failed:', error);
    }
  }
  get(id: string) { return this.#lobbies.get(id); }

  delete(id: string) {
    for (const timer of this.#timers.get(id) ?? []) clearTimeout(timer);
    this.#timers.delete(id);
    this.#lobbies.delete(id);
  }

  list() { return Array.from(this.#lobbies.values()); }
}

export const lobbyManager = new LobbyManager({
  async start(lobby) {
    const { client } = await import('../index');
    const channel = await client.channels.fetch(lobby.channelId);
    if (!channel?.isTextBased() || !channel.isSendable()) return;
    await channel.send({
      content: `⏰ Time for ${lobby.game}! ${lobby.players.map(id => `<@${id}>`).join(' ')}`,
      allowedMentions: { parse: [], users: lobby.players },
    });
  },
  async expire(lobby) {
    const { client } = await import('../index');
    const channel = await client.channels.fetch(lobby.channelId);
    if (channel?.isTextBased()) await channel.messages.delete(lobby.id);
  },
});
