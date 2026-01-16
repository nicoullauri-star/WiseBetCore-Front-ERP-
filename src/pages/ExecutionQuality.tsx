import React from 'react';
import { Link } from 'react-router-dom';

const ExecutionQuality: React.FC = () => {
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark">
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex justify-between items-center bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-dark shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-text-secondary">
               <Link to="/ceo" className="hover:text-white transition-colors">Operaciones</Link> <span>/</span> <span className="text-white">Valuebets</span> <span>/</span> <span className="font-medium text-primary">Calidad (EQS)</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Calidad de Ejecución (EQS)</h1>
          </div>
          <div className="flex gap-3">
            <button className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium shadow-sm hover:bg-primary-hover transition-colors">Exportar Reporte</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-10"><span className="material-symbols-outlined text-8xl">verified</span></div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-500 text-sm font-medium uppercase">EQS Total</h3>
              <span className="bg-profit/10 text-profit border border-profit/20 px-2 py-1 rounded text-xs font-bold">Excelente</span>
            </div>
            <div className="flex items-end gap-4">
              <div className="text-5xl font-black text-slate-900 dark:text-white">87<span className="text-2xl text-slate-400">/100</span></div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1.5 rounded-full mt-4 overflow-hidden"><div className="bg-primary h-full rounded-full" style={{ width: '87%' }}></div></div>
          </div>

          {[
            { t: "Cobertura Ejecución", v: "99.2%", s: "Óptimo", c: "profit", i: "done_all" },
            { t: "Slippage de Cuota", v: "-1.02%", s: "Alto", c: "warning", i: "price_change" },
            { t: "Latencia", v: "0.8s", s: "Rápida", c: "profit", i: "timer" },
            { t: "Desviación Stake", v: "0.5%", s: "OK", c: "profit", i: "balance" }
          ].map((card, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between mb-2"><p className="text-slate-500 text-sm font-medium">{card.t}</p><span className={`material-symbols-outlined text-lg text-${card.c === 'profit' ? 'success' : 'warning'}`}>{card.i}</span></div>
              <div><h3 className="text-2xl font-bold text-slate-900 dark:text-white">{card.v}</h3><p className={`text-xs text-${card.c === 'profit' ? 'success' : 'warning'} mt-1`}>{card.s}</p></div>
            </div>
          ))}
        </div>

        <div className="bg-white dark:bg-surface-dark border border-border-dark rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white">Acciones Recomendadas</h3><span className="bg-primary/20 text-primary text-xs font-bold px-2 py-1 rounded-full">3 Nuevas</span></div>
          <div className="space-y-3">
            {[
              { t: "Slippage Alto en Bet365", d: "El slippage promedio ha subido a -3% en mercados de NBA.", i: "warning", c: "warning" },
              { t: "CLV Negativo Recurrente", d: "3 valuebets consecutivas con CLV negativo en Tenis ITF.", i: "trending_down", c: "loss" },
              { t: "Optimizar Latencia", d: "Tu latencia promedio es 200ms superior a la media.", i: "info", c: "primary" }
            ].map((rec, i) => (
              <div key={i} className={`p-3 rounded-lg border border-${rec.c}/20 bg-${rec.c}/5 flex gap-3 cursor-pointer hover:bg-${rec.c}/10 transition`}>
                <span className={`material-symbols-outlined text-${rec.c} mt-0.5`}>{rec.i}</span>
                <div><p className="text-sm font-semibold text-slate-900 dark:text-white">{rec.t}</p><p className="text-xs text-slate-500 mt-1">{rec.d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExecutionQuality;