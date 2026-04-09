import { query } from '../config/database';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  created_at: Date;
  last_daily_reward: Date | null;
}

export interface Wallet {
  user_id: string;
  balance: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: Date;
}

export interface GameSession {
  id: string;
  user_id: string;
  game_type: string;
  state: Record<string, unknown>;
  result: string | null;
  created_at: Date;
  updated_at: Date;
}

export const UserModel = {
  async findByUsername(username: string): Promise<User | null> {
    const res = await query<User>(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<User | null> {
    const res = await query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return res.rows[0] || null;
  },

  async create(username: string, passwordHash: string): Promise<User> {
    const res = await query<User>(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING *',
      [username, passwordHash]
    );
    return res.rows[0];
  },

  async updateLastDailyReward(userId: string): Promise<void> {
    await query(
      'UPDATE users SET last_daily_reward = NOW() WHERE id = $1',
      [userId]
    );
  },
};

export const WalletModel = {
  async getByUserId(userId: string): Promise<Wallet | null> {
    const res = await query<Wallet>(
      'SELECT * FROM wallets WHERE user_id = $1',
      [userId]
    );
    return res.rows[0] || null;
  },

  async create(userId: string, initialBalance: number): Promise<Wallet> {
    const res = await query<Wallet>(
      'INSERT INTO wallets (user_id, balance) VALUES ($1, $2) RETURNING *',
      [userId, initialBalance]
    );
    return res.rows[0];
  },

  async updateBalance(userId: string, delta: number): Promise<Wallet> {
    const res = await query<Wallet>(
      'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2 RETURNING *',
      [delta, userId]
    );
    if (!res.rows[0]) throw new Error('Wallet not found');
    return res.rows[0];
  },

  async setBalance(userId: string, balance: number): Promise<Wallet> {
    const res = await query<Wallet>(
      'UPDATE wallets SET balance = $1 WHERE user_id = $2 RETURNING *',
      [balance, userId]
    );
    if (!res.rows[0]) throw new Error('Wallet not found');
    return res.rows[0];
  },
};

export const TransactionModel = {
  async create(
    userId: string,
    amount: number,
    type: string,
    description: string
  ): Promise<Transaction> {
    const res = await query<Transaction>(
      'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, amount, type, description]
    );
    return res.rows[0];
  },

  async getByUserId(userId: string, limit = 50): Promise<Transaction[]> {
    const res = await query<Transaction>(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT $2',
      [userId, limit]
    );
    return res.rows;
  },
};

export const GameSessionModel = {
  async create(
    userId: string,
    gameType: string,
    state: Record<string, unknown>
  ): Promise<GameSession> {
    const res = await query<GameSession>(
      'INSERT INTO game_sessions (user_id, game_type, state) VALUES ($1, $2, $3) RETURNING *',
      [userId, gameType, JSON.stringify(state)]
    );
    return res.rows[0];
  },

  async getActiveSession(userId: string, gameType: string): Promise<GameSession | null> {
    const res = await query<GameSession>(
      `SELECT * FROM game_sessions 
       WHERE user_id = $1 AND game_type = $2 AND result IS NULL 
       ORDER BY created_at DESC LIMIT 1`,
      [userId, gameType]
    );
    return res.rows[0] || null;
  },

  async update(
    id: string,
    state: Record<string, unknown>,
    result?: string
  ): Promise<GameSession> {
    const res = await query<GameSession>(
      'UPDATE game_sessions SET state = $1, result = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [JSON.stringify(state), result || null, id]
    );
    return res.rows[0];
  },
};

export const LeaderboardModel = {
  async getTop(limit = 10): Promise<{ username: string; balance: number; rank: number }[]> {
    const res = await query<{ username: string; balance: number; rank: number }>(
      `SELECT u.username, w.balance, 
              RANK() OVER (ORDER BY w.balance DESC) as rank
       FROM wallets w
       JOIN users u ON u.id = w.user_id
       ORDER BY w.balance DESC
       LIMIT $1`,
      [limit]
    );
    return res.rows;
  },
};
