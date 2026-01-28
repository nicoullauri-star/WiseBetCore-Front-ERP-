/**
 * CentroGestion Component - Enterprise Dashboard
 * Panel principal con secciones colapsables (acordeones) para gestión de la red operativa
 * 
 * Diseño basado en las 10 Heurísticas de Nielsen:
 * - Visibilidad del estado del sistema
 * - Consistencia y estándares  
 * - Prevención de errores
 * - Diseño estético y minimalista
 * 
 * Secciones:
 * 1. Alertas - Feed profesional estilo CEO con prioridades
 * 2. Calendario de Objetivos - Planificación de creación de perfiles
 * 3. Calendario de Agencias - Creación de nuevas agencias (solo hoy/futuro)
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
   ChevronDown, ChevronUp, Bell, Calendar, Building2, 
   AlertCircle, Target, RefreshCw, Maximize2, Minimize2,
   Clock, CheckCircle2, AlertTriangle, ArrowRight, Zap,
   TrendingUp, Activity, Plus, Store
} from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { CalendarioObjetivos } from './CalendarioObjetivos';
import type { CalendarioEvento, ObjetivoPerfiles, Agencia } from '../types';

// ============================================================================
// TIPOS
// ============================================================================

type SectionId = 'alertas' | 'calendario_objetivos' | 'calendario_agencias';

interface Section {
   id: SectionId;
   title: string;
   subtitle: string;
   icon: React.ReactNode;
   description: string;
   accentColor: string;
   badge?: number;
}

interface CentroGestionProps {
   // Datos del calendario de objetivos
   eventosCalendario: CalendarioEvento[];
   loadingEventos: boolean;
   objetivosPendientes: ObjetivoPerfiles[];
   filtroAgenciaInicial?: number | null;
   
   // Datos del calendario de agencias
   agencias?: Agencia[];
   loadingAgencias?: boolean;
   
   // Callbacks
   onCrearPerfilClick?: (agenciaId: number, objetivoId: number) => void;
   onRefresh?: () => void;
   
   // Para las alertas (pasamos funciones que maneja el padre)
   onPlanificarClick?: (agenciaId: number, objetivoId: number) => void;
   
   // Para crear agencias desde el calendario
   onCrearAgenciaClick?: (fecha: Date) => void;
   onRefreshAgencias?: () => void;
}

// ============================================================================
// CONFIGURACIÓN DE SECCIONES - Diseño Enterprise
// ============================================================================

const SECTIONS: Section[] = [
   {
      id: 'alertas',
      title: 'Centro de Alertas',
      subtitle: 'Acciones Pendientes',
      icon: <Bell size={20} />,
      description: 'Tareas críticas que requieren atención inmediata',
      accentColor: 'amber'
   },
   {
      id: 'calendario_objetivos',
      title: 'Planificador De Creacion De Perfiles',
      subtitle: 'Calendario de Metas',
      icon: <Target size={20} />,
      description: 'Gestión visual de objetivos y planificación de perfiles',
      accentColor: 'indigo'
   },
   {
      id: 'calendario_agencias',
      title: 'Red de Agencias',
      subtitle: 'Crear Agencias',
      icon: <Building2 size={20} />,
      description: 'Calendario para creación de nuevas agencias en fechas válidas',
      accentColor: 'emerald'
   }
];

// Paleta de colores profesional (sobria)
const ACCENT_COLORS = {
   amber: {
      bg: 'bg-amber-500/8',
      bgHover: 'hover:bg-amber-500/12',
      border: 'border-amber-500/20',
      borderActive: 'border-amber-500/40',
      text: 'text-amber-400',
      textMuted: 'text-amber-500/70',
      icon: 'bg-amber-500/15 text-amber-400',
      badge: 'bg-amber-500',
      glow: 'shadow-amber-500/10'
   },
   indigo: {
      bg: 'bg-indigo-500/8',
      bgHover: 'hover:bg-indigo-500/12',
      border: 'border-indigo-500/20',
      borderActive: 'border-indigo-500/40',
      text: 'text-indigo-400',
      textMuted: 'text-indigo-500/70',
      icon: 'bg-indigo-500/15 text-indigo-400',
      badge: 'bg-indigo-500',
      glow: 'shadow-indigo-500/10'
   },
   emerald: {
      bg: 'bg-emerald-500/8',
      bgHover: 'hover:bg-emerald-500/12',
      border: 'border-emerald-500/20',
      borderActive: 'border-emerald-500/40',
      text: 'text-emerald-400',
      textMuted: 'text-emerald-500/70',
      icon: 'bg-emerald-500/15 text-emerald-400',
      badge: 'bg-emerald-500',
      glow: 'shadow-emerald-500/10'
   }
};

// ============================================================================
// COMPONENTE DE SECCIÓN COLAPSABLE (ACORDEÓN) - Enterprise Design
// ============================================================================

interface AccordionSectionProps {
   section: Section;
   isExpanded: boolean;
   onToggle: () => void;
   children: React.ReactNode;
   badge?: number;
   badgeUrgent?: boolean;
   isLoading?: boolean;
   onRefresh?: () => void;
   isOnly?: boolean; // Si es la única sección expandida
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
   section,
   isExpanded,
   onToggle,
   children,
   badge,
   badgeUrgent,
   isLoading,
   onRefresh,
   isOnly
}) => {
   const contentRef = useRef<HTMLDivElement>(null);
   const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');
   const [isAnimating, setIsAnimating] = useState(false);

   // Calcular altura del contenido para animación suave
   useEffect(() => {
      if (contentRef.current) {
         if (isExpanded) {
            setIsAnimating(true);
            setContentHeight(contentRef.current.scrollHeight);
            // Después de la animación, cambiar a auto para permitir resize
            const timer = setTimeout(() => {
               setContentHeight('auto');
               setIsAnimating(false);
            }, 350);
            return () => clearTimeout(timer);
         } else {
            setContentHeight(0);
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 350);
            return () => clearTimeout(timer);
         }
      }
   }, [isExpanded]);

   // Disparar resize cuando se expande (para FullCalendar)
   useEffect(() => {
      if (isExpanded && !isAnimating) {
         const timer = setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
         }, 50);
         return () => clearTimeout(timer);
      }
   }, [isExpanded, isAnimating]);

   const colors = ACCENT_COLORS[section.accentColor as keyof typeof ACCENT_COLORS] || ACCENT_COLORS.indigo;

   return (
      <div 
         className={`
            accordion-panel rounded-2xl border transition-all duration-300 ease-out
            ${isExpanded 
               ? `${colors.borderActive} ${colors.bg} shadow-xl ${colors.glow}` 
               : `border-slate-800/60 bg-slate-900/40 ${colors.bgHover}`
            }
         `}
      >
         {/* Header del acordeón - Diseño Premium */}
         <button
            onClick={onToggle}
            className={`
               w-full flex items-center justify-between px-5 py-4
               text-left transition-all duration-200 rounded-2xl
               focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 
               focus-visible:ring-offset-slate-900 focus-visible:ring-indigo-500/50
               ${!isExpanded && 'hover:bg-slate-800/30'}
            `}
         >
            <div className="flex items-center gap-4">
               {/* Icono de la sección con diseño refinado */}
               <div className={`
                  relative p-3 rounded-xl transition-all duration-300
                  ${isExpanded ? colors.icon : 'bg-slate-800/60 text-slate-400'}
               `}>
                  {section.icon}
                  {/* Indicador de actividad */}
                  {isExpanded && (
                     <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${colors.badge} animate-pulse`} />
                  )}
               </div>
               
               {/* Título y descripción */}
               <div className="space-y-0.5">
                  <div className="flex items-center gap-3">
                     <h3 className={`
                        text-sm font-bold tracking-wide transition-colors
                        ${isExpanded ? 'text-white' : 'text-slate-200'}
                     `}>
                        {section.title}
                     </h3>
                     {badge !== undefined && badge > 0 && (
                        <span className={`
                           inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                           text-[10px] font-bold text-white rounded-md
                           ${badgeUrgent ? 'bg-rose-500 animate-pulse' : colors.badge}
                        `}>
                           {badge}
                        </span>
                     )}
                     {isExpanded && (
                        <span className={`text-[9px] font-semibold uppercase tracking-wider ${colors.textMuted}`}>
                           {section.subtitle}
                        </span>
                     )}
                  </div>
                  <p className={`
                     text-[11px] font-medium transition-all duration-200
                     ${isExpanded ? 'text-slate-400 opacity-100' : 'text-slate-500 opacity-70'}
                  `}>
                     {section.description}
                  </p>
               </div>
            </div>

            <div className="flex items-center gap-2">
               {/* Botón de refresh (solo si está expandido y tiene callback) */}
               {isExpanded && onRefresh && (
                  <button
                     onClick={(e) => {
                        e.stopPropagation();
                        onRefresh();
                     }}
                     disabled={isLoading}
                     className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isLoading 
                           ? 'text-slate-600 cursor-not-allowed' 
                           : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                        }
                     `}
                     title="Actualizar datos"
                  >
                     <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                  </button>
               )}

               {/* Indicador de expandido/colapsado - Diseño sutil */}
               <div className={`
                  p-2 rounded-lg transition-all duration-300
                  ${isExpanded ? colors.icon : 'text-slate-500'}
               `}>
                  <ChevronDown 
                     size={18} 
                     className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`} 
                  />
               </div>
            </div>
         </button>

         {/* Contenido colapsable con animación suave */}
         <div 
            ref={contentRef}
            className="overflow-hidden transition-all duration-350 ease-out"
            style={{ 
               height: contentHeight === 'auto' ? 'auto' : contentHeight,
               opacity: isExpanded ? 1 : 0,
               transform: isExpanded ? 'translateY(0)' : 'translateY(-8px)'
            }}
         >
            {isExpanded && (
               <div className="px-5 pb-5">
                  <div className="border-t border-slate-700/50 pt-5">
                     {children}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};

// ============================================================================
// COMPONENTE DE ALERTAS - Feed Profesional Estilo CEO
// ============================================================================

import { objetivosService } from '../services/objetivos.service';
import type { AlertaPlanificacion } from '../types';

const TIPOS_PLANIFICACION = ['SIN_PLANIFICAR', 'VENCIDO', 'FALTAN_1_DIA', 'FALTAN_2_DIAS', 'FALTAN_3_DIAS'] as const;
const TIPOS_CREAR_PERFILES = ['HOY', 'MAÑANA'] as const;

// Configuración de alertas con niveles de prioridad visuales (CEO Style)
type PriorityLevel = 'critical' | 'high' | 'medium' | 'low';

const ALERTA_CONFIG: Record<string, { 
   icon: React.ReactNode; 
   priorityLevel: PriorityLevel;
   priorityLabel: string;
   colors: {
      bg: string;
      border: string;
      text: string;
      iconBg: string;
      action: string;
      actionHover: string;
   };
   priority: number;
   tab: 'planificacion' | 'crear_perfiles';
   actionLabel: string;
   actionIcon: React.ReactNode;
}> = {
   'HOY': {
      icon: <Target size={18} />,
      priorityLevel: 'high',
      priorityLabel: 'Acción Hoy',
      colors: {
         bg: 'bg-emerald-500/6',
         border: 'border-emerald-500/20',
         text: 'text-emerald-400',
         iconBg: 'bg-emerald-500/15',
         action: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
         actionHover: 'hover:bg-emerald-500/25'
      },
      priority: 0,
      tab: 'crear_perfiles',
      actionLabel: 'Crear',
      actionIcon: <ArrowRight size={14} />
   },
   'MAÑANA': {
      icon: <Calendar size={18} />,
      priorityLevel: 'medium',
      priorityLabel: 'Mañana',
      colors: {
         bg: 'bg-blue-500/6',
         border: 'border-blue-500/20',
         text: 'text-blue-400',
         iconBg: 'bg-blue-500/15',
         action: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
         actionHover: 'hover:bg-blue-500/25'
      },
      priority: 1,
      tab: 'crear_perfiles',
      actionLabel: 'Ver',
      actionIcon: <ArrowRight size={14} />
   },
   'SIN_PLANIFICAR': {
      icon: <Calendar size={18} />,
      priorityLevel: 'high',
      priorityLabel: 'Sin Planificar',
      colors: {
         bg: 'bg-amber-500/6',
         border: 'border-amber-500/20',
         text: 'text-amber-400',
         iconBg: 'bg-amber-500/15',
         action: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
         actionHover: 'hover:bg-amber-500/25'
      },
      priority: 0,
      tab: 'planificacion',
      actionLabel: 'Planificar',
      actionIcon: <ArrowRight size={14} />
   },
   'VENCIDO': {
      icon: <AlertCircle size={18} />,
      priorityLevel: 'critical',
      priorityLabel: 'Vencido',
      colors: {
         bg: 'bg-rose-500/6',
         border: 'border-rose-500/25',
         text: 'text-rose-400',
         iconBg: 'bg-rose-500/15',
         action: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
         actionHover: 'hover:bg-rose-500/25'
      },
      priority: 0,
      tab: 'planificacion',
      actionLabel: 'Resolver',
      actionIcon: <Zap size={14} />
   },
   'FALTAN_1_DIA': {
      icon: <Clock size={18} />,
      priorityLevel: 'high',
      priorityLabel: '1 Día',
      colors: {
         bg: 'bg-orange-500/6',
         border: 'border-orange-500/20',
         text: 'text-orange-400',
         iconBg: 'bg-orange-500/15',
         action: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
         actionHover: 'hover:bg-orange-500/25'
      },
      priority: 1,
      tab: 'planificacion',
      actionLabel: 'Planificar',
      actionIcon: <ArrowRight size={14} />
   },
   'FALTAN_2_DIAS': {
      icon: <Clock size={18} />,
      priorityLevel: 'medium',
      priorityLabel: '2 Días',
      colors: {
         bg: 'bg-yellow-500/6',
         border: 'border-yellow-500/20',
         text: 'text-yellow-400',
         iconBg: 'bg-yellow-500/15',
         action: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
         actionHover: 'hover:bg-yellow-500/25'
      },
      priority: 2,
      tab: 'planificacion',
      actionLabel: 'Planificar',
      actionIcon: <ArrowRight size={14} />
   },
   'FALTAN_3_DIAS': {
      icon: <Clock size={18} />,
      priorityLevel: 'low',
      priorityLabel: '3 Días',
      colors: {
         bg: 'bg-slate-500/6',
         border: 'border-slate-500/20',
         text: 'text-slate-400',
         iconBg: 'bg-slate-500/15',
         action: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
         actionHover: 'hover:bg-slate-500/25'
      },
      priority: 3,
      tab: 'planificacion',
      actionLabel: 'Ver',
      actionIcon: <ArrowRight size={14} />
   }
};

// Indicador de prioridad visual
const PriorityIndicator: React.FC<{ level: PriorityLevel }> = ({ level }) => {
   const styles = {
      critical: 'bg-rose-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-slate-500'
   };
   
   return (
      <div className="flex items-center gap-1">
         <span className={`w-2 h-2 rounded-full ${styles[level]} ${level === 'critical' ? 'animate-pulse' : ''}`} />
      </div>
   );
};

interface AlertasSectionProps {
   onPlanificarClick?: (agenciaId: number, objetivoId: number) => void;
   onCrearPerfilClick?: (agenciaId: number, objetivoId: number) => void;
}

const AlertasSection: React.FC<AlertasSectionProps> = ({
   onPlanificarClick,
   onCrearPerfilClick
}) => {
   const [alertas, setAlertas] = useState<AlertaPlanificacion[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [activeTab, setActiveTab] = useState<'crear_perfiles' | 'planificacion'>('crear_perfiles');

   const fetchAlertas = useCallback(async () => {
      setIsLoading(true);
      try {
         const data = await objetivosService.getAlertas();
         setAlertas(data);
      } catch (err) {
         console.error('Error fetching alertas:', err);
         setAlertas([]);
      } finally {
         setIsLoading(false);
      }
   }, []);

   useEffect(() => {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, 60000); // Polling cada minuto
      return () => clearInterval(interval);
   }, [fetchAlertas]);

   const alertasFiltradas = React.useMemo(() => {
      const tiposTab = activeTab === 'planificacion' ? TIPOS_PLANIFICACION : TIPOS_CREAR_PERFILES;
      return alertas
         .filter(a => (tiposTab as readonly string[]).includes(a.tipo))
         .sort((a, b) => {
            const prioA = ALERTA_CONFIG[a.tipo]?.priority ?? 99;
            const prioB = ALERTA_CONFIG[b.tipo]?.priority ?? 99;
            return prioA - prioB;
         });
   }, [alertas, activeTab]);

   // Contadores para badges
   const contadores = React.useMemo(() => {
      const planificacion = alertas.filter(a => 
         (TIPOS_PLANIFICACION as readonly string[]).includes(a.tipo)
      ).length;
      const crearPerfiles = alertas.filter(a => 
         (TIPOS_CREAR_PERFILES as readonly string[]).includes(a.tipo)
      ).length;
      // Contar urgentes (críticos)
      const urgentes = alertas.filter(a => {
         const config = ALERTA_CONFIG[a.tipo];
         return config?.priorityLevel === 'critical';
      }).length;
      return { planificacion, crearPerfiles, urgentes };
   }, [alertas]);

   const handleAccion = (alerta: AlertaPlanificacion) => {
      const config = ALERTA_CONFIG[alerta.tipo];
      if (!config) return;

      if (config.tab === 'planificacion') {
         onPlanificarClick?.(alerta.agencia_id, alerta.objetivo_id);
      } else {
         onCrearPerfilClick?.(alerta.agencia_id, alerta.objetivo_id);
      }
   };

   return (
      <div className="space-y-5">
         {/* Header con estadísticas rápidas - Estilo CEO */}
         <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
            <div className="flex items-center gap-6">
               {/* Stat: Urgentes */}
               {contadores.urgentes > 0 && (
                  <div className="flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                     <span className="text-xs font-semibold text-rose-400">
                        {contadores.urgentes} urgente{contadores.urgentes !== 1 ? 's' : ''}
                     </span>
                  </div>
               )}
               {/* Stat: Total */}
               <div className="flex items-center gap-2">
                  <Activity size={14} className="text-slate-500" />
                  <span className="text-xs font-medium text-slate-400">
                     {alertas.length} pendiente{alertas.length !== 1 ? 's' : ''}
                  </span>
               </div>
            </div>
            
            {/* Actualizar */}
            <button 
               onClick={fetchAlertas}
               disabled={isLoading}
               className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
            >
               <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
               Actualizar
            </button>
         </div>

         {/* Tabs - Diseño minimalista */}
         <div className="flex gap-1 p-1 bg-slate-800/40 rounded-xl">
            <button
               onClick={() => setActiveTab('crear_perfiles')}
               className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg 
                  text-[11px] font-semibold uppercase tracking-wide transition-all duration-200
                  ${activeTab === 'crear_perfiles'
                     ? 'bg-slate-700/80 text-white shadow-sm'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }
               `}
            >
               <Target size={14} />
               Crear Perfiles
               {contadores.crearPerfiles > 0 && (
                  <span className={`
                     ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded
                     ${activeTab === 'crear_perfiles' ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-300'}
                  `}>
                     {contadores.crearPerfiles}
                  </span>
               )}
            </button>
            <button
               onClick={() => setActiveTab('planificacion')}
               className={`
                  flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg 
                  text-[11px] font-semibold uppercase tracking-wide transition-all duration-200
                  ${activeTab === 'planificacion'
                     ? 'bg-slate-700/80 text-white shadow-sm'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
                  }
               `}
            >
               <Calendar size={14} />
               Planificación
               {contadores.planificacion > 0 && (
                  <span className={`
                     ml-1 px-1.5 py-0.5 text-[9px] font-bold rounded
                     ${activeTab === 'planificacion' ? 'bg-amber-500 text-white' : 'bg-slate-600 text-slate-300'}
                  `}>
                     {contadores.planificacion}
                  </span>
               )}
            </button>
         </div>

         {/* Lista de alertas - Feed CEO */}
         <div className="space-y-2 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
            {isLoading && alertasFiltradas.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <RefreshCw size={24} className="animate-spin mb-3 text-slate-600" />
                  <p className="text-sm font-medium">Cargando alertas...</p>
               </div>
            ) : alertasFiltradas.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                  <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                     <CheckCircle2 size={32} className="text-emerald-500/50" />
                  </div>
                  <p className="text-sm font-medium text-slate-400">Sin alertas pendientes</p>
                  <p className="text-xs text-slate-500 mt-1">Todo bajo control</p>
               </div>
            ) : (
               alertasFiltradas.map((alerta, idx) => {
                  const config = ALERTA_CONFIG[alerta.tipo];
                  if (!config) return null;

                  return (
                     <div
                        key={`${alerta.agencia_id}-${alerta.objetivo_id}-${idx}`}
                        className={`
                           group relative flex items-center gap-4 p-4 rounded-xl 
                           border transition-all duration-200
                           ${config.colors.bg} ${config.colors.border}
                           hover:shadow-lg hover:scale-[1.01]
                        `}
                     >
                        {/* Indicador de prioridad (línea lateral) */}
                        <div className={`
                           absolute left-0 top-3 bottom-3 w-1 rounded-r-full
                           ${config.priorityLevel === 'critical' ? 'bg-rose-500' : 
                             config.priorityLevel === 'high' ? 'bg-orange-500' :
                             config.priorityLevel === 'medium' ? 'bg-yellow-500' : 'bg-slate-500'}
                        `} />

                        {/* Icono */}
                        <div className={`
                           flex-shrink-0 p-2.5 rounded-xl transition-transform
                           ${config.colors.iconBg} ${config.colors.text}
                           group-hover:scale-110
                        `}>
                           {config.icon}
                        </div>

                        {/* Contenido */}
                        <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-white truncate">
                                 {alerta.agencia_nombre}
                              </h4>
                              <span className={`
                                 px-2 py-0.5 text-[9px] font-bold uppercase rounded
                                 ${config.colors.text} bg-slate-800/60
                              `}>
                                 {config.priorityLabel}
                              </span>
                           </div>
                           <p className="text-[11px] text-slate-400 truncate leading-relaxed">
                              {alerta.mensaje}
                           </p>
                        </div>

                        {/* Botón de acción */}
                        <button
                           onClick={() => handleAccion(alerta)}
                           className={`
                              flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg
                              text-[10px] font-bold uppercase tracking-wide
                              border transition-all duration-200
                              ${config.colors.action} ${config.colors.actionHover}
                              group-hover:scale-105
                           `}
                        >
                           {config.actionLabel}
                           {config.actionIcon}
                        </button>
                     </div>
                  );
               })
            )}
         </div>
      </div>
   );
};

// ============================================================================
// CALENDARIO DE AGENCIAS - Creación en fechas válidas (hoy/futuro)
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

// Comparar fechas sin hora
const isSameDayOrAfter = (date: Date, reference: Date): boolean => {
   const dateStr = formatDateISO(date);
   const refStr = formatDateISO(reference);
   return dateStr >= refStr;
};

const isBeforeDay = (date: Date, reference: Date): boolean => {
   const dateStr = formatDateISO(date);
   const refStr = formatDateISO(reference);
   return dateStr < refStr;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
   return formatDateISO(date1) === formatDateISO(date2);
};

interface CalendarioAgenciasSectionProps {
   agencias?: Agencia[];
   loading?: boolean;
   onCrearAgenciaClick?: (fecha: Date) => void;
   onRefresh?: () => void;
}

const CalendarioAgenciasSection: React.FC<CalendarioAgenciasSectionProps> = ({
   agencias = [],
   loading = false,
   onCrearAgenciaClick,
   onRefresh
}) => {
   const calendarRef = useRef<FullCalendar>(null);
   const hoy = useMemo(() => getHoyEcuador(), []);
   
   // Referencia para el callback de crear agencia (evita stale closures)
   const onCrearAgenciaClickRef = useRef(onCrearAgenciaClick);
   useEffect(() => {
      onCrearAgenciaClickRef.current = onCrearAgenciaClick;
   }, [onCrearAgenciaClick]);
   
   // Agrupar agencias por fecha de registro para mostrar eventos
   const eventosAgencias = useMemo(() => {
      if (!agencias || agencias.length === 0) return [];
      
      // Agrupar por fecha de registro
      const agenciasPorFecha: Record<string, Agencia[]> = {};
      
      agencias.forEach(agencia => {
         if (agencia.fecha_registro) {
            const fecha = agencia.fecha_registro.split('T')[0]; // YYYY-MM-DD
            if (!agenciasPorFecha[fecha]) {
               agenciasPorFecha[fecha] = [];
            }
            agenciasPorFecha[fecha].push(agencia);
         }
      });
      
      // Convertir a eventos de FullCalendar
      return Object.entries(agenciasPorFecha).map(([fecha, agenciasEnFecha]) => ({
         id: `agencias-${fecha}`,
         start: fecha,
         allDay: true,
         extendedProps: {
            agencias: agenciasEnFecha,
            count: agenciasEnFecha.length
         }
      }));
   }, [agencias]);

   // Hook para inyectar contenido personalizado en las celdas (método imperativo)
   const dayCellDidMount = useCallback((arg: any) => {
      const cellDate = arg.date;
      const esFechaPasada = isBeforeDay(cellDate, hoy);
      const esHoy = isSameDay(cellDate, hoy);
      const cellEl = arg.el as HTMLElement;
      
      // Limpiar contenido previo de nuestro wrapper
      const existingWrapper = cellEl.querySelector('.agencia-cell-wrapper');
      if (existingWrapper) existingWrapper.remove();
      
      // Crear wrapper para nuestro contenido personalizado
      const wrapper = document.createElement('div');
      wrapper.className = `agencia-cell-wrapper absolute inset-0 flex flex-col pointer-events-none z-10`;
      
      // --- Número del día (esquina superior derecha) ---
      const dayNumber = document.createElement('div');
      dayNumber.className = `agencia-day-number text-right p-1.5 font-bold text-sm pointer-events-none`;
      
      // Badge "Hoy" + número
      if (esHoy) {
         dayNumber.innerHTML = `
            <span class="mr-1 px-1.5 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded uppercase">
               Hoy
            </span>
            <span class="text-emerald-400">${cellDate.getDate()}</span>
         `;
      } else if (esFechaPasada) {
         dayNumber.innerHTML = `<span class="text-slate-600">${cellDate.getDate()}</span>`;
      } else {
         dayNumber.innerHTML = `<span class="text-slate-300">${cellDate.getDate()}</span>`;
      }
      
      wrapper.appendChild(dayNumber);
      
      // --- Área de acción (centro-inferior) ---
      const actionArea = document.createElement('div');
      actionArea.className = 'flex-1 flex items-center justify-center px-1 pb-2 pointer-events-auto';
      
      if (!esFechaPasada) {
         // Botón de crear agencia - Diseño minimalista
         const btn = document.createElement('button');
         btn.className = `
            btn-crear-agencia group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg
            text-[10px] font-semibold uppercase tracking-wide transition-all duration-200
            ${esHoy 
               ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-500/60 shadow-sm shadow-emerald-500/10' 
               : 'bg-slate-800/60 text-slate-400 border border-slate-700/60 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/40'
            }
         `.trim().replace(/\s+/g, ' ');
         btn.title = `Crear agencia para ${formatDateISO(cellDate)}`;
         btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-hover:scale-110"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span class="hidden sm:inline">Crear</span>
         `;
         
         // Event listener con validación de fecha Ecuador
         btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            // Doble validación: comparar con "hoy Ecuador" al momento del click
            const hoyAlClick = getHoyEcuador();
            if (isSameDayOrAfter(cellDate, hoyAlClick)) {
               onCrearAgenciaClickRef.current?.(cellDate);
            } else {
               console.warn('[CalendarioAgencias] Intento de crear en fecha pasada bloqueado:', formatDateISO(cellDate));
            }
         });
         
         actionArea.appendChild(btn);
      }
      // Días pasados: NO mostrar nada en el área de acción (diseño limpio)
      
      wrapper.appendChild(actionArea);
      
      // Insertar wrapper en la celda
      cellEl.style.position = 'relative';
      cellEl.appendChild(wrapper);
      
      // Aplicar clases CSS profesionales según estado
      if (esFechaPasada) {
         cellEl.classList.add('fc-day-disabled-pro');
      } else {
         cellEl.classList.add('fc-day-active-pro');
      }
      if (esHoy) {
         cellEl.classList.add('fc-day-today-agencias');
      }
   }, [hoy]);

   // Renderizado de eventos (agencias creadas) - Se mantiene igual
   const eventContent = useCallback((arg: any) => {
      const { agencias: eventAgencias, count } = arg.event.extendedProps;
      
      return (
         <div className="calendario-agencias-evento group px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all cursor-pointer relative">
            <div className="flex items-center gap-1.5">
               <Store size={12} className="text-emerald-400" />
               <span className="text-[10px] font-bold text-emerald-400">
                  {count} agencia{count !== 1 ? 's' : ''}
               </span>
            </div>
            {/* Tooltip con nombres */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[150px]">
               <p className="text-[9px] font-semibold text-slate-400 uppercase mb-1">Agencias creadas:</p>
               <ul className="space-y-0.5">
                  {eventAgencias.slice(0, 5).map((ag: Agencia) => (
                     <li key={ag.id_agencia} className="text-[10px] text-slate-200 truncate">
                        • {ag.nombre}
                     </li>
                  ))}
                  {eventAgencias.length > 5 && (
                     <li className="text-[10px] text-slate-400">
                        +{eventAgencias.length - 5} más...
                     </li>
                  )}
               </ul>
            </div>
         </div>
      );
   }, []);

   // Disparar resize cuando se monta o actualiza
   useEffect(() => {
      const timer = setTimeout(() => {
         window.dispatchEvent(new Event('resize'));
         calendarRef.current?.getApi().updateSize();
      }, 100);
      return () => clearTimeout(timer);
   }, []);

   return (
      <div className="calendario-agencias-container space-y-4">
         {/* Header informativo */}
         <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
            <div className="flex items-center gap-4">
               {/* Estadísticas */}
               <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/8 border border-emerald-500/20 rounded-lg">
                  <Store size={14} className="text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">
                     {agencias.length} agencia{agencias.length !== 1 ? 's' : ''} total
                  </span>
               </div>
               
               {/* Leyenda */}
               <div className="hidden sm:flex items-center gap-4 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                     <div className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                     <span>Hoy/Futuro (disponible)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                     <div className="w-3 h-3 rounded bg-slate-800/60 border border-slate-700/40" />
                     <span>Pasado (bloqueado)</span>
                  </div>
               </div>
            </div>
            
            {/* Actualizar */}
            <button 
               onClick={onRefresh}
               disabled={loading}
               className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-700/40 rounded-lg transition-all"
            >
               <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
               Actualizar
            </button>
         </div>

         {/* Calendario FullCalendar */}
         <div className="calendario-agencias-wrapper">
            {loading ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                  <RefreshCw size={32} className="animate-spin mb-4 text-emerald-400/40" />
                  <p className="text-sm font-medium text-slate-400">Cargando calendario...</p>
               </div>
            ) : (
               <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin]}
                  initialView="dayGridMonth"
                  locale="es"
                  headerToolbar={{
                     left: 'prev,next today',
                     center: 'title',
                     right: ''
                  }}
                  buttonText={{
                     today: 'Hoy'
                  }}
                  height="auto"
                  contentHeight={520}
                  fixedWeekCount={false}
                  showNonCurrentDates={true}
                  // Usar dayCellDidMount para inyectar contenido de forma imperativa
                  dayCellDidMount={dayCellDidMount}
                  events={eventosAgencias}
                  eventContent={eventContent}
                  eventDisplay="block"
                  dayMaxEvents={2}
                  moreLinkText={(num) => `+${num} más`}
                  // Prevención de errores: no permitir selección de fechas pasadas
                  selectAllow={(selectInfo) => {
                     return isSameDayOrAfter(selectInfo.start, hoy);
                  }}
               />
            )}
         </div>

         {/* Nota informativa */}
         <div className="flex items-start gap-2 p-3 bg-slate-800/30 border border-slate-700/40 rounded-xl text-[11px] text-slate-400">
            <AlertCircle size={14} className="flex-shrink-0 mt-0.5 text-slate-500" />
            <div>
               <p className="font-medium text-slate-300 mb-0.5">Creación de Agencias</p>
               <p>Solo puedes crear agencias en el día actual o fechas futuras. Las fechas pasadas están bloqueadas para mantener la integridad de los registros.</p>
            </div>
         </div>
      </div>
   );
};

// ============================================================================
// COMPONENTE PRINCIPAL - Dashboard Enterprise
// ============================================================================

export const CentroGestion: React.FC<CentroGestionProps> = ({
   eventosCalendario,
   loadingEventos,
   objetivosPendientes,
   filtroAgenciaInicial,
   agencias,
   loadingAgencias,
   onCrearPerfilClick,
   onRefresh,
   onPlanificarClick,
   onCrearAgenciaClick,
   onRefreshAgencias
}) => {
   // Estado de sección expandida (UNA a la vez para evitar sobrecarga visual)
   // Heurística de Nielsen: Diseño estético y minimalista
   const [expandedSection, setExpandedSection] = useState<SectionId | null>('alertas');
   
   // Estado para permitir múltiples expandidos (modo avanzado)
   const [allowMultiple, setAllowMultiple] = useState(false);
   const [expandedSections, setExpandedSections] = useState<Set<SectionId>>(
      new Set(['alertas'])
   );

   // Alternar expansión de una sección
   const toggleSection = useCallback((sectionId: SectionId) => {
      if (allowMultiple) {
         // Modo múltiple: toggle normal
         setExpandedSections(prev => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
               next.delete(sectionId);
            } else {
               next.add(sectionId);
            }
            return next;
         });
      } else {
         // Modo único: solo una sección a la vez (por defecto)
         setExpandedSection(prev => prev === sectionId ? null : sectionId);
      }
   }, [allowMultiple]);

   // Verificar si una sección está expandida
   const isExpanded = useCallback((sectionId: SectionId) => {
      if (allowMultiple) {
         return expandedSections.has(sectionId);
      }
      return expandedSection === sectionId;
   }, [allowMultiple, expandedSection, expandedSections]);

   // Contar alertas totales para badge
   const [alertasCount, setAlertasCount] = useState(0);
   const [hasUrgent, setHasUrgent] = useState(false);
   
   useEffect(() => {
      const fetchCount = async () => {
         try {
            const alertas = await objetivosService.getAlertas();
            setAlertasCount(alertas.length);
            // Verificar si hay alertas urgentes (VENCIDO)
            const urgent = alertas.some(a => a.tipo === 'VENCIDO');
            setHasUrgent(urgent);
         } catch {
            setAlertasCount(0);
            setHasUrgent(false);
         }
      };
      fetchCount();
      const interval = setInterval(fetchCount, 60000);
      return () => clearInterval(interval);
   }, []);

   // Expandir todo / Colapsar todo
   const expandAll = () => {
      setAllowMultiple(true);
      setExpandedSections(new Set(['alertas', 'calendario_objetivos', 'calendario_agencias']));
   };

   const collapseAll = () => {
      setAllowMultiple(false);
      setExpandedSection(null);
      setExpandedSections(new Set());
   };

   return (
      <div className="centro-gestion-container space-y-6">
         {/* Header del Centro de Gestión - Diseño Enterprise */}
         <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
            <div className="flex items-center gap-4">
               {/* Logo / Icono principal */}
               <div className="relative p-3 rounded-2xl bg-gradient-to-br from-indigo-500/15 to-indigo-600/10 border border-indigo-500/20">
                  <Activity size={24} className="text-indigo-400" />
                  {hasUrgent && (
                     <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
                  )}
               </div>
               
               <div>
                  <h2 className="text-xl font-bold text-white tracking-tight">
                     Planificador de Red Operativa
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                     Panel de control para gestión de alertas, objetivos y agencias
                  </p>
               </div>
            </div>
            
            {/* Controles de vista */}
            <div className="flex items-center gap-3">
               {/* Indicador de modo */}
               <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/40 border border-slate-700/50">
                  <span className="text-[10px] font-medium text-slate-500 uppercase">Vista:</span>
                  <span className="text-[10px] font-semibold text-slate-300">
                     {allowMultiple ? 'Multi-panel' : 'Enfocada'}
                  </span>
               </div>

               {/* Botones de acción */}
               <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-800/30 border border-slate-700/40">
                  <button
                     onClick={expandAll}
                     title="Expandir todas las secciones"
                     className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold uppercase
                        transition-all duration-200
                        ${allowMultiple && expandedSections.size === 3
                           ? 'bg-slate-700/60 text-white'
                           : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                        }
                     `}
                  >
                     <Maximize2 size={14} />
                     <span className="hidden sm:inline">Expandir</span>
                  </button>
                  <button
                     onClick={collapseAll}
                     title="Colapsar todas las secciones"
                     className={`
                        flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-semibold uppercase
                        transition-all duration-200
                        ${!expandedSection && expandedSections.size === 0
                           ? 'bg-slate-700/60 text-white'
                           : 'text-slate-400 hover:text-white hover:bg-slate-700/40'
                        }
                     `}
                  >
                     <Minimize2 size={14} />
                     <span className="hidden sm:inline">Colapsar</span>
                  </button>
               </div>
            </div>
         </div>

         {/* Secciones (Acordeones) - Rejilla de 8px */}
         <div className="space-y-4">
            {/* Sección 1: Alertas */}
            <AccordionSection
               section={SECTIONS[0]}
               isExpanded={isExpanded('alertas')}
               onToggle={() => toggleSection('alertas')}
               badge={alertasCount}
               badgeUrgent={hasUrgent}
               isOnly={!allowMultiple && expandedSection === 'alertas'}
            >
               <AlertasSection
                  onPlanificarClick={(agenciaId, objetivoId) => {
                     // Al planificar, expandir el calendario de objetivos
                     if (!allowMultiple) {
                        setExpandedSection('calendario_objetivos');
                     } else {
                        setExpandedSections(prev => new Set([...prev, 'calendario_objetivos']));
                     }
                     onPlanificarClick?.(agenciaId, objetivoId);
                  }}
                  onCrearPerfilClick={onCrearPerfilClick}
               />
            </AccordionSection>

            {/* Sección 2: Calendario de Objetivos */}
            <AccordionSection
               section={SECTIONS[1]}
               isExpanded={isExpanded('calendario_objetivos')}
               onToggle={() => toggleSection('calendario_objetivos')}
               isLoading={loadingEventos}
               onRefresh={onRefresh}
               isOnly={!allowMultiple && expandedSection === 'calendario_objetivos'}
            >
               <div className="min-h-[520px]">
                  <CalendarioObjetivos
                     eventos={eventosCalendario}
                     loading={loadingEventos}
                     objetivosPendientes={objetivosPendientes}
                     filtroAgenciaInicial={filtroAgenciaInicial}
                     onCrearPerfilClick={onCrearPerfilClick}
                     onRefresh={onRefresh}
                  />
               </div>
            </AccordionSection>

            {/* Sección 3: Calendario de Agencias */}
            <AccordionSection
               section={SECTIONS[2]}
               isExpanded={isExpanded('calendario_agencias')}
               onToggle={() => toggleSection('calendario_agencias')}
               isLoading={loadingAgencias}
               onRefresh={onRefreshAgencias}
               badge={agencias?.length}
               isOnly={!allowMultiple && expandedSection === 'calendario_agencias'}
            >
               <div className="min-h-[520px]">
                  <CalendarioAgenciasSection
                     agencias={agencias}
                     loading={loadingAgencias}
                     onCrearAgenciaClick={onCrearAgenciaClick}
                     onRefresh={onRefreshAgencias}
                  />
               </div>
            </AccordionSection>
         </div>

         {/* Footer informativo */}
         <div className="flex items-center justify-between pt-4 border-t border-slate-800/40 text-[10px] text-slate-500">
            <span>
               Última actualización: {new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
            </span>
            <span className="flex items-center gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
               Sistema operativo
            </span>
         </div>
      </div>
   );
};

export default CentroGestion;
