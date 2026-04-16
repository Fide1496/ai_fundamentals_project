import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';

type Rarity = 'consumer' | 'industrial' | 'milspec' | 'restricted' | 'classified' | 'covert' | 'rare_special';

interface CrateItem { id: string; name: string; skin: string; rarity: Rarity; color: string; emoji: string; wear?: string; value?: number; }
interface Crate { id: string; name: string; description: string; cost: number; emoji: string; items: CrateItem[]; }
interface SingleResult { item: CrateItem; rarity: Rarity; wear: { name: string; abbr: string }; cost: number; payout: number; net: number; win: boolean; }
interface BatchResult { results: SingleResult[]; totalCost: number; totalPayout: number; net: number; balance: number; }

const RARITY_LABELS: Record<Rarity, string> = {
  consumer:'Consumer Grade', industrial:'Industrial Grade', milspec:'Mil-Spec Grade',
  restricted:'Restricted', classified:'Classified', covert:'Covert', rare_special:'★ Rare Special',
};
const RARITY_COLORS: Record<Rarity, string> = {
  consumer:'#b0b0b0', industrial:'#6db0d8', milspec:'#4b69ff',
  restricted:'#8847ff', classified:'#d32ce6', covert:'#eb4b4b', rare_special:'#ffd700',
};
const RARITY_BG: Record<Rarity, string> = {
  consumer:'from-gray-800 to-gray-900', industrial:'from-blue-900 to-gray-900',
  milspec:'from-blue-800 to-gray-900', restricted:'from-purple-900 to-gray-900',
  classified:'from-pink-900 to-gray-900', covert:'from-red-900 to-gray-900',
  rare_special:'from-yellow-900 to-gray-900',
};

const ITEM_W = 112, ITEM_H = 130, ITEM_GAP = 6, ITEM_STEP = ITEM_W + ITEM_GAP;
const VISIBLE = 7, REEL_H = ITEM_H + 20, CENTER_SLOT = Math.floor(VISIBLE / 2);
const WIN_IDX = 52;

function buildList(items: CrateItem[], winItem: CrateItem): CrateItem[] {
  const list: CrateItem[] = [];
  for (let i = 0; i < 30; i++) list.push(...[...items].sort(() => Math.random() - 0.5));
  while (list.length <= WIN_IDX + VISIBLE + 5) list.push(...items);
  list[WIN_IDX] = { ...winItem };
  return list;
}

function ReelCard({ item }: { item: CrateItem }) {
  const c = RARITY_COLORS[item.rarity];
  return (
    <div style={{ width:`${ITEM_W}px`, height:`${ITEM_H}px`, minWidth:`${ITEM_W}px`, borderRadius:'12px',
      border:`2px solid ${c}`, background:`linear-gradient(135deg,${c}28 0%,#12121a 100%)`,
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:'4px', position:'relative', overflow:'hidden', boxSizing:'border-box' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:c }} />
      <span style={{ fontSize:'32px', lineHeight:1 }}>{item.emoji}</span>
      <div style={{ textAlign:'center', padding:'0 6px' }}>
        <p style={{ color:c, fontSize:'11px', fontWeight:700, lineHeight:1.2, margin:0 }}>{item.name}</p>
        <p style={{ color:'#6b7280', fontSize:'9px', lineHeight:1.3, margin:0 }}>{item.skin}</p>
      </div>
    </div>
  );
}

function SingleReel({ list, spinning, onDone }: { list: CrateItem[]; spinning: boolean; onDone: () => void }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const rafRef   = useRef<number | null>(null);
  const doneRef  = useRef(false);
  const targetOffset = WIN_IDX * ITEM_STEP - CENTER_SLOT * ITEM_STEP;
  const startOffset  = ITEM_STEP * 4;
  const markerLeft   = CENTER_SLOT * ITEM_STEP;

  useEffect(() => {
    if (!spinning || list.length === 0) return;
    doneRef.current = false;
    if (trackRef.current) {
      trackRef.current.style.transition = 'none';
      trackRef.current.style.transform  = `translateX(-${startOffset}px)`;
    }
    trackRef.current?.getBoundingClientRect();

    const DURATION = 3200;
    let startTime: number | null = null;
    const ease = (t: number) => 1 - Math.pow(1 - t, 5);

    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed  = Math.min(ts - startTime, DURATION);
      const offset   = startOffset + (targetOffset - startOffset) * ease(elapsed / DURATION);
      if (trackRef.current) trackRef.current.style.transform = `translateX(-${offset}px)`;
      if (elapsed < DURATION) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (trackRef.current) trackRef.current.style.transform = `translateX(-${targetOffset}px)`;
        if (!doneRef.current) { doneRef.current = true; onDone(); }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [spinning, list]);

  return (
    <div style={{ position:'relative', width:'100%', height:`${REEL_H}px`, overflow:'hidden',
      borderRadius:'16px', border:'2px solid #2a2a3d', background:'#12121a' }}>
      <div style={{ position:'absolute', top:'50%', left:0, transform:'translateY(-50%)',
        height:`${ITEM_H}px`, width:'100%' }}>
        <div ref={trackRef} style={{ display:'flex', flexDirection:'row', gap:`${ITEM_GAP}px`,
          position:'absolute', top:0, left:`${ITEM_GAP}px`, willChange:'transform',
          transform:`translateX(-${startOffset}px)` }}>
          {list.map((item, i) => <ReelCard key={i} item={item} />)}
        </div>
      </div>
      {/* Gold center marker */}
      <div style={{ position:'absolute', top:0, bottom:0, left:`${markerLeft + ITEM_GAP}px`,
        width:`${ITEM_W}px`, border:'2px solid #f0c040', borderRadius:'12px',
        pointerEvents:'none', zIndex:10, boxShadow:'0 0 16px #f0c04055' }} />
      <div style={{ position:'absolute', top:0, zIndex:20,
        left:`${markerLeft + ITEM_GAP + ITEM_W / 2}px`, transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'7px solid transparent', borderRight:'7px solid transparent', borderTop:'9px solid #f0c040' }} />
      <div style={{ position:'absolute', bottom:0, zIndex:20,
        left:`${markerLeft + ITEM_GAP + ITEM_W / 2}px`, transform:'translateX(-50%)',
        width:0, height:0, borderLeft:'7px solid transparent', borderRight:'7px solid transparent', borderBottom:'9px solid #f0c040' }} />
      {/* Fades */}
      <div style={{ position:'absolute', top:0, bottom:0, left:0, width:'90px',
        background:'linear-gradient(to right,#12121a,transparent)', zIndex:10, pointerEvents:'none' }} />
      <div style={{ position:'absolute', top:0, bottom:0, right:0, width:'90px',
        background:'linear-gradient(to left,#12121a,transparent)', zIndex:10, pointerEvents:'none' }} />
    </div>
  );
}

function ResultCard({ result, index }: { result: SingleResult; index: number }) {
  const c = RARITY_COLORS[result.rarity];
  return (
    <div className={`rounded-xl border p-3 bg-gradient-to-br ${RARITY_BG[result.rarity]} animate-bounce-in flex flex-col items-center gap-2`}
         style={{ borderColor: c, animationDelay: `${index * 60}ms` }}>
      <div style={{ width:'80px', height:'96px', borderRadius:'10px', border:`2px solid ${c}`,
        background:`linear-gradient(135deg,${c}28 0%,#12121a 100%)`,
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        gap:'3px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:c }} />
        <span style={{ fontSize:'28px', lineHeight:1 }}>{result.item.emoji}</span>
        <p style={{ color:c, fontSize:'10px', fontWeight:700, lineHeight:1.2, margin:0, textAlign:'center', padding:'0 4px' }}>{result.item.name}</p>
        <p style={{ color:'#6b7280', fontSize:'8px', margin:0, textAlign:'center', padding:'0 4px' }}>{result.item.skin}</p>
      </div>
      <div className="text-center">
        <p style={{ color: c, fontSize:'9px', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>
          {result.wear.abbr}
        </p>
        <p className={`font-mono text-sm font-bold ${result.net >= 0 ? 'text-casino-green' : 'text-casino-red'}`}>
          {result.net >= 0 ? '+' : ''}{result.net.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

export default function CratePage() {
  const { user, updateBalance } = useAuth();
  const [crates, setCrates]               = useState<Crate[]>([]);
  const [selectedCrate, setSelectedCrate] = useState<Crate | null>(null);
  const [count, setCount]                 = useState(1);
  const [opening, setOpening]             = useState(false);
  const [spinning, setSpinning]           = useState(false);
  const [spinIndex, setSpinIndex]         = useState(0); // which reel is currently spinning
  const [reelList, setReelList]           = useState<CrateItem[]>([]);
  const [batchResult, setBatchResult]     = useState<BatchResult | null>(null);
  const [revealedResults, setRevealedResults] = useState<SingleResult[]>([]);
  const [error, setError]                 = useState('');
  const [loadingCrates, setLoadingCrates] = useState(true);
  const batchRef                          = useRef<BatchResult | null>(null);

  useEffect(() => {
    api.getCrates()
      .then(({ crates }) => { setCrates(crates); if (crates.length > 0) setSelectedCrate(crates[0]); })
      .catch(err => setError((err as Error).message))
      .finally(() => setLoadingCrates(false));
  }, []);

  const handleOpen = async () => {
    if (!selectedCrate || spinning || opening) return;
    setError('');
    setBatchResult(null);
    setRevealedResults([]);
    setOpening(true);

    try {
      const res = await api.openCrate(selectedCrate.id, count);
      updateBalance(res.balance);
      batchRef.current = res;

      // Build reel list for first spin
      const list = buildList(selectedCrate.items, res.results[0].item);
      setReelList(list);
      setSpinIndex(0);
      setOpening(false);
      setSpinning(true);
    } catch (err) {
      setOpening(false);
      setError((err as Error).message);
    }
  };

  const handleReelDone = () => {
    const batch = batchRef.current;
    if (!batch) return;

    // Reveal this result
    setRevealedResults(prev => [...prev, batch.results[spinIndex]]);

    const nextIndex = spinIndex + 1;
    if (nextIndex < batch.results.length && selectedCrate) {
      // Short pause then spin next reel
      setTimeout(() => {
        const list = buildList(selectedCrate.items, batch.results[nextIndex].item);
        setReelList(list);
        setSpinIndex(nextIndex);
        // Force re-trigger by toggling spinning
        setSpinning(false);
        setTimeout(() => setSpinning(true), 50);
      }, 400);
    } else {
      // All done
      setSpinning(false);
      setBatchResult(batch);
    }
  };

  const totalCost = selectedCrate ? selectedCrate.cost * count : 0;
  const canAfford = (user?.balance ?? 0) >= totalCost;

  if (loadingCrates) {
    return <div className="flex items-center justify-center h-64"><div className="text-casino-gold text-3xl animate-pulse">📦</div></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-display text-3xl font-bold gold-text">Case Opening</h2>
        <p className="text-gray-400 mt-1">Open up to 10 cases at once</p>
      </div>

      {/* Crate selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {crates.map(crate => (
          <button key={crate.id}
            onClick={() => { setSelectedCrate(crate); setBatchResult(null); setRevealedResults([]); }}
            className={`card p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98] ${
              selectedCrate?.id === crate.id ? 'border-casino-gold/60 bg-casino-gold/5' : ''}`}>
            <div className="text-3xl mb-2">{crate.emoji}</div>
            <p className="font-semibold text-white text-sm">{crate.name}</p>
            <p className="text-gray-500 text-xs mt-0.5">{crate.description}</p>
            <p className="font-mono text-casino-gold font-bold mt-2">{crate.cost.toLocaleString()} coins each</p>
          </button>
        ))}
      </div>

      {selectedCrate && (
        <>
          {/* Count selector */}
          <div className="card p-4">
            <p className="text-sm text-gray-400 mb-3">Number of Cases</p>
            <div className="flex flex-wrap gap-2 items-center">
              {[1,2,3,5,10].map(n => (
                <button key={n} onClick={() => setCount(n)}
                  className={`w-12 h-10 rounded-lg font-mono font-bold text-sm transition-all ${
                    count === n ? 'bg-casino-gold text-casino-bg' : 'bg-casino-surface border border-casino-border text-gray-300 hover:border-casino-gold/50'}`}>
                  {n}
                </button>
              ))}
              <input type="number" value={count} min={1} max={10}
                onChange={e => setCount(Math.max(1, Math.min(10, parseInt(e.target.value) || 1)))}
                className="w-16 bg-casino-surface border border-casino-border rounded-lg px-2 py-2 text-center font-mono text-white text-sm focus:outline-none focus:border-casino-gold" />
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-500">Total cost</p>
                <p className="font-mono text-casino-gold font-bold">{totalCost.toLocaleString()} coins</p>
              </div>
            </div>
          </div>

          {/* Reel */}
          <div className="card p-4">
            {/* Progress indicator for multi-spin */}
            {(spinning || batchResult) && count > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs text-gray-400">Case</p>
                {Array.from({ length: count }, (_, i) => (
                  <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < revealedResults.length ? 'bg-casino-green/20 border border-casino-green text-casino-green' :
                    i === spinIndex && spinning ? 'bg-casino-gold/20 border border-casino-gold text-casino-gold animate-pulse' :
                    'bg-casino-surface border border-casino-border text-gray-600'
                  }`}>{i + 1}</div>
                ))}
              </div>
            )}

            <SingleReel
              key={`${spinIndex}-${reelList.length}`}
              list={reelList.length > 0 ? reelList : Array.from({ length: WIN_IDX + 10 }, (_, i) => selectedCrate.items[i % selectedCrate.items.length])}
              spinning={spinning}
              onDone={handleReelDone}
            />
          </div>

          {/* Revealed results grid */}
          {revealedResults.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Unboxed — {revealedResults.length}/{count}
                </h3>
                {batchResult && (
                  <span className={`font-mono text-sm font-bold ${batchResult.net >= 0 ? 'text-casino-green' : 'text-casino-red'}`}>
                    Net: {batchResult.net >= 0 ? '+' : ''}{batchResult.net.toLocaleString()} coins
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3">
                {revealedResults.map((r, i) => <ResultCard key={i} result={r} index={i} />)}
              </div>
            </div>
          )}

          {/* Open button */}
          <div className="flex flex-col items-center gap-3">
            {error && (
              <div className="w-full bg-casino-red/10 border border-casino-red/30 rounded-xl px-4 py-2 text-casino-red text-sm text-center">
                {error}
              </div>
            )}
            <button onClick={handleOpen}
              disabled={spinning || opening || !canAfford}
              className="btn-gold px-12 py-4 text-lg">
              {opening  ? '⏳ Rolling...' :
               spinning ? `📦 Opening ${spinIndex + 1} of ${count}...` :
               count === 1
                 ? `📦 Open Case — ${totalCost.toLocaleString()} coins`
                 : `📦 Open ${count} Cases — ${totalCost.toLocaleString()} coins`}
            </button>
            {!canAfford && <p className="text-casino-red text-sm">Insufficient balance</p>}
          </div>

          {/* Contents */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Contents of {selectedCrate.name}</h3>
            {(['rare_special','covert','classified','restricted','milspec','industrial','consumer'] as Rarity[]).map(rarity => {
              const ri = selectedCrate.items.filter(i => i.rarity === rarity);
              if (!ri.length) return null;
              return (
                <div key={rarity} className="mb-4">
                  <p className="text-xs font-semibold mb-2 uppercase tracking-wider" style={{ color: RARITY_COLORS[rarity] }}>
                    {RARITY_LABELS[rarity]}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ri.map(item => (
                      <div key={item.id} className="flex items-center gap-2 bg-casino-surface rounded-lg px-3 py-1.5 border"
                           style={{ borderColor: RARITY_COLORS[item.rarity] + '44' }}>
                        <span>{item.emoji}</span>
                        <div>
                          <p className="text-xs text-white font-medium">{item.name}</p>
                          <p className="text-gray-500" style={{ fontSize:'10px' }}>{item.skin}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Odds */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Drop Rates</h3>
            <div className="space-y-2">
              {([['consumer','~79.9%','0.2×'],['industrial','~16.0%','0.5×'],['milspec','~3.2%','1.5×'],
                 ['restricted','~0.6%','4×'],['classified','~0.3%','12×'],['covert','~0.2%','50×'],
                 ['rare_special','~0.1%','200×']] as [Rarity,string,string][]).map(([rarity,pct,mult]) => (
                <div key={rarity} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: RARITY_COLORS[rarity] }} />
                    <span style={{ color: RARITY_COLORS[rarity] }}>{RARITY_LABELS[rarity]}</span>
                  </div>
                  <div className="flex gap-6 font-mono text-xs">
                    <span className="text-gray-400">{pct}</span>
                    <span className="text-casino-gold">{mult} payout</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-600 mt-3">Wear: FN 1.5× · MW 1.2× · FT 1.0× · WW 0.85× · BS 0.7×</p>
          </div>
        </>
      )}
    </div>
  );
}
