import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../utils/api';

const PRESETS = [1000, 5000, 10000, 50000, 100000];

export default function AdminPage() {
  const { user, updateBalance } = useAuth();
  const [adminPassword, setAdminPassword] = useState('');
  const [amount, setAmount] = useState(10000);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    try {
      const { newBalance, added } = await adminApi.addBalance(adminPassword, amount);
      updateBalance(newBalance);
      setMessage({ text: `✅ Added ${added.toLocaleString()} coins! New balance: ${newBalance.toLocaleString()}`, success: true });
      setAdminPassword('');
    } catch (err) {
      setMessage({ text: (err as Error).message, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Admin Panel</h2>
        <p className="text-gray-400 mt-1">Add coins to your account using the admin password</p>
      </div>

      <div className="card p-8 max-w-md">
        {/* Current balance */}
        <div className="bg-casino-surface rounded-xl px-5 py-4 mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Current Balance</p>
          <p className="font-mono text-2xl font-bold gold-text">
            {(user?.balance ?? 0).toLocaleString()} coins
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Amount presets */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Amount to Add</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setAmount(p)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-mono transition-all ${
                    amount === p
                      ? 'bg-casino-gold text-casino-bg font-semibold'
                      : 'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-gold/50'
                  }`}
                >
                  {p.toLocaleString()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(Math.max(1, Math.min(10000000, parseInt(e.target.value) || 1)))}
                className="input-field"
                min={1}
                max={10000000}
                placeholder="Custom amount"
              />
              <span className="text-gray-500 text-sm shrink-0">coins</span>
            </div>
          </div>

          {/* Admin password */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Admin Password</label>
            <input
              type="password"
              value={adminPassword}
              onChange={e => setAdminPassword(e.target.value)}
              className="input-field"
              placeholder="Enter admin password"
              required
            />
          </div>

          {/* Message */}
          {message && (
            <div className={`rounded-xl px-4 py-3 text-sm animate-fade-in ${
              message.success
                ? 'bg-casino-green/10 border border-casino-green/30 text-casino-green'
                : 'bg-casino-red/10 border border-casino-red/30 text-casino-red'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !adminPassword}
            className="btn-gold w-full py-3"
          >
            {loading ? '⏳ Adding...' : `💰 Add ${amount.toLocaleString()} Coins`}
          </button>
        </form>
      </div>

      <p className="text-xs text-gray-600 max-w-md">
        The admin password is set via the <code className="text-gray-400">ADMIN_PASSWORD</code> environment variable in <code className="text-gray-400">docker-compose.yml</code>.
      </p>
    </div>
  );
}
