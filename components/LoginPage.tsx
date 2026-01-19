import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { WiseBetLogo } from './WiseBetLogo';
import { apiClient } from '../services/api.client';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get('identifier') as string;
    const password = formData.get('password') as string;

    try {
      const response = await apiClient.login({
        identifier,
        password,
      });

      console.log('Login exitoso:', response);
      // Los tokens ya están guardados automáticamente por el apiClient
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error en login:', err);
      const errorMessage = err.detail || err.message || "ACCESO DENEGADO: Credenciales inválidas.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-6 bg-[#050505] overflow-hidden selection:bg-primary/30 font-sans">

      {/* Background Decor: Subtle Center Glow */}
      <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
        <div className="w-[60%] h-[60%] bg-primary/5 rounded-full blur-[120px] opacity-50" />
      </div>

      <main className="relative z-10 w-full max-w-[480px] flex flex-col items-center animate-in fade-in duration-1000">

        {/* Main Branding Block (Inspirado en WiseBet Lab) */}
        <div className="flex flex-col items-center mb-12 text-center">
          <div className="mb-6 opacity-80">
            <WiseBetLogo className="w-12 h-12 text-white" />
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] mb-2">
              Neural Network Inference Online
            </span>
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter flex items-center">
              <span className="text-white">WISEBET</span>
              <span className="animate-gradient-shift bg-gradient-to-r from-[#00ff88] via-[#00d4ff] to-[#00ff88] bg-[length:200%_auto] bg-clip-text text-transparent ml-1">
                CORE
              </span>
            </h1>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.6em] mt-2">
              RESEARCH & DATA SYSTEMS
            </span>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="w-full bg-[#0a0a0a]/80 border border-white/5 rounded-3xl p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
          {/* Top accent line */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

          {error && (
            <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2">
              <ShieldCheck className="text-rose-500 shrink-0" size={16} />
              <span className="text-[10px] font-black text-rose-200 uppercase tracking-widest">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-5">
              {/* Identity Field */}
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] ml-1" htmlFor="email">Identificador de Usuario</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                    <Mail size={16} />
                  </div>
                  <input
                    className="w-full h-13 rounded-xl bg-black/60 border border-white/10 px-12 text-sm text-white placeholder:text-slate-800 outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                    type="text"
                    id="identifier"
                    name="identifier"
                    placeholder="USER_ID"
                    defaultValue="admin"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]" htmlFor="password">Clave de Acceso</label>
                </div>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-primary transition-colors">
                    <Lock size={16} />
                  </div>
                  <input
                    className="w-full h-13 rounded-xl bg-black/60 border border-white/10 px-12 pr-14 text-sm text-white placeholder:text-slate-800 outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/5 transition-all duration-300"
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    defaultValue="1234"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Main Action Button - High Contrast Style */}
            <button
              disabled={isLoading}
              className="group relative w-full h-13 flex items-center justify-center rounded-xl bg-white text-black font-black text-[11px] uppercase tracking-[0.25em] hover:bg-[#f0f0f0] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
              type="submit"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Iniciar Terminal</span>
                  <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </button>
          </form>

          {/* Secondary Action */}
          <div className="mt-6">
            <button className="w-full h-11 border border-white/10 text-[9px] font-black text-white uppercase tracking-[0.2em] rounded-xl hover:bg-white/5 transition-all">
              Planes Nodos
            </button>
          </div>
        </div>

        {/* Support Link */}
        <div className="mt-12 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
            © 2024 WiseBet Enterprise • Secure Session
          </p>
        </div>
      </main>

      {/* CSS Animations */}
      <style>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 4s ease infinite;
        }
        .h-13 { height: 3.25rem; }
      `}</style>
    </div>
  );
};

export default LoginPage;
