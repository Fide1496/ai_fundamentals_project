import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { WalletService } from '../services/wallet.service';
import { LeaderboardModel } from '../models';

export const WalletController = {
  async getWallet(req: AuthRequest, res: Response): Promise<void> {
    try {
      const wallet = await WalletService.getWallet(req.userId!);
      res.json({ balance: wallet.balance });
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'WALLET_NOT_FOUND') {
        res.status(404).json({ error: 'Wallet not found' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async getTransactions(req: AuthRequest, res: Response): Promise<void> {
    try {
      const transactions = await WalletService.getTransactions(req.userId!);
      res.json({ transactions });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async getLeaderboard(_req: AuthRequest, res: Response): Promise<void> {
    try {
      const entries = await LeaderboardModel.getTop(20);
      res.json({ leaderboard: entries });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};
