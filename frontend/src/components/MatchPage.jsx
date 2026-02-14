import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

// Mock data for demonstration - will be replaced with API calls
const generateMockMatchData = (id) => {
    return {
        id,
        status: 'finished', // 'commit', 'reveal', 'finished'
        currentRound: 5,
        totalRounds: 5,
        totalPot: 40,
        agentA: {
            type: 'Adaptive',
            balance: 15,
            wins: 3,
            lastBid: 4,
            currentDecision: 'Opponent showed aggression in rounds 3-4. Predicting high bid. Bidding 4 to secure victory.'
        },
        agentB: {
            type: 'Aggressive',
            balance: 5,
            wins: 2,
            lastBid: 5,
            currentDecision: 'Trailing by 1 round. Final push with maximum aggression. Bidding 5 to force tie.'
        },
        rounds: [
            { round: 1, bidA: 3, bidB: 4, winner: 'B', balanceA: 17, balanceB: 16 },
            { round: 2, bidA: 2, bidB: 2, winner: 'Tie', balanceA: 15, balanceB: 14 },
            { round: 3, bidA: 4, bidB: 3, winner: 'A', balanceA: 11, balanceB: 11 },
            { round: 4, bidA: 3, bidB: 4, winner: 'B', balanceA: 8, balanceB: 7 },
            { round: 5, bidA: 4, bidB: 5, winner: 'B', balanceA: 15, balanceB: 5 }
        ],
        winner: 'B',
        finalScore: { A: 1, B: 3 }
    };
};

const MatchPage = () => {
    const { id } = useParams();
    const [matchData, setMatchData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                // Attempt to fetch from backend
                const response = await fetch(`/api/match/${id}`);

                if (!response.ok) {
                    throw new Error('Match not found');
                }

                const data = await response.json();
                setMatchData(data);
            } catch (err) {
                // Fallback to mock data for demo purposes
                console.log('Using mock data for demonstration');
                setMatchData(generateMockMatchData(id));
            } finally {
                setIsLoading(false);
            }
        };

        fetchMatchData();

        // Poll for updates if match is active (every 2 seconds)
        let interval;
        if (matchData && matchData.status !== 'finished') {
            interval = setInterval(fetchMatchData, 2000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [id, matchData]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-2xl font-heading text-primary animate-pulse">
                    LOADING MATCH DATA...
                </div>
            </div>
        );
    }

    if (error || !matchData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="text-2xl font-heading text-danger mb-4">
                        MATCH NOT FOUND
                    </div>
                    <Link to="/" className="btn-primary">
                        RETURN TO ARENA
                    </Link>
                </div>
            </div>
        );
    }

    const getStatusBadge = () => {
        const statusColors = {
            commit: 'bg-primary',
            reveal: 'bg-success',
            finished: 'bg-text-light/50'
        };

        const statusText = {
            commit: 'COMMIT PHASE',
            reveal: 'REVEAL PHASE',
            finished: 'MATCH COMPLETE'
        };

        return (
            <span className={`px-4 py-2 ${statusColors[matchData.status]} text-bg-dark font-heading text-sm tracking-wider`}>
                {statusText[matchData.status]}
            </span>
        );
    };

    return (
        <div className="min-h-screen w-full px-4 py-8">
            <div className="max-w-7xl mx-auto">
                {/* Top Bar */}
                <div className="glass-card p-6 mb-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="text-sm text-text-light/60 font-body mb-1">Match ID</div>
                            <div className="text-xl font-heading text-primary">{matchData.id}</div>
                        </div>

                        <div>
                            <div className="text-sm text-text-light/60 font-body mb-1">Total Pot</div>
                            <div className="text-2xl font-heading text-success">{matchData.totalPot} MON</div>
                        </div>

                        <div>
                            <div className="text-sm text-text-light/60 font-body mb-1">Round</div>
                            <div className="text-xl font-heading">
                                {matchData.currentRound} of {matchData.totalRounds}
                            </div>
                        </div>

                        <div>
                            {getStatusBadge()}
                        </div>
                    </div>
                </div>

                {/* Agent Panels */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    {/* Agent A Panel */}
                    <div className="glass-card p-6 border-l-4 border-primary">
                        <h2 className="text-2xl font-heading font-bold mb-6 text-primary">AGENT A</h2>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Strategy Type</div>
                                <div className="text-xl font-heading">{matchData.agentA.type}</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Current Balance</div>
                                <div className="text-2xl font-heading text-success">{matchData.agentA.balance} MON</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Rounds Won</div>
                                <div className="text-xl font-heading">{matchData.agentA.wins}</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Last Bid</div>
                                <div className="text-xl font-heading">{matchData.agentA.lastBid} MON</div>
                            </div>
                        </div>
                    </div>

                    {/* Agent B Panel */}
                    <div className="glass-card p-6 border-l-4 border-danger">
                        <h2 className="text-2xl font-heading font-bold mb-6 text-danger">AGENT B</h2>

                        <div className="space-y-4">
                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Strategy Type</div>
                                <div className="text-xl font-heading">{matchData.agentB.type}</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Current Balance</div>
                                <div className="text-2xl font-heading text-success">{matchData.agentB.balance} MON</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Rounds Won</div>
                                <div className="text-xl font-heading">{matchData.agentB.wins}</div>
                            </div>

                            <div>
                                <div className="text-sm text-text-light/60 font-body mb-1">Last Bid</div>
                                <div className="text-xl font-heading">{matchData.agentB.lastBid} MON</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Live Decision Display */}
                {matchData.status !== 'finished' && (
                    <div className="glass-card p-6 mb-8">
                        <h3 className="text-xl font-heading font-bold mb-6 text-text-light">AGENT REASONING</h3>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="border-l-2 border-primary pl-4">
                                <div className="text-sm text-primary font-heading mb-2">Agent A Decision:</div>
                                <div className="text-text-light/80 font-body italic">
                                    "{matchData.agentA.currentDecision}"
                                </div>
                            </div>

                            <div className="border-l-2 border-danger pl-4">
                                <div className="text-sm text-danger font-heading mb-2">Agent B Decision:</div>
                                <div className="text-text-light/80 font-body italic">
                                    "{matchData.agentB.currentDecision}"
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Round Log Table */}
                <div className="glass-card p-6 mb-8">
                    <h3 className="text-xl font-heading font-bold mb-6">ROUND HISTORY</h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-primary/30">
                                    <th className="p-3 font-heading text-primary text-sm uppercase">Round</th>
                                    <th className="p-3 font-heading text-primary text-sm uppercase">A Bid</th>
                                    <th className="p-3 font-heading text-primary text-sm uppercase">B Bid</th>
                                    <th className="p-3 font-heading text-primary text-sm uppercase">Winner</th>
                                    <th className="p-3 font-heading text-primary text-sm uppercase">A Balance</th>
                                    <th className="p-3 font-heading text-primary text-sm uppercase">B Balance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {matchData.rounds.map((round) => (
                                    <tr key={round.round} className="border-b border-primary/10 hover:bg-card-bg/50 transition-colors">
                                        <td className="p-3 font-heading text-text-light">{round.round}</td>
                                        <td className="p-3 font-body text-text-light">{round.bidA} MON</td>
                                        <td className="p-3 font-body text-text-light">{round.bidB} MON</td>
                                        <td className="p-3 font-heading">
                                            <span className={`${round.winner === 'A' ? 'text-primary' :
                                                    round.winner === 'B' ? 'text-danger' :
                                                        'text-text-light/50'
                                                }`}>
                                                {round.winner === 'Tie' ? 'TIE' : `Agent ${round.winner}`}
                                            </span>
                                        </td>
                                        <td className="p-3 font-body text-success">{round.balanceA} MON</td>
                                        <td className="p-3 font-body text-success">{round.balanceB} MON</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Match End Section */}
                {matchData.status === 'finished' && (
                    <div className="glass-card p-8 text-center mb-8">
                        {matchData.winner === 'Tie' ? (
                            <>
                                <div className="text-4xl font-heading font-bold mb-4 text-text-light">
                                    MATCH TIED
                                </div>
                                <div className="text-xl font-body text-text-light/70 mb-6">
                                    Pot Split Equally
                                </div>
                                <div className="text-3xl font-heading text-success">
                                    {matchData.finalScore.A} - {matchData.finalScore.B}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-4xl font-heading font-bold mb-4 text-success">
                                    WINNER: {matchData.agentA.type === matchData.winner ? matchData.agentA.type : matchData.agentB.type} AGENT
                                </div>
                                <div className="text-xl font-body text-text-light/70 mb-6">
                                    Final Score
                                </div>
                                <div className="text-3xl font-heading">
                                    <span className={matchData.winner === 'A' ? 'text-primary' : 'text-text-light/50'}>
                                        {matchData.finalScore.A}
                                    </span>
                                    <span className="text-text-light/50 mx-4">-</span>
                                    <span className={matchData.winner === 'B' ? 'text-danger' : 'text-text-light/50'}>
                                        {matchData.finalScore.B}
                                    </span>
                                </div>
                            </>
                        )}

                        <div className="mt-8 flex justify-center gap-4">
                            <Link to="/" className="btn-primary">
                                NEW MATCH
                            </Link>
                            <Link to="/analytics" className="btn-primary">
                                VIEW ANALYTICS
                            </Link>
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="text-center">
                    <Link to="/" className="text-primary hover:text-primary/80 transition-colors font-body">
                        ← Back to Arena
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MatchPage;
