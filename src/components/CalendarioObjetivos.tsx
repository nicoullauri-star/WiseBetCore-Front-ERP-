/**
 * CalendarioObjetivos Component
 * Calendario visual de objetivos de creación de perfiles usando FullCalendar
 * Con filtro por agencia, rango de días coloreados y planificación
 */

import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { 
   Calendar, AlertCircle, CheckCircle2, Clock, X, TrendingUp, Target, 
   Filter, ChevronDown, Building2, Plus, UserPlus, Minus
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
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
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
   onRefresh
}) => {
   const [eventoSeleccionado, setEventoSeleccionado] = useState<CalendarioEvento | null>(null);
   const [agenciaFiltro, setAgenciaFiltro] = useState<number | 'todas'>('todas');
   const [isFilterOpen, setIsFilterOpen] = useState(false);
   
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
      const planificados = Object.values(objetivoSeleccionado.planificacion || {}).reduce((a, b) => a + b, 0);
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

   // Generar eventos para FullCalendar (incluye eventos de rango para background)
   const fullCalendarEvents = useMemo(() => {
      if (!eventosFiltrados || eventosFiltrados.length === 0) return [];

      const hoy = getHoyEcuador();
      const calendarEvents: any[] = [];

      eventosFiltrados.forEach(evento => {
         if (!evento || !evento.id || !evento.fecha) return;

         const agenciaColor = getAgenciaColor(evento.agencia_id);
         
         // Determinar colores según estado (para el marcador de fecha límite)
         let backgroundColor = agenciaColor.border;
         let borderColor = agenciaColor.border;
         
         if (evento.tipo === 'fecha_limite') {
            if (evento.completado) {
               backgroundColor = '#10b981'; // Verde si completado
               borderColor = '#059669';
            } else {
               const fechaLimite = new Date(evento.fecha);
               fechaLimite.setHours(0, 0, 0, 0);
               
               if (fechaLimite < hoy) {
                  backgroundColor = '#ef4444'; // Rojo si vencido
                  borderColor = '#dc2626';
               } else {
                  // Calcular días restantes
                  const diasRestantes = Math.ceil((fechaLimite.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
                  if (diasRestantes <= 7) {
                     backgroundColor = '#f59e0b'; // Ámbar si urgente (≤7 días)
                     borderColor = '#d97706';
                  }
               }
            }
         }

         // Si es tipo planificado, renderizar SOLO el evento especial y salir
         if (evento.tipo === 'planificado') {
            calendarEvents.push({
               id: evento.id,
               title: `📅 ${evento.cantidad_planificada || 1} perfil(es)`,
               start: evento.fecha,
               backgroundColor: 'rgba(139, 92, 246, 0.3)', // Púrpura para planificados
               borderColor: '#8b5cf6',
               textColor: '#c4b5fd',
               extendedProps: {
                  tipo: 'planificado',
                  agencia_id: evento.agencia_id,
                  agencia_nombre: evento.agencia_nombre,
                  cantidad_planificada: evento.cantidad_planificada,
                  cantidad_creada: evento.cantidad_creada,
                  objetivo_id: evento.objetivo_id
               }
            });
            return; // No procesar más para planificados
         }

         // Evento principal (marcador en fecha límite o fecha de creación de perfil)
         calendarEvents.push({
            id: evento.id,
            title: evento.titulo,
            start: evento.fecha,
            backgroundColor,
            borderColor,
            textColor: '#ffffff',
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
         if (evento.tipo === 'fecha_limite' && evento.fecha_inicio && !evento.completado) {
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
   }, [eventosFiltrados, agenciasConColor]);

   // Renderizar el contenido del evento personalizado
   const renderEventContent = (eventInfo: any) => {
      const { extendedProps } = eventInfo.event;
      
      // No renderizar contenido para eventos de fondo
      if (extendedProps.isRangeEvent) return null;

      // Evento planificado con botón crear perfil
      if (extendedProps.tipo === 'planificado') {
         const yaCreados = extendedProps.cantidad_creada || 0;
         const planificados = extendedProps.cantidad_planificada || 1;
         const pendientes = planificados - yaCreados;
         
         return (
            <div className="px-1.5 py-1 text-xs">
               <div className="flex items-center gap-1 font-bold text-purple-300">
                  <UserPlus size={12} />
                  <span>{planificados} perfil{planificados > 1 ? 'es' : ''}</span>
               </div>
               <div className="text-[10px] text-purple-400/80 truncate">
                  {extendedProps.agencia_nombre}
               </div>
               {pendientes > 0 && onCrearPerfilClick && (
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        onCrearPerfilClick(extendedProps.agencia_id, extendedProps.objetivo_id);
                     }}
                     className="mt-1 w-full px-2 py-1 text-[10px] font-bold bg-purple-500 hover:bg-purple-400 text-white rounded transition-all flex items-center justify-center gap-1"
                  >
                     <Plus size={10} />
                     Crear ({pendientes})
                  </button>
               )}
               {pendientes === 0 && (
                  <div className="mt-1 text-[10px] text-green-400 flex items-center gap-1">
                     <CheckCircle2 size={10} />
                     Completado
                  </div>
               )}
            </div>
         );
      }

      return (
         <div className="px-1.5 py-1 text-xs overflow-hidden">
            <div className="font-bold truncate flex items-center gap-1">
               {extendedProps.tipo === 'fecha_limite' && extendedProps.completado && <CheckCircle2 size={12} />}
               {extendedProps.tipo === 'fecha_limite' && !extendedProps.completado && <AlertCircle size={12} />}
               {extendedProps.tipo === 'perfil_creado' && <Target size={12} />}
               <span className="truncate">{eventInfo.event.title}</span>
            </div>
            <div className="text-[10px] opacity-90 truncate">
               {extendedProps.agencia_nombre}
            </div>
            {extendedProps.tipo === 'fecha_limite' && (
               <div className="text-[10px] opacity-80">
                  {extendedProps.cantidad_completada}/{extendedProps.cantidad_objetivo}
               </div>
            )}
            {extendedProps.tipo === 'perfil_creado' && extendedProps.hora && (
               <div className="text-[10px] opacity-80">
                  {extendedProps.hora}
               </div>
            )}
         </div>
      );
   };

   // Nombre de agencia seleccionada para mostrar
   const agenciaSeleccionadaNombre = agenciaFiltro === 'todas' 
      ? 'Todas las agencias' 
      : agenciasConColor.find(a => a.id === agenciaFiltro)?.nombre || 'Agencia';

   if (loading) {
      return (
         <div className="flex items-center justify-center h-96 bg-[#0a0a0a] border border-white/10 rounded-2xl">
            <div className="text-center">
               <Calendar size={48} className="text-blue-500 animate-pulse mx-auto mb-3" />
               <p className="text-sm text-slate-400 font-bold">Cargando calendario...</p>
            </div>
         </div>
      );
   }

   return (
      <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-6 shadow-xl">
         {/* Header con filtro */}
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
               <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/40">
                  <Calendar size={24} className="text-blue-400" />
               </div>
               <div>
                  <h2 className="text-lg font-black text-white uppercase tracking-wider">
                     Calendario de Objetivos
                  </h2>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                     {eventosFiltrados?.length || 0} eventos • Zona horaria: Ecuador (UTC-5)
                  </p>
               </div>
            </div>

            {/* Filtro de Agencia */}
            <div className="relative">
               <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#111] border border-white/10 rounded-xl hover:border-blue-500/50 transition-all min-w-[200px]"
               >
                  <Filter size={16} className="text-blue-400" />
                  <span className="text-sm text-white font-bold flex-1 text-left truncate">
                     {agenciaSeleccionadaNombre}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
               </button>

               {isFilterOpen && (
                  <>
                     <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                     <div className="absolute right-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="p-2 border-b border-white/5">
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Filtrar por agencia</p>
                        </div>
                        <div className="max-h-64 overflow-y-auto custom-scrollbar">
                           {/* Opción: Todas las agencias */}
                           <button
                              onClick={() => { setAgenciaFiltro('todas'); setIsFilterOpen(false); }}
                              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all ${agenciaFiltro === 'todas' ? 'bg-blue-500/10' : ''}`}
                           >
                              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                              <span className={`text-sm font-bold ${agenciaFiltro === 'todas' ? 'text-blue-400' : 'text-white'}`}>
                                 Todas las agencias
                              </span>
                              {agenciaFiltro === 'todas' && <CheckCircle2 size={14} className="text-blue-400 ml-auto" />}
                           </button>

                           {/* Lista de agencias */}
                           {agenciasConColor.map(agencia => (
                              <button
                                 key={agencia.id}
                                 onClick={() => { setAgenciaFiltro(agencia.id); setIsFilterOpen(false); }}
                                 className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-all ${agenciaFiltro === agencia.id ? 'bg-blue-500/10' : ''}`}
                              >
                                 <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: agencia.color.border }}
                                 />
                                 <span className={`text-sm font-bold truncate ${agenciaFiltro === agencia.id ? 'text-blue-400' : 'text-white'}`}>
                                    {agencia.nombre}
                                 </span>
                                 {agenciaFiltro === agencia.id && <CheckCircle2 size={14} className="text-blue-400 ml-auto flex-shrink-0" />}
                              </button>
                           ))}
                        </div>
                     </div>
                  </>
               )}
            </div>
         </div>

         {/* Leyenda de colores */}
         <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-amber-500"></div>
               <span className="text-xs text-slate-400 font-bold">Urgente (≤7d)</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-red-500"></div>
               <span className="text-xs text-slate-400 font-bold">Vencido</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-green-500"></div>
               <span className="text-xs text-slate-400 font-bold">Completado</span>
            </div>
            <div className="w-px h-4 bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
               <div className="w-6 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
               <span className="text-xs text-slate-400 font-bold">Rango activo</span>
            </div>
         </div>

         {/* Leyenda de colores por agencia (solo si hay múltiples y se muestran todas) */}
         {agenciaFiltro === 'todas' && agenciasConColor.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-white/5">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2 self-center">Agencias:</span>
               {agenciasConColor.map(agencia => (
                  <button
                     key={agencia.id}
                     onClick={() => setAgenciaFiltro(agencia.id)}
                     className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-white/5 hover:border-white/20 transition-all group"
                     style={{ backgroundColor: agencia.color.bg }}
                  >
                     <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: agencia.color.border }}
                     />
                     <span className="text-[10px] font-bold text-slate-300 group-hover:text-white transition-colors">
                        {agencia.nombre}
                     </span>
                  </button>
               ))}
            </div>
         )}

         {/* Indicador de modo planificación */}
         {objetivoSeleccionado && faltantesPorPlanificar > 0 && (
            <div className="mb-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl animate-pulse-soft">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                     <Calendar size={20} className="text-purple-400" />
                  </div>
                  <div className="flex-1">
                     <p className="text-sm font-black text-purple-300">Modo Planificación Activo</p>
                     <p className="text-xs text-purple-400/80">
                        Haz clic en un día para planificar perfiles • <span className="text-white font-bold">{faltantesPorPlanificar}</span> por asignar
                     </p>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-purple-400 uppercase font-bold">Agencia</p>
                     <p className="text-sm font-bold text-white">{agenciasConColor.find(a => a.id === agenciaFiltro)?.nombre}</p>
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
               dateClick={(info) => {
                  // Validar: objetivo seleccionado, faltantes disponibles, y fecha válida
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
                  // Ignorar clicks en eventos de fondo
                  if (info.event.extendedProps.isRangeEvent) return;
                  
                  // Buscar el evento completo en los datos originales
                  const eventoCompleto = eventosFiltrados.find(e => e.id === info.event.id);
                  if (eventoCompleto) {
                     setEventoSeleccionado(eventoCompleto);
                  }
               }}
               eventDisplay="auto"
            />
         </div>

         {(!eventosFiltrados || eventosFiltrados.length === 0) && !loading && (
            <div className="text-center py-12">
               <Calendar size={48} className="text-slate-600 mx-auto mb-3" />
               <p className="text-sm text-slate-500 font-bold">
                  {agenciaFiltro === 'todas' 
                     ? 'No hay objetivos programados' 
                     : `No hay objetivos para ${agenciaSeleccionadaNombre}`}
               </p>
               <p className="text-xs text-slate-600 mt-1">
                  {agenciaFiltro === 'todas' 
                     ? 'Crea objetivos para verlos en el calendario'
                     : 'Selecciona otra agencia o muestra todas'}
               </p>
               {agenciaFiltro !== 'todas' && (
                  <button
                     onClick={() => setAgenciaFiltro('todas')}
                     className="mt-4 px-4 py-2 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-lg hover:bg-blue-500/20 transition-all"
                  >
                     Ver todas las agencias
                  </button>
               )}
            </div>
         )}

         {/* Modal de detalles del evento */}
         {eventoSeleccionado && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEventoSeleccionado(null)} />
               <div className="relative w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                  
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 bg-[#0a0a0a] flex justify-between items-start gap-3">
                     <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl border ${
                           eventoSeleccionado.tipo === 'perfil_creado' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' :
                           eventoSeleccionado.completado ? 'bg-green-500/20 border-green-500/40 text-green-400' :
                           new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                           'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        }`}>
                           {eventoSeleccionado.tipo === 'perfil_creado' && <Target size={24} />}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.completado && <CheckCircle2 size={24} />}
                           {eventoSeleccionado.tipo === 'fecha_limite' && !eventoSeleccionado.completado && <AlertCircle size={24} />}
                        </div>
                        <div>
                           <h2 className="text-lg font-black text-white tracking-tight">{eventoSeleccionado.titulo}</h2>
                           <div className="flex items-center gap-2 mt-1">
                              <Building2 size={12} className="text-slate-500" />
                              <p className="text-xs text-slate-400 font-bold">{eventoSeleccionado.agencia_nombre}</p>
                           </div>
                        </div>
                     </div>
                     <button 
                        onClick={() => setEventoSeleccionado(null)}
                        className="p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-4">
                     {/* Tipo y Estado */}
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                           {eventoSeleccionado.tipo === 'perfil_creado' ? 'Tipo' : 'Estado'}
                        </p>
                        <div className="flex items-center gap-2">
                           {eventoSeleccionado.tipo === 'perfil_creado' ? (
                              <span className="px-3 py-1.5 text-xs font-black uppercase rounded-lg border bg-blue-500/20 text-blue-400 border-blue-500/30">
                                 📊 Perfil Creado
                              </span>
                           ) : (
                              <span className={`px-3 py-1.5 text-xs font-black uppercase rounded-lg border ${
                                 eventoSeleccionado.completado ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                 new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                 {eventoSeleccionado.completado ? '✓ Completado' :
                                  new Date(eventoSeleccionado.fecha) < getHoyEcuador() ? '⚠ Vencido' :
                                  '⏰ Pendiente'}
                              </span>
                           )}
                        </div>
                     </div>

                     {/* Rango de fechas - Solo para fecha_limite */}
                     {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.fecha_inicio && (
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Período del Objetivo</p>
                           <div className="flex items-center gap-3 p-3 bg-[#111] rounded-xl border border-white/5">
                              <div className="flex-1">
                                 <p className="text-[9px] text-slate-500 font-bold uppercase">Inicio</p>
                                 <p className="text-sm text-white font-bold">
                                    {new Date(eventoSeleccionado.fecha_inicio).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                 </p>
                              </div>
                              <div className="text-slate-600">→</div>
                              <div className="flex-1 text-right">
                                 <p className="text-[9px] text-slate-500 font-bold uppercase">Límite</p>
                                 <p className="text-sm text-white font-bold">
                                    {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })}
                                 </p>
                              </div>
                           </div>
                        </div>
                     )}

                     {/* Objetivo - Solo para fecha_limite */}
                     {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Objetivo</p>
                           <div className="flex items-center gap-2">
                              <Target size={16} className="text-blue-400" />
                              <p className="text-white font-bold">Crear {eventoSeleccionado.cantidad_objetivo} perfiles</p>
                           </div>
                        </div>
                     )}

                     {/* Progreso - Solo para fecha_limite */}
                     {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Progreso</p>
                           <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                 <span className="text-slate-400 font-bold">Completado</span>
                                 <span className="text-white font-black">{eventoSeleccionado.cantidad_completada || 0}/{eventoSeleccionado.cantidad_objetivo}</span>
                              </div>
                              <div className="w-full bg-gray-800 rounded-full h-3">
                                 <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 flex items-center justify-end pr-2" 
                                    style={{ width: `${Math.round(((eventoSeleccionado.cantidad_completada || 0) / eventoSeleccionado.cantidad_objetivo) * 100)}%` }}
                                 >
                                    {((eventoSeleccionado.cantidad_completada || 0) / eventoSeleccionado.cantidad_objetivo) * 100 > 15 && (
                                       <span className="text-[10px] font-black text-white">{Math.round(((eventoSeleccionado.cantidad_completada || 0) / eventoSeleccionado.cantidad_objetivo) * 100)}%</span>
                                    )}
                                 </div>
                              </div>
                              {eventoSeleccionado.perfiles_restantes !== undefined && (
                                 <p className="text-xs text-slate-400 font-bold">Restantes: {eventoSeleccionado.perfiles_restantes}</p>
                              )}
                           </div>
                        </div>
                     )}

                     {/* Fecha (solo para perfil_creado o si no hay fecha_inicio) */}
                     {(eventoSeleccionado.tipo === 'perfil_creado' || !eventoSeleccionado.fecha_inicio) && (
                        <div>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                              {eventoSeleccionado.tipo === 'fecha_limite' ? 'Fecha Límite' : 'Fecha de Creación'}
                           </p>
                           <div className="flex items-center gap-2">
                              <Calendar size={16} className="text-blue-400" />
                              <p className="text-white font-bold">
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
                                 <div className={`p-4 rounded-xl border ${diasRestantes <= 7 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                       <Clock size={16} className={diasRestantes <= 7 ? 'text-amber-400' : 'text-blue-400'} />
                                       <p className={`text-xs font-black uppercase ${diasRestantes <= 7 ? 'text-amber-400' : 'text-blue-400'}`}>
                                          {diasRestantes <= 7 ? 'Urgente' : 'Tiempo restante'}
                                       </p>
                                    </div>
                                    <p className="text-lg font-black text-white">
                                       {diasRestantes} {diasRestantes === 1 ? 'día' : 'días'} restantes
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
                           <div className="flex items-center gap-2 mb-2">
                              <TrendingUp size={16} className="text-amber-400" />
                              <p className="text-xs font-black text-amber-400 uppercase">Pendiente</p>
                           </div>
                           <p className="text-sm text-slate-300 font-bold">
                              Faltan {eventoSeleccionado.cantidad_objetivo - (eventoSeleccionado.cantidad_completada || 0)} perfiles por crear
                           </p>
                        </div>
                     )}
                     
                     {eventoSeleccionado.tipo === 'perfil_creado' && (
                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl space-y-2">
                           {eventoSeleccionado.nombre_usuario && (
                              <div className="flex justify-between">
                                 <span className="text-xs text-slate-400 font-bold">Usuario:</span>
                                 <span className="text-sm text-white font-bold">{eventoSeleccionado.nombre_usuario}</span>
                              </div>
                           )}
                           {eventoSeleccionado.tipo_jugador && (
                              <div className="flex justify-between">
                                 <span className="text-xs text-slate-400 font-bold">Tipo:</span>
                                 <span className="text-sm text-white font-bold">{eventoSeleccionado.tipo_jugador}</span>
                              </div>
                           )}
                        </div>
                     )}
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-white/10 bg-[#0a0a0a]">
                     <button 
                        onClick={() => setEventoSeleccionado(null)}
                        className="w-full py-2.5 text-sm font-black uppercase rounded-xl bg-white/5 text-white hover:bg-white/10 transition-all"
                     >
                        Cerrar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Modal de Planificación */}
         {modalPlanificacion && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModalPlanificacion(null)} />
               <div className="relative w-full max-w-sm bg-[#0d0d0d] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                  
                  {/* Header */}
                  <div className="px-6 py-4 border-b border-white/10 bg-purple-500/10">
                     <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-purple-500/20 rounded-xl border border-purple-500/40">
                           <Calendar size={24} className="text-purple-400" />
                        </div>
                        <div>
                           <h2 className="text-lg font-black text-white">Planificar Perfiles</h2>
                           <p className="text-xs text-purple-400">{modalPlanificacion.agenciaNombre}</p>
                        </div>
                        <button 
                           onClick={() => setModalPlanificacion(null)}
                           className="ml-auto p-2 hover:bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"
                        >
                           <X size={20} />
                        </button>
                     </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 space-y-6">
                     {/* Fecha seleccionada */}
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Fecha Seleccionada</p>
                        <div className="p-3 bg-[#111] rounded-xl border border-white/10">
                           <p className="text-white font-bold">
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
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                           ¿Cuántos perfiles crear este día?
                        </p>
                        <div className="flex items-center justify-center gap-4">
                           <button
                              onClick={() => setCantidadPlanificar(Math.max(1, cantidadPlanificar - 1))}
                              disabled={cantidadPlanificar <= 1}
                              className="p-3 bg-[#111] border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                           >
                              <Minus size={20} className="text-white" />
                           </button>
                           <div className="w-20 text-center">
                              <span className="text-4xl font-black text-purple-400">{cantidadPlanificar}</span>
                              <p className="text-[10px] text-slate-500 uppercase">perfiles</p>
                           </div>
                           <button
                              onClick={() => setCantidadPlanificar(Math.min(modalPlanificacion.cantidadMax, cantidadPlanificar + 1))}
                              disabled={cantidadPlanificar >= modalPlanificacion.cantidadMax}
                              className="p-3 bg-[#111] border border-white/10 rounded-xl hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                           >
                              <Plus size={20} className="text-white" />
                           </button>
                        </div>
                        <p className="text-center text-xs text-slate-500 mt-2">
                           Máximo disponible: <span className="text-white font-bold">{modalPlanificacion.cantidadMax}</span>
                        </p>
                     </div>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 border-t border-white/10 bg-[#0a0a0a] flex gap-3">
                     <button 
                        onClick={() => setModalPlanificacion(null)}
                        className="flex-1 py-2.5 text-sm font-bold rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 transition-all"
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
                        className="flex-1 py-2.5 text-sm font-black uppercase rounded-xl bg-purple-500 text-white hover:bg-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                     >
                        {isSubmitting ? (
                           <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Guardando...
                           </>
                        ) : (
                           <>
                              <CheckCircle2 size={16} />
                              Confirmar
                           </>
                        )}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* Toast de notificación */}
         {toast && (
            <div 
               className={`fixed bottom-6 right-6 z-[10000] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${
                  toast.type === 'success' ? 'bg-green-500/90 text-white' : 'bg-red-500/90 text-white'
               }`}
               onClick={() => setToast(null)}
            >
               {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
               <span className="font-bold text-sm">{toast.message}</span>
               <button className="ml-2 opacity-70 hover:opacity-100">
                  <X size={16} />
               </button>
            </div>
         )}
      </div>
   );
};
