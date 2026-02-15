import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';

dotenv.config();

const openrouter = new OpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY
});

const SYSTEM_PROMPT = `You are an expert strategic AI agent playing BluffBid, an on-chain bluffing and bidding game.

RULES:
- A match has 5 rounds. Each player starts with a balance of 20.
- Each round, both players secretly choose a bid between 0 and 5 (inclusive).
- Both players always LOSE the amount they bid from their balance, regardless of who wins.
- The player with the HIGHER bid wins the round. Ties mean no one wins.
- The player who wins 3 or more rounds wins the match. If tied in wins, higher remaining balance wins.
- You CANNOT bid more than your current balance.

STRATEGY TIPS:
- Winning costs resources. Sometimes bidding 0 to conserve is smart.
- Track opponent patterns — if they always bid high, you can outbid or let them drain.
- Late-round balance advantage can be decisive in tiebreakers.
- Don't overspend early if you can't sustain it later.

You MUST respond with ONLY a valid JSON object (no markdown, no code fences):
{ "bid": <number 0-5>, "reason": "<short strategic explanation>" }`;

function buildPrompt(state) {
    const { roundNumber, myBalance, opponentBalance, myWins, opponentWins, roundHistory } = state;

    let prompt = `CURRENT GAME STATE:
- Round: ${roundNumber} of 5
- Your Balance: ${myBalance}
- Opponent Balance: ${opponentBalance}
- Your Wins: ${myWins}
- Opponent Wins: ${opponentWins}
- Rounds needed to win: ${3 - myWins} more`;

    if (roundHistory && roundHistory.length > 0) {
        prompt += `\n\nPREVIOUS ROUNDS:`;
        for (const r of roundHistory) {
            prompt += `\n  Round ${r.round}: You bid ${r.myBid}, Opponent bid ${r.opponentBid} → ${r.result}`;
        }
    }

    prompt += `\n\nWhat is your bid for Round ${roundNumber}? Remember: 0 ≤ bid ≤ min(5, ${myBalance}).`;

    return prompt;
}

function fallbackDecide(state) {
    const { myBalance, myWins, opponentWins, roundNumber } = state;
    let bid;

    if (myWins >= 3) {
        bid = 0;
    } else if (opponentWins >= 3) {
        bid = 0;
    } else if (roundNumber >= 4 && myWins < opponentWins) {
        bid = Math.min(4, myBalance);
    } else {
        bid = Math.min(2, myBalance);
    }

    return { bid, reason: '[Fallback] OpenRouter API unavailable, using heuristic' };
}

export const openRouter = {
    decide: async (state) => {
        try {
            const stream = await openrouter.chat.send({
                chatGenerationParams: {
                    model: 'stepfun/step-3.5-flash:free',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        { role: 'user', content: buildPrompt(state) }
                    ],
                    stream: true
                }
            });

            let response = '';
            for await (const chunk of stream) {
                const content = chunk.choices[0]?.delta?.content;
                if (content) {
                    response += content;
                }
            }

            response = response.trim();
            if (!response) {
                console.warn('OpenRouter returned empty response');
                return fallbackDecide(state);
            }

            // Extract JSON even if wrapped in markdown fences
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                console.warn('OpenRouter returned non-JSON response:', response);
                return fallbackDecide(state);
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const bid = Math.max(0, Math.min(5, Math.min(parsed.bid, state.myBalance)));

            return {
                bid: Math.floor(bid),
                reason: parsed.reason || 'OpenRouter strategic decision'
            };
        } catch (error) {
            console.error('OpenRouter error:', error.message);
            return fallbackDecide(state);
        }
    }
};
