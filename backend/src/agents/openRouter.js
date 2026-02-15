import { OpenRouter } from '@openrouter/sdk';
import dotenv from 'dotenv';

dotenv.config();

const openrouter = new OpenRouter({
    apiKey: process.env.OPEN_ROUTER_API_KEY
});

// ═══════════════════════════════════════
//  STRATEGY-SPECIFIC SYSTEM PROMPTS
// ═══════════════════════════════════════

const RULES_BLOCK = `RULES:
- A match has 5 rounds. Each player starts with a balance of 4.0 MON.
- Each round, both players secretly choose a bid between 0.0 and 2.5 MON (inclusive).
- Bid step size is 0.1 MON (valid bids: 0.0, 0.1, 0.2, ..., 2.5).
- Both players always LOSE the amount they bid from their balance, regardless of who wins.
- The player with the HIGHER bid wins the round. Ties mean no one wins.
- The player who wins 3 or more rounds wins the match. If tied in wins, higher remaining balance wins.
- You CANNOT bid more than your current balance.`;

const RESPONSE_FORMAT = `You MUST respond with ONLY a valid JSON object (no markdown, no code fences):
{ "bid": <number 0.0-2.5>, "reason": "<short strategic explanation>" }`;

const AGGRESSIVE_PROMPT = `You are a RUTHLESSLY AGGRESSIVE AI agent playing BluffBid, an on-chain bluffing and bidding game.

${RULES_BLOCK}

YOUR STRATEGY — MAXIMUM AGGRESSION:
- Dominate early. Bid HIGH in rounds 1-3 to secure a quick 3-win lead.
- Intimidate. Your opponent should feel overwhelmed by your spending.
- If you have the lead (2+ wins), you can afford to ease off slightly — but never go passive.
- If losing, go ALL IN. Bid your maximum to force a comeback.
- Sacrifice balance for wins. Round victories matter more than leftover money.
- Never bid 0. A 0 bid is a wasted round. Minimum bid should be 1.0 MON unless balance is critically low.
- Preferred bid range: 1.0–1.5 MON. You are here to CRUSH, not to conserve.

${RESPONSE_FORMAT}`;

const CONSERVATIVE_PROMPT = `You are a CALCULATING CONSERVATIVE AI agent playing BluffBid, an on-chain bluffing and bidding game.

${RULES_BLOCK}

YOUR STRATEGY — CAPITAL PRESERVATION:
- Conserve early. Bid LOW (0.0–0.5 MON) in rounds 1-2 to let your opponent drain themselves.
- Patience wins wars. If your opponent overspends early, they'll be weak in later rounds.
- Mid-game (rounds 3-4): Increase bids modestly only if you're behind in wins. Otherwise maintain low bids.
- Late game (round 5): If you have a balance advantage, unleash your saved capital for a decisive win.
- Tiebreaker awareness: If wins are tied, having MORE remaining balance wins you the match. This is your secret weapon.
- It's OK to lose early rounds on purpose — you're setting a trap.
- Preferred bid range: 0.0–1.0 MON early, 1.5–2.5 MON in the final rounds when it matters.

${RESPONSE_FORMAT}`;

const ADAPTIVE_PROMPT = `You are an ADAPTIVE INTELLIGENCE AI agent playing BluffBid, an on-chain bluffing and bidding game.

${RULES_BLOCK}

YOUR STRATEGY — PATTERN RECOGNITION & COUNTER-PLAY:
- Round 1: Open with a moderate probe bid (0.8–1.2 MON) to gather information without overcommitting.
- Analyze opponent history carefully after each round:
  • If they bid high consistently → let them drain, bid low, then strike when they're weak.
  • If they bid low consistently → outbid them cheaply (just barely above their pattern) to win rounds efficiently.
  • If they alternate → predict the next move and counter it.
  • If they're unpredictable → match their average bid + 0.2 to maintain slight edge.
- Balance-aware decisions: Always factor both players' remaining balance. If opponent is running low, you can afford smaller bids.
- Win-aware decisions: If you need N wins and there are N rounds left, you MUST be aggressive for those rounds.
- If ahead in wins, conserve. If behind, escalate intelligently based on opponent's pattern.
- Never be formulaic — vary your bids to stay unpredictable while maintaining strategic advantage.

${RESPONSE_FORMAT}`;

// ═══════════════════════════════════════
//  SHARED HELPERS
// ═══════════════════════════════════════

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

function fallbackDecide(state) {
    const { myBalance, myWins, opponentWins, roundNumber } = state;
    const MAX_BID_SCALED = 25; // 2.5 MON
    let bid;

    if (myWins >= 3) {
        bid = 0;
    } else if (opponentWins >= 3) {
        bid = 0;
    } else if (roundNumber >= 4 && myWins < opponentWins) {
        bid = Math.min(20, myBalance); // 2.0 MON scaled
    } else {
        bid = Math.min(10, myBalance); // 1.0 MON scaled
    }

    // Ensure bid is valid (0-25, step of 1, <= balance)
    bid = Math.max(0, Math.min(MAX_BID_SCALED, Math.min(bid, myBalance)));

    return { bid, reason: '[Fallback] OpenRouter API unavailable, using heuristic' };
}

// ═══════════════════════════════════════
//  AGENT FACTORY
// ═══════════════════════════════════════

function createOpenRouterAgent(systemPrompt) {
    return {
        decide: async (state) => {
            try {
                const stream = await openrouter.chat.send({
                    chatGenerationParams: {
                        model: 'google/gemma-3-27b-it',
                        messages: [
                            { role: 'system', content: systemPrompt },
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
                // Convert user's decimal bid (0.0-2.5) to scaled integer (0-25)
                const bidDecimal = Math.max(0, Math.min(2.5, parsed.bid || 0));
                const bidScaled = Math.round(bidDecimal * 10); // Convert to scaled units
                // Ensure bid is valid (0-25, <= balance)
                const bid = Math.max(0, Math.min(25, Math.min(bidScaled, state.myBalance)));

                return {
                    bid: bid,
                    reason: parsed.reason || 'OpenRouter strategic decision'
                };
            } catch (error) {
                console.error('OpenRouter error:', error.message);
                return fallbackDecide(state);
            }
        }
    };
}

// ═══════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════

export const openRouterAggressive = createOpenRouterAgent(AGGRESSIVE_PROMPT);
export const openRouterConservative = createOpenRouterAgent(CONSERVATIVE_PROMPT);
export const openRouterAdaptive = createOpenRouterAgent(ADAPTIVE_PROMPT);

// Backward compatibility
export const openRouter = openRouterAdaptive;
