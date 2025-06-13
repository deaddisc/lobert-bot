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
        setTimeout(() => __awaiter(this, void 0, void 0, function* () {
            this.delete(lobby.id);
            try {
                const { client } = yield Promise.resolve().then(() => __importStar(require('../index')));
                const channel = yield client.channels.fetch(lobby.channelId);
                if (channel === null || channel === void 0 ? void 0 : channel.isTextBased()) {
                    channel.messages.delete(lobby.id).catch(() => null);
                }
            }
            catch (_a) {
                // ignore
            }
        }), 3 * 60 * 60 * 1000);
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
