import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticate } from '../middleware/auth';
import {
  GameController,
  slotsValidation,
  blackjackStartValidation,
  blackjackActionValidation,
  crashValidation,
} from '../controllers/game.controller';

const router = Router();
router.use(authenticate);

const gameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many game requests' },
});

router.post('/slots/play', gameLimiter, slotsValidation, GameController.slotsPlay);
router.post('/blackjack/start', gameLimiter, blackjackStartValidation, GameController.blackjackStart);
router.post('/blackjack/action', gameLimiter, blackjackActionValidation, GameController.blackjackAction);
router.post('/crash/play', gameLimiter, crashValidation, GameController.crashPlay);
router.post('/roulette/play', gameLimiter, GameController.roulettePlay);

export default router;
