// MCP Prompt: bid_aggressively
// Pre-built instruction template that configures the model's bidding strategy.
// Encapsulates the Monte Carlo simulation reasoning loop.

/**
 * Utility scoring constants for the Monte Carlo simulation.
 */
const UTILITY = {
    ROUND_WIN: 100,
    TIE: 50,
    RESOURCE_CONSERVATION_MULTIPLIER: 2,
    WINNING_BONUS: 20,
    LOSS_PENALTY_MULTIPLIER: 1  // subtract bid amount on loss
};

const SIMULATIONS = 100;

/**
 * Sample an opponent bid from the frequency profile distribution.
 * @param {number[]} probabilities - Probability distribution over bids 0-5
 * @param {number} opponentBalance - Opponent's remaining balance (caps the bid)
 * @returns {number} A sampled bid value
 */
function sampleOpponentBid(probabilities, opponentBalance) {
    const r = Math.random();
    let accumulated = 0;
    for (let i = 0; i < 6; i++) {
        accumulated += probabilities[i];
        if (r <= accumulated) return Math.min(i, opponentBalance);
    }
    return Math.min(5, opponentBalance);
}

/**
 * Calculate utility score for a simulated round outcome.
 * @param {number} myBid - Candidate bid
 * @param {number} oppBid - Sampled opponent bid
 * @param {number} myBalance - Current balance
 * @param {number} myWins - Current wins
 * @param {number} opponentWins - Opponent's current wins
 * @returns {number} Utility score
 */
function calculateUtility(myBid, oppBid, myBalance, myWins, opponentWins) {
    let simMyWins = myWins;
    let simOppWins = opponentWins;
    const simMyBalance = myBalance - myBid;

    if (myBid > oppBid) {
        simMyWins++;
    } else if (myBid < oppBid) {
        simOppWins++;
    }

    let utility = 0;

    // Match position reward
    if (simMyWins > simOppWins) utility += UTILITY.ROUND_WIN;
    else if (simMyWins === simOppWins) utility += UTILITY.TIE;

    // Round win bonus
    if (myBid > oppBid) utility += UTILITY.WINNING_BONUS;

    // Resource conservation value
    utility += simMyBalance * UTILITY.RESOURCE_CONSERVATION_MULTIPLIER;

    // Loss penalty — lost resources without winning
    if (myBid <= oppBid) utility -= myBid * UTILITY.LOSS_PENALTY_MULTIPLIER;

    return utility;
}

export const bidAggressivelyPrompt = {
    name: "bid_aggressively",
    description: "A pre-built strategy template that uses Monte Carlo simulation to find the optimal bid. Models the opponent from bid history, runs 100 simulations per candidate bid, and picks the bid with highest average expected utility.",

    /**
     * Get the strategy messages/instructions for the model.
     * @param {object} args - Optional arguments to tune the prompt
     * @param {number} [args.simulations] - Override number of simulations (default: 100)
     * @returns {object[]} Array of instruction messages
     */
    getMessages(args = {}) {
        return [
            {
                role: "system",
                content: `You are a competitive bidding agent. Your strategy:
1. OPPONENT MODELING: Analyze the opponent's bid history to build a frequency profile.
2. SIMULATION: For each valid bid (0-5, within balance), run ${args.simulations || SIMULATIONS} Monte Carlo simulations.
   - Sample opponent bids from the frequency profile.
   - Score each outcome using the utility function:
     * Currently winning: +${UTILITY.ROUND_WIN}
     * Currently tied: +${UTILITY.TIE}
     * Won the round: +${UTILITY.WINNING_BONUS}
     * Resource conservation: +${UTILITY.RESOURCE_CONSERVATION_MULTIPLIER} × remaining balance
     * Lost while spending: -bid amount
3. DECISION: Choose the bid with the highest average expected utility.`
            }
        ];
    },

    /**
     * Execute the Monte Carlo strategy.
     * This is the core reasoning loop that the prompt drives.
     * @param {object} status - Match status from the resource
     * @param {number} [numSimulations] - Override simulation count
     * @returns {{ bestBid: number, expectedUtility: number, allUtilities: object }}
     */
    execute(status, numSimulations = SIMULATIONS) {
        const {
            myBalance,
            opponentBalance,
            myWins,
            opponentWins,
            opponentFrequencyProfile
        } = status;

        const possibleBids = [0, 1, 2, 3, 4, 5];
        let bestBid = 0;
        let maxUtility = -Infinity;
        const allUtilities = {};

        for (const candidateBid of possibleBids) {
            if (candidateBid > myBalance) continue;

            let totalUtility = 0;

            for (let i = 0; i < numSimulations; i++) {
                const oppBid = sampleOpponentBid(opponentFrequencyProfile, opponentBalance);
                totalUtility += calculateUtility(
                    candidateBid, oppBid, myBalance, myWins, opponentWins
                );
            }

            const expectedUtility = totalUtility / numSimulations;
            allUtilities[candidateBid] = expectedUtility;

            if (expectedUtility > maxUtility) {
                maxUtility = expectedUtility;
                bestBid = candidateBid;
            }
        }

        return { bestBid, expectedUtility: maxUtility, allUtilities };
    }
};
