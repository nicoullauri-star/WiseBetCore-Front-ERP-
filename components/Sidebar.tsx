
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpsOpen, setIsOpsOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (path: string) => location.pathname === path;
  const isGroupActive = (prefix: string) => location.pathname.startsWith(prefix);

  const linkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer text-sm font-medium ${isActive(path)
      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
      : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const subLinkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer text-xs font-medium ml-4 border-l border-border-dark pl-4 ${isActive(path)
      ? 'text-primary border-primary font-bold'
      : 'text-text-secondary hover:text-white border-transparent'
    }`;

  const iconClass = (path: string) => isActive(path) ? 'text-primary' : 'text-text-secondary group-hover:text-white';

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Sidebar content - shared between mobile and desktop
  const sidebarContent = (
    <>
      <div className="p-4 mb-2">
        {/* Logo - Hidden on mobile since header shows it */}
        <div className="hidden md:flex items-center gap-3 mb-6 cursor-pointer" onClick={() => handleNavigate('/ceo')}>
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-[20px]">dataset</span>
          </div>
          <span className="text-base font-black tracking-tight text-white uppercase">WiseBet ERP</span>
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-3 p-2 bg-panel-dark rounded-lg border border-border-dark">
          <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-md size-8 flex-shrink-0" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCIlXv6w0h-1x2rMoxuk9ESbP6Ahc-ZOCls8Dr409dc5RDXec4eJzxvFB0Wd3jRIe27e4Pn40f_-ZUWWuv0ALkVMbpvFWaVbZIzLkGGKHDtjBkyY-dMgK5qjLIuxwmwbed0PohaiYuAbAs-VwtZPAU0cgOvFIQCRxUgvDNrku7aO4lNXP22G4phs06MFiVnkilOcq5nuxSlMJyKL78HCh7YSVVz29gc69-IafCrUaDuFE72EtDNfox-aU4MtFU-NNDwkwqM38_sWtFr")' }}></div>
          <div className="flex flex-col overflow-hidden">
            <h2 className="text-xs font-bold truncate text-white">Nicolas Ullauri</h2>
            <p className="text-text-secondary text-[10px] font-medium truncate uppercase tracking-widest">Ops Lead</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        <div className={linkClass('/ceo')} onClick={() => handleNavigate('/ceo')}>
          <span className={`material-symbols-outlined ${iconClass('/ceo')}`}>dashboard</span>
          <span>Vista CEO</span>
        </div>

        <div className={linkClass('/control-global')} onClick={() => handleNavigate('/control-global')}>
          <span className={`material-symbols-outlined ${iconClass('/control-global')}`}>fact_check</span>
          <span>Control Global</span>
        </div>

        <div className="pt-2">
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${isGroupActive('/ops') ? 'bg-white/5 text-white' : 'text-text-secondary hover:text-white'}`}
            onClick={() => setIsOpsOpen(!isOpsOpen)}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">tune</span>
              <span className="text-sm font-semibold">Operaciones</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isOpsOpen ? 'rotate-180' : ''}`}>expand_more</span>
          </div>

          {isOpsOpen && (
            <div className="mt-1 space-y-1 pb-2">
              <div className="space-y-1">
                <p className="px-3 text-[9px] font-black text-text-secondary uppercase tracking-widest mt-2 mb-1">Picks EV+</p>
                <div className={subLinkClass('/ops/picks/analysis')} onClick={() => handleNavigate('/ops/picks/analysis')}>Análisis</div>
                <div className={subLinkClass('/ops/picks/quality')} onClick={() => handleNavigate('/ops/picks/quality')}>EQS Quality</div>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[9px] font-black text-text-secondary uppercase tracking-widest mt-2 mb-1">Valuebets</p>
                <div className={subLinkClass('/ops/valuebets/analysis')} onClick={() => handleNavigate('/ops/valuebets/analysis')}>Análisis</div>
                <div className={subLinkClass('/ops/valuebets/quality')} onClick={() => handleNavigate('/ops/valuebets/quality')}>EQS Quality</div>
              </div>

              <div className="space-y-1">
                <p className="px-3 text-[9px] font-black text-text-secondary uppercase tracking-widest mt-2 mb-1">SurebettingEC</p>
                <div className={subLinkClass('/ops/surebetting/analysis')} onClick={() => handleNavigate('/ops/surebetting/analysis')}>Operaciones</div>
                <div className={subLinkClass('/ops/surebetting/quality')} onClick={() => handleNavigate('/ops/surebetting/quality')}>Calidad</div>
              </div>
            </div>
          )}
        </div>

        <div className={linkClass('/centro-operativo')} onClick={() => handleNavigate('/centro-operativo')}>
          <span className={`material-symbols-outlined ${iconClass('/centro-operativo')}`}>psychology</span>
          <span>Centro Operativo</span>
        </div>

        <div className={linkClass('/red-operativa')} onClick={() => handleNavigate('/red-operativa')}>
          <span className={`material-symbols-outlined ${iconClass('/red-operativa')}`}>hub</span>
          <span>Red Operativa</span>
        </div>

        <div className={linkClass('/finanzas')} onClick={() => handleNavigate('/finanzas')}>
          <span className={`material-symbols-outlined ${iconClass('/finanzas')}`}>account_balance_wallet</span>
          <span>Finanzas</span>
        </div>
      </nav>

      <div className="p-4 mt-auto border-t border-border-dark">
        <div className={linkClass('/')} onClick={() => handleNavigate('/')}>
          <span className="material-symbols-outlined">logout</span>
          <span>Cerrar Sesión</span>
        </div>
        <div className="mt-4 text-[10px] text-text-secondary text-center font-bold tracking-widest opacity-50 uppercase">
          WiseBet v2.8.0
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar - Static */}
      <aside className="hidden md:flex flex-col w-60 h-full border-r border-border-dark bg-surface-dark flex-shrink-0 z-30 overflow-y-auto">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar - Overlay */}
      {/* Backdrop */}
      <div
        className={`md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Slide-in Sidebar */}
      <aside
        className={`md:hidden fixed top-14 left-0 bottom-0 w-72 max-w-[85vw] border-r border-border-dark bg-surface-dark z-50 flex flex-col transition-transform duration-300 ease-out ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        aria-label="Menú de navegación móvil"
      >
        {sidebarContent}
      </aside>
    </>
  );
};

export default Sidebar;
