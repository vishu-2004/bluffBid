import express from 'express';
import { getAnalytics, getAllMatches } from '../services/matchHistory.js';

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
        console.log(`Analytics request: returning ${analytics.agentStats.length} agents, ${analytics.totalMatches} total matches`);
        res.json(analytics);
    } catch (e) {
        console.error('Analytics error:', e);
        res.status(500).json({ error: "Failed to fetch analytics", details: e.message });
    }
});

// Debug endpoint to see all stored matches
router.get('/debug', async (req, res) => {
    try {
        const allMatches = getAllMatches();
        res.json({
            totalMatches: allMatches.length,
            matches: allMatches
        });
    } catch (e) {
        res.status(500).json({ error: "Failed to fetch debug data", details: e.message });
    }
});

export default router;

