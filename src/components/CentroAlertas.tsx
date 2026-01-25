/**
 * CentroAlertas Component
 * Panel de notificaciones para alertas de planificación
 * DOS TABS: Planificación y Crear Perfiles
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
   Bell, X, AlertTriangle, Calendar, Clock, 
   ChevronRight, RefreshCw, CheckCircle2, ClipboardList, UserPlus
} from 'lucide-react';
import { objetivosService } from '../services/objetivos.service';
import type { AlertaPlanificacion } from '../types';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const POLLING_INTERVAL = 60000; // 60 segundos

// Tipos de alerta por categoría
const TIPOS_PLANIFICACION = ['SIN_PLANIFICAR', 'MAÑANA'] as const;
const TIPOS_CREAR_PERFILES = ['VENCIDO', 'HOY', 'FALTAN_1_DIA', 'FALTAN_2_DIAS', 'FALTAN_3_DIAS'] as const;

type TabType = 'planificacion' | 'crear_perfiles';

const ALERTA_CONFIG: Record<string, { 
   icon: React.ReactNode; 
   color: string; 
   bgColor: string;
   borderColor: string;
   priority: number;
   tab: TabType;
}> = {
   // === TAB CREAR PERFILES ===
   'VENCIDO': {
      icon: <AlertTriangle size={18} />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      priority: 0,
      tab: 'crear_perfiles'
   },
   'HOY': {
      icon: <Clock size={18} />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      priority: 1,
      tab: 'crear_perfiles'
   },
   'FALTAN_1_DIA': {
      icon: <AlertTriangle size={18} />,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/30',
      priority: 2,
      tab: 'crear_perfiles'
   },
   'FALTAN_2_DIAS': {
      icon: <Clock size={18} />,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/30',
      priority: 3,
      tab: 'crear_perfiles'
   },
   'FALTAN_3_DIAS': {
      icon: <Calendar size={18} />,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/30',
      priority: 4,
      tab: 'crear_perfiles'
   },
   // === TAB PLANIFICACIÓN ===
   'SIN_PLANIFICAR': {
      icon: <AlertTriangle size={18} />,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      priority: 0,
      tab: 'planificacion'
   },
   'MAÑANA': {
      icon: <Calendar size={18} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      priority: 1,
      tab: 'planificacion'
   }
};

// ============================================================================
// INTERFACES
// ============================================================================

interface CentroAlertasProps {
   onPlanificarClick?: (agenciaId: number, objetivoId: number) => void;
   onCrearPerfilClick?: (agenciaId: number, objetivoId: number) => void;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CentroAlertas: React.FC<CentroAlertasProps> = ({ 
   onPlanificarClick,
   onCrearPerfilClick 
}) => {
   const [isOpen, setIsOpen] = useState(false);
   const [alertas, setAlertas] = useState<AlertaPlanificacion[]>([]);
   const [isLoading, setIsLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);
   const [activeTab, setActiveTab] = useState<TabType>('crear_perfiles');

   // Fetch alertas
   const fetchAlertas = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
         const data = await objetivosService.getAlertas();
         setAlertas(data);
      } catch (err) {
         console.error('Error fetching alertas:', err);
         setError('Error al cargar alertas');
         setAlertas([]);
      } finally {
         setIsLoading(false);
      }
   }, []);

   // Initial fetch + polling
   useEffect(() => {
      fetchAlertas();
      const interval = setInterval(fetchAlertas, POLLING_INTERVAL);
      return () => clearInterval(interval);
   }, [fetchAlertas]);

   // Filtrar y ordenar alertas por tab activo
   const alertasFiltradas = useMemo(() => {
      const tiposTab = activeTab === 'planificacion' ? TIPOS_PLANIFICACION : TIPOS_CREAR_PERFILES;
      return alertas
         .filter(a => (tiposTab as readonly string[]).includes(a.tipo))
         .sort((a, b) => {
            const prioA = ALERTA_CONFIG[a.tipo]?.priority ?? 99;
            const prioB = ALERTA_CONFIG[b.tipo]?.priority ?? 99;
            return prioA - prioB;
         });
   }, [alertas, activeTab]);

   // Contadores por tab
   const contadoresPorTab = useMemo(() => {
      const planificacion = alertas.filter(a => 
         (TIPOS_PLANIFICACION as readonly string[]).includes(a.tipo)
      ).length;
      const crearPerfiles = alertas.filter(a => 
         (TIPOS_CREAR_PERFILES as readonly string[]).includes(a.tipo)
      ).length;
      return { planificacion, crearPerfiles };
   }, [alertas]);

   // Contadores por tipo (para footer)
   const contadores = alertas.reduce((acc, a) => {
      acc[a.tipo] = (acc[a.tipo] || 0) + 1;
      return acc;
   }, {} as Record<string, number>);

   const totalAlertas = alertas.length;
   // Alertas urgentes: vencidas, sin planificar, o a 1 día de vencer
   const tieneUrgentes = contadores['VENCIDO'] > 0 || contadores['SIN_PLANIFICAR'] > 0 || contadores['FALTAN_1_DIA'] > 0;

   // Handler para CTA - ejecuta acción según tipo
   const handleAccion = (alerta: AlertaPlanificacion) => {
      const config = ALERTA_CONFIG[alerta.tipo];
      if (!config) return;

      if (config.tab === 'planificacion') {
         // Alertas de planificación -> Ir al calendario filtrado por agencia
         onPlanificarClick?.(alerta.agencia_id, alerta.objetivo_id);
      } else {
         // Alertas de crear perfiles -> Abrir modal de crear perfil
         onCrearPerfilClick?.(alerta.agencia_id, alerta.objetivo_id);
      }
      setIsOpen(false);
   };

   return (
      <div className="relative">
         {/* Botón de campana */}
         <button
            onClick={() => setIsOpen(!isOpen)}
            className={`relative p-2.5 rounded-xl transition-all ${
               isOpen 
                  ? 'bg-white/10 text-white' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-white'
            }`}
         >
            <Bell size={22} />
            
            {/* Badge contador */}
            {totalAlertas > 0 && (
               <span className={`absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center text-[10px] font-black rounded-full px-1.5 ${
                  tieneUrgentes 
                     ? 'bg-rose-500 text-white animate-pulse' 
                     : 'bg-amber-500 text-black'
               }`}>
                  {totalAlertas > 99 ? '99+' : totalAlertas}
               </span>
            )}
         </button>

         {/* Panel de alertas */}
         {isOpen && (
            <>
               {/* Backdrop */}
               <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsOpen(false)} 
               />
               
               {/* Panel */}
               <div className="absolute right-0 top-full mt-2 w-[420px] bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-white/10 bg-[#0a0a0a] flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <Bell size={18} className="text-blue-400" />
                        <h3 className="text-sm font-black text-white uppercase tracking-wide">
                           Centro de Alertas
                        </h3>
                        {totalAlertas > 0 && (
                           <span className="px-2 py-0.5 text-[10px] font-black bg-white/10 rounded-full text-slate-300">
                              {totalAlertas}
                           </span>
                        )}
                     </div>
                     <div className="flex items-center gap-1">
                        <button
                           onClick={fetchAlertas}
                           disabled={isLoading}
                           className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all disabled:opacity-50"
                        >
                           <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                        <button
                           onClick={() => setIsOpen(false)}
                           className="p-1.5 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all"
                        >
                           <X size={14} />
                        </button>
                     </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-white/10 bg-[#0a0a0a]">
                     <button
                        onClick={() => setActiveTab('crear_perfiles')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide transition-all border-b-2 ${
                           activeTab === 'crear_perfiles'
                              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                              : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <UserPlus size={14} />
                        <span>Crear Perfiles</span>
                        {contadoresPorTab.crearPerfiles > 0 && (
                           <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                              activeTab === 'crear_perfiles' 
                                 ? 'bg-amber-500/20 text-amber-400' 
                                 : 'bg-white/10 text-slate-400'
                           }`}>
                              {contadoresPorTab.crearPerfiles}
                           </span>
                        )}
                     </button>
                     <button
                        onClick={() => setActiveTab('planificacion')}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-[11px] font-black uppercase tracking-wide transition-all border-b-2 ${
                           activeTab === 'planificacion'
                              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                              : 'border-transparent text-slate-500 hover:text-white hover:bg-white/5'
                        }`}
                     >
                        <ClipboardList size={14} />
                        <span>Planificación</span>
                        {contadoresPorTab.planificacion > 0 && (
                           <span className={`px-1.5 py-0.5 text-[9px] font-black rounded-full ${
                              activeTab === 'planificacion' 
                                 ? 'bg-blue-500/20 text-blue-400' 
                                 : 'bg-white/10 text-slate-400'
                           }`}>
                              {contadoresPorTab.planificacion}
                           </span>
                        )}
                     </button>
                  </div>

                  {/* Content */}
                  <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                     {error ? (
                        <div className="p-6 text-center">
                           <AlertTriangle size={32} className="text-rose-400 mx-auto mb-2" />
                           <p className="text-sm text-rose-400 font-bold">{error}</p>
                        </div>
                     ) : alertasFiltradas.length === 0 ? (
                        <div className="p-8 text-center">
                           <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                           <p className="text-sm text-white font-bold">¡Todo al día!</p>
                           <p className="text-xs text-slate-500 mt-1">
                              {activeTab === 'planificacion' 
                                 ? 'No hay objetivos pendientes de planificar'
                                 : 'No hay perfiles pendientes de crear'
                              }
                           </p>
                        </div>
                     ) : (
                        <div className="p-2 space-y-2">
                           {alertasFiltradas.map((alerta, index) => {
                              const config = ALERTA_CONFIG[alerta.tipo] || ALERTA_CONFIG['HOY'];
                              
                              return (
                                 <div
                                    key={`${alerta.tipo}-${alerta.objetivo_id}-${index}`}
                                    className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor} transition-all hover:scale-[1.01] cursor-pointer`}
                                    onClick={() => handleAccion(alerta)}
                                 >
                                    <div className="flex items-start gap-3">
                                       <div className={`p-2 rounded-lg bg-black/20 ${config.color}`}>
                                          {config.icon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between gap-2 mb-1">
                                             <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                                                {alerta.tipo.replace(/_/g, ' ')}
                                             </span>
                                             {/* Badge indicador de acción */}
                                             <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${config.bgColor} ${config.color}`}>
                                                {config.tab === 'planificacion' ? '📅 Ir al calendario' : '👤 Crear perfil'}
                                             </span>
                                          </div>
                                          <p className="text-sm text-white font-bold leading-tight">
                                             {alerta.mensaje}
                                          </p>
                                          
                                          {/* Info adicional según tipo */}
                                          {alerta.tipo === 'HOY' && alerta.pendientes !== undefined && (
                                             <p className="text-xs text-slate-400 mt-1">
                                                Pendientes: <span className="text-amber-400 font-bold">{alerta.pendientes}</span> de {alerta.cantidad}
                                             </p>
                                          )}
                                          {alerta.tipo === 'SIN_PLANIFICAR' && alerta.faltantes_por_planificar && (
                                             <p className="text-xs text-slate-400 mt-1">
                                                Faltan planificar: <span className="text-rose-400 font-bold">{alerta.faltantes_por_planificar}</span> perfiles
                                             </p>
                                          )}
                                          {/* Info para MAÑANA */}
                                          {alerta.tipo === 'MAÑANA' && alerta.cantidad !== undefined && (
                                             <p className="text-xs text-slate-400 mt-1">
                                                Perfiles a crear mañana: <span className="text-blue-400 font-bold">{alerta.cantidad}</span>
                                             </p>
                                          )}
                                          {/* Info para alertas preventivas (FALTAN_X_DIAS) */}
                                          {(alerta.tipo === 'FALTAN_3_DIAS' || alerta.tipo === 'FALTAN_2_DIAS' || alerta.tipo === 'FALTAN_1_DIA') && (
                                             <p className="text-xs text-slate-400 mt-1">
                                                Fecha límite: <span className="text-white font-bold">{alerta.fecha_limite}</span> • 
                                                Restantes: <span className={`font-bold ${alerta.tipo === 'FALTAN_1_DIA' ? 'text-orange-400' : alerta.tipo === 'FALTAN_2_DIAS' ? 'text-yellow-400' : 'text-cyan-400'}`}>{alerta.perfiles_restantes}</span> perfiles
                                             </p>
                                          )}
                                          {/* Info para VENCIDO */}
                                          {alerta.tipo === 'VENCIDO' && alerta.perfiles_restantes && (
                                             <p className="text-xs text-slate-400 mt-1">
                                                Venció hace: <span className="text-red-400 font-bold">{alerta.dias_vencido}</span> días • 
                                                Sin completar: <span className="text-red-400 font-bold">{alerta.perfiles_restantes}</span> perfiles
                                             </p>
                                          )}
                                          
                                          {/* CTA Button - Ahora para todos los tipos */}
                                          <div
                                             className={`mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${config.bgColor} ${config.color} hover:opacity-80`}
                                          >
                                             {config.tab === 'planificacion' 
                                                ? <>Ir al calendario <ChevronRight size={14} /></>
                                                : <>Crear perfil <ChevronRight size={14} /></>
                                             }
                                          </div>
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>

                  {/* Footer con resumen del tab activo */}
                  {alertasFiltradas.length > 0 && (
                     <div className="px-4 py-2 border-t border-white/10 bg-[#0a0a0a] flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
                        {activeTab === 'crear_perfiles' ? (
                           <>
                              {contadores['VENCIDO'] > 0 && (
                                 <span className="text-red-400">⚠ {contadores['VENCIDO']} vencidas</span>
                              )}
                              {contadores['HOY'] > 0 && (
                                 <span className="text-amber-400">🕐 {contadores['HOY']} hoy</span>
                              )}
                              {contadores['FALTAN_1_DIA'] > 0 && (
                                 <span className="text-orange-400">⏰ {contadores['FALTAN_1_DIA']} en 1d</span>
                              )}
                              {contadores['FALTAN_2_DIAS'] > 0 && (
                                 <span className="text-yellow-400">📆 {contadores['FALTAN_2_DIAS']} en 2d</span>
                              )}
                              {contadores['FALTAN_3_DIAS'] > 0 && (
                                 <span className="text-cyan-400">📅 {contadores['FALTAN_3_DIAS']} en 3d</span>
                              )}
                           </>
                        ) : (
                           <>
                              {contadores['SIN_PLANIFICAR'] > 0 && (
                                 <span className="text-rose-400">📋 {contadores['SIN_PLANIFICAR']} sin planificar</span>
                              )}
                              {contadores['MAÑANA'] > 0 && (
                                 <span className="text-blue-400">📅 {contadores['MAÑANA']} mañana</span>
                              )}
                           </>
                        )}
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
};

export default CentroAlertas;
