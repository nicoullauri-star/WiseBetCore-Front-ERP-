
import React, { useState, useEffect } from 'react';
import {
    Search, Plus, Edit, Trash2, Mail, Phone, MapPin,
    User as UserIcon, Calendar, CheckCircle2, XCircle,
    MoreVertical, Shield
} from 'lucide-react';
import { personasService, type Persona, type CreatePersonaData } from '../services/personas.service';
import { UserCreateEditModal } from './UserCreateEditModal';

interface UsersViewProps {
    isActive: boolean;
}

export const UsersView: React.FC<UsersViewProps> = ({ isActive }) => {
    const [users, setUsers] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Persona | null>(null);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const response = await personasService.getAll();
            setUsers(response.results);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isActive) {
            loadUsers();
        }
    }, [isActive]);

    const handleDelete = async (user: Persona) => {
        if (window.confirm(`¿Está seguro de eliminar a ${user.primer_nombre} ${user.primer_apellido}? Esta acción no se puede deshacer.`)) {
            try {
                await personasService.remove(user.id_persona);
                await loadUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Error al eliminar usuario');
            }
        }
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (user: Persona) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        await loadUsers();
        setIsModalOpen(false);
    };

    const filteredUsers = users.filter(u =>
        `${u.primer_nombre} ${u.primer_apellido} ${u.numero_documento}`.toLowerCase().includes(search.toLowerCase())
    );

    if (!isActive) return null;

    return (
        <div className="flex-1 flex flex-col h-full space-y-6 pt-4">
            {/* Actions Header */}
            <div className="flex justify-between items-center px-6">
                <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                    <UserIcon className="text-primary" size={24} />
                    Gestión de Usuarios Físicos
                </h2>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-black uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95"
                >
                    <Plus size={16} /> Nuevo Usuario
                </button>
            </div>

            {/* Filters & Search */}
            <div className="px-6">
                <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, documento..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-background-dark border border-border-dark rounded-xl py-2.5 pl-12 pr-4 text-xs text-white outline-none focus:border-primary transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-auto px-6 pb-20">
                <div className="bg-surface-dark border border-border-dark rounded-3xl overflow-hidden shadow-2xl relative">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-background-dark text-[10px] uppercase text-text-secondary font-black border-b border-border-dark tracking-widest sticky top-0 z-20 shadow-lg">
                                <th className="px-6 py-5">Nombre Completo</th>
                                <th className="px-6 py-5">Identificación</th>
                                <th className="px-6 py-5">Contacto</th>
                                <th className="px-6 py-5">Detalles</th>
                                <th className="px-6 py-5">Estado</th>
                                <th className="px-6 py-5 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-[11px]">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase animate-pulse">
                                        Cargando usuarios...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-500 font-bold uppercase">
                                        No se encontraron usuarios
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id_persona} className="border-b border-border-dark/20 hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-black text-xs">
                                                    {user.primer_nombre[0]}{user.primer_apellido[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-white text-xs">{user.primer_nombre} {user.primer_apellido}</p>
                                                    {user.segundo_nombre && <p className="text-[9px] text-slate-500">{user.segundo_nombre} {user.segundo_apellido}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-black text-slate-300">{user.numero_documento}</span>
                                                <span className="text-[9px] font-bold text-primary uppercase">{user.tipo_documento}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                {user.correo_electronico && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Mail size={10} /> <span>{user.correo_electronico}</span>
                                                    </div>
                                                )}
                                                {user.telefono && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <Phone size={10} /> <span>{user.telefono}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col gap-1">
                                                {user.pais && (
                                                    <div className="flex items-center gap-1.5 text-slate-400">
                                                        <MapPin size={10} /> <span>{user.pais}</span>
                                                    </div>
                                                )}
                                                <span className="text-[9px] text-slate-600">ID: {user.id_persona}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${user.activo
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                                }`}>
                                                {user.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenEdit(user)}
                                                    className="p-1.5 hover:bg-blue-500/20 rounded-lg text-blue-400 transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
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

            {/* Modal */}
            {isModalOpen && (
                <UserCreateEditModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSave}
                    editingUser={editingUser}
                />
            )}
        </div>
    );
};
