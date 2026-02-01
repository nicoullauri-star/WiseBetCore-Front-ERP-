
import React from 'react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export interface ExecutedBet {
    id: string;
    time: string;
    league: string;
    event: string;
    market: string;
    selection: string;
    odd: number;
    stake: number;
    profit: number; // pending = 0
    status: 'PENDING' | 'WIN' | 'LOSS';
    profileId: string;
    house: string;
}

export const ExecutionHistoryTable = ({ executions }: { executions: ExecutedBet[] }) => {
    return (
        <div className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0a0a0a] text-[9px] font-black text-[#444] uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4 font-black">Hora</th>
                            <th className="px-6 py-4 font-black">Liga / Evento</th>
                            <th className="px-6 py-4 font-black">Mercado / Selección</th>
                            <th className="px-6 py-4 font-black">Perfil / Casa</th>
                            <th className="px-6 py-4 text-center font-black">Cuota</th>
                            <th className="px-6 py-4 text-center font-black">Stake</th>
                            <th className="px-6 py-4 text-right font-black">Estado</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {executions.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="py-12 text-center text-[10px] font-black text-[#333] uppercase">Sin ejecuciones hoy</td>
                            </tr>
                        ) : (
                            executions.map((bet) => (
                                <tr key={bet.id} className="hover:bg-white/[0.01] transition-colors group">
                                    <td className="px-6 py-4 text-[10px] font-mono text-[#666]">{bet.time}</td>
                                    <td className="px-6 py-4">
                                        <p className="text-[9px] font-black text-[#00ff88] uppercase mb-0.5">{bet.league}</p>
                                        <p className="text-xs font-black italic text-white">{bet.event}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-[9px] font-bold text-[#555] uppercase mb-0.5">{bet.market}</p>
                                        <p className="text-xs font-bold text-[#ccc]">{bet.selection}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-white/5 rounded text-[8px] font-black text-[#444] uppercase">{bet.house}</span>
                                            <span className="text-[10px] font-black text-white">{bet.profileId}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-[#00ff88]">@{bet.odd}</td>
                                    <td className="px-6 py-4 text-center font-mono text-xs font-bold text-white">${bet.stake}</td>
                                    <td className="px-6 py-4 text-right">
                                        <StatusBadge status={bet.status} />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    if (status === 'WIN') return <span className="text-[9px] font-black text-[#00ff88] bg-[#00ff88]/10 px-2 py-1 rounded">WIN</span>;
    if (status === 'LOSS') return <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-1 rounded">LOSS</span>;
    return <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded">PENDING</span>;
};