"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LobbyManager_lobbies;
Object.defineProperty(exports, "__esModule", { value: true });
exports.lobbyManager = void 0;
const discord_js_1 = require("discord.js");
class LobbyManager {
    constructor() {
        _LobbyManager_lobbies.set(this, new discord_js_1.Collection());
    }
    create(lobby) {
        __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").set(lobby.id, lobby);
    }
    get(id) {
        return __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").get(id);
    }
    delete(id) {
        __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").delete(id);
    }
    list() {
        return Array.from(__classPrivateFieldGet(this, _LobbyManager_lobbies, "f").values());
    }
}
_LobbyManager_lobbies = new WeakMap();
exports.lobbyManager = new LobbyManager();
