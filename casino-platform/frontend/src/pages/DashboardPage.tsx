import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Transaction } from '../types';

const GAMES = [
  { path: '/slots', label: 'Slot Machine', icon: '🎰', desc: 'Spin to win up to 100x', color: 'from-yellow-900/30 to-yellow-800/10' },
  { path: '/blackjack', label: 'Blackjack', icon: '🃏', desc: 'Beat the dealer at 21', color: 'from-emerald-900/30 to-emerald-800/10' },
  { path: '/crash', label: 'Crash', icon: '🚀', desc: 'Cash out before it crashes', color: 'from-purple-900/30 to-purple-800/10' },
  { path: '/roulette', label: 'Roulette', icon: '🎡', desc: 'Place your bets and spin', color: 'from-red-900/30 to-red-800/10' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransactions()
      .then(({ transactions }) => setTransactions(transactions))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Header */}
      <div>
        <h2 className="font-display text-3xl font-bold text-white">
          Welcome back, <span className="gold-text">{user?.username}</span>
        </h2>
        <p className="text-gray-400 mt-1">Ready to test your luck?</p>
      </div>

      {/* Balance Card */}
      <div className="card p-6 bg-gradient-to-r from-casino-gold/5 to-transparent border-casino-gold/20">
        <p className="text-sm text-gray-400 mb-1">Your Balance</p>
        <p className="font-mono text-4xl font-bold gold-text">
          {(user?.balance ?? 0).toLocaleString()}
          <span className="text-lg ml-2 text-casino-gold-dim">coins</span>
        </p>
      </div>

      {/* Games Grid */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Games</h3>
        <div className="grid grid-cols-2 gap-4">
          {GAMES.map(game => (
            <Link
              key={game.path}
              to={game.path}
              className={`card p-5 bg-gradient-to-br ${game.color} hover:border-casino-gold/40 transition-all duration-200 group hover:scale-[1.02] active:scale-[0.98]`}
            >
              <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">
                {game.icon}
              </div>
              <p className="font-semibold text-white">{game.label}</p>
              <p className="text-xs text-gray-400 mt-1">{game.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-200">Recent Activity</h3>
        <div className="card divide-y divide-casino-border">
          {loading ? (
            <div className="p-6 text-center text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No transactions yet. Start playing!</div>
          ) : (
            transactions.slice(0, 10).map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-300 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
                <span className={`font-mono text-sm font-semibold ml-4 shrink-0 ${
                  tx.amount >= 0 ? 'text-casino-green' : 'text-casino-red'
                }`}>
                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
