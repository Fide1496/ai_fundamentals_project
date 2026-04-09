import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { RouletteBet, RouletteResult } from '../types';

const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function RouletteWheel({ result, spinning }: { result: number | null; spinning: boolean }) {
  const color = result === null ? '' : result === 0 ? 'bg-green-600' : RED_NUMBERS.has(result) ? 'bg-red-600' : 'bg-gray-800';
  return (
    <div className="flex flex-col items-center gap-3">
      <div className={`w-32 h-32 rounded-full border-4 border-casino-gold/50 flex items-center justify-center text-4xl font-bold font-mono
        ${color} ${spinning ? 'animate-spin-slow' : 'transition-all duration-700'}`}>
        {spinning ? '🎡' : result !== null ? result : '?'}
      </div>
      {result !== null && !spinning && (
        <div className={`px-4 py-1 rounded-full text-sm font-semibold ${
          result === 0 ? 'bg-green-600 text-white' :
          RED_NUMBERS.has(result) ? 'bg-red-600 text-white' : 'bg-gray-700 text-white'
        }`}>
          {result === 0 ? 'Zero' : RED_NUMBERS.has(result) ? 'Red' : 'Black'}
        </div>
      )}
    </div>
  );
}

function NumberGrid({ onBet, activeBets }: {
  onBet: (bet: RouletteBet) => void;
  activeBets: RouletteBet[];
}) {
  const [chipSize, setChipSize] = useState(10);

  const getBetAmount = (type: string, value: number | string) =>
    activeBets.filter(b => b.type === type && b.value === value).reduce((s, b) => s + b.amount, 0);

  const addBet = (type: RouletteBet['type'], value: number | string) => {
    onBet({ type, value, amount: chipSize });
  };

  const CHIP_SIZES = [5, 10, 25, 50, 100];

  return (
    <div className="space-y-4">
      {/* Chip selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-400 mr-1">Chip:</span>
        {CHIP_SIZES.map(s => (
          <button key={s} onClick={() => setChipSize(s)}
            className={`w-10 h-10 rounded-full text-xs font-bold border-2 transition-all ${
              chipSize === s
                ? 'bg-casino-gold border-casino-gold text-casino-bg scale-110'
                : 'bg-casino-surface border-casino-border text-gray-300 hover:border-casino-gold/50'
            }`}>{s}</button>
        ))}
      </div>

      {/* Number grid 0-36 */}
      <div className="grid grid-cols-[auto_repeat(12,1fr)] gap-1 text-xs">
        {/* Zero */}
        <button
          onClick={() => addBet('straight', 0)}
          className="col-span-1 row-span-3 rounded bg-green-700 hover:bg-green-600 flex items-center justify-center font-bold text-white py-1 relative"
        >
          0
          {getBetAmount('straight', 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-casino-gold text-casino-bg text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {getBetAmount('straight', 0)}
            </span>
          )}
        </button>

        {/* Numbers 1-36 in 3 rows */}
        {[3, 2, 1].map(row =>
          Array.from({ length: 12 }, (_, col) => {
            const num = col * 3 + row;
            const isRed = RED_NUMBERS.has(num);
            const betAmt = getBetAmount('straight', num);
            return (
              <button key={num} onClick={() => addBet('straight', num)}
                className={`rounded py-1 font-semibold text-white hover:opacity-80 relative transition-all active:scale-95 ${
                  isRed ? 'bg-red-700 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                {num}
                {betAmt > 0 && (
                  <span className="absolute -top-1 -right-1 bg-casino-gold text-casino-bg text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    ●
                  </span>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* Outside bets */}
      <div className="grid grid-cols-6 gap-1 text-xs">
        {[
          { type: 'low' as const, value: 'low', label: '1-18' },
          { type: 'even' as const, value: 'even', label: 'Even' },
          { type: 'red' as const, value: 'red', label: '🔴 Red' },
          { type: 'black' as const, value: 'black', label: '⚫ Black' },
          { type: 'odd' as const, value: 'odd', label: 'Odd' },
          { type: 'high' as const, value: 'high', label: '19-36' },
        ].map(b => {
          const amt = getBetAmount(b.type, b.value);
          return (
            <button key={b.type} onClick={() => addBet(b.type, b.value)}
              className={`py-2 rounded border font-medium transition-all relative ${
                amt > 0
                  ? 'border-casino-gold/60 bg-casino-gold/10 text-casino-gold'
                  : 'border-casino-border bg-casino-surface text-gray-300 hover:border-casino-gold/40'
              }`}
            >
              {b.label}
              {amt > 0 && <span className="absolute -top-1 -right-1 text-xs bg-casino-gold text-casino-bg rounded-full w-4 h-4 flex items-center justify-center">●</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-1 text-xs">
        {[
          { type: 'dozen' as const, value: 'first', label: '1st 12' },
          { type: 'dozen' as const, value: 'second', label: '2nd 12' },
          { type: 'dozen' as const, value: 'third', label: '3rd 12' },
        ].map(b => {
          const amt = getBetAmount(b.type, b.value);
          return (
            <button key={b.value} onClick={() => addBet(b.type, b.value)}
              className={`py-2 rounded border font-medium transition-all relative ${
                amt > 0
                  ? 'border-casino-gold/60 bg-casino-gold/10 text-casino-gold'
                  : 'border-casino-border bg-casino-surface text-gray-300 hover:border-casino-gold/40'
              }`}
            >
              {b.label} (3×)
              {amt > 0 && <span className="absolute -top-1 -right-1 text-xs bg-casino-gold text-casino-bg rounded-full w-4 h-4 flex items-center justify-center">●</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function RoulettePage() {
  const { user, updateBalance } = useAuth();
  const [bets, setBets] = useState<RouletteBet[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<RouletteResult | null>(null);
  const [error, setError] = useState('');

  const addBet = (bet: RouletteBet) => {
    setBets(prev => [...prev, bet]);
    setResult(null);
  };

  const clearBets = () => setBets([]);

  const totalBet = bets.reduce((s, b) => s + b.amount, 0);

  const handleSpin = async () => {
    if (spinning || bets.length === 0) return;
    setError('');
    setResult(null);
    setSpinning(true);
    try {
      const res = await api.roulettePlay(bets);
      // Small delay to show spinning animation
      await new Promise(r => setTimeout(r, 1200));
      setResult(res);
      updateBalance(res.balance);
      setBets([]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSpinning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Roulette</h2>
        <p className="text-gray-400 mt-1">European Roulette (single zero) · Place your bets</p>
      </div>

      {/* Wheel + Result */}
      <div className={`card p-6 flex flex-col items-center gap-4 ${
        result?.win ? 'win-flash' : result && !result.win ? 'lose-flash' : ''
      }`}>
        <RouletteWheel result={result?.result ?? null} spinning={spinning} />

        {result && !spinning && (
          <div className={`text-center animate-bounce-in`}>
            <p className={`font-display text-2xl font-bold ${result.win ? 'text-casino-green' : 'text-casino-red'}`}>
              {result.win ? `🎉 +${result.net.toLocaleString()} coins!` : `💸 Lost ${Math.abs(result.net).toLocaleString()} coins`}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 justify-center">
              {result.bets.map((b, i) => (
                <span key={i} className={`text-xs px-2 py-1 rounded-full border ${
                  b.win ? 'border-casino-green/50 text-casino-green bg-casino-green/10' :
                  'border-casino-red/50 text-casino-red bg-casino-red/10'
                }`}>
                  {b.type} {String(b.value)}: {b.win ? `+${b.payout - b.amount}` : `-${b.amount}`}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Betting Board */}
      <div className="card p-5">
        <NumberGrid onBet={addBet} activeBets={bets} />
      </div>

      {/* Bet Summary + Spin */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Total Bet</p>
            <p className="font-mono text-xl font-bold text-casino-gold">{totalBet.toLocaleString()} coins</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Active bets</p>
            <p className="font-mono text-white">{bets.length}</p>
          </div>
        </div>

        {error && (
          <div className="bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={clearBets}
            disabled={spinning || bets.length === 0}
            className="btn-ghost flex-1"
          >
            Clear Bets
          </button>
          <button
            onClick={handleSpin}
            disabled={spinning || bets.length === 0 || (user?.balance ?? 0) < totalBet}
            className="btn-gold flex-1 py-3"
          >
            {spinning ? '🎡 Spinning...' : '🎡 Spin!'}
          </button>
        </div>

        {(user?.balance ?? 0) < totalBet && totalBet > 0 && (
          <p className="text-casino-red text-sm text-center">Insufficient balance</p>
        )}
      </div>
    </div>
  );
}
