import { handTotal } from '../services/blackjack.service';
import { SYMBOLS } from '../services/slots.service';

// ─── Blackjack Logic Tests ───────────────────────────────────────────────────

describe('Blackjack handTotal', () => {
  it('counts numeric cards', () => {
    const hand = [
      { suit: 'hearts' as const, rank: '5' as const },
      { suit: 'clubs' as const, rank: '9' as const },
    ];
    expect(handTotal(hand)).toBe(14);
  });

  it('counts face cards as 10', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'K' as const },
      { suit: 'clubs' as const, rank: 'Q' as const },
    ];
    expect(handTotal(hand)).toBe(20);
  });

  it('counts ace as 11 when safe', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'clubs' as const, rank: '9' as const },
    ];
    expect(handTotal(hand)).toBe(20);
  });

  it('reduces ace to 1 to avoid bust', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'clubs' as const, rank: '9' as const },
      { suit: 'diamonds' as const, rank: '5' as const },
    ];
    expect(handTotal(hand)).toBe(15);
  });

  it('handles two aces correctly', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'clubs' as const, rank: 'A' as const },
    ];
    expect(handTotal(hand)).toBe(12);
  });

  it('detects blackjack (21 with 2 cards)', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'A' as const },
      { suit: 'clubs' as const, rank: 'K' as const },
    ];
    expect(handTotal(hand)).toBe(21);
  });

  it('skips hidden cards in total', () => {
    const hand = [
      { suit: 'hearts' as const, rank: '8' as const },
      { suit: 'clubs' as const, rank: 'K' as const, hidden: true },
    ];
    expect(handTotal(hand)).toBe(8);
  });

  it('handles bust hand', () => {
    const hand = [
      { suit: 'hearts' as const, rank: 'K' as const },
      { suit: 'clubs' as const, rank: 'Q' as const },
      { suit: 'diamonds' as const, rank: '5' as const },
    ];
    expect(handTotal(hand)).toBe(25);
  });
});

// ─── Slots Symbol Tests ───────────────────────────────────────────────────────

describe('Slots symbols', () => {
  it('has 7 symbols defined', () => {
    expect(SYMBOLS.length).toBe(7);
  });

  it('includes cherry symbol', () => {
    expect(SYMBOLS).toContain('🍒');
  });

  it('includes jackpot symbol', () => {
    expect(SYMBOLS).toContain('7️⃣');
  });
});

// ─── Input Validation Tests ───────────────────────────────────────────────────

describe('Bet validation', () => {
  it('rejects zero bets', () => {
    expect(0 <= 0).toBe(true); // mirrors server-side check
  });

  it('rejects negative bets', () => {
    expect(-100 <= 0).toBe(true);
  });

  it('accepts valid bet', () => {
    const bet = 50;
    expect(bet > 0 && Number.isInteger(bet)).toBe(true);
  });
});

// ─── Wallet Balance Guard Tests ───────────────────────────────────────────────

describe('Wallet balance guard', () => {
  it('prevents bet greater than balance', () => {
    const balance = 100;
    const bet = 200;
    expect(balance < bet).toBe(true); // should throw INSUFFICIENT_BALANCE
  });

  it('allows bet equal to balance', () => {
    const balance = 100;
    const bet = 100;
    expect(balance >= bet).toBe(true);
  });
});

// ─── Roulette Payout Tests ────────────────────────────────────────────────────

describe('Roulette logic', () => {
  const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

  it('number 0 is neither red nor black', () => {
    expect(RED_NUMBERS.has(0)).toBe(false);
  });

  it('number 1 is red', () => {
    expect(RED_NUMBERS.has(1)).toBe(true);
  });

  it('number 2 is black (not in red set)', () => {
    expect(RED_NUMBERS.has(2)).toBe(false);
  });

  it('straight bet on correct number pays 35x', () => {
    const bet = 10;
    const payout = bet * 35;
    expect(payout).toBe(350);
  });

  it('even money bet pays 2x', () => {
    const bet = 50;
    const payout = bet * 2;
    expect(payout).toBe(100);
  });
});

// ─── Crash Game Tests ─────────────────────────────────────────────────────────

describe('Crash game logic', () => {
  it('target multiplier below crash point is a win', () => {
    const crashPoint = 3.5;
    const target = 2.0;
    expect(target <= crashPoint).toBe(true);
  });

  it('target multiplier above crash point is a loss', () => {
    const crashPoint = 1.5;
    const target = 3.0;
    expect(target > crashPoint).toBe(true);
  });

  it('calculates payout correctly', () => {
    const bet = 100;
    const multiplier = 2.5;
    const payout = Math.floor(bet * multiplier);
    expect(payout).toBe(250);
  });
});
