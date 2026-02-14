// MCP Resource: match://status
// Read-only context the model uses to inform its bidding decision.
// Provides: opponent bid history, frequency profile, round number, balances.

/**
 * Build an opponent frequency profile from bid history.
 * Returns an array of 6 probabilities (index = bid value 0-5).
 * Uses Laplace smoothing (start with uniform count of 1 each).
 * @param {number[]} opponentBids - Array of previous opponent bids
 * @returns {number[]} Probability distribution over bids 0-5
 */
function buildFrequencyProfile(opponentBids) {
    // Laplace smoothing: start with 1 count per bid value
    const counts = [1, 1, 1, 1, 1, 1];

    if (opponentBids && opponentBids.length > 0) {
        opponentBids.forEach(bid => {
            if (bid >= 0 && bid <= 5) {
                counts[bid] += 1;
            }
        });
    }

    const total = counts.reduce((a, b) => a + b, 0);
    return counts.map(c => c / total);
}

export const matchStatusResource = {
    uri: "match://status",
    name: "Current Match Status",
    mimeType: "application/json",
    description: "Read-only game state including opponent bid history, frequency profile, current round, and remaining balances for both players.",

    /**
     * Read the resource to get current match context.
     * Normalizes balance from wei to ETH for sensible utility calculations.
     * (Contract stores balance as MATCH_DEPOSIT = 20 ether, but bids are 0-5)
     *
     * @param {object} gameState - The current game state from GameEngine
     * @param {number} gameState.roundNumber
     * @param {number} gameState.myBalance
     * @param {number} gameState.opponentBalance
     * @param {number} gameState.myWins
     * @param {number} gameState.opponentWins
     * @param {number[]} gameState.opponentPreviousBids
     * @returns {object} Enriched status with frequency profile
     */
    read(gameState) {
        const frequencyProfile = buildFrequencyProfile(gameState.opponentPreviousBids);

        // Normalize balance: if balance is in wei (>1e15), convert to ETH
        // This keeps balances on the same scale as bids (0-5) for utility math
        const WEI_THRESHOLD = 1e15;
        const WEI_PER_ETH = 1e18;
        const myBalance = gameState.myBalance > WEI_THRESHOLD
            ? gameState.myBalance / WEI_PER_ETH
            : gameState.myBalance;
        const opponentBalance = gameState.opponentBalance > WEI_THRESHOLD
            ? gameState.opponentBalance / WEI_PER_ETH
            : gameState.opponentBalance;

        return {
            roundNumber: gameState.roundNumber,
            myBalance,
            opponentBalance,
            myWins: gameState.myWins,
            opponentWins: gameState.opponentWins,
            opponentBidHistory: gameState.opponentPreviousBids || [],
            opponentFrequencyProfile: frequencyProfile,
            totalRounds: 5
        };
    }
};
