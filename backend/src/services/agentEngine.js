import { createMatch, joinMatch, commitBid, revealBid, getMatchState, walletClientA, walletClientB, publicClient, MAX_BID_SCALED } from './contract.js';
import { aggressive } from '../agents/aggressive.js';
import { conservative } from '../agents/conservative.js';
import { monteCarlo } from '../agents/monteCarlo.js';
import { gemini } from '../agents/gemini.js';
import { openRouter } from '../agents/openRouter.js';
import { toHex } from 'viem';
import { storeMatchResult } from './matchHistory.js';

// Scaling constants
const SCALE_FACTOR = 10; // Contract scales by 10
const STARTING_BALANCE_SCALED = 40; // 4.0 MON in scaled units

const AGENTS = {
    'aggressive': aggressive,
    'conservative': conservative,
    'monteCarlo': monteCarlo,
    'gemini': gemini,
    'openRouter': openRouter
};

// Helper to generate salt
const generateSalt = () => toHex(crypto.getRandomValues(new Uint8Array(32)));
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Store active/completed match engines in memory for API access
export const matchExecutors = {};

export async function runMatch(agentAName, agentBName) {
    console.log(`\n=== Starting Match: ${agentAName} vs ${agentBName} ===`);

    try {
        // 1. Create Match
        console.log("Creating match...");
        const hash = await createMatch();
        // Wait for receipt to get ID
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        // Extract matchId from logs. 
        // Event MatchCreated(uint256 indexed matchId, address indexed creator);
        // Topic 0: Sig, Topic 1: MatchId, Topic 2: Creator
        console.log(receipt.logs);
        if (!receipt.logs || receipt.logs.length === 0) {
            throw new Error('createMatch transaction produced no logs — check RPC compatibility and contract deployment.');
        }
        const matchId = BigInt(receipt.logs[0].topics[1]);
        console.log(`Match Created! ID: ${matchId}`);

        // Handle the rest of the match in the background
        (async () => {
            try {
                // 2. Join Match
                console.log(`Match ${matchId}: Joining...`);
                const joinHash = await joinMatch(matchId);
                await publicClient.waitForTransactionReceipt({ hash: joinHash });
                console.log(`Match ${matchId}: Player 2 Joined.`);

                const engine = new GameEngine(matchId, agentAName, agentBName);
                matchExecutors[matchId.toString()] = engine; // Store for API

                console.log(`Match ${matchId}: Starting Rounds...`);

                for (let i = 1; i <= 5; i++) {
                    await engine.playRound(i);
                }

                console.log(`\n=== Match ${matchId} Completed ===`);
                const finalState = await getMatchState(matchId);
                // Determine winner locally from state for log
                const w1 = Number(finalState.player1.wins);
                const w2 = Number(finalState.player2.wins);
                if (w1 > w2) console.log(`Match ${matchId}: Winner: Agent A (${agentAName})`);
                else if (w2 > w1) console.log(`Match ${matchId}: Winner: Agent B (${agentBName})`);
                else console.log(`Match ${matchId}: Result: Tie`);

                // Store match result for analytics
                storeMatchResult({
                    matchId: matchId.toString(),
                    agentA: agentAName,
                    agentB: agentBName,
                    winsA: w1,
                    winsB: w2,
                    rounds: engine.history,
                    completedAt: new Date()
                });
            } catch (bgError) {
                console.error(`Match ${matchId} Background Execution Error:`, bgError);
            }
        })();

        return matchId;

    } catch (e) {
        console.error("Match Creation Error:", e);
        throw e;
    }
}

export class GameEngine {
    constructor(matchId, agentAName, agentBName) {
        this.matchId = matchId;
        this.agentA = AGENTS[agentAName];
        this.agentB = AGENTS[agentBName];
        this.history = [];
    }

    async playRound(round) {
        console.log(`\n--- Round ${round} ---`);

        // 1. Get On-Chain State
        const state = await getMatchState(this.matchId);

        // Check if match is already completed
        if (state.status === 2) { // MatchStatus.Completed = 2
            console.log(`Match ${this.matchId} already completed, skipping round ${round}`);
            return;
        }

        // Contract now stores balances directly in scaled units (40 = 4.0 MON)
        // No conversion needed - balances are already in scaled units
        const balance1Scaled = Number(state.player1.balance);
        const balance2Scaled = Number(state.player2.balance);

        // Edge case: If both balances are 0, stop the match
        if (balance1Scaled === 0 && balance2Scaled === 0) {
            console.log(`Match ${this.matchId}: Both balances exhausted, ending match early`);
            return;
        }

        // Build round history from each player's perspective (bids are already in scaled units)
        const roundHistoryA = this.history.map(h => ({
            round: h.round,
            myBid: h.p1Bid,
            opponentBid: h.p2Bid,
            result: h.p1Bid > h.p2Bid ? 'You won' : h.p1Bid < h.p2Bid ? 'You lost' : 'Tie'
        }));

        const roundHistoryB = this.history.map(h => ({
            round: h.round,
            myBid: h.p2Bid,
            opponentBid: h.p1Bid,
            result: h.p2Bid > h.p1Bid ? 'You won' : h.p2Bid < h.p1Bid ? 'You lost' : 'Tie'
        }));

        // Transform to local state for agents (all values in scaled units)
        const gameStateA = {
            roundNumber: Number(state.currentRound),
            myBalance: balance1Scaled,
            opponentBalance: balance2Scaled,
            myWins: Number(state.player1.wins),
            opponentWins: Number(state.player2.wins),
            opponentPreviousBids: this.history.map(h => h.p2Bid),
            roundHistory: roundHistoryA
        };

        const gameStateB = {
            roundNumber: Number(state.currentRound),
            myBalance: balance2Scaled,
            opponentBalance: balance1Scaled,
            myWins: Number(state.player2.wins),
            opponentWins: Number(state.player1.wins),
            opponentPreviousBids: this.history.map(h => h.p1Bid),
            roundHistory: roundHistoryB
        };

        // 2. Decide Bids in parallel (await supports both sync and async agents)
        const [decisionA, decisionB] = await Promise.all([
            this.agentA.decide(gameStateA),
            this.agentB.decide(gameStateB)
        ]);

        // Edge case validation: Ensure bids are valid
        // Validate bid A
        let bidA = Math.max(0, Math.min(MAX_BID_SCALED, decisionA.bid));
        if (bidA > balance1Scaled) {
            console.warn(`Agent A bid ${bidA} exceeds balance ${balance1Scaled}, clamping to balance`);
            bidA = balance1Scaled;
        }
        if (bidA < 0) {
            console.warn(`Agent A bid ${bidA} is negative, setting to 0`);
            bidA = 0;
        }

        // Validate bid B
        let bidB = Math.max(0, Math.min(MAX_BID_SCALED, decisionB.bid));
        if (bidB > balance2Scaled) {
            console.warn(`Agent B bid ${bidB} exceeds balance ${balance2Scaled}, clamping to balance`);
            bidB = balance2Scaled;
        }
        if (bidB < 0) {
            console.warn(`Agent B bid ${bidB} is negative, setting to 0`);
            bidB = 0;
        }

        console.log(`Agent A [${decisionA.reason}] -> Bid: ${bidA} (${(bidA / 10).toFixed(1)} MON)`);
        console.log(`Agent B [${decisionB.reason}] -> Bid: ${bidB} (${(bidB / 10).toFixed(1)} MON)`);

        // 3. Commit Phase
        const saltA = generateSalt();
        const saltB = generateSalt();

        console.log("Committing Bids...");
        const c1 = await commitBid(walletClientA, this.matchId, bidA, saltA);
        await publicClient.waitForTransactionReceipt({ hash: c1 });

        const c2 = await commitBid(walletClientB, this.matchId, bidB, saltB);
        await publicClient.waitForTransactionReceipt({ hash: c2 });

        console.log("Bids Committed. Revealing...");

        const r1 = await revealBid(walletClientA, this.matchId, bidA, saltA);
        await publicClient.waitForTransactionReceipt({ hash: r1 });

        const r2 = await revealBid(walletClientB, this.matchId, bidB, saltB);
        await publicClient.waitForTransactionReceipt({ hash: r2 });

        // 4. Record enriched history with round outcome and NEW BALANCE
        // Need to fetch state again to get updated balances
        const postRoundState = await getMatchState(this.matchId);

        // Balances are already in scaled units (no conversion needed)
        const postBalance1Scaled = Number(postRoundState.player1.balance);
        const postBalance2Scaled = Number(postRoundState.player2.balance);

        this.history.push({
            round,
            p1Bid: bidA, // Store in scaled units
            p2Bid: bidB, // Store in scaled units
            balanceA: postBalance1Scaled, // Store in scaled units
            balanceB: postBalance2Scaled, // Store in scaled units
            winner: bidA > bidB ? 'A' : bidA < bidB ? 'B' : 'Tie'
        });

        console.log(`Round Resolved: A bid ${bidA} (${(bidA / 10).toFixed(1)} MON), B bid ${bidB} (${(bidB / 10).toFixed(1)} MON) → ${bidA > bidB ? 'A wins' : bidA < bidB ? 'B wins' : 'Tie'}`);
    }
}
