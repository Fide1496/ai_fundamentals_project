import { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { AuthRequest } from '../middleware/auth';

export const registerValidation = [
  body('username')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username may only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

export const loginValidation = [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required'),
];

export const AuthController = {
  async register(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    try {
      const { username, password } = req.body as { username: string; password: string };
      const result = await AuthService.register(username, password);
      res.status(201).json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'USERNAME_TAKEN') {
        res.status(409).json({ error: 'Username already taken' });
      } else {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }

    try {
      const { username, password } = req.body as { username: string; password: string };
      const result = await AuthService.login(username, password);
      res.json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message === 'INVALID_CREDENTIALS') {
        res.status(401).json({ error: 'Invalid username or password' });
      } else {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },

  async claimDailyReward(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.claimDailyReward(req.userId!);
      res.json(result);
    } catch (err) {
      const message = (err as Error).message;
      if (message.startsWith('DAILY_REWARD_NOT_READY:')) {
        const hours = message.split(':')[1];
        res.status(429).json({ error: `Daily reward available in ${hours} hours` });
      } else if (message === 'USER_NOT_FOUND') {
        res.status(404).json({ error: 'User not found' });
      } else {
        console.error('Daily reward error:', err);
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  },
};
