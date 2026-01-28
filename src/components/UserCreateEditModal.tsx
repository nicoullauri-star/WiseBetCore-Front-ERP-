
import React, { useState, useEffect } from 'react';
import { X, Save, User as UserIcon, Mail, Phone, MapPin, Loader2, RefreshCw } from 'lucide-react';
import { personasService, type CreatePersonaData, type Persona } from '../services/personas.service';

interface UserCreateEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    editingUser: Persona | null;
}

export const UserCreateEditModal: React.FC<UserCreateEditModalProps> = ({
    isOpen, onClose, onSave, editingUser
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<CreatePersonaData>({
        primer_nombre: '',
        segundo_nombre: '',
        primer_apellido: '',
        segundo_apellido: '',
        tipo_documento: 'CED',
        numero_documento: '',
        correo_electronico: '',
        telefono: '',
        pais: 'Ecuador',
        direccion: '',
        activo: true
    });

    useEffect(() => {
        if (editingUser) {
            setFormData({
                primer_nombre: editingUser.primer_nombre,
                segundo_nombre: editingUser.segundo_nombre || '',
                primer_apellido: editingUser.primer_apellido,
                segundo_apellido: editingUser.segundo_apellido || '',
                tipo_documento: editingUser.tipo_documento,
                numero_documento: editingUser.numero_documento || '', // backend might allow null
                correo_electronico: editingUser.correo_electronico || '',
                telefono: editingUser.telefono || '',
                pais: editingUser.pais || 'Ecuador',
                direccion: editingUser.direccion || '',
                activo: editingUser.activo
            });
        } else {
            // Reset form for create mode
            setFormData({
                primer_nombre: '',
                segundo_nombre: '',
                primer_apellido: '',
                segundo_apellido: '',
                tipo_documento: 'CED',
                numero_documento: '',
                correo_electronico: '',
                telefono: '',
                pais: 'Ecuador',
                direccion: '',
                activo: true
            });
        }
    }, [editingUser, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingUser) {
                await personasService.update(editingUser.id_persona, formData);
            } else {
                await personasService.create(formData);
            }
            onSave();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(`Error al guardar: ${JSON.stringify(error.response?.data || error.message)}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-surface-dark border border-border-dark rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-border-dark flex justify-between items-center bg-[#151b26]">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-xl text-primary border border-primary/20">
                            <UserIcon size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-white tracking-tight">
                                {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                            </h2>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">
                                {editingUser ? 'Modificar datos personales' : 'Ingreso de nueva persona física'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <form id="user-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                        {/* Personal Info Group */}
                        <div className="col-span-1 sm:col-span-2 space-y-4">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Datos de Identidad</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Primer Nombre *</label>
                                    <input
                                        required
                                        value={formData.primer_nombre}
                                        onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                        placeholder="Juan"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Segundo Nombre</label>
                                    <input
                                        value={formData.segundo_nombre}
                                        onChange={e => setFormData({ ...formData, segundo_nombre: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Primer Apellido *</label>
                                    <input
                                        required
                                        value={formData.primer_apellido}
                                        onChange={e => setFormData({ ...formData, primer_apellido: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                        placeholder="Pérez"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Segundo Apellido</label>
                                    <input
                                        value={formData.segundo_apellido}
                                        onChange={e => setFormData({ ...formData, segundo_apellido: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Document Info */}
                        <div className="col-span-1 sm:col-span-2 space-y-4 pt-2">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Documentación</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tipo Documento</label>
                                    <select
                                        value={formData.tipo_documento}
                                        onChange={e => setFormData({ ...formData, tipo_documento: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                    >
                                        <option value="CED">Cédula</option>
                                        <option value="RUC">RUC</option>
                                        <option value="PAS">Pasaporte</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Número *</label>
                                    <input
                                        required
                                        value={formData.numero_documento}
                                        onChange={e => setFormData({ ...formData, numero_documento: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none font-mono"
                                        placeholder="1700000000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="col-span-1 sm:col-span-2 space-y-4 pt-2">
                            <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">Contacto</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Correo Electrónico</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                        <input
                                            type="email"
                                            value={formData.correo_electronico}
                                            onChange={e => setFormData({ ...formData, correo_electronico: e.target.value })}
                                            className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                            placeholder="mail@ejemplo.com"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Teléfono / Celular</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                                        <input
                                            type="tel"
                                            value={formData.telefono}
                                            onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                            placeholder="0991234567"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Dirección</label>
                                    <input
                                        value={formData.direccion}
                                        onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                        className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 outline-none"
                                        placeholder="Dirección domiciliar"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Status Toggle */}
                        <div className="col-span-1 sm:col-span-2 pt-2">
                            <div className="flex items-center justify-between p-4 bg-[#0a0b0e] border border-white/10 rounded-xl">
                                <div>
                                    <p className="text-xs font-black text-white uppercase">Estado del Usuario</p>
                                    <p className="text-[9px] text-slate-500 font-medium">Define si el usuario está habilitado en el sistema</p>
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
                        form="user-form"
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-[10px] font-bold uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        <span>{isSubmitting ? 'Guardando...' : 'Guardar Usuario'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
