export const aggressive = {
    decide: (state) => {
        const { roundNumber, myBalance, opponentWins, myWins } = state;
        let bid = 0;
        let reason = "";

        // Simple aggressive strategy
        // Bet high early to secure lead
        if (roundNumber <= 2) {
            bid = Math.min(4, myBalance);
            reason = "Aggressive start to secure early lead";
        }
        // If losing, bet remaining balance aggressively
        else if (opponentWins > myWins) {
            bid = Math.min(5, myBalance);
            reason = "Losing, need to catch up with max aggression";
        }
        // If winning, maintain pressure but conserve slightly
        else {
            bid = Math.min(3, myBalance);
            reason = "Maintenance pressure while winning";
        }

        return { bid, reason };
    }
};
