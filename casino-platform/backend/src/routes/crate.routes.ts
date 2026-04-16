import { Router, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CrateService } from '../services/crate.service';

const router = Router();
router.use(authenticate);

const crateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many crate openings' },
});

router.get('/list', (_req, res: Response) => {
  const crates = CrateService.getCrates().map(c => ({
    id: c.id,
    name: c.name,
    description: c.description,
    cost: c.cost,
    emoji: c.emoji,
    items: c.items.map(i => ({
      id: i.id,
      name: i.name,
      skin: i.skin,
      rarity: i.rarity,
      color: i.color,
      emoji: i.emoji,
    })),
  }));
  res.json({ crates });
});

router.post(
  '/open',
  crateLimiter,
  [
    body('crateId').isString().notEmpty().withMessage('crateId required'),
    body('count').isInt({ min: 1, max: 10 }).withMessage('count must be 1–10'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    const { crateId, count = 1 } = req.body as { crateId: string; count: number };

    try {
      const results = await CrateService.openMany(req.userId!, crateId, count);
      res.json(results);
    } catch (err) {
      const msg = (err as Error).message;
      if (msg === 'CRATE_NOT_FOUND')       { res.status(404).json({ error: 'Crate not found' }); return; }
      if (msg === 'INSUFFICIENT_BALANCE')  { res.status(402).json({ error: 'Insufficient balance' }); return; }
      if (msg === 'WALLET_NOT_FOUND')      { res.status(404).json({ error: 'Wallet not found' }); return; }
      console.error('Crate error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
