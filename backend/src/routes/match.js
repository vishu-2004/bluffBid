import express from 'express';
import { runMatch } from '../services/agentEngine.js';
import { getMatchState } from '../services/contract.js';
import { pendingDecisions } from '../agents/mcp.js';

const router = express.Router();

/**
 * @swagger
 * /api/match/start:
 *   post:
 *     summary: Start a new match
 *     tags: [Match]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - agentA
 *               - agentB
 *             properties:
 *               agentA:
 *                 type: string
 *               agentB:
 *                 type: string
 *     responses:
 *       200:
 *         description: Match started
 *       400:
 *         description: Missing parameters
 */
router.post('/start', async (req, res) => {
    const { agentA, agentB } = req.body;

    if (!agentA || !agentB) {
        return res.status(400).json({ error: "Missing agentA or agentB" });
    }

    try {
        const matchId = await runMatch(agentA, agentB);
        res.json({
            message: "Match started",
            matchId: matchId.toString(),
            agentA,
            agentB
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to start match", details: e.message });
    }
});


/**
 * @swagger
 * /api/match/{id}/pending:
 *   get:
 *     summary: Check if game engine is waiting for an MCP player's bid
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Pending state or not waiting
 */
router.get('/:id/pending', (req, res) => {
    const { id } = req.params;

    // Check both player slots
    const keyA = `${id}:A`;
    const keyB = `${id}:B`;
    const pendingA = pendingDecisions.get(keyA);
    const pendingB = pendingDecisions.get(keyB);

    const result = { matchId: id, pendingPlayers: [] };

    if (pendingA) {
        result.pendingPlayers.push({ player: 'A', state: pendingA.state });
    }
    if (pendingB) {
        result.pendingPlayers.push({ player: 'B', state: pendingB.state });
    }

    res.json(result);
});


/**
 * @swagger
 * /api/match/{id}/bid:
 *   post:
 *     summary: Submit a bid for the MCP player
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - player
 *               - bid
 *             properties:
 *               player:
 *                 type: string
 *                 enum: [A, B]
 *               bid:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bid submitted
 *       400:
 *         description: Invalid request
 *       404:
 *         description: No pending decision for this player
 */
router.post('/:id/bid', (req, res) => {
    const { id } = req.params;
    const { player, bid, reason } = req.body;

    if (!player || bid === undefined) {
        return res.status(400).json({ error: "Missing 'player' (A or B) and 'bid' (number)" });
    }

    const key = `${id}:${player}`;
    const pending = pendingDecisions.get(key);

    if (!pending) {
        return res.status(404).json({
            error: `No pending decision for player ${player} in match ${id}`,
            hint: "The game engine is not currently waiting for this player's bid."
        });
    }

    // Validate bid against balance
    const maxBid = pending.state.myBalance;
    const bidNum = Number(bid);
    if (bidNum < 0 || bidNum > maxBid) {
        return res.status(400).json({
            error: `Bid must be between 0 and ${maxBid} (your current balance)`
        });
    }

    // Resolve the pending Promise — this unblocks the game engine
    pending.resolve({ bid: bidNum, reason: reason || 'MCP player decision' });
    pendingDecisions.delete(key);

    console.log(`[MCP] Match ${id} Player ${player} submitted bid: ${bidNum} — "${reason || 'no reason'}"`);
    res.json({ success: true, matchId: id, player, bid: bidNum, reason });
});


/**
 * @swagger
 * /api/match/{id}:
 *   get:
 *     summary: Get match state
 *     tags: [Match]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Match ID
 *     responses:
 *       200:
 *         description: Match state
 *       500:
 *         description: Failed to fetch match state
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const state = await getMatchState(BigInt(id));

        const jsonState = JSON.parse(JSON.stringify(
            state,
            (key, value) => typeof value === 'bigint' ? value.toString() : value
        ));

        res.json(jsonState);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch match state" });
    }
});

export default router;
