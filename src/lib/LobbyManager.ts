import { Collection, Snowflake } from 'discord.js';

export interface Lobby {
  id: string;                 // Discord message ID
  channelId: Snowflake;
  creatorId: Snowflake;
  game: string;
  size: number;
  players: Snowflake[];       // user IDs in join‑order
  expiresAt: number;          // unix ms timestamp when this lobby auto-expires
}

class LobbyManager {
  #lobbies = new Collection<string, Lobby>();

  create(lobby: Lobby) {
    this.#lobbies.set(lobby.id, lobby);
    setTimeout(async () => {
      this.delete(lobby.id);
      try {
        const { client } = await import('../index');
        const channel = await client.channels.fetch(lobby.channelId);
        if (channel?.isTextBased()) {
          channel.messages.delete(lobby.id).catch(() => null);
        }
      } catch {
        // ignore
      }
    }, 3 * 60 * 60 * 1000);
  }

  get(id: string) {
    return this.#lobbies.get(id);
  }

  delete(id: string) {
    this.#lobbies.delete(id);
  }

  list() {
    return Array.from(this.#lobbies.values());
  }
}

export const lobbyManager = new LobbyManager();
