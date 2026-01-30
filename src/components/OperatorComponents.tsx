
import React, { useState, useMemo } from 'react';
import {
    Zap, Clock, Play, AlertCircle, CheckCircle2, XCircle, Timer,
    Filter, ArrowRight, BarChart3, ListChecks, Wallet, UserRound,
    TrendingUp, LayoutDashboard, History, Flame, Edit3,
    Terminal as TerminalIcon, Plus, Layers, Send, Award, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// --- SHARED TYPES ---
export type PickStatus = 'NEW' | 'PARTIAL' | 'PLACED' | 'WAITING_LIVE' | 'EXPIRED' | 'BLOCKED';
export type Sport = 'Fútbol' | 'Tenis' | 'Basket' | 'Esports';

export interface PickSource {
    id: string;
    sport: Sport;
    league: string;
    startTime: string; // HH:mm or 'LIVE'
    startDateTime?: string; // ISO for sorting
    event: string;
    market: string;
    selection?: string;
    fairOdd: number;
    minOdd: number;
    recommendedStake: number;
    placedStake: number;
    status: PickStatus;
    isLive: boolean;
    source: string; // 'API', 'MANUAL', 'TELEGRAM', etc.
    receivedAt: string; // HH:mm time of arrival
    notes?: string;
    bookieOdds: Record<string, { odd: number; liquidity?: number }>;
}

export interface KpiStats {
    capitalDisponibles: number;
    apuestasRealizadas: number;
    totalApostado: number;
    perfilesActivos: number;
    pendingCount: number;
    urgentCount: number;
    inProgressCount: number;
    completedToday: number;
    slippageAvg: number;
}

// --- SUB-COMPONENT: OPERATOR KPI ROW ---
const OperatorKpiRow = ({ stats }: { stats: KpiStats }) => {
    return (
        <div className="space-y-6">
            {/* ACTION PIPELINE / QUEUE STATUS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <PipelineCard
                    label="Pendientes"
                    count={stats.pendingCount}
                    color="white"
                    icon={<Clock size={16} />}
                    borderStyle="border-white/10"
                />
                <PipelineCard
                    label="Urgentes (<15m)"
                    count={stats.urgentCount}
                    color="#f59e0b"
                    icon={<AlertCircle size={16} />}
                    active={stats.urgentCount > 0}
                    borderStyle="border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                />
                <PipelineCard
                    label="En Progreso"
                    count={stats.inProgressCount}
                    color="#3b82f6"
                    icon={<Play size={16} />}
                    borderStyle="border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.15)]"
                />
                <PipelineCard
                    label="Completadas"
                    count={stats.completedToday}
                    color="#00ff88"
                    icon={<CheckCircle2 size={16} />}
                    borderStyle="border-[#00ff88]/30"
                />
                <PipelineCard
                    label="Slippage Medio"
                    count={`${stats.slippageAvg}%`}
                    color={stats.slippageAvg > 0 ? '#00ff88' : '#ef4444'}
                    icon={<TrendingUp size={16} />}
                    isText
                    bgGradient="bg-gradient-to-br from-white/[0.05] to-transparent"
                />
            </div>

            {/* FINANCIAL HEALTH BADGES (Compact Metadata) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl backdrop-blur-sm">
                <MiniStat label="Capital Disponible" val={`$${stats.capitalDisponibles.toLocaleString()}`} icon={<Wallet size={14} />} />
                <MiniStat label="Volumen Total" val={`$${stats.totalApostado.toLocaleString()}`} icon={<BarChart3 size={14} />} />
                <MiniStat label="Apuestas Hoy" val={stats.apuestasRealizadas} icon={<ListChecks size={14} />} />
                <MiniStat label="Perfiles Activos" val={stats.perfilesActivos} icon={<UserRound size={14} />} color="#00ff88" />
            </div>
        </div>
    );
};

const PipelineCard = ({ label, count, color, icon, active, isText, borderStyle = "border-white/5", bgGradient }: any) => (
    <div className={`
        relative p-4 rounded-xl border flex items-center justify-between transition-all overflow-hidden group
        ${active ? 'bg-amber-500/5' : 'bg-[#0a0a0a]/60 backdrop-blur-md'}
        ${borderStyle}
        hover:border-white/20 hover:bg-white/5
    `}>
        {bgGradient && <div className={`absolute inset-0 opacity-20 pointer-events-none ${bgGradient}`} />}

        <div className="relative z-10 w-full">
            <p className="text-[9px] font-black text-[#666] uppercase tracking-wider mb-1 flex items-center gap-1.5 group-hover:text-[#888] transition-colors">
                <span style={{ color: active ? '#f59e0b' : '#333' }} className="transition-colors duration-300">{icon}</span> {label}
            </p>
            <p className={`text-2xl font-black italic tracking-tighter ${isText ? '' : 'tabular-nums font-mono'}`} style={{ color: color, textShadow: `0 0 10px ${color}33` }}>{count}</p>
        </div>
    </div>
);

const MiniStat = ({ label, val, icon, color }: any) => (
    <div className="flex items-center gap-3 px-2">
        <div className="text-[#333]">{icon}</div>
        <div>
            <p className="text-[8px] font-black text-[#444] uppercase tracking-widest">{label}</p>
            <p className="text-sm font-black text-white italic font-mono" style={{ color }}>{val}</p>
        </div>
    </div>
);


// --- SUB-COMPONENT: SIGNALS QUEUE ---
const SignalsQueue = ({ picks, onExecute, onViewDetail }: { picks: PickSource[], onExecute: (pick: PickSource) => void, onViewDetail: (pick: PickSource) => void }) => {
    const [filter, setFilter] = useState<'ALL' | 'URGENT' | 'PENDING'>('ALL');

    const filteredPicks = useMemo(() => {
        let p = [...picks];
        if (filter === 'URGENT') p = p.filter(x => x.status === 'NEW' && x.startTime !== 'LIVE');
        if (filter === 'PENDING') p = p.filter(x => x.status === 'NEW' || x.status === 'PARTIAL');
        return p.sort((a, b) => (a.startDateTime || a.startTime).localeCompare(b.startDateTime || b.startTime));
    }, [picks, filter]);

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap gap-4 justify-between items-center bg-[#0c0c0c] p-1 rounded-xl w-full border border-white/5">
                <div className="flex gap-1">
                    <QueueTab label="Todas" active={filter === 'ALL'} onClick={() => setFilter('ALL')} count={picks.length} />
                    <QueueTab label="Pendientes" active={filter === 'PENDING'} onClick={() => setFilter('PENDING')} count={picks.filter(p => p.status === 'NEW' || p.status === 'PARTIAL').length} />
                    <QueueTab label="Urgentes" active={filter === 'URGENT'} onClick={() => setFilter('URGENT')} count={picks.filter(p => p.status === 'NEW' && p.startTime !== 'LIVE').length} isUrgent />
                </div>
            </div>

            <div className="flex flex-col gap-3">
                {filteredPicks.length === 0 && (
                    <div className="py-12 bg-white/[0.01] border border-dashed border-white/5 rounded-2xl text-center">
                        <p className="text-[10px] font-black uppercase text-[#333] tracking-widest">Cola de ejecución limpia</p>
                    </div>
                )}
                {filteredPicks.map((pick) => (
                    <SignalRow key={pick.id} pick={pick} onAction={() => onExecute(pick)} onClick={() => onViewDetail(pick)} />
                ))}
            </div>
        </section>
    );
};

const QueueTab = ({ label, active, onClick, count, isUrgent }: any) => (
    <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${active ? (isUrgent ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.4)]' : 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.3)]') : 'text-[#555] hover:text-white'}`}>
        {label} <span className={`px-1.5 py-0.5 rounded text-[8px] ${active ? 'bg-black/20' : 'bg-white/10'}`}>{count}</span>
    </button>
);

interface SignalRowProps {
    pick: PickSource;
    onAction: () => void;
    onClick: () => void;
}

const SignalRow: React.FC<SignalRowProps> = ({ pick, onAction, onClick }) => {
    // Determine Source Badge Color & Icon
    const getSourceStyle = (source: string) => {
        const s = source.toUpperCase();
        if (s.includes('TELEGRAM')) return { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', icon: <Send size={9} /> };
        if (s.includes('WINNERODDS')) return { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', icon: <Target size={9} /> };
        if (s.includes('WINTIPSTER')) return { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20', icon: <Award size={9} /> };
        if (s.includes('MANUAL')) return { color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20', icon: <Edit3 size={9} /> };
        return { color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20', icon: <Zap size={9} /> };
    };

    const sourceStyle = getSourceStyle(pick.source);
    const isLive = pick.startTime === 'LIVE' || pick.isLive;

    return (
        <div onClick={onClick} className="group relative bg-[#0a0a0a]/80 backdrop-blur-sm border border-white/5 hover:border-[#00ff88]/30 rounded-xl p-0 transition-all flex items-stretch justify-between overflow-hidden cursor-pointer hover:bg-white/[0.03] hover:shadow-[0_4px_20px_rgba(0,0,0,0.5)]">

            {/* 1. TIMING STRIP & LOGISTICS */}
            <div className="w-[110px] bg-white/[0.02] border-r border-white/5 flex flex-col items-center justify-between p-3 py-4 group-hover:bg-white/[0.04] transition-colors">
                <div className="text-center">
                    <p className="text-[8px] font-black text-[#555] uppercase mb-0.5 tracking-wider">Inicio</p>
                    <p className={`text-base font-black italic tracking-tighter ${isLive ? 'text-red-500 animate-pulse drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]' : 'text-white'}`}>
                        {pick.startTime}
                    </p>
                </div>

                {/* DISTRIBUTOR BADGE */}
                <div className={`mt-2 px-2 py-1 rounded text-[8px] font-black uppercase border ${sourceStyle.bg} ${sourceStyle.border} ${sourceStyle.color} flex items-center justify-center gap-1.5 w-full`}>
                    {sourceStyle.icon}
                    <span className="truncate max-w-[60px]">{pick.source.replace(/^(📢|🤖|👤)\s*/, '')}</span>
                </div>
            </div>

            {/* 2. MAIN CONTEXT */}
            <div className="flex-1 p-4 pl-5 flex flex-col justify-center gap-1">
                <div className="flex items-center gap-3">
                    {/* Sport Indicator */}
                    <span className="text-[9px] font-black text-[#444] bg-white/5 px-2 py-0.5 rounded uppercase flex items-center gap-1.5 border border-white/5">
                        <div className={`size-1.5 rounded-full ${pick.sport === 'Fútbol' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : pick.sport === 'Tenis' ? 'bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.5)]' : 'bg-amber-500'}`} />
                        {pick.sport}
                    </span>
                    <p className="text-[10px] font-black text-[#00ff88] uppercase tracking-wide opacity-80">{pick.league}</p>

                    {/* Time Received - IMPROVED READABILITY */}
                    <span className="text-[9px] font-bold text-[#555] ml-auto flex items-center gap-1 bg-black/40 px-2 py-0.5 rounded border border-white/5">
                        <History size={10} /> Recibido: {pick.receivedAt}
                    </span>
                </div>

                <div className="flex items-baseline gap-4 mt-1">
                    <h4 className="text-lg font-black italic text-white truncate max-w-lg leading-tight group-hover:text-[#00ff88] transition-colors duration-300">
                        {pick.event}
                    </h4>
                </div>

                <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px] font-bold text-[#ccc] uppercase bg-white/[0.05] px-2 py-1 rounded border border-white/5">{pick.market}</p>
                    {pick.selection && <p className="text-[10px] font-black text-[#00ff88] italic uppercase flex items-center gap-1"><ArrowRight size={10} /> {pick.selection}</p>}
                </div>
            </div>

            {/* 3. METRICS & ACTION */}
            <div className="w-[300px] bg-white/[0.01] border-l border-white/5 flex items-center justify-between p-4 pr-6 gap-6 group-hover:bg-white/[0.03] transition-colors">
                <div className="flex-1 flex justify-end gap-6">
                    <div className="text-right space-y-2">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-[#555] uppercase mb-0.5">Fair Odd</p>
                            <p className="text-[#00ff88] font-mono text-xl font-bold leading-none drop-shadow-[0_0_5px_rgba(0,255,136,0.2)]">@{pick.fairOdd.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="text-right space-y-2">
                        <div className="flex flex-col items-end">
                            <p className="text-[8px] font-black text-[#555] uppercase mb-0.5">Stake</p>
                            <p className="text-white font-mono text-xl font-bold leading-none italic drop-shadow-[0_0_5px_rgba(255,255,255,0.2)]">${pick.recommendedStake}</p>
                        </div>
                    </div>
                </div>

                {/* ENHANCED ACTION BUTTON */}
                <button
                    onClick={(e) => { e.stopPropagation(); onAction(); }}
                    className="size-14 bg-[#00ff88] text-black rounded-xl flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_30px_rgba(0,255,136,0.6)] hover:scale-105 active:scale-95 group/btn relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300 pointer-events-none mb-10 rotate-12" />
                    <Zap size={24} className="fill-black stroke-black relative z-10" />
                </button>
            </div>
        </div>
    );
};

export { OperatorKpiRow, SignalsQueue };