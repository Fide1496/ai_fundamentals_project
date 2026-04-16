import { pool } from '../config/database';

export type Rarity = 'consumer' | 'industrial' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare_special';

export interface CrateItem {
  id: string;
  name: string;
  skin: string;
  rarity: Rarity;
  wear: string;
  value: number;
  color: string;
  emoji: string;
}

export interface CrateDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  emoji: string;
  items: CrateItem[];
}

const WEAR_LEVELS = [
  { name: 'Factory New',    abbr: 'FN', weight: 3  },
  { name: 'Minimal Wear',   abbr: 'MW', weight: 10 },
  { name: 'Field-Tested',   abbr: 'FT', weight: 30 },
  { name: 'Well-Worn',      abbr: 'WW', weight: 25 },
  { name: 'Battle-Scarred', abbr: 'BS', weight: 32 },
];

const RARITY_WEIGHTS: Record<Rarity, number> = {
  consumer:     798,
  industrial:   160,
  milspec:       32,
  restricted:     6,
  classified:     2,
  covert:         1,
  rare_special:   1,
};

const RARITY_BASE_VALUE: Record<Rarity, number> = {
  consumer:     0.2,
  industrial:   0.5,
  milspec:      1.5,
  restricted:   4,
  classified:   12,
  covert:       50,
  rare_special: 200,
};

const WEAR_MULTIPLIER: Record<string, number> = {
  FN: 1.5, MW: 1.2, FT: 1.0, WW: 0.85, BS: 0.7,
};

export const CRATES: CrateDefinition[] = [
  {
    id: 'fracture', name: 'Fracture Case', description: 'Street art meets firepower', cost: 100, emoji: '📦',
    items: [
      { id: 'fc_1',  name: 'P2000',        skin: 'Urban Hazard',      rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'fc_2',  name: 'Nova',          skin: 'Toy Soldier',       rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'fc_3',  name: 'MP9',           skin: 'Mount Fuji',        rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'fc_4',  name: 'Tec-9',         skin: 'Bamboozle',         rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'fc_5',  name: 'MAG-7',         skin: 'Monster Call',      rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'fc_6',  name: 'Dual Berettas', skin: 'Balance',           rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'fc_7',  name: 'AK-47',         skin: 'Ice Coaled',        rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'fc_8',  name: 'MP5-SD',        skin: 'Condition Zero',    rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'fc_9',  name: 'Glock-18',      skin: 'Vogue',             rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'fc_10', name: 'M4A1-S',        skin: 'Printstream',       rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'fc_11', name: 'Desert Eagle',  skin: 'Printstream',       rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'fc_12', name: 'AUG',           skin: 'Momentum',          rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'fc_13', name: 'MP7',           skin: 'Abyssal Apparition',rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'fc_14', name: 'M4A4',          skin: 'Tooth Fairy',       rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'fc_15', name: '★ Karambit',   skin: 'Doppler',            rarity: 'rare_special', wear: '', value: 0, color: '#ffd700', emoji: '🔪' },
    ],
  },
  {
    id: 'dreams', name: 'Dreams & Nightmares', description: 'Enter the realm of the surreal', cost: 250, emoji: '🌙',
    items: [
      { id: 'dn_1',  name: 'Nova',          skin: 'Plumes',              rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'dn_2',  name: 'MP9',           skin: 'Starlight Protector', rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'dn_3',  name: 'XM1014',        skin: 'Zombie Offensive',    rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'dn_4',  name: 'P250',          skin: 'Visions',             rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'dn_5',  name: 'MAC-10',        skin: 'Ensnared',            rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'dn_6',  name: 'Sawed-Off',     skin: 'Spirit Board',        rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'dn_7',  name: 'MP5-SD',        skin: 'Necro Jr',            rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'dn_8',  name: 'Negev',         skin: 'Ultralight',          rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'dn_9',  name: 'Dual Berettas', skin: 'Melondrama',          rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'dn_10', name: 'AK-47',         skin: 'Nightwish',           rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'dn_11', name: 'USP-S',         skin: 'The Cypress',         rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'dn_12', name: 'MP9',           skin: 'Dreamy',              rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'dn_13', name: 'FAMAS',         skin: 'Rapid Eye Movement',  rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'dn_14', name: '★ Butterfly',  skin: 'Fade',                rarity: 'rare_special', wear: '', value: 0, color: '#ffd700', emoji: '🔪' },
    ],
  },
  {
    id: 'recoil', name: 'Recoil Case', description: 'High-impact skins for veterans', cost: 500, emoji: '💥',
    items: [
      { id: 'rc_1',  name: 'Sawed-Off',    skin: 'Analog Input',          rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'rc_2',  name: 'Tec-9',        skin: 'Groundwater',           rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'rc_3',  name: 'P250',         skin: 'Vibe',                  rarity: 'consumer',     wear: '', value: 0, color: '#b0b0b0', emoji: '🔫' },
      { id: 'rc_4',  name: 'XM1014',       skin: 'XOXO',                  rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'rc_5',  name: 'UMP-45',       skin: 'Recount',               rarity: 'industrial',   wear: '', value: 0, color: '#6db0d8', emoji: '🔫' },
      { id: 'rc_6',  name: 'Five-SeveN',   skin: 'Hybrid',                rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'rc_7',  name: 'Glock-18',     skin: 'Umbral Rabbit',         rarity: 'milspec',      wear: '', value: 0, color: '#4b69ff', emoji: '🔫' },
      { id: 'rc_8',  name: 'MP5-SD',       skin: 'Lab Rats',              rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'rc_9',  name: 'P90',          skin: 'Vent Rush',             rarity: 'restricted',   wear: '', value: 0, color: '#8847ff', emoji: '🔫' },
      { id: 'rc_10', name: 'Desert Eagle', skin: 'Fennec Fox',            rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'rc_11', name: 'M4A1-S',       skin: 'Restless',              rarity: 'classified',   wear: '', value: 0, color: '#d32ce6', emoji: '🔫' },
      { id: 'rc_12', name: 'AK-47',        skin: 'Calm',                  rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'rc_13', name: 'AWP',          skin: 'Chromatic Aberration',  rarity: 'covert',       wear: '', value: 0, color: '#eb4b4b', emoji: '🔫' },
      { id: 'rc_14', name: '★ M9 Bayonet',skin: 'Gamma Doppler',         rarity: 'rare_special', wear: '', value: 0, color: '#ffd700', emoji: '🔪' },
    ],
  },
];

function weightedRarityRoll(): Rarity {
  const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
    rand -= weight;
    if (rand <= 0) return rarity as Rarity;
  }
  return 'consumer';
}

function rollWear() {
  const total = WEAR_LEVELS.reduce((a, b) => a + b.weight, 0);
  let rand = Math.random() * total;
  for (const wear of WEAR_LEVELS) {
    rand -= wear.weight;
    if (rand <= 0) return wear;
  }
  return WEAR_LEVELS[2];
}

function pickItem(items: CrateItem[], rarity: Rarity): CrateItem {
  const pool = items.filter(i => i.rarity === rarity);
  if (pool.length === 0) return items[Math.floor(Math.random() * items.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollOnce(crate: CrateDefinition) {
  const rarity = weightedRarityRoll();
  const item   = pickItem(crate.items, rarity);
  const wear   = rollWear();
  const payout = Math.floor(crate.cost * RARITY_BASE_VALUE[rarity] * WEAR_MULTIPLIER[wear.abbr]);
  return { rarity, item, wear, payout };
}

export const CrateService = {
  getCrates(): CrateDefinition[] {
    return CRATES;
  },

  async openMany(userId: string, crateId: string, count: number) {
    const crate = CRATES.find(c => c.id === crateId);
    if (!crate) throw new Error('CRATE_NOT_FOUND');

    const totalCost = crate.cost * count;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const walletRes = await client.query(
        'SELECT * FROM wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );
      const wallet = walletRes.rows[0];
      if (!wallet) throw new Error('WALLET_NOT_FOUND');
      if (wallet.balance < totalCost) throw new Error('INSUFFICIENT_BALANCE');

      // Deduct total cost upfront
      await client.query(
        'UPDATE wallets SET balance = balance - $1 WHERE user_id = $2',
        [totalCost, userId]
      );

      // Roll each case
      const rolls = Array.from({ length: count }, () => rollOnce(crate));
      const totalPayout = rolls.reduce((s, r) => s + r.payout, 0);

      if (totalPayout > 0) {
        await client.query(
          'UPDATE wallets SET balance = balance + $1 WHERE user_id = $2',
          [totalPayout, userId]
        );
      }

      const net = totalPayout - totalCost;

      // Single transaction record for the batch
      const desc = count === 1
        ? `Case: ${crate.name} → ${rolls[0].item.name} | ${rolls[0].item.skin} (${rolls[0].wear.abbr})`
        : `Cases x${count}: ${crate.name} → net ${net >= 0 ? '+' : ''}${net}`;

      await client.query(
        'INSERT INTO transactions (user_id, amount, type, description) VALUES ($1, $2, $3, $4)',
        [userId, net, net >= 0 ? 'win' : 'loss', desc]
      );

      // One game session per roll
      for (const roll of rolls) {
        await client.query(
          'INSERT INTO game_sessions (user_id, game_type, state, result) VALUES ($1, $2, $3, $4)',
          [userId, 'crate',
           JSON.stringify({ crateId, item: roll.item, wear: roll.wear.abbr, cost: crate.cost, payout: roll.payout }),
           roll.payout >= crate.cost ? 'win' : 'loss']
        );
      }

      const finalWallet = await client.query(
        'SELECT balance FROM wallets WHERE user_id = $1',
        [userId]
      );

      await client.query('COMMIT');

      return {
        results: rolls.map(roll => ({
          item:   { ...roll.item, wear: roll.wear.abbr, value: roll.payout },
          rarity: roll.rarity,
          wear:   { name: roll.wear.name, abbr: roll.wear.abbr },
          cost:   crate.cost,
          payout: roll.payout,
          net:    roll.payout - crate.cost,
          win:    roll.payout >= crate.cost,
        })),
        totalCost,
        totalPayout,
        net,
        balance: finalWallet.rows[0].balance,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
};
