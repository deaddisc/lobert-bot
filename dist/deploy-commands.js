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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const discord_js_1 = require("discord.js");
const commands = [
    new discord_js_1.SlashCommandBuilder()
        .setName('lobby')
        .setDescription('Create or manage game lobbies')
        .addSubcommand(sc => sc.setName('create')
        .setDescription('Create a new lobby')
        .addStringOption(o => o.setName('game').setDescription('Game name').setRequired(true))
        .addIntegerOption(o => o.setName('size').setDescription('Number of players').setRequired(true))
        .addStringOption(o => o.setName('time').setDescription('Optional start time (21:00)')))
        .addSubcommand(sc => sc.setName('list')
        .setDescription('List all open lobbies'))
        .addSubcommand(sc => sc.setName('cancel')
        .setDescription('Cancel your lobby'))
        .toJSON(), // convert to raw data
];
const rest = new discord_js_1.REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('🔄  Refreshing slash commands…');
        // ── add these two lines ↓↓↓ for sanity check
        console.log('CLIENT_ID =', process.env.CLIENT_ID);
        console.log('GUILD_ID  =', process.env.GUILD_ID);
        yield rest.put(discord_js_1.Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), { body: commands });
        console.log('✅  Commands deployed to guild.');
    }
    catch (err) {
        console.error(err);
    }
}))();
