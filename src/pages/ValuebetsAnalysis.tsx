import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const ValuebetsAnalysis: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-2">
            <Link to="/ceo" className="hover:text-white transition-colors">Operaciones</Link> <span>/</span> <span className="text-white">Valuebets</span> <span>/</span> <span className="font-medium text-primary">Análisis</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">Valuebets | Análisis de Ejecución</h1>
          <p className="mt-2 text-sm text-text-secondary">Analítica de discrepancias, slippage y eficiencia operativa (Software vs Real).</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5 text-xs font-bold text-yellow-500 hover:bg-yellow-500/20 transition-colors">
            <span className="material-symbols-outlined text-[16px]">warning</span> Data Quality: Warning
          </button>
          <button onClick={() => navigate('/ops/valuebets/quality')} className="flex items-center gap-2 rounded-lg bg-card-dark border border-border-dark px-3 py-2 text-sm font-medium text-white hover:bg-border-dark transition-colors">
            Ir a EQS <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { title: "Profit Neto", val: "$12,450", sub: "$13,200", gap: "-$750", gapCol: "danger" },
          { title: "ROI", val: "8.2%", sub: "9.5%", gap: "-1.3%", gapCol: "danger" },
          { title: "Yield", val: "4.5%", sub: "5.0%", gap: "-0.5%", gapCol: "warning" },
          { title: "CLV Promedio", val: "+3.2%", sub: "+3.1%", gap: "+0.1%", gapCol: "success" }
        ].map((kpi, i) => (
          <div key={i} className="rounded-xl border border-border-dark bg-card-dark p-4 shadow-sm hover:border-primary/50 transition-colors">
            <div className="flex justify-between"><p className="text-xs font-semibold text-text-secondary uppercase">{kpi.title}</p><span className="material-symbols-outlined text-text-secondary/30 text-[18px]">analytics</span></div>
            <div className="mt-2 flex items-baseline gap-2"><span className={`text-2xl font-bold ${kpi.gapCol === 'success' ? 'text-success' : 'text-white'}`}>{kpi.val}</span><span className="text-sm text-text-secondary line-through">{kpi.sub}</span></div>
            <div className="mt-2"><span className={`inline-flex items-center rounded-md bg-${kpi.gapCol}/10 px-1.5 py-0.5 text-xs font-medium text-${kpi.gapCol} ring-1 ring-inset ring-${kpi.gapCol}/20`}>Gap: {kpi.gap}</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 rounded-xl border border-border-dark bg-card-dark p-5 h-[350px] flex flex-col">
          <div className="flex justify-between mb-4">
            <h3 className="font-bold text-white">Curva de Rendimiento Acumulado <span className="text-xs font-normal text-text-secondary">(Modelo vs Real)</span></h3>
            <div className="flex items-center gap-2 text-xs"><span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-text-secondary"></span> Modelo</span><span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-primary"></span> Real</span></div>
          </div>
          <div className="flex-1 relative w-full border-l border-b border-border-dark">
            {/* Chart Mock */}
            <svg className="absolute inset-0 w-full h-full p-4 pl-0 pb-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,90 Q10,85 20,80 T40,60 T60,50 T80,30 T100,20" fill="none" stroke="#64748b" strokeDasharray="4,4" strokeWidth="2"></path>
              <path d="M0,90 Q10,88 20,82 T40,65 T60,58 T80,45 T100,40" fill="none" stroke="#135bec" strokeWidth="3"></path>
            </svg>
          </div>
        </div>
        <div className="rounded-xl border border-border-dark bg-card-dark p-5">
          <h3 className="font-bold text-white mb-2">Gap Expirarádo</h3>
          <div className="space-y-4 mt-4">
            {[
              { l: "Slippage", v: 65, txt: "-2.1%", col: "danger" },
              { l: "Execution Delay", v: 25, txt: "-0.8%", col: "danger" },
              { l: "Vig / Margen", v: 10, txt: "-0.3%", col: "warning" }
            ].map((bar, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1"><span className="text-white">{bar.l}</span><span className={`text-${bar.col} font-medium`}>{bar.txt}</span></div>
                <div className="h-2 w-full rounded-full bg-[#111318]"><div className={`h-full rounded-full bg-${bar.col}`} style={{ width: `${bar.v}%` }}></div></div>
              </div>
            ))}
            <div className="pt-3 border-t border-border-dark flex justify-between text-sm font-bold"><span className="text-white">Total Gap</span><span className="text-danger">-3.2%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValuebetsAnalysis;
