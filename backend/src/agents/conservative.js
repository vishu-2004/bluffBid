export const conservative = {
    decide: (state) => {
        const { roundNumber, myBalance, opponentWins, myWins } = state;
        let bid = 0;
        let reason = "";

        // Conservative strategy
        // Low bids early to conserve resources
        if (roundNumber <= 2) {
            bid = Math.min(1, myBalance);
            reason = "Probe opponent with low bid, saving resources";
        }
        // Mid game, slightly increase if needed or if opponent is low on resources
        else if (roundNumber <= 4) {
            if (opponentWins > myWins) {
                bid = Math.min(3, myBalance);
                reason = "Escalating slightly to catch up";
            } else {
                bid = Math.min(2, myBalance);
                reason = "Maintaining safe play";
            }
        }
        // Late game, use saved resources to secure win
        else {
            bid = Math.min(5, myBalance);
            reason = "Late game burst with conserved resources";
        }

        return { bid, reason };
    }
};
