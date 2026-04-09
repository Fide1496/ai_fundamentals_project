import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { SlotsResult } from '../types';

const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'];
const PAYOUTS: Record<string, number> = {
  '🍒': 2, '🍋': 3, '🍊': 4, '🍇': 6, '⭐': 15, '💎': 50, '7️⃣': 100,
};

function Reel({ symbol, spinning }: { symbol: string; spinning: boolean }) {
  return (
    <div className="w-24 h-24 bg-casino-surface border-2 border-casino-border rounded-2xl flex items-center justify-center overflow-hidden relative">
      <div className={spinning ? 'reel-spinning' : 'transition-all duration-300'}>
        <span className="text-5xl select-none">{symbol}</span>
      </div>
      {spinning && (
        <div className="absolute inset-0 bg-gradient-to-b from-casino-surface/80 via-transparent to-casino-surface/80 pointer-events-none" />
      )}
    </div>
  );
}

export default function SlotsPage() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(10);
  const [reels, setReels] = useState(['🍒', '🍋', '🍊']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SlotsResult | null>(null);
  const [error, setError] = useState('');
  const spinnerRef = useRef<NodeJS.Timeout | null>(null);

  const randomSymbol = () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

  const handleSpin = async () => {
    if (spinning || !user) return;
    setError('');
    setResult(null);
    setSpinning(true);

    // Animate reels with random symbols
    const intervalId = setInterval(() => {
      setReels([randomSymbol(), randomSymbol(), randomSymbol()]);
    }, 80);
    spinnerRef.current = intervalId;

    try {
      const res = await api.slotsPlay(bet);
      // Stop animation and show result
      setTimeout(() => {
        clearInterval(intervalId);
        setReels(res.reels);
        setSpinning(false);
        setResult(res);
        updateBalance(res.balance);
      }, 800);
    } catch (err) {
      clearInterval(intervalId);
      setSpinning(false);
      setReels(['🍒', '🍋', '🍊']);
      setError((err as Error).message);
    }
  };

  const BET_PRESETS = [5, 10, 25, 50, 100, 250];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold">
          <span className="gold-text">Slot Machine</span>
        </h2>
        <p className="text-gray-400 mt-1">Match symbols to win up to 100× your bet</p>
      </div>

      {/* Machine */}
      <div className={`card p-8 text-center ${result?.win ? 'win-flash' : result && !result.win ? 'lose-flash' : ''}`}>
        {/* Reels */}
        <div className="flex justify-center gap-4 mb-8">
          {reels.map((sym, i) => (
            <Reel key={i} symbol={sym} spinning={spinning} />
          ))}
        </div>

        {/* Result message */}
        {result && !spinning && (
          <div className={`mb-6 animate-bounce-in font-display text-2xl font-bold ${result.win ? 'text-casino-green' : 'text-casino-red'}`}>
            {result.win
              ? `🎉 You won ${result.payout.toLocaleString()} coins!`
              : `💸 Better luck next time!`}
          </div>
        )}

        {/* Bet Selection */}
        <div className="mb-6">
          <p className="text-sm text-gray-400 mb-3">Bet Amount</p>
          <div className="flex flex-wrap justify-center gap-2">
            {BET_PRESETS.map(p => (
              <button
                key={p}
                onClick={() => setBet(p)}
                className={`px-4 py-2 rounded-lg text-sm font-mono font-semibold transition-all
                  ${bet === p
                    ? 'bg-casino-gold text-casino-bg'
                    : 'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-gold/50'
                  }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2">
            <input
              type="number"
              value={bet}
              onChange={e => setBet(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
              className="w-28 bg-casino-surface border border-casino-border rounded-lg px-3 py-2 text-center font-mono text-white focus:outline-none focus:border-casino-gold"
              min={1}
              max={10000}
            />
            <span className="text-gray-500 text-sm">coins</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning || (user?.balance ?? 0) < bet}
          className="btn-gold px-12 py-4 text-lg"
        >
          {spinning ? '🎰 Spinning...' : `🎰 Spin for ${bet} coins`}
        </button>

        {(user?.balance ?? 0) < bet && (
          <p className="mt-3 text-casino-red text-sm">Insufficient balance</p>
        )}
      </div>

      {/* Payout Table */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Payout Table</h3>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(PAYOUTS).map(([sym, mult]) => (
            <div key={sym} className="flex items-center justify-between bg-casino-surface rounded-lg px-3 py-2">
              <span className="text-lg">{sym}{sym}{sym}</span>
              <span className="font-mono text-casino-gold text-sm">{mult}×</span>
            </div>
          ))}
          <div className="flex items-center justify-between bg-casino-surface rounded-lg px-3 py-2">
            <span className="text-lg">🍒🍒</span>
            <span className="font-mono text-casino-gold text-sm">1.5×</span>
          </div>
        </div>
      </div>
    </div>
  );
}
