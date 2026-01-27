
import React, { useState } from 'react';
import {
    X, LayoutGrid, Activity, CreditCard, Monitor, User, Navigation, Trophy,
    UserRound, Globe, MapPin, Target, Shield, Lock, Copy, StickyNote, Edit3
} from 'lucide-react';
import { Profile } from './NetworkHierarchy';

// --- HELPERS ---
const TabBtn = ({ active, onClick, icon, label }: any) => (
    <button onClick={onClick} className={`px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-lg shadow-[#00ff88]/5' : 'text-[#333] hover:text-[#555]'}`}>
        {icon} {label}
    </button>
);

const LauncherCard = ({ label, sub, icon, active }: any) => (
    <button className={`p-8 rounded-[2rem] flex flex-col items-center gap-4 text-center transition-all group ${active ? 'bg-[#00ff88]/5 border-2 border-[#00ff88]/20 hover:border-[#00ff88]/50 shadow-lg shadow-[#00ff88]/5' : 'bg-white/[0.02] border-2 border-transparent hover:border-white/10'}`}>
        <div className={`p-4 rounded-2xl ${active ? 'bg-[#00ff88] text-black shadow-xl shadow-[#00ff88]/20 animate-pulse' : 'bg-white/5 text-[#333] group-hover:text-white'}`}>{icon}</div>
        <div>
            <p className="text-[10px] font-black text-white">{label}</p>
            <p className={`text-[9px] font-bold ${active ? 'text-[#00ff88]' : 'text-[#333]'} uppercase mt-1 tracking-widest`}>{sub}</p>
        </div>
    </button>
);

const SmallMetric = ({ val, label, sub, unit }: any) => (
    <div className="p-8 bg-black border border-white/5 rounded-[2rem] text-center shadow-lg">
        <p className="text-[8px] font-black text-[#333] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-3xl font-black text-[#00ff88] tabular-nums italic shadow-[0_0_20px_rgba(0,255,136,0.05)]">{val}</p>
        {sub && <p className="text-[8px] text-[#333] font-black mt-1">{sub}</p>}
    </div>
);

const InfoRow = ({ label, val, icon }: any) => (
    <div className="flex items-start gap-4">
        <div className="text-[#333] mt-1">{icon}</div>
        <div>
            <p className="text-[8px] font-black text-[#333] uppercase tracking-widest mb-1">{label}</p>
            <p className="text-[11px] font-black text-white italic">{val}</p>
        </div>
    </div>
);

// --- MAIN COMPONENTS ---

export const ProfileDetailsDrawer = ({ profile, onClose, drawerTab, setDrawerTab, onManualRegister }: any) => {
    return (
        <div className="fixed inset-0 z-[1000] flex justify-end">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-xl bg-[#080808] border-l border-white/10 h-full flex flex-col items-center animate-in slide-in-from-right duration-500 overflow-y-auto custom-scrollbar">

                {/* HEADER AREA */}
                <div className="w-full p-10 flex items-start justify-between">
                    <div className="flex items-center gap-6">
                        <div className="size-24 rounded-full bg-[#00ff88]/10 border-2 border-[#00ff88]/30 flex items-center justify-center text-[#00ff88] font-black text-4xl shadow-[0_0_30px_rgba(0,255,136,0.1)]">
                            {profile.id[0]}
                        </div>
                        <div>
                            <h2 className="text-4xl font-black italic uppercase leading-tight">{profile.id}</h2>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="bg-[#00ff88] text-black px-2 py-0.5 rounded text-[9px] font-black uppercase">{profile.bookie}</span>
                                <span className="text-[10px] font-bold text-[#00ff88] uppercase tracking-widest text-nowrap">{profile.bookie} Owner</span>
                            </div>
                            <p className="text-[9px] text-[#444] font-bold uppercase mt-1 flex items-center gap-1"><MapPin size={10} /> AGENDA QUITO</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 text-[#333] hover:text-white transition-colors bg-white/5 rounded-2xl"><X size={24} /></button>
                </div>

                {/* TABS PILL */}
                <div className="flex bg-white/5 rounded-2xl p-1 mb-10 w-fit mx-auto border border-white/5">
                    <TabBtn active={drawerTab === 'resumen'} onClick={() => setDrawerTab('resumen')} icon={<LayoutGrid size={14} />} label="RESUMEN" />
                    <TabBtn active={drawerTab === 'dna'} onClick={() => setDrawerTab('dna')} icon={<Activity size={14} />} label="DNA OPERATIVO" />
                    <TabBtn active={drawerTab === 'finanzas'} onClick={() => setDrawerTab('finanzas')} icon={<CreditCard size={14} />} label="FINANZAS" />
                </div>

                <div className="w-full px-10 space-y-12 pb-20">
                    {drawerTab === 'resumen' && (
                        <>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] flex items-center gap-2"><Monitor size={14} /> LANZADORES ADSPOWER</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <LauncherCard label="ABRIR PERFIL DUEÑO" sub="Access" icon={<User size={24} />} />
                                    <LauncherCard label="ACCESO BACKOFFICE" sub="CONTROL CASA" icon={<Navigation size={24} />} active />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <SmallMetric val={`$${profile.balance}`} label="SALDO REAL" unit="$" />
                                <SmallMetric val={`$${profile.stakeProm}`} label="STAKE PROM." unit="$" />
                                <SmallMetric val="15" label="OPS SEMANALES" sub="META: 20" />
                            </div>
                        </>
                    )}

                    {drawerTab === 'dna' && (
                        <div className="space-y-10">
                            <div className="space-y-6">
                                <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] flex items-center gap-2"><Trophy size={14} /> PERFIL DEL JUGADOR</h3>
                                <div className="grid grid-cols-2 gap-y-8">
                                    <InfoRow label="TIPO DE JUGADOR" val="Agresivo" icon={<UserRound size={16} />} />
                                    <InfoRow label="DEPORTE DNA" val={profile.sport} icon={<Trophy size={16} />} />
                                    <InfoRow label="IP OPERATIVA" val="192.168.1.x" icon={<Globe size={16} />} />
                                    <InfoRow label="CIUDAD / SEDE" val="Quito, EC" icon={<MapPin size={16} />} />
                                    <InfoRow label="PREFERENCIAS" val="Mercados Líquidos, Live" icon={<Target size={16} />} />
                                    <InfoRow label="NIVEL DE CUENTA" val="Maestra / Auditada" icon={<Shield size={16} />} />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] flex items-center gap-2"><Lock size={14} /> CREDENCIALES TÁCTICAS</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[8px] font-black text-[#333] uppercase mb-1">USUARIO CASA</p>
                                            <p className="text-sm font-bold text-white tracking-widest">user_123</p>
                                        </div>
                                        <Copy size={14} className="text-[#222] group-hover:text-[#00ff88] transition-colors cursor-pointer" />
                                    </div>
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl flex justify-between items-center group">
                                        <div>
                                            <p className="text-[8px] font-black text-[#333] uppercase mb-1">CONTRASEÑA</p>
                                            <p className="text-sm font-bold text-white tracking-widest">pass_***</p>
                                        </div>
                                        <Copy size={14} className="text-[#222] group-hover:text-[#00ff88] transition-colors cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BITACORA AT BOTTOM */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#333] uppercase tracking-[0.4em] flex items-center gap-2"><StickyNote size={14} /> BITÁCORA DE MANDO</h3>
                        <div className="h-40 bg-white/[0.01] border border-white/5 rounded-[2rem] p-6 text-[10px] font-bold text-[#222] italic">Sin notas registradas para este nodo operativo.</div>
                    </div>
                </div>

                {/* BOTTOM FIXED ACTION */}
                <div className="mt-auto w-full p-8 border-t border-white/10 bg-[#0a0a0a]">
                    <button onClick={onManualRegister} className="w-full py-5 bg-[#00ff88] text-black font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-[#00ff88]/10 hover:translate-y-[-2px] active:scale-95 transition-all">
                        REGISTRAR APUESTA CON ESTE PERFIL
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ManualBetModal = ({ onClose, profiles, onConfirm }: any) => {
    const [form, setForm] = useState({
        league: '',
        startTime: '',
        event: '',
        market: '',
        selection: '',
        fairOdd: '',
        minOdd: '',
        recommendedStake: ''
    });

    const handleChange = (e: any) => setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = () => {
        onConfirm({
            ...form,
            fairOdd: parseFloat(form.fairOdd) || 0,
            minOdd: parseFloat(form.minOdd) || 0,
            recommendedStake: parseFloat(form.recommendedStake) || 0
        });
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
            <div className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center mb-6 shrink-0">
                    <h2 className="text-xl font-black italic uppercase italic tracking-tighter flex items-center gap-3">
                        <Edit3 size={20} className="text-[#00ff88]" /> Crear Señal Manual
                    </h2>
                    <button onClick={onClose} className="p-2 text-[#333] hover:text-white"><X size={24} /></button>
                </header>

                <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-6 flex-1">
                    {/* Event Info */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] border-b border-white/5 pb-2">Información del Evento</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Torneo / Liga</label>
                                <input name="league" value={form.league} onChange={handleChange} type="text" placeholder="Ej: Serie A | Italy" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Hora Inicio</label>
                                <input name="startTime" value={form.startTime} onChange={handleChange} type="text" placeholder="HH:mm" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white" />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Evento / Partido</label>
                                <input name="event" value={form.event} onChange={handleChange} type="text" placeholder="Cittadella - Pergolettese" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white" />
                            </div>
                        </div>
                    </div>

                    {/* Pick Info */}
                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] border-b border-white/5 pb-2">Detalle del Pick</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Mercado</label>
                                <input name="market" value={form.market} onChange={handleChange} type="text" placeholder="Ej: Moneyline / HDP" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Selección</label>
                                <input name="selection" value={form.selection} onChange={handleChange} type="text" placeholder="Ej: Team A -0.5" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white" />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Cuota Fair</label>
                                    <input name="fairOdd" value={form.fairOdd} onChange={handleChange} type="number" step="0.01" placeholder="2.00" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono font-bold text-[#00ff88] outline-none focus:border-[#00ff88]/50" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Cuota Min</label>
                                    <input name="minOdd" value={form.minOdd} onChange={handleChange} type="number" step="0.01" placeholder="1.90" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono font-bold text-white outline-none focus:border-[#00ff88]/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Stake (USD)</label>
                                <input name="recommendedStake" value={form.recommendedStake} onChange={handleChange} type="number" placeholder="100" className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#00ff88]/50" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex gap-4 shrink-0">
                    <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase text-[#444]">Cancelar</button>
                    <button onClick={handleSubmit} className="flex-1 py-4 bg-[#00ff88] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#00ff88]/20 hover:scale-[1.02] transition-transform">
                        Confirmar Señal
                    </button>
                </div>
            </div>
        </div>
    );
};
