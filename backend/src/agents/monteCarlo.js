// Monte Carlo Simulation Agent
// Scaled bid constants: 0-25 (represents 0.0-2.5 MON with 0.1 step)
const MAX_BID_SCALED = 25; // 2.5 MON

export const monteCarlo = {
    decide: (state) => {
        const { roundNumber, myBalance, opponentBalance, myWins, opponentWins, opponentPreviousBids } = state;
        // Generate possible bids: 0, 1, 2, ..., 25 (scaled units)
        const possibleBids = Array.from({ length: 26 }, (_, i) => i);
        let bestBid = 0;
        let maxUtility = -Infinity;
        const SIMULATIONS = 100;

        // Opponent modeling based on previous bids frequency
        // Default to uniform if no history (0-25 range)
        let opponentBidProfile = Array(26).fill(1);
        if (opponentPreviousBids && opponentPreviousBids.length > 0) {
            // Count frequencies
            opponentPreviousBids.forEach(b => {
                if (b >= 0 && b <= MAX_BID_SCALED) opponentBidProfile[b] += 1; // Add weight
            });
        }

        // Normalize probability distribution for simulation
        const totalWeight = opponentBidProfile.reduce((a, b) => a + b, 0);
        const opponentProbabilities = opponentBidProfile.map(w => w / totalWeight);

        // Helper to sample opponent bid based on profile
        const sampleOpponentBid = () => {
            const r = Math.random();
            let accumulated = 0;
            for (let i = 0; i <= MAX_BID_SCALED; i++) {
                accumulated += opponentProbabilities[i];
                if (r <= accumulated) return Math.min(i, opponentBalance);
            }
            return Math.min(MAX_BID_SCALED, opponentBalance);
        };

        // Evaluate each possible move I can make
        for (const candidateBid of possibleBids) {
            if (candidateBid > myBalance) continue;

            let totalUtility = 0;

            for (let i = 0; i < SIMULATIONS; i++) {
                const oppBid = sampleOpponentBid();

                // Simulate Round Outcome
                let simMyWins = myWins;
                let simOppWins = opponentWins;
                let simMyBal = myBalance - candidateBid;
                // opponent also pays

                if (candidateBid > oppBid) {
                    simMyWins++;
                } else if (candidateBid < oppBid) {
                    simOppWins++;
                }

                // Heuristic Utility Function
                // Priority: Win Match > Tie Match > Remaining Balance
                let utility = 0;

                // Calculate match outcome value
                // We are at round `roundNumber`. Need to look ahead?
                // For simplified MC in restricted time, we assume 'current round win' is valuable
                // plus remaining balance is valuable.

                // Immediate Reward:
                if (simMyWins > simOppWins) utility += 100; // Currently winning
                else if (simMyWins == simOppWins) utility += 50; // Tying

                // Winning the round bonus
                if (candidateBid > oppBid) utility += 20;

                // Resource conservation value
                utility += simMyBal * 2;

                // Penalize losing resources without winning
                if (candidateBid <= oppBid) utility -= candidateBid;

                totalUtility += utility;
            }

            const expectedUtility = totalUtility / SIMULATIONS;
            if (expectedUtility > maxUtility) {
                maxUtility = expectedUtility;
                bestBid = candidateBid;
            }
        }

        return {
            bid: bestBid,
            reason: `Monte Carlo simulation (Utility: ${maxUtility.toFixed(2)}) chosen optimal bid.`
        };
    }
};
