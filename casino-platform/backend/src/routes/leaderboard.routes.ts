import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();
router.get('/', authenticate, WalletController.getLeaderboard);

export default router;
