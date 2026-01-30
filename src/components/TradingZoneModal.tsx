
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    X, Calculator, Zap, AlertTriangle, CheckCircle2, ChevronDown, Split,
    ExternalLink, Chrome, Search, AlertCircle, RefreshCw, Lock, Unlock,
    Settings, RotateCcw, Info, History as HistoryIcon, Activity, Layers, Tag as TagIcon,
    ChevronRight, Save, Database, Trash2, Clock, Target, ListChecks, Terminal
} from 'lucide-react';
import { PickSource } from './OperatorComponents';
import { Profile } from './NetworkHierarchy';
import { ProfileItemV8, PickSourceV8 } from '../types/tradingZoneTypes';
import { ProfileDetailModal, HouseQuickCard, SettingsPanel } from './TradingZoneComponents';
import { useSplitEngine } from '../hooks/useSplitEngine';
import { MOCK_PROFILES_V8, MOCK_SCENARIOS_V8 } from '../services/tradingZoneMocks';

// --- TYPES & CONSTANTS ---
interface TradingZoneModalProps {
    pick: PickSourceV8 | null;
    profiles?: any[]; // Keep for compatibility but prioritize internal mock
    onClose: () => void;
    onExecute: (data: any) => void;
}

const ECOSYSTEM_MAP: Record<string, string[]> = {
    'ALTENAR': ['ECUABET', 'FUNPLAY', 'DATABET', 'TURBOBET', 'OKIBET', '4BET', 'BETFINE'],
    '1XGROUP': ['1XBET', 'MELBET', '22BET', '1XBIT'],
    'INTERNACIONAL': ['PINNACLE', 'BETINASIA', 'BETFURY', 'BETCAKE'],
    'SPORTBET': ['BETPROLIVE'],
    'SORTI': ['SORTI'],
};

interface SplitSettings {
    method: 'FIXED' | 'LIQUIDITY' | 'KELLY';
    roundTo: 1 | 5 | 10;
    maxProfiles: number;
    minMontoPerProfile: number;
    allowMaxStakeOverride: boolean;
    affinityWeight: number;
    maxBankrollPct: number;
    stakeRangePct: number;
    antiDetection: boolean;
}

const DEFAULT_SETTINGS: SplitSettings = {
    method: 'LIQUIDITY',
    roundTo: 5,
    maxProfiles: 10,
    minMontoPerProfile: 10,
    allowMaxStakeOverride: false,
    affinityWeight: 0.5,
    maxBankrollPct: 50,
    stakeRangePct: 50,
    antiDetection: true
};

// --- MAIN COMPONENT ---
export const TradingZoneModal: React.FC<TradingZoneModalProps> = ({ pick: initialPick, profiles: propProfiles, onClose, onExecute }) => {
    // --- STATE ---
    const [selectedPicks, setSelectedPicks] = useState<PickSourceV8[]>([initialPick || MOCK_SCENARIOS_V8[0]]);
    const activePick = selectedPicks[0]; // Primary pick for context
    const internalProfiles = useMemo(() => propProfiles && propProfiles.length > 0 ? propProfiles : MOCK_PROFILES_V8, [propProfiles]);

    const initialTotalMonto = useMemo(() => selectedPicks.reduce((acc, p) => acc + p.recommendedStake, 0), [selectedPicks]);
    const [totalMonto, setTotalMonto] = useState<number>(initialTotalMonto);

    // Auto-update totalMonto when selection changes IF user hasn't edited it manually? 
    // For now, let's just update it.
    useEffect(() => {
        setTotalMonto(initialTotalMonto);
    }, [initialTotalMonto]);

    const [manualCuotas, setManualCuotas] = useState<Record<string, number>>({});
    const [mode, setMode] = useState<'AUTO' | 'MANUAL'>('MANUAL');
    const [settings, setSettings] = useState<SplitSettings>(DEFAULT_SETTINGS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

    // Filters (Multi-Select Grouping)
    const [filterSports, setFilterSports] = useState<string[]>(activePick?.sport ? [activePick.sport] : []);
    const [filterStakes, setFilterStakes] = useState<string[]>([]);
    const [filterHouses, setFilterHouses] = useState<string[]>([]);
    const [showSelectedOnly, setShowSelectedOnly] = useState(false);
    const [focusedProfileId, setFocusedProfileId] = useState<string | null>(null);

    // Reset filters when pick changes (Default Sport Affinity)
    useEffect(() => {
        if (activePick) {
            setFilterSports([activePick.sport]);
            setTotalMonto(activePick.recommendedStake);
            pushLog(`Cargando Escenario: ${activePick.event} ($${activePick.recommendedStake})`);
        }
    }, [activePick]);

    // UI Local States
    const [expandedEcos, setExpandedEcos] = useState<string[]>(['ALTENAR']);
    const [selectedProfileDetail, setSelectedProfileDetail] = useState<ProfileItemV8 | null>(null);
    const [activeHousePopup, setActiveHousePopup] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [showExecutionSummary, setShowExecutionSummary] = useState(false);
    const [multiSignalEnabled, setMultiSignalEnabled] = useState(false);
    const [fleetPresets, setFleetPresets] = useState<any[]>(() => {
        try { return JSON.parse(localStorage.getItem('trading_fleet_presets') || '[]'); } catch (e) { return []; }
    });
    const [riskLimits, setRiskLimits] = useState<Record<string, number>>({
        'ALTENAR': 5000,
        '1XGROUP': 3000,
        'INTERNACIONAL': 10000
    });

    // Draft Persistence Engine
    const [hasDraft, setHasDraft] = useState(false);
    const draftKey = useMemo(() => `trading_draft_${activePick?.id}`, [activePick?.id]);

    // Logs System
    const [logs, setLogs] = useState<{ msg: string; time: string }[]>([]);
    const [showAuditHistory, setShowAuditHistory] = useState(false);
    const auditHistory = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('trading_audit_history') || '[]');
        } catch (e) { return []; }
    }, [showAuditHistory]);

    const pushLog = useCallback((msg: string) => {
        setLogs(prev => [{ msg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }, ...prev].slice(0, 5));
    }, []);

    // === FILTERS & COMPUTED v10.0 (Summarized Multi-Select) ===
    const filteredProfiles = useMemo(() => {
        return (internalProfiles as ProfileItemV8[]).filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(searchQuery.toLowerCase()) || p.bookie.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesSport = filterSports.length === 0 || filterSports.includes(p.sport);
            const matchesStake = filterStakes.length === 0 || filterStakes.includes((p.averageStake || 0).toString());
            const matchesHouse = filterHouses.length === 0 || filterHouses.includes(p.bookie.toUpperCase());

            // Maintain visibility if selected, so user can 'sum up' profiles from different filters
            const isSelected = selectedProfileIds.includes(p.id);
            return (matchesSearch && matchesSport && matchesStake && matchesHouse) || isSelected;
        });
    }, [internalProfiles, searchQuery, filterSports, filterStakes, filterHouses, selectedProfileIds]);

    const profilesForEngine = useMemo(() => {
        if (selectedProfileIds.length > 0) {
            // Use internalProfiles to ensure selected ones are never lost due to UI filtering
            return (internalProfiles as ProfileItemV8[]).filter(p => selectedProfileIds.includes(p.id));
        }
        return filteredProfiles;
    }, [filteredProfiles, selectedProfileIds, internalProfiles]);

    const { stakes, assigned, remaining, profileCount, setProfileStake, toggleLock, reset: resetEngine, redistribute, lockedProfiles } = useSplitEngine(
        totalMonto,
        profilesForEngine,
        mode,
        settings,
        activePick?.sport || 'Fútbol',
        selectedProfileIds.length > 0
    );

    // Persist Draft Effect
    useEffect(() => {
        const saved = localStorage.getItem(draftKey);
        if (saved) setHasDraft(true);
    }, [draftKey]);

    const saveDraft = useCallback(() => {
        const draftData = { totalMonto, manualCuotas, stakes, mode, settings };
        localStorage.setItem(draftKey, JSON.stringify(draftData));
        pushLog("Borrador guardado localmente");
        setHasDraft(true);
    }, [draftKey, totalMonto, manualCuotas, stakes, mode, settings, pushLog]);

    const restoreDraft = useCallback(() => {
        try {
            const saved = localStorage.getItem(draftKey);
            if (saved) {
                const data = JSON.parse(saved);
                setTotalMonto(data.totalMonto);
                setManualCuotas(data.manualCuotas);
                setMode(data.mode);
                setSettings(data.settings);
                pushLog("Borrador restaurado");
            }
        } catch (e) { console.error("Failed to restore draft", e); }
    }, [draftKey, pushLog]);

    // === COMPUTED ===
    // === COMPUTED v9.3: Hierarchical Grouping ===
    const ecosystemGroups = useMemo(() => {
        const groups: Record<string, Record<string, ProfileItemV8[]>> = {};
        Object.keys(ECOSYSTEM_MAP).forEach(k => groups[k] = {});
        groups['OTRAS'] = {};

        filteredProfiles.forEach(p => {
            const hasStake = (stakes[p.id] || 0) > 0;
            const isTargeted = selectedProfileIds.includes(p.id);
            if (showSelectedOnly && !hasStake && !isTargeted) return;

            const ecoKey = Object.keys(ECOSYSTEM_MAP).find(k => k === p.ecosystem || ECOSYSTEM_MAP[k].includes(p.bookie.toUpperCase())) || 'OTRAS';
            const houseKey = p.bookie || 'OTRAS';

            if (!groups[ecoKey][houseKey]) groups[ecoKey][houseKey] = [];
            groups[ecoKey][houseKey].push(p);
        });

        // Filter out empty ecosystems
        const finalMap: Record<string, Record<string, ProfileItemV8[]>> = {};
        Object.entries(groups).forEach(([eco, houses]) => {
            if (Object.keys(houses).length > 0) {
                finalMap[eco] = houses;
            }
        });

        return finalMap;
    }, [filteredProfiles, showSelectedOnly, stakes, selectedProfileIds]);

    const weightedAvgOdd = useMemo(() => {
        let totalWeight = 0;
        let weightedSum = 0;
        Object.entries(stakes).forEach(([id, stake]) => {
            if ((stake as number) <= 0) return;
            const profile = (internalProfiles as ProfileItemV8[]).find(p => p.id === id);
            const cuota = profile ? (manualCuotas[profile.bookie] || activePick?.fairOdd || 0) : (activePick?.fairOdd || 0);
            weightedSum += (cuota * (stake as number));
            totalWeight += (stake as number);
        });
        return totalWeight > 0 ? weightedSum / totalWeight : (activePick?.fairOdd || 0);
    }, [stakes, manualCuotas, activePick, internalProfiles]);

    const exposureByEco = useMemo(() => {
        const exposure: Record<string, number> = {};
        let grandTotal = 0;

        Object.entries(stakes).forEach(([id, amt]) => {
            const val = amt as number;
            if (val <= 0) return;
            const p = (internalProfiles as ProfileItemV8[]).find(x => x.id === id);
            if (!p) return;
            const eco = p.ecosystem || 'OTRAS';
            exposure[eco] = (exposure[eco] || 0) + val;
            grandTotal += val;
        });

        const alerts = Object.entries(exposure).filter(([eco, amt]) => amt > (riskLimits[eco] || 999999));

        return { exposure, grandTotal, alerts };
    }, [stakes, internalProfiles, riskLimits]);

    // Validation Rules
    const validation = useMemo(() => {
        const errors: string[] = [];
        const minCuotaThreshold = (activePick?.minOdd as number) || 0;

        // 1. Min Odd Check
        Object.entries(manualCuotas).forEach(([bookie, val]) => {
            const v = val as number;
            if (v > 0 && v < minCuotaThreshold) {
                errors.push(`Cuota en ${bookie} < mínima (${minCuotaThreshold})`);
            }
        });

        // 2. Stake Assigned Check
        const rem = remaining as number;
        if (rem > 1) errors.push(`Quedan $${rem.toFixed(0)} por asignar`);

        // 4. Missing Odds Check (Strict)
        let missingOdds = false;
        Object.entries(stakes).forEach(([id, stake]) => {
            const s = stake as number;
            if (s > 0) {
                const p = (internalProfiles as ProfileItemV8[]).find(x => x.id === id);
                if (p && (!manualCuotas[p.bookie] || manualCuotas[p.bookie] <= 0)) {
                    missingOdds = true;
                    errors.push(`Falta cuota en ${p.bookie}`);
                }
            }
        });

        return { isValid: errors.length === 0, errors, missingOdds };
    }, [manualCuotas, activePick, remaining, stakes, internalProfiles]);

    // === HANDLERS ===
    const handleCuotaChange = (bookie: string, val: string) => {
        const num = parseFloat(val) || 0;

        // Find ecosystem
        const eco = Object.keys(ECOSYSTEM_MAP).find(k => ECOSYSTEM_MAP[k].includes(bookie.toUpperCase()));

        setManualCuotas(prev => {
            const next = { ...prev, [bookie]: num };

            // Sync with other bookies in same ecosystem IF they don't have a value yet or if we want to force sync
            if (eco) {
                ECOSYSTEM_MAP[eco].forEach(b => {
                    if (b !== bookie.toUpperCase()) {
                        next[b] = num;
                    }
                });
            }
            return next;
        });

        pushLog(`Cuota ${bookie} -> ${num} (Sincronizado en ${eco || 'Otras'})`);
    };

    const handleOpenAdsPower = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        console.log(`[AdsPower] Opening profile: ${id}`);
        // Mock Function as per requirement
        const openProfileBrowser = (pid: string) => {
            pushLog(`Llamando bridge AdsPower para ${pid}...`);
            // In real app: api.launch(pid)
        };
        openProfileBrowser(id);
    };

    const toggleProfileSelection = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        setSelectedProfileIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleExecuteOperation = () => {
        if (!validation.isValid) return;

        if (exposureByEco.alerts.length > 0) {
            pushLog(`RIESGO BLOQUEADO: Exposición excedida en ${exposureByEco.alerts.map(a => a[0]).join(', ')}`);
            // Force user to review
            const confirmRisk = window.confirm(`ATENCIÓN: Se ha excedido el límite de riesgo en: ${exposureByEco.alerts.map(a => `${a[0]} ($${a[1]})`).join(', ')}. ¿Deseas continuar bajo tu responsabilidad?`);
            if (!confirmRisk) return;
        }

        setShowExecutionSummary(true);
    };

    const savePreset = (name: string) => {
        const newPreset = {
            id: Date.now(),
            name,
            filters: { filterSports, filterStakes, filterHouses },
            selection: selectedProfileIds
        };
        const updated = [...fleetPresets, newPreset];
        setFleetPresets(updated);
        localStorage.setItem('trading_fleet_presets', JSON.stringify(updated));
        pushLog(`Escuadrón "${name}" guardado.`);
    };

    const loadPreset = (preset: any) => {
        if (preset.filters.filterSports) setFilterSports(preset.filters.filterSports);
        else if (preset.filters.filterSport) setFilterSports(preset.filters.filterSport === 'ALL' ? [] : [preset.filters.filterSport]);

        if (preset.filters.filterStakes) setFilterStakes(preset.filters.filterStakes);
        else if (preset.filters.filterStake) setFilterStakes(preset.filters.filterStake === 'ALL' ? [] : [preset.filters.filterStake]);

        if (preset.filters.filterHouses) setFilterHouses(preset.filters.filterHouses);
        else if (preset.filters.filterHouse) setFilterHouses(preset.filters.filterHouse === 'ALL' ? [] : [preset.filters.filterHouse]);

        setSelectedProfileIds(preset.selection);
        pushLog(`Escuadrón "${preset.name}" cargado.`);
    };

    const confirmExecution = () => {
        const sessionData = {
            id: `session_${Date.now()}`,
            timestamp: new Date().toISOString(),
            picks: selectedPicks.map(p => ({ event: p.event, stake: p.recommendedStake })),
            stakes,
            cuotas: manualCuotas,
            weightedAvgOdd,
            totalMonto,
            exposure: exposureByEco.exposure
        };

        // Save to Audit History
        try {
            const history = JSON.parse(localStorage.getItem('trading_audit_history') || '[]');
            localStorage.setItem('trading_audit_history', JSON.stringify([sessionData, ...history].slice(0, 50)));
        } catch (e) { console.error("Audit log failed", e); }

        onExecute(sessionData);
        localStorage.removeItem(draftKey);
        pushLog("Operación Ejecutada y Auditada");
        setShowExecutionSummary(false);
    };

    const focusProfile = (id: string, ecosystem: string) => {
        // 1. Expand ecosystem
        if (!expandedEcos.includes(ecosystem)) {
            setExpandedEcos(prev => [...prev, ecosystem]);
        }

        // 2. Clear filters that might hide it
        setShowSelectedOnly(false);
        setSearchQuery('');

        // 3. Highlight and Scroll
        setFocusedProfileId(id);
        setTimeout(() => {
            const el = document.getElementById(`profile-card-${id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);

        // Clear highlight after 3s
        setTimeout(() => setFocusedProfileId(null), 3000);
    };

    if (!activePick) return null;

    return (
        <>
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200 selection:bg-[#00ff88]/30">
                <div className="w-full max-w-[1700px] h-[95vh] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col relative">

                    {/* --- HUD HEADER v22.0 (Balanced Hub) --- */}
                    <header className="h-[100px] shrink-0 bg-[#050505] border-b border-white/[0.03] grid grid-cols-3 items-center px-10 relative z-50 shadow-2xl">

                        {/* LEFT: Identity */}
                        <div className="flex justify-start">
                            <div className="flex items-center gap-6 bg-white/[0.04] border border-white/10 px-8 py-4 rounded-[2rem] shadow-2xl backdrop-blur-md ring-1 ring-white/5 animate-in slide-in-from-left duration-700 max-w-[320px]">
                                <div className="size-14 rounded-2xl bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] border border-[#00ff88]/20 shadow-[0_0_30px_rgba(0,255,136,0.2)]">
                                    <Zap size={28} fill="currentColor" className="animate-pulse" />
                                </div>
                                <div className="min-w-0">
                                    <h1 className="text-xl font-black italic text-white uppercase tracking-tighter leading-none truncate">{activePick?.event}</h1>
                                    <p className="text-[10px] font-bold text-[#666] uppercase tracking-[0.4em] mt-1.5 flex items-center gap-2">
                                        <div className="size-1.5 rounded-full bg-[#00ff88]" />
                                        {activePick?.sport} • {activePick?.market}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* CENTER: High-Res Stats */}
                        <div className="flex items-center gap-12 justify-center">
                            <div className="text-center group/stat">
                                <p className="text-[10px] font-black text-[#444] uppercase mb-1.5 tracking-[0.3em] group-hover:text-[#00ff88] transition-colors">Cuota Fair</p>
                                <p className="text-5xl font-black italic text-[#00ff88] tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(0,255,136,0.3)] group-hover:scale-110 transition-transform duration-500">{activePick?.fairOdd}</p>
                            </div>
                            <div className="h-14 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <div className="text-center group/stat">
                                <p className="text-[10px] font-black text-[#444] uppercase mb-1.5 tracking-[0.3em] group-hover:text-red-500 transition-colors">Cuota Min</p>
                                <p className="text-5xl font-black italic text-red-500 tracking-tighter tabular-nums group-hover:scale-110 transition-transform duration-500">{activePick?.minOdd}</p>
                            </div>
                            <div className="h-14 w-[1px] bg-gradient-to-b from-transparent via-white/20 to-transparent" />
                            <div className="text-center group/stat">
                                <p className="text-[10px] font-black text-[#444] uppercase mb-1.5 tracking-[0.3em] group-hover:text-white transition-colors">Stake Total</p>
                                <p className="text-5xl font-black italic text-white tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(255,255,255,0.1)] group-hover:scale-110 transition-transform duration-500">${activePick?.recommendedStake}</p>
                            </div>
                        </div>

                        {/* RIGHT: Engine & Tools */}
                        <div className="flex items-center gap-6 justify-end">
                            <div className="relative group/sel">
                                <button className="flex items-center gap-5 bg-[#0a0a0a] hover:bg-[#111] border border-white/10 px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95 group">
                                    <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center text-[#00ff88] group-hover:bg-[#00ff88]/10 transition-colors">
                                        <Layers size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none">Motor v2.0</p>
                                        <p className="text-[11px] font-black text-[#00ff88] uppercase mt-1">Sigs: {selectedPicks.length}</p>
                                    </div>
                                    <ChevronDown size={14} className="text-[#333] ml-2 group-hover:text-[#00ff88] transition-colors" />
                                </button>

                                <div className="absolute top-[calc(100%+12px)] right-0 w-[420px] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,1)] opacity-0 invisible group-hover/sel:opacity-100 group-hover/sel:visible transition-all z-50 p-4 backdrop-blur-3xl animate-in zoom-in-95 origin-top-right">
                                    <div className="px-5 py-4 border-b border-white/5 flex justify-between items-center mb-4">
                                        <span className="text-[10px] font-black text-[#555] uppercase tracking-[0.3em]">Inyección Táctica</span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setMultiSignalEnabled(!multiSignalEnabled); }}
                                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${multiSignalEnabled ? 'bg-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.2)]' : 'bg-white/5 text-[#444] border border-white/5'}`}
                                        >
                                            {multiSignalEnabled ? 'Multi-Mode Active' : 'Single Protocol'}
                                        </button>
                                    </div>
                                    <div className="space-y-1.5 max-h-[450px] overflow-y-auto custom-scrollbar p-1">
                                        {MOCK_SCENARIOS_V8.map(s => {
                                            const isSelected = selectedPicks.some(p => p.id === s.id);
                                            return (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        if (multiSignalEnabled) {
                                                            if (isSelected) {
                                                                if (selectedPicks.length > 1) setSelectedPicks(prev => prev.filter(p => p.id !== s.id));
                                                            } else {
                                                                setSelectedPicks(prev => [...prev, s]);
                                                            }
                                                        } else {
                                                            setSelectedPicks([s]);
                                                            setTotalMonto(s.recommendedStake);
                                                            pushLog(`Transacción: ${s.event}`);
                                                        }
                                                    }}
                                                    className={`w-full p-5 rounded-[1.5rem] text-left transition-all border group/item ${isSelected ? 'bg-[#00ff88]/5 border-[#00ff88]/30 shadow-inner' : 'border-transparent hover:bg-white/5'}`}
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div className="min-w-0">
                                                            <p className={`text-[15px] font-black uppercase tracking-tight truncate transition-all ${isSelected ? 'text-[#00ff88] translate-x-1' : 'text-white/80'}`}>{s.event}</p>
                                                            <p className="text-[9px] font-bold text-[#444] uppercase mt-1 tracking-widest">{s.market}</p>
                                                        </div>
                                                        <div className="text-right shrink-0 ml-4">
                                                            <span className="text-sm font-black text-white italic tabular-nums">{s.fairOdd}</span>
                                                            <p className="text-[8px] font-black text-[#00ff88] uppercase mt-1">${s.recommendedStake}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="w-[1px] h-10 bg-white/5" />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAuditHistory(!showAuditHistory)}
                                    className={`size-11 flex items-center justify-center rounded-2xl transition-all border ${showAuditHistory ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'bg-white/5 text-[#444] border-white/5 hover:text-white hover:bg-white/10'}`}
                                    title="Historial de Auditoría"
                                >
                                    <HistoryIcon size={18} />
                                </button>
                                <button onClick={saveDraft} className="size-11 flex items-center justify-center rounded-2xl bg-white/5 text-[#444] border border-white/5 hover:text-[#00ff88] hover:bg-[#00ff88]/5 transition-all" title="Guardar Borrador">
                                    <Save size={18} />
                                </button>
                                <button onClick={onClose} className="size-11 flex items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/10 hover:bg-red-500 hover:text-white transition-all" title="Cerrar Terminal">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>
                    </header>

                    <div className="flex-1 flex overflow-hidden bg-[#050505] relative">

                        {/* --- LEFT PANEL (Fleet Scanner) --- */}
                        <div className="flex-1 flex flex-col border-r border-white/5 relative z-10 overflow-hidden">

                            {/* Control Bar & Filters */}
                            <div className="shrink-0 border-b border-white/5 bg-black/40 backdrop-blur-md relative z-20">
                                <div className="h-[120px] px-10 flex flex-col justify-center gap-4">
                                    <div className="flex items-center justify-between gap-10">
                                        <div className="flex items-center gap-6 flex-1">
                                            <div className="relative group flex-1 max-w-xl">
                                                <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-[#333] group-focus-within:text-[#00ff88] transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Escanear Perfil / Operador..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full bg-[#080808] border border-white/10 rounded-[1.5rem] py-4 pl-14 pr-6 text-[12px] font-black text-white placeholder-[#222] outline-none focus:border-[#00ff88]/30 focus:ring-4 focus:ring-[#00ff88]/5 transition-all font-mono"
                                                />
                                            </div>
                                            <div className="flex bg-[#0c0c0c] p-1.5 rounded-[1.5rem] border border-white/10 shadow-inner">
                                                <button onClick={() => setMode('AUTO')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${mode === 'AUTO' ? 'bg-[#00ff88] text-black shadow-[0_0_30px_rgba(0,255,136,0.3)] scale-105' : 'text-[#555] hover:text-white'}`}>Auto-Intelligence</button>
                                                <button onClick={() => setMode('MANUAL')} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase transition-all ${mode === 'MANUAL' ? 'bg-white text-black shadow-[0_0_30px_rgba(255,255,255,0.1)]' : 'text-[#555] hover:text-white'}`}>Dirección Manual</button>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {selectedProfileIds.length > 0 && (
                                                <button
                                                    onClick={() => setSelectedProfileIds([])}
                                                    className="px-6 py-3 bg-red-500/10 text-red-500 text-[10px] font-black uppercase rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all animate-in zoom-in-95"
                                                >
                                                    Liberar Selección ({selectedProfileIds.length})
                                                </button>
                                            )}
                                            <button onClick={() => setShowSettings(!showSettings)} className={`size-12 flex items-center justify-center rounded-2xl transition-all border ${showSettings ? 'bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20' : 'bg-white/5 text-[#444] border-white/5 hover:text-white hover:bg-white/10'}`}>
                                                <Settings size={22} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tactical Filters v23.5 (Summarized Dropdowns) */}
                                    <div className="flex items-center gap-4 py-1 relative z-[60]">
                                        <TacticalDropdown
                                            label="Sport"
                                            icon={Activity}
                                            options={Array.from(new Set((internalProfiles as ProfileItemV8[]).map(p => p.sport)))}
                                            selected={filterSports}
                                            onToggle={(val) => setFilterSports(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])}
                                            onClear={() => setFilterSports([])}
                                        />

                                        <TacticalDropdown
                                            label="Stake"
                                            icon={Target}
                                            options={['20', '50', '100', '200', '500']}
                                            selected={filterStakes}
                                            onToggle={(val) => setFilterStakes(prev => prev.includes(val) ? prev.filter(x => x !== val) : [...prev, val])}
                                            onClear={() => setFilterStakes([])}
                                            formatValue={(v) => `$${v}`}
                                        />

                                        <TacticalDropdown
                                            label="Casa"
                                            icon={Layers}
                                            options={Array.from(new Set((internalProfiles as ProfileItemV8[]).map(p => p.bookie))).sort()}
                                            selected={filterHouses}
                                            onToggle={(val) => setFilterHouses(prev => prev.includes(val.toUpperCase()) ? prev.filter(x => x !== val.toUpperCase()) : [...prev, val.toUpperCase()])}
                                            onClear={() => setFilterHouses([])}
                                        />

                                        <div className="h-8 w-[1px] bg-white/10 mx-2" />

                                        <div className="flex bg-[#0c0c0c] p-1 rounded-xl border border-white/5">
                                            <button onClick={() => setShowSelectedOnly(false)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!showSelectedOnly ? 'bg-white/10 text-white' : 'text-[#555] hover:text-white'}`}>Flota</button>
                                            <button onClick={() => setShowSelectedOnly(true)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${showSelectedOnly ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-[#444] hover:text-white'}`}>Fondo</button>
                                        </div>

                                        <button
                                            onClick={() => { setFilterSports([]); setFilterStakes([]); setFilterHouses([]); setSearchQuery(''); setShowSelectedOnly(false); pushLog("Reset Radar"); }}
                                            className="ml-auto flex items-center gap-2 text-[9px] font-black text-red-500/40 hover:text-red-500 uppercase transition-all group/reset"
                                        >
                                            <RotateCcw size={12} className="group-hover:rotate-180 transition-transform duration-500" /> Reset
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* List Area v10.0: Fleet Explorer Style Grid */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-10 space-y-10 bg-[#050505]">
                                {Object.entries(ecosystemGroups).map(([eco, housesMap]) => {
                                    const houseEntries = Object.entries(housesMap);
                                    if (houseEntries.length === 0) return null;

                                    const isExpanded = expandedEcos.includes(eco);
                                    const allEcoProfiles = houseEntries.flatMap(([_, list]) => list);
                                    const ecoAssigned = allEcoProfiles.reduce((acc, p) => acc + (stakes[p.id] || 0), 0);

                                    return (
                                        <div key={eco} className="space-y-4">
                                            {/* ECOSYSTEM HEADER (Scale adjusted) */}
                                            <div
                                                onClick={() => setExpandedEcos(prev => isExpanded ? prev.filter(x => x !== eco) : [...prev, eco])}
                                                className={`group/eco h-16 flex items-center justify-between px-6 rounded-2xl border transition-all cursor-pointer ${isExpanded ? 'bg-[#0a0a0a] border-white/10 shadow-xl' : 'bg-[#080808] border-white/5 hover:border-white/10'}`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="size-10 rounded-xl bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] border border-[#00ff88]/20 group-hover/eco:scale-105 transition-transform">
                                                        <Layers size={18} />
                                                    </div>
                                                    <h3 className="text-base font-black text-white uppercase tracking-tight">{eco} {eco === 'ALTENAR' ? '(ECUADOR)' : ''}</h3>
                                                </div>
                                                <div className="flex items-center gap-6 text-right">
                                                    <div className="hidden md:block">
                                                        <p className="text-[8px] font-black text-[#333] uppercase">Inversión Eco</p>
                                                        <p className="text-sm font-black text-[#00ff88] italic">${ecoAssigned.toLocaleString()}</p>
                                                    </div>
                                                    <ChevronDown size={18} className={`text-[#222] transition-transform duration-500 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                                                </div>
                                            </div>

                                            {/* HOUSES UNDER ECOSYSTEM */}
                                            {isExpanded && (
                                                <div className="space-y-6 pt-2">
                                                    {houseEntries.map(([house, profileList]) => {
                                                        const houseAssigned = profileList.reduce((acc, p) => acc + (stakes[p.id] || 0), 0);
                                                        const totalBalance = profileList.reduce((acc, p) => acc + p.balance, 0);
                                                        return (
                                                            <div key={house} className="bg-[#0c0c0c]/50 rounded-[1.5rem] border border-white/5 p-6 space-y-6">
                                                                {/* HOUSE HEADER (Scale adjusted) */}
                                                                <div className="flex items-center justify-between px-2">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="size-8 rounded-lg bg-white/5 flex items-center justify-center text-[#00ff88]">
                                                                            <Target size={16} />
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{house}</h4>
                                                                            <p className="text-[8px] font-bold text-[#333] uppercase">{profileList.length} Perfiles disponibles</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-8">
                                                                        <div className="text-right">
                                                                            <p className="text-[7px] font-black text-[#333] uppercase">Activo</p>
                                                                            <p className="text-xs font-black text-[#00ff88] italic">${houseAssigned.toLocaleString()}</p>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-[7px] font-black text-[#333] uppercase">Total</p>
                                                                            <p className="text-xs font-black text-white italic">${totalBalance.toLocaleString()}</p>
                                                                        </div>
                                                                        <ChevronDown size={14} className="text-[#222]" />
                                                                    </div>
                                                                </div>

                                                                {/* PROFILE GRID (Fleet style: 3 Columns) */}
                                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                                                    {profileList.map((p, idx) => (
                                                                        <div
                                                                            key={p.id}
                                                                            id={`profile-card-${p.id}`}
                                                                            onClick={() => setSelectedProfileDetail(p)}
                                                                            className={`group/card relative bg-[#0a0a0a] border rounded-[1.8rem] p-5 transition-all cursor-pointer overflow-hidden ${selectedProfileIds.includes(p.id) ? 'border-[#00ff88]/50 shadow-[0_0_30px_rgba(0,255,136,0.05)]' : 'border-white/5 hover:border-white/10'} ${focusedProfileId === p.id ? 'ring-2 ring-[#00ff88]' : ''}`}
                                                                        >
                                                                            {/* Status Gradient Bar */}
                                                                            <div className={`absolute top-0 left-0 h-[3px] transition-all duration-700 ${selectedProfileIds.includes(p.id) ? 'w-full bg-[#00ff88]' : 'w-0 bg-white/20'}`} />

                                                                            <div className="flex justify-between items-start mb-6">
                                                                                <div className="flex items-center gap-4">
                                                                                    <button
                                                                                        onClick={(e) => toggleProfileSelection(p.id, e)}
                                                                                        className={`size-12 rounded-2xl border flex items-center justify-center transition-all ${selectedProfileIds.includes(p.id) ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_20px_rgba(0,255,136,0.4)] scale-110' : 'bg-white/5 border-white/5 text-[#333] hover:border-[#00ff88]/40 hover:text-[#00ff88]'}`}
                                                                                    >
                                                                                        {selectedProfileIds.includes(p.id) ? <CheckCircle2 size={22} /> : <span className="text-[11px] font-black font-mono">{String(idx + 1).padStart(2, '0')}</span>}
                                                                                    </button>
                                                                                    <div>
                                                                                        <div className="flex items-center gap-2">
                                                                                            <p className={`text-[14px] font-black uppercase tracking-tighter transition-colors ${selectedProfileIds.includes(p.id) ? 'text-[#00ff88]' : 'text-white'}`}>{p.id}</p>
                                                                                            <div className={`size-2 rounded-full ${idx % 7 === 0 ? 'bg-amber-500 animate-pulse' : 'bg-[#00ff88]'} shadow-[0_0_8px_currentColor]`} />
                                                                                        </div>
                                                                                        <p className="text-[10px] font-black text-[#333] uppercase italic tracking-widest">{p.sport}</p>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    <p className="text-[9px] font-black text-[#222] uppercase tracking-[0.2em]">{p.adsId?.slice(-4) || 'SCAN'}</p>
                                                                                </div>
                                                                            </div>

                                                                            {/* Module HUD Stats */}
                                                                            <div className="space-y-3 mb-6">
                                                                                <div className="flex justify-between items-end p-3 bg-white/[0.02] rounded-2xl border border-white/5 group/stat">
                                                                                    <span className="text-[8px] font-black text-[#333] uppercase group-hover/stat:text-white transition-colors">Caja Disponible</span>
                                                                                    <span className="text-base font-black text-white tabular-nums tracking-tight font-mono">${p.balance.toLocaleString()}</span>
                                                                                </div>

                                                                                <div className="flex justify-between items-center p-3 py-4 bg-[#00ff88]/5 rounded-2xl border border-[#00ff88]/10 group/stake relative overflow-hidden">
                                                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-[#00ff88]/10 blur-2xl rounded-full" />
                                                                                    <div className="relative z-10 flex items-center gap-3">
                                                                                        <Target size={14} className="text-[#00ff88]" />
                                                                                        <span className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Stake Promedio</span>
                                                                                    </div>
                                                                                    <span className="relative z-10 text-lg font-black text-[#00ff88] italic drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">${p.averageStake}</span>
                                                                                </div>

                                                                                <div className="grid grid-cols-2 gap-3">
                                                                                    <div className="relative group/field">
                                                                                        <span className="absolute -top-1.5 left-3 px-1 bg-[#0a0a0a] text-[7px] font-black text-[#333] uppercase tracking-widest group-hover/field:text-[#00ff88] transition-colors z-10">Cuota Actual</span>
                                                                                        <input
                                                                                            type="number" step="0.01"
                                                                                            value={manualCuotas[p.bookie] || ''}
                                                                                            onChange={(e) => handleCuotaChange(p.bookie, e.target.value)}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            className="w-full bg-black border border-white/5 rounded-xl py-3 px-3 text-center text-sm font-mono font-black text-[#00ff88] focus:border-[#00ff88]/50 outline-none transition-all placeholder-[#111]"
                                                                                            placeholder="0.0"
                                                                                        />
                                                                                    </div>
                                                                                    <div className="relative group/field">
                                                                                        <span className="absolute -top-1.5 left-3 px-1 bg-[#0a0a0a] text-[7px] font-black text-[#333] uppercase tracking-widest group-hover/field:text-white transition-colors z-10">Stake Sug</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            value={stakes[p.id] || ''}
                                                                                            onChange={(e) => setProfileStake(p.id, parseFloat(e.target.value) || 0)}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                            className={`w-full bg-black border rounded-xl py-3 px-3 text-center text-sm font-mono font-black outline-none transition-all ${lockedProfiles.includes(p.id) ? 'border-amber-500/50 text-amber-500' : 'border-white/5 text-white focus:border-white/30'} placeholder-[#111]`}
                                                                                            placeholder="$0"
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            </div>

                                                                            {/* Module Activity Sparkline */}
                                                                            <div className="h-6 w-full flex items-end gap-[1px] opacity-10 mb-5 px-1 group-hover/card:opacity-30 transition-opacity">
                                                                                {[40, 70, 45, 90, 60, 85, 50, 95, 75, 55].map((val, i) => (
                                                                                    <div key={i} className="flex-1 bg-[#00ff88] rounded-t-[1px]" style={{ height: `${val}%` }} />
                                                                                ))}
                                                                            </div>

                                                                            {/* Module Actions HUD */}
                                                                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.03]">
                                                                                <div className="flex gap-2">
                                                                                    <button onClick={(e) => handleOpenAdsPower(p.id, e)} className="size-9 flex items-center justify-center bg-white/5 rounded-xl text-[#333] hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-all border border-transparent hover:border-[#00ff88]/20" title="Link AdsPower"><Chrome size={16} /></button>
                                                                                    <button className="size-9 flex items-center justify-center bg-white/5 rounded-xl text-[#333] hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10" title="Ver Detalles"><ExternalLink size={16} /></button>
                                                                                </div>
                                                                                <div className="flex items-center gap-1.5 opacity-50">
                                                                                    <div className="size-1 rounded-full bg-white/20" />
                                                                                    <span className="text-[8px] font-black text-[#333] uppercase">Ecosistema: {p.ecosystem || 'OTRAS'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* --- RIGHT PANEL (Control Console v8.5) --- */}
                        {/* --- RIGHT PANEL (Command Console v20.0) --- */}
                        <aside className="w-[480px] bg-[#050505] border-l border-white/[0.03] flex flex-col relative z-20 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8">

                                {/* HUD Summary Header */}
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <Terminal size={18} className="text-[#00ff88]" />
                                            <h2 className="text-[12px] font-black text-white uppercase tracking-[0.4em]">Cómputo Táctico</h2>
                                        </div>
                                        <div className="px-3 py-1 rounded bg-[#00ff88]/10 text-[8px] font-black text-[#00ff88] uppercase italic border border-[#00ff88]/20">{mode} ACTIVE</div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group bg-gradient-to-br from-[#0c0c0c] to-[#040404] p-10 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden ring-1 ring-white/5">
                                            {/* Decorative Grid */}
                                            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none" />
                                            <div className="absolute -top-24 -right-24 size-48 bg-[#00ff88]/10 blur-[80px] rounded-full pointer-events-none" />

                                            <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.5em] block mb-6 text-center">Liquidez Operativa Total</label>
                                            <div className="relative flex justify-center items-center gap-4">
                                                <span className="text-4xl font-black text-[#00ff88] italic drop-shadow-[0_0_15px_rgba(0,255,136,0.2)]">$</span>
                                                <input
                                                    type="number"
                                                    value={totalMonto}
                                                    onChange={(e) => setTotalMonto(parseFloat(e.target.value) || 0)}
                                                    className="bg-transparent text-7xl font-black text-white text-center focus:text-[#00ff88] transition-all outline-none tabular-nums w-full selection:bg-[#00ff88]/20"
                                                />
                                            </div>
                                            <div className="mt-6 h-[1px] w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] group/sm shadow-lg overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/sm:opacity-40 transition-opacity">
                                                    <Target size={32} />
                                                </div>
                                                <p className="text-[9px] font-black text-[#555] uppercase mb-2 group-hover/sm:text-[#00ff88] transition-colors tracking-widest">Total Asignado</p>
                                                <p className="text-3xl font-black text-[#00ff88] italic tabular-nums tracking-tighter">${assigned.toFixed(0)}</p>
                                                <p className="text-[8px] font-bold text-[#333] uppercase mt-2">{profileCount} Módulos Activos</p>
                                            </div>
                                            <div className="p-6 bg-white/[0.03] border border-white/5 rounded-[2rem] group/sm shadow-lg overflow-hidden relative">
                                                <div className="absolute top-0 right-0 p-2 opacity-10 group-hover/sm:opacity-40 transition-opacity">
                                                    <RefreshCw size={32} />
                                                </div>
                                                <p className="text-[9px] font-black text-[#555] uppercase mb-2 group-hover/sm:text-white transition-colors tracking-widest">Balance Flota</p>
                                                <p className={`text-3xl font-black italic tabular-nums tracking-tighter ${remaining > 1 ? 'text-amber-500' : 'text-white/20'}`}>${remaining.toFixed(0)}</p>
                                                <p className="text-[8px] font-bold text-[#333] uppercase mt-2">{remaining > 0 ? 'Faltan Recursos' : 'Carga Completa'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Signal Intelligence Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <p className="text-[8px] font-black text-[#333] uppercase tracking-widest">Señales Conectadas</p>
                                        <div className="size-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" />
                                    </div>
                                    <div className="space-y-3">
                                        {selectedPicks.map(p => (
                                            <div key={p.id} className="group/sig relative p-5 bg-gradient-to-r from-white/[0.04] to-transparent border-l-4 border-[#00ff88] rounded-r-[2rem] border-y border-r border-white/5 transition-all hover:bg-white/[0.08] hover:translate-x-1 duration-300">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[13px] font-black text-white uppercase tracking-tight group-hover/sig:text-[#00ff88] transition-colors">{p.event}</p>
                                                        <p className="text-[9px] font-bold text-[#555] uppercase mt-1">Cuota {p.fairOdd} • {p.market}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xl font-black text-[#00ff88] italic tabular-nums tracking-tighter">${p.recommendedStake}</p>
                                                        <p className="text-[7px] font-black text-[#333] uppercase mt-1">Inyección Sug.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Tactical Breakdown List */}
                                {profileCount > 0 && (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                        <div className="flex justify-between items-center px-2">
                                            <p className="text-[8px] font-black text-[#333] uppercase tracking-widest">Distribución de Recursos</p>
                                            <span className="text-[8px] font-black text-[#00ff88] px-2 py-0.5 rounded-full bg-[#00ff88]/5 border border-[#00ff88]/10 italic">Live Feed</span>
                                        </div>
                                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                            {Object.entries(stakes).map(([id, amount]) => {
                                                const amt = amount as number;
                                                if (amt <= 0) return null;
                                                const p = (internalProfiles as ProfileItemV8[]).find(x => x.id === id);
                                                if (!p) return null;

                                                return (
                                                    <div
                                                        key={id}
                                                        onClick={() => focusProfile(p.id, p.ecosystem || 'OTRAS')}
                                                        className="flex justify-between items-center p-3.5 bg-white/[0.01] border border-white/[0.03] rounded-[1.2rem] hover:border-[#00ff88]/30 hover:bg-[#0c0c0c] transition-all group/sum cursor-pointer"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-1.5 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] group-hover/sum:scale-150 transition-transform" />
                                                            <div>
                                                                <p className="text-[10px] font-black text-white uppercase group-hover/sum:text-[#00ff88] transition-colors tracking-tight">{p.id}</p>
                                                                <p className="text-[8px] font-bold text-[#333] uppercase leading-none mt-1">{p.bookie} • {p.ecosystem}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex opacity-0 group-hover/sum:opacity-100 transition-all gap-1 -translate-x-2 group-hover/sum:translate-x-0">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); toggleLock(id); }}
                                                                    className={`p-1.5 rounded-lg border transition-all ${lockedProfiles.includes(id) ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'bg-white/5 border-white/5 text-[#333] hover:text-white'}`}
                                                                >
                                                                    {lockedProfiles.includes(id) ? <Lock size={12} /> : <Unlock size={12} />}
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenAdsPower(id); }}
                                                                    className="p-1.5 bg-white/5 border border-white/5 rounded-lg text-[#444] hover:text-[#00ff88] hover:border-[#00ff88]/20 transition-all"
                                                                    title="Abrir AdsPower"
                                                                >
                                                                    <Chrome size={12} />
                                                                </button>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xs font-black text-white italic group-hover/sum:scale-110 transition-transform tabular-nums">${amt.toFixed(0)}</p>
                                                                {(!manualCuotas[p.bookie] || manualCuotas[p.bookie] <= 0) ? (
                                                                    <span className="text-[6px] font-black text-red-500 animate-pulse bg-red-500/10 px-1 rounded uppercase mt-0.5 block">Falta Cuota</span>
                                                                ) : (
                                                                    <p className="text-[6px] font-black text-[#00ff88] uppercase mt-0.5">OK {manualCuotas[p.bookie]}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar Footer Execution Section */}
                            <div className="p-8 bg-[#080808] border-t border-white/5 space-y-6 shrink-0">
                                {/* Execution Checklist */}
                                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4">
                                    <h3 className="text-[9px] font-black text-[#555] uppercase tracking-widest flex items-center gap-2">
                                        <ListChecks size={14} /> Checklist Operativo
                                    </h3>
                                    <div className="space-y-3">
                                        <CheckItem label="Monto Total Asignado" checked={(remaining as number) < 1} />
                                        <CheckItem label="Cuotas Validadas" checked={Object.keys(manualCuotas).length > 0 && !validation.missingOdds} />
                                        <CheckItem label="Exposición bajo Límite" checked={exposureByEco.alerts.length === 0} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                                        <span className="text-[8px] font-black text-[#444] uppercase block mb-1">ROI Est.</span>
                                        <span className="text-sm font-black text-[#00ff88] italic">{((weightedAvgOdd > 1 ? weightedAvgOdd - 1 : 0) * 100).toFixed(1)}%</span>
                                    </div>
                                    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
                                        <span className="text-[8px] font-black text-[#444] uppercase block mb-1">Media Pond.</span>
                                        <span className="text-sm font-black text-white italic">{weightedAvgOdd.toFixed(3)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleExecuteOperation}
                                    disabled={!validation.isValid}
                                    className="w-full py-6 bg-[#00ff88] hover:bg-[#00e67a] text-black font-black uppercase text-sm tracking-[0.2em] rounded-[2rem] shadow-[0_0_40px_rgba(0,255,136,0.2)] hover:shadow-[0_0_60px_rgba(0,255,136,0.4)] transition-all disabled:opacity-20 disabled:grayscale flex items-center justify-center gap-3 active:scale-95 group/exec"
                                >
                                    <Zap size={20} className="group-hover:scale-110 transition-transform" />
                                    <span>Iniciar Operación</span>
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </div>

            {/* --- MODALS & OVERLAYS --- */}

            {
                showSettings && (
                    <SettingsPanel
                        settings={settings}
                        setSettings={setSettings}
                        riskLimits={riskLimits}
                        setRiskLimits={setRiskLimits}
                        onClose={() => setShowSettings(false)}
                    />
                )
            }

            {
                selectedProfileDetail && (
                    <ProfileDetailModal
                        profile={selectedProfileDetail}
                        onClose={() => setSelectedProfileDetail(null)}
                        onOpenBrowser={handleOpenAdsPower}
                    />
                )
            }

            {
                showExecutionSummary && (
                    <ExecutionSummaryModal
                        onClose={() => setShowExecutionSummary(false)}
                        onConfirm={confirmExecution}
                        stakes={stakes}
                        profiles={internalProfiles}
                        manualCuotas={manualCuotas}
                        activePick={activePick}
                        onOpenBrowser={handleOpenAdsPower}
                    />
                )
            }

            {
                showAuditHistory && (
                    <div className="fixed inset-0 z-[2600] flex items-center justify-end p-6 bg-black/60 backdrop-blur-xl animate-in fade-in duration-300">
                        <div className="w-full max-w-lg h-full bg-[#080808] border border-white/5 rounded-[3rem] shadow-2xl flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden">
                            <div className="p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                                        <HistoryIcon size={20} className="text-[#00ff88]" /> Historial de Auditoría
                                    </h3>
                                    <p className="text-[9px] font-black text-[#333] uppercase tracking-widest mt-1">Monitor de Sesiones Ejecutadas</p>
                                </div>
                                <button onClick={() => setShowAuditHistory(false)} className="size-10 flex items-center justify-center text-[#333] hover:text-white bg-white/5 rounded-2xl transition-all">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">
                                {auditHistory.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                                        <Database size={64} className="mb-6" />
                                        <p className="text-xs font-black uppercase tracking-[0.3em]">Cero Registros en Memoria</p>
                                    </div>
                                ) : (
                                    auditHistory.map((session: any) => (
                                        <div key={session.id} className="p-6 bg-[#0c0c0c] border border-white/[0.03] rounded-[2rem] hover:border-[#00ff88]/20 transition-all group/audit relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff88] opacity-0 group-hover/audit:opacity-100 transition-opacity" />
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <p className="text-[13px] font-black text-white uppercase group-hover/audit:text-[#00ff88] transition-colors">
                                                        {session.picks?.[0]?.event || 'Sesión Manual'}
                                                        {session.picks?.length > 1 && <span className="text-white/20 ml-2">+{session.picks.length - 1} SIGS</span>}
                                                    </p>
                                                    <p className="text-[9px] font-bold text-[#444] uppercase mt-1">
                                                        {new Date(session.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-[#00ff88] italic tabular-nums leading-none tracking-tight">${session.totalMonto.toLocaleString()}</p>
                                                    <p className="text-[7px] font-black text-[#333] uppercase mt-1">Carga Total</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 pt-4 border-t border-white/[0.03]">
                                                {Object.entries(session.exposure || {}).map(([eco, amt]: any) => (
                                                    <div key={eco} className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 flex items-center gap-2">
                                                        <span className="text-[8px] font-black text-[#444] uppercase">{eco}</span>
                                                        <span className="text-[9px] font-black text-white italic">${amt.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            <div className="p-8 border-t border-white/5 bg-black">
                                <button
                                    onClick={() => { if (confirm("¿Deseas purgar el historial?")) { localStorage.removeItem('trading_audit_history'); setShowAuditHistory(false); } }}
                                    className="w-full py-4 text-[10px] font-black text-red-500/30 hover:text-red-500 uppercase border border-red-500/10 hover:border-red-500/30 rounded-2xl transition-all"
                                >
                                    Pulgar Historial de Auditoría
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};

// --- HELPER WRAPPER COMPONENTS ---

const TacticalDropdown = ({ label, options, selected, onToggle, onClear, icon: Icon, formatValue }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all ${selected.length > 0 ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' : 'bg-white/5 border-white/5 text-[#444] hover:text-white'}`}
            >
                {Icon && <Icon size={14} className={selected.length > 0 ? 'text-[#00ff88]' : 'text-[#444]'} />}
                <span className="text-[10px] font-black uppercase tracking-widest">
                    {label}: {selected.length === 0 ? 'Todos' : selected.length === 1 ? (formatValue ? formatValue(selected[0]) : selected[0]) : `${selected.length} Sel.`}
                </span>
                <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-3 w-64 bg-[#0c0c0c] border border-white/10 rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-50 p-2 animate-in zoom-in-95 origin-top-left backdrop-blur-3xl">
                        <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center mb-1">
                            <span className="text-[9px] font-black text-[#444] uppercase tracking-widest">{label}</span>
                            <button onClick={onClear} className="text-[8px] font-black text-red-500/50 hover:text-red-500 uppercase">Limpiar</button>
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            {options.map((opt: string) => {
                                const isSel = typeof opt === 'string' ? selected.includes(opt.toUpperCase()) || selected.includes(opt) : selected.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        onClick={() => onToggle(opt)}
                                        className={`w-full flex justify-between items-center p-3 rounded-xl text-[10px] font-black uppercase transition-all mb-0.5 ${isSel ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        {formatValue ? formatValue(opt) : opt}
                                        {isSel && <CheckCircle2 size={12} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const FilterChip = ({ label, active, onClick, ...props }: { label: string; active: boolean; onClick: () => void;[key: string]: any }) => (
    <button
        onClick={onClick}
        {...props}
        className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase transition-all border whitespace-nowrap shadow-sm ${active ? 'bg-[#00ff88] text-black border-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.2)]' : 'bg-white/5 text-[#555] border-white/5 hover:text-white hover:border-white/20'}`}
    >
        {label}
    </button>
);

const InfoItem = ({ label, value, color }: any) => (
    <div className="text-center">
        <p className="text-[8px] font-black text-[#555] uppercase mb-1 tracking-widest">{label}</p>
        <p className={`text-xl font-black italic tabular-nums ${color}`}>{value}</p>
    </div>
);

const SummaryCard = ({ label, value, sub, color }: any) => (
    <div className="p-5 bg-white/[0.03] border border-white/5 rounded-2xl text-center">
        <span className="text-[8px] font-black text-[#666] uppercase block mb-1">{label}</span>
        <span className={`text-2xl font-black italic block ${color}`}>{value}</span>
        <span className="text-[9px] font-bold text-[#444] uppercase">{sub}</span>
    </div>
);

const MetricBlock = ({ label, value }: any) => (
    <div className="p-4 bg-black/40 border border-white/5 rounded-2xl">
        <span className="text-[8px] font-black text-[#666] uppercase block mb-1">{label}</span>
        <span className="text-sm font-black text-white italic">{value}</span>
    </div>
);

const CheckItem = ({ label, checked }: any) => (
    <div className="flex items-center justify-between px-1">
        <span className={`text-[10px] font-bold uppercase transition-colors ${checked ? 'text-[#00ff88]' : 'text-[#666]'}`}>{label}</span>
        <div className={`size-4 rounded-md border flex items-center justify-center transition-all ${checked ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88]' : 'border-white/10 text-transparent'}`}>
            <CheckCircle2 size={10} />
        </div>
    </div>
);

// --- EXECUTION SUMMARY MODAL (v18.0) ---
const ExecutionSummaryModal = ({ onClose, onConfirm, stakes, profiles, manualCuotas, activePick, onOpenBrowser }: any) => {
    const activeProfiles = profiles.filter((p: any) => (stakes[p.id] || 0) > 0);
    const totalAssigned = Object.values(stakes).reduce((a: any, b: any) => (a as number) + (b as number), 0);

    return (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in duration-300">
            <div className="w-full max-w-4xl h-[85vh] bg-[#0c0c0c] border border-[#00ff88]/20 rounded-[3rem] shadow-[0_0_100px_rgba(0,255,136,0.1)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500">
                {/* Header */}
                <div className="p-10 border-b border-white/5 bg-gradient-to-br from-[#00ff88]/5 to-transparent flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-2xl font-black italic text-white uppercase tracking-tight flex items-center gap-3">
                            <Zap size={24} className="text-[#00ff88]" /> Resumen de Ejecución
                        </h2>
                        <p className="text-[10px] font-bold text-[#555] uppercase tracking-widest mt-1">Verifica la distribución antes de confirmar la operación</p>
                    </div>
                    <button onClick={onClose} className="p-3 text-[#444] hover:text-white bg-white/5 rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar bg-black/20">
                    {/* Event Info */}
                    <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[2rem] flex justify-between items-center group">
                        <div className="flex items-center gap-6">
                            <div className="size-16 rounded-2xl bg-[#00ff88]/10 flex items-center justify-center text-[#00ff88] border border-[#00ff88]/20 shadow-inner">
                                <Activity size={32} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-[#444] uppercase mb-1 tracking-widest">{activePick?.sport} • {activePick?.market}</p>
                                <h3 className="text-xl font-black text-white italic uppercase tracking-tight">{activePick?.event}</h3>
                                <p className="text-[9px] font-bold text-[#00ff88] uppercase mt-1">Cuota Fair: {activePick?.fairOdd}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-[#444] uppercase mb-1 tracking-widest">Inversión Total</p>
                            <p className="text-4xl font-black text-[#00ff88] italic drop-shadow-[0_0_20px_rgba(0,255,136,0.3)]">${(totalAssigned as number).toLocaleString()}</p>
                        </div>
                    </div>

                    {/* Profile List Grid */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center bg-[#080808] p-4 rounded-2xl border border-white/5">
                            <h4 className="text-[11px] font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Target size={16} className="text-blue-400" /> Desglose Operativo ({activeProfiles.length} Cuentas)
                            </h4>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <p className="text-[7px] font-black text-[#444] uppercase">ROI Media</p>
                                    <p className="text-[10px] font-black text-white">{(activePick?.fairOdd - 1 * 100).toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeProfiles.map((p: any) => (
                                <div key={p.id} className="p-6 bg-[#080808] border border-white/5 rounded-3xl flex justify-between items-center hover:border-[#00ff88]/30 hover:bg-[#111] transition-all group/card shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-[#00ff88] opacity-0 group-hover/card:opacity-100 transition-opacity" />
                                    <div className="flex items-center gap-5">
                                        <div className="size-12 rounded-xl bg-white/5 flex items-center justify-center text-[#333] group-hover/card:text-[#00ff88] transition-colors relative overflow-hidden">
                                            <Chrome size={22} />
                                            <div className="absolute inset-0 bg-[#00ff88]/5 opacity-0 group-hover/card:opacity-100" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-white uppercase group-hover/card:text-[#00ff88] transition-colors">{p.id}</p>
                                            <p className="text-[9px] font-black text-[#444] uppercase tracking-tighter">
                                                {p.bookie} • <span className="text-white/60">{manualCuotas[p.bookie] || activePick?.fairOdd}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-lg font-black text-white italic group-hover/card:scale-110 transition-transform tabular-nums">${stakes[p.id].toFixed(2)}</p>
                                            <p className="text-[7px] font-black text-[#00ff88] uppercase tracking-widest">{p.ecosystem}</p>
                                        </div>
                                        <button
                                            onClick={() => onOpenBrowser(p.id)}
                                            className="size-11 bg-white/5 text-[#444] hover:text-black hover:bg-[#00ff88] rounded-2xl flex items-center justify-center transition-all shadow-inner group/btn active:scale-90"
                                            title="Abrir AdsPower"
                                        >
                                            <ExternalLink size={18} className="group-hover/btn:scale-110 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-10 bg-[#080808] border-t border-white/10 flex gap-6 shrink-0 relative z-10">
                    <button
                        onClick={onClose}
                        className="flex-1 py-6 border border-white/10 rounded-2xl text-[11px] font-black uppercase text-[#444] hover:text-white hover:bg-white/5 transition-all tracking-widest"
                    >
                        Cancelar y Revisar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-[2.5] py-6 bg-[#00ff88] text-black rounded-2xl text-[13px] font-black uppercase tracking-[0.2em] shadow-[0_0_50px_rgba(0,255,136,0.3)] hover:shadow-[0_0_80px_rgba(0,255,136,0.5)] transition-all flex items-center justify-center gap-4 active:scale-95 group/confirm overflow-hidden relative"
                    >
                        <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/confirm:translate-y-0 transition-transform duration-300" />
                        <Zap size={22} className="relative z-10 animate-pulse" />
                        <span className="relative z-10">CONFIRMAR E INICIAR OPERACIÓN MASIVA</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TradingZoneModal;