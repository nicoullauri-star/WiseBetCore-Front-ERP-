
import React, { useState, useEffect } from 'react';
import { X, Save, BadgeCheck, Loader2, RefreshCw, ChevronDown, Store, User, Info } from 'lucide-react';
import { perfilesService, type CreatePerfilData, type PerfilOperativo } from '../services/perfiles.service';
import { personasService, type Persona } from '../services/personas.service';
import { useAgencias } from '../hooks'; // Assuming this hook exists based on previous files

interface ProfileCreateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingProfile: PerfilOperativo | null;
}

export const ProfileCreateEditModal: React.FC<ProfileCreateEditModalProps> = ({
    isOpen, onClose, onSave, editingProfile
}) => {
    const { agencias, isLoading: isAgenciasLoading } = useAgencias();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [isPersonasLoading, setIsPersonasLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<CreatePerfilData>({
        agencia: 0,
        persona: 0,
        nombre_usuario: '',
        tipo_jugador: 'CASUAL',
        nivel_cuenta: 'BRONCE',
        deporte_dna: 1, // Default football
        ip_operativa: '',
        preferencias: '',
        activo: true,
        password: ''
    });

    useEffect(() => {
        const loadData = async () => {
            setIsPersonasLoading(true);
            try {
                const res = await personasService.getAll();
                setPersonas(res.results);
            } catch (err) {
                console.error("Error creating loading personas", err);
            } finally {
                setIsPersonasLoading(false);
            }
        };

        if (isOpen) {
            loadData();

            if (editingProfile) {
                setFormData({
                    agencia: editingProfile.agencia,
                    persona: editingProfile.persona,
                    nombre_usuario: editingProfile.nombre_usuario,
                    tipo_jugador: editingProfile.tipo_jugador,
                    nivel_cuenta: editingProfile.nivel_cuenta,
                    deporte_dna: editingProfile.deporte_dna || 1,
                    ip_operativa: editingProfile.ip_operativa,
                    preferencias: editingProfile.preferencias,
                    activo: editingProfile.activo,
                    password: '' // Don't show password on edit
                });
            } else {
                // Defaults for create
                setFormData({
                    agencia: 0,
                    persona: 0,
                    nombre_usuario: `user_pro_${Math.floor(Math.random() * 1000)}`,
                    tipo_jugador: 'CASUAL',
                    nivel_cuenta: 'BRONCE',
                    deporte_dna: 1,
                    ip_operativa: '127.0.0.1',
                    preferencias: '',
                    activo: true,
                    password: Math.random().toString(36).slice(-8)
                });
            }
        }
    }, [isOpen, editingProfile]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingProfile) {
                await perfilesService.update(editingProfile.id_perfil, formData);
            } else {
                await perfilesService.create(formData);
            }
            onSave();
        } catch (error: any) {
            console.error('Error saving profile:', error);
            alert(`Error al guardar: ${JSON.stringify(error.response?.data || error.message)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-surface-dark border border-border-dark rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-[#151b26]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-xl text-primary border border-primary/20">
                            <BadgeCheck size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">
                                {editingProfile ? 'Editar Perfil Operativo' : 'Nuevo Perfil Operativo'}
                            </h2>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                {editingProfile ? 'Modificar parámetros de operación' : 'Creación y vinculación de infraestructura'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <form id="profile-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                        {/* 1. Infrastructure Linkage */}
                        <div className="col-span-1 sm:col-span-2 space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <Store size={14} className="text-primary" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Infraestructura y Asignación</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Agencia (Casa Matriz) *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.agencia}
                                            onChange={e => setFormData({ ...formData, agencia: Number(e.target.value) })}
                                            className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none appearance-none"
                                            disabled={isAgenciasLoading}
                                        >
                                            <option value={0}>Seleccione Agencia...</option>
                                            {agencias.map(a => (
                                                <option key={a.id_agencia} value={a.id_agencia}>{a.nombre}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Persona Responsable *</label>
                                    <div className="relative">
                                        <select
                                            required
                                            value={formData.persona}
                                            onChange={e => setFormData({ ...formData, persona: Number(e.target.value) })}
                                            className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none appearance-none"
                                            disabled={isPersonasLoading}
                                        >
                                            <option value={0}>Seleccione Persona...</option>
                                            {personas.map(p => (
                                                <option key={p.id_persona} value={p.id_persona}>{p.primer_nombre} {p.primer_apellido}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Account Details */}
                        <div className="col-span-1 sm:col-span-2 space-y-4 pt-2">
                            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                <User size={14} className="text-primary" />
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Credenciales y Configuración</h3>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Usuario Bookie *</label>
                                    <input
                                        required
                                        value={formData.nombre_usuario}
                                        onChange={e => setFormData({ ...formData, nombre_usuario: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    />
                                </div>

                                {!editingProfile && (
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Contraseña Inicial *</label>
                                        <div className="relative">
                                            <input
                                                required
                                                value={formData.password}
                                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none font-mono"
                                            />
                                            <button type="button" onClick={() => setFormData(p => ({ ...p, password: Math.random().toString(36).slice(-10) }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:text-primary text-slate-500 transition-colors">
                                                <RefreshCw size={12} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tipo Jugador</label>
                                    <select
                                        value={formData.tipo_jugador}
                                        onChange={e => setFormData({ ...formData, tipo_jugador: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    >
                                        <option value="PROFESIONAL">Profesional</option>
                                        <option value="RECREATIVO">Recreativo</option>
                                        <option value="CASUAL">Casual</option>
                                        <option value="HIGH_ROLLER">High Roller</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Nivel Cuenta</label>
                                    <select
                                        value={formData.nivel_cuenta}
                                        onChange={e => setFormData({ ...formData, nivel_cuenta: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    >
                                        <option value="BRONCE">Bronce</option>
                                        <option value="PLATA">Plata</option>
                                        <option value="ORO">Oro</option>
                                        <option value="PLATINO">Platino</option>
                                        <option value="DIAMANTE">Diamante</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">IP Operativa</label>
                                    <input
                                        value={formData.ip_operativa}
                                        onChange={e => setFormData({ ...formData, ip_operativa: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none font-mono"
                                        placeholder="192.168.1.1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Notas / Preferencias</label>
                            <textarea
                                rows={2}
                                value={formData.preferencias}
                                onChange={e => setFormData({ ...formData, preferencias: e.target.value })}
                                className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none transition-all placeholder:text-slate-600 resize-none"
                                placeholder="Observaciones operativas..."
                            />
                        </div>

                        {/* Status Toggle */}
                        <div className="col-span-1 sm:col-span-2 pt-2">
                            <div className="flex items-center justify-between p-4 bg-[#0a0b0e] border border-white/10 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white uppercase">Estado Operativo</p>
                                    <p className="text-[9px] text-slate-500 font-medium">Habilitar para operaciones de apuestas automáticas</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, activo: !prev.activo }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.activo ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${formData.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>

                    </form>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border-dark flex justify-end gap-3 bg-[#151b26]">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-[10px] font-bold uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        form="profile-form"
                        type="submit"
                        disabled={isSubmitting || formData.agencia === 0 || formData.persona === 0}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] font-bold uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>{isSubmitting ? 'Guardando...' : 'Guardar Perfil'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
