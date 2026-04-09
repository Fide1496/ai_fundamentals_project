import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { CrashResult } from '../types';

export default function CrashPage() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(50);
  const [target, setTarget] = useState(2.0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrashResult | null>(null);
  const [error, setError] = useState('');
  const [animMultiplier, setAnimMultiplier] = useState(1.0);
  const [animating, setAnimating] = useState(false);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animDataRef = useRef({ current: 1.0, target: 1.0, crashPoint: 1.0, done: false });

  const drawCurve = (currentMult: number, crashPoint: number, cashed: boolean, crashed: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const steps = 200;
    const maxMult = Math.max(crashPoint * 1.2, currentMult * 1.1, 2);

    ctx.beginPath();
    ctx.strokeStyle = crashed ? '#ff4060' : cashed ? '#00e87a' : '#9060ff';
    ctx.lineWidth = 3;
    ctx.shadowColor = crashed ? '#ff4060' : cashed ? '#00e87a' : '#9060ff';
    ctx.shadowBlur = 12;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const mult = 1 + (currentMult - 1) * Math.pow(t, 0.7);
      if (mult > currentMult) break;
      const x = (t * W * 0.9) + W * 0.05;
      const y = H - (((mult - 1) / (maxMult - 1)) * H * 0.85) - H * 0.05;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Dot at end
    const endX = (W * 0.9 * Math.min(1, (currentMult - 1) / (maxMult - 1 || 1))) + W * 0.05;
    const endY = H - (((currentMult - 1) / (maxMult - 1 || 1)) * H * 0.85) - H * 0.05;
    ctx.beginPath();
    ctx.arc(endX, endY, 6, 0, Math.PI * 2);
    ctx.fillStyle = crashed ? '#ff4060' : cashed ? '#00e87a' : '#9060ff';
    ctx.fill();
  };

  const runAnimation = (crashPoint: number, targetMult: number, won: boolean) => {
    setAnimating(true);
    animDataRef.current = { current: 1.0, target: crashPoint, crashPoint, done: false };

    const step = () => {
      animDataRef.current.current = Math.min(
        animDataRef.current.current + (animDataRef.current.current * 0.04 + 0.02),
        animDataRef.current.target
      );
      const cur = animDataRef.current.current;
      setAnimMultiplier(cur);
      drawCurve(cur, crashPoint, won && cur >= targetMult, !won && cur >= crashPoint);

      if (cur < crashPoint) {
        animRef.current = setTimeout(step, 50);
      } else {
        setAnimating(false);
      }
    };
    step();
  };

  const handlePlay = async () => {
    if (loading || animating) return;
    if (animRef.current) clearTimeout(animRef.current);
    setError('');
    setResult(null);
    setAnimMultiplier(1.0);
    setLoading(true);

    try {
      const res = await api.crashPlay(bet, target);
      setResult(res);
      updateBalance(res.balance);
      runAnimation(res.crashPoint, res.targetMultiplier, res.win);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => { if (animRef.current) clearTimeout(animRef.current); };
  }, []);

  const BET_PRESETS = [10, 25, 50, 100, 250];
  const TARGET_PRESETS = [1.5, 2, 3, 5, 10, 25];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Crash</h2>
        <p className="text-gray-400 mt-1">Set a target multiplier. Cash out before it crashes!</p>
      </div>

      {/* Chart */}
      <div className={`card p-6 ${result?.win ? 'win-flash' : result && !result.win ? 'lose-flash' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Multiplier</span>
          <span className={`font-mono text-3xl font-bold ${
            result?.win ? 'text-casino-green' :
            result && !result.win ? 'text-casino-red' :
            'text-casino-purple'
          }`}>
            {animMultiplier.toFixed(2)}×
          </span>
        </div>

        <canvas
          ref={canvasRef}
          width={600}
          height={200}
          className="w-full rounded-xl bg-casino-surface border border-casino-border"
        />

        {result && !animating && (
          <div className={`mt-4 text-center animate-bounce-in font-display text-xl font-bold ${result.win ? 'text-casino-green' : 'text-casino-red'}`}>
            {result.win
              ? `🚀 Cashed out at ${result.cashedOutAt}× — Won ${result.payout.toLocaleString()} coins!`
              : `💥 Crashed at ${result.crashPoint}× — Lost ${result.bet.toLocaleString()} coins`}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="card p-6 space-y-5">
        {/* Bet */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Bet Amount</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {BET_PRESETS.map(p => (
              <button key={p} onClick={() => setBet(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  bet === p ? 'bg-casino-gold text-casino-bg font-semibold' :
                  'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-gold/50'
                }`}>{p}</button>
            ))}
            <input
              type="number" value={bet}
              onChange={e => setBet(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
              className="w-24 bg-casino-surface border border-casino-border rounded-lg px-3 py-1.5 text-center font-mono text-white text-sm focus:outline-none focus:border-casino-gold"
              min={1} max={10000}
            />
          </div>
        </div>

        {/* Target */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Target Multiplier (auto cash-out)</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {TARGET_PRESETS.map(p => (
              <button key={p} onClick={() => setTarget(p)}
                className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                  target === p ? 'bg-casino-purple/80 text-white font-semibold' :
                  'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-purple/50'
                }`}>{p}×</button>
            ))}
            <div className="flex items-center gap-1">
              <input
                type="number" value={target} step="0.1"
                onChange={e => setTarget(Math.max(1.01, Math.min(1000, parseFloat(e.target.value) || 1.01)))}
                className="w-24 bg-casino-surface border border-casino-border rounded-lg px-3 py-1.5 text-center font-mono text-white text-sm focus:outline-none focus:border-casino-purple"
                min={1.01} max={1000}
              />
              <span className="text-gray-500 text-sm">×</span>
            </div>
          </div>
        </div>

        {/* Potential payout preview */}
        <div className="bg-casino-surface rounded-xl px-4 py-3 flex justify-between text-sm">
          <span className="text-gray-400">Potential payout at {target}×</span>
          <span className="font-mono text-casino-green font-semibold">
            {Math.floor(bet * target).toLocaleString()} coins
          </span>
        </div>

        {error && (
          <div className="bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm">
            {error}
          </div>
        )}

        <button
          onClick={handlePlay}
          disabled={loading || animating || (user?.balance ?? 0) < bet}
          className="btn-gold w-full py-4 text-lg"
        >
          {loading ? 'Launching...' : animating ? '🚀 Flying...' : `🚀 Launch for ${bet} coins`}
        </button>
        {(user?.balance ?? 0) < bet && (
          <p className="text-casino-red text-sm text-center">Insufficient balance</p>
        )}
      </div>

      {/* Info */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">How It Works</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Set your bet and a target multiplier</li>
          <li>• The rocket launches and multiplier climbs</li>
          <li>• If it reaches your target before crashing — you win!</li>
          <li>• Higher targets = bigger risk and reward</li>
          <li>• House edge: ~4% (4% chance of instant crash at 1×)</li>
        </ul>
      </div>
    </div>
  );
}
