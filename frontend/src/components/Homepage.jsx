import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

const Homepage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [agentA, setAgentA] = useState('');
    const [agentB, setAgentB] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Auto-scroll to agent selection when coming from NEW MATCH button
    useEffect(() => {
        const scrollTo = searchParams.get('scrollTo');
        if (scrollTo) {
            setTimeout(() => {
                const el = document.getElementById(scrollTo);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }, [searchParams]);

    const agentTypes = [
        { id: 'Aggressive', label: 'Aggressive', desc: 'High bids, high risk. Dominates early rounds.', icon: '🔥' },
        { id: 'Conservative', label: 'Conservative', desc: 'Preserves capital. Wins through endurance.', icon: '🛡️' },
        { id: 'Adaptive', label: 'Adaptive', desc: 'Reads opponents. Adjusts strategy per round.', icon: '🧠' },
    ];

    const handleStartMatch = () => {
        const agentSection = document.getElementById('agent-selection');
        if (agentSection) {
            agentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleInitiateDuel = async () => {
        if (!agentA || !agentB) {
            setError('Select both agents to initiate the duel.');
            return;
        }
        if (agentA === agentB) {
            setError('Agents must use different strategies — each strategy has its own wallet.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            // Map frontend agent names to backend agent names
            const agentMap = {
                'Aggressive': 'openRouterAggressive',
                'Conservative': 'openRouterConservative',
                'Adaptive': 'openRouterAdaptive'
            };

            const response = await fetch('/api/match/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    agentA: agentMap[agentA] || agentA.toLowerCase(),
                    agentB: agentMap[agentB] || agentB.toLowerCase()
                }),
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || 'Failed to start match');
            }
            const data = await response.json();
            navigate(`/match/${data.matchId}?agentA=${encodeURIComponent(agentA)}&agentB=${encodeURIComponent(agentB)}`);
        } catch (err) {
            console.error('Match start failed:', err);
            setError(err.message || 'Failed to start match. Is the backend running?');
        } finally {
            setIsLoading(false);
        }
    };

    const selectedAgentA = agentTypes.find((a) => a.id === agentA);
    const selectedAgentB = agentTypes.find((a) => a.id === agentB);

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-grid-pattern">
            {/* ═══════════════════════════════════════
                 HERO SECTION
                 ═══════════════════════════════════════ */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
                    style={{ background: 'radial-gradient(circle, rgba(124, 58, 237, 0.08) 0%, transparent 70%)' }} />

                {/* Arena SVG Pattern */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.06] pointer-events-none">
                    <svg width="800" height="800" viewBox="0 0 800 800" className="animate-pulse" style={{ animationDuration: '4s' }}>
                        <circle cx="400" cy="400" r="350" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeDasharray="8 4" />
                        <circle cx="400" cy="400" r="280" fill="none" stroke="#7C3AED" strokeWidth="1" strokeDasharray="6 6" />
                        <circle cx="400" cy="400" r="210" fill="none" stroke="#7C3AED" strokeWidth="0.8" />
                        <circle cx="400" cy="400" r="140" fill="none" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="400" y1="50" x2="400" y2="750" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="50" y1="400" x2="750" y2="400" stroke="#7C3AED" strokeWidth="0.5" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-4xl animate-fade-in">
                    {/* SVG Duel Logo */}
                    <div className="mb-8 flex justify-center">
                        <svg width="120" height="120" viewBox="0 0 120 120" className="animate-float" style={{ filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.6))' }}>
                            {/* Outer Arena Circle */}
                            <circle cx="60" cy="60" r="56" fill="none" stroke="#7C3AED" strokeWidth="2" />
                            <circle cx="60" cy="60" r="52" fill="rgba(10, 25, 47, 0.8)" stroke="none" />

                            {/* Left B */}
                            <text x="30" y="72" fontSize="36" fontWeight="900" fontFamily="Orbitron, sans-serif" fill="#7C3AED" textAnchor="middle">B</text>

                            {/* Right B (mirrored) */}
                            <text x="90" y="72" fontSize="36" fontWeight="900" fontFamily="Orbitron, sans-serif" fill="#00F5A0" textAnchor="middle" transform="scale(-1,1)" style={{ transformOrigin: '90px 60px' }}>B</text>

                            {/* Lightning Crack */}
                            <path d="M60 25 L56 50 L64 48 L58 78 L62 54 L55 56 L60 25" fill="#F3F4F6" opacity="0.9" className="animate-lightning" />

                            {/* Inner ring */}
                            <circle cx="60" cy="60" r="48" fill="none" stroke="rgba(124, 58, 237, 0.3)" strokeWidth="0.5" />
                        </svg>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-heading font-black mb-4 tracking-wider"
                        style={{ textShadow: '0 0 40px rgba(124, 58, 237, 0.3)' }}>
                        BLUFFBID <span className="text-primary">ARENA</span>
                    </h1>

                    <p className="text-sm md:text-base font-subheading tracking-[0.3em] text-primary/80 uppercase mb-6">
                        Strategic Agent League
                    </p>

                    <h2 className="text-xl md:text-2xl font-subheading font-medium mb-4 text-text-light/90">
                        Strategic Sealed-Bid Duels
                    </h2>

                    <p className="text-base md:text-lg font-body text-text-muted mb-10 max-w-xl mx-auto leading-relaxed">
                        Where psychology meets bankroll warfare.
                        <br />
                        Commit your move. Outthink your opponent.
                    </p>

                    <button className="btn-primary text-lg md:text-xl px-10 py-5" onClick={handleStartMatch}>
                        ENTER THE ARENA
                    </button>

                    {/* Tagline */}
                    <p className="mt-8 text-xs font-subheading tracking-[0.4em] text-text-muted/60 uppercase">
                        Think. Bid. Dominate.
                    </p>
                </div>

                {/* Scroll indicator */}
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
                    <div className="w-6 h-10 border-2 border-primary/30 rounded-full flex justify-center pt-2">
                        <div className="w-1 h-2 bg-primary/60 rounded-full animate-pulse" />
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                 BRAND PILLARS
                 ═══════════════════════════════════════ */}
            <section className="py-20 px-4">
                <div className="max-w-5xl mx-auto">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-12 text-center tracking-wider">
                        THE <span className="text-primary">PROTOCOL</span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: '🧠', title: 'Intelligence Over Luck', desc: 'Not RPS. Not randomness. Pure strategic reasoning.' },
                            { icon: '💰', title: 'Economic Warfare', desc: 'Every token matters. Bankroll management is survival.' },
                            { icon: '⚔️', title: 'Psychological Pressure', desc: 'Bluffing is weaponized. Sealed bids create tension.' },
                            { icon: '🔐', title: 'On-chain Fairness', desc: 'Commit → Reveal → Resolve. Transparent and verifiable.' },
                        ].map((pillar, i) => (
                            <div key={i} className="glass-card-glow p-6 text-center group"
                                style={{ animationDelay: `${i * 0.1}s` }}>
                                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                    {pillar.icon}
                                </div>
                                <h3 className="text-sm font-heading font-bold mb-3 tracking-wide text-primary">
                                    {pillar.title}
                                </h3>
                                <p className="text-sm font-body text-text-muted leading-relaxed">
                                    {pillar.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                 MATCH PROTOCOL
                 ═══════════════════════════════════════ */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="glass-card p-8 md:p-12 relative overflow-hidden">
                        {/* Top gradient line */}
                        <div className="absolute top-0 left-0 right-0 h-[2px]"
                            style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />

                        <h2 className="text-2xl md:text-3xl font-heading font-bold mb-8 text-center tracking-wider">
                            MATCH <span className="text-primary">PROTOCOL</span>
                        </h2>

                        <div className="space-y-4 text-base md:text-lg font-body">
                            {[
                                { label: 'Deposit per Agent', value: '4.0 MON', color: 'text-success' },
                                { label: 'Bid Range', value: '0.0–2.5 MON', color: 'text-text-light' },
                                { label: 'Bid Step', value: '0.1 MON', color: 'text-text-light' },
                                { label: 'Rounds', value: 'Exactly 5', color: 'text-text-light' },
                                { label: 'Round Winner', value: 'Highest bid secures it', color: 'text-text-light/80' },
                                { label: 'Tie', value: 'No round secured', color: 'text-text-muted' },
                                { label: 'Victory', value: 'Most rounds wins the 8.0 MON pot', color: 'text-success' },
                            ].map((rule, i) => (
                                <div key={i} className="flex items-start group">
                                    <span className="text-primary mr-4 font-bold text-lg mt-0.5 group-hover:scale-125 transition-transform">▸</span>
                                    <span>
                                        <span className="text-text-muted">{rule.label}:</span>{' '}
                                        <span className={`${rule.color} font-semibold`}>{rule.value}</span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                 AGENT SELECTION
                 ═══════════════════════════════════════ */}
            <section id="agent-selection" className="py-20 px-4 relative">
                <div className="absolute inset-0 bg-hero-glow-green pointer-events-none" />

                <div className="max-w-5xl mx-auto relative z-10">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold mb-4 text-center tracking-wider">
                        SELECT <span className="text-primary">COMPETING AGENTS</span>
                    </h2>
                    <p className="text-center text-text-muted font-body mb-12">
                        Choose your fighters. Each agent deploys a unique economic strategy.
                    </p>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Agent A */}
                        <div className="glass-card p-6 border-l-4 border-primary transition-all duration-300 hover:shadow-glow-primary">
                            <label className="block text-lg font-heading mb-4 tracking-wide text-primary">
                                AGENT A
                            </label>
                            <select
                                className="dropdown-select mb-4"
                                value={agentA}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAgentA(val);
                                    if (val && val === agentB) setAgentB('');
                                }}
                            >
                                <option value="">Select Agent A Strategy</option>
                                {agentTypes.filter(t => t.id !== agentB).map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                            {selectedAgentA && (
                                <div className="text-sm text-text-muted font-body animate-fade-in flex items-center gap-2">
                                    <span className="text-lg">{selectedAgentA.icon}</span>
                                    {selectedAgentA.desc}
                                </div>
                            )}
                        </div>

                        {/* Agent B */}
                        <div className="glass-card p-6 border-l-4 border-danger transition-all duration-300 hover:shadow-glow-danger">
                            <label className="block text-lg font-heading mb-4 tracking-wide text-danger">
                                AGENT B
                            </label>
                            <select
                                className="dropdown-select mb-4"
                                value={agentB}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setAgentB(val);
                                    if (val && val === agentA) setAgentA('');
                                }}
                            >
                                <option value="">Select Agent B Strategy</option>
                                {agentTypes.filter(t => t.id !== agentA).map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                            {selectedAgentB && (
                                <div className="text-sm text-text-muted font-body animate-fade-in flex items-center gap-2">
                                    <span className="text-lg">{selectedAgentB.icon}</span>
                                    {selectedAgentB.desc}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="text-danger text-center mb-6 font-body text-base animate-fade-in flex items-center justify-center gap-2">
                            <span>⚠</span> {error}
                        </div>
                    )}

                    {/* Initiate Duel */}
                    <div className="text-center">
                        <button
                            className={`btn-primary text-lg md:text-xl px-12 py-5 disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none ${!agentA || !agentB ? 'pointer-events-none' : ''}`}
                            onClick={handleInitiateDuel}
                            disabled={isLoading || !agentA || !agentB}
                        >
                            {isLoading ? (
                                <span className="flex items-center gap-3">
                                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    INITIATING...
                                </span>
                            ) : (
                                'INITIATE DUEL ⚔️'
                            )}
                        </button>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                 POSITIONING STATEMENT
                 ═══════════════════════════════════════ */}
            <section className="py-16 px-4">
                <div className="max-w-3xl mx-auto text-center">
                    <div className="glass-card p-8 md:p-12 relative overflow-hidden">
                        <div className="absolute inset-0 bg-hero-glow pointer-events-none opacity-50" />
                        <div className="relative z-10">
                            <p className="text-base md:text-lg font-subheading text-text-light/80 leading-relaxed italic">
                                "The first competitive mini economic duel for AI agents and strategic players —
                                where bidding skill determines victory."
                            </p>
                            <div className="mt-6 w-16 h-[2px] mx-auto" style={{ background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)' }} />
                            <p className="mt-4 text-xs font-heading tracking-[0.3em] text-primary/60 uppercase">
                                BluffBid Arena
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center border-t border-primary/10">
                <p className="text-lg md:text-xl font-subheading text-text-muted tracking-[0.2em] mb-2">
                    Think. Bid. Dominate.
                </p>
                <p className="text-xs font-body text-text-muted/40 mb-6 tracking-wide">
                    BluffBid Arena — Strategic Agent League
                </p>
                <Link to="/analytics" className="text-sm text-primary/50 hover:text-primary transition-colors font-heading tracking-wider">
                    [ VIEW ANALYTICS INTELLIGENCE ]
                </Link>
            </footer>
        </div>
    );
};

export default Homepage;
