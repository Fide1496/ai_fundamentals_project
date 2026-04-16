import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import gameRoutes from './routes/game.routes';
import leaderboardRoutes from './routes/leaderboard.routes';
import adminRoutes from './routes/admin.routes';
import crateRoutes from './routes/crate.routes';

dotenv.config();

const app = express();

const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:80',
  'http://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
}));

app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/game', gameRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/admin', adminRoutes);
app.use('/crate', crateRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
