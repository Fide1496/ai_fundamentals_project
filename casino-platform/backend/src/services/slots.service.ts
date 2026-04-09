import { WalletModel, TransactionModel } from '../models';
import { pool } from '../config/database';

// Symbol definitions with weights
export const SYMBOLS = ['🍒', '🍋', '🍊', '🍇', '⭐', '💎', '7️⃣'] as const;
export type Symbol = typeof SYMBOLS[number];

// Weights: higher = more common
const SYMBOL_WEIGHTS: Record<Symbol, number> = {
  '🍒': 35,
  '🍋': 25,
  '🍊': 20,
  '🍇': 12,
  '⭐': 5,
  '💎': 2,
  '7️⃣': 1,
};

// Payout multipliers for 3-of-a-kind
const PAYOUTS: Record<Symbol, number> = {
  '🍒': 2,
  '🍋': 3,
  '🍊': 4,
  '🍇': 6,
  '⭐': 15,
  '💎': 50,
  '7️⃣': 100,
};

// Two-of-a-kind payout (cherry only special case)
const TWO_CHERRY_PAYOUT = 1.5;

function weightedRandom(): Symbol {
  const total = Object.values(SYMBOL_WEIGHTS).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [symbol, weight] of Object.entries(SYMBOL_WEIGHTS)) {
    rand -= weight;
    if (rand <= 0) return symbol as Symbol;
  }
  return '🍒';
}

function spin(): [Symbol, Symbol, Symbol] {
  return [weightedRandom(), weightedRandom(), weightedRandom()];
}

function calculatePayout(reels: [Symbol, Symbol, Symbol], bet: number): number {
  const [a, b, c] = reels;

  // Three of a kind
  if (a === b && b === c) {
    return Math.floor(bet * PAYOUTS[a]);
  }

  // Two cherries
  const cherries = reels.filter(s => s === '🍒').length;
  if (cherries === 2) {
    return Math.floor(bet * TWO_CHERRY_PAYOUT);
  }

  return 0;
}

export const SlotsService = {
  async play(userId: string, bet: number) {
    if (bet <= 0 || !Number.isInteger(bet)) {
      throw new Error('INVALID_BET');
    }
    if (bet > 10000) throw new Error('BET_TOO_HIGH');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Lock wallet row for update to prevent race conditions
      const walletRes = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const wallet = walletRes.rows[0];
      if (!wallet) throw new Error('WALLET_NOT_FOUND');
      if (wallet.balance < bet) throw new Error('INSUFFICIENT_BALANCE');

      const reels = spin();
      const payout = calculatePayout(reels, bet);
      const net = payout - bet;

      // Debit bet
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [bet, userId]
      );

      // Credit winnings if any
      if (payout > 0) {
        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
          [payout, userId]
        );
      }

      // Get final balance
      const finalRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      // Record transaction
      const description = payout > 0
        ? `Slots: ${reels.join('')} → Won ${payout}`
        : `Slots: ${reels.join('')} → Lost`;

      await client.query(
        'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [userId, net, net >= 0 ? 'win' : 'loss', description]
      );

      await client.query('COMMIT');

      return {
        reels,
        bet,
        payout,
        net,
        balance: finalRes.rows[0].balance,
        win: payout > 0,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
