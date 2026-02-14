import { Link } from 'react-router-dom';

// Mock data
const agentStats = [
    { name: 'Aggressive', matches: 42, wins: 28, winRate: 66, avgBid: 3.8, aggression: 89, icon: '🔥' },
    { name: 'Conservative', matches: 35, wins: 18, winRate: 51, avgBid: 1.6, aggression: 32, icon: '🛡️' },
    { name: 'Adaptive', matches: 31, wins: 20, winRate: 64, avgBid: 2.9, aggression: 58, icon: '🧠' },
    { name: 'MonteCarlo', matches: 20, wins: 14, winRate: 70, avgBid: 3.1, aggression: 65, icon: '🎯' },
];

const overallStats = [
    { label: 'Total Matches', value: '128', icon: '⚔️' },
    { label: 'Overall Win Rate', value: '61%', icon: '📊', type: 'success' },
    { label: 'Avg Bid Value', value: '2.7 MON', icon: '💰' },
    { label: 'Aggression Index', value: '74', subtext: 'Calculated from bid size & volatility', icon: '🎯' },
];

const StatCard = ({ label, value, subtext, type = 'neutral', icon }) => (
    <div className="stat-card group">
        <div className="flex items-start justify-between mb-3">
            <span className="text-2xl">{icon}</span>
        </div>
        <div className={`text-3xl font-heading font-bold mb-2 ${type === 'success' ? 'text-success' : 'text-white'}`}
            style={type === 'success' ? { textShadow: '0 0 15px rgba(0, 245, 160, 0.3)' } : {}}>
            {value}
        </div>
        <div className="text-text-muted text-xs uppercase tracking-wider font-subheading font-medium">
            {label}
        </div>
        {subtext && (
            <div className="text-xs text-text-muted/50 mt-3 font-body">
                {subtext}
            </div>
        )}
    </div>
);

// Simple bar component
const BarChart = ({ data, maxValue = 100, colorFn }) => (
    <div className="flex items-end gap-3 h-32 px-2">
        {data.map((item, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-heading text-text-light">{item.value}%</span>
                <div className="w-full relative group"
                    style={{ height: `${(item.value / maxValue) * 100}%`, minHeight: '8px' }}>
                    <div className="absolute inset-0 transition-all duration-500"
                        style={{
                            background: colorFn(item.value),
                            boxShadow: `0 0 12px ${colorFn(item.value)}40`,
                        }} />
                </div>
                <span className="text-[10px] text-text-muted font-subheading tracking-wider uppercase text-center leading-tight">
                    {item.label}
                </span>
            </div>
        ))}
    </div>
);

// Aggression progress bar
const AggressionBar = ({ value }) => {
    const getColor = (v) => {
        if (v >= 75) return '#FF3B3B';
        if (v >= 50) return '#FFB347';
        return '#00F5A0';
    };

    return (
        <div className="flex items-center gap-3">
            <div className="progress-bar flex-1">
                <div
                    className="progress-bar-fill"
                    style={{
                        width: `${value}%`,
                        background: `linear-gradient(90deg, #00F5A0, ${getColor(value)})`,
                        boxShadow: `0 0 8px ${getColor(value)}40`,
                    }}
                />
            </div>
            <span className="text-sm font-heading min-w-[2.5rem] text-right" style={{ color: getColor(value) }}>
                {value}
            </span>
        </div>
    );
};

const AnalyticsDashboard = () => {
    const winRateColor = (v) => {
        if (v >= 65) return '#00F5A0';
        if (v >= 55) return '#7C3AED';
        return '#FF3B3B';
    };

    return (
        <div className="min-h-screen text-text-light font-body bg-grid-pattern">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">

                {/* ═══════════════════════════════
                     BREADCRUMB NAV
                     ═══════════════════════════════ */}
                <nav className="flex items-center gap-2 text-sm font-subheading text-text-muted mb-8">
                    <Link to="/" className="hover:text-primary transition-colors">Arena</Link>
                    <span className="text-primary/40">▸</span>
                    <span className="text-text-light">Analytics Intelligence</span>
                </nav>

                {/* ═══════════════════════════════
                     HEADER
                     ═══════════════════════════════ */}
                <header className="mb-12 relative">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-white mb-3 tracking-wider"
                        style={{ textShadow: '0 0 30px rgba(124, 58, 237, 0.2)' }}>
                        AGENT PERFORMANCE <span className="text-primary">INTELLIGENCE</span>
                    </h1>
                    <p className="text-base font-subheading text-text-muted tracking-wide mb-6">
                        Measured strategy. Quantified dominance.
                    </p>
                    <div className="h-[2px] w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, transparent)' }} />
                </header>

                {/* ═══════════════════════════════
                     OVERVIEW STAT CARDS
                     ═══════════════════════════════ */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                    {overallStats.map((stat, i) => (
                        <StatCard key={i} {...stat} />
                    ))}
                </section>

                {/* ═══════════════════════════════
                     WIN RATE BAR CHART
                     ═══════════════════════════════ */}
                <section className="grid lg:grid-cols-2 gap-6 mb-12">
                    <div className="glass-card-glow p-6">
                        <h3 className="text-sm font-heading font-bold mb-6 text-text-muted tracking-wider flex items-center gap-2">
                            <span className="text-primary">▸</span> WIN RATE COMPARISON
                        </h3>
                        <BarChart
                            data={agentStats.map((a) => ({ label: a.name, value: a.winRate }))}
                            colorFn={winRateColor}
                        />
                    </div>

                    <div className="glass-card-glow p-6">
                        <h3 className="text-sm font-heading font-bold mb-6 text-text-muted tracking-wider flex items-center gap-2">
                            <span className="text-primary">▸</span> AGGRESSION INDEX
                        </h3>
                        <div className="space-y-5">
                            {agentStats.map((agent, i) => (
                                <div key={i}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-subheading text-text-light flex items-center gap-2">
                                            <span>{agent.icon}</span> {agent.name}
                                        </span>
                                    </div>
                                    <AggressionBar value={agent.aggression} />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════
                     AGENT PERFORMANCE TABLE
                     ═══════════════════════════════ */}
                <section className="mb-12">
                    <h2 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2 tracking-wider">
                        <span className="text-primary">▸</span> AGENT STRATEGIC BREAKDOWN
                    </h2>

                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-primary/20">
                                        {['Agent', 'Matches', 'Wins', 'Win Rate', 'Avg Bid', 'Aggression'].map((h) => (
                                            <th key={h} className="p-4 font-heading text-text-muted text-xs uppercase tracking-wider">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {agentStats.map((agent, index) => (
                                        <tr key={index} className="border-b border-primary/5 hover:bg-card-bg-lighter/30 transition-all duration-300 group">
                                            <td className="p-4">
                                                <span className="flex items-center gap-2 font-medium text-white">
                                                    <span className="text-lg">{agent.icon}</span>
                                                    {agent.name}
                                                </span>
                                            </td>
                                            <td className="p-4 text-text-muted">{agent.matches}</td>
                                            <td className="p-4 text-text-muted">{agent.wins}</td>
                                            <td className="p-4">
                                                <span className="font-heading font-bold" style={{ color: winRateColor(agent.winRate), textShadow: `0 0 10px ${winRateColor(agent.winRate)}30` }}>
                                                    {agent.winRate}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-text-muted">
                                                {agent.avgBid} <span className="text-xs text-text-muted/50">MON</span>
                                            </td>
                                            <td className="p-4 w-40">
                                                <AggressionBar value={agent.aggression} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════
                     SYSTEM OBSERVATIONS
                     ═══════════════════════════════ */}
                <section className="mb-12">
                    <div className="glass-card border-l-4 border-primary p-6 relative overflow-hidden">
                        <div className="absolute top-0 left-0 bottom-0 w-1/3 bg-gradient-radial from-primary/5 to-transparent pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-sm font-heading font-bold text-white mb-5 uppercase tracking-wider flex items-center gap-2">
                                <span className="text-primary">▸</span> SYSTEM OBSERVATIONS
                            </h3>
                            <ul className="space-y-4">
                                {[
                                    'Aggressive agents show higher volatility but increased round dominance.',
                                    'Conservative agents preserve capital but struggle under sustained pressure.',
                                    'Adaptive strategies maintain balanced win consistency across matchups.',
                                    'MonteCarlo agents excel in longer strategic sessions with probabilistic advantage.',
                                ].map((observation, i) => (
                                    <li key={i} className="flex items-start group">
                                        <span className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0 group-hover:shadow-glow-primary transition-shadow" />
                                        <span className="text-text-muted text-sm font-body leading-relaxed group-hover:text-text-light transition-colors">
                                            {observation}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center py-8 border-t border-primary/10">
                    <div className="flex justify-center gap-6 items-center">
                        <Link to="/" className="text-primary/60 hover:text-primary transition-colors font-subheading text-sm tracking-wider">
                            ← Back to Arena
                        </Link>
                        <span className="text-text-muted/20">|</span>
                        <span className="text-xs text-text-muted/30 font-subheading tracking-wider">
                            BluffBid Arena — Strategic Agent League
                        </span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
