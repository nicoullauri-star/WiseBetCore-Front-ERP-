
import React, { useState, useEffect } from 'react';
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

// --- NEW IMPORTS FOR MODAL V2 ---
import { PickFormFields } from '@/components/ManualBet/PickFormFields';
import { FinancialFields } from '@/components/ManualBet/FinancialFields';
import { operationalService } from '@/services/operational.service';
import { ManualPickPayload, CreateSenalPayload } from '@/types/operational.types';
import { Layers, Plus } from 'lucide-react';

export const ManualBetModal = ({ onClose, onConfirm }: any) => {
    // FORM STATE
    const [tipoApuesta, setTipoApuesta] = useState<'SENCILLA' | 'COMBINADA'>('SENCILLA');
    const [picks, setPicks] = useState<ManualPickPayload[]>([
        { orden: 1, deporte: 0, competicion: 0, partido: '', fecha_evento: '', mercado: '', seleccion: '', cuota_pick: 0 }
    ]);
    const [financials, setFinancials] = useState({
        cuota_fair: 0,
        cuota_fair_black: '',
        cuota_minima: 0,
        stake_recomendado: 0,
        distribuidora: 0,
        notas: '',
        cuota_total: 0
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // AUTO-CALCULATE TOTAL ODD
    useEffect(() => {
        if (tipoApuesta === 'SENCILLA') {
            setFinancials(prev => ({ ...prev, cuota_total: prev.cuota_fair || 0 }));
        } else {
            // For Combo, multiply picks odds
            const total = picks.reduce((acc, pick) => acc * (Number(pick.cuota_pick) || 1), 1);
            setFinancials(prev => ({ ...prev, cuota_total: total > 1 ? total : 0 }));
        }
    }, [tipoApuesta, financials.cuota_fair, picks]);

    // HANDLERS
    const handlePickChange = (index: number, field: string, value: any) => {
        const newPicks = [...picks];
        newPicks[index] = { ...newPicks[index], [field]: value };
        setPicks(newPicks);
    };

    const handleAddPick = () => {
        setPicks(prev => [
            ...prev,
            { orden: prev.length + 1, deporte: 0, competicion: 0, partido: '', fecha_evento: '', mercado: '', seleccion: '', cuota_pick: 0 }
        ]);
    };

    const handleRemovePick = (index: number) => {
        if (picks.length <= 1) return;
        setPicks(prev => prev.filter((_, i) => i !== index).map((p, i) => ({ ...p, orden: i + 1 })));
    };

    const handleFinancialChange = (field: string, value: any) => {
        setFinancials(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Sanitize and convert types for Backend
            const sanitizedPicks: ManualPickPayload[] = picks.map(p => ({
                orden: p.orden,
                deporte: Number(p.deporte),
                competicion: Number(p.competicion),
                partido: p.partido,
                link_partido: p.link_partido || '',
                fecha_evento: new Date(p.fecha_evento).toISOString(),
                mercado: p.mercado,
                seleccion: p.seleccion,
                cuota_pick: Number(p.cuota_pick)
            }));

            const payload: CreateSenalPayload = {
                tipo_apuesta: tipoApuesta,
                picks: sanitizedPicks,
                cuota_fair: Number(financials.cuota_fair),
                cuota_fair_black: financials.cuota_fair_black,
                cuota_total: Number(financials.cuota_total),
                cuota_minima: Number(financials.cuota_minima),
                stake_recomendado: Number(financials.stake_recomendado),
                distribuidora: financials.distribuidora ? Number(financials.distribuidora) : undefined,
                notas: financials.notas,
                origen: 'MANUAL'
            };

            // Call API
            const response = await operationalService.createSenal(payload);

            // Notify Parent to refresh queue
            onConfirm(response);
            onClose();
        } catch (error) {
            console.error("Failed to create signal", error);
            // 这里 should add a toast error
        } finally {
            setIsSubmitting(false);
        }
    };

    const switchTo = (type: 'SENCILLA' | 'COMBINADA') => {
        setTipoApuesta(type);
        if (type === 'SENCILLA') {
            setPicks([picks[0]]); // Keep only first
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl">
            <div className="relative w-full max-w-3xl bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <header className="flex justify-between items-center mb-6 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-white">
                            <Edit3 size={24} className="text-[#00ff88]" /> Crear Señal Manual
                        </h2>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => switchTo('SENCILLA')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${tipoApuesta === 'SENCILLA' ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'bg-transparent text-[#666] border-white/10 hover:border-white/30'}`}
                            >
                                Señal Sencilla
                            </button>
                            <button
                                onClick={() => switchTo('COMBINADA')}
                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all flex items-center gap-2 ${tipoApuesta === 'COMBINADA' ? 'bg-[#00ff88] text-black border-[#00ff88]' : 'bg-transparent text-[#666] border-white/10 hover:border-white/30'}`}
                            >
                                <Layers size={14} /> Señal Combinada
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 text-[#333] hover:text-white bg-white/5 rounded-full"><X size={24} /></button>
                </header>

                <div className="overflow-y-auto custom-scrollbar pr-2 -mr-2 space-y-8 flex-1 pb-4">
                    {/* PICKS SECTION */}
                    <div className="space-y-4">
                        {picks.map((pick, idx) => (
                            <PickFormFields
                                key={idx}
                                index={idx}
                                pick={pick}
                                onChange={handlePickChange}
                                onRemove={handleRemovePick}
                                isSingle={tipoApuesta === 'SENCILLA'}
                            />
                        ))}

                        {tipoApuesta === 'COMBINADA' && (
                            <button
                                onClick={handleAddPick}
                                className="w-full py-3 rounded-xl border border-dashed border-[#00ff88]/30 text-[#00ff88] text-[10px] font-black uppercase tracking-widest hover:bg-[#00ff88]/5 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={14} /> Agregar otro partido
                            </button>
                        )}
                    </div>

                    {/* FINANCIALS */}
                    <FinancialFields
                        form={financials}
                        onChange={handleFinancialChange}
                        readOnlyTotalOdd={tipoApuesta === 'COMBINADA'}
                    />
                </div>

                <div className="mt-8 flex gap-4 shrink-0 pt-4 border-t border-white/5">
                    <button onClick={onClose} className="flex-1 py-4 text-[10px] font-black uppercase text-[#444] hover:text-white transition-colors">Cancelar Operación</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] py-4 bg-[#00ff88] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#00ff88]/20 hover:scale-[1.01] transition-transform disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                    >
                        {isSubmitting ? 'Guardando...' : 'Confirmar Señal al Sistema'}
                    </button>
                </div>
            </div>
        </div>
    );
};