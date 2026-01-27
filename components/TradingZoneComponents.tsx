
import React, { useState } from 'react';
import {
    X, Chrome, ExternalLink, Globe, User, Info, AlertTriangle,
    CheckCircle2, Clock, MapPin, Tag, FileText, Zap, Shield, Activity,
    Settings, Wallet
} from 'lucide-react';
import { ProfileItemV8 } from '../types/tradingZoneTypes';

// --- PROFILE DETAIL MODAL ---
export const ProfileDetailModal = ({
    profile,
    onClose,
    onOpenBrowser
}: {
    profile: ProfileItemV8,
    onClose: () => void,
    onOpenBrowser: (id: string) => void
}) => {
    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col relative">

                {/* Header Profile */}
                <div className="p-8 pb-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#00ff88] rounded-full blur-[80px] opacity-[0.05]" />

                    <div className="flex justify-between items-start relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
                                <User size={32} className="text-[#888]" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tight">{profile.name}</h3>
                                <p className="text-[10px] font-mono font-bold text-[#555] uppercase tracking-widest">{profile.id} • {profile.adsId}</p>
                                <div className={`inline-flex items-center gap-1.5 mt-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${profile.status === 'HEALTHY' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-amber-500/10 text-amber-500'}`}>
                                    <div className={`size-1.5 rounded-full ${profile.status === 'HEALTHY' ? 'bg-[#00ff88] animate-pulse' : 'bg-amber-500'}`} />
                                    {profile.status}
                                </div>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-[#444] hover:text-white transition-colors bg-white/5 rounded-full">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Body Details */}
                <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1 bg-black/20">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <DetailCard icon={<Wallet size={14} className="text-blue-400" />} label="Balance" value={`$${profile.balance}`} />
                        <DetailCard icon={<Shield size={14} className="text-[#00ff88]" />} label="Trust Score" value={`${profile.trustScore}%`} />
                        <DetailCard icon={<MapPin size={14} className="text-red-400" />} label="Ciudad" value={profile.city || 'Quito, EC'} />
                        <DetailCard icon={<Clock size={14} className="text-amber-400" />} label="Últ. Actividad" value={profile.lastAction || 'Hace 10m'} />
                    </div>

                    {/* Tags / Affinity */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#555] uppercase tracking-[0.2em] flex items-center gap-2">
                            <Tag size={10} /> Afinidad Deportiva
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(profile.tags || ['Fútbol', 'Goles', 'Tenis']).map(tag => (
                                <span key={tag} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-[#ccc]">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* History Placeholder */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#555] uppercase tracking-[0.2em] flex items-center gap-2">
                            <FileText size={10} /> Historial Reciente
                        </label>
                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-center">
                            <p className="text-[10px] font-medium text-[#444] italic">Sin historial disponible para esta sesión</p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-[#555] uppercase tracking-[0.2em]">Notas Internas</label>
                        <p className="text-[11px] text-[#888] leading-relaxed bg-black/40 p-4 rounded-xl italic">
                            {profile.notes || 'No hay notas tácticas registradas para este perfil.'}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-[#080808] border-t border-white/10 flex gap-4">
                    <button
                        onClick={() => onOpenBrowser(profile.id)}
                        className="flex-1 py-4 bg-[#00ff88] text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[0_0_30px_rgba(0,255,136,0.2)] hover:shadow-[0_0_50px_rgba(0,255,136,0.4)] transition-all flex items-center justify-center gap-2"
                    >
                        <Chrome size={18} /> ABRIR NAVEGADOR
                    </button>
                </div>
            </div>
        </div>
    );
};

const DetailCard = ({ icon, label, value }: any) => (
    <div className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
        <div className="flex items-center gap-2 mb-1">
            {icon}
            <span className="text-[9px] font-black text-[#555] uppercase">{label}</span>
        </div>
        <p className="text-sm font-black text-white">{value}</p>
    </div>
);

// --- HOUSE QUICK CARD (POPOVER) ---
export const HouseQuickCard = ({
    house,
    onClose,
    summary,
    onRegister
}: {
    house: string,
    onClose: () => void,
    summary: { totalStake: number, profiles: number, avgOdd: number, isValid: boolean, error?: string },
    onRegister: () => void
}) => {
    return (
        <div className="absolute top-12 left-0 w-64 bg-[#111] border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[2200] p-5 animate-in slide-in-from-top-2 duration-200">
            <div className="flex justify-between items-center mb-4">
                <h4 className="text-xs font-black text-white uppercase italic">{house} <span className="text-[#555] font-normal not-italic ml-1">Mini-Panel</span></h4>
                <button onClick={onClose} className="size-6 bg-white/5 rounded-full flex items-center justify-center text-[#444] hover:text-white transition-colors">
                    <X size={12} />
                </button>
            </div>

            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-black/40 rounded-lg">
                        <span className="text-[8px] font-black text-[#666] uppercase block">Monto</span>
                        <span className="text-xs font-bold text-white">${summary.totalStake}</span>
                    </div>
                    <div className="p-2 bg-black/40 rounded-lg">
                        <span className="text-[8px] font-black text-[#666] uppercase block">Cuota Prom.</span>
                        <span className="text-xs font-bold text-[#00ff88]">@{summary.avgOdd.toFixed(2)}</span>
                    </div>
                </div>

                <div className="flex justify-between items-center px-1">
                    <span className="text-[9px] font-bold text-[#555] uppercase">Perfiles listos:</span>
                    <span className="text-[9px] font-black text-white">{summary.profiles}</span>
                </div>

                {summary.error ? (
                    <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertTriangle size={12} className="text-red-500" />
                        <span className="text-[9px] font-black text-red-500 uppercase">{summary.error}</span>
                    </div>
                ) : (
                    <div className="p-2 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-lg flex items-center gap-2">
                        <CheckCircle2 size={12} className="text-[#00ff88]" />
                        <span className="text-[9px] font-black text-[#00ff88] uppercase">Configuración Válida</span>
                    </div>
                )}

                <button
                    onClick={onRegister}
                    disabled={!summary.isValid}
                    className="w-full py-3 bg-[#00ff88] text-black text-[10px] font-black uppercase rounded-xl shadow-[0_0_15px_rgba(0,255,136,0.2)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] disabled:opacity-50 disabled:grayscale transition-all"
                >
                    Registrar en {house}
                </button>
            </div>
        </div>
    );
};

export const SettingsPanel = ({
    settings,
    setSettings,
    riskLimits,
    setRiskLimits,
    onClose
}: {
    settings: any,
    setSettings: (s: any) => void,
    riskLimits: Record<string, number>,
    setRiskLimits: (r: Record<string, number>) => void,
    onClose: () => void
}) => {
    return (
        <div className="absolute top-20 right-4 w-[420px] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.9)] z-[2300] p-10 animate-in slide-in-from-right-4 duration-300 overflow-y-auto max-h-[85vh] custom-scrollbar selection:bg-[#00ff88]/30">
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-sm font-black text-white uppercase italic flex items-center gap-3">
                        <Settings size={18} className="text-[#00ff88]" /> CONFIGURACIÓN TÁCTICA
                    </h3>
                    <p className="text-[9px] font-bold text-[#444] uppercase tracking-widest mt-1">Ajuste fino del motor de distribución</p>
                </div>
                <button onClick={onClose} className="p-2 text-[#444] hover:text-white transition-colors bg-white/5 rounded-full">
                    <X size={16} />
                </button>
            </div>

            <div className="space-y-10">
                {/* Method */}
                <div className="space-y-4">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] flex items-center gap-2">
                        Estrategia de Reparto <HelpTooltip text="Define cómo se calcula el monto para cada perfil seleccionado." />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { id: 'LIQUIDITY', label: 'Liquidez', sub: 'Más banca = Más apuesta' },
                            { id: 'FIXED', label: 'Equitativo', sub: 'Montos fijos idénticos' },
                        ].map(m => (
                            <button
                                key={m.id}
                                onClick={() => setSettings({ ...settings, method: m.id })}
                                className={`p-5 rounded-3xl text-left transition-all border ${settings.method === m.id ? 'bg-[#00ff88]/10 border-[#00ff88]/30 shadow-[0_0_20px_rgba(0,255,136,0.1)]' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                            >
                                <p className={`text-xs font-black uppercase ${settings.method === m.id ? 'text-[#00ff88]' : 'text-white/50'}`}>{m.label}</p>
                                <p className="text-[9px] font-bold text-[#666] mt-1 leading-tight">{m.sub}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bankroll % */}
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-5">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-black text-[#666] uppercase tracking-widest flex items-center gap-2">
                            Tope de Caja (%) <HelpTooltip text="Límite máximo que un perfil puede apostar de su saldo total (ej: 50% de $100 = max $50)." />
                        </label>
                        <span className="text-sm font-black text-[#00ff88] italic drop-shadow-[0_0_10px_rgba(0,255,136,0.3)]">{settings.maxBankrollPct}%</span>
                    </div>
                    <input
                        type="range" min="1" max="100" step="5"
                        value={settings.maxBankrollPct}
                        onChange={(e) => setSettings({ ...settings, maxBankrollPct: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
                    />
                </div>

                {/* Stake Range % */}
                <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-5">
                    <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-black text-[#666] uppercase tracking-widest flex items-center gap-2">
                            Rango de Stake (+/- %) <HelpTooltip text="Margen extra sobre el stake histórico del perfil. Si su promedio es $100 y pones 50%, podrá subir hasta $150." />
                        </label>
                        <span className="text-sm font-black text-[#00ff88] italic">+{settings.stakeRangePct}%</span>
                    </div>
                    <input
                        type="range" min="0" max="200" step="10"
                        value={settings.stakeRangePct}
                        onChange={(e) => setSettings({ ...settings, stakeRangePct: parseInt(e.target.value) })}
                        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
                    />
                </div>

                {/* Numeric Controls */}
                <div className="grid grid-cols-2 gap-4">
                    <SettingsInput
                        label="Máx Perfiles"
                        value={settings.maxProfiles}
                        help="Cantidad máxima de navegadores a abrir para este pick."
                        onChange={(v: number) => setSettings({ ...settings, maxProfiles: v })}
                    />
                    <SettingsInput
                        label="Redondeo $"
                        value={settings.roundTo}
                        help="Ajusta los montos a múltiplos de 5 o 10 para naturalidad humana."
                        onChange={(v: number) => setSettings({ ...settings, roundTo: v })}
                    />
                </div>

                {/* Toggles */}
                <div className="space-y-4">
                    <SettingsToggle
                        label="Ignorar Límite Casa"
                        active={settings.allowMaxStakeOverride}
                        help="Si se activa, ignora el límite 'maxStakeSuggested' de la casa y usa el tope de caja definido."
                        onToggle={() => setSettings({ ...settings, allowMaxStakeOverride: !settings.allowMaxStakeOverride })}
                    />

                    <SettingsToggle
                        label="Smart-Staking Anti-Detección"
                        active={settings.antiDetection}
                        help="Genera montos ligeramente irregulares (ej: $49.85) para evadir algoritmos de detección de perfiles profesionales."
                        onToggle={() => setSettings({ ...settings, antiDetection: !settings.antiDetection })}
                    />

                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl">
                        <div className="flex justify-between items-baseline mb-5">
                            <label className="text-[10px] font-black text-[#666] uppercase tracking-widest flex items-center gap-2">
                                Peso de Afinidad <HelpTooltip text="Define cuánta prioridad se le da a los perfiles que 'dominan' el deporte de este pick." />
                            </label>
                            <span className="text-xs font-black text-white italic">{settings.affinityWeight}x</span>
                        </div>
                        <input
                            type="range" min="0" max="1" step="0.1"
                            value={settings.affinityWeight}
                            onChange={(e) => setSettings({ ...settings, affinityWeight: parseFloat(e.target.value) })}
                            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
                        />
                    </div>
                </div>

                {/* RISK THRESHOLDS CONFIG (NEW v18.5) */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                    <label className="text-[10px] font-black text-[#555] uppercase tracking-[0.2em] flex items-center gap-2">
                        <AlertTriangle size={14} className="text-red-500" /> Límites de Riesgo por Eco
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                        {Object.entries(riskLimits).map(([eco, limit]) => (
                            <div key={eco} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                <span className="text-[10px] font-black text-white uppercase">{eco}</span>
                                <div className="flex items-center gap-4">
                                    <span className="text-[10px] font-mono text-[#00ff88]">${limit.toLocaleString()}</span>
                                    <input
                                        type="range" min="500" max="20000" step="500"
                                        value={limit}
                                        onChange={(e) => setRiskLimits({ ...riskLimits, [eco]: parseInt(e.target.value) })}
                                        className="w-24 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#00ff88]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const HelpTooltip = ({ text }: { text: string }) => (
    <div className="group relative">
        <Info size={12} className="text-[#333] cursor-help hover:text-[#555] transition-colors" />
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-black border border-white/10 rounded-2xl text-[9px] leading-relaxed font-bold text-[#888] uppercase opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[3000] shadow-2xl backdrop-blur-xl">
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 border-8 border-transparent border-t-black" />
            {text}
        </div>
    </div>
);

const SettingsInput = ({ label, value, onChange, help }: any) => (
    <div className="p-5 bg-white/[0.02] border border-white/5 rounded-3xl space-y-3">
        <label className="text-[9px] font-black text-[#444] uppercase tracking-widest flex items-center justify-between">
            {label} {help && <HelpTooltip text={help} />}
        </label>
        <input
            type="number"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value) || 0)}
            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-black text-white outline-none focus:border-[#00ff88]/30 transition-all"
        />
    </div>
);

const SettingsToggle = ({ label, active, onToggle, help }: any) => (
    <button
        onClick={onToggle}
        className="w-full flex justify-between items-center p-6 bg-white/[0.02] border border-white/5 rounded-3xl transition-all hover:bg-white/[0.04] group/toggle"
    >
        <div className="flex items-center gap-2">
            <span className={`text-xs font-black uppercase transition-colors ${active ? 'text-white' : 'text-[#444]'}`}>{label}</span>
            {help && <HelpTooltip text={help} />}
        </div>
        <div className={`w-12 h-6 rounded-full relative transition-all duration-300 ${active ? 'bg-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)]' : 'bg-white/10'}`}>
            <div className={`absolute top-1 size-4 bg-white rounded-full transition-all duration-300 ${active ? 'left-7' : 'left-1'}`} />
        </div>
    </button>
);

const WalletIcon = ({ size, className }: any) => <Wallet size={size} className={className} />;
const ListChecks = ({ size, className }: any) => <Activity size={size} className={className} />;

export default ProfileDetailModal;
