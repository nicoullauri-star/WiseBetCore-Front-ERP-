
import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit, Trash2, BadgeCheck, Shield, Store,
    MoreVertical, Filter, Activity, RefreshCw
} from 'lucide-react';
import { perfilesService, type PerfilOperativo } from '../services/perfiles.service';
// Note: We need to import the modal once created. I'll mock the import or update later.
// For now, I'll assume it exists or I'll implement it in the next step.
// To avoid build errors, I will comment out the import if it doesn't exist yet, 
// but I plan to create ProfileCreateEditModal.tsx immediately after.
import { ProfileCreateEditModal } from './ProfileCreateEditModal';


interface ProfilesViewProps {
    isActive: boolean;
    // Pass specific props if needed
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({ isActive }) => {
    const [profiles, setProfiles] = useState<PerfilOperativo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProfile, setEditingProfile] = useState<PerfilOperativo | null>(null);

    const loadProfiles = async () => {
        try {
            setLoading(true);
            const response = await perfilesService.getAll();
            setProfiles(response.results);
        } catch (error) {
            console.error('Error loading profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            loadProfiles();
        }
    }, [isActive]);

    const handleDelete = async (profile: PerfilOperativo) => {
        if (window.confirm(`¿Está seguro de eliminar el perfil ${profile.nombre_usuario}?`)) {
            try {
                await perfilesService.remove(profile.id_perfil);
                await loadProfiles();
            } catch (error) {
                console.error('Error deleting profile:', error);
                alert('Error al eliminar perfil');
            }
        }
    };

    const handleOpenCreate = () => {
        setEditingProfile(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (profile: PerfilOperativo) => {
        setEditingProfile(profile);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        await loadProfiles();
        setIsModalOpen(false);
    };

    const filteredProfiles = profiles.filter(p =>
        `${p.nombre_usuario} ${p.agencia_nombre || ''} ${p.casa_nombre || ''}`.toLowerCase().includes(search.toLowerCase())
    );

    if (!isActive) return null;

    return (
        <div className="flex-1 flex flex-col h-full space-y-6 pt-4">
            {/* Actions Header */}
            <div className="flex justify-between items-center px-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <BadgeCheck className="text-primary" size={24} />
                    Gestión de Perfiles Operativos
                </h2>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={16} /> Nuevo Perfil
                </button>
            </div>

            {/* Filters & Search */}
            <div className="px-6">
                <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar perfil, usuario, agencia..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background-dark border border-border-dark rounded-xl py-2.5 pl-12 pr-4 text-xs text-white outline-none focus:border-primary transition-all"
                        />
                    </div>

                    {/* Quick Stats/Filters Placeholder */}
                    <div className="flex gap-2 ml-auto">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                            <Activity size={12} className="text-emerald-500" />
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">{profiles.filter(p => p.activo).length} Activos</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 pb-20">
                <div className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden shadow-2xl relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background-dark text-[10px] uppercase text-text-secondary font-black border-b border-border-dark tracking-widest sticky top-0 z-20 shadow-lg">
                                <th className="px-6 py-5">Perfil / Usuario</th>
                                <th className="px-6 py-5">Agencia (Infraestructura)</th>
                                <th className="px-6 py-5">Detalle Operativo</th>
                                <th className="px-6 py-5">Metricas</th>
                                <th className="px-6 py-5">Estado</th>
                                <th className="px-6 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase animate-pulse">
                                        Cargando perfiles...
                                    </td>
                                </tr>
                            ) : filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase">
                                        No se encontraron perfiles
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => (
                                    <tr key={profile.id_perfil} className="border-b border-border-dark/20 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black">
                                                    <BadgeCheck size={16} />
                                                </div>
                                                <div>
                                                    <p className="font-black text-white text-xs">{profile.nombre_usuario}</p>
                                                    <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                                                        {profile.tipo_jugador} • {profile.nivel_cuenta}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1.5 font-bold text-white">
                                                    <Store size={12} className="text-slate-500" />
                                                    {profile.agencia_nombre || `Agencia ID: ${profile.agencia}`}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 uppercase font-bold">
                                                    <Shield size={10} />
                                                    {profile.casa_nombre || 'N/A'}
                                                    {profile.distribuidora_nombre ? ` (${profile.distribuidora_nombre})` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-slate-300">
                                                    <span className="text-slate-500 uppercase text-[9px] font-bold">Deporte:</span> {profile.deporte_nombre || 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-slate-300">
                                                    <span className="text-slate-500 uppercase text-[9px] font-bold">IP:</span> {profile.ip_operativa || 'No asignada'}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-mono text-slate-300">
                                                    Stake Avg: <span className="text-white font-bold">${profile.stake_promedio || '0.00'}</span>
                                                </span>
                                                <span className="text-[9px] font-mono text-slate-500">
                                                    Ops Semanales: {profile.ops_semanales || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${profile.activo
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                {profile.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(profile)}
                                                    className="p-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(profile)}
                                                    className="p-1.5 hover:bg-rose-500/20 rounded-lg text-rose-400 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal will be rendered here */}
            {isModalOpen && (
                <ProfileCreateEditModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    editingProfile={editingProfile}
                />
            )}
        </div>
    );
};
