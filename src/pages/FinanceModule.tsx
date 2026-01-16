import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const FinanceModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'depositos' | 'retiros' | 'transferencias' | 'resumen'>('depositos');

  const tabs = [
    { id: 'depositos', label: 'Depósitos', icon: 'arrow_downward' },
    { id: 'retiros', label: 'Retiros', icon: 'arrow_upward' },
    { id: 'transferencias', label: 'Transferencias', icon: 'swap_horiz' },
    { id: 'resumen', label: 'Resumen', icon: 'pie_chart' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark">
       {/* Header */}
       <div className="px-6 py-6 border-b border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2 text-xs text-text-secondary mb-1">
                <Link to="/ceo" className="hover:text-white transition-colors">Home</Link> <span>/</span> <span className="text-primary font-medium">Finanzas</span>
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">account_balance_wallet</span> Finanzas
                </h1>
            </div>
             <div className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-lg">
                <span className="text-xs font-bold text-primary">Módulo Financiero (Prototipo)</span>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${
                        activeTab === tab.id 
                        ? 'bg-gray-50 dark:bg-background-dark border-primary text-primary' 
                        : 'border-transparent text-text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-border-dark/30'
                    }`}
                >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.label}
                </button>
            ))}
          </div>
       </div>

       {/* Content */}
       <div className="flex-1 overflow-y-auto p-6">
         
         {/* Placeholder KPIs */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                <p className="text-xs text-text-secondary uppercase font-semibold">Total Mes</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">€124k</p>
            </div>
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                <p className="text-xs text-text-secondary uppercase font-semibold">Confirmado</p>
                <p className="text-2xl font-bold text-emerald-500 mt-1">€110k</p>
            </div>
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                <p className="text-xs text-text-secondary uppercase font-semibold">Pendiente</p>
                <p className="text-2xl font-bold text-amber-500 mt-1">€14k</p>
            </div>
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                <p className="text-xs text-text-secondary uppercase font-semibold">Neto</p>
                <p className="text-2xl font-bold text-primary mt-1">+€42k</p>
            </div>
         </div>

         {/* Filter Bar */}
         <div className="flex flex-wrap gap-3 mb-4">
             <div className="relative flex-1 min-w-[200px]">
                 <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                 <input type="text" placeholder="Buscar por referencia..." className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" />
             </div>
             <select className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer">
                 <option>Todos los Estados</option>
                 <option>Pendiente</option>
                 <option>Completado</option>
                 <option>Rechazado</option>
             </select>
             <select className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer">
                 <option>Método de Pago</option>
                 <option>Skrill</option>
                 <option>Neteller</option>
                 <option>Crypto</option>
             </select>
         </div>

         {/* Empty Table State */}
         <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
             <div className="p-6 bg-gray-50 dark:bg-background-dark/50 rounded-full mb-4">
                 <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
             </div>
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Registros de {activeTab}</h3>
             <p className="text-text-secondary text-sm max-w-sm text-center">
                 Aquí se registrarán y visualizarán todos los movimientos financieros asociados a la operación.
             </p>
         </div>

       </div>
    </div>
  );
};

export default FinanceModule;