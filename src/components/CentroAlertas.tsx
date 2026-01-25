/**
 * CentroAlertas Component
 * Panel de notificaciones para alertas de planificación
 * Muestra alertas: SIN_PLANIFICAR, HOY, MAÑANA, VENCIDO
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
   Bell, X, AlertTriangle, Calendar, Clock, 
   ChevronRight, RefreshCw, CheckCircle2
} from 'lucide-react';
import { objetivosService } from '../services/objetivos.service';
import type { AlertaPlanificacion } from '../types';

// ============================================================================
// CONFIGURACIÓN
// ============================================================================

const POLLING_INTERVAL = 60000; // 60 segundos

const ALERTA_CONFIG: Record<string, { 
   icon: React.ReactNode; 
   color: string; 
   bgColor: string;
   borderColor: string;
   priority: number;
}> = {
   'SIN_PLANIFICAR': {
      icon: <AlertTriangle size={18} />,
      color: 'text-rose-400',
      bgColor: 'bg-rose-500/10',
      borderColor: 'border-rose-500/30',
      priority: 1
   },
   'HOY': {
      icon: <Clock size={18} />,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      priority: 2
   },
   'MAÑANA': {
      icon: <Calendar size={18} />,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      priority: 3
   },
   'VENCIDO': {
      icon: <AlertTriangle size={18} />,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/30',
      priority: 0
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

   // Fetch alertas
   const fetchAlertas = useCallback(async () => {
      setIsLoading(true);
      setError(null);
      try {
         const data = await objetivosService.getAlertas();
         // Ordenar por prioridad
         const sorted = [...data].sort((a, b) => {
            const prioA = ALERTA_CONFIG[a.tipo]?.priority ?? 99;
            const prioB = ALERTA_CONFIG[b.tipo]?.priority ?? 99;
            return prioA - prioB;
         });
         setAlertas(sorted);
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

   // Contadores por tipo
   const contadores = alertas.reduce((acc, a) => {
      acc[a.tipo] = (acc[a.tipo] || 0) + 1;
      return acc;
   }, {} as Record<string, number>);

   const totalAlertas = alertas.length;
   const tieneUrgentes = contadores['VENCIDO'] > 0 || contadores['SIN_PLANIFICAR'] > 0;

   // Handler para CTA
   const handleAccion = (alerta: AlertaPlanificacion) => {
      if (alerta.tipo === 'SIN_PLANIFICAR') {
         onPlanificarClick?.(alerta.agencia_id, alerta.objetivo_id);
      } else if (alerta.tipo === 'HOY') {
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
               <div className="absolute right-0 top-full mt-2 w-96 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
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

                  {/* Content */}
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                     {error ? (
                        <div className="p-6 text-center">
                           <AlertTriangle size={32} className="text-rose-400 mx-auto mb-2" />
                           <p className="text-sm text-rose-400 font-bold">{error}</p>
                        </div>
                     ) : alertas.length === 0 ? (
                        <div className="p-8 text-center">
                           <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
                           <p className="text-sm text-white font-bold">¡Todo al día!</p>
                           <p className="text-xs text-slate-500 mt-1">No hay alertas pendientes</p>
                        </div>
                     ) : (
                        <div className="p-2 space-y-2">
                           {alertas.map((alerta, index) => {
                              const config = ALERTA_CONFIG[alerta.tipo] || ALERTA_CONFIG['HOY'];
                              
                              return (
                                 <div
                                    key={`${alerta.tipo}-${alerta.objetivo_id}-${index}`}
                                    className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor} transition-all hover:scale-[1.01]`}
                                 >
                                    <div className="flex items-start gap-3">
                                       <div className={`p-2 rounded-lg bg-black/20 ${config.color}`}>
                                          {config.icon}
                                       </div>
                                       <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                             <span className={`text-[10px] font-black uppercase tracking-wider ${config.color}`}>
                                                {alerta.tipo.replace('_', ' ')}
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
                                          
                                          {/* CTA Button */}
                                          {(alerta.tipo === 'SIN_PLANIFICAR' || alerta.tipo === 'HOY') && (
                                             <button
                                                onClick={() => handleAccion(alerta)}
                                                className={`mt-2 flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                   alerta.tipo === 'SIN_PLANIFICAR'
                                                      ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                                                      : 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                }`}
                                             >
                                                {alerta.tipo === 'SIN_PLANIFICAR' ? 'Planificar ahora' : 'Crear perfil'}
                                                <ChevronRight size={14} />
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     )}
                  </div>

                  {/* Footer con resumen */}
                  {alertas.length > 0 && (
                     <div className="px-4 py-2 border-t border-white/10 bg-[#0a0a0a] flex gap-3 text-[10px] font-bold text-slate-500">
                        {contadores['VENCIDO'] > 0 && (
                           <span className="text-red-400">⚠ {contadores['VENCIDO']} vencidas</span>
                        )}
                        {contadores['SIN_PLANIFICAR'] > 0 && (
                           <span className="text-rose-400">📋 {contadores['SIN_PLANIFICAR']} sin planificar</span>
                        )}
                        {contadores['HOY'] > 0 && (
                           <span className="text-amber-400">🕐 {contadores['HOY']} hoy</span>
                        )}
                        {contadores['MAÑANA'] > 0 && (
                           <span className="text-blue-400">📅 {contadores['MAÑANA']} mañana</span>
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
