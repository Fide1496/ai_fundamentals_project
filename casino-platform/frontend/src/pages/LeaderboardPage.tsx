import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { LeaderboardEntry } from '../types';

const RANK_STYLES: Record<number, string> = {
  1: 'text-yellow-400 text-xl',
  2: 'text-gray-300 text-lg',
  3: 'text-orange-400 text-lg',
};

const RANK_ICONS: Record<number, string> = {
  1: '🥇', 2: '🥈', 3: '🥉',
};

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getLeaderboard()
      .then(({ leaderboard }) => setEntries(leaderboard))
      .catch(err => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Leaderboard</h2>
        <p className="text-gray-400 mt-1">Top players by virtual balance</p>
      </div>

      <div className="card overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-3 px-6 py-3 bg-casino-surface border-b border-casino-border text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <span>Rank</span>
          <span>Player</span>
          <span className="text-right">Balance</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-2xl mb-2">⏳</div>
            Loading...
          </div>
        ) : error ? (
          <div className="p-12 text-center text-casino-red">{error}</div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-gray-500">No players yet</div>
        ) : (
          <div className="divide-y divide-casino-border">
            {entries.map((entry) => {
              const isMe = entry.username === user?.username;
              const rankNum = Number(entry.rank);
              return (
                <div
                  key={entry.username}
                  className={`grid grid-cols-3 items-center px-6 py-4 transition-colors ${
                    isMe ? 'bg-casino-gold/5 border-l-2 border-casino-gold' : 'hover:bg-casino-surface/50'
                  }`}
                >
                  {/* Rank */}
                  <div className={`font-bold ${RANK_STYLES[rankNum] || 'text-gray-500'}`}>
                    {RANK_ICONS[rankNum] || `#${rankNum}`}
                  </div>

                  {/* Username */}
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isMe ? 'text-casino-gold' : 'text-white'}`}>
                      {entry.username}
                    </span>
                    {isMe && (
                      <span className="text-xs bg-casino-gold/20 text-casino-gold border border-casino-gold/30 px-2 py-0.5 rounded-full">
                        You
                      </span>
                    )}
                  </div>

                  {/* Balance */}
                  <div className="text-right font-mono font-semibold text-casino-green">
                    {Number(entry.balance).toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-center text-xs text-gray-600">
        Updated in real-time · Top 20 players shown
      </p>
    </div>
  );
}
