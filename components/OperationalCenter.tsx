
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Shield, Users, BarChart3, Layout, Lock, Unlock, 
  Terminal, Database, AlertCircle, CheckCircle2, 
  ChevronRight, ArrowRightLeft, Brain, Send, 
  History, Settings2, Filter, Search, Copy, 
  MoreHorizontal, Play, Pause, Activity, 
  Flame, Wallet, Gauge, HelpCircle, X, ChevronDown, Plus, Eye,
  AlertTriangle, Info, Calendar, Sparkles, UserPlus, TrendingUp,
  EyeOff, ExternalLink, RefreshCw, FilterX, Clock, ArrowRight,
  ShieldCheck, AlertOctagon, MoreVertical, Globe, Building2,
  Percent, Landmark, TrendingDown, Tally5, MousePointer2,
  CalendarDays, RotateCw, CalendarRange, ListFilter, MessageSquare,
  ArrowUpRight, UserCircle, Bell, BellRing, Settings, Power,
  ArrowRightCircle, Target, Store, TrendingUp as TrendingIcon,
  Receipt, CalendarSearch, FileSearch, LineChart, FileText, StickyNote,
  MapPin, Layers, Trophy, Dribbble, Target as TargetIcon, ChevronUp
} from 'lucide-react';
import { createPortal } from 'react-dom';

// --- TIPOS E INTERFACES ---

type AppMode = 'LIDER' | 'OPERADOR';
type ProfileStatus = 'Activo' | 'Descanso' | 'Limitado' | 'Bloqueado';
type SportType = 'Fútbol' | 'Tenis' | 'Basket';

interface ProfileNote {
  timestamp: string;
  author: string;
  text: string;
}

interface Profile {
  id: string;
  username: string;
  password_masked: string;
  backoffice_url: string;
  bookie: string;
  ecosystem: string;
  region: 'Ecuador' | 'Internacional';
  ownerName: string;
  balance: number;
  avgStake: number; // 20, 50, 100, 300
  favoriteSport: SportType;
  weeklyAvgBets: number;
  betStyle: string;
  healthScore: number;
  status: ProfileStatus;
  lastBet: string;
  movements: any[];
  rakeMonthly: number; 
  ggrMonthly: number;
  rakeProfit: number; 
  last_activity_date: string; 
  cooldown_until: string | null; 
  rotation_group: 'A' | 'B' | null;
  bets_yesterday: number;
  stake_yesterday: number;
  month_ops_count: number;
  month_volume: number;
  total_volume: number; 
  daily_avg_bets: number; 
  month_active_days: number;
  created_at: string; 
  notes: ProfileNote[];
  manual_schedule: Record<string, 'A' | 'B'>; 
  planner_note?: string; 
}

interface NetworkAlert {
  id: string;
  type: 'danger' | 'warning' | 'info';
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

// --- CONFIGURACIÓN DE CASAS Y ECOSISTEMAS ---
const ECOSISTEMAS = [
  { id: 'ALTENAR', name: 'ALTENAR', region: 'Ecuador', houses: ['OKIBET', 'ECUABET', 'DATABET', 'FUNPLAY', 'BETFINE24', 'ASTROBET', 'LASPLATAS', 'TURBOBET'] },
  { id: 'BETPRO', name: 'BETPROLIVE / SPORTBET', region: 'Ecuador', houses: ['BETPROLIVE', 'SPORTBET'] },
  { id: 'OKICOM', name: 'OKIBET.COM', region: 'Ecuador', houses: ['OKIBET.COM'] },
  { id: 'VICTORY', name: 'VICTORY365 / BETFURY', region: 'Ecuador', houses: ['VICTORY365.LIVE', 'BETFURY'] },
  { id: 'SORTI', name: 'SORTI', region: 'Ecuador', houses: ['SORTI365'] },
  { id: '1XGROUP', name: '1X GROUP', region: 'Internacional', houses: ['1XBET', 'MELBET', '22BET', '1XBIT', 'BETWINNER'] },
  { id: 'OTRAS_INT', name: 'OTRAS INTERNACIONALES', region: 'Internacional', houses: ['PINNACLE', 'BETANO', 'BET365', 'BETCAKE'] }
];

const ALL_HOUSES = ECOSISTEMAS.flatMap(e => e.houses);
const STAKE_LEVELS = [20, 50, 100, 300];
const SPORTS: SportType[] = ['Fútbol', 'Tenis', 'Basket'];

// --- MOCK DATA SEEDER ---
const INITIAL_PROFILES: Profile[] = Array.from({ length: 90 }).map((_, i) => {
    const house = ALL_HOUSES[i % ALL_HOUSES.length];
    const ecosys = ECOSISTEMAS.find(e => e.houses.includes(house));
    const stake = STAKE_LEVELS[i % STAKE_LEVELS.length];
    const sport = SPORTS[i % SPORTS.length];
    const rakeM = 80 + Math.random() * 400;
    
    return {
      id: `p-${i}`,
      username: `${house.toLowerCase()}_master_${i}`,
      password_masked: '••••••••••••',
      backoffice_url: '#',
      bookie: house,
      ecosystem: ecosys?.id || 'OTRAS',
      region: (ecosys?.region as any) || 'Ecuador',
      ownerName: i % 3 === 0 ? 'Nicolás Ullauri' : i % 3 === 1 ? 'Santiago Muñoz' : 'Jonathan Ayala',
      balance: Math.floor(100 + Math.random() * 2500),
      avgStake: stake,
      favoriteSport: sport,
      weeklyAvgBets: 15 + Math.floor(Math.random() * 25),
      betStyle: sport === 'Tenis' ? 'Daily Tennis Grinder' : sport === 'Fútbol' ? 'Main Leagues Only' : 'NBA Specialist',
      healthScore: 60 + Math.floor(Math.random() * 40),
      status: 'Activo',
      lastBet: 'hace 2h',
      movements: [
          { id: 'm1', timestamp: '2024-05-22 14:30', type: 'Apuesta', amount: -stake, note: `Wager on ${sport}` },
          { id: 'm2', timestamp: '2024-05-21 18:20', type: 'Apuesta', amount: stake * 1.5, note: 'Won Market' }
      ],
      rakeMonthly: rakeM,
      ggrMonthly: 400 + Math.random() * 1000,
      rakeProfit: rakeM * 0.75,
      last_activity_date: new Date().toISOString(),
      cooldown_until: null,
      rotation_group: 'A',
      bets_yesterday: Math.floor(Math.random() * 12),
      stake_yesterday: Math.floor(Math.random() * 500),
      month_ops_count: 35 + i,
      month_volume: 1800 + (i * 20),
      total_volume: 8500 + (i * 150),
      daily_avg_bets: 3.5 + (Math.random() * 5),
      month_active_days: 18,
      created_at: '2023-09-15',
      notes: [],
      manual_schedule: {},
      planner_note: undefined
    };
});

const OperationalCenter: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AppMode>('LIDER');
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [matrix, setMatrix] = useState<Record<string, string[]>>({});
  const [isPlanLocked, setIsPlanLocked] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isScoreLegendOpen, setIsScoreLegendOpen] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Fix for toggleProfileToMatrix missing
  const toggleProfileToMatrix = (houseName: string, profileId: string) => {
    setMatrix(prev => {
      const isAssigned = Object.values(prev).flat().includes(profileId);
      const newMatrix = { ...prev };

      if (isAssigned) {
        // Remove from everywhere
        Object.keys(newMatrix).forEach(house => {
          newMatrix[house] = newMatrix[house].filter(id => id !== profileId);
        });
      } else {
        // Assign to requested house
        if (!newMatrix[houseName]) newMatrix[houseName] = [];
        newMatrix[houseName] = [...newMatrix[houseName], profileId];
      }
      return newMatrix;
    });
  };

  // Filtros Flota
  const [radarSearch, setRadarSearch] = useState('');
  const [filterType, setFilterType] = useState<'HOY' | 'TODOS' | 'ASIGNADOS'>('HOY');
  const [sportFilter, setSportFilter] = useState<'ALL' | SportType>('ALL');
  const [stakeFilter, setStakeFilter] = useState<'ALL' | number>('ALL');

  // Filtros Matriz
  const [regionFilter, setRegionFilter] = useState<'TODAS' | 'ECUADOR' | 'INTERNACIONAL'>('TODAS');
  const [expandedEcos, setExpandedEcos] = useState<string[]>([]); // Todos plegados de base

  // Radar
  const [radarView, setRadarView] = useState<'weekly' | 'monthly'>('weekly');
  
  const todayStr = new Date().toISOString().split('T')[0];

  const getProfileAvailability = (p: Profile, isAssigned: boolean) => {
    if (isAssigned) return { label: 'OPERANDO', color: 'bg-emerald-500', text: 'text-emerald-500', cell: 'A' };
    const manualToday = p.manual_schedule[todayStr];
    if (manualToday === 'B') return { label: 'DESCANSO', color: 'bg-slate-700', text: 'text-slate-500', cell: 'B' };
    if (manualToday === 'A') return { label: 'HABILITADO', color: 'bg-emerald-400', text: 'text-emerald-400', cell: 'A' };
    return { label: 'DISPONIBLE', color: 'bg-primary', text: 'text-primary', cell: 'A' };
  };

  const totals = useMemo(() => {
    const activeIds = Object.values(matrix).flat();
    return {
        total: profiles.length,
        available: profiles.filter(p => !activeIds.includes(p.id) && p.manual_schedule[todayStr] !== 'B').length,
        resting: profiles.filter(p => p.manual_schedule[todayStr] === 'B').length,
        operating: activeIds.length,
        liquidity: profiles.filter(p => activeIds.includes(p.id)).reduce((acc, p) => acc + p.balance, 0)
    };
  }, [profiles, matrix, todayStr]);

  const matrixGroupedByEcosystem = useMemo(() => {
    let ecosysList = [...ECOSISTEMAS];
    if (regionFilter === 'ECUADOR') ecosysList = ecosysList.filter(e => e.region === 'Ecuador');
    if (regionFilter === 'INTERNACIONAL') ecosysList = ecosysList.filter(e => e.region === 'Internacional');

    return ecosysList.map(eco => {
       const housesData = eco.houses.map(houseName => {
          const assignedIds = matrix[houseName] || [];
          const assigned = profiles.filter(p => assignedIds.includes(p.id));
          return {
             name: houseName,
             assigned,
             totalBalance: assigned.reduce((a, b) => a + b.balance, 0),
             status: assigned.length < 1 ? 'RIESGO' : 'OK'
          };
       });
       return { ...eco, housesData };
    });
  }, [matrix, profiles, regionFilter]);

  const filteredPool = useMemo(() => {
    return profiles.filter(p => {
        const matchesSearch = p.username.toLowerCase().includes(radarSearch.toLowerCase()) || p.bookie.toLowerCase().includes(radarSearch.toLowerCase());
        const matchesSport = sportFilter === 'ALL' || p.favoriteSport === sportFilter;
        const matchesStake = stakeFilter === 'ALL' || p.avgStake === stakeFilter;
        const isAssigned = Object.values(matrix).flat().includes(p.id);
        
        let matchesType = true;
        if (filterType === 'HOY') matchesType = p.manual_schedule[todayStr] !== 'B' && !isAssigned;
        if (filterType === 'ASIGNADOS') matchesType = isAssigned;

        return matchesSearch && matchesSport && matchesStake && matchesType;
    });
  }, [profiles, filterType, matrix, radarSearch, sportFilter, stakeFilter, todayStr]);

  const toggleEco = (id: string) => {
    setExpandedEcos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleManualDay = (pid: string, date: string) => {
    setProfiles(prev => prev.map(p => {
        if (p.id === pid) {
            const current = p.manual_schedule[date];
            const next = current === 'A' ? 'B' : current === 'B' ? undefined : 'A';
            const newSchedule = { ...p.manual_schedule };
            if (!next) delete newSchedule[date];
            else newSchedule[date] = next;
            return { ...p, manual_schedule: newSchedule };
        }
        return p;
    }));
  };

  const syncMatrixWithPlanner = () => {
    const newMatrix: Record<string, string[]> = {};
    ALL_HOUSES.forEach(house => {
       const toAdd = profiles.filter(p => p.bookie === house && p.manual_schedule[todayStr] === 'A');
       newMatrix[house] = toAdd.map(p => p.id);
    });
    setMatrix(newMatrix);
  };

  const autoPlanIA = () => {
    const newMatrix: Record<string, string[]> = {};
    ALL_HOUSES.forEach(house => {
      const candidates = profiles
        .filter(p => p.bookie === house && p.manual_schedule[todayStr] !== 'B')
        .sort((a,b) => b.healthScore - a.healthScore)
        .slice(0, 2);
      newMatrix[house] = candidates.map(c => c.id);
    });
    setMatrix(newMatrix);
    setIsChatOpen(true);
  };

  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedProfileId), [profiles, selectedProfileId]);

  return (
    <div className="flex-1 flex flex-col bg-[#050609] text-slate-200 h-full overflow-hidden font-sans transition-all duration-700">
      
      {/* 1. HEADER PREMIUM */}
      <header className="bg-[#0a0c14]/95 backdrop-blur-3xl border-b border-white/5 px-10 py-5 flex flex-col gap-5 z-40 shadow-2xl">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="bg-primary/10 p-3 rounded-2xl border border-primary/30 shadow-[0_0_40px_rgba(19,91,236,0.15)] group cursor-pointer hover:bg-primary/20 transition-all">
                <Zap size={32} className="text-primary fill-primary group-hover:scale-110 transition-all" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-[0.4em] leading-none">WISEBET <span className="text-primary font-thin tracking-[0.1em]">| COMMAND CENTER</span></h1>
              <div className="flex items-center gap-4 mt-2.5">
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase border tracking-widest ${isPlanLocked ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse'}`}>
                  {isPlanLocked ? <ShieldCheck size={12}/> : <Clock size={12}/>}
                  {isPlanLocked ? 'Plan Global Publicado' : 'Ajustes en Proceso'}
                </div>
                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-glow-sm"></div> NETWORK LIVE • {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex bg-black/50 border border-white/5 rounded-2xl p-1.5 shadow-inner">
                <button onClick={() => setMode('LIDER')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'LIDER' ? 'bg-primary text-white shadow-glow' : 'text-slate-500 hover:text-white'}`}>Modo Líder</button>
                <button onClick={() => setMode('OPERADOR')} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'OPERADOR' ? 'bg-primary text-white shadow-glow' : 'text-slate-500 hover:text-white'}`}>Modo Operador</button>
             </div>
             
             <div className="relative">
                <button 
                  onClick={() => setIsScoreLegendOpen(!isScoreLegendOpen)}
                  className={`p-3.5 rounded-2xl transition-all border ${isScoreLegendOpen ? 'bg-amber-500 text-white border-amber-500 shadow-glow-sm' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'}`}
                >
                   <Info size={22} />
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative">
        {mode === 'LIDER' ? (
          <>
            {/* --- POOL DE FLOTA --- */}
            <aside className="w-[480px] flex-shrink-0 border-r border-white/5 bg-[#08090d] flex flex-col overflow-hidden shadow-2xl z-30">
               <div className="p-8 border-b border-white/5 space-y-6 bg-[#0c0e16]/50 backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                     <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3"><Database size={20} className="text-primary" /> Pool de Flota</h3>
                     <div className="flex bg-black/60 p-1 rounded-xl border border-white/5">
                        {['HOY', 'TODOS', 'ASIGNADOS'].map(t => (
                          <button key={t} onClick={() => setFilterType(t as any)} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${filterType === t ? 'bg-primary text-white' : 'text-slate-600 hover:text-slate-400'}`}>{t}</button>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                        <input 
                           type="text" placeholder="BUSCAR USUARIO O CASA..." 
                           value={radarSearch} onChange={e => setRadarSearch(e.target.value)}
                           className="w-full bg-black/60 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-[11px] text-white outline-none focus:border-primary/50"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <select 
                            value={sportFilter} onChange={e => setSportFilter(e.target.value as any)}
                            className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-[10px] text-slate-400 font-bold uppercase outline-none focus:border-primary transition-all"
                        >
                            <option value="ALL">TODOS LOS DEPORTES</option>
                            <option value="Fútbol">⚽ FÚTBOL</option>
                            <option value="Tenis">🎾 TENIS</option>
                            <option value="Basket">🏀 BASKET</option>
                        </select>
                        <select 
                            value={stakeFilter === 'ALL' ? 'ALL' : stakeFilter.toString()} onChange={e => setStakeFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                            className="bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-[10px] text-slate-400 font-bold uppercase outline-none focus:border-primary transition-all"
                        >
                            <option value="ALL">CUALQUIER STAKE</option>
                            {STAKE_LEVELS.map(s => <option key={s} value={s}>STAKE PROMEDIO ${s}</option>)}
                        </select>
                     </div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#06070a]">
                  {filteredPool.map(p => {
                    const isAssigned = Object.values(matrix).flat().includes(p.id);
                    const avail = getProfileAvailability(p, isAssigned);
                    return (
                      <div 
                        key={p.id} onClick={() => setSelectedProfileId(p.id)} 
                        className={`group p-5 rounded-[2.5rem] border transition-all duration-300 cursor-pointer relative overflow-hidden ${isAssigned ? 'bg-emerald-500/5 border-emerald-500/30 shadow-glow-sm' : 'bg-[#12141c] border-white/5 hover:border-primary/20'}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                           <div>
                              <span className="text-[10px] font-black text-primary uppercase tracking-tighter block mb-1">{p.bookie}</span>
                              <h4 className="text-base font-black text-white leading-none group-hover:text-primary transition-colors uppercase tracking-tight">{p.username}</h4>
                           </div>
                           <div className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border flex items-center gap-1.5 ${avail.text} border-current/20 bg-white/[0.02]`}>
                              <div className={`w-1.5 h-1.5 rounded-full ${avail.color}`}></div>
                              {avail.label}
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-3 mb-4">
                           <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Saldo</p>
                              <p className="text-sm font-black text-white font-mono">${p.balance.toLocaleString()}</p>
                           </div>
                           <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Stake Avg</p>
                              <p className="text-sm font-black text-primary font-mono">${p.avgStake}</p>
                           </div>
                           <div className="bg-black/30 p-3 rounded-2xl border border-white/5 text-center">
                              <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Salud</p>
                              <p className={`text-sm font-black font-mono ${p.healthScore > 80 ? 'text-emerald-500' : 'text-rose-500'}`}>{p.healthScore}%</p>
                           </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                           <div className="flex flex-col">
                              <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                                 {p.favoriteSport === 'Fútbol' ? <Trophy size={10}/> : p.favoriteSport === 'Basket' ? <Dribbble size={10}/> : <TargetIcon size={10}/>}
                                 {p.favoriteSport} • {p.weeklyAvgBets} bets/semana
                              </span>
                           </div>
                           <button 
                             onClick={(e) => { e.stopPropagation(); toggleProfileToMatrix(p.bookie, p.id); }} 
                             disabled={p.manual_schedule[todayStr] === 'B'}
                             className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all shadow-xl ${isAssigned ? 'bg-rose-500 text-white' : 'bg-primary text-white disabled:opacity-20 active:scale-95'}`}
                           >
                             {isAssigned ? 'Quitar' : 'Asignar'}
                           </button>
                        </div>
                      </div>
                    );
                  })}
               </div>
            </aside>

            {/* --- AREA CENTRAL --- */}
            <div className="flex-1 overflow-y-auto p-12 bg-[#040507] space-y-20 pb-60 custom-scrollbar">
               
               {/* MÉTRICAS DE FLOTA */}
               <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  <MetricBox label="Flota Total" value={totals.total} sub="Cuentas registradas" icon={<Users size={16}/>} />
                  <MetricBox label="Disponibles Hoy (A)" value={totals.available} sub="Habilitadas para operar" color="success" />
                  <MetricBox label="En Descanso (B)" value={totals.resting} sub="Rotación activa" color="danger" />
                  <MetricBox label="Operando" value={totals.operating} sub="En mercado actualmente" color="primary" />
                  <MetricBox label="Liquidez Activa" value={fmtMoney(totals.liquidity)} sub="Capital total en juego" glow />
               </section>

               {/* MATRIZ OPERATIVA GLOBAL (PLEGABLE) */}
               <section className="space-y-10">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 border-b border-white/5 pb-8">
                     <div>
                        <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-6"><Layout size={44} className="text-primary" /> MATRIZ GLOBAL</h2>
                        <p className="text-slate-500 text-lg mt-2 font-medium italic opacity-60">"Cada ecosistema está plegado por defecto. Haz clic para expandir y gestionar la flota."</p>
                     </div>
                     <div className="flex flex-col gap-4">
                        <div className="flex bg-black/50 border border-white/10 rounded-2xl p-1.5 shadow-inner self-end">
                           {(['TODAS', 'ECUADOR', 'INTERNACIONAL'] as const).map(r => (
                              <button key={r} onClick={() => setRegionFilter(r)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${regionFilter === r ? 'bg-primary text-white shadow-glow' : 'text-slate-500 hover:text-white'}`}>{r}</button>
                           ))}
                        </div>
                        <div className="flex gap-4">
                           <button onClick={autoPlanIA} className="flex items-center gap-4 px-10 py-4 bg-white/5 text-slate-300 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-white hover:text-slate-900 transition-all group active:scale-95">
                              <Brain size={22} className="group-hover:animate-pulse"/> Distribuir con IA
                           </button>
                           <button onClick={syncMatrixWithPlanner} className="flex items-center gap-4 px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-hover transition-all group active:scale-95">
                              <RotateCw size={22}/> Aplicar Planificador A/B
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     {matrixGroupedByEcosystem.map(ecosys => {
                        const isOpen = expandedEcos.includes(ecosys.id);
                        return (
                          <div key={ecosys.id} className={`border rounded-[3rem] transition-all duration-500 overflow-hidden ${isOpen ? 'bg-[#0a0c14] border-primary/20 shadow-4xl' : 'bg-[#0e1017] border-white/5 hover:border-white/10'}`}>
                             <div 
                                onClick={() => toggleEco(ecosys.id)}
                                className="p-8 flex justify-between items-center cursor-pointer group"
                             >
                                <div className="flex items-center gap-6">
                                   <div className={`p-4 rounded-2xl transition-all ${isOpen ? 'bg-primary text-white shadow-glow' : 'bg-white/5 text-slate-500 group-hover:text-primary'}`}><Layers size={24}/></div>
                                   <div>
                                      <h3 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-3">
                                         {ecosys.name}
                                         {isOpen && <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-black rounded-lg animate-in zoom-in duration-300">ACTIVO</span>}
                                      </h3>
                                      <div className="flex items-center gap-3 mt-1 opacity-60">
                                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ecosys.region} • {ecosys.houses.length} CASAS</span>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex items-center gap-8">
                                   <div className="text-right">
                                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Capital Liquido</p>
                                      <p className="text-2xl font-black text-white font-mono leading-none tracking-tighter">
                                         {fmtMoney(ecosys.housesData.reduce((acc, h) => acc + h.totalBalance, 0))}
                                      </p>
                                   </div>
                                   <div className={`p-3 rounded-full transition-transform duration-500 ${isOpen ? 'rotate-180 bg-primary/20 text-primary' : 'bg-white/5 text-slate-700 group-hover:text-white'}`}>
                                      <ChevronDown size={24}/>
                                   </div>
                                </div>
                             </div>

                             {isOpen && (
                                <div className="p-10 pt-0 grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-8 animate-in slide-in-from-top-4 duration-500">
                                   {ecosys.housesData.map(house => (
                                      <div key={house.name} className={`bg-black/30 border rounded-[3rem] p-8 space-y-8 relative overflow-hidden ${house.status === 'OK' ? 'border-emerald-500/20' : 'border-rose-500/30 animate-pulse'}`}>
                                         <div className="flex justify-between items-start">
                                            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">{house.name}</h4>
                                            <p className="text-xl font-black text-white font-mono">{fmtMoney(house.totalBalance)}</p>
                                         </div>
                                         <div className="space-y-3">
                                            {house.assigned.map((p: any) => (
                                               <div key={p.id} onClick={() => setSelectedProfileId(p.id)} className="flex justify-between items-center p-5 bg-white/[0.02] border border-white/5 rounded-2xl group/item hover:bg-white/[0.05] transition-all cursor-pointer">
                                                  <div className="flex items-center gap-4">
                                                     <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-lg uppercase">{p.username[0]}</div>
                                                     <div>
                                                        <p className="text-xs font-black text-white uppercase">{p.username}</p>
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">{p.avgStake} STAKE</span>
                                                     </div>
                                                  </div>
                                                  <button onClick={(e) => { e.stopPropagation(); toggleProfileToMatrix(house.name, p.id); }} className="p-2 bg-rose-500/10 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><Power size={14}/></button>
                                               </div>
                                            ))}
                                            {house.assigned.length === 0 && (
                                               <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center opacity-30">
                                                  <p className="text-[10px] font-black uppercase tracking-widest">Sin Flota Activa</p>
                                               </div>
                                            )}
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             )}
                          </div>
                        );
                     })}
                  </div>
               </section>

               {/* PLANIFICADOR ESTRATÉGICO / RADAR */}
               <section className="bg-[#0a0c12]/60 border border-white/5 rounded-[4rem] p-16 shadow-4xl space-y-12 relative overflow-hidden backdrop-blur-3xl">
                  <div className="absolute -right-20 -top-20 opacity-[0.03] pointer-events-none rotate-12"><CalendarSearch size={600} /></div>
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 relative z-10">
                     <div>
                        <h3 className="text-5xl font-black text-white uppercase tracking-tighter flex items-center gap-8"><CalendarRange size={56} className="text-primary shadow-glow"/> PLANIFICADOR A / B</h3>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex gap-4 bg-black/60 p-2 rounded-2xl border border-white/10 shadow-inner">
                                <LegendChip color="bg-emerald-500 shadow-glow" label="A = ACTIVO" />
                                <LegendChip color="bg-slate-700" label="B = DESCANSO" />
                            </div>
                            <p className="text-slate-500 text-sm font-medium italic opacity-70 leading-relaxed max-w-xl">
                                Configura la rotación de flota. Los perfiles en **B** no podrán asignarse a la matriz hoy.
                            </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 self-end">
                        <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
                           <button onClick={() => setRadarView('weekly')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${radarView === 'weekly' ? 'bg-primary text-white' : 'text-slate-600 hover:text-white'}`}>Semanal</button>
                           <button onClick={() => setRadarView('monthly')} className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${radarView === 'monthly' ? 'bg-primary text-white' : 'text-slate-600 hover:text-white'}`}>Mensual</button>
                        </div>
                     </div>
                  </div>

                  <div className="bg-black/40 rounded-[3rem] border border-white/10 overflow-hidden relative z-10 shadow-4xl overflow-x-auto">
                     {radarView === 'weekly' ? (
                       <table className="w-full text-left border-collapse min-w-[1000px]">
                          <thead>
                             <tr className="bg-white/[0.03] text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] border-b border-white/10">
                                <th className="px-10 py-6">OPERADOR / AGENCIA</th>
                                <th className="px-6 py-6 text-center border-l border-white/5">NOTAS</th>
                                {['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'].map((d) => {
                                   const isTodayCol = d === 'MIÉ'; // Mocked
                                   return (
                                      <th key={d} className={`px-4 py-6 text-center border-l border-white/5 ${isTodayCol ? 'text-primary bg-primary/10 shadow-inner' : 'opacity-50'}`}>{d}</th>
                                   );
                                })}
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-white/[0.03]">
                             {profiles.slice(0, 15).map(p => {
                               const isAssignedToday = Object.values(matrix).flat().includes(p.id);
                               const infoToday = getProfileAvailability(p, isAssignedToday);
                               return (
                                 <tr key={p.id} className="hover:bg-white/[0.03] transition-all group">
                                    <td className="px-10 py-5" onClick={() => setSelectedProfileId(p.id)}>
                                       <div className="flex items-center gap-6 cursor-pointer">
                                          <div className={`w-2 h-10 rounded-full transition-all ${isAssignedToday ? 'bg-emerald-500 shadow-glow' : 'bg-white/5'}`}></div>
                                          <div>
                                             <p className="text-sm font-black text-white group-hover:text-primary transition-colors leading-none mb-2 uppercase tracking-tight">{p.username}</p>
                                             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">{p.bookie} • ${p.avgStake} STK</p>
                                          </div>
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 border-l border-white/5">
                                       <input 
                                          type="text" defaultValue={p.planner_note} placeholder="..."
                                          className="bg-transparent border-b border-transparent focus:border-primary/50 text-[10px] text-slate-500 focus:text-white outline-none w-full transition-all uppercase font-bold tracking-widest text-center"
                                       />
                                    </td>
                                    {['2024-05-20','2024-05-21','2024-05-22','2024-05-23','2024-05-24','2024-05-25','2024-05-26'].map(d => {
                                       const isToday = d === todayStr;
                                       const status = isToday ? infoToday.cell : p.manual_schedule[d] || 'A';
                                       return (
                                          <RadarCell 
                                             key={d} state={status} 
                                             color={status === 'A' ? 'bg-emerald-500/20 text-emerald-500 shadow-glow-sm' : 'bg-slate-700/50 text-slate-500'} 
                                             isToday={isToday} onClick={() => toggleManualDay(p.id, d)}
                                          />
                                       );
                                    })}
                                 </tr>
                               );
                             })}
                          </tbody>
                       </table>
                     ) : (
                        /* MONTHLY GRID VIEW */
                        <div className="p-10 space-y-6 max-h-[600px] overflow-y-auto custom-scrollbar">
                           {profiles.slice(0, 20).map(p => (
                              <div key={p.id} className="flex items-center gap-6 group">
                                 <div className="w-[200px] shrink-0">
                                    <p className="text-xs font-black text-white uppercase truncate">{p.username}</p>
                                    <p className="text-[8px] text-slate-600 uppercase font-black">{p.bookie}</p>
                                 </div>
                                 <div className="flex-1 grid grid-cols-15 gap-1.5 lg:grid-cols-30">
                                    {Array.from({length: 30}).map((_, i) => {
                                       const date = `2024-05-${(i+1).toString().padStart(2,'0')}`;
                                       const state = p.manual_schedule[date] || 'A';
                                       return (
                                          <div 
                                             key={i} 
                                             onClick={() => toggleManualDay(p.id, date)}
                                             className={`size-6 rounded-lg border border-white/5 cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-[8px] font-black ${state === 'A' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-700/60 text-slate-500'}`}
                                          >
                                             {i+1}
                                          </div>
                                       );
                                    })}
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               </section>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20 relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent"></div>
             <Terminal size={180} className="text-primary animate-pulse mb-10" />
             <h2 className="text-6xl font-black text-white uppercase tracking-[0.5em] mb-6">ACCESO RESTRINGIDO</h2>
             <p className="text-slate-600 text-2xl font-bold italic">Modo Operador: Puente bloqueado hasta autorización central.</p>
             <button onClick={() => setMode('LIDER')} className="mt-16 px-16 py-6 bg-primary text-white font-black text-lg uppercase rounded-full shadow-glow transition-all tracking-[0.3em]">Volver al Puente</button>
          </div>
        )}

        {/* --- CHAT GEMINI CORE --- */}
        <div className="fixed bottom-12 right-12 z-[200] flex flex-col items-end gap-6">
           {isChatOpen && (
              <div className="w-[500px] h-[700px] bg-[#0c0e14]/98 backdrop-blur-3xl border border-primary/40 rounded-[3rem] shadow-5xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
                 <div className="p-8 border-b border-white/5 bg-primary/10 flex items-center justify-between shadow-2xl relative">
                    <div className="flex items-center gap-6">
                       <div className="p-4 bg-primary rounded-2xl shadow-glow animate-pulse border border-white/20"><Brain size={28} className="text-white fill-white"/></div>
                       <div>
                          <h3 className="text-xl font-black text-white uppercase leading-none tracking-tighter">GEMINI <span className="text-primary">CORE</span></h3>
                          <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2 mt-2">
                             <div className="size-1.5 bg-emerald-500 rounded-full shadow-glow"></div> ANALYTICS V5.8
                          </span>
                       </div>
                    </div>
                    <button onClick={() => setIsChatOpen(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-slate-500 hover:text-white"><X size={24}/></button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar bg-black/20 text-sm">
                    <div className="flex gap-4">
                       <div className="size-10 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 text-primary"><Sparkles size={20}/></div>
                       <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-6 text-slate-200 leading-relaxed shadow-xl relative">
                          "Hola Nicolás. He analizado la rotación **A/B** actual. Detecto que las cuentas con especialidad en **TENIS** tienen un ROI 4% mayor hoy. ¿Deseas priorizar su activación en el ecosistema **ALTENAR**?"
                       </div>
                    </div>
                 </div>

                 <div className="p-8 border-t border-white/5 bg-black/60">
                    <div className="relative">
                       <input 
                        type="text" placeholder="ORDEN ESTRATÉGICA..." 
                        className="w-full bg-black/80 border border-white/10 rounded-2xl py-5 px-8 text-xs text-white focus:border-primary outline-none transition-all placeholder:text-slate-800 font-black uppercase tracking-widest" 
                       />
                       <button className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-primary text-white rounded-xl shadow-glow active:scale-90 transition-all"><Send size={18}/></button>
                    </div>
                 </div>
              </div>
           )}
           <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`size-24 rounded-3xl flex items-center justify-center shadow-5xl transition-all transform hover:scale-110 active:scale-95 z-[201] border-2 ${isChatOpen ? 'bg-white border-primary text-primary rotate-180' : 'bg-primary border-white/20 text-white shadow-glow'}`}
           >
              {isChatOpen ? <X size={40}/> : <Brain size={44} className="animate-pulse fill-current"/>}
           </button>
        </div>

        {/* --- PROFILE DETAIL DRAWER --- */}
        {selectedProfile && (
           <div className="fixed inset-0 z-[300] flex justify-end">
              <div className="absolute inset-0 bg-black/98 backdrop-blur-3xl" onClick={() => setSelectedProfileId(null)}/>
              <aside className="w-[600px] h-full bg-[#090b10] border-l border-white/10 shadow-5xl flex flex-col relative z-[301] animate-in slide-in-from-right duration-400">
                 <div className="p-10 border-b border-white/5 bg-[#121620]/80 backdrop-blur-xl flex items-center justify-between shadow-4xl">
                    <div className="flex items-center gap-8">
                       <div className="size-20 rounded-3xl bg-primary/10 border border-primary/40 flex items-center justify-center font-black text-5xl text-primary shadow-glow uppercase">
                          {selectedProfile.username[0]}
                       </div>
                       <div>
                          <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none mb-2">{selectedProfile.username}</h2>
                          <div className="flex items-center gap-3">
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2"><Store size={12}/> {selectedProfile.bookie}</span>
                             <div className="h-3 w-[1px] bg-white/10"></div>
                             <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{selectedProfile.ownerName}</span>
                          </div>
                       </div>
                    </div>
                    <button onClick={() => setSelectedProfileId(null)} className="p-4 text-slate-600 hover:text-white transition-all rounded-full bg-white/5 hover:bg-white/10 border border-white/5"><X size={28}/></button>
                 </div>

                 <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar pb-40">
                    <section className="grid grid-cols-2 gap-6">
                       <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/10 space-y-2 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Gauge size={60} className="text-primary"/></div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Health Score</p>
                          <p className={`text-6xl font-black font-mono leading-none tracking-tighter ${selectedProfile.healthScore > 80 ? 'text-emerald-500 shadow-glow-sm' : 'text-rose-500'}`}>{selectedProfile.healthScore}%</p>
                       </div>
                       <div className="p-8 bg-black/40 rounded-[2.5rem] border border-white/10 space-y-2 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><Wallet size={60} className="text-emerald-400"/></div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Capital Disponible</p>
                          <p className="text-6xl font-black text-white font-mono leading-none tracking-tighter">{fmtMoney(selectedProfile.balance)}</p>
                       </div>
                    </section>

                    <section className="space-y-6">
                       <h4 className="text-[12px] font-black text-white uppercase tracking-[0.4em] border-b border-white/5 pb-4 flex items-center gap-3"><Trophy size={16} className="text-primary"/> ADN Operativo</h4>
                       <div className="grid grid-cols-2 gap-6">
                          <DetailStatItem label="Deporte DNA" value={selectedProfile.favoriteSport} color="text-primary" />
                          <DetailStatItem label="Estilo de Juego" value={selectedProfile.betStyle} color="text-white" />
                          <DetailStatItem label="Stake Objetivo" value={`$${selectedProfile.avgStake}`} color="text-emerald-500" />
                          <DetailStatItem label="Frecuencia Semanal" value={`${selectedProfile.weeklyAvgBets} bets`} color="text-white" />
                          <DetailStatItem label="GGR Acumulado" value={fmtMoney(selectedProfile.ggrMonthly)} color="text-emerald-500" />
                          <DetailStatItem label="Rake Generado" value={fmtMoney(selectedProfile.rakeMonthly)} color="text-primary" />
                       </div>
                    </section>

                    <section className="space-y-6">
                       <h4 className="text-[12px] font-black text-white uppercase tracking-[0.4em] border-b border-white/5 pb-4 flex items-center gap-3"><History size={16} className="text-primary"/> Trades Recientes</h4>
                       <div className="bg-black/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
                          {selectedProfile.movements.map((m, i) => (
                             <div key={i} className="p-6 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all flex justify-between items-center">
                                <div>
                                   <p className="text-sm font-black text-white uppercase leading-none mb-1.5">{m.note}</p>
                                   <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{m.timestamp} • {m.type}</p>
                                </div>
                                <span className={`text-xl font-black font-mono tracking-tighter ${m.amount > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                   {m.amount > 0 ? '+' : ''}{fmtMoney(m.amount)}
                                </span>
                             </div>
                          ))}
                       </div>
                    </section>
                 </div>

                 <div className="p-10 border-t border-white/10 bg-[#121620]/95 backdrop-blur-3xl absolute bottom-0 left-0 w-full z-40 flex gap-6 shadow-5xl">
                    <button className="flex-1 py-6 bg-white/5 border border-white/10 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-2xl">
                       <ExternalLink size={24}/> IR AL BACKOFFICE
                    </button>
                    <button onClick={() => setSelectedProfileId(null)} className="flex-1 py-6 bg-primary text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-glow hover:bg-primary-hover active:scale-95 transition-all">
                       SALVAR CAMBIOS
                    </button>
                 </div>
              </aside>
           </div>
        )}
      </main>

      <footer className="bg-[#050608] border-t border-white/5 px-12 py-3 flex justify-between items-center">
         <div className="flex gap-12">
            <div className="flex items-center gap-4"><span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Motor Cuántico:</span><span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-4 py-1 rounded-full border border-primary/20 tracking-widest shadow-glow-sm">V4.10.0-STABLE</span></div>
         </div>
         <span className="text-[9px] font-bold text-slate-800 uppercase tracking-[1em]">WISEBET CORE OPERATIONAL PLATFORM • 2024</span>
      </footer>
    </div>
  );
};

// --- SUBCOMPONENTES ---

const MetricBox = ({ label, value, sub, color, icon, glow }: any) => (
  <div className={`p-6 rounded-[2.5rem] border transition-all duration-500 relative group overflow-hidden ${color === 'primary' ? 'bg-primary/5 border-primary/30 shadow-[0_0_60px_rgba(19,91,236,0.06)]' : 'bg-white/[0.02] border-white/10 hover:border-white/20 shadow-2xl'}`}>
    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>
    <div className="flex justify-between items-start mb-4">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</p>
        <div className="text-slate-700">{icon}</div>
    </div>
    <p className={`text-3xl font-black tabular-nums leading-none tracking-tighter ${color === 'success' ? 'text-emerald-500' : color === 'danger' ? 'text-rose-500' : color === 'primary' ? 'text-primary' : 'text-white'} ${glow ? 'shadow-glow-sm' : ''}`}>{value}</p>
    <p className={`text-[9px] font-bold uppercase mt-3 tracking-widest ${color === 'danger' ? 'text-rose-400' : 'text-slate-700'}`}>{sub}</p>
  </div>
);

const LegendChip = ({ color, label }: any) => (
  <div className="flex items-center gap-3 px-4 py-2 bg-white/[0.04] rounded-xl border border-white/5 shadow-2xl">
     <div className={`size-3 rounded-full ${color}`} />
     <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">{label}</span>
  </div>
);

const RadarCell = ({ state, color, isToday, onClick }: any) => (
    <td className={`px-2 py-4 border-l border-white/[0.03] ${isToday ? 'bg-primary/10' : ''}`}>
       <div 
         onClick={onClick}
         className={`h-12 w-full rounded-xl ${color} flex flex-col items-center justify-center transition-all hover:scale-105 cursor-pointer active:scale-95 shadow-xl border border-white/5 group/cell`}
       >
          <span className="text-[11px] font-black uppercase tracking-widest font-mono">{state}</span>
          {isToday && <div className="absolute top-0 left-0 w-full h-0.5 bg-primary shadow-glow animate-pulse"></div>}
       </div>
    </td>
);

const DetailStatItem = ({ label, value, color }: any) => (
  <div className="p-6 rounded-2xl bg-black/40 border border-white/10 space-y-1 shadow-inner group hover:border-primary/40 transition-all">
     <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{label}</span>
     <p className={`text-xl font-black font-mono group-hover:scale-105 transition-all leading-none tracking-tighter ${color}`}>{value}</p>
  </div>
);

const fmtMoney = (v: number) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export default OperationalCenter;
