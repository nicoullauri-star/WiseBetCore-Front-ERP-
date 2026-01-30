import React, { useState } from 'react';

const GapAnalysis: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="flex-1 px-4 md:px-8 xl:px-40 py-8 overflow-y-auto">
      {/* Drawer */}
      {isDrawerOpen && <div className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>}
      <div className={`fixed right-0 top-0 h-full w-[420px] max-w-full bg-surface-light dark:bg-surface-dark border-l border-border-dark shadow-2xl z-[70] flex flex-col transition-transform duration-300 ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 border-b border-border-dark flex justify-between items-start">
          <div><h3 className="text-xl font-bold text-white">Auditoría de KPI</h3><span className="text-primary text-sm font-semibold">Métrica: Profit Gap</span></div>
          <span className="material-symbols-outlined cursor-pointer text-white hover:text-gray-300" onClick={() => setIsDrawerOpen(false)}>close</span>
        </div>
        <div className="p-6 text-white">
          <p className="text-sm mb-4 text-text-secondary">Diferencia neta absoluta entre el resultado teórico (Modelo) y el resultado obtenido (Real).</p>
          <div className="space-y-4">
            {[{ l: "Slippage", v: 65, txt: "-$240", c: "danger" }, { l: "Comisiones", v: 23, txt: "-$85", c: "warning" }].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span className="text-text-secondary">{item.l}</span><span className={`text-${item.c} font-bold`}>{item.txt}</span></div>
                <div className="w-full bg-background-dark h-2 rounded-full overflow-hidden border border-border-dark"><div className={`bg-${item.c} h-full`} style={{ width: `${item.v}%` }}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div><h1 className="text-3xl font-black text-slate-900 dark:text-white">Análisis de Ejecución</h1><p className="text-text-secondary">Picks EV+ | Diagnóstico de Gap</p></div>
          <button className="p-2 rounded-lg border border-border-dark bg-surface-dark text-white hover:bg-border-dark/50 transition-colors"><span className="material-symbols-outlined">refresh</span></button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { t: "Profit Total", m: "$2,500", r: "$2,150", g: "-$350", gc: "danger" },
            { t: "ROI", m: "12.5%", r: "10.8%", g: "-1.7 pts", gc: "danger" },
            { t: "Yield", m: "8.2%", r: "6.5%", g: "-1.7 pts", gc: "danger" },
            { t: "Winrate", m: "54%", r: "52%", g: "-2%", gc: "warning" }
          ].map((kpi, i) => (
            <div key={i} className="p-5 rounded-xl bg-surface-dark border border-border-dark shadow-sm group relative">
              <div className="flex justify-between items-start mb-3"><p className="text-text-secondary text-xs font-bold uppercase">{kpi.t}</p><span className="material-symbols-outlined text-[18px] text-primary cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsDrawerOpen(true)}>search</span></div>
              <div className="flex justify-between items-end mb-2"><div><span className="text-xs text-text-secondary block">Model</span><span className="text-lg font-semibold text-text-secondary">{kpi.m}</span></div><div className="text-right"><span className="text-xs text-primary block">Real</span><span className="text-2xl font-bold text-white">{kpi.r}</span></div></div>
              <div className="mt-3 pt-3 border-t border-border-dark flex justify-between"><span className="text-xs font-medium text-text-secondary">Gap</span><span className={`text-sm font-bold text-${kpi.gc}`}>{kpi.g}</span></div>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-surface-dark border border-border-dark p-6 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Curva de Rendimiento Acumulado</h3>
          <div className="relative w-full aspect-[21/9] min-h-[350px]">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 800 300">
              <defs>
                <linearGradient id="gradientModel" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#135bec" stopOpacity="0.2"></stop>
                  <stop offset="100%" stopColor="#135bec" stopOpacity="0"></stop>
                </linearGradient>
              </defs>
              <path d="M0,150 C50,140 100,200 150,180 C200,160 250,190 300,150 C350,110 400,130 450,100 C500,70 550,90 600,60 C650,30 700,50 750,20 L750,250 L0,250 Z" fill="url(#gradientModel)" opacity="0.5"></path>
              <path className="opacity-80" d="M0,150 C50,145 100,210 150,195 C200,180 250,210 300,175 C350,140 400,160 450,140 C500,120 550,135 600,110 C650,85 700,100 750,80" fill="none" stroke="#94a3b8" strokeDasharray="6,4" strokeLinecap="round" strokeWidth="2"></path>
              <path d="M0,150 C50,140 100,200 150,180 C200,160 250,190 300,150 C350,110 400,130 450,100 C500,70 550,90 600,60 C650,30 700,50 750,20" fill="none" stroke="#135bec" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GapAnalysis;
