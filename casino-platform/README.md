# 🎰 VegasVault — Virtual Casino Platform

A full-stack social gambling platform using **virtual currency only** (no real money).

## Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL 16
- **Auth**: JWT (stateless, 7-day tokens)

## Architecture

```
casino/
├── schema.sql              # Full database schema
├── docker-compose.yml      # One-command setup
├── backend/
│   └── src/
│       ├── config/         # DB pool
│       ├── models/         # DB queries (User, Wallet, Transaction, GameSession)
│       ├── services/       # Business logic (auth, wallet, slots, blackjack, crash, roulette)
│       ├── controllers/    # HTTP handlers + validation
│       ├── routes/         # Express routers
│       ├── middleware/     # JWT auth
│       └── tests/          # Jest unit tests
└── frontend/
    └── src/
        ├── context/        # AuthContext (global user + balance state)
        ├── pages/          # AuthPage, Dashboard, Slots, Blackjack, Crash, Roulette, Leaderboard
        ├── components/     # Layout, reusable UI
        ├── utils/          # api.ts (typed fetch wrapper)
        └── types/          # Shared TypeScript interfaces
```

---

## Quick Start (Docker — Recommended)

```bash
git clone <repo>
cd casino
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Database auto-initialized from schema.sql

---

## Manual Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### 1. Database

```bash
createdb casino_db
createuser casino_user
psql -c "ALTER USER casino_user WITH PASSWORD 'casino_pass';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE casino_db TO casino_user;"
psql casino_db -f schema.sql
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables (backend/.env)

| Variable              | Default                        | Description                  |
|-----------------------|--------------------------------|------------------------------|
| `DATABASE_URL`        | postgresql://...               | PostgreSQL connection string |
| `JWT_SECRET`          | (required)                     | Min 32 chars, random string  |
| `PORT`                | 4000                           | Backend port                 |
| `INITIAL_BALANCE`     | 1000                           | Starting coins for new users |
| `DAILY_REWARD_AMOUNT` | 100                            | Daily bonus coins            |
| `FRONTEND_URL`        | http://localhost:3000          | CORS origin                  |

---

## Running Tests

```bash
cd backend
npm test
```

Tests cover: blackjack hand logic, slots symbols, bet validation, wallet guards, roulette payouts, crash logic.

---

## API Reference

### Auth

#### POST /auth/register
```json
// Request
{ "username": "player1", "password": "secret123" }

// Response 201
{ "token": "eyJ...", "userId": "uuid", "username": "player1", "balance": 1000 }

// Errors
// 400 – validation failed
// 409 – username already taken
```

#### POST /auth/login
```json
// Request
{ "username": "player1", "password": "secret123" }

// Response 200
{ "token": "eyJ...", "userId": "uuid", "username": "player1", "balance": 1250 }

// Errors
// 401 – invalid credentials
```

#### POST /auth/daily-reward
```
Authorization: Bearer <token>

// Response 200
{ "amount": 100, "newBalance": 1350 }

// Errors
// 429 – "Daily reward available in X hours"
```

### Wallet

#### GET /wallet
```
Authorization: Bearer <token>

// Response 200
{ "balance": 1250 }
```

#### GET /wallet/transactions
```
Authorization: Bearer <token>

// Response 200
{
  "transactions": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "amount": -50,
      "type": "loss",
      "description": "Slots: 🍋🍊🍇 → Lost",
      "timestamp": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Games

#### POST /game/slots/play
```json
// Request (Authorization: Bearer <token>)
{ "bet": 50 }

// Response 200
{
  "reels": ["🍒", "🍒", "🍒"],
  "bet": 50,
  "payout": 100,
  "net": 50,
  "balance": 1300,
  "win": true
}

// Errors
// 400 – invalid bet
// 402 – insufficient balance
```

#### POST /game/blackjack/start
```json
// Request
{ "bet": 100 }

// Response 200
{
  "sessionId": "uuid",
  "playerHand": [{"suit":"hearts","rank":"A"},{"suit":"clubs","rank":"7"}],
  "dealerHand": [{"suit":"diamonds","rank":"K"},{"suit":"hidden","rank":"?","hidden":true}],
  "playerTotal": 18,
  "dealerTotal": 10,
  "status": "playing",
  "result": null,
  "balance": 900,
  "bet": 100
}
```

#### POST /game/blackjack/action
```json
// Request
{ "sessionId": "uuid", "action": "hit" }
// or
{ "sessionId": "uuid", "action": "stand" }

// Response 200 — same shape as /blackjack/start
// status: "playing" | "dealer_turn" | "finished"
// result: "win" | "loss" | "push" | "blackjack" | null
```

#### POST /game/crash/play
```json
// Request
{ "bet": 100, "targetMultiplier": 2.5 }

// Response 200
{
  "sessionId": "uuid",
  "bet": 100,
  "targetMultiplier": 2.5,
  "crashPoint": 3.14,
  "status": "cashed_out",
  "cashedOutAt": 2.5,
  "payout": 250,
  "net": 150,
  "balance": 1400,
  "win": true
}
```

#### POST /game/roulette/play
```json
// Request
{
  "bets": [
    { "type": "red",      "value": "red",  "amount": 50 },
    { "type": "straight", "value": 17,     "amount": 10 },
    { "type": "dozen",    "value": "second","amount": 25 }
  ]
}

// Response 200
{
  "result": 17,
  "color": "black",
  "bets": [
    { "type": "red",      "value": "red",   "amount": 50, "payout": 0,   "win": false },
    { "type": "straight", "value": 17,      "amount": 10, "payout": 350, "win": true  },
    { "type": "dozen",    "value": "second","amount": 25, "payout": 75,  "win": true  }
  ],
  "totalBet": 85,
  "totalPayout": 425,
  "net": 340,
  "balance": 1740,
  "win": true
}
```

### Leaderboard

#### GET /leaderboard
```
Authorization: Bearer <token>

// Response 200
{
  "leaderboard": [
    { "username": "highroller", "balance": 50000, "rank": 1 },
    { "username": "player1",    "balance": 1250,  "rank": 2 }
  ]
}
```

---

## Security Design

| Threat                         | Mitigation                                          |
|--------------------------------|-----------------------------------------------------|
| Client-side balance spoofing   | All balances live in DB; server validates every bet |
| Negative/zero bets             | Server-side validation rejects ≤0 bets              |
| Insufficient balance exploit   | `SELECT ... FOR UPDATE` row lock prevents races     |
| Auth bypass                    | JWT middleware on all game/wallet routes             |
| Brute-force login              | express-rate-limit: 10 req/15min on auth routes     |
| Game result manipulation       | All RNG and payout calculated server-side           |
| Password exposure              | bcrypt with cost factor 12                          |

---

## Example curl Commands

```bash
# Register
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer","password":"mypassword"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testplayer","password":"mypassword"}' | jq -r .token)

# Check balance
curl http://localhost:4000/wallet \
  -H "Authorization: Bearer $TOKEN"

# Play slots
curl -X POST http://localhost:4000/game/slots/play \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bet": 50}'

# Start blackjack
curl -X POST http://localhost:4000/game/blackjack/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bet": 100}'

# Blackjack action (replace SESSION_ID)
curl -X POST http://localhost:4000/game/blackjack/action \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"SESSION_ID","action":"stand"}'

# Crash game
curl -X POST http://localhost:4000/game/crash/play \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bet":100,"targetMultiplier":2.0}'

# Roulette
curl -X POST http://localhost:4000/game/roulette/play \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"bets":[{"type":"red","value":"red","amount":50}]}'

# Leaderboard
curl http://localhost:4000/leaderboard \
  -H "Authorization: Bearer $TOKEN"

# Daily reward
curl -X POST http://localhost:4000/auth/daily-reward \
  -H "Authorization: Bearer $TOKEN"
```

---

## Game Odds

### Slots
| Symbol | 3× Payout | Weight |
|--------|-----------|--------|
| 🍒     | 2×        | 35     |
| 🍋     | 3×        | 25     |
| 🍊     | 4×        | 20     |
| 🍇     | 6×        | 12     |
| ⭐     | 15×       | 5      |
| 💎     | 50×       | 2      |
| 7️⃣    | 100×      | 1      |
| 🍒🍒  | 1.5×      | —      |

### Blackjack
- Standard rules, dealer stands on 17
- Blackjack pays 3:2
- Win pays 2:1, push returns bet

### Crash
- ~4% chance of instant crash at 1.00×
- Otherwise exponential distribution
- Payout = bet × targetMultiplier

### Roulette (European)
- Single zero (0)
- Straight up: 35:1
- Even money (red/black, odd/even, 1-18/19-36): 2:1
- Dozens / Columns: 3:1
