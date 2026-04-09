import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, WalletModel } from '../models';

const INITIAL_BALANCE = parseInt(process.env.INITIAL_BALANCE || '1000', 10);
const DAILY_REWARD = parseInt(process.env.DAILY_REWARD_AMOUNT || '100', 10);

export const AuthService = {
  async register(username: string, password: string) {
    const existing = await UserModel.findByUsername(username);
    if (existing) {
      throw new Error('USERNAME_TAKEN');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await UserModel.create(username, passwordHash);
    await WalletModel.create(user.id, INITIAL_BALANCE);

    const token = generateToken(user.id, user.username);
    return { token, userId: user.id, username: user.username, balance: INITIAL_BALANCE };
  },

  async login(username: string, password: string) {
    const user = await UserModel.findByUsername(username);
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    const wallet = await WalletModel.getByUserId(user.id);
    const token = generateToken(user.id, user.username);
    return {
      token,
      userId: user.id,
      username: user.username,
      balance: wallet?.balance ?? 0,
    };
  },

  async claimDailyReward(userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) throw new Error('USER_NOT_FOUND');

    if (user.last_daily_reward) {
      const lastClaim = new Date(user.last_daily_reward);
      const now = new Date();
      const hoursSince = (now.getTime() - lastClaim.getTime()) / (1000 * 60 * 60);
      if (hoursSince < 24) {
        const hoursLeft = Math.ceil(24 - hoursSince);
        throw new Error(`DAILY_REWARD_NOT_READY:${hoursLeft}`);
      }
    }

    await UserModel.updateLastDailyReward(userId);
    const wallet = await WalletModel.updateBalance(userId, DAILY_REWARD);
    return { amount: DAILY_REWARD, newBalance: wallet.balance };
  },
};

function generateToken(userId: string, username: string): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return jwt.sign({ userId, username }, secret, { expiresIn: '7d' });
}
