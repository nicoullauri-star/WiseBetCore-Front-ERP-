
import React, { useState } from 'react';
import { Layers, ChevronDown, Filter, TrendingUp, AlertCircle, Search, Wallet, Lock, UserRound, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export interface Profile {
    id: string;
    balance: number;
    status: 'ACTIVE' | 'REST' | 'LOCKED';
    ecosystem: string;
    bookie: string;
    stakeProm: number;
    sport: string;
}

export const NetworkHierarchy = ({ profiles, onProfileClick }: { profiles: Profile[], onProfileClick?: (profile: Profile) => void }) => {
    const [expandedEcos, setExpandedEcos] = useState<string[]>(['ALTENAR']);
    const [filterText, setFilterText] = useState('');

    // Group profiles by ecosystem
    const ecosystems = Array.from(new Set(profiles.map(p => p.ecosystem)));

    const toggleEco = (eco: string) => {
        setExpandedEcos(prev => prev.includes(eco) ? prev.filter(e => e !== eco) : [...prev, eco]);
    };

    const getEcoStats = (ecoProfiles: Profile[]) => {
        const totalBal = ecoProfiles.reduce((acc, p) => acc + p.balance, 0);
        const lowBalCount = ecoProfiles.filter(p => p.balance < 500).length;
        const activeCount = ecoProfiles.filter(p => p.status === 'ACTIVE').length;
        return { totalBal, lowBalCount, activeCount };
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2 px-1">
                <div className="flex items-center gap-4">
                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.3em]">Mapa de Red</h3>
                    <div className="relative">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#444]" />
                        <input
                            type="text"
                            placeholder="Buscar Perfil..."
                            value={filterText}
                            onChange={(e) => setFilterText(e.target.value)}
                            className="bg-white/5 border border-white/5 rounded-full pl-8 pr-4 py-1.5 text-[10px] text-white focus:border-[#00ff88]/50 w-48 outline-none"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#666] uppercase"><div className="size-2 rounded-full bg-[#00ff88]"></div> Disp.</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#666] uppercase"><div className="size-2 rounded-full bg-amber-500"></div> Low Bal</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-[#666] uppercase"><div className="size-2 rounded-full bg-red-500"></div> Locked</span>
                </div>
            </div>

            {ecosystems.map(eco => {
                const ecoProfiles = profiles.filter(p => p.ecosystem === eco && p.id.toLowerCase().includes(filterText.toLowerCase()));
                if (ecoProfiles.length === 0 && filterText) return null;
                const stats = getEcoStats(profiles.filter(p => p.ecosystem === eco));
                const isExpanded = expandedEcos.includes(eco);

                return (
                    <div key={eco} className="bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden transition-all hover:border-white/10">
                        {/* Header */}
                        <div onClick={() => toggleEco(eco)} className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/[0.02]">
                            <div className="flex items-center gap-4">
                                <div className="size-8 rounded-lg bg-[#00ff88]/10 text-[#00ff88] flex items-center justify-center"><Layers size={16} /></div>
                                <div>
                                    <h4 className="text-xs font-black italic uppercase text-white">{eco}</h4>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="text-[9px] font-bold text-[#555] uppercase">{stats.activeCount} Nodos Activ.</span>
                                        {stats.lowBalCount > 0 && <span className="text-[9px] font-black text-amber-500 uppercase flex items-center gap-1"><AlertCircle size={10} /> {stats.lowBalCount} Low Bal</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-[#444] uppercase">Liquidez Total</p>
                                    <p className="text-sm font-black text-[#00ff88] tabular-nums">${stats.totalBal.toLocaleString()}</p>
                                </div>
                                <ChevronDown size={16} className={`text-[#444] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        {/* Grid */}
                        {isExpanded && (
                            <div className="p-4 pt-0 border-t border-white/5 bg-black/20 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                {ecoProfiles.map(p => (
                                    <ProfileCard key={p.id} profile={p} onClick={() => onProfileClick && onProfileClick(p)} />
                                ))}
                                {ecoProfiles.length === 0 && (
                                    <div className="col-span-full py-8 text-center text-[10px] font-black text-[#333] uppercase">No se encontraron perfiles</div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const ProfileCard = ({ profile, onClick }: { profile: Profile, onClick?: () => void }) => {
    let statusColor = 'border-white/5 bg-white/[0.02]';
    let icon = <UserRound size={12} className="text-[#444]" />;

    if (profile.status === 'LOCKED') {
        statusColor = 'border-red-500/20 bg-red-500/5';
        icon = <Lock size={12} className="text-red-500" />;
    } else if (profile.balance < 500) {
        statusColor = 'border-amber-500/20 bg-amber-500/5';
    } else if (profile.status === 'ACTIVE') {
        statusColor = 'border-[#00ff88]/20 bg-[#00ff88]/5 hover:border-[#00ff88]/50 cursor-pointer';
        icon = <div className="size-2 rounded-full bg-[#00ff88] shadow-[0_0_5px_#00ff88]" />;
    }

    return (
        <div onClick={onClick} className={`p-3 rounded-xl border flex flex-col justify-between gap-3 transition-all group ${statusColor}`}>
            <div className="flex justify-between items-start">
                <span className="text-[10px] font-black italic text-white truncate">{profile.id}</span>
                {icon}
            </div>
            <div>
                <p className="text-[8px] font-black text-[#444] uppercase mb-0.5">Balance</p>
                <p className={`text-xs font-black tabular-nums ${profile.balance < 500 ? 'text-amber-500' : 'text-white group-hover:text-[#00ff88]'}`}>${profile.balance}</p>
            </div>
        </div>
    );
};
