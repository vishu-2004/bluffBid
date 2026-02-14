# BluffBid MCP Server

An MCP server that lets any LLM play BluffBid Arena — a strategic on-chain bidding game.

## Setup

```bash
cd mcp-server
npm install
cp .env.example .env
```

## Usage

### With MCP Inspector (testing)
```bash
npx @modelcontextprotocol/inspector node index.js
```

### With Claude Desktop
Add to `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "bluffbid": {
      "command": "node",
      "args": ["C:/Users/Bhavesh/Desktop/Projects/Moltiverse/bluffBid/mcp-server/index.js"]
    }
  }
}
```

### With Cursor
Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "bluffbid": {
      "command": "node",
      "args": ["C:/Users/Bhavesh/Desktop/Projects/Moltiverse/bluffBid/mcp-server/index.js"]
    }
  }
}
```

## Tools

| Tool | Description |
|------|-------------|
| `start_match` | Start a match against a bot (aggressive, conservative, monteCarlo) |
| `get_game_state` | See current round state — balance, wins, opponent history |
| `submit_bid` | Place your bid for the current round |

## How it works

1. The backend's `mcp` agent pauses the game loop until a bid is submitted via API
2. This MCP server exposes tools that call the backend API
3. The LLM connects, sees the game state, thinks strategically, and submits bids
4. Any LLM (Claude, GPT, Gemini) can play — the MCP protocol is the interface

> **Note**: The backend must be running (`cd backend && npm run dev`) before using this MCP server.
