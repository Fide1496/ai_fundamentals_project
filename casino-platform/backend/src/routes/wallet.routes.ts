import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { WalletController } from '../controllers/wallet.controller';

const router = Router();

router.use(authenticate);

router.get('/', WalletController.getWallet);
router.get('/transactions', WalletController.getTransactions);

export default router;
