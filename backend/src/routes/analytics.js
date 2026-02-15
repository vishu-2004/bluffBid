import express from 'express';
import { getAnalytics } from '../services/matchHistory.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics data for all agents
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Analytics data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 agentStats:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                       matches:
 *                         type: number
 *                       wins:
 *                         type: number
 *                       avgBid:
 *                         type: number
 *                       aggression:
 *                         type: number
 *                 totalMatches:
 *                   type: number
 */
router.get('/', async (req, res) => {
    try {
        const analytics = getAnalytics();
        res.json(analytics);
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch analytics", details: e.message });
    }
});

export default router;

