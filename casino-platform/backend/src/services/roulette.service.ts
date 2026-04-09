import { WalletModel, TransactionModel } from '../models';
import { pool } from '../config/database';

type BetType = 'straight' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen' | 'column';

interface RouletteBet {
  type: BetType;
  value: number | string; // number for straight, label for others
  amount: number;
}

// European roulette: 0-36
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const BLACK_NUMBERS = new Set([2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35]);

function spinWheel(): number {
  return Math.floor(Math.random() * 37); // 0-36
}

function getBetPayout(bet: RouletteBet, result: number): number {
  const { type, value, amount } = bet;

  switch (type) {
    case 'straight':
      if (result === Number(value)) return amount * 35;
      return 0;

    case 'red':
      if (result !== 0 && RED_NUMBERS.has(result)) return amount * 2;
      return 0;

    case 'black':
      if (result !== 0 && BLACK_NUMBERS.has(result)) return amount * 2;
      return 0;

    case 'odd':
      if (result !== 0 && result % 2 !== 0) return amount * 2;
      return 0;

    case 'even':
      if (result !== 0 && result % 2 === 0) return amount * 2;
      return 0;

    case 'low': // 1-18
      if (result >= 1 && result <= 18) return amount * 2;
      return 0;

    case 'high': // 19-36
      if (result >= 19 && result <= 36) return amount * 2;
      return 0;

    case 'dozen':
      if (value === 'first' && result >= 1 && result <= 12) return amount * 3;
      if (value === 'second' && result >= 13 && result <= 24) return amount * 3;
      if (value === 'third' && result >= 25 && result <= 36) return amount * 3;
      return 0;

    case 'column':
      if (value === 'first' && result % 3 === 1) return amount * 3;
      if (value === 'second' && result % 3 === 2) return amount * 3;
      if (value === 'third' && result % 3 === 0 && result !== 0) return amount * 3;
      return 0;

    default:
      return 0;
  }
}

function validateBet(bet: RouletteBet): void {
  if (bet.amount <= 0 || !Number.isInteger(bet.amount)) {
    throw new Error('INVALID_BET_AMOUNT');
  }
  if (bet.amount > 5000) throw new Error('BET_TOO_HIGH');

  if (bet.type === 'straight') {
    const num = Number(bet.value);
    if (!Number.isInteger(num) || num < 0 || num > 36) {
      throw new Error('INVALID_STRAIGHT_BET');
    }
  }

  if (bet.type === 'dozen' && !['first', 'second', 'third'].includes(String(bet.value))) {
    throw new Error('INVALID_DOZEN_BET');
  }

  if (bet.type === 'column' && !['first', 'second', 'third'].includes(String(bet.value))) {
    throw new Error('INVALID_COLUMN_BET');
  }
}

export const RouletteService = {
  async play(userId: string, bets: RouletteBet[]) {
    if (!bets || bets.length === 0) throw new Error('NO_BETS');
    if (bets.length > 10) throw new Error('TOO_MANY_BETS');

    // Validate all bets first
    for (const bet of bets) {
      validateBet(bet);
    }

    const totalBet = bets.reduce((sum, b) => sum + b.amount, 0);
    if (totalBet > 20000) throw new Error('TOTAL_BET_TOO_HIGH');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const wallet = walletRes.rows[0];
      if (!wallet) throw new Error('WALLET_NOT_FOUND');
      if (wallet.balance < totalBet) throw new Error('INSUFFICIENT_BALANCE');

      // Spin the wheel
      const result = spinWheel();

      // Calculate payouts
      let totalPayout = 0;
      const betResults = bets.map(bet => {
        const payout = getBetPayout(bet, result);
        totalPayout += payout;
        return { ...bet, payout, win: payout > 0 };
      });

      const net = totalPayout - totalBet;

      // Apply balance changes
      await client.query(
        'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
        [net, userId]
      );

      const color = result === 0 ? 'green' : RED_NUMBERS.has(result) ? 'red' : 'black';

      await client.query(
        'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [userId, net, net >= 0 ? 'win' : 'loss',
         `Roulette: ball landed on ${result} (${color}), net ${net >= 0 ? '+' : ''}${net}`]
      );

      await client.query(
        'INSERT INTO game_sessions (user_id, game_type, state, result) VALUES ($1, $2, $3, $4)',
        [userId, 'roulette', JSON.stringify({ bets, result, color, totalBet, totalPayout }), net >= 0 ? 'win' : 'loss']
      );

      const finalWalletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        result,
        color,
        bets: betResults,
        totalBet,
        totalPayout,
        net,
        balance: finalWalletRes.rows[0].balance,
        win: totalPayout > totalBet,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
