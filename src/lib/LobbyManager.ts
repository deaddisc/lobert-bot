import { Collection, Snowflake } from 'discord.js';

export interface Lobby {
  id: string;                 // Discord message ID
  channelId: Snowflake;
  creatorId: Snowflake;
  game: string;
  size: number;
  players: Snowflake[];       // user IDs in join‑order
}

class LobbyManager {
  #lobbies = new Collection<string, Lobby>();

  create(lobby: Lobby) {
    this.#lobbies.set(lobby.id, lobby);
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
