
import React, { useState, useMemo, useEffect } from 'react';
import {
  Zap, Search, Filter, ChevronDown, ChevronUp,
  User, History, StickyNote, X, Trophy, Target,
  Settings, CheckCircle2, PauseCircle, Calendar, Layers,
  TrendingUp, Globe, Shield, CreditCard, Hash, MapPin,
  Activity, ExternalLink, Monitor, UserCheck, LayoutGrid,
  AlertCircle, TrendingDown, MousePointer2, ChevronRight,
  CheckSquare, Square, AlertTriangle, Info, ArrowRight,
  RefreshCw, DollarSign, Wallet, ArrowDownCircle, ArrowUpCircle,
  Copy, UserRound, Briefcase, Sliders, Sparkles, Mail, Verified,
  Store, Building2, Terminal, Clock, Loader2, Trash2, Edit, Plus, Save
} from 'lucide-react';
import { useDistribuidoras, useCasas } from '../hooks';
import { Modal, Input, Button } from '../components/ui';
import { apiClient } from '../services/api.client';
import type { NavigationMenuItem } from '../types/navigation.types';

// --- INTEGRATION INTERFACE ---
const copyToClipboard = (text: string) => {
  navigator.clipboard.writeText(text);
  alert(`Copiado al portapapeles: ${text}`);
};

const openOwnerBrowser = (ownerId: string) => {
  alert(`AdsPower: Abriendo navegador del dueño [ID: ${ownerId}]`);
};

const openDirectPageBrowser = (profileId: string, url: string) => {
  alert(`AdsPower: Lanzando navegador con página directa para [${profileId}]`);
};

// --- TYPES ---
type Sport = 'Fútbol' | 'Tenis' | 'Basket';
type PlayerType = 'Agresivo' | 'Moderado' | 'Casual' | 'High-Roller';
type ViewStatus = 'TODOS' | 'HOY' | 'DESCANSO';

interface Transaction {
  id: string;
  type: 'Deposito' | 'Retiro';
  amount: number;
  date: string;
  status: 'Completado' | 'Pendiente' | 'Rechazado';
  method: 'USDT' | 'Skrill' | 'Transferencia' | 'Neteller';
  networkId: string;
}

interface Agency {
  id: string;
  name: string;
  owner: string;
  rake: number;
  totalGGR: number;
}

interface Profile {
  id: string;
  username: string;
  password?: string;
  owner: string;
  ownerId: string;
  bookie: string;
  backofficeUrl: string;
  ecosystem: string;
  sport: Sport;
  playerType: PlayerType;
  avgStake: number;
  opsThisWeek: number;
  avgOpsPerWeek: number;
  balance: number;
  notes: string;
  city: string;
  ip: string;
  preferences: string;
  schedule: string[];
  agencyId?: string;
  finances: Transaction[];
}

interface AlertItem {
  id: string;
  title: string;
  impact: string;
  severity: 'Critical' | 'Risk' | 'Execution' | 'Finance' | 'Info';
  time: string;
  icon: React.ReactNode;
  cause: string;
  action: string;
  targetId?: string; // ID del perfil o casa afectada
}

interface OpConfig {
  minProfilesPerHouse: number;
  minCapitalPerHouse: number;
  lowBalanceThreshold: number;
  targetDailyVolume: number;
}

// --- MOCK DATA ---
const MOCK_AGENCIES: Record<string, Agency> = {
  'AG-UIO-01': { id: 'AG-UIO-01', name: 'Agencia Quito Centro', owner: 'Nicolás Ullauri', rake: 35, totalGGR: 12500 },
  'AG-GYE-02': { id: 'AG-GYE-02', name: 'Agencia Guayaquil Puerto', owner: 'Santiago Muñoz', rake: 30, totalGGR: 8400 },
};

// --- MOCK DATA FOR FALLBACK ---
const FALLBACK_ECOSISTEMAS = [
  { id: 'ALTENAR', name: 'ALTENAR (Ecuador)', houses: ['OKIBET', 'ECUABET', 'DATABET'] },
  { id: '1XGROUP', name: '1X GROUP', houses: ['1XBET', 'MELBET', 'BETWINNER'] },
  { id: 'VICTORY', name: 'VICTORY / SHARK', houses: ['VICTORY365', 'SHARKBET'] }
];

const INITIAL_PROFILES: Profile[] = Array.from({ length: 45 }).map((_, i) => {
  const eco = FALLBACK_ECOSISTEMAS[i % FALLBACK_ECOSISTEMAS.length];
  const house = eco.houses[i % eco.houses.length];
  const isEcuador = eco.id === 'ALTENAR';
  const agencyId = isEcuador ? (i % 2 === 0 ? 'AG-UIO-01' : 'AG-GYE-02') : undefined;
  const owner = agencyId ? MOCK_AGENCIES[agencyId].owner : (i % 3 === 0 ? 'Jonathan Ayala' : 'Paul Jiménez');

  return {
    id: `${house}_${i < 10 ? '0' : ''}${i}`,
    username: `user_pro_${i}`,
    password: `pwd_${Math.random().toString(36).substring(7)}`,
    owner,
    ownerId: `OWN-${i % 3 + 1}`,
    bookie: house,
    backofficeUrl: `https://${house.toLowerCase()}.com`,
    ecosystem: eco.id,
    sport: (['Fútbol', 'Tenis', 'Basket'] as Sport[])[i % 3],
    playerType: (['Agresivo', 'Moderado', 'Casual', 'High-Roller'] as PlayerType[])[i % 4],
    avgStake: [50, 100, 300, 500][i % 4],
    opsThisWeek: Math.floor(Math.random() * 20),
    avgOpsPerWeek: 15 + (i % 10),
    balance: Math.floor(100 + Math.random() * 4500),
    notes: "",
    city: isEcuador ? 'Quito, EC' : 'Lima, PE',
    ip: `192.168.1.${100 + i}`,
    preferences: 'Mercados Líquidos, Live',
    schedule: Array.from({ length: 31 }).map(() => (Math.random() > 0.3 ? 'A' : 'B')),
    agencyId,
    finances: Array.from({ length: 5 }).map((_, ti) => ({
      id: `TX-${2000 + i + ti}`,
      type: ti % 3 === 0 ? 'Retiro' : 'Deposito',
      amount: Math.floor(200 + Math.random() * 800),
      date: `2024-05-${10 + ti}`,
      status: 'Completado',
      method: 'USDT',
      networkId: `TRX-${Math.random().toString(36).toUpperCase().substring(0, 10)}`
    }))
  };
});

const OperationalCenter: React.FC = () => {
  // --- API DATA ---
  const {
    distribuidoras: apiEcosistemas,
    isLoading: isLoadingEcosistemas,
    createDistribuidora,
    updateDistribuidora,
    deleteDistribuidora,
    refetch: refetchDistribuidoras
  } = useDistribuidoras();

  const {
    createCasa,
    updateCasa,
    deleteCasa,
    refetch: refetchCasas
  } = useCasas();

  // Used for display logic
  const ECOSISTEMAS = apiEcosistemas.length > 0 ? apiEcosistemas : FALLBACK_ECOSISTEMAS;

  // --- CRUD STATE ---
  const [isDistModalOpen, setIsDistModalOpen] = useState(false);
  const [isCasaModalOpen, setIsCasaModalOpen] = useState(false);
  const [editingDist, setEditingDist] = useState<any | null>(null);
  const [editingCasa, setEditingCasa] = useState<any | null>(null);
  const [creatingHouseForDistId, setCreatingHouseForDistId] = useState<number | null>(null);
  const [isLoadingAction, setIsLoadingAction] = useState(false);

  // Forms State
  const [distForm, setDistForm] = useState({ nombre: '', deportes: [], descripcion: '', activo: true });
  const [casaForm, setCasaForm] = useState({ nombre: '', url_backoffice: '', perfiles_minimos_req: 3, capital_objetivo: 5000, activo: true });

  // --- STATE ---
  const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [expandedEcos, setExpandedEcos] = useState<string[]>([]);
  const [expandedHouses, setExpandedHouses] = useState<string[]>([]);
  const [plannerView, setPlannerView] = useState<'Semana' | 'Mes'>('Semana');
  const [drawerTab, setDrawerTab] = useState<'resumen' | 'dna' | 'finanzas'>('resumen');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showPlanner, setShowPlanner] = useState(false);

  // Operational Config (Las reglas)
  const [opConfig, setOpConfig] = useState<OpConfig>({
    minProfilesPerHouse: 3,
    minCapitalPerHouse: 2000,
    lowBalanceThreshold: 450,
    targetDailyVolume: 6000
  });

  // Filtros
  const [search, setSearch] = useState('');
  const [sportFilter, setSportFilter] = useState<'TODOS' | Sport>('TODOS');
  const [stakeFilter, setStakeFilter] = useState<'TODOS' | number>('TODOS');
  const [statusFilter, setStatusFilter] = useState<ViewStatus>('TODOS');

  // Load navigation sections from API to control visibility
  useEffect(() => {
    const loadSectionVisibility = async () => {
      try {
        const data = await apiClient.getNavigation();

        // Find the "Centro Operativo" menu item
        const operationalCenterMenu = data.navigation.find(
          (item: NavigationMenuItem) => item.code === 'ops_center'
        );

        if (operationalCenterMenu && operationalCenterMenu.sections) {
          // Map sections to visibility states
          const sections = operationalCenterMenu.sections;

          // Set visibility based on sections returned from API
          setShowAlerts(sections.some(s => s.code === 'co-alertas'));
          setShowExplorer(sections.some(s => s.code === 'co-explorer'));
          setShowPlanner(sections.some(s => s.code === 'co-planner'));
        } else {
          // If no sections found, hide all by default
          setShowAlerts(false);
          setShowExplorer(false);
          setShowPlanner(false);
        }
      } catch (error) {
        console.error('Error loading section visibility:', error);
        // On error, show all sections as fallback
        setShowAlerts(true);
        setShowExplorer(true);
        setShowPlanner(true);
      }
    };

    loadSectionVisibility();
  }, []);

  // Time context
  const now = new Date();
  const todayIdx = now.getDate() - 1;
  const currentMonth = now.toLocaleString('es-ES', { month: 'long' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDayOfWeek = (now.getDay() || 7) - 1; // 0=LUN, 6=DOM

  // --- GENERAR ALERTAS DINÁMICAS BASADAS EN REGLAS ---
  const operationalAlerts = useMemo((): AlertItem[] => {
    const alerts: AlertItem[] = [];

    // 1. Alerta de perfiles con saldo bajo
    const lowBalProfiles = profiles.filter(p => p.balance < opConfig.lowBalanceThreshold);
    if (lowBalProfiles.length > 0) {
      alerts.push({
        id: 'low-bal-group',
        title: `Saldo Crítico en ${lowBalProfiles.length} perfiles`,
        impact: `Capital < $${opConfig.lowBalanceThreshold}`,
        severity: 'Critical',
        time: 'En vivo',
        icon: <AlertTriangle size={16} />,
        cause: 'Fuga de capital por apuestas consecutivas o falta de recarga.',
        action: 'Ejecutar recarga masiva USDT a los perfiles afectados.',
        targetId: lowBalProfiles[0].id
      });
    }

    // 2. Alerta de falta de perfiles activos por casa
    ECOSISTEMAS.forEach(eco => {
      eco.houses.forEach(house => {
        const activeInHouse = profiles.filter(p => p.bookie === house && p.schedule[todayIdx] === 'A').length;
        if (activeInHouse < opConfig.minProfilesPerHouse) {
          alerts.push({
            id: `low-profiles-${house}`,
            title: `Escasez operativa en ${house}`,
            impact: `${activeInHouse}/${opConfig.minProfilesPerHouse} Activos`,
            severity: 'Risk',
            time: 'Ciclo Actual',
            icon: <Building2 size={16} />,
            cause: 'La rotación A/B dejó muy pocos perfiles activos hoy.',
            action: 'Forzar activación de al menos 2 perfiles adicionales en el planificador.',
            targetId: house
          });
        }
      });
    });

    // 3. Alerta de Inactividad (Ejemplo estático para demostrar funcionalidad)
    alerts.push({
      id: 'stale-profile-1',
      title: 'Inactividad prolongada: ECUABET_04',
      impact: '> 48h sin OPS',
      severity: 'Execution',
      time: 'Hace 4h',
      icon: <Clock size={16} />,
      cause: 'Perfil en modo A pero sin registrar movimientos en el backoffice.',
      action: 'Verificar credenciales o conectividad de AdsPower.',
      targetId: 'ECUABET_04'
    });

    return alerts;
  }, [profiles, opConfig, todayIdx]);

  // --- CALCULATIONS ---
  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const matchesSearch = p.id.toLowerCase().includes(search.toLowerCase()) || p.owner.toLowerCase().includes(search.toLowerCase());
      const matchesSport = sportFilter === 'TODOS' || p.sport === sportFilter;
      const matchesStake = stakeFilter === 'TODOS' || p.avgStake === stakeFilter;
      const isA = p.schedule[todayIdx] === 'A';

      if (statusFilter === 'HOY') return matchesSearch && matchesSport && matchesStake && isA;
      if (statusFilter === 'DESCANSO') return matchesSearch && matchesSport && matchesStake && !isA;
      return matchesSearch && matchesSport && matchesStake;
    });
  }, [profiles, search, sportFilter, stakeFilter, statusFilter, todayIdx]);

  const stats = useMemo(() => {
    const activeToday = profiles.filter(p => p.schedule[todayIdx] === 'A');
    const restingToday = profiles.filter(p => p.schedule[todayIdx] === 'B');
    const capitalActivos = activeToday.reduce((acc, p) => acc + p.balance, 0);
    return { activeCount: activeToday.length, restingCount: restingToday.length, capitalActivos };
  }, [profiles, todayIdx]);

  const selectedProfile = useMemo(() => profiles.find(p => p.id === selectedProfileId), [profiles, selectedProfileId]);
  const selectedAgency = useMemo(() => selectedProfile?.agencyId ? MOCK_AGENCIES[selectedProfile.agencyId] : null, [selectedProfile]);

  // --- HANDLERS ---
  const toggleEco = (id: string) => setExpandedEcos(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  const toggleHouse = (id: string) => setExpandedHouses(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);

  const handleAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      alert("Auditoría de Red Completa. Se han actualizado las alertas tácticas.");
    }, 1500);
  };

  const toggleDayStatus = (profileId: string, dayIdx: number) => {
    setProfiles(prev => prev.map(p => {
      if (p.id !== profileId) return p;
      const newSchedule = [...p.schedule];
      newSchedule[dayIdx] = newSchedule[dayIdx] === 'A' ? 'B' : 'A';
      return { ...p, schedule: newSchedule };
    }));
  };

  // --- CRUD HANDLERS ---

  const resetDistForm = () => setDistForm({ nombre: '', deportes: [], descripcion: '', activo: true });
  const resetCasaForm = () => setCasaForm({ nombre: '', url_backoffice: '', perfiles_minimos_req: 3, capital_objetivo: 5000, activo: true });

  const handleOpenCreateDist = () => {
    setEditingDist(null);
    resetDistForm();
    setIsDistModalOpen(true);
  };

  const handleOpenEditDist = (dist: any) => {
    setEditingDist(dist);
    setDistForm({ nombre: dist.nombre, deportes: dist.deportes || [], descripcion: dist.descripcion || '', activo: dist.activo });
    setIsDistModalOpen(true);
  };

  const handleSubmitDist = async () => {
    setIsLoadingAction(true);
    try {
      if (editingDist) {
        await updateDistribuidora(editingDist.id_distribuidora, distForm);
      } else {
        await createDistribuidora(distForm);
      }
      setIsDistModalOpen(false);
      resetDistForm();
    } catch (e) {
      alert("Error al guardar distribuidora");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteDist = async (id: number) => {
    if (!confirm('¿Eliminar esta distribuidora y todas sus casas asociadas?')) return;
    setIsLoadingAction(true);
    try {
      await deleteDistribuidora(id);
    } catch (e) {
      alert('Error al eliminar distribuidora');
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleOpenCreateCasa = (distId: number) => {
    setCreatingHouseForDistId(distId);
    setEditingCasa(null);
    resetCasaForm();
    setIsCasaModalOpen(true);
  };

  const handleOpenEditCasa = (casa: any) => {
    setEditingCasa(casa);
    setCasaForm({
      nombre: casa.nombre,
      url_backoffice: casa.url_backoffice || '',
      perfiles_minimos_req: casa.perfiles_minimos_req || 3,
      capital_objetivo: casa.capital_total ? parseFloat(casa.capital_total) : 5000,
      activo: casa.activo
    });
    setIsCasaModalOpen(true);
  };

  const handleSubmitCasa = async () => {
    setIsLoadingAction(true);
    try {
      const payload: any = { ...casaForm };
      if (editingCasa) {
        await updateCasa(editingCasa.id_casa, payload);
      } else {
        payload.distribuidora = creatingHouseForDistId;
        await createCasa(payload);
      }
      setIsCasaModalOpen(false);
      resetCasaForm();
      // Refetch distribuidoras to update tree
      await refetchDistribuidoras();
    } catch (e) {
      alert("Error al guardar casa de apuestas");
    } finally {
      setIsLoadingAction(false);
    }
  };

  const handleDeleteCasa = async (id: number) => {
    if (!confirm('¿Eliminar esta casa de apuestas?')) return;
    setIsLoadingAction(true);
    try {
      await deleteCasa(id);
      await refetchDistribuidoras();
    } catch (e) {
      alert('Error al eliminar casa');
    } finally {
      setIsLoadingAction(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-[#e1e1e1] overflow-hidden font-sans selection:bg-[#00ff88]/30">

      {/* 1. HEADER - Title bar (always sticky) */}
      <header className="px-4 sm:px-6 py-3 sm:py-4 bg-[#0d0d0d] border-b border-[#1f1f1f] flex-shrink-0 z-30 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-[#00ff88]/10 rounded-xl sm:rounded-2xl border border-[#00ff88]/20 text-[#00ff88] shadow-lg shadow-[#00ff88]/5">
              <Zap size={20} className="fill-current sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tight leading-none italic">Centro Operativo</h1>
              <p className="text-[9px] sm:text-[10px] text-[#666666] font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-1 sm:mt-1.5 flex items-center gap-2">
                <div className="size-1.5 sm:size-2 rounded-full bg-[#00ff88] animate-pulse"></div> Network Live
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button onClick={() => setIsConfigOpen(true)} className={`p-2 sm:p-3 bg-[#121212] border rounded-lg sm:rounded-xl hover:text-white transition-all active:scale-95 ${isConfigOpen ? 'border-primary text-primary shadow-lg shadow-primary/10' : 'border-[#1f1f1f] text-slate-400'}`}>
              <Sliders size={18} />
            </button>
            <button onClick={handleAudit} disabled={isAuditing} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-[#00ff88] text-black text-[10px] sm:text-[11px] font-black uppercase rounded-lg sm:rounded-xl hover:bg-[#00e67a] shadow-xl shadow-[#00ff88]/10 transition-all active:scale-95 disabled:opacity-50">
              {isAuditing ? <RefreshCw size={14} className="animate-spin" /> : <Shield size={14} />}
              <span className="hidden xs:inline">Auditar Red</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. METRICS - Fixed on desktop, scrolls on mobile */}
      <div className="hidden md:block px-4 sm:px-6 py-3 sm:py-4 bg-[#0d0d0d] border-b border-[#1f1f1f] flex-shrink-0">
        <div className="grid grid-cols-4 gap-4">
          <HeaderMetric label="Capital Total" value={`$${stats.capitalActivos.toLocaleString()}`} sub="Hoy (A)" color="primary" icon={<DollarSign size={16} />} />
          <HeaderMetric label="Meta Diaria" value={`$${opConfig.targetDailyVolume.toLocaleString()}`} sub="Configurada" color="white" icon={<Target size={16} />} />
          <HeaderMetric label="Perfiles Hoy" value={stats.activeCount} sub="Listos" color="success" icon={<User size={16} />} />
          <HeaderMetric label="Descanso" value={stats.restingCount} sub="Flota B" color="warning" icon={<PauseCircle size={16} />} />
        </div>
      </div>

      {/* 3. MAIN SCROLL AREA */}
      <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8 pb-32 sm:pb-40">

        {/* METRICS - Only visible on mobile, scrolls with content */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          <HeaderMetric label="Capital Total" value={`$${stats.capitalActivos.toLocaleString()}`} sub="Hoy (A)" color="primary" icon={<DollarSign size={16} />} />
          <HeaderMetric label="Meta Diaria" value={`$${opConfig.targetDailyVolume.toLocaleString()}`} sub="Configurada" color="white" icon={<Target size={16} />} />
          <HeaderMetric label="Perfiles Hoy" value={stats.activeCount} sub="Listos" color="success" icon={<User size={16} />} />
          <HeaderMetric label="Descanso" value={stats.restingCount} sub="Flota B" color="warning" icon={<PauseCircle size={16} />} />
        </div>


        {/* CENTRO DE ALERTAS TÁCTICAS (FUNCIONAL) */}
        {showAlerts && (
          <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-3xl overflow-hidden shadow-2xl" id="co-alertas">
            <div className="px-6 py-4 border-b border-[#1f1f1f] bg-white/[0.02] flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-rose-500 animate-pulse"></div>
                <h2 className="text-xs font-black text-white uppercase tracking-[0.2em]">Centro de Alertas de Flota</h2>
              </div>
              <div className="flex gap-2">
                {['TODAS', 'CRITICAL', 'RISK', 'EXECUTION'].map(cat => (
                  <button key={cat} className={`px-3 py-1 text-[9px] font-black rounded-lg transition-all ${cat === 'TODAS' ? 'bg-[#1a1a1a] text-white border border-[#333]' : 'text-[#666] hover:text-white'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              {operationalAlerts.length === 0 ? (
                <div className="p-10 text-center text-[#444] text-xs font-bold uppercase italic">No se detectan discrepancias en la red.</div>
              ) : operationalAlerts.map((alertItem) => {
                const isExpanded = expandedAlertId === alertItem.id;
                const severityColors: any = {
                  Critical: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
                  Risk: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                  Execution: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
                  Info: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                };

                return (
                  <div key={alertItem.id} className="border-b border-[#1f1f1f] last:border-0">
                    <div
                      onClick={() => setExpandedAlertId(isExpanded ? null : alertItem.id)}
                      className={`px-6 py-5 flex items-start gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors ${isExpanded ? 'bg-white/[0.03]' : ''}`}
                    >
                      <div className={`p-2.5 rounded-xl border flex-shrink-0 ${severityColors[alertItem.severity]}`}>
                        {alertItem.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className={`text-xs font-bold ${alertItem.severity === 'Critical' ? 'text-white' : 'text-slate-300'}`}>
                            {alertItem.title}
                          </p>
                          <span className="text-[10px] text-[#444] font-bold">{alertItem.time}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 bg-[#111] border border-[#1f1f1f] rounded text-[9px] font-black text-[#666] uppercase">{alertItem.impact}</span>
                          <span className={`text-[9px] font-black uppercase ${alertItem.severity === 'Critical' ? 'text-rose-500' : 'text-[#666]'}`}>{alertItem.severity}</span>
                        </div>
                      </div>
                      <ChevronDown size={16} className={`text-[#333] mt-1 transition-transform ${isExpanded ? 'rotate-180 text-white' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="px-16 pb-6 pt-0 animate-in slide-in-from-top-1 duration-200">
                        <div className="bg-[#050505] border border-[#1f1f1f] rounded-2xl p-6 space-y-5">
                          <div>
                            <h4 className="text-[10px] font-black text-white uppercase mb-1.5 tracking-widest">Causa Operativa:</h4>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{alertItem.cause}</p>
                          </div>
                          <div>
                            <h4 className="text-[10px] font-black text-white uppercase mb-1.5 tracking-widest">Acción Recomendada:</h4>
                            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">{alertItem.action}</p>
                          </div>
                          <div className="flex justify-end pt-2">
                            <button onClick={() => alert(`Ejecutando acción para ${alertItem.targetId}`)} className="px-6 py-2.5 bg-[#00ff88] text-black text-[10px] font-black uppercase rounded-lg hover:bg-[#00e67a] transition-all shadow-lg shadow-[#00ff88]/10">
                              Resolver Incidencia
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* EXPLORADOR DE ECOSISTEMAS (CON FILTRO DE STAKE) */}
        {showExplorer && (
          <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-3xl shadow-xl overflow-hidden" id="co-explorer">
            <div className="px-8 py-6 border-b border-[#1f1f1f] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Globe size={22} className="text-[#00ff88]" />
                <h2 className="text-sm font-black text-white uppercase tracking-widest">Explorador de Flota</h2>
              </div>

              <Button onClick={handleOpenCreateDist} variant="primary" icon={<Plus size={14} />}>
                Nueva Distribuidora
              </Button>

              <div className="flex flex-wrap items-center gap-3 bg-[#111] p-2 rounded-2xl border border-[#1f1f1f]">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#666666]" size={14} />
                  <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar ID o Dueño..." className="bg-[#050505] border border-[#1f1f1f] rounded-xl py-2 pl-10 pr-4 text-[10px] outline-none focus:border-[#00ff88] w-48 text-white font-bold" />
                </div>
                <FilterDropdown label="Deporte DNA" value={sportFilter} onChange={setSportFilter} options={['TODOS', 'Fútbol', 'Tenis', 'Basket']} />
                <FilterDropdown label="Filtrar Stake" value={stakeFilter} onChange={setStakeFilter} options={['TODOS', 50, 100, 300, 500]} />
                <div className="flex gap-1 ml-2">
                  {(['TODOS', 'HOY', 'DESCANSO'] as ViewStatus[]).map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all ${statusFilter === s ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'text-[#666666] hover:text-white'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {ECOSISTEMAS.map(eco => {
                // Compatibility handling for ID
                const ecoId = eco.id_distribuidora || eco.id;
                const ecoName = eco.nombre || eco.name;

                const ecoProfiles = filteredProfiles.filter(p => p.ecosystem === ecoId.toString() || p.ecosystem === ecoName);
                if (ecoProfiles.length === 0 && search) return null;
                const isExpanded = expandedEcos.includes(ecoId.toString());

                return (
                  <div key={ecoId} className="border border-[#1f1f1f] rounded-3xl overflow-hidden bg-[#050505]/30">
                    <div onClick={() => toggleEco(ecoId.toString())} className="px-6 py-5 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl ${isExpanded ? 'bg-[#00ff88] text-black shadow-lg' : 'bg-[#00ff88]/10 text-[#00ff88]'}`}>
                          <Layers size={22} />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight">{ecoName}</h3>
                      </div>

                      <div className="flex items-center gap-2 mr-4" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => handleOpenEditDist(eco)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Edit size={14} /></button>
                        <button onClick={() => handleDeleteDist(typeof ecoId === 'string' ? parseInt(ecoId) : ecoId)} className="p-1.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                      </div>

                      <ChevronDown size={22} className={`text-[#666666] transition-transform ${isExpanded ? 'rotate-180 text-[#00ff88]' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="p-4 bg-[#0d0d0d] space-y-4 animate-in slide-in-from-top-2">
                        <div className="flex justify-end mb-2">
                          <Button onClick={() => handleOpenCreateCasa(typeof ecoId === 'string' ? parseInt(ecoId) : ecoId)} variant="ghost" className="text-xs py-1 h-8 border border-[#333]" icon={<Plus size={12} />}>Agregar Casa</Button>
                        </div>

                        {(eco.casas || eco.houses || []).map((house: any) => {
                          // Compatibility handling
                          const isStringHouse = typeof house === 'string';
                          const houseName = isStringHouse ? house : house.nombre;
                          const houseId = isStringHouse ? house : house.id_casa;

                          const houseProfiles = ecoProfiles.filter(p => p.bookie === houseName);
                          const hKey = `${ecoId}_${houseName}`;
                          const houseIsExpanded = expandedHouses.includes(hKey);
                          if (houseProfiles.length === 0 && search) return null;

                          const totalBal = houseProfiles.reduce((acc, p) => acc + p.balance, 0);
                          const activeBal = houseProfiles.filter(p => p.schedule[todayIdx] === 'A').reduce((acc, p) => acc + p.balance, 0);

                          return (
                            <div key={houseId} className="border border-white/5 rounded-2xl overflow-hidden">
                              <div onClick={() => toggleHouse(hKey)} className="px-5 py-4 bg-[#111] flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-[#151515]">
                                <div className="flex items-center gap-4">
                                  <Shield size={16} className="text-[#00ff88]" />
                                  <div>
                                    <span className="text-sm font-black text-white uppercase tracking-widest">{houseName}</span>
                                    <p className="text-[9px] text-[#666666] font-bold">Total: {houseProfiles.length} perfiles</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-8">
                                  <div className="text-right">
                                    <p className="text-[8px] text-[#666666] font-black uppercase">Capital Activo Hoy</p>
                                    <p className="text-xs font-black text-[#00ff88]">${activeBal.toLocaleString()}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-[8px] text-[#666666] font-black uppercase">Capital Total</p>
                                    <p className="text-xs font-black text-white">${totalBal.toLocaleString()}</p>
                                  </div>
                                  <ChevronDown size={18} className={`text-[#666666] transition-transform ${houseIsExpanded ? 'rotate-180' : ''}`} />
                                </div>

                                {!isStringHouse && (
                                  <div className="flex items-center gap-1 border-l border-white/10 pl-4 ml-4" onClick={(e) => e.stopPropagation()}>
                                    <button onClick={() => handleOpenEditCasa(house)} className="p-1.5 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"><Edit size={12} /></button>
                                    <button onClick={() => handleDeleteCasa(houseId)} className="p-1.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={12} /></button>
                                  </div>
                                )}
                              </div>

                              {houseIsExpanded && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-[#080808] animate-in zoom-in-95">
                                  {houseProfiles.map(p => {
                                    const isA = p.schedule[todayIdx] === 'A';
                                    const hasAgency = !!p.agencyId;
                                    return (
                                      <div key={p.id} onClick={() => setSelectedProfileId(p.id)} className={`p-4 bg-[#0d0d0d] border rounded-2xl flex items-center justify-between hover:border-[#00ff88] transition-all group cursor-pointer ${isA ? 'border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/5' : 'border-white/5 opacity-60'} ${hasAgency ? 'ring-1 ring-primary/20' : ''}`}>
                                        <div className="flex items-center gap-3">
                                          <div className={`size-10 rounded-xl flex items-center justify-center font-black text-[11px] ${isA ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-[#121212] text-slate-500'}`}>
                                            {p.id.split('_').pop()}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <p className={`text-[12px] font-black group-hover:text-[#00ff88] transition-colors ${isA ? 'text-white' : 'text-slate-500'}`}>{p.id}</p>
                                              {hasAgency && (
                                                <PortalTooltip text="Perfil gestionado por Agencia">
                                                  <div className="p-1 bg-primary/20 rounded border border-primary/20"><Building2 size={8} className="text-primary" /></div>
                                                </PortalTooltip>
                                              )}
                                            </div>
                                            <p className="text-[9px] text-[#666666] font-bold uppercase tracking-widest">{p.owner.split(' ')[0]} • {p.sport}</p>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-[11px] font-mono font-black ${isA ? 'text-white' : 'text-slate-500'}`}>${p.balance.toLocaleString()}</p>
                                          <p className={`text-[8px] font-black uppercase ${isA ? 'text-[#00ff88]' : 'text-slate-600'}`}>{isA ? 'Activo' : 'Descanso'}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* PLANIFICADOR CON RESALTADO DE HOY (FUNCIONAL) */}
        {
          showPlanner && (
            <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] shadow-xl overflow-hidden mb-20" id="co-planner">
              <div className="p-3 sm:p-5 lg:p-8 border-b border-[#1f1f1f] bg-gradient-to-r from-[#111] to-[#0d0d0d] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Calendar size={18} className="text-[#00ff88] sm:w-6 sm:h-6" />
                  <div>
                    <h2 className="text-[11px] sm:text-sm font-black text-white uppercase tracking-wider sm:tracking-widest">Planificador Táctico de Rotación</h2>
                    <p className="text-[8px] sm:text-[10px] text-[#666666] font-bold uppercase mt-0.5 sm:mt-1 tracking-tight sm:tracking-tighter">Mes: {currentMonth.toUpperCase()} • DÍA {todayIdx + 1}</p>
                  </div>
                </div>
                <div className="flex bg-[#050505] p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-[#1f1f1f]">
                  <button onClick={() => setPlannerView('Semana')} className={`px-3 sm:px-5 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-black uppercase rounded-md sm:rounded-lg transition-all ${plannerView === 'Semana' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'text-[#666666]'}`}>Semana</button>
                  <button onClick={() => setPlannerView('Mes')} className={`px-3 sm:px-5 py-1.5 sm:py-2 text-[8px] sm:text-[9px] font-black uppercase rounded-md sm:rounded-lg transition-all ${plannerView === 'Mes' ? 'bg-[#00ff88] text-black shadow-lg shadow-[#00ff88]/20' : 'text-[#666666]'}`}>Mes</button>
                </div>
              </div>

              <div className="p-3 sm:p-5 lg:p-6 overflow-x-auto no-scrollbar">
                <div className="min-w-[600px] space-y-2 sm:space-y-3 lg:space-y-4">
                  <div className="flex items-center gap-2 sm:gap-3 px-1 sm:px-2">
                    <div className="w-32 sm:w-40 lg:w-44 shrink-0"></div>
                    <div className="flex-1 flex gap-1 sm:gap-1.5">
                      {Array.from({ length: plannerView === 'Semana' ? 7 : daysInMonth }).map((_, i) => {
                        const isToday = plannerView === 'Semana' ? i === currentDayOfWeek : i === todayIdx;
                        return (
                          <div key={i} className={`flex-1 text-center py-2 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl lg:rounded-2xl border transition-all ${isToday ? 'border-[#00ff88] bg-[#00ff88]/10 shadow-[0_0_15px_rgba(0,255,136,0.1)] ring-1 ring-[#00ff88]/50' : 'border-transparent'}`}>
                            <p className={`text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase ${isToday ? 'text-[#00ff88]' : 'text-[#444]'}`}>
                              {plannerView === 'Semana' ? ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i] : (i + 1)}
                            </p>
                            {isToday && (
                              <div className="flex flex-col items-center mt-1 sm:mt-2">
                                <div className="size-1 sm:size-1.5 bg-[#00ff88] rounded-full animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.8)]"></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {profiles.slice(0, 15).map(p => (
                    <div key={p.id} className="flex items-center gap-2 sm:gap-3 group">
                      <div onClick={() => setSelectedProfileId(p.id)} className="w-32 sm:w-40 lg:w-44 shrink-0 cursor-pointer p-2 sm:p-2.5 lg:p-3 bg-[#050505] border border-transparent hover:border-[#1f1f1f] rounded-lg sm:rounded-xl transition-all flex items-center justify-between pr-2 sm:pr-3">
                        <div>
                          <p className="text-[10px] sm:text-[11px] font-black text-white group-hover:text-[#00ff88] truncate">{p.id}</p>
                          <p className="text-[7px] sm:text-[8px] text-[#666666] font-bold uppercase tracking-wider mt-0.5">{p.owner.split(' ')[0]}</p>
                        </div>
                        {p.agencyId && <Building2 size={10} className="text-primary/30" />}
                      </div>
                      <div className="flex-1 flex gap-1 sm:gap-1.5">
                        {Array.from({ length: plannerView === 'Semana' ? 7 : daysInMonth }).map((_, i) => {
                          const status = p.schedule[i];
                          const isToday = plannerView === 'Semana' ? i === currentDayOfWeek : i === todayIdx;
                          return (
                            <div
                              key={i}
                              onClick={() => toggleDayStatus(p.id, i)}
                              className={`flex-1 h-7 sm:h-8 lg:h-10 rounded-md sm:rounded-lg border flex items-center justify-center text-[9px] sm:text-[10px] font-black cursor-pointer transition-all hover:scale-105 active:scale-90 ${isToday ? 'ring-1 sm:ring-2 ring-[#00ff88] ring-offset-2 sm:ring-offset-3 ring-offset-[#0d0d0d]' : ''
                                } ${status === 'A' ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]' : 'bg-[#121212] border-white/5 text-[#444]'
                                }`}
                            >
                              {status}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
      </main>

      {/* --- MODAL DE CONFIGURACIÓN DE REGLAS --- */}
      {
        isConfigOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/95 backdrop-blur-xl animate-in fade-in" onClick={() => setIsConfigOpen(false)} />
            <div className="relative w-full max-w-xl bg-[#0d0d0d] border border-[#1f1f1f] rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
              <div className="flex items-center gap-4 mb-8 text-white">
                <div className="p-4 bg-[#00ff88]/20 text-[#00ff88] rounded-2xl"><Terminal size={32} /></div>
                <div>
                  <h2 className="text-2xl font-black uppercase tracking-tight leading-none mb-2">Protocolos de Auditoría</h2>
                  <p className="text-[10px] text-[#666666] font-bold uppercase tracking-widest">Configuración de umbrales para alertas automáticas</p>
                </div>
              </div>

              <div className="space-y-8 mb-10">
                <ConfigSlider label="Perfiles activos mín. por Casa" value={opConfig.minProfilesPerHouse} min={1} max={6} unit="" onChange={v => setOpConfig({ ...opConfig, minProfilesPerHouse: v })} />
                <ConfigSlider label="Umbral de Saldo Crítico" value={opConfig.lowBalanceThreshold} min={100} max={1000} step={50} unit="$" onChange={v => setOpConfig({ ...opConfig, lowBalanceThreshold: v })} />
                <ConfigSlider label="Capital de Seguridad por Casa" value={opConfig.minCapitalPerHouse} min={1000} max={10000} step={500} unit="$" onChange={v => setOpConfig({ ...opConfig, minCapitalPerHouse: v })} />
                <ConfigSlider label="Volumen Diario Objetivo" value={opConfig.targetDailyVolume} min={1000} max={15000} step={500} unit="$" onChange={v => setOpConfig({ ...opConfig, targetDailyVolume: v })} />
              </div>

              <button onClick={() => { setIsConfigOpen(false); handleAudit(); }} className="w-full py-5 bg-[#00ff88] text-black text-xs font-black uppercase rounded-2xl hover:bg-[#00e67a] shadow-xl shadow-[#00ff88]/20 transition-all active:scale-95">
                Aplicar Reglas y Auditar Ahora
              </button>
            </div>
          </div>
        )
      }

      {/* --- PROFILE DRAWER --- */}
      {
        selectedProfile && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedProfileId(null)} />
            <div className="relative w-full lg:max-w-2xl bg-[#0d0d0d] border-l border-[#1f1f1f] h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-400">

              <div className="p-4 sm:p-6 lg:p-10 border-b border-[#1f1f1f] flex justify-between items-center bg-[#111] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 pointer-events-none hidden sm:block"><Monitor size={100} className="text-[#00ff88] lg:w-[150px] lg:h-[150px]" /></div>
                <div className="flex items-center gap-3 sm:gap-6 lg:gap-8 relative z-10">
                  <div className="size-12 sm:size-16 lg:size-24 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] bg-gradient-to-br from-[#00ff88]/20 to-[#00ff88]/5 border-2 border-[#00ff88]/30 flex items-center justify-center font-black text-xl sm:text-3xl lg:text-5xl text-[#00ff88] uppercase shadow-xl lg:shadow-2xl">
                    {selectedProfile.id[0]}
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-2xl lg:text-4xl font-black text-white tracking-tighter leading-none mb-1 sm:mb-2 lg:mb-4">{selectedProfile.id}</h2>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/20">{selectedProfile.bookie}</span>
                      <div className="flex flex-col">
                        <span className="text-[9px] sm:text-[11px] font-black text-[#00ff88] uppercase tracking-wide sm:tracking-[0.2em]">{selectedProfile.owner}</span>
                        {selectedAgency && <span className="text-[8px] sm:text-[9px] text-primary/60 font-bold uppercase flex items-center gap-1"><Building2 size={8} className="sm:w-[10px] sm:h-[10px]" /> {selectedAgency.name}</span>}
                      </div>
                    </div>
                  </div>
                </div>
                <button onClick={() => setSelectedProfileId(null)} className="p-2 sm:p-3 lg:p-4 hover:bg-white/5 rounded-xl sm:rounded-2xl lg:rounded-3xl text-[#666666] hover:text-white transition-all"><X size={20} className="sm:w-6 sm:h-6 lg:w-8 lg:h-8" /></button>
              </div>

              <div className="px-3 sm:px-6 lg:px-10 bg-[#121212] border-b border-[#1f1f1f] flex overflow-x-auto no-scrollbar">
                <DrawerTab active={drawerTab === 'resumen'} onClick={() => setDrawerTab('resumen')} label="Resumen" icon={<LayoutGrid size={14} />} />
                <DrawerTab active={drawerTab === 'dna'} onClick={() => setDrawerTab('dna')} label="DNA Operativo" icon={<Activity size={14} />} />
                <DrawerTab active={drawerTab === 'finanzas'} onClick={() => setDrawerTab('finanzas')} label="Finanzas" icon={<Wallet size={14} />} />
              </div>

              <div className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-12 space-y-4 sm:space-y-6 lg:space-y-12 pb-24 sm:pb-32 lg:pb-48 custom-scrollbar">
                {drawerTab === 'resumen' && (
                  <div className="space-y-12 animate-in fade-in">

                    {selectedAgency && (
                      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-[#00ff88]/10 to-transparent border border-[#00ff88]/20 rounded-xl sm:rounded-2xl lg:rounded-[2.5rem] relative overflow-hidden group">
                        <Briefcase size={40} className="absolute -right-2 -bottom-2 text-[#00ff88] opacity-5 group-hover:scale-110 transition-transform sm:w-[60px] sm:h-[60px] lg:w-[80px] lg:h-[80px]" />
                        <h3 className="text-[9px] sm:text-[10px] font-black uppercase text-[#00ff88] tracking-[0.2em] sm:tracking-[0.3em] mb-2 sm:mb-4">Información de Agencia</h3>
                        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:gap-8">
                          <IdentityItem label="Agencia" val={selectedAgency.name} icon={<Building2 size={12} />} />
                          <IdentityItem label="Rake" val={`${selectedAgency.rake}%`} icon={<TrendingUp size={12} />} />
                          <IdentityItem label="Responsable" val={selectedAgency.owner} icon={<UserRound size={12} />} />
                          <IdentityItem label="GGR Casa" val={`$${selectedAgency.totalGGR.toLocaleString()}`} icon={<DollarSign size={12} />} />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3 sm:space-y-5">
                      <h3 className="text-[10px] sm:text-[11px] font-black uppercase text-[#666666] tracking-[0.3em] sm:tracking-[0.4em] flex items-center gap-2">
                        <Monitor size={14} className="text-[#00ff88]" /> Lanzadores AdsPower
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-5">
                        <button onClick={() => openOwnerBrowser(selectedProfile.ownerId)} className="p-3 sm:p-4 lg:p-6 bg-[#121212] border border-[#1f1f1f] rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center sm:flex-col gap-3 sm:gap-4 group hover:border-[#00ff88]/50 transition-all shadow-lg sm:shadow-xl">
                          <div className="p-2 sm:p-3.5 bg-white/5 rounded-lg sm:rounded-2xl border border-white/5 group-hover:text-[#00ff88] transition-colors"><UserCheck size={20} className="sm:w-7 sm:h-7" /></div>
                          <div className="text-left">
                            <p className="text-[11px] sm:text-sm font-black text-white uppercase leading-none mb-0.5 sm:mb-1.5">Abrir Perfil Dueño</p>
                            <p className="text-[9px] sm:text-[10px] text-[#666666] font-bold uppercase">{selectedProfile.owner}</p>
                          </div>
                        </button>
                        <button onClick={() => openDirectPageBrowser(selectedProfile.id, selectedProfile.backofficeUrl)} className="p-3 sm:p-4 lg:p-6 bg-[#00ff88]/10 border border-[#00ff88]/20 rounded-xl sm:rounded-2xl lg:rounded-3xl flex items-center sm:flex-col gap-3 sm:gap-4 group hover:bg-[#00ff88]/20 transition-all shadow-lg sm:shadow-xl">
                          <div className="p-2 sm:p-3.5 bg-[#00ff88] text-black rounded-lg sm:rounded-2xl shadow-xl shadow-[#00ff88]/20"><MousePointer2 size={20} className="sm:w-7 sm:h-7" /></div>
                          <div className="text-left">
                            <p className="text-[11px] sm:text-sm font-black text-white uppercase leading-none mb-0.5 sm:mb-1.5">Acceso Backoffice</p>
                            <p className="text-[9px] sm:text-[10px] text-[#00ff88] font-bold uppercase">Control Casa</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6">
                      <DetailStat label="Saldo Real" val={`$${selectedProfile.balance.toLocaleString()}`} color="emerald" icon={<CreditCard size={18} />} />
                      <DetailStat label="Stake Prom." val={`$${selectedProfile.avgStake}`} color="primary" icon={<Target size={18} />} />
                      <DetailStat label="Ops Semanales" val={selectedProfile.opsThisWeek} sub={`Meta: ${selectedProfile.avgOpsPerWeek}`} color="white" icon={<Activity size={18} />} />
                    </div>
                  </div>
                )}

                {drawerTab === 'dna' && (
                  <div className="space-y-12 animate-in slide-in-from-bottom-2">
                    <section className="space-y-8">
                      <h3 className="text-[11px] font-black uppercase text-[#666666] tracking-[0.4em] border-b border-[#1f1f1f] pb-4 flex items-center gap-2"><Trophy size={16} className="text-[#00ff88]" /> Perfil del Jugador</h3>
                      <div className="grid grid-cols-2 gap-10">
                        <IdentityItem label="Tipo de Jugador" val={selectedProfile.playerType} icon={<UserRound size={16} />} />
                        <IdentityItem label="Deporte DNA" val={selectedProfile.sport} icon={<Trophy size={16} />} />
                        <IdentityItem label="IP Operativa" val={selectedProfile.ip} icon={<Globe size={16} />} />
                        <IdentityItem label="Ciudad / Sede" val={selectedProfile.city} icon={<MapPin size={16} />} />
                        <IdentityItem label="Preferencias" val={selectedProfile.preferences} icon={<Settings size={16} />} />
                        <IdentityItem label="Nivel de Cuenta" val="Maestra / Auditada" icon={<Shield size={16} />} />
                      </div>
                    </section>

                    <section className="space-y-6">
                      <h3 className="text-[11px] font-black uppercase text-[#666666] tracking-[0.4em] flex items-center gap-2"><Shield size={16} className="text-[#00ff88]" /> Credenciales Tácticas</h3>
                      <div className="grid grid-cols-2 gap-5">
                        <CredentialBox label="Usuario Casa" value={selectedProfile.username} />
                        <CredentialBox label="Contraseña" value={selectedProfile.password || '••••••••'} />
                      </div>
                    </section>
                  </div>
                )}

                {drawerTab === 'finanzas' && (
                  <div className="space-y-8 animate-in fade-in relative">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Historial Financiero</h3>
                      <div className="text-[10px] text-text-secondary font-bold uppercase">Últimos 5 movimientos</div>
                    </div>

                    <div className="space-y-4">
                      {selectedProfile.finances.map((tx) => (
                        <div key={tx.id} onClick={() => setSelectedTx(tx)} className="p-5 bg-[#050505] border border-white/5 rounded-[1.5rem] flex justify-between items-center hover:border-[#00ff88] transition-all cursor-pointer group">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${tx.type === 'Deposito' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                              {tx.type === 'Deposito' ? <ArrowDownCircle size={22} /> : <ArrowUpCircle size={22} />}
                            </div>
                            <div>
                              <p className="text-sm font-black text-white uppercase tracking-tight">{tx.type} • {tx.method}</p>
                              <p className="text-[10px] text-[#666666] font-bold uppercase">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-mono font-black ${tx.type === 'Deposito' ? 'text-emerald-500' : 'text-rose-500'}`}>{tx.type === 'Deposito' ? '+' : '-'}${tx.amount}</p>
                            <p className="text-[9px] text-[#666666] font-black uppercase tracking-widest">{tx.status}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedTx && (
                      <div className="absolute top-0 right-[-2rem] w-80 bg-[#121212] border border-[#1f1f1f] rounded-[2.5rem] p-8 shadow-2xl animate-in slide-in-from-right z-50">
                        <div className="flex justify-between items-center mb-8">
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">Detalle de Operación</h4>
                          <button onClick={() => setSelectedTx(null)} className="p-1 hover:bg-white/5 rounded-lg text-[#666666]"><X size={18} /></button>
                        </div>
                        <div className="space-y-8">
                          <div className="bg-[#050505] p-6 rounded-2xl border border-white/5 space-y-6">
                            <IdentityItem label="Hash Operativo" val={selectedTx.networkId} />
                            <IdentityItem label="Método" val={selectedTx.method} />
                            <IdentityItem label="Timestamp" val={selectedTx.date + ' 12:30'} />
                            <IdentityItem label="Auditoría" val="Validado por Red" icon={<CheckCircle2 size={14} className="text-emerald-500" />} />
                          </div>
                          <div className="p-5 bg-primary/10 rounded-2xl border border-primary/20 text-center">
                            <p className="text-[10px] font-black text-[#00ff88] uppercase mb-1">Monto de Operación</p>
                            <p className="text-3xl font-black text-white tracking-tighter">${selectedTx.amount}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <section className="space-y-4 pt-12 border-t border-[#1f1f1f]">
                  <h3 className="text-[11px] font-black text-[#666666] uppercase tracking-[0.4em] flex items-center gap-2"><StickyNote size={14} /> Bitácora de Mando</h3>
                  <textarea className="w-full bg-[#050505] border border-[#1f1f1f] rounded-3xl p-8 text-xs text-slate-300 outline-none focus:border-[#00ff88] min-h-[160px] resize-none leading-relaxed transition-all" placeholder="Registra observaciones sobre este perfil..." />
                </section>
              </div>

              <div className="p-3 sm:p-6 lg:p-10 border-t border-[#1f1f1f] bg-[#111]/95 flex gap-2 sm:gap-4 sticky bottom-0 z-30 backdrop-blur-2xl">
                <button onClick={() => setSelectedProfileId(null)} className="flex-1 py-2.5 sm:py-4 lg:py-5 text-[10px] sm:text-[11px] font-black uppercase rounded-lg sm:rounded-xl lg:rounded-2xl bg-[#121212] text-white hover:bg-[#1f1f1f] transition-all">Cerrar Terminal</button>
                <button
                  onClick={() => toggleDayStatus(selectedProfile.id, todayIdx)}
                  className={`flex-[2] py-2.5 sm:py-4 lg:py-5 text-[10px] sm:text-[11px] font-black uppercase rounded-lg sm:rounded-xl lg:rounded-2xl transition-all shadow-lg sm:shadow-2xl active:scale-95 ${selectedProfile.schedule[todayIdx] === 'A' ? 'bg-rose-500/10 border border-rose-500/30 text-rose-500 hover:bg-rose-500/20' : 'bg-[#00ff88] text-black hover:bg-[#00e67a]'}`}
                >
                  {selectedProfile.schedule[todayIdx] === 'A' ? 'Enviar a Descanso (B)' : 'Activar Perfil (A)'}
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* --- CRUD MODALS --- */}
      <Modal isOpen={isDistModalOpen} onClose={() => setIsDistModalOpen(false)} title={editingDist ? "Editar Distribuidora" : "Nueva Distribuidora"}>
        <div className="space-y-4">
          <Input
            label="Nombre de Distribuidora"
            value={distForm.nombre}
            onChange={(e) => setDistForm({ ...distForm, nombre: e.target.value })}
            placeholder="Ej. ALTENAR (Ecuador)"
          />

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Descripción (Opcional)</label>
            <textarea
              value={distForm.descripcion}
              onChange={(e) => setDistForm({ ...distForm, descripcion: e.target.value })}
              className="w-full bg-[#050505] border border-[#1f1f1f] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#444] focus:outline-none focus:border-[#00ff88] focus:ring-1 focus:ring-[#00ff88]/20 transition-all min-h-[100px] resize-none custom-scrollbar"
              placeholder="Añade detalles operativos sobre esta distribuidora..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2 block">Estado</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDistForm({ ...distForm, activo: !distForm.activo })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${distForm.activo ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' : 'bg-[#111] text-[#666] border border-[#333]'}`}
              >
                {distForm.activo ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsDistModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitDist} isLoading={isLoadingAction} icon={<Save size={14} />}>Guardar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isCasaModalOpen} onClose={() => setIsCasaModalOpen(false)} title={editingCasa ? "Editar Casa de Apuestas" : "Nueva Casa de Apuestas"}>
        <div className="space-y-4">
          <Input
            label="Nombre Casa"
            value={casaForm.nombre}
            onChange={(e) => setCasaForm({ ...casaForm, nombre: e.target.value })}
            placeholder="Ej. ECUABET"
          />
          <Input
            label="URL Backoffice"
            value={casaForm.url_backoffice}
            onChange={(e) => setCasaForm({ ...casaForm, url_backoffice: e.target.value })}
            placeholder="https://admin.ecuabet.com"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Perfiles Mínimos"
              type="number"
              value={casaForm.perfiles_minimos_req}
              onChange={(e) => setCasaForm({ ...casaForm, perfiles_minimos_req: parseInt(e.target.value) })}
            />
            <Input
              label="Capital Objetivo ($)"
              type="number"
              value={casaForm.capital_objetivo}
              onChange={(e) => setCasaForm({ ...casaForm, capital_objetivo: parseFloat(e.target.value) })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-2 block">Estado</label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCasaForm({ ...casaForm, activo: !casaForm.activo })}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${casaForm.activo ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/30' : 'bg-[#111] text-[#666] border border-[#333]'}`}
              >
                {casaForm.activo ? 'ACTIVO' : 'INACTIVO'}
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setIsCasaModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmitCasa} isLoading={isLoadingAction} icon={<Save size={14} />}>Guardar</Button>
          </div>
        </div>
      </Modal>

    </div >
  );
};

// --- SUB-COMPONENTS ---

const HeaderMetric = ({ label, value, sub, icon, color = 'white' }: any) => {
  const colorMap: any = {
    primary: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20',
    success: 'text-[#00ff88] bg-[#00ff88]/10 border-[#00ff88]/20',
    warning: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    danger: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
  };
  return (
    <div className="p-5 bg-[#0d0d0d] border border-[#1f1f1f] rounded-[1.5rem] flex items-center gap-5 hover:border-[#00ff88]/30 transition-all group">
      <div className={`p-3.5 rounded-2xl border transition-all group-hover:scale-110 ${colorMap[color]}`}>{icon}</div>
      <div>
        <p className="text-[10px] font-black text-[#666666] uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className={`text-2xl font-black leading-none tracking-tighter ${color === 'warning' ? 'text-amber-500' : color === 'danger' ? 'text-rose-500' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-[9px] text-[#666666] font-bold mt-1.5 uppercase tracking-widest">{sub}</p>}
      </div>
    </div>
  );
};

const FilterDropdown = ({ label, value, onChange, options }: any) => (
  <div className="flex flex-col gap-1.5 min-w-[100px]">
    <span className="text-[8px] font-black text-[#666666] uppercase ml-1">{label}</span>
    <select
      value={value}
      onChange={e => onChange(e.target.value === 'TODOS' ? 'TODOS' : isNaN(Number(e.target.value)) ? e.target.value : Number(e.target.value))}
      className="bg-[#050505] border border-[#1f1f1f] rounded-xl py-1.5 px-3 text-[10px] font-bold text-white outline-none cursor-pointer focus:border-[#00ff88] transition-all"
    >
      {options.map((o: any) => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const DetailStat = ({ label, val, color, sub, icon }: any) => (
  <div className="p-6 bg-[#050505] border border-[#1f1f1f] rounded-[2rem] text-center group hover:border-[#00ff88]/40 transition-all shadow-inner relative overflow-hidden">
    <div className="flex items-center justify-center gap-2 mb-3">
      <div className="text-[#00ff88] opacity-50">{icon}</div>
      <p className="text-[10px] font-black text-[#666666] uppercase tracking-widest leading-none">{label}</p>
    </div>
    <p className={`text-3xl font-black tracking-tighter group-hover:scale-110 transition-transform ${color === 'primary' ? 'text-[#00ff88]' : color === 'emerald' ? 'text-[#00ff88]' : 'text-white'}`}>{val}</p>
    {sub && <p className="text-[9px] text-[#666666] font-bold uppercase mt-2">{sub}</p>}
  </div>
);

const ConfigSlider = ({ label, value, min, max, unit, step = 1, onChange }: any) => (
  <div className="space-y-4">
    <div className="flex justify-between items-end px-1">
      <label className="text-[11px] font-black uppercase text-[#666666] tracking-[0.2em]">{label}</label>
      <span className="text-xl font-black text-[#00ff88] tabular-nums">{unit}{value.toLocaleString()}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseInt(e.target.value))} className="w-full h-1.5 bg-[#1f1f1f] rounded-lg appearance-none cursor-pointer accent-[#00ff88]" />
  </div>
);

const CredentialBox = ({ label, value }: any) => (
  <div className="p-5 bg-[#050505] border border-[#1f1f1f] rounded-2xl flex items-center justify-between group hover:border-[#00ff88] transition-all">
    <div className="min-w-0">
      <p className="text-[9px] font-black text-[#666666] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-bold text-white truncate font-mono">{value}</p>
    </div>
    <button onClick={() => copyToClipboard(value)} className="p-2 text-[#666666] hover:text-[#00ff88] transition-colors"><Copy size={16} /></button>
  </div>
);

const IdentityItem = ({ label, val, icon }: any) => (
  <div className="flex flex-col gap-1.5 group">
    <div className="flex items-center gap-3">
      <div className="text-[#00ff88]/60 transition-colors group-hover:text-[#00ff88]">{icon}</div>
      <p className="text-[9px] text-[#666666] font-black uppercase tracking-widest">{label}</p>
    </div>
    <p className="text-xs text-white font-bold tracking-tight leading-tight pl-7">{val}</p>
  </div>
);

const DrawerTab = ({ active, onClick, label, icon }: any) => (
  <button onClick={onClick} className={`flex-shrink-0 flex items-center gap-3 px-8 py-5 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${active ? 'bg-[#00ff88]/10 border-[#00ff88] text-[#00ff88]' : 'border-transparent text-[#666666] hover:text-white hover:bg-white/5'}`}>
    {icon} {label}
  </button>
);

const PortalTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const handleMouseEnter = () => { if (triggerRef.current) { const rect = triggerRef.current.getBoundingClientRect(); setCoords({ top: rect.top - 10, left: rect.left + (rect.width / 2) }); setVisible(true); } };
  return (
    <>
      <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)} className="inline-flex cursor-help">{children}</div>
      {visible && (
        <div className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-[11px] leading-tight rounded-lg shadow-xl border border-white/10 backdrop-blur-md max-w-[220px] text-center animate-in fade-in zoom-in-95 duration-150" style={{ top: coords.top, left: coords.left }}>
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div>
        </div>
      )}
    </>
  );
};

export default OperationalCenter;
