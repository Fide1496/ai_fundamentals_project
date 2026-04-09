import { GameSessionModel, WalletModel, TransactionModel } from '../models';
import { pool } from '../config/database';

type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  hidden?: boolean;
}

interface BlackjackState {
  deck: Card[];
  playerHand: Card[];
  dealerHand: Card[];
  bet: number;
  status: 'playing' | 'dealer_turn' | 'finished';
  result?: 'win' | 'loss' | 'push' | 'blackjack';
  payout?: number;
}

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return shuffle(deck);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function cardValue(rank: Rank): number {
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
}

export function handTotal(hand: Card[]): number {
  let total = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.hidden) continue;
    total += cardValue(card.rank);
    if (card.rank === 'A') aces++;
  }

  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  return total;
}

function isBust(hand: Card[]): boolean {
  return handTotal(hand) > 21;
}

function isBlackjack(hand: Card[]): boolean {
  return hand.length === 2 && handTotal(hand) === 21;
}

export const BlackjackService = {
  async startGame(userId: string, bet: number) {
    if (bet <= 0 || !Number.isInteger(bet)) throw new Error('INVALID_BET');
    if (bet > 10000) throw new Error('BET_TOO_HIGH');

    // Cancel any existing active session
    const existing = await GameSessionModel.getActiveSession(userId, 'blackjack');
    if (existing) {
      // Forfeit existing game - refund half bet as house rule
      const state = existing.state as unknown as BlackjackState;
      const refund = Math.floor(state.bet / 2);
      if (refund > 0) {
        await WalletModel.updateBalance(userId, refund);
        await TransactionModel.create(userId, refund, 'refund', 'Blackjack: abandoned game partial refund');
      }
      await GameSessionModel.update(existing.id, existing.state as Record<string, unknown>, 'abandoned');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const wallet = walletRes.rows[0];
      if (!wallet) throw new Error('WALLET_NOT_FOUND');
      if (wallet.balance < bet) throw new Error('INSUFFICIENT_BALANCE');

      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [bet, userId]
      );

      const deck = createDeck();
      const playerHand: Card[] = [deck.pop()!, deck.pop()!];
      const dealerHand: Card[] = [deck.pop()!, { ...deck.pop()!, hidden: true }];

      const state: BlackjackState = {
        deck,
        playerHand,
        dealerHand,
        bet,
        status: 'playing',
      };

      // Check for player blackjack immediately
      if (isBlackjack(playerHand)) {
        const dealerVisible = { ...state.dealerHand[1], hidden: false };
        state.dealerHand[1] = dealerVisible;
        const dealerTotal = handTotal(state.dealerHand);

        if (isBlackjack(state.dealerHand)) {
          // Push
          state.status = 'finished';
          state.result = 'push';
          state.payout = bet;
          await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
            [bet, userId]
          );
        } else {
          // Blackjack pays 3:2
          const payout = Math.floor(bet * 2.5);
          state.status = 'finished';
          state.result = 'blackjack';
          state.payout = payout;
          await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
            [payout, userId]
          );
        }

        await client.query(
          'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
          [userId, state.payout! - bet, state.result === 'push' ? 'push' : 'win', `Blackjack: ${state.result}`]
        );
      }

      const sessionRes = await client.query(
        'INSERT INTO game_sessions (user_id, game_type, state) VALUES ($1, $2, $3) RETURNING *',
        [userId, 'blackjack', JSON.stringify(state)]
      );

      const finalWalletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        sessionId: sessionRes.rows[0].id,
        playerHand: state.playerHand,
        dealerHand: state.dealerHand.map(c => c.hidden ? { suit: 'hidden', rank: '?' as Rank, hidden: true } : c),
        playerTotal: handTotal(state.playerHand),
        dealerTotal: handTotal([state.dealerHand[0]]),
        status: state.status,
        result: state.result,
        payout: state.payout,
        balance: finalWalletRes.rows[0].balance,
        bet,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  async action(userId: string, sessionId: string, action: 'hit' | 'stand') {
    const session = await GameSessionModel.getActiveSession(userId, 'blackjack');
    if (!session || session.id !== sessionId) {
      throw new Error('SESSION_NOT_FOUND');
    }

    const state = session.state as unknown as BlackjackState;
    if (state.status !== 'playing') {
      throw new Error('GAME_ALREADY_FINISHED');
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE', [userId]);

      if (action === 'hit') {
        const card = state.deck.pop()!;
        state.playerHand.push(card);

        if (isBust(state.playerHand)) {
          state.status = 'finished';
          state.result = 'loss';
          state.payout = 0;
          // Reveal dealer card
          state.dealerHand[1] = { ...state.dealerHand[1], hidden: false };

          await client.query(
            'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
            [userId, -state.bet, 'loss', `Blackjack: player bust (${handTotal(state.playerHand)})`]
          );
        }
      } else if (action === 'stand') {
        // Reveal dealer hole card
        state.dealerHand[1] = { ...state.dealerHand[1], hidden: false };
        state.status = 'dealer_turn';

        // Dealer draws to 17
        while (handTotal(state.dealerHand) < 17) {
          state.dealerHand.push(state.deck.pop()!);
        }

        const playerTotal = handTotal(state.playerHand);
        const dealerTotal = handTotal(state.dealerHand);
        const dealerBust = isBust(state.dealerHand);

        let payout = 0;
        let result: BlackjackState['result'];

        if (dealerBust || playerTotal > dealerTotal) {
          result = 'win';
          payout = state.bet * 2;
        } else if (playerTotal === dealerTotal) {
          result = 'push';
          payout = state.bet;
        } else {
          result = 'loss';
          payout = 0;
        }

        state.status = 'finished';
        state.result = result;
        state.payout = payout;

        if (payout > 0) {
          await client.query(
            'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
            [payout, userId]
          );
        }

        const net = payout - state.bet;
        await client.query(
          'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
          [userId, net, result === 'loss' ? 'loss' : result === 'push' ? 'push' : 'win',
           `Blackjack: ${result} (player ${playerTotal} vs dealer ${dealerTotal})`]
        );
      }

      // Update session
      await client.query(
        'UPDATE game_sessions SET state = $1, result = $2, updated_at = NOW() WHERE id = $3',
        [JSON.stringify(state), state.result || null, session.id]
      );

      const finalWalletRes = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        sessionId: session.id,
        playerHand: state.playerHand,
        dealerHand: state.dealerHand.map(c =>
          c.hidden ? { suit: 'hidden', rank: '?', hidden: true } : c
        ),
        playerTotal: handTotal(state.playerHand),
        dealerTotal: handTotal(state.dealerHand.filter(c => !c.hidden)),
        status: state.status,
        result: state.result,
        payout: state.payout,
        balance: finalWalletRes.rows[0].balance,
        bet: state.bet,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
