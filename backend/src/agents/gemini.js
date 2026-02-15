import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

const SYSTEM_PROMPT = `You are an expert strategic AI agent playing BluffBid, an on-chain bluffing and bidding game.

RULES:
- A match has 5 rounds. Each player starts with a balance of 4.0 MON.
- Each round, both players secretly choose a bid between 0.0 and 2.5 MON (inclusive).
- Bid step size is 0.1 MON (valid bids: 0.0, 0.1, 0.2, ..., 2.5).
- Both players always LOSE the amount they bid from their balance, regardless of who wins.
- The player with the HIGHER bid wins the round. Ties mean no one wins.
- The player who wins 3 or more rounds wins the match. If tied in wins, higher remaining balance wins.
- You CANNOT bid more than your current balance.

STRATEGY TIPS:
- Winning costs resources. Sometimes bidding 0.0 to conserve is smart.
- Track opponent patterns — if they always bid high, you can outbid or let them drain.
- Late-round balance advantage can be decisive in tiebreakers.
- Don't overspend early if you can't sustain it later.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences):
{ "bid": <number 0.0-2.5>, "reason": "<short strategic explanation>" }`;

/**
 * Build a human-readable summary of game state for Gemini
 */
function buildPrompt(state) {
    const { roundNumber, myBalance, opponentBalance, myWins, opponentWins, roundHistory } = state;
    
    // Convert scaled values to display format (divide by 10)
    const myBalanceDisplay = (myBalance / 10).toFixed(1);
    const opponentBalanceDisplay = (opponentBalance / 10).toFixed(1);

    let prompt = `CURRENT GAME STATE:
- Round: ${roundNumber} of 5
- Your Balance: ${myBalanceDisplay} MON
- Opponent Balance: ${opponentBalanceDisplay} MON
- Your Wins: ${myWins}
- Opponent Wins: ${opponentWins}
- Rounds needed to win: ${3 - myWins} more`;

    if (roundHistory && roundHistory.length > 0) {
        prompt += `\n\nPREVIOUS ROUNDS:`;
        for (const r of roundHistory) {
            // Convert scaled bids to display format
            const myBidDisplay = (r.myBid / 10).toFixed(1);
            const oppBidDisplay = (r.opponentBid / 10).toFixed(1);
            prompt += `\n  Round ${r.round}: You bid ${myBidDisplay} MON, Opponent bid ${oppBidDisplay} MON → ${r.result}`;
        }
    }

    prompt += `\n\nWhat is your bid for Round ${roundNumber}? Remember: 0.0 ≤ bid ≤ min(2.5, ${myBalanceDisplay}) MON, step size 0.1 MON.`;

    return prompt;
}

/**
 * Fallback heuristic if Gemini call fails
 */
function fallbackDecide(state) {
    const { myBalance, myWins, opponentWins, roundNumber } = state;
    const MAX_BID_SCALED = 25; // 2.5 MON
    let bid;

    if (myWins >= 3) {
        bid = 0; // Already won enough rounds
    } else if (opponentWins >= 3) {
        bid = 0; // Already lost, conserve
    } else if (roundNumber >= 4 && myWins < opponentWins) {
        bid = Math.min(20, myBalance); // 2.0 MON scaled - Desperate push
    } else {
        bid = Math.min(10, myBalance); // 1.0 MON scaled - Moderate default
    }

    // Ensure bid is valid (0-25, step of 1, <= balance)
    bid = Math.max(0, Math.min(MAX_BID_SCALED, Math.min(bid, myBalance)));

    return { bid, reason: '[Fallback] Gemini API unavailable, using heuristic' };
}

export const gemini = {
    decide: async (state) => {
        try {
            const userPrompt = buildPrompt(state);
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
            });

            const text = result.response.text().trim();

            // Try to extract JSON even if wrapped in markdown fences
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('Gemini returned non-JSON response:', text);
                return fallbackDecide(state);
            }

            const parsed = JSON.parse(jsonMatch[0]);
            // Convert user's decimal bid (0.0-2.5) to scaled integer (0-25)
            const bidDecimal = Math.max(0, Math.min(2.5, parsed.bid || 0));
            const bidScaled = Math.round(bidDecimal * 10); // Convert to scaled units
            // Ensure bid is valid (0-25, <= balance)
            const bid = Math.max(0, Math.min(25, Math.min(bidScaled, state.myBalance)));

            return {
                bid: bid,
                reason: parsed.reason || 'Gemini strategic decision'
            };
        } catch (error) {
            console.error('Gemini API error:', error.message);
            return fallbackDecide(state);
        }
    }
};
