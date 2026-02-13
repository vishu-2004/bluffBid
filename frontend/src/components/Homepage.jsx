import { useState } from 'react';

const Homepage = () => {
    const [agentA, setAgentA] = useState('');
    const [agentB, setAgentB] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const agentTypes = ['Aggressive', 'Conservative', 'Adaptive', 'MonteCarlo'];

    const handleStartMatch = () => {
        const agentSection = document.getElementById('agent-selection');
        if (agentSection) {
            agentSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const handleInitiateDuel = async () => {
        if (!agentA || !agentB) {
            setError('Please select both agents');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/match/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    agentA,
                    agentB,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to start match');
            }

            const data = await response.json();
            // Redirect to match page
            window.location.href = `/match/${data.id}`;
        } catch (err) {
            setError(err.message || 'Failed to initiate duel');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden">
            {/* Hero Section */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-4 py-20">
                {/* Circular Arena Background Pattern */}
                <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none">
                    <svg width="800" height="800" viewBox="0 0 800 800" className="animate-pulse">
                        <circle cx="400" cy="400" r="350" fill="none" stroke="#7C3AED" strokeWidth="2" />
                        <circle cx="400" cy="400" r="280" fill="none" stroke="#7C3AED" strokeWidth="1.5" />
                        <circle cx="400" cy="400" r="210" fill="none" stroke="#7C3AED" strokeWidth="1" />
                        <circle cx="400" cy="400" r="140" fill="none" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="400" y1="50" x2="400" y2="750" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="50" y1="400" x2="750" y2="400" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="117" y1="117" x2="683" y2="683" stroke="#7C3AED" strokeWidth="0.5" />
                        <line x1="683" y1="117" x2="117" y2="683" stroke="#7C3AED" strokeWidth="0.5" />
                    </svg>
                </div>

                {/* Content */}
                <div className="relative z-10 text-center max-w-4xl">
                    <h1 className="text-6xl md:text-8xl font-heading font-black mb-6 tracking-wider">
                        BLUFFBID ARENA
                    </h1>


                    <h2 className="text-2xl md:text-3xl font-heading font-semibold mb-8 text-primary">
                        AI AGENT TOKEN WAGER DUEL
                    </h2>

                    <p className="text-lg md:text-xl font-body text-text-light/80 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Two autonomous agents compete in a 5-round sealed-bid match.
                        <br />
                        Highest score secures the 40 MON pot.
                    </p>

                    <button className="btn-primary text-xl md:text-2xl" onClick={handleStartMatch}>
                        START MATCH
                    </button>
                </div>
            </section>

            {/* Game Rules Section */}
            <section className="py-20 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="glass-card p-8 md:p-12">
                        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-8 text-center">
                            MATCH PROTOCOL
                        </h2>

                        <div className="space-y-4 text-lg md:text-xl font-body">
                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Deposit per Agent: <span className="text-success font-semibold">20 MON</span></span>
                            </div>

                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Bid Range: <span className="text-text-light font-semibold">0–5 MON</span> per round</span>
                            </div>

                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Rounds: <span className="text-text-light font-semibold">Exactly 5</span></span>
                            </div>

                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Higher bid secures the round</span>
                            </div>

                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Tie: <span className="text-text-light/70">No round secured</span></span>
                            </div>

                            <div className="flex items-start">
                                <span className="text-primary mr-4 font-bold">•</span>
                                <span>Most rounds after 5 wins the <span className="text-success font-semibold">40 MON pot</span></span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Agent Selection Section */}
            <section id="agent-selection" className="py-20 px-4">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center">
                        SELECT COMPETING AGENTS
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8 mb-12">
                        {/* Agent A Dropdown */}
                        <div>
                            <label className="block text-xl font-heading mb-4 tracking-wide">
                                AGENT A
                            </label>
                            <select
                                className="dropdown-select"
                                value={agentA}
                                onChange={(e) => setAgentA(e.target.value)}
                            >
                                <option value="">Select Agent A</option>
                                {agentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Agent B Dropdown */}
                        <div>
                            <label className="block text-xl font-heading mb-4 tracking-wide">
                                AGENT B
                            </label>
                            <select
                                className="dropdown-select"
                                value={agentB}
                                onChange={(e) => setAgentB(e.target.value)}
                            >
                                <option value="">Select Agent B</option>
                                {agentTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="text-danger text-center mb-6 font-body text-lg">
                            {error}
                        </div>
                    )}

                    {/* Initiate Duel Button */}
                    <div className="text-center">
                        <button
                            className="btn-primary text-xl md:text-2xl disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleInitiateDuel}
                            disabled={isLoading}
                        >
                            {isLoading ? 'INITIATING...' : 'INITIATE DUEL'}
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center">
                <p className="text-lg md:text-xl font-body text-text-light/60 tracking-wide">
                    Think. Commit. Dominate.
                </p>
            </footer>
        </div>
    );
};

export default Homepage;
