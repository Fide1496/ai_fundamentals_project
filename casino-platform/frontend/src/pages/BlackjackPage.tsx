import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { BlackjackState, Card } from '../types';

const SUIT_COLORS: Record<string, string> = {
  hearts: 'text-red-400',
  diamonds: 'text-red-400',
  clubs: 'text-white',
  spades: 'text-white',
  hidden: 'text-gray-600',
};

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠', hidden: '?',
};

function PlayingCard({ card }: { card: Card }) {
  if (card.hidden) {
    return (
      <div className="w-16 h-24 rounded-xl bg-casino-surface border-2 border-casino-border flex items-center justify-center">
        <span className="text-3xl text-gray-600">🂠</span>
      </div>
    );
  }
  const color = SUIT_COLORS[card.suit] || 'text-white';
  const suitSym = SUIT_SYMBOLS[card.suit] || card.suit;
  return (
    <div className="w-16 h-24 rounded-xl bg-white border-2 border-gray-200 flex flex-col items-center justify-center shadow-md">
      <span className={`text-xl font-bold leading-none ${color}`}>{card.rank}</span>
      <span className={`text-xl ${color}`}>{suitSym}</span>
    </div>
  );
}

function Hand({ cards, label, total }: { cards: Card[]; label: string; total: number }) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
        {label} — <span className="text-white font-semibold">{total}</span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {cards.map((card, i) => <PlayingCard key={i} card={card} />)}
      </div>
    </div>
  );
}

const RESULT_STYLES: Record<string, { label: string; cls: string }> = {
  win:       { label: '🎉 You Win!',     cls: 'text-casino-green' },
  loss:      { label: '💸 You Lose',     cls: 'text-casino-red' },
  push:      { label: '🤝 Push!',        cls: 'text-casino-gold' },
  blackjack: { label: '⭐ Blackjack!',   cls: 'text-casino-gold' },
};

export default function BlackjackPage() {
  const { user, updateBalance } = useAuth();
  const [bet, setBet] = useState(25);
  const [game, setGame] = useState<BlackjackState | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const startGame = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const state = await api.blackjackStart(bet);
      setGame(state);
      updateBalance(state.balance);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const doAction = async (action: 'hit' | 'stand') => {
    if (!game || actionLoading) return;
    setActionLoading(true);
    setError('');
    try {
      const state = await api.blackjackAction(game.sessionId, action);
      setGame(state);
      updateBalance(state.balance);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setActionLoading(false);
    }
  };

  const BET_PRESETS = [10, 25, 50, 100, 250, 500];
  const isFinished = game?.status === 'finished';
  const isPlaying = game?.status === 'playing';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Blackjack</h2>
        <p className="text-gray-400 mt-1">Dealer stands on 17 · Blackjack pays 3:2</p>
      </div>

      {!game ? (
        /* Bet Selection */
        <div className="card p-8 text-center space-y-6">
          <div className="text-5xl">🃏</div>
          <div>
            <p className="text-sm text-gray-400 mb-3">Select Bet Amount</p>
            <div className="flex flex-wrap justify-center gap-2 mb-4">
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
            <div className="flex items-center justify-center gap-2">
              <input
                type="number"
                value={bet}
                onChange={e => setBet(Math.max(1, Math.min(10000, parseInt(e.target.value) || 1)))}
                className="w-28 bg-casino-surface border border-casino-border rounded-lg px-3 py-2 text-center font-mono text-white focus:outline-none focus:border-casino-gold"
                min={1} max={10000}
              />
              <span className="text-gray-500 text-sm">coins</span>
            </div>
          </div>

          {error && (
            <div className="bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm">
              {error}
            </div>
          )}

          <button
            onClick={startGame}
            disabled={loading || (user?.balance ?? 0) < bet}
            className="btn-gold px-10 py-4 text-lg"
          >
            {loading ? 'Dealing...' : `Deal for ${bet} coins`}
          </button>
          {(user?.balance ?? 0) < bet && (
            <p className="text-casino-red text-sm">Insufficient balance</p>
          )}
        </div>
      ) : (
        /* Game Board */
        <div className={`card p-6 space-y-6 ${
          isFinished && game.result === 'win' ? 'win-flash' :
          isFinished && game.result === 'loss' ? 'lose-flash' : ''
        }`}>
          {/* Dealer Hand */}
          <Hand
            cards={game.dealerHand}
            label="Dealer"
            total={game.dealerTotal}
          />

          <div className="border-t border-casino-border" />

          {/* Player Hand */}
          <Hand
            cards={game.playerHand}
            label={`Your Hand (Bet: ${game.bet} coins)`}
            total={game.playerTotal}
          />

          {/* Result */}
          {isFinished && game.result && (
            <div className={`text-center animate-bounce-in font-display text-2xl font-bold ${RESULT_STYLES[game.result]?.cls}`}>
              {RESULT_STYLES[game.result]?.label}
              {game.payout != null && game.payout > 0 && (
                <span className="block text-base font-body font-normal text-gray-300 mt-1">
                  Payout: {game.payout.toLocaleString()} coins
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm text-center">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {isPlaying && (
              <>
                <button
                  onClick={() => doAction('hit')}
                  disabled={actionLoading}
                  className="btn-gold px-8 py-3"
                >
                  {actionLoading ? '...' : 'Hit'}
                </button>
                <button
                  onClick={() => doAction('stand')}
                  disabled={actionLoading}
                  className="btn-ghost px-8 py-3"
                >
                  Stand
                </button>
              </>
            )}
            {isFinished && (
              <button
                onClick={() => { setGame(null); setError(''); }}
                className="btn-gold px-8 py-3"
              >
                New Hand
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="card p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rules</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Dealer stands on 17</li>
          <li>• Blackjack (Ace + 10-value) pays 3:2</li>
          <li>• Push returns your bet</li>
          <li>• Win doubles your bet</li>
        </ul>
      </div>
    </div>
  );
}
