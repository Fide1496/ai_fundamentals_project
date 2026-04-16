import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { WalletModel, TransactionModel } from '../models';
import { Response } from 'express';

const router = Router();

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many admin attempts' },
});

router.post(
  '/add-balance',
  adminLimiter,
  authenticate,
  [
    body('adminPassword').notEmpty().withMessage('Admin password required'),
    body('amount').isInt({ min: 1, max: 10000000 }).withMessage('Amount must be 1–10,000,000'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    const { adminPassword, amount } = req.body as { adminPassword: string; amount: number };
    const correctPassword = process.env.ADMIN_PASSWORD;

    if (!correctPassword || adminPassword !== correctPassword) {
      res.status(403).json({ error: 'Invalid admin password' });
      return;
    }

    try {
      const wallet = await WalletModel.updateBalance(req.userId!, amount);
      await TransactionModel.create(req.userId!, amount, 'win', `Admin grant: +${amount} coins`);
      res.json({ newBalance: wallet.balance, added: amount });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
