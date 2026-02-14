// MCP Agent — waits for external bid submission via API
// The game engine calls decide(), which returns a Promise that blocks
// until a bid is submitted externally via POST /api/match/:id/bid

// Map<string, { resolve, state }>
// Key format: "matchId:player" e.g. "3:A" or "3:B"
export const pendingDecisions = new Map();

/**
 * Creates an MCP agent for a specific match and player slot.
 * The agent's decide() blocks until a bid is submitted via the API.
 *
 * @param {bigint|string|number} matchId
 * @param {"A"|"B"} playerLabel
 * @returns {{ decide: (state: object) => Promise<{bid: number, reason: string}> }}
 */
export function createMcpAgent(matchId, playerLabel) {
    return {
        decide: (state) => {
            const key = `${matchId}:${playerLabel}`;
            console.log(`[MCP Agent] Waiting for external bid — key: ${key}`);

            return new Promise((resolve) => {
                pendingDecisions.set(key, { resolve, state });
            });
        }
    };
}
