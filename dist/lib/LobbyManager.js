"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _LobbyManager_lobbies, _LobbyManager_timers;
Object.defineProperty(exports, "__esModule", { value: true });
exports.lobbyManager = exports.LobbyManager = void 0;
const discord_js_1 = require("discord.js");
class LobbyManager {
    constructor(actions) {
        this.actions = actions;
        _LobbyManager_lobbies.set(this, new discord_js_1.Collection());
        _LobbyManager_timers.set(this, new Map());
    }
    create(lobby) {
        var _a;
        this.delete(lobby.id);
        __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").set(lobby.id, lobby);
        const timers = [];
        __classPrivateFieldGet(this, _LobbyManager_timers, "f").set(lobby.id, timers);
        // One lifecycle timer prevents expiration from racing the start ping.
        timers.push(setTimeout(() => {
            if (this.get(lobby.id) !== lobby)
                return;
            // Stop accepting joins and exclude this lobby from fresh lists immediately.
            this.delete(lobby.id);
            void this.finish(lobby);
        }, Math.max(0, ((_a = lobby.startsAt) !== null && _a !== void 0 ? _a : lobby.expiresAt) - Date.now())));
    }
    finish(lobby) {
        return __awaiter(this, void 0, void 0, function* () {
            if (lobby.startsAt !== undefined) {
                try {
                    yield this.actions.start(lobby);
                }
                catch (error) {
                    console.error('Lobby start ping failed:', error);
                }
            }
            // Delete the original message after the ping attempt, even if sending failed.
            try {
                yield this.actions.expire(lobby);
            }
            catch (error) {
                console.error('Lobby expiration failed:', error);
            }
        });
    }
    get(id) { return __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").get(id); }
    delete(id) {
        var _a;
        for (const timer of (_a = __classPrivateFieldGet(this, _LobbyManager_timers, "f").get(id)) !== null && _a !== void 0 ? _a : [])
            clearTimeout(timer);
        __classPrivateFieldGet(this, _LobbyManager_timers, "f").delete(id);
        __classPrivateFieldGet(this, _LobbyManager_lobbies, "f").delete(id);
    }
    list() { return Array.from(__classPrivateFieldGet(this, _LobbyManager_lobbies, "f").values()); }
}
exports.LobbyManager = LobbyManager;
_LobbyManager_lobbies = new WeakMap(), _LobbyManager_timers = new WeakMap();
exports.lobbyManager = new LobbyManager({
    start(lobby) {
        return __awaiter(this, void 0, void 0, function* () {
            const { client } = yield Promise.resolve().then(() => __importStar(require('../index')));
            const channel = yield client.channels.fetch(lobby.channelId);
            if (!(channel === null || channel === void 0 ? void 0 : channel.isTextBased()) || !channel.isSendable())
                return;
            yield channel.send({
                content: `⏰ Time for ${lobby.game}! ${lobby.players.map(id => `<@${id}>`).join(' ')}`,
                allowedMentions: { parse: [], users: lobby.players },
            });
        });
    },
    expire(lobby) {
        return __awaiter(this, void 0, void 0, function* () {
            const { client } = yield Promise.resolve().then(() => __importStar(require('../index')));
            const channel = yield client.channels.fetch(lobby.channelId);
            if (channel === null || channel === void 0 ? void 0 : channel.isTextBased())
                yield channel.messages.delete(lobby.id);
        });
    },
});
