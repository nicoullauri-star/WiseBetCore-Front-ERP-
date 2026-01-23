/**
 * CalendarioObjetivos Component
 * Calendario visual de objetivos de creación de perfiles usando FullCalendar
 */

import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Calendar, AlertCircle, CheckCircle2, Clock, X, TrendingUp, Target } from 'lucide-react';
import type { CalendarioEvento } from '../types';

interface CalendarioObjetivosProps {
   eventos: CalendarioEvento[];
   loading?: boolean;
}

export const CalendarioObjetivos: React.FC<CalendarioObjetivosProps> = ({ eventos, loading }) => {
   const [eventoSeleccionado, setEventoSeleccionado] = useState<CalendarioEvento | null>(null);
   
   // Transformar eventos del backend al formato de FullCalendar
   const fullCalendarEvents = useMemo(() => {
      if (!eventos || !Array.isArray(eventos)) {
         return [];
      }
      
      return eventos
         .filter(evento => evento && evento.id && evento.fecha)
         .map(evento => {
         // Determinar color según el tipo y estado
         let backgroundColor = '#3b82f6'; // Azul por defecto
         let borderColor = '#2563eb';
         
         if (evento.tipo === 'perfil_creado') {
            backgroundColor = '#3b82f6'; // Azul para perfiles creados
            borderColor = '#2563eb';
         } else if (evento.tipo === 'fecha_limite') {
            if (evento.completado) {
               backgroundColor = '#10b981'; // Verde si completado
               borderColor = '#059669';
            } else {
               // Verificar si está vencido
               const fechaLimite = new Date(evento.fecha);
               const hoy = new Date();
               hoy.setHours(0, 0, 0, 0);
               
               if (fechaLimite < hoy) {
                  backgroundColor = '#ef4444'; // Rojo si vencido
                  borderColor = '#dc2626';
               } else {
                  backgroundColor = '#f59e0b'; // Amarillo/Ámbar si pendiente
                  borderColor = '#d97706';
               }
            }
         }

         return {
            id: evento.id,
            title: evento.titulo,
            start: evento.fecha,
            backgroundColor,
            borderColor,
            extendedProps: {
               tipo: evento.tipo,
               agencia_nombre: evento.agencia_nombre,
               cantidad_objetivo: evento.cantidad_objetivo,
               cantidad_completada: evento.cantidad_completada,
               perfiles_restantes: evento.perfiles_restantes,
               completado: evento.completado,
               nombre_usuario: evento.nombre_usuario,
               tipo_jugador: evento.tipo_jugador,
               hora: evento.hora
            }
         };
      });
   }, [eventos]);

   // Renderizar el contenido del evento personalizado
   const renderEventContent = (eventInfo: any) => {
      const { extendedProps } = eventInfo.event;
      
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
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-500/20 rounded-xl border border-blue-500/40">
               <Calendar size={24} className="text-blue-400" />
            </div>
            <div>
               <h2 className="text-lg font-black text-white uppercase tracking-wider">
                  Calendario de Objetivos
               </h2>
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  {eventos?.length || 0} objetivos programados
               </p>
            </div>
         </div>

         {/* Leyenda de colores */}
         <div className="flex flex-wrap gap-3 mb-6 pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-blue-500"></div>
               <span className="text-xs text-slate-400 font-bold">En progreso</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-amber-500"></div>
               <span className="text-xs text-slate-400 font-bold">Urgente ({"<7d"})</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-red-500"></div>
               <span className="text-xs text-slate-400 font-bold">Vencido</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-3 h-3 rounded bg-green-500"></div>
               <span className="text-xs text-slate-400 font-bold">Completado</span>
            </div>
         </div>

         {/* FullCalendar */}
         <div className="fullcalendar-custom">
            <FullCalendar
               plugins={[dayGridPlugin, interactionPlugin]}
               initialView="dayGridMonth"
               locale="es"
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
               eventClick={(info) => {
                  // Buscar el evento completo en los datos originales
                  const eventoCompleto = eventos.find(e => e.id === info.event.id);
                  if (eventoCompleto) {
                     setEventoSeleccionado(eventoCompleto);
                  }
               }}
            />
         </div>

         {(!eventos || eventos.length === 0) && !loading && (
            <div className="text-center py-12">
               <Calendar size={48} className="text-slate-600 mx-auto mb-3" />
               <p className="text-sm text-slate-500 font-bold">No hay objetivos programados</p>
               <p className="text-xs text-slate-600 mt-1">Crea objetivos para verlos en el calendario</p>
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
                           new Date(eventoSeleccionado.fecha) < new Date() ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                           'bg-amber-500/20 border-amber-500/40 text-amber-400'
                        }`}>
                           {eventoSeleccionado.tipo === 'perfil_creado' && <Target size={24} />}
                           {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.completado && <CheckCircle2 size={24} />}
                           {eventoSeleccionado.tipo === 'fecha_limite' && !eventoSeleccionado.completado && <AlertCircle size={24} />}
                        </div>
                        <div>
                           <h2 className="text-lg font-black text-white tracking-tight">{eventoSeleccionado.titulo}</h2>
                           <p className="text-xs text-slate-400 font-bold mt-1">{eventoSeleccionado.agencia_nombre}</p>
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
                                 new Date(eventoSeleccionado.fecha) < new Date() ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                                 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              }`}>
                                 {eventoSeleccionado.completado ? '✓ Completado' :
                                  new Date(eventoSeleccionado.fecha) < new Date() ? '⚠ Vencido' :
                                  '⏰ Pendiente'}
                              </span>
                           )}
                        </div>
                     </div>

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

                     {/* Fecha */}
                     <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                           {eventoSeleccionado.tipo === 'fecha_limite' ? 'Fecha Límite' : 'Fecha de Creación'}
                        </p>
                        <div className="flex items-center gap-2">
                           <Calendar size={16} className="text-blue-400" />
                           <p className="text-white font-bold">
                              {new Date(eventoSeleccionado.fecha).toLocaleDateString('es-ES', { 
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

                     {/* Detalles adicionales según tipo */}
                     {eventoSeleccionado.tipo === 'fecha_limite' && eventoSeleccionado.cantidad_objetivo && (eventoSeleccionado.cantidad_objetivo > (eventoSeleccionado.cantidad_completada || 0)) && (
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
      </div>
   );
};
