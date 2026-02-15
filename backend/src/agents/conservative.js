// Scaled bid constants: 0-25 (represents 0.0-2.5 MON with 0.1 step)
const MAX_BID_SCALED = 25; // 2.5 MON

export const conservative = {
    decide: (state) => {
        const { roundNumber, myBalance, opponentWins, myWins } = state;
        let bid = 0;
        let reason = "";

        // Conservative strategy (all values in scaled units)
        // Low bids early to conserve resources (scaled: ~5 = 0.5 MON)
        if (roundNumber <= 2) {
            bid = Math.min(5, myBalance);
            reason = "Probe opponent with low bid, saving resources";
        }
        // Mid game, slightly increase if needed (scaled: ~15-20 = 1.5-2.0 MON)
        else if (roundNumber <= 4) {
            if (opponentWins > myWins) {
                bid = Math.min(15, myBalance);
                reason = "Escalating slightly to catch up";
            } else {
                bid = Math.min(10, myBalance);
                reason = "Maintaining safe play";
            }
        }
        // Late game, use saved resources to secure win (scaled: max 25 = 2.5 MON)
        else {
            bid = Math.min(MAX_BID_SCALED, myBalance);
            reason = "Late game burst with conserved resources";
        }

        // Ensure bid is valid (0-25, step of 1, <= balance)
        bid = Math.max(0, Math.min(MAX_BID_SCALED, Math.min(bid, myBalance)));

        return { bid, reason };
    }
};
