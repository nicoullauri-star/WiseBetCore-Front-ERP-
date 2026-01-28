/**
 * CalendarioObjetivos Component
 * Calendario visual de objetivos de creación de perfiles usando FullCalendar
 * Con filtro por agencia, rango de días coloreados, planificación y drag & drop
 */

import React, { useMemo, useState, useCallback, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import {
   Calendar, AlertCircle, CheckCircle2, Clock, X, TrendingUp, Target,
   Filter, ChevronDown, Building2, Plus, UserPlus, Minus,
   CalendarDays, CircleDot, Sparkles, Move
} from 'lucide-react';
import type { CalendarioEvento, ObjetivoPerfiles } from '../types';
import { objetivosService } from '../services/objetivos.service';

// ============================================================================
// CONFIGURACIÓN Y UTILIDADES
// ============================================================================

// Zona horaria de Ecuador
const TIMEZONE_ECUADOR = 'America/Guayaquil';

// Obtener fecha actual en Ecuador (sin hora)
const getHoyEcuador = (): Date => {
   const now = new Date();
   const ecuadorTime = new Date(now.toLocaleString('en-US', { timeZone: TIMEZONE_ECUADOR }));
   ecuadorTime.setHours(0, 0, 0, 0);
   return ecuadorTime;
};

// Formatear fecha a YYYY-MM-DD
const formatDateISO = (date: Date): string => {
   const year = date.getUTCFullYear();
   const month = String(date.getUTCMonth() + 1).padStart(2, '0');
   const day = String(date.getUTCDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
};

// ============================================================================
// SISTEMA DE COLORES POR URGENCIA
// ============================================================================

interface UrgenciaConfig {
   bg: string;
   border: string;
   text: string;
   pulso: boolean;
   label: string;
   icon: 'critical' | 'warning' | 'caution' | 'normal' | 'success' | 'expired';
}

const getUrgenciaConfig = (diasRestantes: number, completado: boolean): UrgenciaConfig => {
   if (completado) {
      return { bg: 'rgba(16, 185, 129, 0.2)', border: '#10b981', text: '#34d399', pulso: false, label: 'Completado', icon: 'success' };
   }
   if (diasRestantes < 0) {
      return { bg: 'rgba(239, 68, 68, 0.3)', border: '#dc2626', text: '#f87171', pulso: true, label: 'Vencido', icon: 'expired' };
   }
   if (diasRestantes === 0) {
      return { bg: 'rgba(239, 68, 68, 0.25)', border: '#ef4444', text: '#f87171', pulso: true, label: 'Hoy', icon: 'critical' };
   }
   if (diasRestantes === 1) {
      return { bg: 'rgba(249, 115, 22, 0.2)', border: '#f97316', text: '#fb923c', pulso: true, label: 'Mañana', icon: 'warning' };
   }
   if (diasRestantes <= 2) {
      return { bg: 'rgba(245, 158, 11, 0.2)', border: '#f59e0b', text: '#fbbf24', pulso: false, label: '2 días', icon: 'caution' };
   }
   if (diasRestantes <= 3) {
      return { bg: 'rgba(234, 179, 8, 0.15)', border: '#eab308', text: '#facc15', pulso: false, label: '3 días', icon: 'caution' };
   }
   return { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa', pulso: false, label: 'Normal', icon: 'normal' };
};

// Paleta de colores para agencias (se asignan cíclicamente)
const AGENCIA_COLORS = [
   { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#60a5fa' },   // Azul
   { bg: 'rgba(168, 85, 247, 0.15)', border: '#a855f7', text: '#c084fc' },   // Púrpura
   { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#f472b6' },   // Rosa
   { bg: 'rgba(20, 184, 166, 0.15)', border: '#14b8a6', text: '#2dd4bf' },   // Teal
   { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#fbbf24' },   // Ámbar
   { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#818cf8' },   // Indigo
   { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#4ade80' },    // Verde
   { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#f87171' },    // Rojo
];

// ============================================================================
// INTERFACES
// ============================================================================

interface CalendarioObjetivosProps {
   eventos: CalendarioEvento[];
   loading?: boolean;
   objetivosPendientes?: ObjetivoPerfiles[];
   onCrearPerfilClick?: (agenciaId: number, objetivoId: number) => void;
   onRefresh?: () => void;
   filtroAgenciaInicial?: number | null; // Permite filtrar por agencia al montar
}

interface AgenciaOption {
   id: number;
   nombre: string;
   color: typeof AGENCIA_COLORS[0];
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CalendarioObjetivos: React.FC<CalendarioObjetivosProps> = ({
   eventos,
   loading,
   objetivosPendientes = [],
   onCrearPerfilClick,
   onRefresh,
   filtroAgenciaInicial
}) => {
   const [eventoSeleccionado, setEventoSeleccionado] = useState<CalendarioEvento | null>(null);
   const [agenciaFiltro, setAgenciaFiltro] = useState<number | 'todas'>('todas');
   const [isFilterOpen, setIsFilterOpen] = useState(false);

   // Estado para hover en celdas (para mostrar botón crear perfil)
   const [hoveredDate, setHoveredDate] = useState<string | null>(null);

   // Estado para drag & drop
   const [isDragging, setIsDragging] = useState(false);
   const [dragInfo, setDragInfo] = useState<{ fecha: string; objetivoId: number } | null>(null);

   // Aplicar filtro inicial cuando cambia
   React.useEffect(() => {
      if (filtroAgenciaInicial !== undefined && filtroAgenciaInicial !== null) {
         setAgenciaFiltro(filtroAgenciaInicial);
      }
   }, [filtroAgenciaInicial]);

   // Estado para modal de planificación
   const [modalPlanificacion, setModalPlanificacion] = useState<{
      fecha: string;
      objetivoId: number;
      agenciaNombre: string;
      cantidadMax: number;
   } | null>(null);
   const [cantidadPlanificar, setCantidadPlanificar] = useState(1);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

   // Extraer agencias únicas y asignarles colores
   const agenciasConColor = useMemo((): AgenciaOption[] => {
      if (!eventos || !Array.isArray(eventos)) return [];

      const agenciasMap = new Map<number, string>();
      eventos.forEach(ev => {
         if (ev.agencia_id && ev.agencia_nombre && !agenciasMap.has(ev.agencia_id)) {
            agenciasMap.set(ev.agencia_id, ev.agencia_nombre);
         }
      });

      return Array.from(agenciasMap.entries()).map(([id, nombre], index) => ({
         id,
         nombre,
         color: AGENCIA_COLORS[index % AGENCIA_COLORS.length]
      }));
   }, [eventos]);

   // Obtener color de una agencia
   const getAgenciaColor = (agenciaId: number) => {
      const agencia = agenciasConColor.find(a => a.id === agenciaId);
      return agencia?.color || AGENCIA_COLORS[0];
   };

   // Filtrar eventos por agencia seleccionada
   const eventosFiltrados = useMemo(() => {
      if (!eventos || !Array.isArray(eventos)) return [];
      if (agenciaFiltro === 'todas') return eventos;
      return eventos.filter(ev => ev.agencia_id === agenciaFiltro);
   }, [eventos, agenciaFiltro]);

   // Obtener objetivo seleccionado (para planificación)
   const objetivoSeleccionado = useMemo(() => {
      if (agenciaFiltro === 'todas' || !objetivosPendientes) return null;
      return objetivosPendientes.find(o => o.agencia === agenciaFiltro) || null;
   }, [agenciaFiltro, objetivosPendientes]);

   // Calcular perfiles faltantes por planificar
   const faltantesPorPlanificar = useMemo(() => {
      if (!objetivoSeleccionado) return 0;
      const planificados = Object.values(objetivoSeleccionado.planificacion || {}).reduce<number>((a, b) => a + (b as number), 0);
      return objetivoSeleccionado.cantidad_objetivo - objetivoSeleccionado.cantidad_completada - planificados;
   }, [objetivoSeleccionado]);

   /**
    * Valida si una fecha es válida para planificar
    * Reglas:
    * 1. Debe ser >= HOY (no se puede planificar en el pasado)
    * 2. Debe estar dentro del rango del objetivo (fecha_inicio <= fecha <= fecha_limite)
    */
   const esFechaPlanificable = (fechaStr: string): boolean => {
      if (!objetivoSeleccionado) return false;

      const hoy = getHoyEcuador();
      const fechaClick = new Date(fechaStr + 'T00:00:00');
      const fechaInicio = new Date(objetivoSeleccionado.fecha_inicio + 'T00:00:00');
      const fechaLimite = new Date(objetivoSeleccionado.fecha_limite + 'T00:00:00');

      // Normalizar todas las fechas a medianoche para comparación justa
      fechaClick.setHours(0, 0, 0, 0);
      fechaInicio.setHours(0, 0, 0, 0);
      fechaLimite.setHours(0, 0, 0, 0);

      const esHoyOFuturo = fechaClick >= hoy;
      const estaDentroDelRango = fechaClick >= fechaInicio && fechaClick <= fechaLimite;

      return esHoyOFuturo && estaDentroDelRango;
   };

   /**
    * Verifica si una fecha tiene planificación existente
    */
   const tienePlanificacion = useCallback((fechaStr: string): boolean => {
      if (!objetivoSeleccionado) return false;
      return fechaStr in (objetivoSeleccionado.planificacion || {});
   }, [objetivoSeleccionado]);

   /**
    * Obtiene los datos de planificación para una fecha específica
    * Retorna null si no hay planificación, o un objeto con cantidad y datos del objetivo
    */
   const getPlanificacionDeFecha = useCallback((fechaStr: string): {
      cantidad: number;
      agenciaId: string;
      agenciaNombre: string;
      objetivoId: string;
      cantidadCreada: number;
   } | null => {
      if (!objetivoSeleccionado) return null;
      const planificacion = objetivoSeleccionado.planificacion || {};
      const cantidad = planificacion[fechaStr];
      if (!cantidad) return null;

      // Buscar datos de la agencia
      const agencia = agenciasConColor.find(a => a.id === objetivoSeleccionado.agencia);

      // Buscar cantidad ya creada para esta fecha (desde eventos)
      const eventoPlanificado = eventosFiltrados.find(
         e => e.tipo === 'planificado' && e.fecha === fechaStr && e.objetivo_id === objetivoSeleccionado.id_objetivo
      );

      return {
         cantidad: cantidad as number,
         agenciaId: objetivoSeleccionado.agencia,
         agenciaNombre: agencia?.nombre || 'Agencia',
         objetivoId: objetivoSeleccionado.id_objetivo,
         cantidadCreada: eventoPlanificado?.cantidad_creada || 0
      };
   }, [objetivoSeleccionado, agenciasConColor, eventosFiltrados]);

   /**
    * Verifica si una fecha está dentro del rango del objetivo (sin importar si es pasada)
    */
   const estaDentroDelRango = useCallback((fechaStr: string): boolean => {
      if (!objetivoSeleccionado) return false;
      const fecha = new Date(fechaStr + 'T00:00:00');
      const fechaInicio = new Date(objetivoSeleccionado.fecha_inicio + 'T00:00:00');
      const fechaLimite = new Date(objetivoSeleccionado.fecha_limite + 'T00:00:00');
      return fecha >= fechaInicio && fecha <= fechaLimite;
   }, [objetivoSeleccionado]);

   // Ref para evitar operaciones duplicadas de drag & drop
   const isDragOperationInProgress = useRef(false);

   /**
    * Handler para drag & drop de planificaciones
    * OPTIMIZACIÓN: Actualización optimista + prevención de operaciones duplicadas
    */
   const handleEventDrop = useCallback(async (info: any) => {
      const { event, oldEvent, revert } = info;
      const extendedProps = event.extendedProps;

      // LOG: Inicio de operación drag & drop
      if (process.env.NODE_ENV === 'development') {
         console.log('[CalendarioObjetivos] handleEventDrop iniciado', {
            tipo: extendedProps.tipo,
            fechaOrigen: oldEvent.startStr,
            fechaDestino: event.startStr
         });
      }

      // Prevenir operaciones duplicadas
      if (isDragOperationInProgress.current) {
         if (process.env.NODE_ENV === 'development') {
            console.log('[CalendarioObjetivos] Operación drag ya en progreso, ignorando');
         }
         revert();
         return;
      }

      // Solo permitir mover eventos de tipo planificado
      if (extendedProps.tipo !== 'planificado') {
         revert();
         return;
      }

      const fechaOrigen = oldEvent.startStr;
      const fechaDestino = event.startStr;
      const objetivoId = extendedProps.objetivo_id;

      // Validar que tenemos objetivo_id
      if (!objetivoId) {
         console.error('[CalendarioObjetivos] Error: objetivo_id no encontrado en el evento', extendedProps);
         setToast({ message: 'Error: No se pudo identificar el objetivo', type: 'error' });
         revert();
         return;
      }

      // Validar que la nueva fecha sea válida
      if (!esFechaPlanificable(fechaDestino)) {
         setToast({ message: 'No se puede mover a esta fecha', type: 'error' });
         revert();
         return;
      }

      // Marcar operación en progreso
      isDragOperationInProgress.current = true;

      // ACTUALIZACIÓN OPTIMISTA: El evento ya se movió visualmente por FullCalendar
      // Solo mostramos feedback inmediato al usuario
      setToast({
         message: `Moviendo planificación...`,
         type: 'success'
      });

      try {
         await objetivosService.moverPlanificacion(objetivoId, {
            fecha_origen: fechaOrigen,
            fecha_destino: fechaDestino
         });

         // LOG: Operación exitosa
         if (process.env.NODE_ENV === 'development') {
            console.log('[CalendarioObjetivos] Planificación movida exitosamente');
         }

         setToast({
            message: `Planificación movida al ${new Date(fechaDestino + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}`,
            type: 'success'
         });

         // Refrescar datos sin forzar re-render completo
         // El evento ya está visualmente en la posición correcta (optimistic update)
         onRefresh?.();
      } catch (error: any) {
         // LOG: Error en operación
         if (process.env.NODE_ENV === 'development') {
            console.error('[CalendarioObjetivos] Error al mover planificación:', error);
         }

         // REVERTIR: Solo si hay error, revertimos el cambio visual
         setToast({ message: error.message || 'Error al mover planificación', type: 'error' });
         revert();
      } finally {
         // Liberar lock de operación
         isDragOperationInProgress.current = false;
         setIsDragging(false);
      }
   }, [esFechaPlanificable, onRefresh]);

   // Generar eventos para FullCalendar (incluye eventos de rango para background)
   const fullCalendarEvents = useMemo(() => {
      if (!eventosFiltrados || eventosFiltrados.length === 0) return [];

      const hoy = getHoyEcuador();
      const calendarEvents: any[] = [];

      eventosFiltrados.forEach(evento => {
         if (!evento || !evento.id || !evento.fecha) return;

         const agenciaColor = getAgenciaColor(evento.agencia_id);

         // Determinar colores según estado y urgencia (para el marcador de fecha límite)
         let backgroundColor = agenciaColor.border;
         let borderColor = agenciaColor.border;
         let classNames: string[] = [];

         if (evento.tipo === 'fecha_limite') {
            const fechaLimite = new Date(evento.fecha);
            fechaLimite.setHours(0, 0, 0, 0);
            const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

            const urgencia = getUrgenciaConfig(diasRestantes, evento.completado || false);
            backgroundColor = urgencia.border;
            borderColor = urgencia.border;

            if (urgencia.pulso) {
               classNames.push('evento-urgente-pulso');
            }
         }

         // Eventos planificados: DRAGGABLES con estilo integrado
         if (evento.tipo === 'planificado') {
            const fechaPlanificable = objetivoSeleccionado && esFechaPlanificable(evento.fecha);
            const colorAgencia = agenciaColor;

            calendarEvents.push({
               id: evento.id,
               title: `${evento.cantidad_planificada || 1} perfil(es)`,
               start: evento.fecha,
               backgroundColor: colorAgencia.bg.replace('0.15', '0.25'),
               borderColor: colorAgencia.border,
               textColor: '#ffffff',
               editable: fechaPlanificable,
               startEditable: fechaPlanificable,
               classNames: fechaPlanificable ? ['evento-planificado-draggable'] : ['evento-planificado'],
               extendedProps: {
                  tipo: 'planificado',
                  agencia_id: evento.agencia_id,
                  agencia_nombre: evento.agencia_nombre,
                  cantidad_planificada: evento.cantidad_planificada,
                  cantidad_creada: evento.cantidad_creada,
                  objetivo_id: evento.objetivo_id,
                  isDraggable: fechaPlanificable
               }
            });
            return;
         }

         // Evento principal (marcador en fecha límite o fecha de creación de perfil)
         calendarEvents.push({
            id: evento.id,
            title: evento.titulo,
            start: evento.fecha,
            backgroundColor,
            borderColor,
            textColor: '#ffffff',
            classNames,
            editable: false, // No se pueden arrastrar
            extendedProps: {
               tipo: evento.tipo,
               agencia_id: evento.agencia_id,
               agencia_nombre: evento.agencia_nombre,
               cantidad_objetivo: evento.cantidad_objetivo,
               cantidad_completada: evento.cantidad_completada,
               perfiles_restantes: evento.perfiles_restantes,
               completado: evento.completado,
               nombre_usuario: evento.nombre_usuario,
               tipo_jugador: evento.tipo_jugador,
               hora: evento.hora,
               fecha_inicio: evento.fecha_inicio
            }
         });

         // Si es fecha_limite y tiene fecha_inicio, crear eventos de fondo para el rango
         // OPTIMIZACIÓN: Solo crear rangos de fondo si estamos filtrando por una agencia específica
         // Esto mejora drásticamente el rendimiento con "todas las agencias"
         if (evento.tipo === 'fecha_limite' && evento.fecha_inicio && !evento.completado && agenciaFiltro !== 'todas') {
            const fechaInicio = new Date(evento.fecha_inicio);
            const fechaLimite = new Date(evento.fecha);
            fechaInicio.setHours(0, 0, 0, 0);
            fechaLimite.setHours(0, 0, 0, 0);

            // Solo pintar desde HOY (o fecha_inicio si es futura) hasta fecha_limite
            const rangoInicio = fechaInicio > hoy ? fechaInicio : hoy;

            // Solo si el rango tiene sentido (no ha pasado la fecha límite)
            if (rangoInicio <= fechaLimite) {
               // Crear un evento de fondo por cada día del rango
               let currentDate = new Date(rangoInicio);
               while (currentDate <= fechaLimite) {
                  calendarEvents.push({
                     id: `range-${evento.id}-${formatDateISO(currentDate)}`,
                     start: formatDateISO(currentDate),
                     display: 'background',
                     backgroundColor: agenciaColor.bg,
                     borderColor: 'transparent',
                     extendedProps: {
                        isRangeEvent: true,
                        parentEventId: evento.id,
                        agencia_id: evento.agencia_id
                     }
                  });
                  currentDate.setDate(currentDate.getDate() + 1);
               }
            }
         }
      });

      return calendarEvents;
   }, [eventosFiltrados, agenciasConColor, objetivoSeleccionado, esFechaPlanificable]);

   // Renderizar el contenido del evento personalizado
   // MEMOIZACIÓN: useCallback para evitar re-renders innecesarios del calendario
   const renderEventContent = useCallback((eventInfo: any) => {
      const { extendedProps } = eventInfo.event;

      // No renderizar contenido para eventos de fondo
      if (extendedProps.isRangeEvent) return null;

      // Evento planificado: solo info compacta (el botón Crear está en dayCellContent)
      if (extendedProps.tipo === 'planificado') {
         const planificados = extendedProps.cantidad_planificada || 1;
         const yaCreados = extendedProps.cantidad_creada || 0;
         const pendientes = planificados - yaCreados;

         return (
            <div className="evento-planificado-content">
               <div className="evento-planificado-header">
                  <UserPlus size={10} className="flex-shrink-0" />
                  <span>{planificados} perfil{planificados > 1 ? 'es' : ''}</span>
               </div>
               <div className="evento-planificado-agency">
                  {extendedProps.agencia_nombre}
               </div>
               {pendientes > 0 && (
                  <div className="evento-planificado-pendientes">
                     {pendientes} pendiente{pendientes > 1 ? 's' : ''}
                  </div>
               )}
               {pendientes === 0 && (
                  <div className="evento-planificado-completed">
                     <CheckCircle2 size={9} />
                     Completado
                  </div>
               )}
            </div>
         );
      }

      return (
         <div className="px-2 py-1.5 text-[11px] overflow-hidden">
            <div className="font-semibold truncate flex items-center gap-1.5 text-slate-100">
               {extendedProps.tipo === 'fecha_limite' && extendedProps.completado && <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" />}
               {extendedProps.tipo === 'fecha_limite' && !extendedProps.completado && <AlertCircle size={11} className="flex-shrink-0" />}
               {extendedProps.tipo === 'perfil_creado' && <Target size={11} className="text-indigo-400 flex-shrink-0" />}
               <span className="truncate">{eventInfo.event.title}</span>
            </div>
            <div className="text-[9px] text-slate-400 truncate mt-0.5">
               {extendedProps.agencia_nombre}
            </div>
            {extendedProps.tipo === 'fecha_limite' && (
               <div className="text-[9px] text-slate-500 mt-0.5">
                  {extendedProps.cantidad_completada}/{extendedProps.cantidad_objetivo} completados
               </div>
            )}
            {extendedProps.tipo === 'perfil_creado' && extendedProps.hora && (
               <div className="text-[9px] text-slate-500 mt-0.5">
                  {extendedProps.hora}
               </div>
            )}
         </div>
      );
   }, [onCrearPerfilClick]);

   // Nombre de agencia seleccionada para mostrar
   const agenciaSeleccionadaNombre = agenciaFiltro === 'todas'
      ? 'Todas las agencias'
      : agenciasConColor.find(a => a.id === agenciaFiltro)?.nombre || 'Agencia';

   if (loading) {
      return (
         <div className="flex items-center justify-center h-96 bg-gradient-to-b from-[#0a0a0f] to-[#0d0d12] border border-white/[0.06] rounded-2xl">
            <div className="text-center">
               <div className="relative inline-flex">
                  <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                     <CalendarDays size={28} className="text-indigo-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#0a0a0f] border border-indigo-500/30 flex items-center justify-center">
                     <div className="w-2.5 h-2.5 border-2 border-indigo-400/60 border-t-indigo-400 rounded-full animate-spin" />
                  </div>
               </div>
               <p className="text-sm text-slate-400 font-medium mt-4">Cargando calendario...</p>
               <p className="text-xs text-slate-500 mt-1">Obteniendo objetivos y eventos</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-gradient-to-b from-[#0a0a0f] to-[#0d0d12] border border-white/[0.06] rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
         {/* Header con filtro - Diseño moderno */}
         <div className="px-6 py-5 border-b border-white/[0.04] bg-[#08080c]/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 rounded-xl border border-indigo-500/20 shadow-lg shadow-indigo-500/5">
                     <CalendarDays size={22} className="text-indigo-400" />
                  </div>
                  <div>
                     <h2 className="text-base font-semibold text-white tracking-tight">
                        Calendario de Objetivos
                     </h2>
                     <p className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center gap-2">
                        <span className="inline-flex items-center gap-1">
                           <CircleDot size={8} className="text-emerald-400" />
                           {eventosFiltrados?.length || 0} eventos
                        </span>
                        <span className="text-slate-600">•</span>
                        <span>Ecuador (UTC-5)</span>
                     </p>
                  </div>
               </div>

               {/* Filtro de Agencia - Rediseñado */}
               <div className="relative">
                  <button
                     onClick={() => setIsFilterOpen(!isFilterOpen)}
                     className="flex items-center gap-2.5 px-4 py-2.5 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.05] hover:border-indigo-500/30 transition-all min-w-[200px] group"
                  >
                     <Filter size={15} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                     <span className="text-[13px] text-slate-200 font-medium flex-1 text-left truncate">
                        {agenciaSeleccionadaNombre}
                     </span>
                     <ChevronDown size={15} className={`text-slate-500 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isFilterOpen && (
                     <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                        <div className="absolute right-0 mt-2 w-64 bg-[#0f0f14] border border-white/[0.08] rounded-xl shadow-2xl shadow-black/40 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                           <div className="p-3 border-b border-white/[0.04]">
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Filtrar por agencia</p>
                           </div>
                           <div className="max-h-64 overflow-y-auto custom-scrollbar p-1">
                              {/* Opción: Todas las agencias */}
                              <button
                                 onClick={() => { setAgenciaFiltro('todas'); setIsFilterOpen(false); }}
                                 className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all ${agenciaFiltro === 'todas' ? 'bg-indigo-500/10' : ''}`}
                              >
                                 <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500" />
                                 <span className={`text-[13px] font-medium ${agenciaFiltro === 'todas' ? 'text-indigo-400' : 'text-slate-300'}`}>
                                    Todas las agencias
                                 </span>
                                 {agenciaFiltro === 'todas' && <CheckCircle2 size={14} className="text-indigo-400 ml-auto" />}
                              </button>

                              {/* Lista de agencias */}
                              {agenciasConColor.map(agencia => (
                                 <button
                                    key={agencia.id}
                                    onClick={() => { setAgenciaFiltro(agencia.id); setIsFilterOpen(false); }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/[0.04] transition-all ${agenciaFiltro === agencia.id ? 'bg-indigo-500/10' : ''}`}
                                 >
                                    <div
                                       className="w-2.5 h-2.5 rounded-full"
                                       style={{ backgroundColor: agencia.color.border }}
                                    />
                                    <span className={`text-[13px] font-medium truncate ${agenciaFiltro === agencia.id ? 'text-indigo-400' : 'text-slate-300'}`}>
                                       {agencia.nombre}
                                    </span>
                                    {agenciaFiltro === agencia.id && <CheckCircle2 size={14} className="text-indigo-400 ml-auto flex-shrink-0" />}
                                 </button>
                              ))}
                           </div>
                        </div>
                     </>
                  )}
               </div>
            </div>
         </div>

         {/* Contenido principal con padding */}
         <div className="p-5">
            {/* Leyenda de colores - Diseño compacto y moderno */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-5 pb-4 border-b border-white/[0.04]">
               <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Estados:</span>

               <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {/* Estados de urgencia */}
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/30"></div>
                     <span className="text-[10px] text-slate-400 font-medium">Vencido/Hoy</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-orange-500 shadow-sm shadow-orange-500/30"></div>
                     <span className="text-[10px] text-slate-400 font-medium">Mañana</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-amber-500 shadow-sm shadow-amber-500/30"></div>
                     <span className="text-[10px] text-slate-400 font-medium">2-3 días</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-sm shadow-indigo-500/30"></div>
                     <span className="text-[10px] text-slate-400 font-medium">Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></div>
                     <span className="text-[10px] text-slate-400 font-medium">Completado</span>
                  </div>

                  <div className="w-px h-3 bg-white/[0.08] mx-1" />

                  {/* Indicadores de tipo - Planificado usa color de agencia */}
                  <div className="flex items-center gap-1.5">
                     <div className="w-4 h-2 rounded-sm bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-teal-500/40 border border-white/20"></div>
                     <span className="text-[10px] text-slate-400 font-medium">Planificado</span>
                     <span className="text-[8px] text-slate-500">(color agencia)</span>
                  </div>
               </div>
            </div>

            {/* Leyenda de colores por agencia (solo si hay múltiples y se muestran todas) */}
            {agenciaFiltro === 'todas' && agenciasConColor.length > 1 && (
               <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b border-white/[0.04]">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-2">Agencias:</span>
                  {agenciasConColor.map(agencia => (
                     <button
                        key={agencia.id}
                        onClick={() => setAgenciaFiltro(agencia.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.02] transition-all group"
                        style={{ backgroundColor: `${agencia.color.bg}` }}
                     >
                        <div
                           className="w-1.5 h-1.5 rounded-full"
                           style={{ backgroundColor: agencia.color.border }}
                        />
                        <span className="text-[10px] font-medium text-slate-400 group-hover:text-slate-200 transition-colors">
                           {agencia.nombre}
                        </span>
                     </button>
                  ))}
               </div>
            )}

            {/* Indicador de modo planificación - Diseño refinado */}
            {objetivoSeleccionado && faltantesPorPlanificar > 0 && (
               <div className="mb-5 p-4 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/5 border border-violet-500/20 rounded-xl">
                  <div className="flex items-center gap-4">
                     <div className="p-2.5 bg-violet-500/15 rounded-lg border border-violet-500/20">
                        <Sparkles size={18} className="text-violet-400" />
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-violet-300">Modo Planificación Activo</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                           Haz clic en un día para asignar perfiles • <span className="text-white font-semibold">{faltantesPorPlanificar}</span> pendientes
                        </p>
                     </div>
                     <div className="text-right hidden sm:block">
                        <p className="text-[9px] text-slate-500 uppercase font-semibold tracking-wider">Agencia</p>
                        <p className="text-sm font-semibold text-white truncate max-w-[140px]">{agenciasConColor.find(a => a.id === agenciaFiltro)?.nombre}</p>
                     </div>
                  </div>
               </div>
            )}

            {/* FullCalendar */}
            <div className="fullcalendar-custom">
               <FullCalendar
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="es"
                  timeZone={TIMEZONE_ECUADOR}
                  headerToolbar={{
                     left: 'prev,next today',
                     center: 'title',
                     right: 'dayGridMonth,dayGridWeek'
                  }}
                  buttonText={{
                     today: 'Hoy',
                     month: 'Mes',
                     week: 'Semana'
                  }}
                  events={fullCalendarEvents}
                  eventContent={renderEventContent}
                  height="auto"
                  firstDay={1} // Lunes como primer día
                  editable={true} // Habilitar edición general
                  droppable={false} // No permitir drops externos
                  selectable={true} // Mejora la respuesta a clics
                  selectMirror={true} // Feedback visual inmediato
                  unselectAuto={true} // Deseleccionar automáticamente
                  dayMaxEvents={3} // Limitar eventos visibles por día para mejor rendimiento
                  moreLinkClick="popover" // Mostrar popover en vez de navegar
                  dragRevertDuration={150} // Animación rápida al revertir (ms)
                  dragScroll={false} // Evitar auto-scroll durante drag
                  eventDrop={handleEventDrop} // Handler para drag & drop
                  eventDragStart={() => setIsDragging(true)}
                  eventDragStop={() => setIsDragging(false)}
                  dayCellDidMount={(info) => {
                     // Agregar clase para días dentro del rango
                     const dateStr = formatDateISO(info.date);
                     if (objetivoSeleccionado && estaDentroDelRango(dateStr)) {
                        info.el.classList.add('dia-en-rango');
                        if (esFechaPlanificable(dateStr) && !tienePlanificacion(dateStr)) {
                           info.el.classList.add('dia-crear-disponible');
                        }
                     }
                  }}
                  dayCellContent={(arg) => {
                     // 1. Obtener fecha visual correcta (ahora usa metodos UTC)
                     const dateStr = formatDateISO(arg.date);
                     const dentroDelRangoObjetivo = objetivoSeleccionado && estaDentroDelRango(dateStr);

                     // 2. Construir fechas comparables en hora local (00:00:00)
                     const today = new Date();
                     today.setHours(0, 0, 0, 0);

                     // Usamos dateStr para garantizar que la fecha local coincide con la visual
                     const cellDate = new Date(dateStr + 'T00:00:00');

                     // 3. Comparación directa (milisegundos)
                     const isPast = cellDate.getTime() < today.getTime();

                     // Mostrar botones: SOLO si está en rango Y (es Hoy o Futuro)
                     const mostrarBotones = dentroDelRangoObjetivo && !isPast;



                     return (
                        <div className="calendar-day-cell group/celda">
                           {/* Número del día */}
                           <span className="calendar-day-number">{arg.dayNumberText}</span>

                           {/* Botones de acción - Solo Hoy/Futuro y en rango */}
                           {mostrarBotones && (
                              <div className="calendar-day-buttons">
                                 {/* Botón Planificar - SIEMPRE visible en hoy/futuro */}
                                 <button
                                    type="button"
                                    data-action="planificar"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       console.log('[CalendarioObjetivos] Click en Planificar');
                                       const agencia = agenciasConColor.find(a => a.id === agenciaFiltro);
                                       // Calcular faltantes (si ya hay plan, igual permitimos abrir para ajustar?)
                                       // Nota: La lógica original usaba "setCantidadPlanificar(1)". Mantenemos eso.
                                       setModalPlanificacion({
                                          fecha: dateStr,
                                          objetivoId: objetivoSeleccionado.id_objetivo,
                                          agenciaNombre: agencia?.nombre || 'Agencia',
                                          cantidadMax: faltantesPorPlanificar // Esto podría ser 0 si ya está completo, pero el modal quizás maneje eso
                                       });
                                       setCantidadPlanificar(1);
                                    }}
                                    className="calendar-btn-planificar"
                                 >
                                    <CalendarDays size={10} className="flex-shrink-0" />
                                    <span>Planificar</span>
                                 </button>

                                 {/* Botón Crear - SIEMPRE visible en hoy/futuro */}
                                 {onCrearPerfilClick && (
                                    <button
                                       type="button"
                                       data-action="crear-perfil"
                                       onMouseDown={(e) => e.stopPropagation()}
                                       onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          console.log('[CalendarioObjetivos] Click en Crear Perfil');
                                          onCrearPerfilClick(objetivoSeleccionado.agencia, objetivoSeleccionado.id_objetivo);
                                       }}
                                       className="calendar-btn-crear"
                                    >
                                       <Plus size={10} className="flex-shrink-0" />
                                       <span>Crear</span>
                                    </button>
                                 )}
                              </div>
                           )}
                        </div>
                     );
                  }}

                  dateClick={(info) => {
                     // Ignorar si el click fue en un botón o elemento de acción
                     const target = info.jsEvent.target as HTMLElement;
                     if (target.closest('button') || target.closest('[data-action]')) {
                        console.log('[CalendarioObjetivos] dateClick ignorado - click en botón');
                        return;
                     }

                     console.log('[CalendarioObjetivos] dateClick ejecutando', info.dateStr);

                     // Si no hay objetivo seleccionado o no quedan faltantes, no abrir modal de planificación
                     if (!objetivoSeleccionado || faltantesPorPlanificar <= 0) return;
                     if (!esFechaPlanificable(info.dateStr)) return;

                     const agencia = agenciasConColor.find(a => a.id === agenciaFiltro);
                     setModalPlanificacion({
                        fecha: info.dateStr,
                        objetivoId: objetivoSeleccionado.id_objetivo,
                        agenciaNombre: agencia?.nombre || 'Agencia',
                        cantidadMax: faltantesPorPlanificar
                     });
                     setCantidadPlanificar(1);
                  }}
                  eventClick={(info) => {
                     // Prevenir comportamiento por defecto y propagación
                     // CRÍTICO: Esto evita navegación, submit de formularios y otros efectos no deseados
                     info.jsEvent.preventDefault();
                     info.jsEvent.stopPropagation();

                     // LOG: Diagnóstico de click en evento
                     if (process.env.NODE_ENV === 'development') {
                        console.log('[CalendarioObjetivos] eventClick', {
                           tipo: info.event.extendedProps.tipo,
                           id: info.event.id,
                           agencia_id: info.event.extendedProps.agencia_id,
                           objetivo_id: info.event.extendedProps.objetivo_id
                        });
                     }

                     // Ignorar clicks en eventos de fondo
                     if (info.event.extendedProps.isRangeEvent) return;

                     const extendedProps = info.event.extendedProps;

                     // Evento planificado: abrir modal crear perfil si hay pendientes
                     if (extendedProps.tipo === 'planificado') {
                        const pendientes = (extendedProps.cantidad_planificada || 1) - (extendedProps.cantidad_creada || 0);
                        if (pendientes > 0 && onCrearPerfilClick) {
                           onCrearPerfilClick(extendedProps.agencia_id, extendedProps.objetivo_id);
                           return;
                        }
                     }

                     // Otros eventos: abrir modal de detalles
                     const eventoCompleto = eventosFiltrados.find(e => e.id === info.event.id);
                     if (eventoCompleto) {
                        setEventoSeleccionado(eventoCompleto);
                     }
                  }}
                  eventDisplay="auto"
               />
            </div >

            {/* Indicador de Drag activo - Diseño moderno */}
            {
               isDragging && (
                  <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gradient-to-r from-violet-600/95 to-fuchsia-600/95 text-white rounded-2xl shadow-2xl shadow-violet-500/30 flex items-center gap-3 backdrop-blur-sm border border-violet-400/20">
                     <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                        <Move size={16} />
                     </div>
                     <div>
                        <p className="text-sm font-semibold">Arrastrando planificación</p>
                        <p className="text-[10px] text-violet-200/80">Suelta en una fecha válida</p>
                     </div>
                  </div>
               )
            }

            {
               (!eventosFiltrados || eventosFiltrados.length === 0) && !loading && (
                  <div className="text-center py-16">
                     <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4">
                        <CalendarDays size={32} className="text-slate-500" />
                     </div>
                     <p className="text-sm text-slate-400 font-medium">
                        {agenciaFiltro === 'todas'
                           ? 'No hay objetivos programados'
                           : `No hay objetivos para ${agenciaSeleccionadaNombre}`}
                     </p>
                     <p className="text-xs text-slate-500 mt-1.5">
                        {agenciaFiltro === 'todas'
                           ? 'Crea objetivos para verlos en el calendario'
                           : 'Selecciona otra agencia o muestra todas'}
                     </p>
                     {agenciaFiltro !== 'todas' && (
                        <button
                           onClick={() => setAgenciaFiltro('todas')}
                           className="mt-5 px-5 py-2.5 text-xs font-medium text-indigo-400 bg-indigo-500/10 rounded-xl border border-indigo-500/20 hover:bg-indigo-500/15 hover:border-indigo-500/30 transition-all"
                        >
                           Ver todas las agencias
                        </button>
                     )}
                  </div>
               )
            }
         </div >

         {/* Modal de detalles del evento */}
         {
            eventoSeleccionado && (
               <div className="modal-overlay" style={{ zIndex: 9999 }}>
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setEventoSeleccionado(null)} />
                  <div className="modal-panel modal-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">

                     {/* Header - SIEMPRE visible */}
                     <div className="modal-header flex justify-between items-start gap-3">
                        <div className="flex items-start gap-3">
                           <div className={`p-2.5 rounded-xl border ${eventoSeleccionado.tipo === 'perfil_creado' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' :
                              eventoSeleccionado.completado ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                                 new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? 'bg-red-500/15 border-red-500/30 text-red-400' :
                                    'bg-amber-500/15 border-amber-500/30 text-amber-400'
                              }`}>
                              {eventoSeleccionado.tipo === 'perfil_creado' && <Target size={22} />}
                              {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.completado && <CheckCircle2 size={22} />}
                              {eventoSeleccionado.tipo === 'fecha_limite' && !eventoSeleccionado.completado && <AlertCircle size={22} />}
                           </div>
                           <div>
                              <h2 className="text-base font-semibold text-white tracking-tight">{eventoSeleccionado.titulo}</h2>
                              <div className="flex items-center gap-2 mt-1">
                                 <Building2 size={11} className="text-slate-500" />
                                 <p className="text-xs text-slate-400 font-medium">{eventoSeleccionado.agencia_nombre}</p>
                              </div>
                           </div>
                        </div>
                        <button
                           onClick={() => setEventoSeleccionado(null)}
                           className="p-2 hover:bg-white/[0.05] rounded-xl text-slate-500 hover:text-white transition-all shrink-0"
                        >
                           <X size={18} />
                        </button>
                     </div>

                     {/* Body - ÚNICO elemento scrollable */}
                     <div className="modal-body">
                        <div className="p-6 space-y-5">
                           {/* Tipo y Estado */}
                           <div>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                 {eventoSeleccionado.tipo === 'perfil_creado' ? 'Tipo' : 'Estado'}
                              </p>
                              <div className="flex items-center gap-2">
                                 {eventoSeleccionado.tipo === 'perfil_creado' ? (
                                    <span className="px-3 py-1.5 text-xs font-semibold rounded-lg border bg-indigo-500/15 text-indigo-400 border-indigo-500/25">
                                       Perfil Creado
                                    </span>
                                 ) : (
                                    <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${eventoSeleccionado.completado ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' :
                                       new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? 'bg-red-500/15 text-red-400 border-red-500/25' :
                                          'bg-amber-500/15 text-amber-400 border-amber-500/25'
                                       }`}>
                                       {eventoSeleccionado.completado ? '✓ Completado' :
                                          new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? 'Vencido' :
                                             'Pendiente'}
                                    </span>
                                 )}
                              </div>
                           </div>

                           {/* Rango de fechas - Solo para fecha_limite */}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.fecha_inicio && (
                              <div>
                                 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Período del Objetivo</p>
                                 <div className="flex items-center gap-3 p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                    <div className="flex-1">
                                       <p className="text-[9px] text-slate-500 font-medium uppercase">Inicio</p>
                                       <p className="text-sm text-white font-medium mt-0.5">
                                          {new Date(eventoSeleccionado.fecha_inicio).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                       </p>
                                    </div>
                                    <div className="text-slate-600">→</div>
                                    <div className="flex-1 text-right">
                                       <p className="text-[9px] text-slate-500 font-medium uppercase">Límite</p>
                                       <p className="text-sm text-white font-medium mt-0.5">
                                          {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* Objetivo - Solo para fecha_limite */}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (
                              <div>
                                 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Objetivo</p>
                                 <div className="flex items-center gap-2">
                                    <Target size={15} className="text-indigo-400" />
                                    <p className="text-white font-medium">Crear {eventoSeleccionado.cantidad_objetivo} perfiles</p>
                                 </div>
                              </div>
                           )}

                           {/* Progreso - Solo para fecha_limite */}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (
                              <div>
                                 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Progreso</p>
                                 <div className="space-y-2.5">
                                    <div className="flex justify-between text-sm">
                                       <span className="text-slate-400 font-medium">Completado</span>
                                       <span className="text-white font-semibold">{eventoSeleccionado.cantidad_completada || 0}/{eventoSeleccionado.cantidad_objetivo}</span>
                                    </div>
                                    <div className="w-full bg-slate-800/60 rounded-full h-2.5 overflow-hidden">
                                       <div
                                          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                                          style={{ width: `${Math.max(4, Math.round(((eventoSeleccionado.cantidad_completada || 0) / eventoSeleccionado.cantidad_objetivo) * 100))}%` }}
                                       />
                                    </div>
                                    <div className="flex justify-between items-center">
                                       {eventoSeleccionado.perfiles_restantes !== undefined && (
                                          <p className="text-xs text-slate-500 font-medium">{eventoSeleccionado.perfiles_restantes} restantes</p>
                                       )}
                                       <p className="text-xs text-indigo-400 font-semibold">{Math.round(((eventoSeleccionado.cantidad_completada || 0) / eventoSeleccionado.cantidad_objetivo) * 100)}%</p>
                                    </div>
                                 </div>
                              </div>
                           )}

                           {/* Fecha (solo para perfil_creado o si no hay fecha_inicio) */}
                           {(eventoSeleccionado.tipo === 'perfil_creado' || !eventoSeleccionado.fecha_inicio) && (
                              <div>
                                 <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                                    {eventoSeleccionado.tipo === 'fecha_limite' ? 'Fecha Límite' : 'Fecha de Creación'}
                                 </p>
                                 <div className="flex items-center gap-2">
                                    <CalendarDays size={15} className="text-indigo-400" />
                                    <p className="text-white font-medium capitalize">
                                       {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-EC', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                       })}
                                       {eventoSeleccionado.tipo === 'perfil_creado' && eventoSeleccionado.hora && (
                                          <span className="text-slate-400 ml-2">{eventoSeleccionado.hora}</span>
                                       )}
                                    </p>
                                 </div>
                              </div>
                           )}

                           {/* Días restantes */}
                           {eventoSeleccionado.tipo === 'fecha_limite' && !eventoSeleccionado.completado && (
                              (() => {
                                 const hoy = getHoyEcuador();
                                 const fechaLimite = new Date(eventoSeleccionado.fecha);
                                 fechaLimite.setHours(0, 0, 0, 0);
                                 const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

                                 if (diasRestantes > 0) {
                                    return (
                                       <div className={`p-4 rounded-xl border ${diasRestantes <= 7 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                                          <div className="flex items-center gap-2 mb-1">
                                             <Clock size={14} className={diasRestantes <= 7 ? 'text-amber-400' : 'text-indigo-400'} />
                                             <p className={`text-[10px] font-semibold uppercase tracking-wider ${diasRestantes <= 7 ? 'text-amber-400' : 'text-indigo-400'}`}>
                                                {diasRestantes <= 7 ? 'Urgente' : 'Tiempo restante'}
                                             </p>
                                          </div>
                                          <p className="text-lg font-semibold text-white">
                                             {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'}
                                          </p>
                                       </div>
                                    );
                                 }
                                 return null;
                              })()
                           )}

                           {/* Detalles adicionales según tipo */}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (eventoSeleccionado.cantidad_objetivo > (eventoSeleccionado.cantidad_completada || 0)) && !eventoSeleccionado.completado && (
                              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                 <div className="flex items-center gap-2 mb-1.5">
                                    <TrendingUp size={14} className="text-amber-400" />
                                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Pendiente</p>
                                 </div>
                                 <p className="text-sm text-slate-300 font-medium">
                                    Faltan {eventoSeleccionado.cantidad_objetivo - (eventoSeleccionado.cantidad_completada || 0)} perfiles por crear
                                 </p>
                              </div>
                           )}

                           {eventoSeleccionado.tipo === 'perfil_creado' && (
                              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-2.5">
                                 {eventoSeleccionado.nombre_usuario && (
                                    <div className="flex justify-between">
                                       <span className="text-xs text-slate-400 font-medium">Usuario</span>
                                       <span className="text-sm text-white font-medium">{eventoSeleccionado.nombre_usuario}</span>
                                    </div>
                                 )}
                                 {eventoSeleccionado.tipo_jugador && (
                                    <div className="flex justify-between">
                                       <span className="text-xs text-slate-400 font-medium">Tipo</span>
                                       <span className="text-sm text-white font-medium">{eventoSeleccionado.tipo_jugador}</span>
                                    </div>
                                 )}
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Footer - SIEMPRE visible */}
                     <div className="modal-footer">
                        <button
                           onClick={() => setEventoSeleccionado(null)}
                           className="w-full py-2.5 text-sm font-medium rounded-xl bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] hover:text-white transition-all border border-white/[0.06]"
                        >
                           Cerrar
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         {/* Modal de Planificación */}
         {
            modalPlanificacion && (
               <div className="modal-overlay" style={{ zIndex: 9999 }}>
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setModalPlanificacion(null)} />
                  <div className="modal-panel modal-sm animate-in zoom-in-95 slide-in-from-bottom-4 duration-200" style={{ borderColor: 'rgba(139, 92, 246, 0.2)' }}>

                     {/* Header - SIEMPRE visible */}
                     <div className="modal-header" style={{ background: 'rgba(139, 92, 246, 0.05)' }}>
                        <div className="flex items-center gap-3">
                           <div className="p-2.5 bg-violet-500/15 rounded-xl border border-violet-500/25 shrink-0">
                              <CalendarDays size={20} className="text-violet-400" />
                           </div>
                           <div className="min-w-0 flex-1">
                              <h2 className="text-base font-semibold text-white truncate">Planificar Perfiles</h2>
                              <p className="text-xs text-violet-400/80 truncate">{modalPlanificacion.agenciaNombre}</p>
                           </div>
                           <button
                              onClick={() => setModalPlanificacion(null)}
                              className="p-2 hover:bg-white/[0.05] rounded-xl text-slate-500 hover:text-white transition-all shrink-0"
                           >
                              <X size={18} />
                           </button>
                        </div>
                     </div>

                     {/* Body - ÚNICO elemento scrollable */}
                     <div className="modal-body">
                        <div className="p-5 space-y-5">
                           {/* Fecha seleccionada */}
                           <div>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Fecha Seleccionada</p>
                              <div className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.06]">
                                 <p className="text-white font-medium capitalize">
                                    {new Date(modalPlanificacion.fecha + 'T12:00:00').toLocaleDateString('es-EC', {
                                       weekday: 'long',
                                       year: 'numeric',
                                       month: 'long',
                                       day: 'numeric'
                                    })}
                                 </p>
                              </div>
                           </div>

                           {/* Selector de cantidad */}
                           <div>
                              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                                 ¿Cuántos perfiles crear este día?
                              </p>
                              <div className="flex items-center justify-center gap-5">
                                 <button
                                    onClick={() => setCantidadPlanificar(Math.max(1, cantidadPlanificar - 1))}
                                    disabled={cantidadPlanificar <= 1}
                                    className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                 >
                                    <Minus size={18} className="text-slate-300" />
                                 </button>
                                 <div className="w-24 text-center">
                                    <span className="text-4xl font-semibold text-violet-400">{cantidadPlanificar}</span>
                                    <p className="text-[10px] text-slate-500 uppercase mt-1">perfiles</p>
                                 </div>
                                 <button
                                    onClick={() => setCantidadPlanificar(Math.min(modalPlanificacion.cantidadMax, cantidadPlanificar + 1))}
                                    disabled={cantidadPlanificar >= modalPlanificacion.cantidadMax}
                                    className="p-3 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                 >
                                    <Plus size={18} className="text-slate-300" />
                                 </button>
                              </div>
                              <p className="text-center text-xs text-slate-500 mt-3">
                                 Máximo disponible: <span className="text-white font-medium">{modalPlanificacion.cantidadMax}</span>
                              </p>
                           </div>
                        </div>
                     </div>

                     {/* Footer - SIEMPRE visible */}
                     <div className="modal-footer flex gap-3">
                        <button
                           onClick={() => setModalPlanificacion(null)}
                           className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white transition-all border border-white/[0.06]"
                        >
                           Cancelar
                        </button>
                        <button
                           onClick={async () => {
                              if (!modalPlanificacion) return;
                              setIsSubmitting(true);
                              try {
                                 await objetivosService.planificar(modalPlanificacion.objetivoId, {
                                    fecha: modalPlanificacion.fecha,
                                    cantidad: cantidadPlanificar
                                 });
                                 setToast({ message: `Se planificaron ${cantidadPlanificar} perfil(es) para ${new Date(modalPlanificacion.fecha + 'T12:00:00').toLocaleDateString('es-EC', { day: 'numeric', month: 'short' })}`, type: 'success' });
                                 setModalPlanificacion(null);
                                 onRefresh?.();
                              } catch (error: any) {
                                 setToast({ message: error.message || 'Error al planificar', type: 'error' });
                              } finally {
                                 setIsSubmitting(false);
                              }
                           }}
                           disabled={isSubmitting}
                           className="flex-1 py-2.5 text-sm font-semibold rounded-xl bg-violet-500 text-white hover:bg-violet-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                           {isSubmitting ? (
                              <>
                                 <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                 Guardando...
                              </>
                           ) : (
                              <>
                                 <CheckCircle2 size={14} />
                                 Confirmar
                              </>
                           )}
                        </button>
                     </div>
                  </div>
               </div>
            )
         }

         {/* Toast de notificación */}
         {
            toast && (
               <div
                  className={`fixed bottom-6 right-6 z-[10000] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-sm cursor-pointer ${toast.type === 'success' ? 'bg-emerald-500/90 text-white shadow-emerald-500/20' : 'bg-red-500/90 text-white shadow-red-500/20'
                     }`}
                  onClick={() => setToast(null)}
               >
                  {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span className="font-medium text-sm">{toast.message}</span>
                  <button className="ml-1 opacity-70 hover:opacity-100 transition-opacity">
                     <X size={14} />
                  </button>
               </div>
            )
         }
      </div >
   );
};
