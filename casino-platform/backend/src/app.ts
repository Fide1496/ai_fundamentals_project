import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import walletRoutes from './routes/wallet.routes';
import gameRoutes from './routes/game.routes';
import leaderboardRoutes from './routes/leaderboard.routes';

dotenv.config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/wallet', walletRoutes);
app.use('/game', gameRoutes);
app.use('/leaderboard', leaderboardRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

export default app;
