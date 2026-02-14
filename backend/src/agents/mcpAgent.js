// MCP Agent
// Conforms to the existing { decide(state) } interface.
// Internally uses MCP primitives: reads Resource, applies Prompt strategy, calls Tool.

import { createServer } from '../mcp/server.js';

export const mcpAgent = {
    decide: (state) => {
        // 1. Create an MCP server instance bound to current game state
        const server = createServer(state);

        // 2. READ RESOURCE — get enriched match status with opponent frequency profile
        const status = server.readResource("match://status");

        // 3. GET PROMPT — retrieve strategy instructions (for logging/traceability)
        const messages = server.getPrompt("bid_aggressively");

        // 4. EXECUTE PROMPT STRATEGY — run Monte Carlo simulation
        const { bestBid, expectedUtility, allUtilities } = server.executePrompt("bid_aggressively", status);

        // 5. CALL TOOL — validate and place the bid
        const result = server.callTool("place_bid", { amount: bestBid });

        if (!result.success) {
            // Fallback: bid 0 if validation fails (shouldn't happen)
            console.warn(`MCP Agent: place_bid failed: ${result.error}. Falling back to 0.`);
            return { bid: 0, reason: `MCP fallback — ${result.error}` };
        }

        // Build detailed reason string
        const utilSummary = Object.entries(allUtilities)
            .map(([bid, util]) => `${bid}:${util.toFixed(1)}`)
            .join(', ');

        return {
            bid: result.bid,
            reason: `MCP: bid_aggressively (EU: ${expectedUtility.toFixed(2)}) [${utilSummary}]`
        };
    }
};
