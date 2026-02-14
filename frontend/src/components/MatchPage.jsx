import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';

// Mock data for demonstration
const generateMockMatchData = (id, agentAType, agentBType) => {
    return {
        id,
        totalPot: 40,
        agentA: { type: agentAType || 'Adaptive', startBalance: 20 },
        agentB: { type: agentBType || 'Aggressive', startBalance: 20 },
        rounds: [
            { round: 1, bidA: 3, bidB: 4, winner: 'B', balanceA: 17, balanceB: 16 },
            { round: 2, bidA: 2, bidB: 2, winner: 'Tie', balanceA: 15, balanceB: 14 },
            { round: 3, bidA: 4, bidB: 3, winner: 'A', balanceA: 11, balanceB: 11 },
            { round: 4, bidA: 3, bidB: 4, winner: 'B', balanceA: 8, balanceB: 7 },
            { round: 5, bidA: 4, bidB: 5, winner: 'B', balanceA: 4, balanceB: 2 },
        ],
    };
};

const MatchPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const agentAType = searchParams.get('agentA');
    const agentBType = searchParams.get('agentB');
    const [matchData, setMatchData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [visibleRounds, setVisibleRounds] = useState(0);
    const [showResultPopup, setShowResultPopup] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        const fetchMatchData = async () => {
            try {
                const response = await fetch(`/api/match/${id}`);
                if (!response.ok) throw new Error('Match not found');
                const data = await response.json();
                setMatchData(data);
            } catch (err) {
                console.log('Using mock data for demonstration');
                setMatchData(generateMockMatchData(id, agentAType, agentBType));
            } finally {
                setIsLoading(false);
            }
        };
        fetchMatchData();
    }, [id]);

    useEffect(() => {
        if (!matchData || matchData.rounds.length === 0) return;
        intervalRef.current = setInterval(() => {
            setVisibleRounds((prev) => {
                const next = prev + 1;
                if (next >= matchData.rounds.length) {
                    clearInterval(intervalRef.current);
                    setTimeout(() => setShowResultPopup(true), 1000);
                }
                return next;
            });
        }, 1500);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [matchData]);

    const getProgressiveStats = () => {
        if (!matchData) return { winsA: 0, winsB: 0, balanceA: 20, balanceB: 20, currentRound: 0 };
        const revealedRounds = matchData.rounds.slice(0, visibleRounds);
        let winsA = 0, winsB = 0;
        let balanceA = matchData.agentA.startBalance || 20;
        let balanceB = matchData.agentB.startBalance || 20;
        if (revealedRounds.length > 0) {
            const lastRound = revealedRounds[revealedRounds.length - 1];
            balanceA = lastRound.balanceA;
            balanceB = lastRound.balanceB;
            revealedRounds.forEach((r) => {
                if (r.winner === 'A') winsA++;
                else if (r.winner === 'B') winsB++;
            });
        }
        return { winsA, winsB, balanceA, balanceB, currentRound: revealedRounds.length };
    };

    const stats = getProgressiveStats();
    const matchFinished = visibleRounds >= 5;

    const getMatchResult = () => {
        if (!matchFinished) return null;
        if (stats.winsA > stats.winsB) return { winner: 'A', type: matchData.agentA.type };
        if (stats.winsB > stats.winsA) return { winner: 'B', type: matchData.agentB.type };
        return { winner: 'Tie', type: null };
    };

    const result = getMatchResult();

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid-pattern">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6" />
                    <div className="text-xl font-heading text-primary tracking-wider">
                        LOADING MATCH DATA...
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !matchData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-grid-pattern">
                <div className="text-center glass-card p-12">
                    <div className="text-5xl mb-6">⚠️</div>
                    <div className="text-2xl font-heading text-danger mb-6 tracking-wider">
                        MATCH NOT FOUND
                    </div>
                    <Link to="/" className="btn-primary">
                        RETURN TO ARENA
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen w-full px-4 py-8 bg-grid-pattern">
            <div className="max-w-7xl mx-auto">

                {/* ═══════════════════════════════
                     TOP STATUS BAR
                     ═══════════════════════════════ */}
                <div className="glass-card p-6 mb-8 relative overflow-hidden">
                    {/* Animated top border */}
                    <div className="absolute top-0 left-0 right-0 h-[2px]"
                        style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, #00F5A0, transparent)', backgroundSize: '200% 100%', animation: 'gradient-shift 4s ease infinite' }} />

                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div>
                            <div className="text-xs text-text-muted font-subheading mb-1 tracking-wider uppercase">Match ID</div>
                            <div className="text-lg font-heading text-primary">{matchData.id}</div>
                        </div>

                        <div className="text-center">
                            <div className="text-xs text-text-muted font-subheading mb-1 tracking-wider uppercase">Total Pot</div>
                            <div className="text-3xl font-heading text-success" style={{ textShadow: '0 0 20px rgba(0, 245, 160, 0.4)' }}>
                                {matchData.totalPot} MON
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-xs text-text-muted font-subheading mb-1 tracking-wider uppercase">Round</div>
                            <div className="text-xl font-heading">
                                <span className="text-primary">{stats.currentRound}</span>
                                <span className="text-text-muted"> / 5</span>
                            </div>
                        </div>

                        <div>
                            {matchFinished ? (
                                <span className="px-5 py-2.5 font-heading text-xs tracking-wider uppercase text-bg-dark inline-block"
                                    style={{ background: 'linear-gradient(135deg, #00F5A0, #00C980)' }}>
                                    ✓ MATCH COMPLETE
                                </span>
                            ) : (
                                <span className="px-5 py-2.5 font-heading text-xs tracking-wider uppercase text-white inline-block animate-pulse-ring"
                                    style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF)' }}>
                                    ⚔ ROUND {stats.currentRound + 1} — REVEALING...
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════
                     ARENA — AGENT vs AGENT
                     ═══════════════════════════════ */}
                <div className="grid md:grid-cols-[1fr_auto_1fr] gap-0 md:gap-4 mb-8">
                    {/* Agent A Panel */}
                    <div className="glass-card p-6 border-l-4 border-primary animate-slide-in-left relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-heading font-bold"
                                style={{ background: 'linear-gradient(135deg, #7C3AED, #9F67FF)', boxShadow: '0 0 15px rgba(124, 58, 237, 0.5)' }}>
                                A
                            </div>
                            <div>
                                <h2 className="text-xl font-heading font-bold text-primary">AGENT A</h2>
                                <div className="text-xs text-text-muted font-subheading uppercase tracking-wider">{matchData.agentA.type} Strategy</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-dark/50 p-4 border border-primary/10">
                                <div className="text-xs text-text-muted font-subheading mb-1 uppercase tracking-wider">Balance</div>
                                <div className="text-2xl font-heading text-success" style={{ textShadow: '0 0 10px rgba(0, 245, 160, 0.3)' }}>
                                    {stats.balanceA} <span className="text-sm text-text-muted">MON</span>
                                </div>
                            </div>
                            <div className="bg-bg-dark/50 p-4 border border-primary/10">
                                <div className="text-xs text-text-muted font-subheading mb-1 uppercase tracking-wider">Rounds Won</div>
                                <div className="text-2xl font-heading text-primary">{stats.winsA}</div>
                            </div>
                        </div>
                    </div>

                    {/* Center Divider — Lightning */}
                    <div className="hidden md:flex flex-col items-center justify-center py-4">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-[2px] h-12 bg-gradient-to-b from-transparent to-primary/50" />
                            <div className="text-3xl animate-lightning" style={{ filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.8))' }}>
                                ⚡
                            </div>
                            <div className="text-xs font-heading text-primary/60 tracking-widest uppercase">VS</div>
                            <div className="w-[2px] h-12 bg-gradient-to-b from-primary/50 to-transparent" />
                        </div>
                    </div>

                    {/* Mobile VS divider */}
                    <div className="flex md:hidden items-center justify-center py-4">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/30" />
                        <span className="px-4 text-2xl animate-lightning" style={{ filter: 'drop-shadow(0 0 12px rgba(124, 58, 237, 0.8))' }}>⚡</span>
                        <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-danger/30" />
                    </div>

                    {/* Agent B Panel */}
                    <div className="glass-card p-6 border-r-4 border-danger animate-slide-in-right relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-radial from-danger/5 to-transparent pointer-events-none" />
                        <div className="flex items-center gap-3 mb-6 md:justify-end">
                            <div className="md:order-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-heading font-bold"
                                    style={{ background: 'linear-gradient(135deg, #FF3B3B, #CC2E2E)', boxShadow: '0 0 15px rgba(255, 59, 59, 0.5)' }}>
                                    B
                                </div>
                            </div>
                            <div className="md:text-right">
                                <h2 className="text-xl font-heading font-bold text-danger">AGENT B</h2>
                                <div className="text-xs text-text-muted font-subheading uppercase tracking-wider">{matchData.agentB.type} Strategy</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-bg-dark/50 p-4 border border-danger/10">
                                <div className="text-xs text-text-muted font-subheading mb-1 uppercase tracking-wider">Balance</div>
                                <div className="text-2xl font-heading text-success" style={{ textShadow: '0 0 10px rgba(0, 245, 160, 0.3)' }}>
                                    {stats.balanceB} <span className="text-sm text-text-muted">MON</span>
                                </div>
                            </div>
                            <div className="bg-bg-dark/50 p-4 border border-danger/10">
                                <div className="text-xs text-text-muted font-subheading mb-1 uppercase tracking-wider">Rounds Won</div>
                                <div className="text-2xl font-heading text-danger">{stats.winsB}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════════════════════════
                     ROUND HISTORY TABLE
                     ═══════════════════════════════ */}
                <div className="glass-card p-6 mb-8 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />

                    <h3 className="text-lg font-heading font-bold mb-6 flex items-center gap-3">
                        <span className="text-primary">▸</span> ROUND HISTORY
                    </h3>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b-2 border-primary/20">
                                    {['Round', 'A Bid', 'B Bid', 'Winner', 'A Balance', 'B Balance'].map((h) => (
                                        <th key={h} className="p-3 font-heading text-text-muted text-xs uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {matchData.rounds.slice(0, visibleRounds).map((round, idx) => (
                                    <tr
                                        key={round.round}
                                        className="border-b border-primary/5 hover:bg-card-bg-lighter/30 transition-all duration-300 animate-slide-in-up"
                                        style={{ animationDelay: `${idx * 0.1}s` }}
                                    >
                                        <td className="p-3">
                                            <span className="inline-flex items-center justify-center w-8 h-8 text-sm font-heading font-bold border border-primary/30 text-primary">
                                                {round.round}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className="font-heading text-primary"
                                                style={{ textShadow: round.winner === 'A' ? '0 0 10px rgba(124, 58, 237, 0.5)' : 'none' }}>
                                                {round.bidA} <span className="text-xs text-text-muted">MON</span>
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <span className="font-heading text-danger"
                                                style={{ textShadow: round.winner === 'B' ? '0 0 10px rgba(255, 59, 59, 0.5)' : 'none' }}>
                                                {round.bidB} <span className="text-xs text-text-muted">MON</span>
                                            </span>
                                        </td>
                                        <td className="p-3 font-heading">
                                            {round.winner === 'A' ? (
                                                <span className="px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/30">Agent A</span>
                                            ) : round.winner === 'B' ? (
                                                <span className="px-3 py-1 text-xs bg-danger/20 text-danger border border-danger/30">Agent B</span>
                                            ) : (
                                                <span className="px-3 py-1 text-xs bg-text-muted/10 text-text-muted border border-text-muted/20">TIE</span>
                                            )}
                                        </td>
                                        <td className="p-3 font-body text-success text-sm">{round.balanceA} MON</td>
                                        <td className="p-3 font-body text-success text-sm">{round.balanceB} MON</td>
                                    </tr>
                                ))}

                                {/* Pending round indicator */}
                                {!matchFinished && (
                                    <tr className="border-b border-primary/5">
                                        <td colSpan="6" className="p-5 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                                                <span className="text-primary font-heading text-sm tracking-wider animate-pulse">
                                                    ROUND {stats.currentRound + 1} INCOMING...
                                                </span>
                                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ═══════════════════════════════
                     ACTION BUTTONS
                     ═══════════════════════════════ */}
                <div className="glass-card p-8 text-center mb-8">
                    <div className="flex justify-center gap-4 flex-wrap">
                        <Link to="/?scrollTo=agent-selection" className="btn-primary">
                            NEW MATCH
                        </Link>
                        {matchFinished ? (
                            <Link to="/analytics" className="btn-secondary">
                                VIEW ANALYTICS
                            </Link>
                        ) : (
                            <button
                                disabled
                                className="px-8 py-4 bg-card-bg text-text-muted/30 font-heading uppercase tracking-wider border-2 border-text-muted/10 cursor-not-allowed opacity-40"
                            >
                                VIEW ANALYTICS
                            </button>
                        )}
                    </div>
                </div>

                {/* Footer Nav */}
                <div className="text-center pb-8">
                    <Link to="/" className="text-primary/60 hover:text-primary transition-colors font-subheading text-sm tracking-wider">
                        ← Back to Arena
                    </Link>
                </div>
            </div>

            {/* ═══════════════════════════════════════════
                 WINNER / RESULT POPUP OVERLAY
                 ═══════════════════════════════════════════ */}
            {showResultPopup && result && (
                <div className="fixed inset-0 z-50 flex items-center justify-center animate-overlay-fade-in"
                    style={{ backgroundColor: 'rgba(6, 15, 31, 0.95)' }}
                >
                    {/* Animated background particles */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        {[...Array(12)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-1 rounded-full animate-float"
                                style={{
                                    left: `${10 + Math.random() * 80}%`,
                                    top: `${10 + Math.random() * 80}%`,
                                    animationDelay: `${i * 0.5}s`,
                                    animationDuration: `${4 + Math.random() * 4}s`,
                                    background: result.winner === 'Tie' ? '#7C3AED' : '#00F5A0',
                                    boxShadow: `0 0 10px ${result.winner === 'Tie' ? 'rgba(124,58,237,0.6)' : 'rgba(0,245,160,0.6)'}`,
                                }}
                            />
                        ))}
                    </div>

                    {/* Popup Card */}
                    <div
                        className={`relative max-w-lg w-full mx-4 p-10 text-center border-2 animate-popup-scale-in ${result.winner === 'Tie'
                            ? 'border-primary/40 bg-card-bg'
                            : 'border-success/40 bg-card-bg animate-glow-pulse'
                            }`}
                    >
                        {/* Top gradient */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{
                                background: result.winner === 'Tie'
                                    ? 'linear-gradient(90deg, transparent, #7C3AED, transparent)'
                                    : 'linear-gradient(90deg, transparent, #00F5A0, transparent)'
                            }} />

                        {/* Trophy */}
                        <div className="text-7xl mb-6" style={{ filter: `drop-shadow(0 0 20px ${result.winner === 'Tie' ? 'rgba(124,58,237,0.5)' : 'rgba(0,245,160,0.5)'})` }}>
                            {result.winner === 'Tie' ? '🤝' : '🏆'}
                        </div>

                        {/* Result Title */}
                        {result.winner === 'Tie' ? (
                            <>
                                <h2 className="text-4xl md:text-5xl font-heading font-black mb-3 text-text-light" style={{ animation: 'text-glow 2s ease-in-out infinite' }}>
                                    DRAW
                                </h2>
                                <p className="text-base font-subheading text-text-muted mb-2">
                                    Pot split equally. Neither agent dominated.
                                </p>
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl md:text-5xl font-heading font-black mb-3 text-success" style={{ animation: 'text-glow 2s ease-in-out infinite' }}>
                                    VICTORY
                                </h2>
                                <p className="text-xl font-heading text-text-light mb-1">
                                    {result.type} Agent
                                </p>
                                <p className="text-sm font-subheading text-text-muted mb-2">
                                    Secures the {matchData.totalPot} MON pot. Round secured. Bankroll intact.
                                </p>
                            </>
                        )}

                        {/* Final Score */}
                        <div className="my-8 py-5 border-y border-primary/20">
                            <div className="text-xs font-subheading text-text-muted mb-3 uppercase tracking-[0.2em]">Final Score</div>
                            <div className="text-5xl font-heading font-bold flex items-center justify-center gap-4">
                                <span className={`${result.winner === 'A' ? 'text-primary' : 'text-text-muted/40'}`}
                                    style={result.winner === 'A' ? { textShadow: '0 0 20px rgba(124, 58, 237, 0.5)' } : {}}>
                                    {stats.winsA}
                                </span>
                                <span className="text-text-muted/20 text-3xl">—</span>
                                <span className={`${result.winner === 'B' ? 'text-danger' : 'text-text-muted/40'}`}
                                    style={result.winner === 'B' ? { textShadow: '0 0 20px rgba(255, 59, 59, 0.5)' } : {}}>
                                    {stats.winsB}
                                </span>
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex justify-center gap-4 flex-wrap">
                            <button onClick={() => navigate('/?scrollTo=agent-selection')} className="btn-primary text-base">
                                NEW MATCH
                            </button>
                            <Link to="/analytics" className="btn-secondary text-base">
                                VIEW ANALYTICS
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MatchPage;
