
import React, { useState } from 'react';
import {
    LayoutDashboard, History, Flame, Terminal as TerminalIcon, Plus, Filter,
    X, Wallet, ListChecks, BarChart, UserRound, Zap, Clock, Play,
    Calendar, Trophy, ChevronDown, Search, Settings, Radio, Server
} from 'lucide-react';
import { OperatorKpiRow, SignalsQueue, PickSource, Sport } from './OperatorComponents';
import { NetworkHierarchy, Profile } from './NetworkHierarchy';
import { ExecutionHistoryTable, ExecutedBet } from './ExecutionHistoryTable';
import { ManualBetModal, ProfileDetailsDrawer } from './OperatorDrawers';
import { AdsPowerOrchestrator } from './AdsPowerOrchestrator';
import { TradingZoneModal } from './TradingZoneModal';
import { MOCK_PROFILES_V8 } from '../services/tradingZoneMocks';

// --- NEW SIGNAL DETAIL MODAL ---
const SignalDetailModal = ({ pick, onClose, onExecute, onSaveNotes }: { pick: PickSource, onClose: () => void, onExecute: () => void, onSaveNotes: (id: string, notes: string) => void }) => {
    const [notes, setNotes] = useState(pick.notes || '');

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col group ring-1 ring-white/5">
                {/* Neon Glow Background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00ff88] rounded-full blur-[120px] opacity-[0.05] pointer-events-none" />

                {/* Header */}
                <div className="p-8 pb-6 border-b border-white/5 flex justify-between items-start relative z-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                                {pick.sport}
                            </span>
                            <span className="text-xs font-bold text-[#666] uppercase tracking-wide">{pick.league}</span>
                        </div>
                        <h2 className="text-3xl font-black italic text-white leading-none uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{pick.event}</h2>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-[#444] uppercase">
                            <span className="flex items-center gap-1"><Clock size={12} /> Inicio: {pick.startTime}</span>
                            <span className="flex items-center gap-1"><Zap size={12} /> Fuente: {pick.source} ({pick.receivedAt})</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#333] hover:text-white transition-colors bg-white/5 rounded-xl hover:bg-white/10 ring-1 ring-white/5"><X size={20} /></button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-8 bg-black/20 relative z-10">
                    {/* Market & Odds */}
                    <div className="flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-2xl backdrop-blur-md">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-[#555] uppercase tracking-wider">Mercado / Selección</p>
                            <div className="flex items-center gap-3">
                                <p className="text-sm font-bold text-[#ccc] uppercase">{pick.market}</p>
                                {pick.selection && <span className="text-sm font-black text-[#00ff88] italic px-2 py-0.5 bg-[#00ff88]/10 rounded border border-[#00ff88]/20">👉 {pick.selection}</span>}
                            </div>
                        </div>
                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-[9px] font-black text-[#666] uppercase mb-1">Fair Odd</p>
                                <p className="text-2xl font-mono font-bold text-[#00ff88] drop-shadow-[0_0_8px_rgba(0,255,136,0.3)]">@{pick.fairOdd}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] font-black text-[#666] uppercase mb-1">Min Odd</p>
                                <p className="text-2xl font-mono font-bold text-white/50">@{pick.minOdd}</p>
                            </div>
                            <div className="text-center pl-8 border-l border-white/5">
                                <p className="text-[9px] font-black text-[#666] uppercase mb-1">Stake Rec.</p>
                                <p className="text-2xl font-black text-white italic drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] font-mono">${pick.recommendedStake}</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes Area */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#444] uppercase tracking-widest flex items-center gap-2">
                            Notas del Operador <span className="text-[#333] font-normal lowercase">(Opcional)</span>
                        </label>
                        <textarea
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            placeholder="Agregar detalles tácticos, advertencias o contexto..."
                            className="w-full h-24 bg-black/40 border border-white/5 rounded-xl p-4 text-xs text-[#ccc] placeholder:text-[#333] focus:border-[#00ff88]/30 outline-none resize-none transition-colors"
                        />
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-[#080808] border-t border-white/5 flex gap-4 relative z-10">
                    <button onClick={() => { onSaveNotes(pick.id, notes); onClose(); }} className="flex-1 py-4 text-[10px] font-black uppercase text-[#666] hover:text-white bg-white/[0.02] hover:bg-white/5 rounded-xl transition-all border border-white/5">
                        Guardar & Cerrar
                    </button>
                    <button onClick={() => { onSaveNotes(pick.id, notes); onExecute(); }} className="flex-[2] py-4 bg-[#00ff88] text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_30px_rgba(0,255,136,0.2)] hover:shadow-[0_0_50px_rgba(0,255,136,0.4)] hover:scale-[1.01] transition-all flex items-center justify-center gap-2 group/execute border border-[#00ff88]/50">
                        <Zap size={18} className="fill-current group-hover/execute:rotate-12 transition-transform" /> EJECUTAR SEÑAL
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- TYPES & MOCK ---
const PREMATCH_PICKS: PickSource[] = [
    {
        id: 'P-101', sport: 'Fútbol', league: 'La Liga', startTime: '21:00', event: 'Real Madrid vs Barcelona',
        market: 'Match Winner', selection: 'Real Madrid', fairOdd: 2.10, minOdd: 2.05, recommendedStake: 1000, placedStake: 0,
        status: 'NEW', isLive: false, source: '🤖 BOT-ALA', receivedAt: '20:45', notes: 'El Clásico - Alta liquidez esperada', bookieOdds: {}
    },
    {
        id: 'P-102', sport: 'Tenis', league: 'Roland Garros', startTime: 'LIVE', event: 'Nadal vs Djoko',
        market: 'Winner', selection: 'Nadal', fairOdd: 1.85, minOdd: 1.80, recommendedStake: 500, placedStake: 0,
        status: 'WAITING_LIVE', isLive: true, source: '👤 MANUAL', receivedAt: '12:00', bookieOdds: {}
    },
    {
        id: 'P-103', sport: 'Basket', league: 'NBA', startTime: '02:00', event: 'Lakers vs Warriors',
        market: 'Total Points', selection: 'Over 225.5', fairOdd: 1.90, minOdd: 1.85, recommendedStake: 800, placedStake: 0,
        status: 'NEW', isLive: false, source: '📢 TELEGRAM', receivedAt: '01:30', bookieOdds: {}
    }
];

// Deprecated local mocks, using tradingZoneMocks.ts instead
const MOCK_PROFILES = MOCK_PROFILES_V8 as any;

const MOCK_EXECUTIONS: ExecutedBet[] = [
    { id: 'EX-1', time: '14:20', league: 'Premier L.', event: 'Arsenal vs Chelsea', market: 'Over 2.5', selection: 'Yes', odd: 1.95, stake: 500, profit: 0, status: 'PENDING', profileId: 'OKIBET_01', house: 'OKIBET' },
    { id: 'EX-2', time: '12:00', league: 'ATP Rome', event: 'Nadal vs Djoko', market: 'Winner', selection: 'Nadal', odd: 2.10, stake: 300, profit: 330, status: 'WIN', profileId: '1X_05', house: '1XBET' },
];

const OperatorTerminal: React.FC = () => {
    const [view, setView] = useState<'DASHBOARD' | 'PREMATCH' | 'LIVE'>('DASHBOARD');
    const [picks, setPicks] = useState<PickSource[]>(PREMATCH_PICKS);
    const [selectedPick, setSelectedPick] = useState<PickSource | null>(null);
    const [selectedProfileDetail, setSelectedProfileDetail] = useState<Profile | null>(null);
    const [drawerTab, setDrawerTab] = useState<'resumen' | 'dna' | 'finanzas'>('resumen');

    // Filters State
    const [activeSport, setActiveSport] = useState<Sport | 'ALL'>('ALL');
    const [activeSource, setActiveSource] = useState<'ALL' | 'TELEGRAM' | 'WINNERODDS' | 'MANUAL'>('ALL');

    const [isManualModalOpen, setIsManualModalOpen] = useState(false);

    // TRADING ZONE STATE
    const [tradingPick, setTradingPick] = useState<PickSource | null>(null);
    const [tradingProfile, setTradingProfile] = useState<Profile | null>(null);

    // ORCHESTRATOR STATE
    const [isOrchestratorOpen, setIsOrchestratorOpen] = useState(false);

    // Filter Logic
    const filteredPicks = picks.filter(p => {
        if (view === 'PREMATCH' && p.isLive) return false;
        if (view === 'LIVE' && !p.isLive) return false;
        if (activeSport !== 'ALL' && p.sport !== activeSport) return false;
        // Simple source filter check
        if (activeSource !== 'ALL' && !p.source.toUpperCase().includes(activeSource)) return false;
        return true;
    });

    // Derived Stats
    const stats = {
        capitalDisponibles: 85413,
        apuestasRealizadas: 12,
        totalApostado: 4500,
        perfilesActivos: 28,
        pendingCount: picks.filter(p => p.status === 'NEW').length,
        urgentCount: picks.filter(p => p.status === 'NEW' && p.startTime !== 'LIVE').length,
        inProgressCount: picks.filter(p => p.status === 'PARTIAL').length,
        completedToday: 15,
        slippageAvg: 0.2
    };

    const handleExecute = (pick: PickSource) => {
        setTradingPick(pick);
    };

    const handleSaveNotes = (id: string, notes: string) => {
        setPicks(prev => prev.map(p => p.id === id ? { ...p, notes } : p));
    };

    const handleManualRegister = (data: any) => {
        const newPick: PickSource = {
            id: `M-${Date.now()}`,
            sport: 'Fútbol',
            league: data.league || 'MANUAL LEAGUE',
            startTime: data.startTime || 'PENDING',
            startDateTime: new Date().toISOString(),
            event: data.event || 'MANUAL MATCH',
            market: data.market || 'MANUAL MARKET',
            selection: data.selection || 'MANUAL SELECTION',
            fairOdd: Number(data.fairOdd) || 2.00,
            minOdd: Number(data.minOdd) || 1.90,
            recommendedStake: Number(data.recommendedStake) || 100,
            placedStake: 0,
            status: 'NEW',
            isLive: false,
            source: '👤 MANUAL',
            receivedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            notes: 'Registro manual por operador',
            bookieOdds: {}
        };
        setPicks(prev => [newPick, ...prev]);
        setIsManualModalOpen(false);
    };

    return (
        <div className="w-full h-full bg-[#020202] text-[#f0f0f0] flex overflow-hidden font-sans selection:bg-[#00ff88]/30">
            {/* SIDEBAR NAVIGATION */}
            <aside className="w-20 bg-[#050505] border-r border-white/5 flex flex-col items-center py-6 gap-8 shrink-0 z-50 shadow-[4px_0_20px_rgba(0,0,0,0.5)]">
                <div className="size-12 bg-gradient-to-br from-[#00ff88] to-[#00b560] text-black rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.3)] cursor-pointer hover:scale-105 transition-transform" onClick={() => setView('DASHBOARD')}>
                    <TerminalIcon size={24} />
                </div>
                <nav className="flex flex-col gap-6 w-full px-2">
                    <SidebarItem label="Dash" active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} icon={<LayoutDashboard size={22} />} />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <SidebarItem label="Pre" active={view === 'PREMATCH'} onClick={() => setView('PREMATCH')} icon={<Calendar size={22} />} />
                    <SidebarItem label="Live" active={view === 'LIVE'} onClick={() => setView('LIVE')} icon={<Radio size={22} className={view === 'LIVE' ? "animate-pulse text-red-500" : ""} />} />
                    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <SidebarItem label="Hist" active={false} onClick={() => { }} icon={<History size={22} />} />
                    <SidebarItem label="Profiles" active={false} onClick={() => { }} icon={<UserRound size={22} />} />
                </nav>
                <div className="mt-auto flex flex-col gap-4">
                    <button className="size-10 rounded-xl flex items-center justify-center text-[#444] hover:text-white transition-colors hover:bg-white/5">
                        <Settings size={20} />
                    </button>
                </div>
            </aside>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col overflow-hidden relative bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00ff8805] via-[#020202] to-[#020202]">

                {/* HEADER */}
                <header className="px-8 py-5 flex justify-between items-center z-40 bg-gradient-to-b from-[#020202] to-transparent">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 italic">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ff88] to-[#00b560]">WB</span>
                                <span className="text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">CONTROL DE MANDO</span>
                            </h1>
                            <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.3em] ml-1">Sistema de Ejecución V8.2</p>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2" />
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5 backdrop-blur-md">
                            <div className="size-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                            <p className="text-[10px] font-bold text-[#ccc] uppercase tracking-wider">Sistema Operativo</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right hidden xl:block">
                            <p className="text-[10px] font-black text-[#666] uppercase tracking-widest">Operador</p>
                            <p className="text-sm font-bold text-white">Nicolás Ullauri</p>
                        </div>
                        <div className="size-10 rounded-full bg-white/10 border border-white/5 hidden xl:block" />

                        <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/5">
                            <button
                                onClick={() => window.location.hash = '#/ops/orchestrator'}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-lg text-[10px] font-black uppercase text-[#888] hover:text-white transition-all"
                            >
                                <Server size={14} /> Ir a Orchestrator
                            </button>
                        </div>

                        <button onClick={() => setIsManualModalOpen(true)} className="flex items-center gap-2 px-6 py-3 bg-[#00ff88] text-black text-[11px] font-black uppercase rounded-xl shadow-[0_0_20px_rgba(0,255,136,0.2)] hover:shadow-[0_0_30px_rgba(0,255,136,0.4)] hover:-translate-y-0.5 transition-all">
                            <Plus size={16} strokeWidth={3} /> Nuevo Registro
                        </button>
                    </div>
                </header>

                {/* CONTENT WRAPPER */}
                <div className="flex-1 flex overflow-hidden">

                    {/* MAIN SCROLL AREA */}
                    <main className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2 pb-40 scroll-smooth">
                        <div className="max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">

                            {/* 1. ACTION PIPELINE (KPIs) */}
                            <section>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.5em] text-center">Resumen Operativo</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                </div>
                                <OperatorKpiRow stats={stats} />
                            </section>

                            {/* 2. FILTER TOOLBAR & SIGNAL QUEUE */}
                            <section className="space-y-6">
                                {/* TOOLBAR */}
                                <div className="sticky top-0 z-30 flex items-center justify-between p-2 bg-[#0c0c0c]/80 backdrop-blur-xl border border-white/5 rounded-2xl shadow-xl">
                                    <div className="flex items-center gap-4 pl-4">
                                        <h3 className="text-[12px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                            <TerminalIcon size={14} className="text-[#00ff88]" /> Cola de Ejecución
                                        </h3>
                                        <div className="h-4 w-px bg-white/10" />

                                        {/* Sport Selectors */}
                                        <div className="flex gap-1">
                                            <FilterButton label="Todos" active={activeSport === 'ALL'} onClick={() => setActiveSport('ALL')} />
                                            <FilterButton label="Fútbol" active={activeSport === 'Fútbol'} onClick={() => setActiveSport('Fútbol')} dotColor="bg-green-500" />
                                            <FilterButton label="Tenis" active={activeSport === 'Tenis'} onClick={() => setActiveSport('Tenis')} dotColor="bg-orange-500" />
                                            <FilterButton label="Basket" active={activeSport === 'Basket'} onClick={() => setActiveSport('Basket')} dotColor="bg-amber-500" />
                                        </div>

                                        <div className="h-4 w-px bg-white/10" />

                                        {/* Source Selectors */}
                                        <div className="flex gap-1">
                                            <FilterButton label="Todos" active={activeSource === 'ALL'} onClick={() => setActiveSource('ALL')} />
                                            <FilterButton label="Telegram" active={activeSource === 'TELEGRAM'} onClick={() => setActiveSource('TELEGRAM')} />
                                            <FilterButton label="WinnerOdds" active={activeSource === 'WINNERODDS'} onClick={() => setActiveSource('WINNERODDS')} />
                                        </div>
                                    </div>

                                    <div className="pr-2">
                                        <div className="relative group">
                                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444] group-focus-within:text-[#00ff88] transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Buscar evento..."
                                                className="bg-black/40 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-white placeholder:text-[#333] focus:border-[#00ff88]/30 focus:outline-none w-48 transition-all focus:w-64"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <SignalsQueue picks={filteredPicks} onExecute={handleExecute} onViewDetail={(pick: PickSource) => setTradingPick(pick)} />
                            </section>

                            {/* 3. NETWORK MAP */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 mt-12">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">Network Topology</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>
                                <NetworkHierarchy profiles={MOCK_PROFILES} onProfileClick={(p) => {
                                    setTradingProfile(p);
                                    // If no pick selected, maybe auto-select the first suggestion or just open zone?
                                    // For now we open zone with profile context
                                    if (!tradingPick && filteredPicks.length > 0) {
                                        setTradingPick(filteredPicks[0]);
                                    }
                                }} />
                            </section>

                            {/* 4. HISTORY */}
                            <section>
                                <div className="flex items-center gap-3 mb-6 mt-12">
                                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">Historial de Ejecuciones</h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                                </div>
                                <ExecutionHistoryTable executions={MOCK_EXECUTIONS} />
                            </section>

                        </div>
                    </main>

                    {/* ADSPOWER ORCHESTRATOR PANEL */}
                    <AdsPowerOrchestrator isOpen={isOrchestratorOpen} onClose={() => setIsOrchestratorOpen(false)} />

                </div>


                {/* MODALS */}
                {isManualModalOpen && (
                    <ManualBetModal
                        onClose={() => setIsManualModalOpen(false)}
                        profiles={MOCK_PROFILES}
                        onConfirm={handleManualRegister}
                    />
                )}

                {selectedPick && (
                    <SignalDetailModal
                        pick={selectedPick}
                        onClose={() => setSelectedPick(null)}
                        onExecute={() => {
                            handleExecute(selectedPick);
                            setSelectedPick(null);
                        }}
                        onSaveNotes={handleSaveNotes}
                    />
                )}

                {selectedProfileDetail && (
                    <ProfileDetailsDrawer
                        profile={selectedProfileDetail}
                        onClose={() => setSelectedProfileDetail(null)}
                        drawerTab={drawerTab}
                        setDrawerTab={setDrawerTab}
                        onManualRegister={() => {
                            setSelectedProfileDetail(null);
                            setIsManualModalOpen(true);
                        }}
                    />
                )}
                {/* TRADING ZONE MODAL */}
                {(tradingPick || tradingProfile) && (
                    <TradingZoneModal
                        pick={tradingPick || (filteredPicks.length > 0 ? filteredPicks[0] : null)}
                        profile={tradingProfile}
                        profiles={MOCK_PROFILES}
                        onClose={() => {
                            setTradingPick(null);
                            setTradingProfile(null);
                        }}
                        onExecute={(data) => {
                            console.log("EXECUTING TRADE:", data);
                            setTradingPick(null);
                            setTradingProfile(null);
                        }}
                    />
                )}
            </div>
        </div>
    );
};

const SidebarItem = ({ label, active, onClick, icon }: any) => (
    <button onClick={onClick} className={`w-full aspect-square rounded-2xl flex flex-col gap-1 items-center justify-center transition-all group relative ${active ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.1)]' : 'text-[#444] hover:text-white hover:bg-white/5'}`}>
        {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#00ff88] rounded-r-full shadow-[0_0_10px_rgba(0,255,136,0.5)]" />}
        {icon}
        <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
);

const FilterButton = ({ label, active, onClick, dotColor }: any) => (
    <button onClick={onClick} className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${active ? 'bg-white text-black border-white' : 'bg-transparent text-[#666] border-transparent hover:bg-white/5 hover:text-white'}`}>
        {dotColor && <div className={`size-1.5 rounded-full ${dotColor}`} />}
        {label}
    </button>
);

export default OperatorTerminal;
