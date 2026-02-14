import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

// ─── MCP Server ───────────────────────────────────────────────

const server = new McpServer({
    name: 'bluffbid',
    version: '1.0.0',
    description: 'Play BluffBid Arena — a strategic bidding game on-chain. You are a player making bid decisions each round.'
});

// ─── Tool: start_match ────────────────────────────────────────

server.tool(
    'start_match',
    `Start a new BluffBid match. You (the LLM) play as the "mcp" agent.
Pick an opponent from: aggressive, conservative, monteCarlo.
The game has 5 rounds. Each round you bid tokens (0 to your balance). Higher bid wins the round but costs tokens.
After starting, use get_game_state to see when it's your turn, then submit_bid to play.`,
    {
        opponent: z.enum(['aggressive', 'conservative', 'monteCarlo'])
            .describe('The bot agent to play against')
    },
    async ({ opponent }) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/match/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ agentA: 'mcp', agentB: opponent })
            });
            const data = await res.json();

            if (!res.ok) {
                return { content: [{ type: 'text', text: `Error: ${JSON.stringify(data)}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: `🎮 Match started!\n\nMatch ID: ${data.matchId}\nYou (Player A / mcp) vs ${opponent} (Player B)\n\nThe game engine is now running. Use get_game_state with matchId "${data.matchId}" to see the current state and when it's waiting for your bid.`
                }]
            };
        } catch (e) {
            return { content: [{ type: 'text', text: `Failed to connect to backend: ${e.message}` }], isError: true };
        }
    }
);

// ─── Tool: get_game_state ─────────────────────────────────────

server.tool(
    'get_game_state',
    `Get the current game state for a BluffBid match.
Shows whether the engine is waiting for your bid, your balance, wins, round number, and opponent's previous bids.
Call this before deciding your bid each round.`,
    {
        matchId: z.string().describe('The match ID returned from start_match')
    },
    async ({ matchId }) => {
        try {
            // Fetch pending state (is the engine waiting for a bid?)
            const pendingRes = await fetch(`${BACKEND_URL}/api/match/${matchId}/pending`);
            const pendingData = await pendingRes.json();

            // Also fetch on-chain match state
            const stateRes = await fetch(`${BACKEND_URL}/api/match/${matchId}`);
            const stateData = await stateRes.json();

            let text = `📊 Match ${matchId} State\n`;
            text += `━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

            // On-chain state
            const statusMap = { 0: 'Created', 1: 'Active', 2: 'Completed' };
            text += `Status: ${statusMap[Number(stateData.status)] || stateData.status}\n`;
            text += `Current Round: ${stateData.currentRound}\n\n`;

            if (stateData.player1) {
                text += `Player A (You): Balance=${stateData.player1.balance || stateData.player1[2]}, Wins=${stateData.player1.wins || stateData.player1[3]}\n`;
            }
            if (stateData.player2) {
                text += `Player B (Bot): Balance=${stateData.player2.balance || stateData.player2[2]}, Wins=${stateData.player2.wins || stateData.player2[3]}\n`;
            }

            // Pending decisions
            if (pendingData.pendingPlayers && pendingData.pendingPlayers.length > 0) {
                text += `\n⏳ Waiting for your bid!\n`;
                for (const p of pendingData.pendingPlayers) {
                    text += `\nYour state this round:\n`;
                    text += `  Round: ${p.state.roundNumber}\n`;
                    text += `  Your Balance: ${p.state.myBalance}\n`;
                    text += `  Opponent Balance: ${p.state.opponentBalance}\n`;
                    text += `  Your Wins: ${p.state.myWins}\n`;
                    text += `  Opponent Wins: ${p.state.opponentWins}\n`;
                    text += `  Opponent's Previous Bids: [${p.state.opponentPreviousBids.join(', ')}]\n`;
                    text += `\n→ Use submit_bid to place your bid (0 to ${p.state.myBalance})`;
                }
            } else {
                text += `\n✅ Not waiting for your input right now. The round may be processing.`;
            }

            return { content: [{ type: 'text', text }] };
        } catch (e) {
            return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
        }
    }
);

// ─── Tool: submit_bid ─────────────────────────────────────────

server.tool(
    'submit_bid',
    `Submit your bid for the current round. The bid must be between 0 and your current balance.
Strategy tips:
- Higher bid wins the round but costs more tokens
- You have 5 rounds total, budget wisely
- If both bids are equal, it's a tie for that round
- The player who wins more rounds wins the match`,
    {
        matchId: z.string().describe('The match ID'),
        bid: z.number().int().min(0).describe('Your bid amount (0 to your balance)'),
        reason: z.string().optional().describe('Your strategic reasoning for this bid')
    },
    async ({ matchId, bid, reason }) => {
        try {
            const res = await fetch(`${BACKEND_URL}/api/match/${matchId}/bid`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player: 'A', bid, reason: reason || 'LLM decision' })
            });
            const data = await res.json();

            if (!res.ok) {
                return { content: [{ type: 'text', text: `Error: ${data.error}${data.hint ? '\nHint: ' + data.hint : ''}` }], isError: true };
            }

            return {
                content: [{
                    type: 'text',
                    text: `✅ Bid submitted!\n\nMatch: ${matchId}\nBid: ${bid}\nReason: ${reason || 'LLM decision'}\n\nThe round is now resolving. Use get_game_state to check the result and see if the next round is ready.`
                }]
            };
        } catch (e) {
            return { content: [{ type: 'text', text: `Failed to submit bid: ${e.message}` }], isError: true };
        }
    }
);

// ─── Start Server ─────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('BluffBid MCP server running on stdio');
