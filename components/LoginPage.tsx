import React from 'react';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="relative flex min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden transition-colors duration-300">
      <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-border-dark bg-background-dark px-6 lg:px-10 py-4 sticky top-0 z-50">
        <div className="flex items-center gap-2 text-white cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-primary p-1.5 rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">dataset</span>
          </div>
          <span className="text-xl font-bold tracking-tight">WiseBetCore</span>
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center py-10 px-4 md:px-10">
        <div className="flex flex-col md:flex-row w-full max-w-5xl bg-surface-dark border border-border-dark rounded-xl shadow-xl overflow-hidden">
          <div className="hidden md:flex flex-col items-center justify-center p-8 lg:p-12 md:w-1/2 bg-gradient-to-br from-blue-900/40 to-black/40 text-white relative">
            <div className="absolute inset-0 bg-dark-texture opacity-20"></div>
            <div className="relative z-10 text-center flex flex-col items-center gap-4">
              <div className="bg-white/5 p-6 rounded-full border border-white/10 mb-2 backdrop-blur-sm">
                 <span className="material-symbols-outlined text-6xl text-white">admin_panel_settings</span>
              </div>
              <h2 className="text-3xl lg:text-4xl font-display font-bold leading-tight tracking-tight mb-3">Acceso Seguro a tu Plataforma</h2>
              <p className="text-text-secondary text-lg">Tu seguridad es nuestra prioridad. Inicia sesión para acceder a tus herramientas y datos.</p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center p-8 lg:p-12 md:w-1/2 bg-surface-dark bg-dark-texture border-l border-border-dark/50">
            <div className="flex flex-col w-full max-w-sm gap-8">
              <div className="text-center">
                <h1 className="text-white text-3xl font-display font-black leading-tight tracking-tight mb-2">Iniciar Sesión</h1>
                <p className="text-text-secondary text-base">Bienvenido de nuevo a WiseBetCore</p>
              </div>
              <form className="flex flex-col gap-5 w-full" onSubmit={(e) => { e.preventDefault(); navigate('/dashboard'); }}>
                <div>
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="email">Correo Electrónico o Usuario</label>
                  <input className="w-full rounded-lg border border-border-dark bg-background-dark px-4 py-3 text-white placeholder-text-secondary focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-colors" type="text" id="email" placeholder="admin@wisebet.com" defaultValue="admin@wisebet.com" />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2" htmlFor="password">Contraseña</label>
                  <input className="w-full rounded-lg border border-border-dark bg-background-dark px-4 py-3 text-white placeholder-text-secondary focus:border-primary focus:ring-primary focus:ring-1 outline-none transition-colors" type="password" id="password" placeholder="••••••••" defaultValue="password" />
                </div>
                <button className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-lg bg-primary px-8 py-3 text-white text-base font-bold shadow-lg shadow-blue-900/20 hover:bg-primary-hover transition-all duration-300 hover:shadow-blue-600/30 hover:-translate-y-0.5 min-w-[240px]" type="submit">
                  <span>Iniciar Sesión</span>
                  <span className="material-symbols-outlined">login</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;