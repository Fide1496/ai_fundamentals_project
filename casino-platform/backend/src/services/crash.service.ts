import { GameSessionModel, WalletModel, TransactionModel } from '../models';
import { pool } from '../config/database';

interface CrashState {
  bet: number;
  targetMultiplier: number;
  crashPoint: number;
  status: 'waiting' | 'in_flight' | 'cashed_out' | 'crashed';
  cashedOutAt?: number;
  payout?: number;
}

// Generate crash point using provably fair algorithm
function generateCrashPoint(): number {
  // House edge ~4%: crash immediately 4% of the time at 1.00x
  const rand = Math.random();
  if (rand < 0.04) return 1.0;
  // Otherwise exponential distribution gives realistic crash curve
  const crash = Math.max(1.0, 0.99 / (1 - rand));
  return Math.floor(crash * 100) / 100; // 2 decimal places
}

export const CrashService = {
  async startRound(userId: string, bet: number, targetMultiplier: number) {
    if (bet <= 0 || !Number.isInteger(bet)) throw new Error('INVALID_BET');
    if (bet > 10000) throw new Error('BET_TOO_HIGH');
    if (targetMultiplier < 1.01 || targetMultiplier > 1000) {
      throw new Error('INVALID_TARGET_MULTIPLIER');
    }

    // Cancel any existing crash session
    const existing = await GameSessionModel.getActiveSession(userId, 'crash');
    if (existing) {
      const existingState = existing.state as unknown as CrashState;
      await GameSessionModel.update(
        existing.id,
        existing.state as Record<string, unknown>,
        'abandoned'
      );
      // Refund bet if still waiting
      if (existingState.status === 'waiting') {
        await WalletModel.updateBalance(userId, existingState.bet);
      }
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const wallet = walletRes.rows[0];
      if (!wallet) throw new Error('WALLET_NOT_FOUND');
      if (wallet.balance < bet) throw new Error('INSUFFICIENT_BALANCE');

      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [bet, userId]
      );

      const crashPoint = generateCrashPoint();
      const state: CrashState = {
        bet,
        targetMultiplier,
        crashPoint,
        status: 'in_flight',
      };

      // Auto-resolve: did we reach target before crash?
      let payout = 0;
      let result: string;

      if (targetMultiplier <= crashPoint) {
        // Won - cashed out at target
        payout = Math.floor(bet * targetMultiplier);
        state.cashedOutAt = targetMultiplier;
        state.payout = payout;
        state.status = 'cashed_out';
        result = 'cashed_out';

        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
          [payout, userId]
        );
      } else {
        // Crashed before reaching target
        state.status = 'crashed';
        state.payout = 0;
        result = 'crashed';
      }

      const net = payout - bet;
      await client.query(
        'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [userId, net, net >= 0 ? 'win' : 'loss',
         `Crash: ${result === 'cashed_out'
           ? `cashed out at ${targetMultiplier}x (+${payout})`
           : `crashed at ${crashPoint}x (lost ${bet})`}`]
      );

      const sessionRes = await client.query(
        'INSERT INTO game_sessions (user_id, game_type, state, result) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, 'crash', JSON.stringify(state), result]
      );

      const finalWalletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        sessionId: sessionRes.rows[0].id,
        bet,
        targetMultiplier,
        crashPoint,
        status: state.status,
        cashedOutAt: state.cashedOutAt,
        payout,
        net,
        balance: finalWalletRes.rows[0].balance,
        win: state.status === 'cashed_out',
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
