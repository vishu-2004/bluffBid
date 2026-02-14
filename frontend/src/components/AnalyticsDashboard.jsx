
// Mock data for the dashboard
const agentStats = [
    { name: 'Aggressive', matches: 42, wins: 28, winRate: '66%', avgBid: 3.8, aggression: 89 },
    { name: 'Conservative', matches: 35, wins: 18, winRate: '51%', avgBid: 1.6, aggression: 32 },
    { name: 'Adaptive', matches: 31, wins: 20, winRate: '64%', avgBid: 2.9, aggression: 58 },
    { name: 'MonteCarlo', matches: 20, wins: 14, winRate: '70%', avgBid: 3.1, aggression: 65 },
];

const StatCard = ({ label, value, subtext, type = 'neutral' }) => (
    <div className="bg-[#112240] border border-[#7C3AED]/30 p-6 flex flex-col justify-between h-full">
        <div>
            <div className={`text-4xl font-heading font-bold mb-2 ${type === 'success' ? 'text-[#00F5A0]' : 'text-white'}`}>
                {value}
            </div>
            <div className="text-[#F3F4F6] text-sm uppercase tracking-wider font-semibold opacity-80">
                {label}
            </div>
        </div>
        {subtext && (
            <div className="text-xs text-[#F3F4F6] opacity-50 mt-4">
                {subtext}
            </div>
        )}
    </div>
);

const AnalyticsDashboard = () => {
    return (
        <div className="min-h-screen bg-[#0A192F] text-[#F3F4F6] font-body p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-12 border-b border-[#7C3AED]">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-2">
                        AGENT PERFORMANCE INTELLIGENCE
                    </h1>
                    <p className="text-lg text-[#F3F4F6] opacity-70 mb-6 font-light tracking-wide">
                        Measured strategy. Quantified dominance.
                    </p>
                </header>

                {/* Stats Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <StatCard
                        label="Total Matches Played"
                        value="128"
                    />
                    <StatCard
                        label="Win Rate (Overall)"
                        value="61%"
                        type="success"
                    />
                    <StatCard
                        label="Average Bid Value"
                        value="2.7 MON"
                    />
                    <StatCard
                        label="Aggression Index"
                        value="74 / 100"
                        subtext="Calculated from average bid size and bid volatility."
                    />
                </section>

                {/* Agent Performance Table */}
                <section className="mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-heading font-bold text-white">
                            AGENT STRATEGIC BREAKDOWN
                        </h2>
                    </div>

                    <div className="overflow-x-auto bg-[#112240] border border-[#7C3AED]/30">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#7C3AED]/30">
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Agent</th>
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Matches</th>
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Wins</th>
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Win Rate</th>
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Avg Bid</th>
                                    <th className="p-4 font-heading font-semibold text-[#7C3AED] uppercase text-sm tracking-wider">Aggression Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentStats.map((agent, index) => (
                                    <tr key={index} className="border-b border-[#7C3AED]/10 hover:bg-[#0A192F]/50 transition-colors">
                                        <td className="p-4 font-medium text-white">{agent.name}</td>
                                        <td className="p-4 text-[#F3F4F6] opacity-80">{agent.matches}</td>
                                        <td className="p-4 text-[#F3F4F6] opacity-80">{agent.wins}</td>
                                        <td className={`p-4 font-bold ${parseInt(agent.winRate) >= 65 ? 'text-[#00F5A0]' :
                                            parseInt(agent.winRate) <= 55 ? 'text-[#FF3B3B]' : 'text-white'
                                            }`}>
                                            {agent.winRate}
                                        </td>
                                        <td className="p-4 text-[#F3F4F6] opacity-80">{agent.avgBid}</td>
                                        <td className="p-4 text-[#F3F4F6] opacity-80">{agent.aggression}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Strategic Insight Panel */}
                <section>
                    <div className="bg-[#112240] border-l-4 border-[#7C3AED] p-6">
                        <h3 className="text-xl font-heading font-bold text-white mb-4 uppercase tracking-wide">
                            SYSTEM OBSERVATIONS
                        </h3>
                        <ul className="space-y-3">
                            <li className="flex items-start">
                                <span className="text-[#7C3AED] mr-3 font-bold">•</span>
                                <span className="text-[#F3F4F6] opacity-90">Aggressive agents show higher volatility but increased round dominance.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-[#7C3AED] mr-3 font-bold">•</span>
                                <span className="text-[#F3F4F6] opacity-90">Conservative agents preserve capital but struggle under pressure.</span>
                            </li>
                            <li className="flex items-start">
                                <span className="text-[#7C3AED] mr-3 font-bold">•</span>
                                <span className="text-[#F3F4F6] opacity-90">Adaptive strategies maintain balanced win consistency.</span>
                            </li>
                        </ul>
                    </div>
                </section>

                {/* Footer Navigation */}
                <footer className="mt-12 text-center space-y-4">
                    <div className="flex justify-center gap-6">
                        <a href="/" className="text-primary hover:text-primary/80 transition-colors font-body tracking-wide">
                            ← Back to Arena
                        </a>
                        <span className="text-text-light/30">|</span>
                        <a href="/match/demo" className="text-primary hover:text-primary/80 transition-colors font-body tracking-wide">
                            View Sample Match →
                        </a>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
