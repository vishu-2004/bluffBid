// Scaled bid constants: 0-25 (represents 0.0-2.5 MON with 0.1 step)
const MAX_BID_SCALED = 25; // 2.5 MON

export const aggressive = {
    decide: (state) => {
        const { roundNumber, myBalance, opponentWins, myWins } = state;
        let bid = 0;
        let reason = "";

        // Simple aggressive strategy (all values in scaled units)
        // Bet high early to secure lead (scaled: ~20 = 2.0 MON)
        if (roundNumber <= 2) {
            bid = Math.min(20, myBalance);
            reason = "Aggressive start to secure early lead";
        }
        // If losing, bet remaining balance aggressively (scaled: max 25 = 2.5 MON)
        else if (opponentWins > myWins) {
            bid = Math.min(MAX_BID_SCALED, myBalance);
            reason = "Losing, need to catch up with max aggression";
        }
        // If winning, maintain pressure but conserve slightly (scaled: ~15 = 1.5 MON)
        else {
            bid = Math.min(15, myBalance);
            reason = "Maintenance pressure while winning";
        }

        // Ensure bid is valid (0-25, step of 1, <= balance)
        bid = Math.max(0, Math.min(MAX_BID_SCALED, Math.min(bid, myBalance)));

        return { bid, reason };
    }
};
