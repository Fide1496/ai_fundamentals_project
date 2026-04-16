-- Casino Platform Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username      VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  last_daily_reward TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Wallets table (one per user)
CREATE TABLE IF NOT EXISTS wallets (
  user_id   UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance   BIGINT NOT NULL DEFAULT 0 CHECK (balance >= 0)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount      BIGINT NOT NULL,
  type        VARCHAR(20) NOT NULL CHECK (type IN ('bet','win','loss','push','refund','daily_reward')),
  description TEXT NOT NULL DEFAULT '',
  timestamp   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_timestamp ON transactions(timestamp DESC);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_type  VARCHAR(20) NOT NULL CHECK (game_type IN ('slots','blackjack','crash','roulette','crate')),
  state      JSONB NOT NULL DEFAULT '{}',
  result     VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_active ON game_sessions(user_id, game_type) WHERE result IS NULL;
