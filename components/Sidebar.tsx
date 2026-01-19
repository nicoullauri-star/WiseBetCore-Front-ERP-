
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { apiClient } from '../services/api.client';
import type { NavigationMenuItem, NavigationUser } from '../types/navigation.types';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen = false, onMobileClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationItems, setNavigationItems] = useState<NavigationMenuItem[]>([]);
  const [user, setUser] = useState<NavigationUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>({});

  // Fetch navigation data on mount
  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const data = await apiClient.getNavigation();
        setNavigationItems(data.navigation);
        setUser(data.user);

        // Auto-open groups that contain the current route
        const groups: Record<number, boolean> = {};
        data.navigation.forEach(item => {
          if (item.children.length > 0) {
            const hasActiveChild = item.children.some(child =>
              location.pathname.startsWith(child.route || '')
            );
            if (hasActiveChild || (item.route && location.pathname.startsWith(item.route))) {
              groups[item.id] = true;
            }
          }
        });
        setOpenGroups(groups);
      } catch (error) {
        console.error('Error fetching navigation:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNavigation();
  }, [location.pathname]);

  // Close mobile menu when route changes
  useEffect(() => {
    if (onMobileClose) {
      onMobileClose();
    }
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const isActive = (path: string | null) => path && location.pathname === path;
  const isGroupActive = (prefix: string | null) => prefix && location.pathname.startsWith(prefix);

  const linkClass = (path: string | null) =>
    `flex items-center gap-3 px-3 py-2 rounded-md transition-all cursor-pointer text-sm font-medium ${isActive(path)
      ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
      : 'text-text-secondary hover:text-white hover:bg-white/5 border border-transparent'
    }`;

  const subLinkClass = (path: string | null) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-md transition-all cursor-pointer text-xs font-medium ml-4 border-l border-border-dark pl-4 ${isActive(path)
      ? 'text-primary border-primary font-bold'
      : 'text-text-secondary hover:text-white border-transparent'
    }`;

  const iconClass = (path: string | null) => isActive(path) ? 'text-primary' : 'text-text-secondary group-hover:text-white';

  const handleNavigate = (path: string | null, code?: string) => {
    if (code === 'auth_logout') {
      // Handle logout
      localStorage.clear();
      navigate('/');
    } else if (path) {
      navigate(path);
    }
  };

  const toggleGroup = (itemId: number) => {
    setOpenGroups(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const renderMenuItem = (item: NavigationMenuItem) => {
    const hasChildren = item.children.length > 0;
    const isOpen = openGroups[item.id];

    if (hasChildren) {
      // Parent item with children
      return (
        <div key={item.id} className="pt-2">
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors ${isGroupActive(item.route) ? 'bg-white/5 text-white' : 'text-text-secondary hover:text-white'
              }`}
            onClick={() => toggleGroup(item.id)}
          >
            <div className="flex items-center gap-3">
              {item.icon && <span className="material-symbols-outlined">{item.icon}</span>}
              <span className="text-sm font-semibold">{item.name}</span>
            </div>
            <span className={`material-symbols-outlined text-sm transition-transform ${isOpen ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </div>

          {isOpen && (
            <div className="mt-1 space-y-1 pb-2">
              {item.children.map(child => {
                // Check if child has sections
                if (child.sections && child.sections.length > 0) {
                  return (
                    <div key={child.id} className="space-y-1">
                      <p className="px-3 text-[9px] font-black text-text-secondary uppercase tracking-widest mt-2 mb-1">
                        {child.name}
                      </p>
                      {child.sections.map(section => (
                        <div
                          key={section.id}
                          className={subLinkClass(section.route)}
                          onClick={() => handleNavigate(section.route)}
                        >
                          {section.name}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  // Child without sections
                  return (
                    <div
                      key={child.id}
                      className={subLinkClass(child.route)}
                      onClick={() => handleNavigate(child.route)}
                    >
                      {child.name}
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
      );
    } else {
      // Simple menu item without children
      return (
        <div
          key={item.id}
          className={linkClass(item.route)}
          onClick={() => handleNavigate(item.route, item.code)}
        >
          {item.icon && <span className={`material-symbols-outlined ${iconClass(item.route)}`}>{item.icon}</span>}
          <span>{item.name}</span>
        </div>
      );
    }
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
        {user && (
          <div className="flex items-center gap-3 p-2 bg-panel-dark rounded-lg border border-border-dark">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-md size-8 flex-shrink-0 bg-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-lg">person</span>
            </div>
            <div className="flex flex-col overflow-hidden">
              <h2 className="text-xs font-bold truncate text-white">
                {user.nombre_completo || user.username}
              </h2>
              <p className="text-text-secondary text-[10px] font-medium truncate uppercase tracking-widest">
                {user.email}
              </p>
            </div>
          </div>
        )}
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-text-secondary text-sm">Cargando menú...</div>
          </div>
        ) : (
          navigationItems.map(item => renderMenuItem(item))
        )}
      </nav>

      <div className="p-4 mt-auto border-t border-border-dark">
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
