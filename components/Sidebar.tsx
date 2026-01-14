import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpsOpen, setIsOpsOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (prefix: string) => location.pathname.startsWith(prefix);
  
  const linkClass = (path: string) => 
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors cursor-pointer text-sm font-medium ${
      isActive(path) 
        ? 'bg-primary/10 border border-primary/20 text-primary' 
        : 'text-text-secondary hover:text-slate-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-border-dark/50'
    }`;

  const subLinkClass = (path: string) => 
    `flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer text-xs font-medium ml-4 border-l border-border-dark pl-4 ${
      isActive(path) 
        ? 'text-primary border-primary' 
        : 'text-text-secondary hover:text-slate-900 dark:hover:text-white border-transparent'
    }`;
    
  const iconClass = (path: string) => isActive(path) ? 'text-primary' : 'text-text-secondary group-hover:text-white';

  return (
    <aside className="hidden md:flex flex-col w-64 h-full border-r border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark flex-shrink-0 z-30 overflow-y-auto">
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-8 cursor-pointer pl-1" onClick={() => navigate('/ceo')}>
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-white text-[20px]">dataset</span>
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">WISEBETCORE</span>
        </div>
        <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 dark:bg-background-dark rounded-xl border border-gray-100 dark:border-border-dark">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIlXv6w0h-1x2rMoxuk9ESbP6Ahc-ZOCls8Dr409dc5RDXec4eJzxvFB0Wd3jRIe27e4Pn40f_-ZUWWuv0ALkVMbpvFWaVbZIzLkGGKHDtjBkyY-dMgK5qjLIuxwmwbed0PohaiYuAbAs-VwtZPAU0cgOvFIQCRxUgvDNrku7aO4lNXP22G4phs06MFiVnkilOcq5nuxSlMJyKL78HCh7YSVVz29gc69-IafCrUaDuFE72EtDNfox-aU4MtFU-NNDwkwqM38_sWtFr")' }}></div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-sm font-semibold truncate text-slate-900 dark:text-white">Nicolas Ullauri</h2>
            <p className="text-text-secondary text-xs font-medium truncate">CEO & Founder</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {/* 1. Vista CEO */}
        <div className={linkClass('/ceo')} onClick={() => navigate('/ceo')}>
          <span className={`material-symbols-outlined ${iconClass('/ceo')}`}>dashboard</span>
          <span>Vista CEO</span>
        </div>

        {/* 2. Control Global */}
        <div className={linkClass('/control-global')} onClick={() => navigate('/control-global')}>
          <span className={`material-symbols-outlined ${iconClass('/control-global')}`}>fact_check</span>
          <span>Control Global</span>
        </div>

        {/* 3. Operaciones (Collapsible) */}
        <div className="pt-2">
          <div 
            className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${isGroupActive('/ops') ? 'text-slate-900 dark:text-white' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
            onClick={() => setIsOpsOpen(!isOpsOpen)}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">tune</span>
              <span className="text-sm font-semibold">Operaciones</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isOpsOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </div>

          {isOpsOpen && (
            <div className="mt-1 space-y-4 mb-4">
              {/* 3.1 Picks EV+ */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-2 mb-1">Picks EV+</p>
                <div className={subLinkClass('/ops/picks/analysis')} onClick={() => navigate('/ops/picks/analysis')}>
                  Análisis y Ejecución
                </div>
                <div className={subLinkClass('/ops/picks/quality')} onClick={() => navigate('/ops/picks/quality')}>
                  Calidad (EQS)
                </div>
              </div>

              {/* 3.2 Valuebets */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-2 mb-1">Valuebets</p>
                <div className={subLinkClass('/ops/valuebets/analysis')} onClick={() => navigate('/ops/valuebets/analysis')}>
                  Análisis y Ejecución
                </div>
                <div className={subLinkClass('/ops/valuebets/quality')} onClick={() => navigate('/ops/valuebets/quality')}>
                  Calidad (EQS)
                </div>
              </div>

              {/* 3.3 SurebettingEC */}
              <div className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-2 mb-1">SurebettingEC</p>
                <div className={subLinkClass('/ops/surebetting/analysis')} onClick={() => navigate('/ops/surebetting/analysis')}>
                  Análisis y Operaciones
                </div>
                <div className={subLinkClass('/ops/surebetting/quality')} onClick={() => navigate('/ops/surebetting/quality')}>
                  Calidad Operativa
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. Centro Operativo */}
        <div className={linkClass('/centro-operativo')} onClick={() => navigate('/centro-operativo')}>
          <span className={`material-symbols-outlined ${iconClass('/centro-operativo')}`}>psychology</span>
          <span>Centro Operativo</span>
        </div>

        {/* 5. Red Operativa */}
        <div className={linkClass('/red-operativa')} onClick={() => navigate('/red-operativa')}>
          <span className={`material-symbols-outlined ${iconClass('/red-operativa')}`}>hub</span>
          <span>Red Operativa</span>
        </div>

        {/* 6. Finanzas */}
        <div className={linkClass('/finanzas')} onClick={() => navigate('/finanzas')}>
          <span className={`material-symbols-outlined ${iconClass('/finanzas')}`}>account_balance_wallet</span>
          <span>Finanzas</span>
        </div>

      </nav>

      <div className="p-4 mt-auto border-t border-gray-200 dark:border-border-dark">
        <div className={linkClass('/')} onClick={() => navigate('/')}>
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </div>
        <div className="mt-4 text-xs text-text-secondary text-center">
          v2.5.0-stable
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;