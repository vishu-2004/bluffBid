import express from 'express';
import { runMatch } from '../services/agentEngine.js';
import { getMatchState } from '../services/contract.js';

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
