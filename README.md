# Lobert Bot

A friendly Discord lobby manager that makes it easy to gather players for any game, right in your server. Lobert handles lobby creation, live join/leave buttons, roster updates, and “lobby full” pings so you can focus on playing, not coordinating.

---

## 🌟 Features

- **Slash commands**  
  - `/lobby create game:<name> size:<#>` — Create a new game lobby.  
  - `/lobby list` — Show all open lobbies.  
  - `/lobby cancel` — Cancel the lobby you created.

- **Interactive buttons**  
  - **Join** / **Leave** buttons on each lobby embed for one-click roster management.  
  - Embed updates in real time as players join or leave.

- **Auto-ping when full**  
  - As soon as the player count reaches the lobby size, Lobert posts a “🚀 Lobby full!” message tagging everyone in that lobby.

- **Multi-lobby support**  
  - Handle multiple lobbies across different games (or the same game) simultaneously.

---

## 🚀 Installation

1. **Clone this repository**  
   ```bash
   git clone https://github.com/deaddisc/lobert-bot.git
   cd lobert-bot
Install dependencies
npm install
Create your .env
In the project root, create a file named .env with:
DISCORD_TOKEN=your-bot-token
CLIENT_ID=your-application-id
GUILD_ID=your-server-id
Deploy slash commands (guild-scoped, updates instantly)
npm run deploy:cmd
Start the bot
npm run dev

## 🎮 Usage

Create a lobby
/lobby create game:Valorant size:5
Lobert will post an embed:

VALORANT lobby (1/5)
• @YourName (creator)
[ Join ]  [ Leave ]
Join / Leave
Click Join to add yourself to the roster.
Click Leave to remove yourself.
List open lobbies
/lobby list
Replies (ephemeral):

• VALORANT (2/5) – @YourName
• League (1/3) – @AnotherUser
Cancel your lobby
/lobby cancel
Deletes the embed and removes your lobby.
Lobby full ping
When the last spot is filled, Lobert automatically sends:
🚀 Lobby full! @A @B @C @D @E
🛠️ Configuration & Deployment

Environment variables
DISCORD_TOKEN — Your bot’s token from the Developer Portal.
CLIENT_ID — The Application (Client) ID.
GUILD_ID — The guild/server ID where you want instant command updates.
Docker / PM2
You can containerize or daemonize the bot for 24/7 uptime.
Persistence
Currently in-memory; for lobby persistence across restarts, integrate a database (e.g., SQLite or Redis).
📄 License & Credits

Maintained by
• Deaddisc / Neron
• Aeris (ChatGPT)
