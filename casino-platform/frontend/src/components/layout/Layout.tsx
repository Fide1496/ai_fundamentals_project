import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../utils/api';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { path: '/slots', label: 'Slots', icon: '🎰' },
  { path: '/crates', label: 'Cases', icon: '📦' },
  { path: '/blackjack', label: 'Blackjack', icon: '🃏' },
  { path: '/crash', label: 'Crash', icon: '🚀' },
  { path: '/roulette', label: 'Roulette', icon: '🎡' },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/admin', label: 'Admin', icon: '🔧' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, updateBalance } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDailyReward = async () => {
    if (claiming) return;
    setClaiming(true);
    setClaimMsg('');
    try {
      const { amount, newBalance } = await api.claimDailyReward();
      updateBalance(newBalance);
      setClaimMsg(`+${amount} coins!`);
      setTimeout(() => setClaimMsg(''), 3000);
    } catch (err) {
      setClaimMsg((err as Error).message);
      setTimeout(() => setClaimMsg(''), 3000);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-casino-border bg-casino-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-2xl">🎰</span>
            <span className="font-display font-bold text-xl gold-text">VegasVault</span>
          </Link>

          <div className="flex items-center gap-3">
            {claimMsg && (
              <span className={`text-sm font-mono animate-fade-in ${claimMsg.startsWith('+') ? 'text-casino-green' : 'text-casino-red'}`}>
                {claimMsg}
              </span>
            )}
            <button
              onClick={handleDailyReward}
              disabled={claiming}
              className="text-xs bg-casino-card border border-casino-gold/40 text-casino-gold px-3 py-1.5 rounded-lg hover:bg-casino-gold/10 transition-colors disabled:opacity-50"
            >
              {claiming ? '⏳' : '🎁'} Daily
            </button>
            <div className="balance-pill">
              <span>💰</span>
              <span>{(user?.balance ?? 0).toLocaleString()}</span>
            </div>
            <span className="text-sm text-gray-400 hidden sm:block">{user?.username}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-white transition-colors px-2 py-1"
            >
              Exit
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <nav className="w-56 border-r border-casino-border bg-casino-surface/50 hidden md:block shrink-0">
          <div className="p-4 space-y-1">
            {NAV_ITEMS.map(item => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-150 text-sm font-medium
                    ${active
                      ? 'bg-casino-gold/10 text-casino-gold border border-casino-gold/30'
                      : 'text-gray-400 hover:text-white hover:bg-casino-card'
                    }`}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="md:hidden border-t border-casino-border bg-casino-surface fixed bottom-0 left-0 right-0 z-50">
        <div className="flex">
          {NAV_ITEMS.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors
                  ${active ? 'text-casino-gold' : 'text-gray-500'}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="mt-0.5">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
