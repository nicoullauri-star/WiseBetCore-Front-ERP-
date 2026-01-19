import React, { useState, useCallback } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);

  const closeMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(false);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-white font-display">
      {/* Mobile Header - Only visible on mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-surface-dark/95 backdrop-blur-md border-b border-border-dark px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-white text-[18px]">dataset</span>
          </div>
          <span className="text-sm font-black tracking-tight text-white uppercase">WiseBet ERP</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg bg-background-dark border border-border-dark hover:border-primary/50 transition-colors"
          aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={isMobileMenuOpen}
        >
          <span className="material-symbols-outlined text-white text-[22px]">
            {isMobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>
      </header>

      {/* Sidebar with mobile support */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />

      {/* Main Content - Add top padding on mobile for fixed header */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default Layout;