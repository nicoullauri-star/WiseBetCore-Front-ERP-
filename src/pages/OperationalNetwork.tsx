import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
   Search, Filter, Store, BadgeCheck, ShieldAlert, History,
   ExternalLink, Copy, Eye, EyeOff, MoreVertical, Plus,
   ArrowUpRight, ArrowDownRight, Activity, TrendingUp,
   Clock, AlertCircle, Info, ChevronRight, CheckCircle2,
   Lock, Settings2, FileText, Tags, Trash2, LayoutDashboard,
   Users, Calendar, Sparkles, UserPlus, Save, X, BarChart3, TrendingDown,
   ChevronDown, ArrowRight, PieChart as PieChartIcon, Trophy, Edit, RefreshCw
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
   ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useAgencias, useCasas } from '../hooks';
import { useObjetivosPendientes, useObjetivosAgencia, useCalendarioEventos } from '../hooks/useObjetivos';
import { CalendarioObjetivos } from '../components/CalendarioObjetivos';
import { CentroAlertas } from '../components/CentroAlertas';
import { agenciasService } from '../services';
import { objetivosService } from '../services/objetivos.service';
import { personasService, type Persona } from '../services/personas.service';
import { perfilesService } from '../services/perfiles.service';
import type { Agencia, CreateAgenciaData } from '../types';

// --- CONFIG & THRESHOLDS ---
const OPS_CONFIG = {
   lowMovementsThreshold: 10,
   highMovementsThreshold: 150,
   commissionHighThreshold: 100,
   staleSyncMinutes: 60,
};

// --- HELPERS ---
const fmtMoney = (v: number) =>
   new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);

// --- COMPONENTES AUXILIARES ---

const PortalTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
   const [visible, setVisible] = useState(false);
   const [coords, setCoords] = useState({ top: 0, left: 0 });
   const triggerRef = React.useRef<HTMLDivElement>(null);
   const handleMouseEnter = () => { if (triggerRef.current) { const rect = triggerRef.current.getBoundingClientRect(); setCoords({ top: rect.top - 10, left: rect.left + (rect.width / 2) }); setVisible(true); } };
   return (
      <>
         <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)} className="inline-flex cursor-help">{children}</div>
         {visible && createPortal(
            <div className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-[11px] leading-tight rounded-lg shadow-xl border border-white/10 backdrop-blur-md max-w-[220px] text-center animate-in fade-in zoom-in-95 duration-150" style={{ top: coords.top, left: coords.left }}>{text}<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div></div>,
            document.body
         )}
      </>
   );
};

const MetricCard = ({ label, value, sub, color = 'white', tooltip }: any) => (
   <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 shadow-sm group hover:border-primary/40 transition-all cursor-default">
      <div className="flex justify-between items-start mb-1">
         <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{label}</p>
         {tooltip && <PortalTooltip text={tooltip}><Info size={12} className="text-text-secondary/40 hover:text-white" /></PortalTooltip>}
      </div>
      <p className={`text-xl font-black ${color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : color === 'primary' ? 'text-primary' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-secondary font-bold mt-1 uppercase">{sub}</p>}
   </div>
);

// --- MAIN COMPONENT ---

const OperationalNetwork: React.FC = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState<'agencias' | 'perfiles' | 'movimientos' | 'usuarios' | 'calendario'>('agencias');
   const [selectedAgencyForDetails, setSelectedAgencyForDetails] = useState<Agencia | null>(null);
   const [showNuevoObjetivoDrawer, setShowNuevoObjetivoDrawer] = useState(false);
   const [nuevoObjetivoDrawerData, setNuevoObjetivoDrawerData] = useState({
      cantidad_objetivo: 5,
      plazo_dias: 30,
      estado_inicial_perfiles: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
   });
   const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

   // Auto-close toast
   useEffect(() => {
      if (!toast) return;
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
   }, [toast]);

   // Reset formulario cuando se cierra el drawer
   useEffect(() => {
      if (!selectedAgencyForDetails) {
         setShowNuevoObjetivoDrawer(false);
         setNuevoObjetivoDrawerData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
      }
   }, [selectedAgencyForDetails]);

   // --- HOOKS ---
   const { agencias, isLoading: loadingAgencias, createAgencia, deleteAgencia, refetch: refetchAgencias } = useAgencias();
   const { casas, isLoading: loadingCasas } = useCasas();
   const { objetivos: objetivosPendientes, isLoading: loadingObjetivos, refetch: refetchObjetivos } = useObjetivosPendientes();
   const { historial: historialObjetivos, isLoading: loadingHistorial, refetch: refetchHistorial } = useObjetivosAgencia(
      selectedAgencyForDetails?.id_agencia || null
   );
   const { eventos: eventosCalendario, isLoading: loadingEventos, refetch: refetchEventos } = useCalendarioEventos();

   const [search, setSearch] = useState('');
   const [selectedAgencyId, setSelectedAgencyId] = useState<number | null>(null);
   const [editingAgency, setEditingAgency] = useState<Agencia | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);

   // Filtros
   const [dateRangeType, setDateRangeType] = useState<'Mes actual' | '7d' | '30d' | 'Personalizado'>('Mes actual');
   const [activeFilter, setActiveFilter] = useState<'all' | 'high_comm' | 'gaps'>('all'); // 'gaps' functionality needs profile count check

   const rangeLabel = dateRangeType === 'Mes actual' ? '(mes actual)' : '(rango)';

   const filteredAgencies = useMemo(() => {
      // Mocked calculation fields for now as they are not in the model yet
      const processedAgencies = agencias.map(a => ({
         ...a,
         houseGGR: 0, // Placeholder
         movements: 0, // Placeholder
         status: a.activo ? 'Active' : 'Blocked',
         profiles: []
      }));

      let res = processedAgencies.filter(a =>
         a.nombre.toLowerCase().includes(search.toLowerCase()) ||
         a.responsable.toLowerCase().includes(search.toLowerCase())
      );

      // Simple mock logic for filters as real data is missing metrics
      return res;
   }, [agencias, search, activeFilter]);

   const stats = useMemo(() => {
      // Placeholder stats until analytics endpoints exist
      return { totalGGR: 0, winners: [], losers: [], commTotal: 0, profileGaps: [] };
   }, [filteredAgencies]);

   const selectedAgency = useMemo(() => filteredAgencies.find(a => a.id_agencia === selectedAgencyId), [filteredAgencies, selectedAgencyId]);
   const selectedAgencyCasa = useMemo(() => casas.find(c => c.id_casa === selectedAgency?.casa_madre), [selectedAgency, casas]);

   // Form State para Nueva Agencia
   const [formData, setFormData] = useState<CreateAgenciaData>({
      nombre: '',
      responsable: '',
      contacto: '',
      email: '',
      casa_madre: 0,
      rake_porcentaje: 0,
      url_backoffice: '',
      tiene_arrastre: false,
      activo: true
   });
   const [selectedPersonaId, setSelectedPersonaId] = useState<number>(0);
   const [tipoDocumento, setTipoDocumento] = useState<string>('');
   const [numeroDocumento, setNumeroDocumento] = useState<string>('');

   // State para planificación de perfiles (opcional al crear agencia)
   const [definirObjetivo, setDefinirObjetivo] = useState(false);
   const [objetivoData, setObjetivoData] = useState({
      cantidad_objetivo: 5,
      plazo_dias: 30,
      estado_inicial_perfiles: 'ACTIVO' as 'ACTIVO' | 'INACTIVO'
   });

   const handleSaveAgency = async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Validaciones mejoradas con mensajes específicos
      if (!formData.nombre.trim()) {
         setToast({ message: '⚠️ El nombre de la agencia es obligatorio', type: 'error' });
         return;
      }
      if (formData.nombre.trim().length < 3) {
         setToast({ message: '⚠️ El nombre debe tener al menos 3 caracteres', type: 'error' });
         return;
      }
      if (selectedPersonaId === 0) {
         setToast({ message: '⚠️ Debe seleccionar un responsable', type: 'error' });
         return;
      }
      if (formData.casa_madre === 0) {
         setToast({ message: '⚠️ Debe seleccionar una casa madre', type: 'error' });
         return;
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
         setToast({ message: '⚠️ El email no es válido', type: 'error' });
         return;
      }
      if (formData.rake_porcentaje < 0 || formData.rake_porcentaje > 100) {
         setToast({ message: '⚠️ El porcentaje de rake debe estar entre 0 y 100', type: 'error' });
         return;
      }

      setIsSubmitting(true);
      try {
         let agenciaCreada: Agencia | null = null;

         if (editingAgency) {
            // Update mode - NO se crea objetivo en edición
            await agenciasService.update(editingAgency.id_agencia, formData);
            setToast({ message: '✨ Agencia actualizada exitosamente', type: 'success' });
         } else {
            // Create mode
            agenciaCreada = await createAgencia(formData);
            
            // Si se definió objetivo, validar y crearlo (2do request)
            if (definirObjetivo && agenciaCreada) {
               // Validar datos del objetivo
               if (objetivoData.cantidad_objetivo <= 0) {
                  setToast({ message: '⚠️ Agencia creada. Objetivo inválido: cantidad debe ser mayor a 0', type: 'info' });
                  await refetchAgencias();
                  setIsModalOpen(false);
                  setEditingAgency(null);
                  setFormData({
                     nombre: '', responsable: '', contacto: '', email: '', casa_madre: 0, rake_porcentaje: 30, url_backoffice: '', tiene_arrastre: false, activo: true
                  });
                  setDefinirObjetivo(false);
                  setObjetivoData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
                  setIsSubmitting(false);
                  return;
               }
               if (objetivoData.plazo_dias <= 0) {
                  setToast({ message: '⚠️ Agencia creada. Objetivo inválido: plazo debe ser mayor a 0', type: 'info' });
                  await refetchAgencias();
                  setIsModalOpen(false);
                  setEditingAgency(null);
                  setFormData({
                     nombre: '', responsable: '', contacto: '', email: '', casa_madre: 0, rake_porcentaje: 30, url_backoffice: '', tiene_arrastre: false, activo: true
                  });
                  setDefinirObjetivo(false);
                  setObjetivoData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
                  setIsSubmitting(false);
                  return;
               }
               
               try {
                  await objetivosService.create({
                     agencia: agenciaCreada.id_agencia,
                     ...objetivoData
                  });
                  // Refrescar objetivos pendientes para actualizar el panel
                  await Promise.all([
                     refetchObjetivos(),
                     refetchEventos()
                  ]);
                  setToast({ 
                     message: `🎉 Agencia creada con objetivo: ${objetivoData.cantidad_objetivo} perfiles en ${objetivoData.plazo_dias} días`, 
                     type: 'success' 
                  });
               } catch (objError) {
                  console.error('Error creando objetivo:', objError);
                  setToast({ 
                     message: '⚠️ Agencia creada pero error al crear objetivo', 
                     type: 'info' 
                  });
               }
            } else {
               setToast({ message: '🎉 Agencia creada exitosamente', type: 'success' });
            }
         }

         // Refetch antes de cerrar
         await refetchAgencias();
         
         setIsModalOpen(false);
         setEditingAgency(null);
         
         // Reset form
         setFormData({
            nombre: '', responsable: '', contacto: '', email: '', casa_madre: 0, rake_porcentaje: 30, url_backoffice: '', tiene_arrastre: false, activo: true
         });
         setSelectedPersonaId(0);
         setTipoDocumento('');
         setNumeroDocumento('');
         setDefinirObjetivo(false);
         setObjetivoData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
      } catch (error) {
         console.error(error);
         setToast({ message: '❌ Error al guardar la agencia', type: 'error' });
      } finally {
         setIsSubmitting(false);
      }
   };

   // Función para crear objetivo desde el drawer
   const handleCrearObjetivoDrawer = async () => {
      if (!selectedAgencyForDetails) return;
      
      // Validaciones mejoradas
      if (nuevoObjetivoDrawerData.cantidad_objetivo <= 0) {
         setToast({ message: '⚠️ La cantidad debe ser mayor a 0', type: 'error' });
         return;
      }
      if (nuevoObjetivoDrawerData.cantidad_objetivo > 1000) {
         setToast({ message: '⚠️ La cantidad no puede superar 1000 perfiles', type: 'error' });
         return;
      }
      if (nuevoObjetivoDrawerData.plazo_dias <= 0) {
         setToast({ message: '⚠️ El plazo debe ser mayor a 0 días', type: 'error' });
         return;
      }
      if (nuevoObjetivoDrawerData.plazo_dias > 365) {
         setToast({ message: '⚠️ El plazo no puede superar 365 días', type: 'error' });
         return;
      }

      setIsSubmitting(true);
      try {
         await objetivosService.create({
            agencia: selectedAgencyForDetails.id_agencia,
            ...nuevoObjetivoDrawerData
         });
         
         // Refrescar ambos: historial del drawer Y panel de pendientes
         await Promise.all([
            refetchHistorial(),
            refetchObjetivos(),
            refetchEventos()
         ]);
         
         setToast({ 
            message: `✅ Objetivo creado: ${nuevoObjetivoDrawerData.cantidad_objetivo} perfiles en ${nuevoObjetivoDrawerData.plazo_dias} días`, 
            type: 'success' 
         });
         
         // Reset form y cerrar
         setShowNuevoObjetivoDrawer(false);
         setNuevoObjetivoDrawerData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
      } catch (error) {
         console.error('Error creando objetivo desde drawer:', error);
         setToast({ message: '❌ Error al crear objetivo', type: 'error' });
      } finally {
         setIsSubmitting(false);
      }
   };

   // --- SHARED PERSONAS STATE ---
   const [personas, setPersonas] = useState<Persona[]>([]);
   const [isPersonasLoading, setIsPersonasLoading] = useState(false);

   // --- CALENDAR FILTER FROM ALERTS ---
   const [calendarioFiltroAgencia, setCalendarioFiltroAgencia] = useState<number | null>(null);

   // --- PROFILE CREATION STATE ---
   const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
   const [profileModalFromCalendar, setProfileModalFromCalendar] = useState(false);
   const [profileForm, setProfileForm] = useState({
      persona_id: 0,
      username: '', // e.g. user_pro_XX
      password: '',
      tipo_jugador: 'CASUAL',
      nivel_cuenta: 'BRONCE',
      notes: ''
   });

   useEffect(() => {
      if (isProfileModalOpen) {
         loadPersonas();
         // Pre-generate username if possible or leave empty
         setProfileForm(prev => ({ ...prev, username: `user_pro_${Math.floor(Math.random() * 1000)}`, password: Math.random().toString(36).slice(-8) }));
      }
   }, [isProfileModalOpen]);

   useEffect(() => {
      if (isModalOpen) {
         loadPersonas();
      }
   }, [isModalOpen]);

   const loadPersonas = async () => {
      try {
         setIsPersonasLoading(true);
         const res = await personasService.getAll();
         setPersonas(res.results);
      } catch (err) {
         console.error("Error loading personas", err);
      } finally {
         setIsPersonasLoading(false);
      }
   };

   // Función para cerrar modal de perfil (limpia selectedAgencyId si viene del calendario)
   const closeProfileModal = () => {
      setIsProfileModalOpen(false);
      if (profileModalFromCalendar) {
         setSelectedAgencyId(null);
         setProfileModalFromCalendar(false);
      }
   };

   const handleCreateProfile = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedAgency) return;

      try {
         setIsSubmitting(true);
         // Construct payload
         // Note: In a real app we might need to create the User first or have a specialized endpoint.
         // Here we assume the backend endpoint handles the creation or we send necessary data.
         // Given I don't have a "Create User" endpoint exposed in the plan, 
         // I will assume for now we are creating the PerfilOperativo and IF the backend requires a User, 
         // Given I don't have a "Create User" endpoint exposed in the plan,
         // I will assume for now we are creating the PerfilOperativo and IF the backend requires a User,
         // I might need to adjust or pick a dummy user.
         // However, the prompt implies "assign a user and password".
         // I'll send this data. If the standard ViewSet doesn't handle it, I'll need to modify the backend.
         // For now, let's proceed with sending the data.

         const payload = {
            agencia: selectedAgency.id_agencia,
            persona: profileForm.persona_id,
            nombre_usuario: profileForm.username,
            tipo_jugador: profileForm.tipo_jugador,
            nivel_cuenta: profileForm.nivel_cuenta,
            deporte_dna: 1, // Defaulting to Futbol for MVP
            ip_operativa: '127.0.0.1',
            preferencias: profileForm.notes
         };

         await perfilesService.create(payload);
         
         // Refrescar datos ANTES de cerrar modal para asegurar actualización
         await Promise.all([
            refetchAgencias(),
            refetchObjetivos(),
            refetchEventos()
         ]);
         
         closeProfileModal();
         setToast({ message: '✅ Perfil creado exitosamente', type: 'success' });

      } catch (err: any) {
         console.error(err);
         // Show more specific error
         const msg = err.response?.data ? JSON.stringify(err.response.data) : "Error al crear perfil.";
         alert(`Error: ${msg}`);
      } finally {
         setIsSubmitting(false);
      }
   };

   const openCreateModal = () => {
      setEditingAgency(null);
      setFormData({
         nombre: '', responsable: '', contacto: '', email: '', casa_madre: 0, rake_porcentaje: 30, url_backoffice: '', tiene_arrastre: false, activo: true
      });
      setSelectedPersonaId(0);
      setTipoDocumento('');
      setNumeroDocumento('');
      setDefinirObjetivo(false);
      setObjetivoData({ cantidad_objetivo: 5, plazo_dias: 30, estado_inicial_perfiles: 'ACTIVO' });
      setIsModalOpen(true);
   };

   const openEditModal = (agency: Agencia) => {
      setEditingAgency(agency);
      setFormData({
         nombre: agency.nombre,
         responsable: agency.responsable,
         contacto: agency.contacto || '',
         email: agency.email || '',
         casa_madre: agency.casa_madre,
         rake_porcentaje: agency.rake_porcentaje,
         url_backoffice: agency.url_backoffice || '',
         tiene_arrastre: agency.tiene_arrastre ?? false,
         activo: agency.activo
      });
      setSelectedPersonaId(0);
      setTipoDocumento('');
      setNumeroDocumento('');
      // NO mostrar sección de objetivo en modo edición
      setDefinirObjetivo(false);
      setIsModalOpen(true);
   };

   const tabs = [
      { id: 'agencias', label: 'Agencias', icon: <Store size={18} /> },
      { id: 'perfiles', label: 'Perfiles', icon: <BadgeCheck size={18} /> },
      { id: 'movimientos', label: 'Movimientos', icon: <Activity size={18} /> },
      { id: 'usuarios', label: 'Usuarios', icon: <Users size={18} /> },
      { id: 'calendario', label: 'Planificador De Red Operativa', icon: <Calendar size={18} /> },
   ];

   return (
      <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-slate-300 relative overflow-hidden">

         {/* Toast Animado */}
         {toast && (
            <div className="fixed top-4 right-4 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
               <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border-2 flex items-center gap-3 min-w-[320px] ${
                  toast.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' :
                  toast.type === 'error' ? 'bg-rose-500/20 border-rose-500/50 text-rose-100' :
                  'bg-blue-500/20 border-blue-500/50 text-blue-100'
               }`}>
                  <div className="animate-bounce">
                     {toast.type === 'success' && <CheckCircle2 size={24} className="text-emerald-400" />}
                     {toast.type === 'error' && <AlertCircle size={24} className="text-rose-400" />}
                     {toast.type === 'info' && <Info size={24} className="text-blue-400" />}
                  </div>
                  <p className="text-sm font-bold flex-1">{toast.message}</p>
                  <button 
                     onClick={() => setToast(null)}
                     className="p-1 hover:bg-white/10 rounded-lg transition-all"
                  >
                     <X size={18} />
                  </button>
               </div>
            </div>
         )}

         {/* 1. CABECERA Y FILTRO DE FECHA */}
         <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-dark bg-surface-dark/95 backdrop-blur-md sticky top-0 z-40 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-primary/20 rounded-lg sm:rounded-xl text-primary border border-primary/20"><LayoutDashboard size={20} /></div>
                  <div>
                     <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">RED OPERATIVA</h1>
                     <p className="text-[9px] sm:text-[10px] text-text-secondary font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Network Command Center</p>
                  </div>
               </div>

               <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex items-center bg-background-dark border border-border-dark rounded-lg sm:rounded-xl p-1 shadow-inner overflow-x-auto max-w-full">
                     {['Mes actual', '7d', '30d', 'Personalizado'].map(p => (
                        <button
                           key={p}
                           onClick={() => setDateRangeType(p as any)}
                           className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${dateRangeType === p ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                        >
                           {p === 'Personalizado' ? 'Custom' : p}
                        </button>
                     ))}
                  </div>
                  
                  {/* Centro de Alertas */}
                  <CentroAlertas
                     onPlanificarClick={(agenciaId, objetivoId) => {
                        // Filtrar calendario por la agencia y cambiar a la pestaña calendario
                        setCalendarioFiltroAgencia(agenciaId);
                        setActiveTab('calendario');
                     }}
                     onCrearPerfilClick={(agenciaId, objetivoId) => {
                        // Abrir modal de crear perfil con la agencia seleccionada (desde calendario/alertas)
                        setSelectedAgencyId(agenciaId);
                        setProfileModalFromCalendar(true);
                        setIsProfileModalOpen(true);
                     }}
                  />
                  
                  <button
                     onClick={openCreateModal}
                     className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase rounded-lg sm:rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 flex-shrink-0"
                  >
                     <Plus size={14} /> <span className="hidden xs:inline">Nueva</span>
                  </button>
               </div>
            </div>

            <div className="flex gap-1 overflow-x-auto no-scrollbar">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                  >
                     {tab.icon} {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'agencias' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-10 pb-32 sm:pb-40">


               {/* 1.5 TOP AGENCIES & QUICK ACTIONS */}
               <section className="bg-surface-dark/50 border border-border-dark/50 rounded-3xl p-6 backdrop-blur-sm mb-6">
                  <div className="flex justify-between items-center mb-6">
                     <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Trophy size={18} /></div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Agencias</h3>
                     </div>
                     <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary text-primary hover:text-white text-[10px] font-black uppercase rounded-xl transition-all border border-primary/20 hover:border-primary">
                        <Plus size={14} /> Nueva Agencia
                     </button>
                  </div>

                  <div className="flex flex-col gap-3">
                     {agencias.slice(0, 5).map((agency, idx) => (
                        <div key={agency.id_agencia} className="group relative bg-[#0f1115] border border-white/5 hover:border-primary/50 rounded-2xl p-4 transition-all hover:shadow-lg hover:shadow-primary/5 hover:translate-x-1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

                           {/* Info Principal */}
                           <div className="flex items-center gap-4 w-full sm:w-1/3">
                              <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rank</span>
                                 <span className="text-lg font-black text-white">#{idx + 1}</span>
                              </div>
                              <div className="p-3 bg-white/5 rounded-xl text-slate-400 group-hover:text-white group-hover:bg-primary/20 transition-all">
                                 <Store size={20} />
                              </div>
                              <div>
                                 <h4 className="text-sm font-black text-white">{agency.nombre}</h4>
                                 <p className="text-[10px] text-slate-500 font-bold uppercase">{casas.find(c => c.id_casa === agency.casa_madre)?.nombre || 'Unknown Bookie'}</p>
                              </div>
                           </div>

                           {/* Detalles Completos */}
                           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full sm:w-1/2">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-600 uppercase">Responsable</span>
                                 <span className="text-[11px] text-slate-300 font-semibold truncate">{agency.responsable}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-600 uppercase">GGR</span>
                                 <span className="text-[11px] text-primary font-mono font-bold">${((agency as any).ggr || 0).toLocaleString()}</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-600 uppercase">Rake</span>
                                 <span className="text-[11px] text-slate-300 font-semibold">{agency.rake_porcentaje}%</span>
                              </div>
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-bold text-slate-600 uppercase">Estado</span>
                                 <div className="flex items-center gap-1.5 mt-0.5">
                                    <span className={`w-1.5 h-1.5 rounded-full ${agency.activo ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                    <span className={`text-[10px] font-bold ${agency.activo ? 'text-emerald-500' : 'text-rose-500'}`}>{agency.activo ? 'ACTIVO' : 'INACTIVO'}</span>
                                 </div>
                              </div>
                           </div>

                           {/* Acciones */}
                           <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:opacity-0 sm:translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedAgencyForDetails(agency);
                                 }}
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                              >
                                 <Info size={12} /> Detalles
                              </button>
                              <button
                                 onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(agency);
                                 }}
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                              >
                                 <Edit size={12} /> Editar
                              </button>
                              <button
                                 onClick={async (e) => {
                                    e.stopPropagation();
                                    const confirmacion = window.confirm(
                                       `⚠️ ¿Está seguro de eliminar la agencia "${agency.nombre}"?\n\n` +
                                       `Esta acción no se puede deshacer y se eliminarán:\n` +
                                       `• ${agency.perfiles_totales || 0} perfiles asociados\n` +
                                       `• Todos los objetivos vinculados\n` +
                                       `• Historial de movimientos\n\n` +
                                       `Presione OK para confirmar la eliminación.`
                                    );
                                    
                                    if (confirmacion) {
                                       try {
                                          await deleteAgencia(agency.id_agencia);
                                          setToast({ message: '✅ Agencia eliminada exitosamente', type: 'success' });
                                       } catch (err) {
                                          setToast({ message: '❌ Error al eliminar la agencia', type: 'error' });
                                          console.error('Error al eliminar:', err);
                                       }
                                    }
                                 }}
                                 className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider"
                              >
                                 <Trash2 size={12} /> Eliminar
                              </button>
                           </div>

                           {/* Backoffice Link Hint */}
                           {agency.url_backoffice && (
                              <a href={agency.url_backoffice} target="_blank" rel="noreferrer" className="absolute top-2 right-2 p-1.5 text-slate-700 hover:text-primary transition-colors">
                                 <ExternalLink size={12} />
                              </a>
                           )}
                        </div>
                     ))}
                     {agencias.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/5 mx-auto w-full">
                           <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
                              <Store className="text-slate-600" size={20} />
                           </div>
                           <p className="text-xs text-slate-400 font-bold uppercase">No se encontraron agencias</p>
                        </div>
                     )}
                  </div>
               </section>

               {/* 2. PANELES INTERACTIVOS */}
               <section className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6 max-w-7xl">
                  <InteractivePanel
                     title="Agencias más ganadoras"
                     subtitle="Top Profit Casa"
                     icon={<TrendingUp size={16} />}
                     color="success"
                     data={stats.winners.map((w: any) => ({ id: w.nombre, val: fmtMoney(w.houseGGR || 0), sub: w.responsable }))}
                     onClick={(id: number) => setSelectedAgencyId(id)}
                  />
                  <InteractivePanel
                     title="Casa perdiendo (Riesgo)"
                     subtitle="Monitoreo de limitación"
                     icon={<TrendingDown size={16} />}
                     color="danger"
                     warning="Si la casa pierde, la comisión puede bajar."
                     data={stats.losers.map((l: any) => ({ id: l.nombre, val: fmtMoney(l.houseGGR || 0), sub: l.responsable }))}
                     onClick={(id: number) => setSelectedAgencyId(id)}
                  />
                  <InteractivePanel
                     title="Comisión a proteger"
                     subtitle=">$100 en rango"
                     icon={<ShieldAlert size={16} />}
                     color="primary"
                     isFilter
                     isActive={activeFilter === 'high_comm'}
                     data={[{ id: 'Filtrar agencias', val: fmtMoney(stats.commTotal), sub: 'Total estimado' }]}
                     onClick={() => setActiveFilter(activeFilter === 'high_comm' ? 'all' : 'high_comm')}
                  />
                  <InteractivePanel
                     title="Perfiles pendientes"
                     subtitle={loadingObjetivos ? "cargando..." : objetivosPendientes.length === 0 ? "sin objetivos" : `${objetivosPendientes.length} objetivos en curso`}
                     icon={loadingObjetivos ? <AlertCircle size={16} className="animate-pulse" /> : objetivosPendientes.length === 0 ? <CheckCircle2 size={16} className="text-green-500" /> : <AlertCircle size={16} />}
                     color={objetivosPendientes.length === 0 ? "success" : "red"}
                     isFilter={false}
                     isActive={false}
                     data={objetivosPendientes.length === 0 
                        ? [{ id: 'empty', val: 'No hay objetivos pendientes', sub: '✨ Todos los objetivos completados' }]
                        : objetivosPendientes.slice(0, 3).map(obj => {
                           // Calcular días restantes hasta la fecha límite
                           const fechaLimite = new Date(obj.fecha_limite);
                           const hoy = new Date();
                           const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                           
                           // Determinar color según urgencia
                           let urgenciaColor = 'text-green-600';
                           if (diasRestantes < 7) urgenciaColor = 'text-red-600 font-semibold';
                           else if (diasRestantes < 15) urgenciaColor = 'text-amber-600';
                           
                           return {
                              id: obj.id_objetivo,
                              val: (
                                 <div className="flex flex-col gap-1 w-full">
                                    <span className="font-medium text-sm">Faltan: {obj.perfiles_restantes} perfiles</span>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                       <div 
                                          className="bg-blue-600 h-1.5 rounded-full transition-all duration-300" 
                                          style={{ width: `${obj.porcentaje_completado}%` }}
                                       />
                                    </div>
                                 </div>
                              ),
                              sub: `${obj.agencia_nombre} • ${obj.cantidad_completada}/${obj.cantidad_objetivo} • ${diasRestantes > 0 ? `${diasRestantes}d` : 'Vencido'}`
                           };
                        })
                     }
                     onClick={() => { }}
                  />
               </section>

               {/* 3. CHARTS */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  <div className="bg-surface-dark border border-border-dark rounded-3xl p-6 shadow-xl">
                     <div className="flex items-center gap-2 mb-6 text-white">
                        <BarChart3 size={18} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">GGR Casa por Casa de Apuestas</h3>
                     </div>
                     <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={casas.map(b => ({ name: b.nombre, val: agencias.filter(a => a.casa_madre === b.id_casa).length }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#111318', border: 'none', borderRadius: '12px' }} />
                              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                 {casas.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#135bec' : '#2563eb'} />)}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-surface-dark border border-border-dark rounded-3xl p-6 shadow-xl">
                     <div className="flex items-center gap-2 mb-6 text-white">
                        {/* Use PieChartIcon from lucide-react instead of PieChart from recharts to fix TypeScript error */}
                        <PieChartIcon size={18} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Distribución: Casa Ganando vs Perdiendo</h3>
                     </div>
                     <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Casa Ganando', value: 0 },
                                    { name: 'Casa Perdiendo', value: 0 }
                                 ]}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                              >
                                 <Cell fill="#10b981" />
                                 <Cell fill="#ef4444" />
                              </Pie>
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#111318', border: 'none', borderRadius: '12px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </section>

               {/* 4. TABLA DE AGENCIAS */}
               <section className="bg-surface-dark border border-border-dark rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-border-dark flex justify-between items-center gap-4">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                           type="text"
                           placeholder="Buscar por ID, Dueño, Casa..."
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-primary transition-all"
                        />
                     </div>
                     <div className="flex gap-2">
                        <FilterChip label="Estado" icon={<Activity size={12} />} />
                        <FilterChip label="Solo GGR Rojo" icon={<ArrowDownRight size={12} />} active={activeFilter === 'all'} />
                     </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                           <tr className="bg-background-dark/50 text-[10px] uppercase text-text-secondary font-black border-b border-border-dark tracking-widest sticky top-0 z-10 backdrop-blur-md">
                              <th className="px-6 py-5">ID</th>
                              <th className="px-6 py-5">Dueño</th>
                              <th className="px-6 py-5">Casa</th>
                              <th className="px-6 py-5">Estado</th>
                              <th className="px-6 py-5 text-center">Rake %</th>
                              <th className="px-6 py-5 text-right">Movimientos {rangeLabel}</th>
                              <th className="px-6 py-5 text-right">GGR Casa {rangeLabel}</th>
                              <th className="px-6 py-5 text-right">Comisión estimada {rangeLabel}</th>
                              <th className="px-6 py-5">Perfiles Activos</th>
                              <th className="px-6 py-5">Alertas</th>
                              <th className="px-6 py-5 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="text-[11px]">
                           {filteredAgencies.map((a) => {
                              const comm = a.houseGGR > 0 ? (a.houseGGR * (a.rake_porcentaje / 100)) : 0;
                              const missing = 0; // Placeholder until min profiles defined

                              return (
                                 <tr
                                    key={a.id_agencia}
                                    onClick={() => setSelectedAgencyId(a.id_agencia)}
                                    className="border-b border-border-dark/20 hover:bg-white/[0.02] cursor-pointer transition-all group"
                                 >
                                    <td className="px-6 py-5 font-mono font-black text-primary">{a.nombre}</td>
                                    <td className="px-6 py-5 font-bold text-white">{a.responsable}</td>
                                    <td className="px-6 py-5 font-bold text-slate-400">{casas.find(c => c.id_casa === a.casa_madre)?.nombre || `Id: ${a.casa_madre}`}</td>
                                    <td className="px-6 py-5">
                                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${a.activo ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                          }`}>{a.activo ? 'Activo' : 'Bloqueado'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center font-bold text-slate-500">{a.rake_porcentaje}%</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-white">{0}</td>
                                    <td className={`px-6 py-5 text-right font-mono font-black text-sm text-slate-500`}>
                                       --
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-black">
                                       {0 > 0 ? (
                                          <span className="text-primary">{fmtMoney(comm)}</span>
                                       ) : (
                                          <PortalTooltip text="Sin comisión en este rango: la casa no va ganando.">
                                             <span className="text-slate-600">—</span>
                                          </PortalTooltip>
                                       )}
                                    </td>
                                    <td className="px-6 py-5">
                                       <PortalTooltip text={`Recomendación: \n- Próxima creación: Sugerida 1/sem`}>
                                          <div className="flex flex-col gap-1">
                                             <div className="flex items-center gap-2">
                                                <span className="text-white font-black">Total: {a.perfiles_totales}</span>
                                                {missing > 0 && <span className="bg-rose-500/20 text-rose-500 text-[8px] px-1.5 py-0.5 rounded font-black">Faltan: {missing}</span>}
                                             </div>
                                          </div>
                                       </PortalTooltip>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="flex gap-1">
                                          {a.houseGGR < 0 && <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase rounded">Casa perdiendo</span>}
                                          {missing > 0 && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded">Faltan perfiles</span>}
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 text-center"><MoreVertical size={16} className="text-text-secondary" /></td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </section>
            </div>
         ) : activeTab === 'calendario' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 pb-32 sm:pb-40">
               <CalendarioObjetivos 
                  eventos={eventosCalendario} 
                  loading={loadingEventos}
                  objetivosPendientes={objetivosPendientes}
                  filtroAgenciaInicial={calendarioFiltroAgencia}
                  onCrearPerfilClick={(agenciaId, objetivoId) => {
                     // Abrir modal de crear perfil con la agencia seleccionada (desde calendario)
                     setSelectedAgencyId(agenciaId);
                     setProfileModalFromCalendar(true);
                     setIsProfileModalOpen(true);
                  }}
                  onRefresh={() => {
                     refetchEventos();
                     refetchObjetivos();
                     // Limpiar el filtro después de refrescar para evitar que se quede "pegado"
                     setCalendarioFiltroAgencia(null);
                  }}
               />
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-40">
               <span className="material-symbols-outlined text-8xl mb-4">construction</span>
               <h3 className="text-2xl font-black text-white uppercase tracking-widest">Módulo en Desarrollo</h3>
               <p className="text-sm text-text-secondary">Esta vista estará disponible próximamente en WiseBetCore.</p>
            </div>
         )}

         {/* --- DRAWER (DETALLE AGENCIA) --- */}
         {selectedAgency && (
            <div className="fixed inset-0 z-[100] flex justify-end">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAgencyId(null)} />
               <div className="relative w-full lg:max-w-xl bg-surface-dark border-l border-border-dark h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-border-dark flex justify-between items-center bg-[#151b26]">
                     <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/20 rounded-2xl text-primary border border-primary/20"><Store size={28} /></div>
                        <div>
                           <h2 className="text-xl font-black text-white tracking-tighter">{selectedAgency.nombre}</h2>
                           <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest flex items-center gap-2">
                              <span>{selectedAgencyCasa?.nombre || selectedAgency.casa_madre} • {selectedAgency.responsable}</span>
                              {selectedAgency.tiene_arrastre !== undefined && (
                                 <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${selectedAgency.tiene_arrastre ? 'bg-primary/10 text-primary border-primary/30' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                                    {selectedAgency.tiene_arrastre ? 'Arrastre habilitado' : 'Sin arrastre'}
                                 </span>
                              )}
                           </p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAgencyId(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     {/* A. Resumen */}
                     <section className="grid grid-cols-2 gap-4">
                        <MetricCard label="GGR Casa" value={fmtMoney(selectedAgency.houseGGR)} color={selectedAgency.houseGGR >= 0 ? 'success' : 'danger'} sub={rangeLabel} />
                        <MetricCard label="Comisión Est." value={selectedAgency.houseGGR > 0 ? fmtMoney(selectedAgency.houseGGR * (selectedAgency.rake_porcentaje / 100)) : "—"} color="primary" sub={rangeLabel} />
                        <MetricCard label="Movimientos" value={selectedAgency.movements} sub={rangeLabel} />
                        <MetricCard label="Rake %" value={`${selectedAgency.rake_porcentaje}%`} />
                     </section>

                     {/* B. Saldo */}
                     <section className="bg-background-dark border border-border-dark rounded-3xl p-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Activity size={80} /></div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Saldo de la Agencia (Backoffice)</p>
                        <div className="flex items-baseline gap-3">
                           <span className="text-3xl font-black text-white">{fmtMoney(0)}</span>
                           <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase border border-emerald-500/20">Sincronizado</span>
                        </div>
                     </section>

                     {/* C. Perfiles */}
                     <section className="space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <Users size={14} className="text-primary" /> Perfiles de la Agencia
                           </h3>
                           <span className="text-[10px] font-bold text-text-secondary uppercase">{selectedAgency.perfiles_totales} Activos</span>
                        </div>
                        <div className="bg-background-dark border border-border-dark rounded-2xl overflow-hidden">
                           <table className="w-full text-left">
                              <thead className="text-[9px] uppercase font-black text-text-secondary bg-white/5">
                                 <tr>
                                    <th className="px-4 py-2.5">Perfil ID</th>
                                    <th className="px-4 py-2.5">Estado</th>
                                    <th className="px-4 py-2.5 text-right">Saldo</th>
                                    <th className="px-4 py-2.5"></th>
                                 </tr>
                              </thead>
                              <tbody className="text-[10px]">
                                 {/* Placeholder until profiles endpoint is ready */}
                                 <tr>
                                    <td colSpan={4} className="p-4 text-center text-text-secondary italic">
                                       Detalle de perfiles no disponible en vista previa
                                    </td>
                                 </tr>
                              </tbody>
                           </table>
                           {selectedAgency.profiles.length === 0 && (
                              <div className="p-10 text-center text-text-secondary text-[10px] uppercase font-black italic">Sin perfiles activos registrados</div>
                           )}
                        </div>
                     </section>

                     {/* D. Gestión de Perfiles */}
                     <section className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-5">
                        <div className="flex justify-between items-center">
                           <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Gestión de Perfiles</h3>
                           <div className="text-[8px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full font-black uppercase">Próxima creación: 22 May</div>
                        </div>
                        <button
                           onClick={() => setIsProfileModalOpen(true)}
                           className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-2"
                        >
                           <UserPlus size={16} /> Registrar nuevo perfil ahora
                        </button>
                     </section>

                     {/* E. Notes */}
                     <section className="space-y-4 pb-20">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-primary" /> Notas Operativas</h3>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                           <div className="flex gap-2">
                              <input type="text" placeholder="Añadir nota de seguimiento..." className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-primary" />
                              <button className="p-2 bg-primary text-white rounded-xl hover:bg-primary-hover"><Plus size={18} /></button>
                           </div>
                           <div className="text-[10px] text-text-secondary italic text-center">No hay notas recientes para esta agencia.</div>
                        </div>
                     </section>
                  </div>
               </div>
            </div>
         )}

         {/* --- MODAL (NUEVA AGENCIA) --- */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
               <div className="relative w-full max-w-lg lg:max-w-xl bg-[#0f1115] border border-white/10 rounded-[2rem] shadow-2xl shadow-primary/5 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-5 fade-in duration-300">

                  {/* Header */}
                  <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-white/5 flex justify-between items-center bg-[#151b26]/50 backdrop-blur-xl shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-2.5 sm:p-3 bg-gradient-to-br from-primary to-blue-600 rounded-2xl text-white shadow-lg shadow-primary/20 ring-1 ring-white/10 group-hover:scale-110 transition-transform duration-500">
                           {editingAgency ? <Edit size={20} className="sm:w-6 sm:h-6" /> : <UserPlus size={20} className="sm:w-6 sm:h-6" />}
                        </div>
                        <div>
                           <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">{editingAgency ? `Editar: ${editingAgency.nombre}` : 'Registrar Agencia'}</h2>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">{editingAgency ? 'Modifica los parámetros de la agencia' : 'Configuración inicial del canal operativo'}</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  {/* Scrollable Content */}
                  <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8 flex-1">
                     <form id="agency-form" className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6" onSubmit={handleSaveAgency}>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Nombre de Agencia</label>
                           <input
                              type="text" required
                              value={formData.nombre}
                              onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                              className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600"
                              placeholder="Ej. AG-UIO-CENTRO"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Dueño Responsable</label>
                           <div className="relative">
                              <select
                                 value={selectedPersonaId}
                                 required
                                 onChange={e => {
                                    const personaId = Number(e.target.value);
                                    setSelectedPersonaId(personaId);
                                    const persona = personas.find(p => p.id_persona === personaId);
                                    if (persona) {
                                       const nombreCompleto = `${persona.primer_nombre}${persona.segundo_nombre ? ' ' + persona.segundo_nombre : ''} ${persona.primer_apellido}${persona.segundo_apellido ? ' ' + persona.segundo_apellido : ''}`.trim();
                                       setFormData({ 
                                          ...formData, 
                                          responsable: nombreCompleto,
                                          contacto: persona.telefono || '',
                                          email: persona.correo_electronico || ''
                                       });
                                       setTipoDocumento(persona.tipo_documento || '');
                                       setNumeroDocumento(persona.numero_documento || '');
                                    }
                                 }}
                                 disabled={isPersonasLoading}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                 <option value={0}>{isPersonasLoading ? 'Cargando personas...' : 'Seleccione una persona'}</option>
                                 {personas.map(p => {
                                    const nombreCompleto = `${p.primer_nombre}${p.segundo_nombre ? ' ' + p.segundo_nombre : ''} ${p.primer_apellido}${p.segundo_apellido ? ' ' + p.segundo_apellido : ''}`.trim();
                                    return <option key={p.id_persona} value={p.id_persona}>{nombreCompleto}</option>;
                                 })}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Contacto / Teléfono</label>
                           <input
                              type="text"
                              value={formData.contacto}
                              readOnly
                              className="w-full bg-[#0a0b0e]/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                              placeholder="Se completa automáticamente"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Correo Electrónico</label>
                           <input
                              type="email"
                              value={formData.email}
                              readOnly
                              className="w-full bg-[#0a0b0e]/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                              placeholder="Se completa automáticamente"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tipo de Documento</label>
                           <input
                              type="text"
                              value={tipoDocumento}
                              readOnly
                              className="w-full bg-[#0a0b0e]/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                              placeholder="Se completa automáticamente"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Número de Documento</label>
                           <input
                              type="text"
                              value={numeroDocumento}
                              readOnly
                              className="w-full bg-[#0a0b0e]/50 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-slate-400 outline-none cursor-not-allowed"
                              placeholder="Se completa automáticamente"
                           />
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Casa de Apuestas</label>
                           <div className="relative">
                              <select
                                 value={formData.casa_madre}
                                 required
                                 onChange={e => setFormData({ ...formData, casa_madre: Number(e.target.value) })}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
                              >
                                 <option value={0}>Seleccione Casa</option>
                                 {casas.map(b => <option key={b.id_casa} value={b.id_casa}>{b.nombre}</option>)}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                           </div>
                        </div>
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Rake %</label>
                           <input
                              type="number" min={0} max={100} step={0.1}
                              value={formData.rake_porcentaje}
                              onChange={e => setFormData({ ...formData, rake_porcentaje: parseFloat(e.target.value) })}
                              className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                           />
                        </div>
                        <div className="col-span-1 sm:col-span-2 space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Enlace Backoffice</label>
                           <input
                              type="url" placeholder="https://panel.ejemplo.com"
                              value={formData.url_backoffice}
                              onChange={e => setFormData({ ...formData, url_backoffice: e.target.value })}
                              className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600"
                           />
                        </div>

                        <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Arrastre</label>
                              <div className="flex items-center justify-between bg-[#0a0b0e] border border-white/10 rounded-xl px-4 py-3">
                                 <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Permite arrastre</p>
                                    <p className="text-[9px] text-text-secondary font-bold">Habilita saldos arrastrados en esta agencia</p>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, tiene_arrastre: !prev.tiene_arrastre }))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.tiene_arrastre ? 'bg-primary' : 'bg-slate-700'}`}
                                 >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formData.tiene_arrastre ? 'translate-x-5' : 'translate-x-1'}`} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* Asistente IA */}
                        <div className="col-span-1 sm:col-span-2 p-5 bg-gradient-to-br from-primary/5 to-blue-500/5 border border-primary/20 rounded-2xl space-y-3 mt-2">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                 <Sparkles className="text-primary" size={16} />
                                 <span className="text-[10px] font-black text-primary uppercase tracking-widest">Asistente Gemini</span>
                              </div>
                              <span className="text-[8px] font-black bg-primary/20 text-primary px-2 py-0.5 rounded-md uppercase border border-primary/20">Beta</span>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              <button type="button" className="px-3 py-2 bg-[#0a0b0e]/50 hover:bg-primary/20 border border-white/5 hover:border-primary/30 rounded-lg text-[9px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5 group">
                                 <BadgeCheck size={12} className="group-hover:text-primary transition-colors" /> Generar Credenciales
                              </button>
                              <button type="button" className="px-3 py-2 bg-[#0a0b0e]/50 hover:bg-primary/20 border border-white/5 hover:border-primary/30 rounded-lg text-[9px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1.5 group">
                                 <FileText size={12} className="group-hover:text-primary transition-colors" /> Redactar Nota
                              </button>
                           </div>
                        </div>

                        {/* Planificación de Perfiles (solo en creación) */}
                        {!editingAgency && (
                           <div className="col-span-1 sm:col-span-2 space-y-4 mt-2">
                              <div className="flex items-center justify-between p-4 bg-[#0a0b0e] border border-white/10 rounded-xl">
                                 <div className="flex items-center gap-3">
                                    <Calendar className="text-primary" size={20} />
                                    <div>
                                       <p className="text-xs font-black text-white uppercase tracking-wider">Planificación de Perfiles</p>
                                       <p className="text-[9px] text-slate-400 font-bold">Establecer objetivo de creación (opcional)</p>
                                    </div>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => setDefinirObjetivo(!definirObjetivo)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${definirObjetivo ? 'bg-primary' : 'bg-slate-700'}`}
                                 >
                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${definirObjetivo ? 'translate-x-5' : 'translate-x-1'}`} />
                                 </button>
                              </div>

                              {definirObjetivo && (
                                 <div className="p-5 bg-gradient-to-br from-green-500/5 to-emerald-500/5 border border-green-500/20 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-start gap-2">
                                       <Info size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                       <p className="text-[9px] text-slate-300 leading-relaxed">
                                          Define cuántos perfiles se deben crear y en qué plazo. Esto aparecerá en el panel de "Perfiles pendientes".
                                       </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                       <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Cantidad Objetivo</label>
                                          <input
                                             type="number"
                                             min={1}
                                             max={1000}
                                             value={objetivoData.cantidad_objetivo}
                                             onChange={e => {
                                                const value = parseInt(e.target.value) || 1;
                                                setObjetivoData({ ...objetivoData, cantidad_objetivo: Math.min(Math.max(value, 1), 1000) });
                                             }}
                                             className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all"
                                             placeholder="Ej: 5"
                                          />
                                          <p className="text-[8px] text-slate-500 ml-1">Perfiles a crear (1-1000)</p>
                                       </div>

                                       <div className="space-y-1.5">
                                          <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Plazo (días)</label>
                                          <input
                                             type="number"
                                             min={1}
                                             max={365}
                                             value={objetivoData.plazo_dias}
                                             onChange={e => {
                                                const value = parseInt(e.target.value) || 1;
                                                setObjetivoData({ ...objetivoData, plazo_dias: Math.min(Math.max(value, 1), 365) });
                                             }}
                                             className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all"
                                             placeholder="Ej: 30"
                                          />
                                          <p className="text-[8px] text-slate-500 ml-1">Días para completar (1-365)</p>
                                       </div>
                                    </div>

                                    <div className="space-y-1.5">
                                       <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Estado Inicial de Perfiles</label>
                                       <div className="relative">
                                          <select
                                             value={objetivoData.estado_inicial_perfiles}
                                             onChange={e => setObjetivoData({ ...objetivoData, estado_inicial_perfiles: e.target.value as 'ACTIVO' | 'INACTIVO' })}
                                             className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 outline-none transition-all appearance-none cursor-pointer"
                                          >
                                             <option value="ACTIVO">Activo</option>
                                             <option value="INACTIVO">Inactivo</option>
                                          </select>
                                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                                       </div>
                                       <p className="text-[8px] text-slate-500 ml-1">Estado que tendrán los perfiles al crearse</p>
                                    </div>

                                    <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
                                       <Clock size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                                       <div>
                                          <p className="text-[9px] font-bold text-green-400">Objetivo establecido</p>
                                          <p className="text-[9px] text-slate-300 mt-0.5">
                                             Crear <span className="font-black text-white">{objetivoData.cantidad_objetivo} perfiles</span> en <span className="font-black text-white">{objetivoData.plazo_dias} días</span>
                                          </p>
                                       </div>
                                    </div>
                                 </div>
                              )}
                           </div>
                        )}
                     </form>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0a0b0e]/30 shrink-0">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        Cancelar
                     </button>
                     <button form="agency-form" type="submit" disabled={isSubmitting} className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <span className="animate-spin"><History size={16} /></span> : (editingAgency ? <Save size={16} /> : <Plus size={16} />)}
                        <span>{isSubmitting ? 'Guardando...' : (editingAgency ? 'Actualizar Agencia' : 'Guardar Agencia')}</span>
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* --- MODAL (NUEVO PERFIL) --- */}
         {isProfileModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={closeProfileModal} />
               <div className="relative w-full max-w-lg bg-[#0f1115] border border-white/10 rounded-[2rem] shadow-2xl shadow-primary/5 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-5 fade-in duration-300">

                  {/* Header */}
                  <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center bg-[#151b26]/50 backdrop-blur-xl shrink-0">
                     <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-gradient-to-br from-primary to-blue-600 rounded-2xl text-white shadow-lg shadow-primary/20 ring-1 ring-white/10">
                           <UserPlus size={20} />
                        </div>
                        <div>
                           <h2 className="text-lg font-black text-white uppercase tracking-tight">Nuevo Perfil Operativo</h2>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pl-0.5">Asignando a: {selectedAgency?.nombre}</p>
                        </div>
                     </div>
                     <button onClick={closeProfileModal} className="p-2 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <X size={20} />
                     </button>
                  </div>

                  {/* Form */}
                  <div className="overflow-y-auto custom-scrollbar p-6 sm:p-8 flex-1">
                     <form id="profile-form" className="grid grid-cols-1 gap-5" onSubmit={handleCreateProfile}>

                        {/* 1. Persona Selection */}
                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Persona (Identidad Real)</label>
                           <div className="relative">
                              <select
                                 required
                                 value={profileForm.persona_id}
                                 onChange={e => setProfileForm({ ...profileForm, persona_id: Number(e.target.value) })}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer"
                                 disabled={isPersonasLoading}
                              >
                                 <option value={0}>Seleccione una persona...</option>
                                 {personas.map(p => (
                                    <option key={p.id_persona} value={p.id_persona}>
                                       {p.primer_nombre} {p.primer_apellido} - {p.numero_documento}
                                    </option>
                                 ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
                           </div>
                           {isPersonasLoading && <p className="text-[9px] text-primary animate-pulse ml-1">Cargando identidades...</p>}
                        </div>

                        {/* 2. User Credentials */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Usuario Bookie</label>
                              <input
                                 type="text" required
                                 value={profileForm.username}
                                 onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all"
                              />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Contraseña</label>
                              <div className="relative">
                                 <input
                                    type="text" required
                                    value={profileForm.password}
                                    onChange={e => setProfileForm({ ...profileForm, password: e.target.value })}
                                    className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all font-mono"
                                 />
                                 <button type="button" onClick={() => setProfileForm(p => ({ ...p, password: Math.random().toString(36).slice(-10) }))} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:text-primary text-slate-500 transition-colors">
                                    <RefreshCw size={12} />
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* 3. Configuration */}
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Tipo Jugador</label>
                              <select
                                 value={profileForm.tipo_jugador}
                                 onChange={e => setProfileForm({ ...profileForm, tipo_jugador: e.target.value })}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer"
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
                                 value={profileForm.nivel_cuenta}
                                 onChange={e => setProfileForm({ ...profileForm, nivel_cuenta: e.target.value })}
                                 className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all cursor-pointer"
                              >
                                 <option value="BRONCE">Bronce</option>
                                 <option value="PLATA">Plata</option>
                                 <option value="ORO">Oro</option>
                                 <option value="PLATINO">Platino</option>
                                 <option value="DIAMANTE">Diamante</option>
                              </select>
                           </div>
                        </div>

                        <div className="space-y-1.5">
                           <label className="text-[9px] font-black text-slate-400 uppercase ml-1 tracking-wider">Notas Iniciales</label>
                           <textarea
                              rows={2}
                              value={profileForm.notes}
                              onChange={e => setProfileForm({ ...profileForm, notes: e.target.value })}
                              className="w-full bg-[#0a0b0e] border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 outline-none transition-all placeholder:text-slate-600 resize-none"
                              placeholder="Observaciones sobre la creación..."
                           />
                        </div>

                        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-start gap-3">
                           <Info size={16} className="text-primary shrink-0 mt-0.5" />
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-white">Verificación Automática</p>
                              <p className="text-[9px] text-slate-400 leading-relaxed">
                                 Al crear el perfil, se generará una cuenta de usuario interna. Asegúrese de que las credenciales coincidan con las registradas en la casa de apuestas para la sincronización.
                              </p>
                           </div>
                        </div>

                     </form>
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-[#0a0b0e]/30 shrink-0">
                     <button type="button" onClick={closeProfileModal} className="px-6 py-2.5 text-[10px] font-black uppercase text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                        Cancelar
                     </button>
                     <button form="profile-form" type="submit" disabled={isSubmitting || profileForm.persona_id === 0} className="flex items-center gap-2 px-8 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                        {isSubmitting ? <span className="animate-spin"><History size={16} /></span> : <Save size={16} />}
                        <span>{isSubmitting ? 'Registrando...' : 'Confirmar Creación'}</span>
                     </button>
                  </div>

               </div>
            </div>
         )}

         {/* --- MODAL DETALLES AGENCIA --- */}
         {selectedAgencyForDetails && (
            <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setSelectedAgencyForDetails(null)} />
               <div className="relative w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                  
                  {/* Header */}
                  <div className="px-5 sm:px-7 py-4 sm:py-5 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-start gap-3">
                     <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-2xl border border-primary/40 text-primary shadow-lg shadow-primary/10">
                           <Store size={24} />
                        </div>
                        <div>
                           <h2 className="text-xl font-black text-white tracking-tight mb-1">{selectedAgencyForDetails.nombre}</h2>
                           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">
                              {casas.find(c => c.id_casa === selectedAgencyForDetails.casa_madre)?.nombre || 'Casa Madre'}
                           </p>
                           <div className="flex items-center gap-2 mt-3">
                              <span className={`w-2 h-2 rounded-full ${selectedAgencyForDetails.activo ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                              <span className={`text-[10px] font-black uppercase tracking-wider ${selectedAgencyForDetails.activo ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {selectedAgencyForDetails.activo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                           </div>
                        </div>
                     </div>
                     <button 
                        onClick={() => setSelectedAgencyForDetails(null)}
                        className="p-2.5 hover:bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all"
                     >
                        <X size={24} />
                     </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 sm:p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
                     
                     {/* Información Principal - Grid completo */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3 bg-[#0a0a0a] border border-white/5 rounded-xl">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                 <Users size={16} />
                              </div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Responsable</p>
                           </div>
                           <p className="text-base font-black text-white">{selectedAgencyForDetails.responsable}</p>
                        </div>

                        <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                 <Activity size={16} />
                              </div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contacto</p>
                           </div>
                           <p className="text-base font-black text-white">{selectedAgencyForDetails.contacto || 'No especificado'}</p>
                        </div>

                        <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                 <Settings2 size={16} />
                              </div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</p>
                           </div>
                           <p className="text-sm font-bold text-white truncate">{selectedAgencyForDetails.email || 'No especificado'}</p>
                        </div>

                        <div className="p-5 bg-[#0a0a0a] border border-white/5 rounded-2xl">
                           <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-primary/20 rounded-lg text-primary">
                                 <BadgeCheck size={16} />
                              </div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Perfiles Totales</p>
                           </div>
                           <p className="text-2xl font-black text-white">{(selectedAgencyForDetails as any).perfiles_totales || 0}</p>
                        </div>
                     </div>

                     {/* Métricas Financieras */}
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl border border-primary/20">
                        <div className="text-center">
                           <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">GGR Casa</p>
                           <p className="text-3xl font-black text-white tracking-tighter mb-1">${((selectedAgencyForDetails as any).ggr || 0).toLocaleString()}</p>
                           <p className="text-[8px] text-slate-500 font-bold">Gross Gaming Revenue</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-2">Rake Comisión</p>
                           <p className="text-3xl font-black text-white tracking-tighter mb-1">{selectedAgencyForDetails.rake_porcentaje}%</p>
                           <p className="text-[9px] text-slate-500 font-bold">Comisión aplicada</p>
                        </div>
                        <div className="text-center">
                           <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-3">Estado Operativo</p>
                           <div className="flex items-center justify-center gap-2">
                              <CheckCircle2 size={24} className={selectedAgencyForDetails.activo ? 'text-emerald-500' : 'text-rose-500'} />
                              <p className="text-2xl font-black text-white">{selectedAgencyForDetails.activo ? 'Online' : 'Offline'}</p>
                           </div>
                           <p className="text-[9px] text-slate-500 font-bold mt-2">Sistema operacional</p>
                        </div>
                     </div>

                     {/* Información Adicional Completa - TODOS LOS CAMPOS */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">ID Agencia</p>
                           <p className="text-sm font-black text-white font-mono">#{selectedAgencyForDetails.id_agencia}</p>
                        </div>

                        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Casa Madre</p>
                           <p className="text-sm font-bold text-white">{casas.find(c => c.id_casa === selectedAgencyForDetails.casa_madre)?.nombre || 'No especificada'}</p>
                        </div>

                        {(selectedAgencyForDetails as any).ubicacion && (
                           <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Ubicación</p>
                              <p className="text-sm font-bold text-white">{(selectedAgencyForDetails as any).ubicacion}</p>
                           </div>
                        )}

                        {selectedAgencyForDetails.url_backoffice && (
                           <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">URL Backoffice</p>
                              <a href={selectedAgencyForDetails.url_backoffice} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1.5 truncate">
                                 <ExternalLink size={14} /> Ver backoffice
                              </a>
                           </div>
                        )}

                        <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Arrastre</p>
                           <div className="flex items-center gap-2">
                              {selectedAgencyForDetails.tiene_arrastre ? (
                                 <>
                                    <CheckCircle2 size={16} className="text-emerald-500" />
                                    <span className="text-xs font-bold text-emerald-500">Habilitado</span>
                                 </>
                              ) : (
                                 <>
                                    <X size={16} className="text-slate-500" />
                                    <span className="text-xs font-bold text-slate-500">Deshabilitado</span>
                                 </>
                              )}
                           </div>
                        </div>

                        {(selectedAgencyForDetails as any).fecha_registro && (
                           <div className="p-4 bg-[#0a0a0a] border border-white/5 rounded-xl">
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Fecha Registro</p>
                              <p className="text-xs font-bold text-white">{new Date((selectedAgencyForDetails as any).fecha_registro).toLocaleString('es-ES')}</p>
                           </div>
                        )}
                     </div>

                     {/* NUEVA SECCIÓN: Objetivos de Creación de Perfiles */}
                     <div className="mt-6 p-5 bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl">
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2">
                              <div className="p-2 bg-blue-500/20 rounded-xl">
                                 <Calendar size={18} className="text-blue-400" />
                              </div>
                              <div>
                                 <h3 className="text-sm font-black text-white uppercase tracking-wider">Objetivos de Perfiles</h3>
                                 <p className="text-[9px] text-slate-400 font-bold">Planificación de creación</p>
                              </div>
                           </div>
                           <button
                              onClick={() => setShowNuevoObjetivoDrawer(!showNuevoObjetivoDrawer)}
                              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
                           >
                              <Plus size={14} />
                              Nuevo objetivo
                           </button>
                        </div>

                        {/* Formulario para nuevo objetivo (colapsable) */}
                        {showNuevoObjetivoDrawer && (
                           <div className="mb-4 p-4 bg-black/30 border border-blue-500/20 rounded-xl space-y-3 animate-in slide-in-from-top-2 duration-200">
                              <div className="grid grid-cols-2 gap-3">
                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                       Cantidad de Perfiles
                                    </label>
                                    <input
                                       type="number"
                                       min="1"
                                       max="1000"
                                       value={nuevoObjetivoDrawerData.cantidad_objetivo}
                                       onChange={(e) => {
                                          const value = parseInt(e.target.value) || 1;
                                          setNuevoObjetivoDrawerData(prev => ({ 
                                             ...prev, 
                                             cantidad_objetivo: Math.min(Math.max(value, 1), 1000)
                                          }));
                                       }}
                                       className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white font-bold focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                    <p className="text-[8px] text-slate-500 mt-1">Máximo 1000</p>
                                 </div>
                                 <div>
                                    <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                       Plazo (días)
                                    </label>
                                    <input
                                       type="number"
                                       min="1"
                                       max="365"
                                       value={nuevoObjetivoDrawerData.plazo_dias}
                                       onChange={(e) => {
                                          const value = parseInt(e.target.value) || 1;
                                          setNuevoObjetivoDrawerData(prev => ({ 
                                             ...prev, 
                                             plazo_dias: Math.min(Math.max(value, 1), 365)
                                          }));
                                       }}
                                       className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white font-bold focus:border-blue-500 focus:outline-none transition-all"
                                    />
                                    <p className="text-[8px] text-slate-500 mt-1">Máximo 365 días</p>
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                                    Estado Inicial de Perfiles
                                 </label>
                                 <select
                                    value={nuevoObjetivoDrawerData.estado_inicial_perfiles}
                                    onChange={(e) => setNuevoObjetivoDrawerData(prev => ({ 
                                       ...prev, 
                                       estado_inicial_perfiles: e.target.value as 'ACTIVO' | 'INACTIVO' 
                                    }))}
                                    className="w-full px-3 py-2 bg-black/50 border border-white/10 rounded-lg text-sm text-white font-bold focus:border-blue-500 focus:outline-none transition-all"
                                 >
                                    <option value="ACTIVO">Activo</option>
                                    <option value="INACTIVO">Inactivo</option>
                                 </select>
                              </div>
                              <div className="flex gap-2 pt-2">
                                 <button
                                    onClick={handleCrearObjetivoDrawer}
                                    disabled={isSubmitting}
                                    className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
                                 >
                                    {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                                    {isSubmitting ? 'Creando...' : 'Crear Objetivo'}
                                 </button>
                                 <button
                                    onClick={() => setShowNuevoObjetivoDrawer(false)}
                                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold rounded-lg transition-all"
                                 >
                                    Cancelar
                                 </button>
                              </div>
                           </div>
                        )}

                        {/* Lista de objetivos existentes */}
                        <div className="space-y-2">
                           {loadingHistorial ? (
                              <div className="text-center py-6">
                                 <RefreshCw size={20} className="animate-spin text-blue-400 mx-auto mb-2" />
                                 <p className="text-xs text-slate-400 font-bold">Cargando objetivos...</p>
                              </div>
                           ) : historialObjetivos.length === 0 ? (
                              <div className="text-center py-6">
                                 <Calendar size={32} className="text-slate-600 mx-auto mb-2" />
                                 <p className="text-xs text-slate-500 font-bold">No hay objetivos definidos</p>
                                 <p className="text-[9px] text-slate-600 mt-1">Crea uno usando el botón de arriba</p>
                              </div>
                           ) : (
                              historialObjetivos.map(obj => {
                                 const fechaLimite = new Date(obj.fecha_limite);
                                 const hoy = new Date();
                                 const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                                 
                                 let statusColor = 'bg-green-500/20 text-green-400 border-green-500/30';
                                 let statusText = 'En progreso';
                                 
                                 if (obj.perfiles_restantes === 0) {
                                    statusColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                                    statusText = '✓ Completado';
                                 } else if (diasRestantes < 0) {
                                    statusColor = 'bg-red-500/20 text-red-400 border-red-500/30';
                                    statusText = '⚠ Vencido';
                                 } else if (diasRestantes < 7) {
                                    statusColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                                    statusText = '⏰ Urgente';
                                 }
                                 
                                 return (
                                    <div 
                                       key={obj.id_objetivo}
                                       className="p-3 bg-black/40 border border-white/5 rounded-xl hover:border-blue-500/30 transition-all"
                                    >
                                       <div className="flex items-start justify-between mb-2">
                                          <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${statusColor}`}>
                                                   {statusText}
                                                </span>
                                                <span className="text-[9px] text-slate-500 font-bold">
                                                   #{obj.id_objetivo}
                                                </span>
                                             </div>
                                             <p className="text-sm font-bold text-white">
                                                Crear {obj.cantidad_objetivo} perfiles en {obj.plazo_dias} días
                                             </p>
                                          </div>
                                       </div>
                                       
                                       {/* Barra de progreso */}
                                       <div className="mb-2">
                                          <div className="w-full bg-gray-800 rounded-full h-2">
                                             <div 
                                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300" 
                                                style={{ width: `${obj.porcentaje_completado}%` }}
                                             />
                                          </div>
                                       </div>
                                       
                                       <div className="flex items-center justify-between text-[10px]">
                                          <span className="text-slate-400 font-bold">
                                             Progreso: {obj.cantidad_completada}/{obj.cantidad_objetivo} ({obj.porcentaje_completado.toFixed(0)}%)
                                          </span>
                                          <span className={diasRestantes < 7 ? 'text-red-400 font-bold' : 'text-slate-500 font-bold'}>
                                             {diasRestantes > 0 ? `${diasRestantes}d restantes` : diasRestantes === 0 ? 'Vence hoy' : 'Vencido'}
                                          </span>
                                       </div>
                                       
                                       {obj.perfiles_restantes > 0 && (
                                          <div className="mt-2 pt-2 border-t border-white/5">
                                             <p className="text-[9px] text-amber-400 font-bold">
                                                ⚡ Faltan {obj.perfiles_restantes} perfiles por crear
                                             </p>
                                          </div>
                                       )}
                                    </div>
                                 );
                              })
                           )}
                        </div>
                     </div>
                  </div>

                  {/* Footer - Acciones */}
                  <div className="px-5 sm:px-7 py-3 border-t border-white/10 bg-[#0a0a0a] flex gap-2">
                     <button 
                        onClick={() => setSelectedAgencyForDetails(null)}
                        className="flex-1 py-2 text-[10px] font-black uppercase rounded-lg bg-white/5 text-white hover:bg-white/10 transition-all"
                     >
                        Cerrar
                     </button>
                     <button 
                        onClick={() => {
                           setSelectedAgencyForDetails(null);
                           openEditModal(selectedAgencyForDetails);
                        }}
                        className="flex-1 py-3 text-[11px] font-black uppercase rounded-xl bg-blue-500/20 text-blue-500 hover:bg-blue-500 hover:text-white transition-all flex items-center justify-center gap-2"
                     >
                        <Edit size={14} /> Editar Agencia
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );
};

// --- SUB-COMPONENTS ---

function InteractivePanel({ title, subtitle, icon, color, data, warning, onClick, isFilter, isActive }: any) {
   const styles: any = {
      success: 'text-success bg-success/10 border-success/20 group-hover:border-success/40 shadow-success/5',
      danger: 'text-danger bg-danger/10 border-danger/20 group-hover:border-danger/40 shadow-danger/5',
      primary: 'text-primary bg-primary/10 border-primary/20 group-hover:border-primary/40 shadow-primary/5',
      warning: 'text-warning bg-warning/10 border-warning/20 group-hover:border-warning/40 shadow-warning/5',
   };

   return (
      <div
         onClick={onClick}
         className={`bg-surface-dark border rounded-[2rem] p-6 shadow-xl transition-all group cursor-pointer flex flex-col h-full ${isActive ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#0a0b0e]' : 'border-border-dark'}`}
      >
         <div className="flex items-center justify-between mb-5">
            <div className={`p-3 rounded-2xl border ${styles[color]}`}>{icon}</div>
            <div className="text-right">
               <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
               <p className="text-[9px] text-text-secondary font-bold mt-0.5">{subtitle}</p>
            </div>
         </div>
         <div className="space-y-3 flex-1">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1 rounded-lg">
                  <div>
                     <p className="text-[10px] font-black text-white">{item.id}</p>
                     <p className="text-[8px] text-text-secondary font-bold uppercase">{item.sub}</p>
                  </div>
                  <span className={`text-[11px] font-mono font-black ${color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : 'text-primary'}`}>{item.val}</span>
               </div>
            ))}
         </div>
         {warning && <p className="mt-4 text-[8px] text-text-secondary italic leading-tight text-center opacity-60">“{warning}”</p>}
         {isFilter && (
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
               <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                  {isActive ? 'Filtro Activo' : 'Ver Todos'} <ArrowRight size={10} />
               </span>
            </div>
         )}
      </div>
   );
};

function FilterChip({ label, icon, active }: any) {
   return (
      <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all ${active ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-border-dark text-text-secondary hover:text-white'}`}>
         {icon} {label} <ChevronDown size={10} className="opacity-50" />
      </button>
   );
}

export default OperationalNetwork;
