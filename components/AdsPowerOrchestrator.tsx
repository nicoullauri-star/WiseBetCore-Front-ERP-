
import React, { useState } from 'react';
import {
    Server, Shield, Globe, Power, Play, Square,
    RefreshCw, Wifi, CheckCircle2, AlertTriangle, Monitor,
    Layers, Cpu, Activity, X, RotateCw, PlayCircle, StopCircle
} from 'lucide-react';
import { ProfileItem, NodeGroup } from '../types/orchestratorTypes';
import { MOCK_PROFILES } from '../services/orchestratorMocks';

// --- AGENT CONFIRMATION MODAL ---
const AgentActionModal = ({ action, profile, onConfirm, onCancel }: any) => {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-sm bg-[#0c0c0c] border border-white/10 rounded-2xl shadow-2xl p-6 ring-1 ring-white/10">
                <div className="flex flex-col items-center text-center mb-6">
                    <div className="p-4 bg-white/5 rounded-full mb-4 text-[#00ff88]">
                        {action === 'OPEN' && <PlayCircle size={32} />}
                        {action === 'CLOSE' && <StopCircle size={32} className="text-red-500" />}
                        {action === 'ROTATE' && <RotateCw size={32} className="text-blue-500" />}
                    </div>
                    <h3 className="text-lg font-black italic text-white uppercase mb-1">
                        Confirmar Acción
                    </h3>
                    <p className="text-xs text-[#888] font-mono">
                        {action === 'OPEN' && `Abrir navegador para perfil: ${profile?.name}`}
                        {action === 'CLOSE' && `Cerrar sesión forzada: ${profile?.name}`}
                        {action === 'ROTATE' && `Rotar IP del proxy para: ${profile?.name}`}
                    </p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 py-3 text-xs font-bold uppercase text-[#666] hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                        Cancelar
                    </button>
                    <button onClick={onConfirm} className={`flex-1 py-3 text-xs font-black uppercase text-black rounded-xl transition-all shadow-lg ${action === 'CLOSE' ? 'bg-red-500 hover:bg-red-400' : 'bg-[#00ff88] hover:bg-[#00ff88]/90'}`}>
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};


// --- COMPONENT: ADSPOWER ORCHESTRATOR ---
interface AdsPowerOrchestratorProps {
    isOpen: boolean;
    onClose: () => void;
}

export const AdsPowerOrchestrator: React.FC<AdsPowerOrchestratorProps> = ({ isOpen, onClose }) => {
    const [profiles, setProfiles] = useState<ProfileItem[]>(MOCK_PROFILES);
    const [filterGroup, setFilterGroup] = useState<'ALL' | NodeGroup>('ALL');
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [syncProgress, setSyncProgress] = useState(0);

    // AGENT STATE
    const [agentModal, setAgentModal] = useState<{ action: string, profile: ProfileItem } | null>(null);
    const [toast, setToast] = useState<{ msg: string, type: 'success' | 'info' | 'error' } | null>(null);

    // Derived
    const filteredProfiles = profiles.filter(p => filterGroup === 'ALL' || p.group === filterGroup);

    // Actions
    const handleAction = (action: 'OPEN' | 'WARM' | 'CLOSE') => {
        if (action === 'WARM') {
            setIsSyncModalOpen(true);
            setSyncProgress(0);
            const interval = setInterval(() => {
                setSyncProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 500);
        }
    };

    // Agent Actions
    const handleAgentAction = (action: string, profile: ProfileItem) => {
        setAgentModal({ action, profile });
    };

    const confirmAgentAction = () => {
        if (!agentModal) return;

        // Mock execution
        const { action, profile } = agentModal;

        setToast({ msg: `Acción enviada: ${action}`, type: 'success' });
        setTimeout(() => setToast(null), 3000);

        setAgentModal(null);
    };

    if (!isOpen) return null;

    return (
        <div className="w-[450px] bg-[#050505] border-l border-white/5 flex flex-col h-full shadow-2xl relative z-40 animate-in slide-in-from-right duration-300">
            {/* 1. HEADER */}
            <header className="p-6 border-b border-white/5 flex justify-between items-center bg-[#080808]">
                <div>
                    <h2 className="text-lg font-black italic text-white flex items-center gap-2">
                        <Server size={18} className="text-[#00ff88]" />
                        ORCHESTRATOR
                    </h2>
                    <p className="text-[9px] font-bold text-[#666] uppercase tracking-widest pl-7">Agent Control Panel</p>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-[#444] hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </header>

            {/* 2. CONTROLS & FILTERS */}
            <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar relative">

                {/* 2.1 Quick Actions */}
                <div className="grid grid-cols-3 gap-3">
                    <ActionButton
                        label="Abrir"
                        icon={<Monitor size={14} />}
                        onClick={() => handleAction('OPEN')}
                        color="text-blue-400"
                        bg="bg-blue-400/10"
                        borderColor="border-blue-400/20"
                    />
                    <ActionButton
                        label="Precalentar"
                        icon={<Activity size={14} />}
                        onClick={() => handleAction('WARM')}
                        color="text-amber-400"
                        bg="bg-amber-400/10"
                        borderColor="border-amber-400/20"
                    />
                    <ActionButton
                        label="Stop All"
                        icon={<Square size={14} />}
                        onClick={() => handleAction('CLOSE')}
                        color="text-red-400"
                        bg="bg-red-400/10"
                        borderColor="border-red-400/20"
                    />
                </div>

                {/* 2.2 Filters */}
                <div className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/5">
                    {['ALL', 'ELITE', 'STANDARD'].map((g: any) => (
                        <button
                            key={g}
                            onClick={() => setFilterGroup(g)}
                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${filterGroup === g ? 'bg-[#00ff88] text-black shadow-[0_0_10px_rgba(0,255,136,0.3)]' : 'text-[#666] hover:text-white'}`}
                        >
                            {g}
                        </button>
                    ))}
                </div>

                {/* 3. PROFILE GRID WITH AGENT ACTIONS */}
                <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-[#444] uppercase tracking-[0.2em] mb-2">Infraestructura Activa</h3>
                    {filteredProfiles.map(profile => (
                        <ProfileCard
                            key={profile.id}
                            profile={profile}
                            onAgentAction={(action) => handleAgentAction(action, profile)}
                        />
                    ))}
                </div>

                {/* AGENT MODAL */}
                {agentModal && (
                    <AgentActionModal
                        action={agentModal.action}
                        profile={agentModal.profile}
                        onConfirm={confirmAgentAction}
                        onCancel={() => setAgentModal(null)}
                    />
                )}

                {/* TOAST */}
                {toast && (
                    <div className="absolute bottom-4 left-4 right-4 bg-[#00ff88] text-black p-3 rounded-xl shadow-lg flex items-center justify-center gap-2 animate-in slide-in-from-bottom-2 z-[60]">
                        <CheckCircle2 size={16} />
                        <span className="text-xs font-black uppercase">{toast.msg}</span>
                    </div>
                )}
            </div>

            {/* 4. FOOTER STATUS */}
            <div className="p-4 bg-[#080808] border-t border-white/5 text-[9px] font-mono text-[#444] flex justify-between uppercase">
                <span>API Status: <span className="text-[#00ff88]">CONNECTED</span></span>
                <span>Active Nodes: {profiles.filter(p => p.status === 'RUNNING').length}/{profiles.length}</span>
            </div>

            {/* MODAL: SYNC PROGRESS */}
            {isSyncModalOpen && (
                <div className="absolute inset-x-4 bottom-20 bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 z-50 animate-in slide-in-from-bottom-5">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-black text-white uppercase flex items-center gap-2">
                            <RefreshCw size={14} className={`text-amber-500 ${syncProgress < 100 ? 'animate-spin' : ''}`} />
                            Sincronización
                        </h4>
                        <span className="text-xs font-mono text-amber-500">{syncProgress}%</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mb-2">
                        <div
                            className="h-full bg-amber-500 transition-all duration-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                            style={{ width: `${syncProgress}%` }}
                        />
                    </div>

                    <p className="text-[10px] text-[#666] font-mono">
                        {syncProgress < 100 ? 'Aligning Viewports & Humanizing Headers...' : 'All profiles aligned. Ready for injection.'}
                    </p>

                    {syncProgress === 100 && (
                        <button onClick={() => setIsSyncModalOpen(false)} className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black uppercase rounded-lg transition-colors">
                            Ocultar
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

const ActionButton = ({ label, icon, onClick, color, bg, borderColor }: any) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all hover:scale-[1.02] active:scale-95 ${bg} ${borderColor} hover:bg-opacity-20`}>
        <div className={`${color}`}>{icon}</div>
        <span className={`text-[9px] font-black uppercase ${color}`}>{label}</span>
    </button>
);

const ProfileCard = ({ profile, onAgentAction }: { profile: ProfileItem, onAgentAction: (action: string) => void }) => {
    // Determine status color
    const getStatusColor = (s: string) => {
        if (s === 'RUNNING') return 'text-[#00ff88] border-[#00ff88]/20 bg-[#00ff88]/5';
        if (s === 'WARMING') return 'text-amber-500 border-amber-500/20 bg-amber-500/5';
        if (s === 'ERROR') return 'text-red-500 border-red-500/20 bg-red-500/5';
        return 'text-[#666] border-white/5 bg-white/[0.02]';
    };
    const sColor = getStatusColor(profile.status);

    return (
        <div className={`rounded-xl border p-4 ${sColor} relative overflow-hidden group hover:border-opacity-50 transition-all`}>
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Monitor size={12} />
                        <span className="text-xs font-black font-mono tracking-tighter uppercase">{profile.name}</span>
                    </div>
                    <span className="text-[9px] font-bold opacity-60 font-mono tracking-wide">{profile.adsId}</span>
                </div>
                {/* Agent Controls (Visible on hover/always) */}
                <div className="flex gap-1">
                    <button onClick={() => onAgentAction('OPEN')} title="Open Browser" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-[#ccc] hover:text-white transition-colors"><Play size={10} /></button>
                    <button onClick={() => onAgentAction('ROTATE')} title="Rotate Proxy" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-[#ccc] hover:text-blue-400 transition-colors"><RotateCw size={10} /></button>
                    <button onClick={() => onAgentAction('CLOSE')} title="Force Close" className="p-1.5 rounded-lg bg-white/5 hover:bg-white/20 text-[#ccc] hover:text-red-500 transition-colors"><Square size={10} /></button>
                </div>
            </div>

            {/* Proxy Info */}
            <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Globe size={12} className="text-blue-400" />
                    <div>
                        <p className="text-[9px] font-bold text-[#ccc] uppercase">{profile.proxy.location}</p>
                        <p className="text-[8px] font-mono text-[#555]">{profile.proxy.ip}</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-[9px] font-bold ${profile.proxy.latency < 100 ? 'text-[#00ff88]' : 'text-amber-500'}`}>{profile.proxy.latency}ms</p>
                    <p className="text-[8px] text-[#555] font-mono">{profile.proxy.type}</p>
                </div>
            </div>

            {/* Status Indicator Dot */}
            <div className={`absolute top-2 right-2 size-1.5 rounded-full ${profile.status === 'RUNNING' ? 'bg-[#00ff88] animate-pulse' : 'bg-[#333]'}`} />
        </div>
    );
};
