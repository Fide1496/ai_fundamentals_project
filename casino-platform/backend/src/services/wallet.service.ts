import { WalletModel, TransactionModel } from '../models';

export const WalletService = {
  async getWallet(userId: string) {
    const wallet = await WalletModel.getByUserId(userId);
    if (!wallet) throw new Error('WALLET_NOT_FOUND');
    return wallet;
  },

  async getTransactions(userId: string) {
    return TransactionModel.getByUserId(userId, 100);
  },

  async debit(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new Error('INVALID_AMOUNT');
    const wallet = await WalletModel.getByUserId(userId);
    if (!wallet) throw new Error('WALLET_NOT_FOUND');
    if (wallet.balance < amount) throw new Error('INSUFFICIENT_BALANCE');

    const updated = await WalletModel.updateBalance(userId, -amount);
    await TransactionModel.create(userId, -amount, 'bet', description);
    return updated;
  },

  async credit(userId: string, amount: number, description: string) {
    if (amount <= 0) throw new Error('INVALID_AMOUNT');
    const updated = await WalletModel.updateBalance(userId, amount);
    await TransactionModel.create(userId, amount, 'win', description);
    return updated;
  },
};
