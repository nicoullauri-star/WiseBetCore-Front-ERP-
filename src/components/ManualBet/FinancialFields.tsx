import React, { useEffect } from 'react';
import { useDistribuidoras } from '@/hooks/useDistribuidoras';
import { Loader2, DollarSign, Wallet } from 'lucide-react';

interface FinancialFieldsProps {
    form: any;
    onChange: (field: string, value: any) => void;
    readOnlyTotalOdd?: boolean;
}

export const FinancialFields = ({ form, onChange, readOnlyTotalOdd = false }: FinancialFieldsProps) => {
    const { distribuidoras, isLoading } = useDistribuidoras();

    return (
        <div className="space-y-6 bg-black/20 p-6 rounded-2xl border border-white/5">
            <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] border-b border-white/5 pb-2 flex items-center gap-2">
                <Wallet size={12} /> Datos Financieros
            </h3>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Cuota Fair */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#555] uppercase tracking-widest">Cuota Fair</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.cuota_fair || ''}
                        onChange={(e) => onChange('cuota_fair', e.target.value)}
                        placeholder="2.00"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono font-bold text-[#00ff88] outline-none focus:border-[#00ff88]/50"
                    />
                </div>

                {/* Cuota Fair Black */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#555] uppercase tracking-widest">Fair (Black)</label>
                    <input
                        type="text"
                        value={form.cuota_fair_black || ''}
                        onChange={(e) => onChange('cuota_fair_black', e.target.value)}
                        placeholder="Ej: 1.85 (BM)"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-[#888] outline-none focus:border-[#00ff88]/50"
                    />
                </div>

                {/* Cuota Minima */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#555] uppercase tracking-widest">Min Odd</label>
                    <input
                        type="number"
                        step="0.01"
                        value={form.cuota_minima || ''}
                        onChange={(e) => onChange('cuota_minima', e.target.value)}
                        placeholder="1.90"
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-xs font-mono font-bold text-white outline-none focus:border-[#00ff88]/50"
                    />
                </div>

                {/* Stake */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#555] uppercase tracking-widest">Stake (USD)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="10"
                            value={form.stake_recomendado || ''}
                            onChange={(e) => onChange('stake_recomendado', e.target.value)}
                            placeholder="100"
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#00ff88]/50"
                        />
                        <DollarSign size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#444]" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Distribuidora */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#555] uppercase tracking-widest">Proveedor de Dato</label>
                    <div className="relative">
                        <select
                            value={form.distribuidora || ''}
                            onChange={(e) => onChange('distribuidora', Number(e.target.value))}
                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#00ff88]/50 appearance-none"
                        >
                            <option value="">Seleccionar Distribuidora...</option>
                            {distribuidoras.map(d => (
                                <option key={d.id_distribuidora} value={d.id_distribuidora}>{d.nombre}</option>
                            ))}
                        </select>
                        {isLoading && <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#00ff88]" />}
                    </div>
                </div>

                {/* Cuota Total Calculada (Read Only if Combo) */}
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-[#00ff88] uppercase tracking-widest">Cuota Total (Calculada)</label>
                    <div className="w-full bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl py-3 px-4 flex items-center gap-2">
                        <span className="text-xl font-black text-[#00ff88] font-mono">
                            @{form.cuota_total ? Number(form.cuota_total).toFixed(2) : '0.00'}
                        </span>
                        {readOnlyTotalOdd && <span className="text-[9px] font-bold text-[#00ff88]/60 uppercase ml-auto">AUTO</span>}
                    </div>
                </div>
            </div>

            {/* Notes Area */}
            <div className="space-y-2">
                <label className="text-[9px] font-black text-[#444] uppercase tracking-widest flex items-center gap-2">
                    Notas / Estrategia <span className="text-[#333] font-normal lowercase">(Opcional)</span>
                </label>
                <textarea
                    value={form.notas || ''}
                    onChange={e => onChange('notas', e.target.value)}
                    placeholder="Agregar detalles tácticos, advertencias o contexto..."
                    className="w-full h-20 bg-[#0a0a0a] border border-white/5 rounded-xl p-4 text-xs text-[#ccc] placeholder:text-[#333] focus:border-[#00ff88]/30 outline-none resize-none transition-colors"
                />
            </div>
        </div>
    );
};
