import React, { useEffect, useState } from 'react';
import { operationalService } from '@/services/operational.service';
import { Deporte, Competicion } from '@/types/operational.types';
import { Loader2, Trash2, Calendar, Link as LinkIcon, Trophy } from 'lucide-react';

interface PickFormFieldsProps {
    index: number;
    pick: any; // Using explicit any for flexibility during form handling, strictly typed in parent
    onChange: (index: number, field: string, value: any) => void;
    onRemove: (index: number) => void;
    isSingle: boolean;
}

export const PickFormFields = ({ index, pick, onChange, onRemove, isSingle }: PickFormFieldsProps) => {
    const [deportes, setDeportes] = useState<Deporte[]>([]);
    const [competiciones, setCompeticiones] = useState<Competicion[]>([]);
    const [loadingDeportes, setLoadingDeportes] = useState(false);
    const [loadingCompeticiones, setLoadingCompeticiones] = useState(false);

    // Initial Load: Deportes
    useEffect(() => {
        const loadDeportes = async () => {
            setLoadingDeportes(true);
            try {
                const data = await operationalService.getDeportes();
                setDeportes(data.filter(d => d.activo));
            } catch (err) {
                console.error("Error loading sports", err);
            } finally {
                setLoadingDeportes(false);
            }
        };
        loadDeportes();
    }, []);

    // Load Competiciones when Deporte changes
    useEffect(() => {
        if (!pick.deporte) {
            setCompeticiones([]);
            return;
        }
        const loadCompeticiones = async () => {
            setLoadingCompeticiones(true);
            try {
                const data = await operationalService.getCompeticiones(pick.deporte);
                setCompeticiones(data);
            } catch (err) {
                console.error("Error loading competitions", err);
            } finally {
                setLoadingCompeticiones(false);
            }
        };
        loadCompeticiones();
    }, [pick.deporte]);

    return (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 space-y-6 relative group/card">
            {/* Header for Combo */}
            {!isSingle && (
                <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-2">
                    <h4 className="text-[10px] font-black text-[#555] uppercase tracking-widest flex items-center gap-2">
                        <Trophy size={12} className="text-[#00ff88]" /> Partido {index + 1}
                    </h4>
                    {index > 0 && (
                        <button onClick={() => onRemove(index)} className="text-[#666] hover:text-red-500 transition-colors">
                            <Trash2 size={14} />
                        </button>
                    )}
                </div>
            )}

            {/* ERROR / FEEDBACK could go here */}

            {/* ROW 1: Context (Sport, League) */}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Deporte</label>
                    <div className="relative">
                        <select
                            value={pick.deporte}
                            onChange={(e) => onChange(index, 'deporte', Number(e.target.value))}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white appearance-none"
                        >
                            <option value={0}>Seleccionar...</option>
                            {deportes.map(d => (
                                <option key={d.id_deporte} value={d.id_deporte}>{d.nombre}</option>
                            ))}
                        </select>
                        {loadingDeportes && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00ff88]" />}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Torneo / Liga</label>
                    <div className="relative">
                        <select
                            value={pick.competicion}
                            onChange={(e) => onChange(index, 'competicion', Number(e.target.value))}
                            disabled={!pick.deporte}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white appearance-none disabled:opacity-50"
                        >
                            <option value={0}>Seleccionar...</option>
                            {competiciones.map(c => (
                                <option key={c.id_competicion} value={c.id_competicion}>{c.nombre}</option>
                            ))}
                        </select>
                        {loadingCompeticiones && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00ff88]" />}
                    </div>
                </div>
            </div>

            {/* ROW 2: Event Details */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-12 md:col-span-8 space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Evento / Partido</label>
                    <input
                        type="text"
                        value={pick.partido}
                        onChange={(e) => onChange(index, 'partido', e.target.value)}
                        placeholder="Ej: Real Madrid vs Barcelona"
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white"
                    />
                </div>
                <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Hora Inicio</label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={pick.fecha_evento}
                            onChange={(e) => onChange(index, 'fecha_evento', e.target.value)}
                            onClick={(e) => e.currentTarget.showPicker()}
                            className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white placeholder-transparent cursor-pointer"
                        />
                        <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444] pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* ROW 3: Pick Details (Market, Selection, Specific Odd) */}
            <div className="grid grid-cols-12 gap-4">
                <div className="col-span-6 md:col-span-4 space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Mercado</label>
                    <input
                        type="text"
                        value={pick.mercado}
                        onChange={(e) => onChange(index, 'mercado', e.target.value)}
                        placeholder="Ej: 1X2"
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white"
                    />
                </div>
                <div className="col-span-6 md:col-span-4 space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Selección</label>
                    <input
                        type="text"
                        value={pick.seleccion}
                        onChange={(e) => onChange(index, 'seleccion', e.target.value)}
                        placeholder="Ej: Local"
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-white"
                    />
                </div>
                <div className="col-span-12 md:col-span-4 space-y-2">
                    <label className="text-[9px] font-black text-[#333] uppercase tracking-widest">Cuota Pick</label>
                    <input
                        type="number"
                        step="0.01"
                        value={pick.cuota_pick || ''}
                        onChange={(e) => onChange(index, 'cuota_pick', e.target.value)}
                        placeholder="1.80"
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-mono font-bold text-[#00ff88] outline-none focus:border-[#00ff88]/50"
                    />
                </div>
            </div>

            {/* ROW 4: Link (Flashscore) */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-[#333] uppercase tracking-widest flex items-center gap-2">
                    Link Flashscore <span className="text-[#333] font-normal lowercase">(Opcional)</span>
                </label>
                <div className="relative">
                    <input
                        type="url"
                        value={pick.link_partido || ''}
                        onChange={(e) => onChange(index, 'link_partido', e.target.value)}
                        placeholder="https://flashscore.com/match/..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-[#00ff88]/50 text-[#888] focus:text-white"
                    />
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                </div>
            </div>
        </div>
    );
};
