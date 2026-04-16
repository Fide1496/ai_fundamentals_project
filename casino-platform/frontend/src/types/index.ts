export interface User {
  userId: string;
  username: string;
  token: string;
  balance: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: string;
  description: string;
  timestamp: string;
}

export interface LeaderboardEntry {
  username: string;
  balance: number;
  rank: number;
}

export interface Card {
  suit: string;
  rank: string;
  hidden?: boolean;
}

export interface BlackjackState {
  sessionId: string;
  playerHand: Card[];
  dealerHand: Card[];
  playerTotal: number;
  dealerTotal: number;
  status: 'playing' | 'dealer_turn' | 'finished';
  result?: 'win' | 'loss' | 'push' | 'blackjack' | null;
  payout?: number;
  balance: number;
  bet: number;
}

export interface SlotsResult {
  reels: string[];
  bet: number;
  payout: number;
  net: number;
  balance: number;
  win: boolean;
}

export interface CrashResult {
  sessionId: string;
  bet: number;
  targetMultiplier: number;
  crashPoint: number;
  status: 'cashed_out' | 'crashed';
  cashedOutAt?: number;
  payout: number;
  net: number;
  balance: number;
  win: boolean;
}

export interface RouletteBet {
  type: 'straight' | 'red' | 'black' | 'odd' | 'even' | 'low' | 'high' | 'dozen' | 'column';
  value: number | string;
  amount: number;
}

export interface RouletteResult {
  result: number;
  color: 'red' | 'black' | 'green';
  bets: (RouletteBet & { payout: number; win: boolean })[];
  totalBet: number;
  totalPayout: number;
  net: number;
  balance: number;
  win: boolean;
}

export type Rarity = 'consumer' | 'industrial' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare_special';

export interface CrateItem {
  id: string;
  name: string;
  skin: string;
  rarity: Rarity;
  color: string;
  emoji: string;
  wear?: string;
  value?: number;
}

export interface CrateDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  items: CrateItem[];
}

export interface CrateOpenResult {
  item: CrateItem;
  rarity: Rarity;
  wear: { name: string; abbr: string };
  cost: number;
  payout: number;
  net: number;
  balance: number;
  win: boolean;
}

export interface CrateOpenBatchResult {
  results: CrateOpenResult[];
  totalCost: number;
  totalPayout: number;
  net: number;
  balance: number;
}
