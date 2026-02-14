// MCP Tool: place_bid
// Active action the model calls to submit a bid for the current round.

export const placeBidTool = {
    name: "place_bid",
    description: "Submit a bid for the current round. The bid must be between 0 and 5 (inclusive) and must not exceed your remaining balance.",
    inputSchema: {
        type: "object",
        properties: {
            amount: {
                type: "number",
                description: "The bid amount (0-5)",
                minimum: 0,
                maximum: 5
            }
        },
        required: ["amount"]
    },

    /**
     * Execute the place_bid tool.
     * @param {object} args - { amount: number }
     * @param {object} context - { myBalance: number }
     * @returns {{ success: boolean, bid: number, error?: string }}
     */
    handler(args, context) {
        const { amount } = args;
        const { myBalance } = context;

        // Validate bid range
        if (!Number.isInteger(amount) || amount < 0 || amount > 5) {
            return {
                success: false,
                bid: 0,
                error: `Invalid bid amount: ${amount}. Must be an integer between 0 and 5.`
            };
        }

        // Validate against balance
        if (amount > myBalance) {
            return {
                success: false,
                bid: 0,
                error: `Bid ${amount} exceeds remaining balance of ${myBalance}.`
            };
        }

        return {
            success: true,
            bid: amount
        };
    }
};
