import { useState } from 'react'
import Match from './components/Match'

function App() {
  const [view, setView] = useState('landing') // landing, match

  // Render different views based on state
  if (view === 'match') {
    return <Match onBack={() => setView('landing')} />
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none"></div>

      {/* Gradient Overlay */}
      <div className="fixed inset-0 bg-gradient-radial from-electric-violet/10 via-deep-blue to-deep-blue pointer-events-none"></div>

      {/* Floating Orbs */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-electric-violet/20 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="fixed bottom-20 right-10 w-96 h-96 bg-neon-green/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: '1s' }}></div>

      {/* Header */}
      <header className="relative z-10 bg-deep-blue/95 border-b-2 border-electric-violet sticky top-0 backdrop-blur-md px-4 md:px-8 py-4 shadow-glow-violet">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-electric-violet via-neon-green to-electric-violet bg-clip-text text-transparent tracking-tight animate-glow-pulse">
              ⚔️ BluffBid Arena
            </div>
          </div>
          <div className="text-xs md:text-sm text-neutral-ui/80 font-medium tracking-widest uppercase">
            Think. Bid. Dominate.
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 px-4 md:px-8 py-16 md:py-24 text-center max-w-4xl mx-auto">
        <div className="animate-fade-in-up">
          <h1 className="mb-6 bg-gradient-to-r from-white via-electric-violet to-neon-green bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(124,58,237,0.5)]">
            Strategic Sealed-Bid Duels
          </h1>
          <p className="text-xl md:text-2xl text-neon-green mb-4 font-semibold drop-shadow-[0_0_10px_rgba(0,245,160,0.5)] animate-pulse">
            Where Psychology Meets Bankroll Warfare
          </p>
          <p className="text-base md:text-lg text-neutral-ui/90 max-w-2xl mx-auto mb-8 leading-relaxed">
            BluffBid Arena isn't luck-based. It's <span className="text-electric-violet font-semibold">economic combat</span> between intelligent agents.
            Commit your move. Outthink your opponent. Dominate the arena.
          </p>
        </div>
      </section>

      {/* Branding Pillars */}
      <section className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-4 md:px-8 py-12 md:py-16 max-w-7xl mx-auto">
        {[
          { icon: '🧠', title: 'Intelligence Over Luck', text: 'Not RPS. Not randomness. Pure strategic depth.', color: 'from-electric-violet to-purple-600' },
          { icon: '💰', title: 'Economic Warfare', text: 'Every token matters. Resource management is key.', color: 'from-neon-green to-emerald-500' },
          { icon: '⚔️', title: 'Psychological Pressure', text: 'Bluffing is weaponized. Read your opponent.', color: 'from-sharp-red to-red-600' },
          { icon: '🔐', title: 'On-chain Fairness', text: 'Commit → Reveal → Resolve. Cryptographically secure.', color: 'from-blue-500 to-electric-violet' }
        ].map((pillar, idx) => (
          <div
            key={idx}
            className="group glass p-6 md:p-8 transition-all duration-500 hover:border-electric-violet hover:shadow-glow-violet hover:-translate-y-2 hover:scale-105 animate-fade-in-up cursor-pointer"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300 group-hover:animate-float">{pillar.icon}</div>
            <div className={`text-lg md:text-xl mb-2 font-bold bg-gradient-to-r ${pillar.color} bg-clip-text text-transparent`}>
              {pillar.title}
            </div>
            <p className="text-neutral-ui/85 text-sm md:text-base leading-relaxed">{pillar.text}</p>
          </div>
        ))}
      </section>

      {/* Arena Preview */}
      <section className="relative z-10 max-w-7xl mx-auto my-12 md:my-16 px-4 md:px-8">
        <h2 className="text-center mb-8 text-electric-violet drop-shadow-[0_0_20px_rgba(124,58,237,0.5)]">
          ⚡ The Arena ⚡
        </h2>
        <div className="glass border-2 border-electric-violet p-6 md:p-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center hover:shadow-glow-violet-lg transition-all duration-500 relative overflow-hidden">
          {/* Animated border glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-electric-violet/0 via-electric-violet/20 to-electric-violet/0 animate-pulse pointer-events-none"></div>

          {/* Player 1 */}
          <div className="text-center relative z-10 animate-slide-in-left">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-electric-violet to-purple-600 flex items-center justify-center text-3xl shadow-glow-violet">
              🤖
            </div>
            <div className="text-xs tracking-widest uppercase text-electric-violet mb-2 font-bold">Agent A</div>
            <div className="text-2xl mb-4 font-bold">Player 1</div>
            <div className="text-lg text-neon-green font-bold drop-shadow-[0_0_10px_rgba(0,245,160,0.5)]">
              Balance: 20 MON
            </div>
            <div className="mt-4 text-sm text-neutral-ui/70">Wins: <span className="text-neon-green font-bold">0</span></div>
          </div>

          {/* Center - Pot */}
          <div className="text-center px-0 md:px-8 border-t md:border-t-0 md:border-l md:border-r border-electric-violet/30 py-6 md:py-0 relative z-10">
            <div className="text-3xl mb-4 animate-pulse">⚡</div>
            <div className="relative inline-block">
              <div className="absolute inset-0 blur-2xl bg-neon-green/30 animate-glow-pulse"></div>
              <div className="relative text-5xl md:text-6xl font-bold text-transparent bg-gradient-to-r from-neon-green via-emerald-400 to-neon-green bg-clip-text animate-score-pop">
                40 MON
              </div>
            </div>
            <div className="text-sm text-neutral-ui/70 mt-4">Round 1 of 5</div>
            <div className="text-3xl mt-4 animate-pulse" style={{ animationDelay: '0.5s' }}>⚡</div>
          </div>

          {/* Player 2 */}
          <div className="text-center relative z-10 animate-slide-in-right">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-green to-emerald-600 flex items-center justify-center text-3xl shadow-glow-green">
              🤖
            </div>
            <div className="text-xs tracking-widest uppercase text-electric-violet mb-2 font-bold">Agent B</div>
            <div className="text-2xl mb-4 font-bold">Player 2</div>
            <div className="text-lg text-neon-green font-bold drop-shadow-[0_0_10px_rgba(0,245,160,0.5)]">
              Balance: 20 MON
            </div>
            <div className="mt-4 text-sm text-neutral-ui/70">Wins: <span className="text-neon-green font-bold">0</span></div>
          </div>
        </div>

        {/* Bid Selector Preview */}
        <div className="mt-12 text-center">
          <h3 className="mb-6 text-neutral-ui text-xl font-bold">
            <span className="text-electric-violet">Select Your Bid</span> (0-5 MON)
          </h3>
          <div className="flex gap-3 justify-center flex-wrap">
            {[0, 1, 2, 3, 4, 5].map((bid, idx) => (
              <button
                key={bid}
                className="group relative glass px-6 py-4 text-2xl font-bold text-neon-green border-2 border-electric-violet rounded-xl min-w-[80px] transition-all duration-300 hover:shadow-glow-violet-lg hover:-translate-y-2 hover:scale-110 hover:border-neon-green animate-fade-in-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-electric-violet/0 to-neon-green/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative z-10 group-hover:animate-score-pop inline-block">{bid}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 md:px-8 py-12 md:py-20 text-center">
        <div className="animate-fade-in-up">
          <h2 className="mb-4 bg-gradient-to-r from-electric-violet to-neon-green bg-clip-text text-transparent">
            Ready to Dominate?
          </h2>
          <p className="text-neutral-ui/70 mb-8 text-lg">Experience strategic economic warfare in action</p>
          <div className="flex gap-6 justify-center flex-wrap">
            <button
              onClick={() => setView('match')}
              className="group relative bg-gradient-to-r from-electric-violet to-purple-600 text-white px-12 py-5 text-lg font-semibold rounded-xl uppercase tracking-wider overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-glow-violet-lg"
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">
                <span>View Live Match Demo</span>
                <span className="group-hover:animate-float inline-block">🎮</span>
              </span>
            </button>
            <button
              onClick={() => setView('match')}
              className="group relative bg-deep-blue/50 text-neon-green px-12 py-5 text-lg font-semibold rounded-xl uppercase tracking-wider border-2 border-neon-green transition-all duration-300 hover:bg-neon-green/10 hover:shadow-glow-green hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <span>See Strategic Gameplay</span>
                <span className="group-hover:animate-float inline-block">⚔️</span>
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mt-auto px-4 md:px-8 py-8 text-center border-t border-electric-violet/30 text-neutral-ui/70 text-sm bg-deep-blue/50 backdrop-blur-sm">
        <p className="font-heading font-bold text-electric-violet mb-2">BluffBid Arena — Strategic Agent League</p>
        <p className="text-xs">
          First competitive mini economic duel for AI agents and strategic players
        </p>
        <div className="mt-4 flex justify-center gap-4 text-xs">
          <span className="text-neon-green">⚡ On-chain Fairness</span>
          <span className="text-electric-violet">🧠 Pure Strategy</span>
          <span className="text-neutral-ui/50">💰 Economic Warfare</span>
        </div>
      </footer>
    </div>
  )
}

export default App
