import { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth';
import { SlotsService } from '../services/slots.service';
import { BlackjackService } from '../services/blackjack.service';
import { CrashService } from '../services/crash.service';
import { RouletteService } from '../services/roulette.service';

const GAME_ERRORS: Record<string, { status: number; message: string }> = {
  INVALID_BET: { status: 400, message: 'Invalid bet amount' },
  BET_TOO_HIGH: { status: 400, message: 'Bet exceeds maximum allowed' },
  INSUFFICIENT_BALANCE: { status: 402, message: 'Insufficient balance' },
  WALLET_NOT_FOUND: { status: 404, message: 'Wallet not found' },
  SESSION_NOT_FOUND: { status: 404, message: 'Game session not found' },
  GAME_ALREADY_FINISHED: { status: 400, message: 'Game is already finished' },
  INVALID_TARGET_MULTIPLIER: { status: 400, message: 'Target multiplier must be between 1.01 and 1000' },
  INVALID_BET_AMOUNT: { status: 400, message: 'Invalid bet amount' },
  INVALID_STRAIGHT_BET: { status: 400, message: 'Straight bet number must be 0-36' },
  INVALID_DOZEN_BET: { status: 400, message: 'Dozen must be first, second, or third' },
  INVALID_COLUMN_BET: { status: 400, message: 'Column must be first, second, or third' },
  NO_BETS: { status: 400, message: 'At least one bet required' },
  TOO_MANY_BETS: { status: 400, message: 'Maximum 10 bets per spin' },
  TOTAL_BET_TOO_HIGH: { status: 400, message: 'Total bet exceeds maximum allowed' },
};

function handleGameError(err: unknown, res: Response): void {
  const message = (err as Error).message;
  const known = GAME_ERRORS[message];
  if (known) {
    res.status(known.status).json({ error: known.message });
  } else {
    console.error('Game error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const slotsValidation = [
  body('bet').isInt({ min: 1, max: 10000 }).withMessage('Bet must be 1-10000'),
];

export const blackjackStartValidation = [
  body('bet').isInt({ min: 1, max: 10000 }).withMessage('Bet must be 1-10000'),
];

export const blackjackActionValidation = [
  body('sessionId').isUUID().withMessage('Invalid session ID'),
  body('action').isIn(['hit', 'stand']).withMessage('Action must be hit or stand'),
];

export const crashValidation = [
  body('bet').isInt({ min: 1, max: 10000 }).withMessage('Bet must be 1-10000'),
  body('targetMultiplier').isFloat({ min: 1.01, max: 1000 }).withMessage('Target multiplier must be 1.01-1000'),
];

export const GameController = {
  async slotsPlay(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const { bet } = req.body as { bet: number };
      const result = await SlotsService.play(req.userId!, bet);
      res.json(result);
    } catch (err) {
      handleGameError(err, res);
    }
  },

  async blackjackStart(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const { bet } = req.body as { bet: number };
      const result = await BlackjackService.startGame(req.userId!, bet);
      res.json(result);
    } catch (err) {
      handleGameError(err, res);
    }
  },

  async blackjackAction(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const { sessionId, action } = req.body as { sessionId: string; action: 'hit' | 'stand' };
      const result = await BlackjackService.action(req.userId!, sessionId, action);
      res.json(result);
    } catch (err) {
      handleGameError(err, res);
    }
  },

  async crashPlay(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const { bet, targetMultiplier } = req.body as { bet: number; targetMultiplier: number };
      const result = await CrashService.startRound(req.userId!, bet, targetMultiplier);
      res.json(result);
    } catch (err) {
      handleGameError(err, res);
    }
  },

  async roulettePlay(req: AuthRequest, res: Response): Promise<void> {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ error: errors.array()[0].msg });
      return;
    }
    try {
      const { bets } = req.body as { bets: { type: string; value: number | string; amount: number }[] };
      const result = await RouletteService.play(req.userId!, bets as Parameters<typeof RouletteService.play>[1]);
      res.json(result);
    } catch (err) {
      handleGameError(err, res);
    }
  },
};
