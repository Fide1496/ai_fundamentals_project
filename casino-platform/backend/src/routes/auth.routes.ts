import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController, registerValidation, loginValidation } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later' },
});

const dailyRewardLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: 'Too many requests' },
});

router.post('/register', authLimiter, registerValidation, AuthController.register);
router.post('/login', authLimiter, loginValidation, AuthController.login);
router.post('/daily-reward', dailyRewardLimiter, authenticate, AuthController.claimDailyReward);

export default router;
