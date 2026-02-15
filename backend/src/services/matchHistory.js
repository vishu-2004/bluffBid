// In-memory match history storage
// In production, this should be replaced with a database

const matchHistory = [];

// Map backend agent names to frontend display names
const agentNameMap = {
    'aggressive': 'Aggressive',
    'conservative': 'Conservative',
    'openRouter': 'Adaptive',
    'gemini': 'Adaptive', // Also map gemini to Adaptive
    'monteCarlo': 'MonteCarlo' // Keep for backward compatibility but won't be used
};

/**
 * Store a completed match result
 * @param {Object} matchData - Match result data
 * @param {string} matchData.matchId - Match ID
 * @param {string} matchData.agentA - Agent A type (backend name)
 * @param {string} matchData.agentB - Agent B type (backend name)
 * @param {number} matchData.winsA - Agent A wins
 * @param {number} matchData.winsB - Agent B wins
 * @param {Array} matchData.rounds - Array of round data with bids
 * @param {Date} matchData.completedAt - Completion timestamp
 */
export function storeMatchResult(matchData) {
    const frontendAgentA = agentNameMap[matchData.agentA] || matchData.agentA;
    const frontendAgentB = agentNameMap[matchData.agentB] || matchData.agentB;

    // Only store matches with the three supported agent types
    const supportedAgents = ['Aggressive', 'Conservative', 'Adaptive'];
    if (!supportedAgents.includes(frontendAgentA) || !supportedAgents.includes(frontendAgentB)) {
        return; // Skip storing matches with unsupported agents
    }

    const historyEntry = {
        matchId: matchData.matchId.toString(),
        agentA: frontendAgentA,
        agentB: frontendAgentB,
        winsA: matchData.winsA,
        winsB: matchData.winsB,
        rounds: matchData.rounds || [],
        completedAt: matchData.completedAt || new Date()
    };

    matchHistory.push(historyEntry);
    console.log(`Stored match result: ${frontendAgentA} vs ${frontendAgentB} (${matchData.winsA}-${matchData.winsB})`);
}

/**
 * Get analytics data aggregated from match history
 * @returns {Object} Analytics data
 */
export function getAnalytics() {
    const supportedAgents = ['Aggressive', 'Conservative', 'Adaptive'];
    const agentStatsMap = {};

    // Initialize stats for each agent
    supportedAgents.forEach(agent => {
        agentStatsMap[agent] = {
            name: agent,
            matches: 0,
            wins: 0,
            totalBids: 0,
            bidCount: 0,
            bidValues: []
        };
    });

    // Aggregate data from match history
    matchHistory.forEach(match => {
        // Process Agent A
        if (agentStatsMap[match.agentA]) {
            agentStatsMap[match.agentA].matches++;
            if (match.winsA > match.winsB) {
                agentStatsMap[match.agentA].wins++;
            }
            // Collect bids from rounds
            match.rounds.forEach(round => {
                if (round.p1Bid !== undefined) {
                    agentStatsMap[match.agentA].totalBids += round.p1Bid;
                    agentStatsMap[match.agentA].bidCount++;
                    agentStatsMap[match.agentA].bidValues.push(round.p1Bid);
                }
            });
        }

        // Process Agent B
        if (agentStatsMap[match.agentB]) {
            agentStatsMap[match.agentB].matches++;
            if (match.winsB > match.winsA) {
                agentStatsMap[match.agentB].wins++;
            }
            // Collect bids from rounds
            match.rounds.forEach(round => {
                if (round.p2Bid !== undefined) {
                    agentStatsMap[match.agentB].totalBids += round.p2Bid;
                    agentStatsMap[match.agentB].bidCount++;
                    agentStatsMap[match.agentB].bidValues.push(round.p2Bid);
                }
            });
        }
    });

    // Calculate final stats
    const agentStats = supportedAgents.map(agentName => {
        const stats = agentStatsMap[agentName];
        const avgBid = stats.bidCount > 0 ? stats.totalBids / stats.bidCount : 0;

        // Calculate aggression index (0-100)
        // Based on average bid (0-5 scale) and bid volatility
        let aggression = 0;
        if (stats.bidValues.length > 0) {
            const avg = avgBid;
            const variance = stats.bidValues.reduce((sum, bid) => sum + Math.pow(bid - avg, 2), 0) / stats.bidValues.length;
            const stdDev = Math.sqrt(variance);
            // Normalize: avg bid contributes 0-83%, volatility contributes 0-17%
            aggression = Math.min(100, Math.round((avg / 5) * 83 + Math.min(stdDev / 2, 1) * 17));
        }

        return {
            name: agentName,
            matches: stats.matches,
            wins: stats.wins,
            avgBid: parseFloat(avgBid.toFixed(1)),
            aggression: aggression
        };
    }).filter(stat => stat.matches > 0); // Only return agents with matches

    return {
        agentStats,
        totalMatches: matchHistory.length
    };
}

/**
 * Get all match history (for debugging/admin)
 */
export function getAllMatches() {
    return matchHistory;
}

