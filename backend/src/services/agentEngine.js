import { createMatch, joinMatch, commitBid, revealBid, getMatchState, walletClientA, walletClientB, publicClient } from './contract.js';
import { aggressive } from '../agents/aggressive.js';
import { conservative } from '../agents/conservative.js';
import { monteCarlo } from '../agents/monteCarlo.js';
import { gemini } from '../agents/gemini.js';
import { openRouter } from '../agents/openRouter.js';
import { toHex } from 'viem';

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

        // Build round history from each player's perspective
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

        // Transform to local state for agents
        const gameStateA = {
            roundNumber: Number(state.currentRound),
            myBalance: Number(state.player1.balance),
            opponentBalance: Number(state.player2.balance),
            myWins: Number(state.player1.wins),
            opponentWins: Number(state.player2.wins),
            opponentPreviousBids: this.history.map(h => h.p2Bid),
            roundHistory: roundHistoryA
        };

        const gameStateB = {
            roundNumber: Number(state.currentRound),
            myBalance: Number(state.player2.balance),
            opponentBalance: Number(state.player1.balance),
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

        console.log(`Agent A [${decisionA.reason}] -> Bid: ${decisionA.bid}`);
        console.log(`Agent B [${decisionB.reason}] -> Bid: ${decisionB.bid}`);

        // 3. Commit Phase
        const saltA = generateSalt();
        const saltB = generateSalt();

        console.log("Committing Bids...");
        const c1 = await commitBid(walletClientA, this.matchId, decisionA.bid, saltA);
        await publicClient.waitForTransactionReceipt({ hash: c1 });

        const c2 = await commitBid(walletClientB, this.matchId, decisionB.bid, saltB);
        await publicClient.waitForTransactionReceipt({ hash: c2 });

        console.log("Bids Committed. Revealing...");

        const r1 = await revealBid(walletClientA, this.matchId, decisionA.bid, saltA);
        await publicClient.waitForTransactionReceipt({ hash: r1 });

        const r2 = await revealBid(walletClientB, this.matchId, decisionB.bid, saltB);
        await publicClient.waitForTransactionReceipt({ hash: r2 });

        // 4. Record enriched history with round outcome
        this.history.push({
            round,
            p1Bid: decisionA.bid,
            p2Bid: decisionB.bid
        });

        console.log(`Round Resolved: A bid ${decisionA.bid}, B bid ${decisionB.bid} → ${decisionA.bid > decisionB.bid ? 'A wins' : decisionA.bid < decisionB.bid ? 'B wins' : 'Tie'}`);
    }
}
