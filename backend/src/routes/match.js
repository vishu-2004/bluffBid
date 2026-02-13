import express from 'express';
import { runMatch } from '../services/agentEngine.js';
import { getMatchState } from '../services/contract.js';

const router = express.Router();

// Start a new match
router.post('/start', async (req, res) => {
    const { agentA, agentB } = req.body;

    if (!agentA || !agentB) {
        return res.status(400).json({ error: "Missing agentA or agentB" });
    }

    // Run asynchronously
    runMatch(agentA, agentB);

    res.json({ message: "Match started", agentA, agentB });
});

// Get Match State
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const state = await getMatchState(BigInt(id));
        // Serialize BigInt for JSON
        const jsonState = JSON.parse(JSON.stringify(state, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ));
        res.json(jsonState);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch match state" });
    }
});

export default router;
