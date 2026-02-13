import { useState, useEffect } from 'react'

// Mock data for demo - will be replaced with real contract data
const MOCK_MATCH_DATA = {
    matchId: "#0x7a3f",
    totalPot: 40,
    currentRound: 3,
    totalRounds: 5,
    status: 'reveal', // 'commit', 'reveal', 'finished'

    agentA: {
        name: 'Adaptive Agent',
        strategy: 'Adaptive Response',
        balance: 12,
        wins: 2,
        lastBid: 3,
        decision: "Opponent avg bid is 4. Predicting high aggression. Bidding 3 to conserve."
    },

    agentB: {
        name: 'Aggressive Agent',
        strategy: 'High Risk',
        balance: 8,
        wins: 1,
        lastBid: 5,
        decision: "Trailing by 1 round. Increasing aggression to 5."
    },

    rounds: [
        { round: 1, aBid: 4, bBid: 3, winner: 'A', aBalance: 16, bBalance: 17 },
        { round: 2, aBid: 2, bBid: 5, winner: 'B', aBalance: 14, bBalance: 12 },
        { round: 3, aBid: 3, bBid: 5, winner: 'B', aBalance: 12, bBalance: 8 }
    ]
}

function Match({ onBack }) {
    const [matchData, setMatchData] = useState(MOCK_MATCH_DATA)
    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        if (matchData.currentRound >= matchData.totalRounds) {
            setIsFinished(true)
        }
    }, [matchData])

    const getStatusColor = (status) => {
        switch (status) {
            case 'commit': return 'text-electric-violet border-electric-violet'
            case 'reveal': return 'text-neon-green border-neon-green'
            case 'finished': return 'text-sharp-red border-sharp-red'
            default: return 'text-neutral-ui border-neutral-ui'
        }
    }

    const getWinnerDisplay = () => {
        const { agentA, agentB } = matchData
        if (agentA.wins > agentB.wins) {
            return { winner: agentA.name, score: `${agentA.wins}–${agentB.wins}` }
        } else if (agentB.wins > agentA.wins) {
            return { winner: agentB.name, score: `${agentB.wins}–${agentA.wins}` }
        } else {
            return { winner: 'Tie', score: `${agentA.wins}–${agentB.wins}` }
        }
    }

    const roundProgress = (matchData.currentRound / matchData.totalRounds) * 100

    return (
        <div className="min-h-screen pb-16 relative overflow-hidden bg-deep-blue">
            {/* Animated Background */}
            <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-10 pointer-events-none"></div>
            <div className="fixed inset-0 bg-gradient-radial from-electric-violet/5 via-transparent to-transparent pointer-events-none"></div>

            {/* Top Bar */}
            <div className="relative z-10 bg-deep-blue/95 border-b-2 border-electric-violet px-4 md:px-8 py-4 sticky top-0 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center gap-4 shadow-glow-violet">
                <button
                    onClick={onBack}
                    className="group bg-transparent text-neutral-ui px-4 py-2 border border-electric-violet/50 rounded-lg text-sm transition-all duration-300 hover:border-electric-violet hover:bg-electric-violet/20 hover:shadow-glow-violet hover:-translate-x-1"
                >
                    <span className="flex items-center gap-2">
                        <span className="group-hover:animate-shake inline-block">←</span>
                        <span>Back</span>
                    </span>
                </button>

                <div className="flex flex-wrap items-center gap-4 md:gap-6 flex-1">
                    <span className="font-heading font-bold text-neutral-ui bg-electric-violet/20 px-3 py-1 rounded-lg border border-electric-violet">
                        Match {matchData.matchId}
                    </span>
                    <span className="text-sm font-medium text-neutral-ui">
                        Pot: <span className="text-neon-green font-bold text-lg drop-shadow-[0_0_10px_rgba(0,245,160,0.8)]">{matchData.totalPot} MON</span>
                    </span>
                    <span className="text-sm font-medium text-neutral-ui">
                        Round <span className="text-electric-violet font-bold">{matchData.currentRound}</span> of {matchData.totalRounds}
                    </span>
                    <span
                        className={`text-sm font-semibold px-3 py-1 bg-dark-secondary/60 rounded-lg border-2 ${getStatusColor(matchData.status)} animate-glow-pulse`}
                    >
                        {matchData.status === 'commit' && '🔒 Commit Phase'}
                        {matchData.status === 'reveal' && '🔓 Reveal Phase'}
                        {matchData.status === 'finished' && '✓ Finished'}
                    </span>
                </div>

                {/* Round Progress Bar */}
                <div className="w-full md:w-48 h-2 bg-dark-secondary/60 rounded-full overflow-hidden border border-electric-violet/30">
                    <div
                        className="h-full bg-gradient-to-r from-electric-violet to-neon-green rounded-full transition-all duration-1000 shadow-[0_0_10px_currentColor]"
                        style={{ width: `${roundProgress}%` }}
                    ></div>
                </div>
            </div>

            {/* Match End Banner */}
            {isFinished && (
                <div className="relative z-10 bg-gradient-to-br from-electric-violet/30 via-neon-green/20 to-electric-violet/30 border-2 border-neon-green rounded-2xl p-8 md:p-12 mx-4 md:mx-8 mt-8 text-center shadow-[0_0_60px_rgba(0,245,160,0.4)] animate-fade-in-up backdrop-blur-sm">
                    {getWinnerDisplay().winner === 'Tie' ? (
                        <>
                            <h2 className="text-4xl md:text-5xl mb-4 text-neon-green font-black drop-shadow-[0_0_20px_rgba(0,245,160,0.8)] animate-glow-pulse">
                                ⚔️ Match Tied – Pot Split ⚔️
                            </h2>
                            <p className="text-3xl font-bold text-electric-violet mb-2 animate-score-pop">Final Score: {getWinnerDisplay().score}</p>
                            <p className="text-xl text-neutral-ui/90">Each agent receives <span className="text-neon-green font-bold">20 MON</span></p>
                        </>
                    ) : (
                        <>
                            <h2 className="text-4xl md:text-5xl mb-4 font-black animate-glow-pulse">
                                <span className="bg-gradient-to-r from-neon-green to-emerald-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(0,245,160,0.8)]">
                                    🏆 Winner: {getWinnerDisplay().winner} 🏆
                                </span>
                            </h2>
                            <p className="text-3xl font-bold text-electric-violet mb-2 animate-score-pop">Final Score: {getWinnerDisplay().score}</p>
                            <p className="text-xl text-neutral-ui/90">Payout: <span className="text-neon-green font-bold text-2xl">{matchData.totalPot} MON</span></p>
                        </>
                    )}
                </div>
            )}

            {/* Agent Panels */}
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 md:px-8 py-12 max-w-7xl mx-auto">
                {/* Agent A Panel */}
                <div className="group glass p-6 md:p-8 transition-all duration-500 hover:border-electric-violet hover:shadow-glow-violet hover:-translate-y-1 animate-slide-in-left">
                    <div className="text-center mb-6 pb-6 border-b border-electric-violet/30">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-electric-violet to-purple-600 flex items-center justify-center text-4xl shadow-glow-violet group-hover:scale-110 transition-transform duration-300 group-hover:animate-float">
                            🤖
                        </div>
                        <h3 className="text-2xl mb-2 bg-gradient-to-r from-electric-violet to-purple-500 bg-clip-text text-transparent font-black">
                            Agent A
                        </h3>
                        <span className="text-xl font-bold text-neutral-ui">{matchData.agentA.name}</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Strategy Type:</span>
                            <span className="font-bold text-electric-violet group-hover/item:scale-110 transition-transform">{matchData.agentA.strategy}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-neon-green/10 -mx-2 px-2 rounded group/item">
                            <span className="text-neutral-ui/70 text-sm">Current Balance:</span>
                            <span className="font-bold text-neon-green text-xl drop-shadow-[0_0_10px_rgba(0,245,160,0.8)] group-hover/item:animate-score-pop">
                                {matchData.agentA.balance} MON
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Wins:</span>
                            <span className="font-bold text-2xl text-neon-green group-hover/item:animate-score-pop">{matchData.agentA.wins}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Last Bid:</span>
                            <span className="font-bold text-lg group-hover/item:scale-110 transition-transform">{matchData.agentA.lastBid} MON</span>
                        </div>
                    </div>
                </div>

                {/* VS Divider */}
                <div className="flex flex-col items-center justify-center gap-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-electric-violet/30 blur-xl animate-glow-pulse"></div>
                        <div className="relative font-heading text-4xl font-black text-transparent bg-gradient-to-b from-electric-violet to-neon-green bg-clip-text py-8 px-8 border-4 border-electric-violet rounded-2xl md:[writing-mode:vertical-rl] md:[text-orientation:upright] shadow-glow-violet backdrop-blur-sm">
                            VS
                        </div>
                    </div>
                    <div className="text-4xl animate-pulse-glow">⚡</div>
                </div>

                {/* Agent B Panel */}
                <div className="group glass p-6 md:p-8 transition-all duration-500 hover:border-neon-green hover:shadow-glow-green hover:-translate-y-1 animate-slide-in-right">
                    <div className="text-center mb-6 pb-6 border-b border-neon-green/30">
                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-green to-emerald-600 flex items-center justify-center text-4xl shadow-glow-green group-hover:scale-110 transition-transform duration-300 group-hover:animate-float">
                            🤖
                        </div>
                        <h3 className="text-2xl mb-2 bg-gradient-to-r from-neon-green to-emerald-400 bg-clip-text text-transparent font-black">
                            Agent B
                        </h3>
                        <span className="text-xl font-bold text-neutral-ui">{matchData.agentB.name}</span>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Strategy Type:</span>
                            <span className="font-bold text-neon-green group-hover/item:scale-110 transition-transform">{matchData.agentB.strategy}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 bg-neon-green/10 -mx-2 px-2 rounded group/item">
                            <span className="text-neutral-ui/70 text-sm">Current Balance:</span>
                            <span className="font-bold text-neon-green text-xl drop-shadow-[0_0_10px_rgba(0,245,160,0.8)] group-hover/item:animate-score-pop">
                                {matchData.agentB.balance} MON
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Wins:</span>
                            <span className="font-bold text-2xl text-neon-green group-hover/item:animate-score-pop">{matchData.agentB.wins}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 group/item">
                            <span className="text-neutral-ui/70 text-sm">Last Bid:</span>
                            <span className="font-bold text-lg group-hover/item:scale-110 transition-transform">{matchData.agentB.lastBid} MON</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Decision Display */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-8">
                <h3 className="text-3xl mb-8 text-center font-black">
                    <span className="bg-gradient-to-r from-electric-violet to-neon-green bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                        🧠 Live Decision Analysis 🧠
                    </span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="relative glass p-6 md:p-8 transition-all duration-500 hover:border-electric-violet hover:shadow-glow-violet hover:scale-105 animate-fade-in-up overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-electric-violet/20 blur-3xl"></div>
                        <div className="relative">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="text-2xl animate-float">🤖</span>
                                <span className="font-bold text-electric-violet text-lg">Agent A Decision:</span>
                            </div>
                            <p className="text-neutral-ui italic leading-relaxed text-sm md:text-base border-l-4 border-electric-violet pl-4">
                                "{matchData.agentA.decision}"
                            </p>
                        </div>
                    </div>

                    <div className="relative glass p-6 md:p-8 transition-all duration-500 hover:border-neon-green hover:shadow-glow-green hover:scale-105 animate-fade-in-up overflow-hidden" style={{ animationDelay: '100ms' }}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-neon-green/20 blur-3xl"></div>
                        <div className="relative">
                            <div className="mb-4 flex items-center gap-2">
                                <span className="text-2xl animate-float" style={{ animationDelay: '0.5s' }}>🤖</span>
                                <span className="font-bold text-neon-green text-lg">Agent B Decision:</span>
                            </div>
                            <p className="text-neutral-ui italic leading-relaxed text-sm md:text-base border-l-4 border-neon-green pl-4">
                                "{matchData.agentB.decision}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Round Log Table */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 py-12">
                <h3 className="text-3xl mb-8 text-center font-black">
                    <span className="bg-gradient-to-r from-electric-violet to-neon-green bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                        📊 Round History 📊
                    </span>
                </h3>
                <div className="overflow-x-auto rounded-2xl border-2 border-electric-violet/50 shadow-glow-violet">
                    <table className="w-full bg-dark-secondary/80 backdrop-blur-md">
                        <thead className="bg-gradient-to-r from-electric-violet/30 to-purple-600/30">
                            <tr className="border-b-2 border-electric-violet">
                                <th className="px-4 md:px-6 py-4 text-left font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">Round</th>
                                <th className="px-4 md:px-6 py-4 text-left font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">A Bid</th>
                                <th className="px-4 md:px-6 py-4 text-left font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">B Bid</th>
                                <th className="px-4 md:px-6 py-4 text-center font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">Winner</th>
                                <th className="px-4 md:px-6 py-4 text-left font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">A Balance</th>
                                <th className="px-4 md:px-6 py-4 text-left font-heading font-bold text-electric-violet text-sm md:text-base uppercase tracking-wider">B Balance</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matchData.rounds.map((round, idx) => (
                                <tr
                                    key={round.round}
                                    className="border-b border-electric-violet/20 transition-all duration-500 hover:bg-electric-violet/10 hover:scale-[1.02] animate-fade-in-up group"
                                    style={{ animationDelay: `${idx * 100}ms` }}
                                >
                                    <td className="px-4 md:px-6 py-4 text-electric-violet font-black text-lg group-hover:scale-110 transition-transform">{round.round}</td>
                                    <td className={`px-4 md:px-6 py-4 text-sm md:text-base font-bold transition-all duration-300 ${round.winner === 'A' ? 'text-neon-green drop-shadow-[0_0_8px_rgba(0,245,160,0.8)] scale-110' : 'text-neutral-ui'}`}>
                                        {round.winner === 'A' && <span className="inline-block group-hover:animate-shake">→ </span>}{round.aBid} MON
                                    </td>
                                    <td className={`px-4 md:px-6 py-4 text-sm md:text-base font-bold transition-all duration-300 ${round.winner === 'B' ? 'text-neon-green drop-shadow-[0_0_8px_rgba(0,245,160,0.8)] scale-110' : 'text-neutral-ui'}`}>
                                        {round.winner === 'B' && <span className="inline-block group-hover:animate-shake">→ </span>}{round.bBid} MON
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-center">
                                        <span className={`inline-block px-4 py-2 rounded-lg text-xs md:text-sm font-black uppercase tracking-wider transition-all duration-300 group-hover:scale-110 ${round.winner === 'A'
                                            ? 'bg-gradient-to-r from-neon-green/30 to-emerald-600/30 text-neon-green border-2 border-neon-green shadow-glow-green'
                                            : 'bg-gradient-to-r from-electric-violet/30 to-purple-600/30 text-electric-violet border-2 border-electric-violet shadow-glow-violet'
                                            }`}>
                                            Agent {round.winner}
                                        </span>
                                    </td>
                                    <td className="px-4 md:px-6 py-4 text-neon-green font-bold text-sm md:text-base drop-shadow-[0_0_8px_rgba(0,245,160,0.6)]">{round.aBalance}</td>
                                    <td className="px-4 md:px-6 py-4 text-neon-green font-bold text-sm md:text-base drop-shadow-[0_0_8px_rgba(0,245,160,0.6)]">{round.bBalance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Table Insights */}
                <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-8 mt-8 px-4 flex-wrap">
                    {[
                        { icon: '✓', text: 'Adaptive play demonstrated' },
                        { icon: '✓', text: 'Resource deduction verified' },
                        { icon: '✓', text: 'Fair resolution on-chain' }
                    ].map((insight, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-3 text-neutral-ui text-sm md:text-base px-4 py-2 rounded-lg bg-neon-green/10 border border-neon-green/30 hover:scale-105 transition-transform duration-300 animate-fade-in-up"
                            style={{ animationDelay: `${idx * 100}ms` }}
                        >
                            <span className="text-neon-green font-black text-xl drop-shadow-[0_0_8px_rgba(0,245,160,0.8)]">{insight.icon}</span>
                            <span className="font-medium">{insight.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Match
