import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
   Search, Filter, Store, BadgeCheck, ShieldAlert, History,
   ExternalLink, Copy, Eye, EyeOff, MoreVertical, Plus,
   ArrowUpRight, ArrowDownRight, Activity, TrendingUp,
   Clock, AlertCircle, Info, ChevronRight, CheckCircle2,
   Lock, Settings2, FileText, Tags, Trash2, LayoutDashboard,
   Users, Calendar, Sparkles, UserPlus, Save, X, BarChart3, TrendingDown,
   ChevronDown, ArrowRight, PieChart as PieChartIcon
} from 'lucide-react';
import { createPortal } from 'react-dom';
import {
   BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
   ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

// --- CONFIG & THRESHOLDS ---
const OPS_CONFIG = {
   lowMovementsThreshold: 10,
   highMovementsThreshold: 150,
   commissionHighThreshold: 100,
   staleSyncMinutes: 60,
};

const OWNERS_LIST = [
   "Nicolás Ullauri",
   "Santiago Muñoz",
   "Jonathan Ayala",
   "Paul Jiménez",
   "Andrés Gavilánez",
   "Javier Tenesaca"
];

const BOOKMAKERS = ['Victory', 'Ecuabet', 'OkiBet', 'Sorti', 'LasPlatas', 'Sharkbet'];

// --- DATA TYPES ---
type AgencyStatus = 'Active' | 'In Review' | 'Blocked';

interface AgencyProfile {
   id: string;
   status: 'Activo' | 'Limitado' | 'En pausa';
   balance: number;
   lastActivity: string;
}

interface Agency {
   id: string;
   owner: string;
   bookmaker: string;
   username: string;
   password: string;
   backofficeUrl: string;
   rakePercent: number;
   movements: number;
   houseGGR: number; // Positivo = Casa gana (Verde), Negativo = Casa pierde (Rojo)
   status: AgencyStatus;
   lastSyncAt: string;
   notes: any[];
   profiles: AgencyProfile[];
   minRequiredProfiles: number;
   balanceBackoffice: number;
}

// --- MOCK DATA SEEDER ---
const generateSeedAgencies = (): Agency[] => {
   return Array.from({ length: 18 }).map((_, i) => {
      const id = `AG-${(i + 1).toString().padStart(3, '0')}`;
      const bookmaker = BOOKMAKERS[i % BOOKMAKERS.length];
      const houseGGR = Math.floor(Math.random() * 6000) - 2500;
      const minReq = 3 + (i % 3);
      const activeCount = Math.max(0, minReq - (i % 4 === 0 ? 2 : 0));

      return {
         id,
         owner: OWNERS_LIST[i % OWNERS_LIST.length],
         bookmaker,
         username: `${bookmaker.toLowerCase()}_user_${i}`,
         password: `pass_${Math.random().toString(36).substring(7)}`,
         backofficeUrl: `https://bo.${bookmaker.toLowerCase()}.com/admin`,
         rakePercent: 30 + (i % 15),
         movements: Math.floor(Math.random() * 180),
         houseGGR,
         status: i < 14 ? 'Active' : i < 16 ? 'In Review' : 'Blocked',
         lastSyncAt: new Date(Date.now() - Math.floor(Math.random() * 5000000)).toISOString(),
         notes: [],
         balanceBackoffice: 1200 + Math.random() * 5000,
         minRequiredProfiles: minReq,
         profiles: Array.from({ length: activeCount }).map((_, pi) => ({
            id: `P-${id}-${pi + 1}`,
            status: 'Activo',
            balance: 150 + Math.random() * 800,
            lastActivity: 'Hace 2 horas'
         }))
      };
   });
};

// --- HELPERS ---
const fmtMoney = (v: number) =>
   new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' }).format(v);

// --- COMPONENTES AUXILIARES ---

const PortalTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
   const [visible, setVisible] = useState(false);
   const [coords, setCoords] = useState({ top: 0, left: 0 });
   const triggerRef = React.useRef<HTMLDivElement>(null);
   const handleMouseEnter = () => { if (triggerRef.current) { const rect = triggerRef.current.getBoundingClientRect(); setCoords({ top: rect.top - 10, left: rect.left + (rect.width / 2) }); setVisible(true); } };
   return (
      <>
         <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)} className="inline-flex cursor-help">{children}</div>
         {visible && createPortal(
            <div className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-[11px] leading-tight rounded-lg shadow-xl border border-white/10 backdrop-blur-md max-w-[220px] text-center animate-in fade-in zoom-in-95 duration-150" style={{ top: coords.top, left: coords.left }}>{text}<div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div></div>,
            document.body
         )}
      </>
   );
};

const MetricCard = ({ label, value, sub, color = 'white', tooltip }: any) => (
   <div className="bg-surface-dark border border-border-dark rounded-2xl p-4 shadow-sm group hover:border-primary/40 transition-all cursor-default">
      <div className="flex justify-between items-start mb-1">
         <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{label}</p>
         {tooltip && <PortalTooltip text={tooltip}><Info size={12} className="text-text-secondary/40 hover:text-white" /></PortalTooltip>}
      </div>
      <p className={`text-xl font-black ${color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : color === 'primary' ? 'text-primary' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-secondary font-bold mt-1 uppercase">{sub}</p>}
   </div>
);

// --- MAIN COMPONENT ---

const OperationalNetwork: React.FC = () => {
   const navigate = useNavigate();
   const [searchParams] = useSearchParams();
   const [activeTab, setActiveTab] = useState<'agencias' | 'perfiles' | 'movimientos' | 'usuarios'>('agencias');
   const [agencies, setAgencies] = useState<Agency[]>([]);
   const [search, setSearch] = useState('');
   const [selectedAgencyId, setSelectedAgencyId] = useState<string | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);

   // Filtros
   const [dateRangeType, setDateRangeType] = useState<'Mes actual' | '7d' | '30d' | 'Personalizado'>('Mes actual');
   const [activeFilter, setActiveFilter] = useState<'all' | 'high_comm' | 'gaps'>('all');

   useEffect(() => {
      setAgencies(generateSeedAgencies());
   }, []);

   const rangeLabel = dateRangeType === 'Mes actual' ? '(mes actual)' : '(rango)';

   const filteredAgencies = useMemo(() => {
      let res = agencies.filter(a =>
         a.id.toLowerCase().includes(search.toLowerCase()) ||
         a.owner.toLowerCase().includes(search.toLowerCase()) ||
         a.bookmaker.toLowerCase().includes(search.toLowerCase())
      );

      if (activeFilter === 'high_comm') {
         res = res.filter(a => (a.houseGGR > 0 ? a.houseGGR * (a.rakePercent / 100) : 0) > 100);
      } else if (activeFilter === 'gaps') {
         res = res.filter(a => a.profiles.length < a.minRequiredProfiles);
      }

      return res.sort((a, b) => b.movements - a.movements);
   }, [agencies, search, activeFilter]);

   const stats = useMemo(() => {
      const totalGGR = filteredAgencies.reduce((acc, a) => acc + a.houseGGR, 0);
      const winners = [...agencies].sort((a, b) => b.houseGGR - a.houseGGR).slice(0, 5);
      const losers = [...agencies].sort((a, b) => a.houseGGR - b.houseGGR).slice(0, 5);
      const commTotal = filteredAgencies.reduce((acc, a) => acc + (a.houseGGR > 0 ? a.houseGGR * (a.rakePercent / 100) : 0), 0);
      const profileGaps = agencies.filter(a => a.profiles.length < a.minRequiredProfiles);

      return { totalGGR, winners, losers, commTotal, profileGaps };
   }, [filteredAgencies, agencies]);

   const selectedAgency = useMemo(() => agencies.find(a => a.id === selectedAgencyId), [agencies, selectedAgencyId]);

   // Form State para Nueva Agencia
   const [formData, setFormData] = useState({
      owner: OWNERS_LIST[0],
      bookie: BOOKMAKERS[0],
      status: 'Active' as AgencyStatus,
      rake: 30,
      url: '',
      user: '',
      pass: '',
      minProfiles: 3
   });

   const handleSaveAgency = (e: React.FormEvent) => {
      e.preventDefault();
      const newAgency: Agency = {
         id: `AG-${(agencies.length + 1).toString().padStart(3, '0')}`,
         owner: formData.owner,
         bookmaker: formData.bookie,
         username: formData.user,
         password: formData.pass,
         backofficeUrl: formData.url,
         rakePercent: formData.rake,
         movements: 0,
         houseGGR: 0,
         status: formData.status,
         lastSyncAt: new Date().toISOString(),
         notes: [],
         profiles: [],
         minRequiredProfiles: formData.minProfiles,
         balanceBackoffice: 0
      };
      setAgencies([newAgency, ...agencies]);
      setIsModalOpen(false);
   };

   const tabs = [
      { id: 'agencias', label: 'Agencias', icon: <Store size={18} /> },
      { id: 'perfiles', label: 'Perfiles', icon: <BadgeCheck size={18} /> },
      { id: 'movimientos', label: 'Movimientos', icon: <Activity size={18} /> },
      { id: 'usuarios', label: 'Usuarios', icon: <Users size={18} /> },
   ];

   return (
      <div className="flex-1 flex flex-col h-full bg-[#0a0b0e] text-slate-300 relative overflow-hidden">

         {/* 1. CABECERA Y FILTRO DE FECHA */}
         <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-border-dark bg-surface-dark/95 backdrop-blur-md sticky top-0 z-40 flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
               <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-2.5 bg-primary/20 rounded-lg sm:rounded-xl text-primary border border-primary/20"><LayoutDashboard size={20} /></div>
                  <div>
                     <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">RED OPERATIVA</h1>
                     <p className="text-[9px] sm:text-[10px] text-text-secondary font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em]">Network Command Center</p>
                  </div>
               </div>

               <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <div className="flex items-center bg-background-dark border border-border-dark rounded-lg sm:rounded-xl p-1 shadow-inner overflow-x-auto max-w-full">
                     {['Mes actual', '7d', '30d', 'Personalizado'].map(p => (
                        <button
                           key={p}
                           onClick={() => setDateRangeType(p as any)}
                           className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[9px] sm:text-[10px] font-black uppercase rounded-lg transition-all whitespace-nowrap flex-shrink-0 ${dateRangeType === p ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                        >
                           {p === 'Personalizado' ? 'Custom' : p}
                        </button>
                     ))}
                  </div>
                  <button
                     onClick={() => setIsModalOpen(true)}
                     className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 bg-primary text-white text-[9px] sm:text-[10px] font-black uppercase rounded-lg sm:rounded-xl hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all active:scale-95 flex-shrink-0"
                  >
                     <Plus size={14} /> <span className="hidden xs:inline">Nueva</span>
                  </button>
               </div>
            </div>

            <div className="flex gap-1 overflow-x-auto no-scrollbar">
               {tabs.map(tab => (
                  <button
                     key={tab.id}
                     onClick={() => setActiveTab(tab.id as any)}
                     className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                           ? 'bg-primary/10 border-primary text-primary'
                           : 'border-transparent text-text-secondary hover:text-white hover:bg-white/5'
                        }`}
                  >
                     {tab.icon} {tab.label}
                  </button>
               ))}
            </div>
         </div>

         {activeTab === 'agencias' ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-10 pb-32 sm:pb-40">

               {/* 2. PANELES INTERACTIVOS */}
               <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <InteractivePanel
                     title="Agencias más ganadoras"
                     subtitle="Top Profit Casa"
                     icon={<TrendingUp size={16} />}
                     color="success"
                     data={stats.winners.map(w => ({ id: w.id, val: fmtMoney(w.houseGGR), sub: w.bookmaker }))}
                     onClick={(id) => setSelectedAgencyId(id)}
                  />
                  <InteractivePanel
                     title="Casa perdiendo (Riesgo)"
                     subtitle="Monitoreo de limitación"
                     icon={<TrendingDown size={16} />}
                     color="danger"
                     warning="Si la casa pierde, la comisión puede bajar."
                     data={stats.losers.map(l => ({ id: l.id, val: fmtMoney(l.houseGGR), sub: l.bookmaker }))}
                     onClick={(id) => setSelectedAgencyId(id)}
                  />
                  <InteractivePanel
                     title="Comisión a proteger"
                     subtitle=">$100 en rango"
                     icon={<ShieldAlert size={16} />}
                     color="primary"
                     isFilter
                     isActive={activeFilter === 'high_comm'}
                     data={[{ id: 'Filtrar agencias', val: fmtMoney(stats.commTotal), sub: 'Total estimado' }]}
                     onClick={() => setActiveFilter(activeFilter === 'high_comm' ? 'all' : 'high_comm')}
                  />
                  <InteractivePanel
                     title="Perfiles pendientes"
                     subtitle="Urgente por crear"
                     icon={<UserPlus size={16} />}
                     color="warning"
                     isFilter
                     isActive={activeFilter === 'gaps'}
                     data={stats.profileGaps.slice(0, 3).map(p => ({
                        id: p.id,
                        val: `Faltan: ${p.minRequiredProfiles - p.profiles.length}`,
                        sub: 'Sugerido: Próxima semana'
                     }))}
                     onClick={() => setActiveFilter(activeFilter === 'gaps' ? 'all' : 'gaps')}
                  />
               </section>

               {/* 3. CHARTS */}
               <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                  <div className="bg-surface-dark border border-border-dark rounded-3xl p-6 shadow-xl">
                     <div className="flex items-center gap-2 mb-6 text-white">
                        <BarChart3 size={18} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">GGR Casa por Casa de Apuestas</h3>
                     </div>
                     <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={BOOKMAKERS.map(b => ({ name: b, val: agencies.filter(a => a.bookmaker === b).reduce((acc, curr) => acc + curr.houseGGR, 0) }))}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#111318', border: 'none', borderRadius: '12px' }} />
                              <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                                 {BOOKMAKERS.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? '#135bec' : '#2563eb'} />)}
                              </Bar>
                           </BarChart>
                        </ResponsiveContainer>
                     </div>
                  </div>

                  <div className="bg-surface-dark border border-border-dark rounded-3xl p-6 shadow-xl">
                     <div className="flex items-center gap-2 mb-6 text-white">
                        {/* Use PieChartIcon from lucide-react instead of PieChart from recharts to fix TypeScript error */}
                        <PieChartIcon size={18} className="text-primary" />
                        <h3 className="text-xs font-black uppercase tracking-widest">Distribución: Casa Ganando vs Perdiendo</h3>
                     </div>
                     <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                 data={[
                                    { name: 'Casa Ganando', value: agencies.filter(a => a.houseGGR > 0).length },
                                    { name: 'Casa Perdiendo', value: agencies.filter(a => a.houseGGR <= 0).length }
                                 ]}
                                 innerRadius={60}
                                 outerRadius={80}
                                 paddingAngle={5}
                                 dataKey="value"
                              >
                                 <Cell fill="#10b981" />
                                 <Cell fill="#ef4444" />
                              </Pie>
                              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                              <RechartsTooltip contentStyle={{ backgroundColor: '#111318', border: 'none', borderRadius: '12px' }} />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>
                  </div>
               </section>

               {/* 4. TABLA DE AGENCIAS */}
               <section className="bg-surface-dark border border-border-dark rounded-3xl shadow-2xl overflow-hidden">
                  <div className="p-6 border-b border-border-dark flex justify-between items-center gap-4">
                     <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" size={18} />
                        <input
                           type="text"
                           placeholder="Buscar por ID, Dueño, Casa..."
                           value={search}
                           onChange={(e) => setSearch(e.target.value)}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-primary transition-all"
                        />
                     </div>
                     <div className="flex gap-2">
                        <FilterChip label="Estado" icon={<Activity size={12} />} />
                        <FilterChip label="Solo GGR Rojo" icon={<ArrowDownRight size={12} />} active={activeFilter === 'all'} />
                     </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse min-w-[1200px]">
                        <thead>
                           <tr className="bg-background-dark/50 text-[10px] uppercase text-text-secondary font-black border-b border-border-dark tracking-widest sticky top-0 z-10 backdrop-blur-md">
                              <th className="px-6 py-5">ID</th>
                              <th className="px-6 py-5">Dueño</th>
                              <th className="px-6 py-5">Casa</th>
                              <th className="px-6 py-5">Estado</th>
                              <th className="px-6 py-5 text-center">Rake %</th>
                              <th className="px-6 py-5 text-right">Movimientos {rangeLabel}</th>
                              <th className="px-6 py-5 text-right">GGR Casa {rangeLabel}</th>
                              <th className="px-6 py-5 text-right">Comisión estimada {rangeLabel}</th>
                              <th className="px-6 py-5">Perfiles Activos</th>
                              <th className="px-6 py-5">Alertas</th>
                              <th className="px-6 py-5 text-center">Acciones</th>
                           </tr>
                        </thead>
                        <tbody className="text-[11px]">
                           {filteredAgencies.map((a) => {
                              const comm = a.houseGGR > 0 ? (a.houseGGR * (a.rakePercent / 100)) : 0;
                              const missing = Math.max(0, a.minRequiredProfiles - a.profiles.length);

                              return (
                                 <tr
                                    key={a.id}
                                    onClick={() => setSelectedAgencyId(a.id)}
                                    className="border-b border-border-dark/20 hover:bg-white/[0.02] cursor-pointer transition-all group"
                                 >
                                    <td className="px-6 py-5 font-mono font-black text-primary">{a.id}</td>
                                    <td className="px-6 py-5 font-bold text-white">{a.owner}</td>
                                    <td className="px-6 py-5 font-bold text-slate-400">{a.bookmaker}</td>
                                    <td className="px-6 py-5">
                                       <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${a.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                                          }`}>{a.status === 'Active' ? 'Activo' : 'Bloqueado'}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center font-bold text-slate-500">{a.rakePercent}%</td>
                                    <td className="px-6 py-5 text-right font-mono font-black text-white">{a.movements}</td>
                                    <td className={`px-6 py-5 text-right font-mono font-black text-sm ${a.houseGGR >= 0 ? 'text-success' : 'text-danger'}`}>
                                       {fmtMoney(a.houseGGR)}
                                    </td>
                                    <td className="px-6 py-5 text-right font-mono font-black">
                                       {a.houseGGR > 0 ? (
                                          <span className="text-primary">{fmtMoney(comm)}</span>
                                       ) : (
                                          <PortalTooltip text="Sin comisión en este rango: la casa no va ganando.">
                                             <span className="text-slate-600">—</span>
                                          </PortalTooltip>
                                       )}
                                    </td>
                                    <td className="px-6 py-5">
                                       <PortalTooltip text={`Recomendación: \n- Mínimo recomendado: ${a.minRequiredProfiles}\n- Faltan: ${missing}\n- Próxima creación: Sugerida 1/sem`}>
                                          <div className="flex flex-col gap-1">
                                             <div className="flex items-center gap-2">
                                                <span className="text-white font-black">Activos: {a.profiles.length}</span>
                                                {missing > 0 && <span className="bg-rose-500/20 text-rose-500 text-[8px] px-1.5 py-0.5 rounded font-black">Faltan: {missing}</span>}
                                             </div>
                                          </div>
                                       </PortalTooltip>
                                    </td>
                                    <td className="px-6 py-5">
                                       <div className="flex gap-1">
                                          {a.houseGGR < 0 && <span className="px-1.5 py-0.5 bg-rose-500/10 text-rose-500 text-[8px] font-black uppercase rounded">Casa perdiendo</span>}
                                          {missing > 0 && <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded">Faltan perfiles</span>}
                                       </div>
                                    </td>
                                    <td className="px-6 py-5 text-center"><MoreVertical size={16} className="text-text-secondary" /></td>
                                 </tr>
                              );
                           })}
                        </tbody>
                     </table>
                  </div>
               </section>
            </div>
         ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-40">
               <span className="material-symbols-outlined text-8xl mb-4">construction</span>
               <h3 className="text-2xl font-black text-white uppercase tracking-widest">Módulo en Desarrollo</h3>
               <p className="text-sm text-text-secondary">Esta vista estará disponible próximamente en WiseBetCore.</p>
            </div>
         )}

         {/* --- DRAWER (DETALLE AGENCIA) --- */}
         {selectedAgency && (
            <div className="fixed inset-0 z-[100] flex justify-end">
               <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedAgencyId(null)} />
               <div className="relative w-full lg:max-w-xl bg-surface-dark border-l border-border-dark h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                  <div className="p-6 border-b border-border-dark flex justify-between items-center bg-[#151b26]">
                     <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-primary/20 rounded-2xl text-primary border border-primary/20"><Store size={28} /></div>
                        <div>
                           <h2 className="text-xl font-black text-white tracking-tighter">{selectedAgency.id}</h2>
                           <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">{selectedAgency.bookmaker} • {selectedAgency.owner}</p>
                        </div>
                     </div>
                     <button onClick={() => setSelectedAgencyId(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors text-text-secondary hover:text-white"><X size={20} /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                     {/* A. Resumen */}
                     <section className="grid grid-cols-2 gap-4">
                        <MetricCard label="GGR Casa" value={fmtMoney(selectedAgency.houseGGR)} color={selectedAgency.houseGGR >= 0 ? 'success' : 'danger'} sub={rangeLabel} />
                        <MetricCard label="Comisión Est." value={selectedAgency.houseGGR > 0 ? fmtMoney(selectedAgency.houseGGR * (selectedAgency.rakePercent / 100)) : "—"} color="primary" sub={rangeLabel} />
                        <MetricCard label="Movimientos" value={selectedAgency.movements} sub={rangeLabel} />
                        <MetricCard label="Rake %" value={`${selectedAgency.rakePercent}%`} />
                     </section>

                     {/* B. Saldo */}
                     <section className="bg-background-dark border border-border-dark rounded-3xl p-6 shadow-inner relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><Activity size={80} /></div>
                        <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Saldo de la Agencia (Backoffice)</p>
                        <div className="flex items-baseline gap-3">
                           <span className="text-3xl font-black text-white">{fmtMoney(selectedAgency.balanceBackoffice)}</span>
                           <span className="text-[10px] text-emerald-500 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase border border-emerald-500/20">Sincronizado</span>
                        </div>
                     </section>

                     {/* C. Perfiles */}
                     <section className="space-y-4">
                        <div className="flex justify-between items-center">
                           <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                              <Users size={14} className="text-primary" /> Perfiles de la Agencia
                           </h3>
                           <span className="text-[10px] font-bold text-text-secondary uppercase">{selectedAgency.profiles.length} Activos</span>
                        </div>
                        <div className="bg-background-dark border border-border-dark rounded-2xl overflow-hidden">
                           <table className="w-full text-left">
                              <thead className="text-[9px] uppercase font-black text-text-secondary bg-white/5">
                                 <tr>
                                    <th className="px-4 py-2.5">Perfil ID</th>
                                    <th className="px-4 py-2.5">Estado</th>
                                    <th className="px-4 py-2.5 text-right">Saldo</th>
                                    <th className="px-4 py-2.5"></th>
                                 </tr>
                              </thead>
                              <tbody className="text-[10px]">
                                 {selectedAgency.profiles.map(p => (
                                    <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => navigate(`/red-operativa?tab=perfiles&perfil=${p.id}&agencia=${selectedAgency.id}`)}>
                                       <td className="px-4 py-3 font-mono font-bold text-white">{p.id}</td>
                                       <td className="px-4 py-3"><span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded font-black uppercase text-[8px]">{p.status}</span></td>
                                       <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">{fmtMoney(p.balance)}</td>
                                       <td className="px-4 py-3 text-right"><ChevronRight size={14} className="text-slate-700" /></td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                           {selectedAgency.profiles.length === 0 && (
                              <div className="p-10 text-center text-text-secondary text-[10px] uppercase font-black italic">Sin perfiles activos registrados</div>
                           )}
                        </div>
                     </section>

                     {/* D. Gestión de Perfiles */}
                     <section className="p-6 bg-primary/5 border border-primary/20 rounded-3xl space-y-5">
                        <div className="flex justify-between items-center">
                           <h3 className="text-[10px] font-black text-primary uppercase tracking-widest">Gestión de Perfiles</h3>
                           <div className="text-[8px] bg-rose-500/20 text-rose-500 px-2 py-0.5 rounded-full font-black uppercase">Próxima creación: 22 May</div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-text-secondary uppercase">Cantidad a crear</label>
                              <input type="number" defaultValue={1} className="w-full bg-background-dark border border-border-dark rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-primary" />
                           </div>
                           <div className="space-y-1.5">
                              <label className="text-[9px] font-bold text-text-secondary uppercase">Estado Inicial</label>
                              <select className="w-full bg-background-dark border border-border-dark rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-primary cursor-pointer">
                                 <option>Activo</option>
                                 <option>En Pausa</option>
                              </select>
                           </div>
                        </div>
                        <button className="w-full py-3 bg-primary text-white text-[10px] font-black uppercase rounded-2xl hover:bg-primary-hover shadow-lg shadow-primary/10 transition-all flex items-center justify-center gap-2">
                           <UserPlus size={16} /> Registrar nuevo perfil ahora
                        </button>
                     </section>

                     {/* E. Notes */}
                     <section className="space-y-4 pb-20">
                        <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2"><FileText size={14} className="text-primary" /> Notas Operativas</h3>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-4">
                           <div className="flex gap-2">
                              <input type="text" placeholder="Añadir nota de seguimiento..." className="flex-1 bg-background-dark border border-border-dark rounded-xl px-4 py-2 text-[10px] text-white outline-none focus:border-primary" />
                              <button className="p-2 bg-primary text-white rounded-xl hover:bg-primary-hover"><Plus size={18} /></button>
                           </div>
                           <div className="text-[10px] text-text-secondary italic text-center">No hay notas recientes para esta agencia.</div>
                        </div>
                     </section>
                  </div>
               </div>
            </div>
         )}

         {/* --- MODAL (NUEVA AGENCIA) --- */}
         {isModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
               <div className="relative w-full max-w-2xl bg-surface-dark border border-border-dark rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 border-b border-border-dark flex justify-between items-center bg-[#151b26]">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20"><UserPlus size={24} /></div>
                        <div>
                           <h2 className="text-xl font-black text-white uppercase tracking-tight">Registrar Nueva Agencia</h2>
                           <p className="text-[10px] text-text-secondary font-black uppercase tracking-widest">Configuración inicial del canal operativo</p>
                        </div>
                     </div>
                     <button onClick={() => setIsModalOpen(false)} className="text-text-secondary hover:text-white transition-colors"><X size={24} /></button>
                  </div>

                  <form className="p-8 grid grid-cols-2 gap-6" onSubmit={handleSaveAgency}>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-1">Dueño Responsable</label>
                        <select
                           value={formData.owner}
                           onChange={e => setFormData({ ...formData, owner: e.target.value })}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3.5 px-4 text-sm text-white focus:border-primary outline-none transition-all cursor-pointer"
                        >
                           {OWNERS_LIST.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-1">Casa de Apuestas</label>
                        <select
                           value={formData.bookie}
                           onChange={e => setFormData({ ...formData, bookie: e.target.value })}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3.5 px-4 text-sm text-white focus:border-primary outline-none transition-all cursor-pointer"
                        >
                           {BOOKMAKERS.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-1">Rake %</label>
                        <input
                           type="number" min={25} max={45}
                           value={formData.rake}
                           onChange={e => setFormData({ ...formData, rake: parseInt(e.target.value) })}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3.5 px-4 text-sm text-white focus:border-primary outline-none"
                        />
                     </div>
                     <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-1">Perfiles Mín. Recomendados</label>
                        <input
                           type="number" min={1}
                           value={formData.minProfiles}
                           onChange={e => setFormData({ ...formData, minProfiles: parseInt(e.target.value) })}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3.5 px-4 text-sm text-white focus:border-primary outline-none"
                        />
                     </div>
                     <div className="col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black text-text-secondary uppercase ml-1">Enlace Backoffice</label>
                        <input
                           type="url" placeholder="https://..."
                           value={formData.url}
                           onChange={e => setFormData({ ...formData, url: e.target.value })}
                           className="w-full bg-background-dark border border-border-dark rounded-2xl py-3.5 px-4 text-sm text-white focus:border-primary outline-none"
                        />
                     </div>

                     {/* ASISTENTE GEMINI PLACEHOLDER */}
                     <div className="col-span-2 p-6 bg-primary/5 border border-primary/20 rounded-[2rem] space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <Sparkles className="text-primary" size={20} />
                              <span className="text-[11px] font-black text-primary uppercase tracking-widest">Asistente IA (Gemini)</span>
                           </div>
                           <span className="text-[8px] font-black bg-primary text-white px-2 py-0.5 rounded-full uppercase">Alpha</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                           <button type="button" className="p-2.5 bg-background-dark border border-border-dark rounded-xl text-[9px] font-bold text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1.5 group">
                              <BadgeCheck size={14} className="group-hover:text-primary" />
                              Generar Credenciales
                           </button>
                           <button type="button" className="p-2.5 bg-background-dark border border-border-dark rounded-xl text-[9px] font-bold text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1.5 group">
                              <FileText size={14} className="group-hover:text-primary" />
                              Redactar Nota Ops
                           </button>
                           <button type="button" className="p-2.5 bg-background-dark border border-border-dark rounded-xl text-[9px] font-bold text-slate-400 hover:text-white transition-all flex flex-col items-center gap-1.5 group">
                              <Calendar size={14} className="group-hover:text-primary" />
                              Sugerir Plan Perfiles
                           </button>
                        </div>
                     </div>

                     <div className="col-span-2 flex justify-end gap-3 pt-4 border-t border-border-dark">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3 text-xs font-black uppercase text-text-secondary hover:text-white transition-all">Cancelar</button>
                        <button type="submit" className="flex items-center gap-2 px-10 py-3 bg-primary text-white text-xs font-black uppercase rounded-2xl hover:bg-primary-hover shadow-xl shadow-primary/20 active:scale-95 transition-all">
                           <Save size={18} /> Guardar Agencia
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
};

// --- SUB-COMPONENTS ---

const InteractivePanel = ({ title, subtitle, icon, color, data, warning, onClick, isFilter, isActive }: any) => {
   const styles: any = {
      success: 'text-success bg-success/10 border-success/20 group-hover:border-success/40 shadow-success/5',
      danger: 'text-danger bg-danger/10 border-danger/20 group-hover:border-danger/40 shadow-danger/5',
      primary: 'text-primary bg-primary/10 border-primary/20 group-hover:border-primary/40 shadow-primary/5',
      warning: 'text-warning bg-warning/10 border-warning/20 group-hover:border-warning/40 shadow-warning/5',
   };

   return (
      <div
         onClick={onClick}
         className={`bg-surface-dark border rounded-[2rem] p-6 shadow-xl transition-all group cursor-pointer flex flex-col h-full ${isActive ? 'ring-2 ring-primary ring-offset-4 ring-offset-[#0a0b0e]' : 'border-border-dark'}`}
      >
         <div className="flex items-center justify-between mb-5">
            <div className={`p-3 rounded-2xl border ${styles[color]}`}>{icon}</div>
            <div className="text-right">
               <h3 className="text-[11px] font-black text-white uppercase tracking-widest">{title}</h3>
               <p className="text-[9px] text-text-secondary font-bold mt-0.5">{subtitle}</p>
            </div>
         </div>
         <div className="space-y-3 flex-1">
            {data.map((item: any, i: number) => (
               <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-1 rounded-lg">
                  <div>
                     <p className="text-[10px] font-black text-white">{item.id}</p>
                     <p className="text-[8px] text-text-secondary font-bold uppercase">{item.sub}</p>
                  </div>
                  <span className={`text-[11px] font-mono font-black ${color === 'success' ? 'text-success' : color === 'danger' ? 'text-danger' : 'text-primary'}`}>{item.val}</span>
               </div>
            ))}
         </div>
         {warning && <p className="mt-4 text-[8px] text-text-secondary italic leading-tight text-center opacity-60">“{warning}”</p>}
         {isFilter && (
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-center">
               <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${isActive ? 'text-primary' : 'text-slate-500'}`}>
                  {isActive ? 'Filtro Activo' : 'Ver Todos'} <ArrowRight size={10} />
               </span>
            </div>
         )}
      </div>
   );
};

const FilterChip = ({ label, icon, active }: any) => (
   <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase transition-all ${active ? 'bg-primary/20 border-primary text-primary' : 'bg-background-dark border-border-dark text-text-secondary hover:text-white'}`}>
      {icon} {label} <ChevronDown size={10} className="opacity-50" />
   </button>
);

export default OperationalNetwork;
