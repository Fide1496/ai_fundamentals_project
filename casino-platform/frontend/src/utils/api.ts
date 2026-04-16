const BASE_URL = '';

function getToken(): string | null {
  return localStorage.getItem('casino_token');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(`Server error (${res.status}) — received non-JSON response`);
  }

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}

export const api = {
  // Auth
  register: (username: string, password: string) =>
    request<{ token: string; userId: string; username: string; balance: number }>(
      'POST', 'auth/register', { username, password }, false
    ),

  login: (username: string, password: string) =>
    request<{ token: string; userId: string; username: string; balance: number }>(
      'POST', 'auth/login', { username, password }, false
    ),

  claimDailyReward: () =>
    request<{ amount: number; newBalance: number }>('POST', 'auth/daily-reward'),

  // Wallet
  getWallet: () =>
    request<{ balance: number }>('GET', 'wallet'),

  getTransactions: () =>
    request<{ transactions: import('../types').Transaction[] }>('GET', 'wallet/transactions'),

  // Leaderboard
  getLeaderboard: () =>
    request<{ leaderboard: import('../types').LeaderboardEntry[] }>('GET', 'leaderboard'),

  // Games
  slotsPlay: (bet: number) =>
    request<import('../types').SlotsResult>('POST', 'game/slots/play', { bet }),

  blackjackStart: (bet: number) =>
    request<import('../types').BlackjackState>('POST', 'game/blackjack/start', { bet }),

  blackjackAction: (sessionId: string, action: 'hit' | 'stand') =>
    request<import('../types').BlackjackState>('POST', 'game/blackjack/action', { sessionId, action }),

  crashPlay: (bet: number, targetMultiplier: number) =>
    request<import('../types').CrashResult>('POST', 'game/crash/play', { bet, targetMultiplier }),

  roulettePlay: (bets: import('../types').RouletteBet[]) =>
    request<import('../types').RouletteResult>('POST', 'game/roulette/play', { bets }),

  // Crates
  getCrates: () =>
    request<{ crates: import('../types').CrateDefinition[] }>('GET', 'crate/list'),

  openCrate: (crateId: string, count = 1) =>
    request<import('../types').CrateOpenBatchResult>('POST', 'crate/open', { crateId, count }),

  // Admin
  addBalance: (adminPassword: string, amount: number) =>
    request<{ newBalance: number; added: number }>(
      'POST', 'admin/add-balance', { adminPassword, amount }
    ),
};

// Keep named exports for backwards compat
export const crateApi = {
  getCrates: api.getCrates,
  openCrate: api.openCrate,
};

export const adminApi = {
  addBalance: api.addBalance,
};
