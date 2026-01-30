import React, { useState, useMemo, useEffect } from 'react';
import {
    Search, ChevronDown, Layers, Edit, Trash2, Plus, Shield, Building2,
    Store, ExternalLink, Save, AlertCircle, Loader2
} from 'lucide-react';
import { useDistribuidoras, useCasas, useDeportes } from '../hooks';
import { Modal, Input, Button } from './ui';
import { perfilesService } from '../services/perfiles.service';
import { casasService } from '../services';

// --- TYPES (Copied for self-sufficiency) ---
type Sport = 'Fútbol' | 'Tenis' | 'Basket';
type PlayerType = 'Agresivo' | 'Moderado' | 'Casual' | 'High-Roller';
type ViewStatus = 'TODOS' | 'HOY' | 'DESCANSO';

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
}

// --- MOCK DATA FOR FALLBACK ---
const FALLBACK_ECOSISTEMAS = [
    { id: 'ALTENAR', name: 'ALTENAR (Ecuador)', houses: ['OKIBET', 'ECUABET', 'DATABET'] },
    { id: '1XGROUP', name: '1X GROUP', houses: ['1XBET', 'MELBET', 'BETWINNER'] },
    { id: 'VICTORY', name: 'VICTORY / SHARK', houses: ['VICTORY365', 'SHARKBET'] }
];

const INITIAL_PROFILES: Profile[] = [];

// --- HELPER COMPONENTS ---
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

const DistribuidorasSection: React.FC = () => {
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

    const {
        deportes,
        isLoading: isLoadingDeportes
    } = useDeportes();

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
    const [distForm, setDistForm] = useState<{ nombre: string; deportes: number[]; descripcion: string; activo: boolean }>({ nombre: '', deportes: [], descripcion: '', activo: true });
    const [casaForm, setCasaForm] = useState({
        nombre: '',
        url_backoffice: '',
        puede_tener_agencia: false,
        activo: true,
        perfiles_minimos_req: 3,
        capital_total: 0
    });
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(t);
    }, [toast]);

    // --- STATE ---
    const [profiles, setProfiles] = useState<Profile[]>(INITIAL_PROFILES);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Note: Needs to coordinate with parent or use direct state?
    // Since we replaced the topology which had MOCK_PROFILES, we need to load real profiles here to populate the view.
    // The original component used useDistribuidoras and perfilesService.getAll()

    // --- PLANNING STATE (Simplified for this view) ---
    // In OperatorTerminal, we might not have the full planning map logic yet, 
    // but let's assume 'A' status for today based on profiles logic or fallback.
    // We'll fetch profiles similar to OperationalCenter.

    const now = new Date();
    const todayIdx = now.getDate() - 1;

    // Fetch profiles effect
    useEffect(() => {
        const fetchProfiles = async () => {
            try {
                setIsLoadingProfiles(true);
                const res = await perfilesService.getAll();
                const mappedProfiles: Profile[] = res.results.map((p: any) => ({
                    id: p.nombre_usuario, // Using username as ID for compatibility
                    internalId: p.id_perfil, // Needed for backend updates
                    username: p.nombre_usuario,
                    owner: 'Agencia', // Or p.agencia_nombre 
                    ownerId: p.agencia.toString(),
                    bookie: p.casa_nombre || 'Unknown',
                    backofficeUrl: p.url_acceso_backoffice || '',
                    ecosystem: p.distribuidora_nombre || 'ALTENAR', // Now uses backend data
                    sport: 'Fútbol',
                    playerType: p.tipo_jugador as PlayerType,
                    avgStake: p.stake_promedio || 0,
                    opsThisWeek: p.ops_semanales || 0,
                    avgOpsPerWeek: 0,
                    balance: p.saldo_real || 0,
                    notes: p.preferencias || '',
                    city: p.ubicacion_ciudad || 'Unknown',
                    ip: p.ip_operativa,
                    preferences: p.preferencias,
                    schedule: Array(31).fill('A'), // Mock schedule as 'A' (Active) for now since we don't have the full planner context here yet
                    agencyId: p.agencia.toString(),
                }));
                setProfiles(mappedProfiles);
            } catch (err) {
                console.error("Failed to load profiles", err);
            } finally {
                setIsLoadingProfiles(false);
            }
        };
        fetchProfiles();
    }, []);

    const [expandedEcos, setExpandedEcos] = useState<string[]>([]);
    const [expandedHouses, setExpandedHouses] = useState<string[]>([]);

    // Filtros
    const [search, setSearch] = useState('');
    const [sportFilter, setSportFilter] = useState<'TODOS' | Sport>('TODOS');
    const [stakeFilter, setStakeFilter] = useState<'TODOS' | number>('TODOS');
    const [statusFilter, setStatusFilter] = useState<ViewStatus>('TODOS');

    // --- CALCULATIONS ---
    const filteredProfiles = useMemo(() => {
        return profiles.filter(p => {
            const matchesSearch = p.id.toLowerCase().includes(search.toLowerCase()) || p.owner.toLowerCase().includes(search.toLowerCase());
            const matchesSport = sportFilter === 'TODOS' || p.sport === sportFilter;
            const matchesStake = stakeFilter === 'TODOS' || p.avgStake === stakeFilter;
            const isA = p.schedule[todayIdx] === 'A'; // Using our mocked schedule 'A'

            if (statusFilter === 'HOY') return matchesSearch && matchesSport && matchesStake && isA;
            if (statusFilter === 'DESCANSO') return matchesSearch && matchesSport && matchesStake && !isA;
            return matchesSearch && matchesSport && matchesStake;
        });
    }, [profiles, search, sportFilter, stakeFilter, statusFilter, todayIdx]);

    // --- HANDLERS ---
    const toggleEco = (id: string) => setExpandedEcos(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
    const toggleHouse = (id: string) => setExpandedHouses(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);

    // Normaliza booleanos desde backend; retorna null si no existe
    const normalizeBool = (value: any): boolean | null => {
        if (value === undefined || value === null) return null;
        if (typeof value === 'string') {
            const v = value.toLowerCase();
            return v === 'true' || v === '1' || v === 'yes' || v === 'si';
        }
        return value === true || value === 1;
    };

    // --- CRUD HANDLERS ---

    const resetDistForm = () => setDistForm({ nombre: '', deportes: [], descripcion: '', activo: true });
    const resetCasaForm = () => {
        setCasaForm({
            nombre: '',
            url_backoffice: '',
            puede_tener_agencia: false,
            activo: true,
            perfiles_minimos_req: 3,
            capital_total: 0
        });
        setFormErrors({});
    };

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
        if (!distId) {
            alert('✗ Error: ID de distribuidora inválido');
            return;
        }
        setCreatingHouseForDistId(distId);
        setEditingCasa(null);
        resetCasaForm();
        setIsCasaModalOpen(true);
    };

    const handleOpenEditCasa = async (casa: any) => {
        try {
            setIsLoadingAction(true);
            const detail = casa.id_casa ? await casasService.getById(casa.id_casa) : casa;

            setEditingCasa(detail);
            setCasaForm({
                nombre: detail.nombre,
                url_backoffice: detail.url_backoffice || '',
                puede_tener_agencia: normalizeBool(detail.puede_tener_agencia ?? detail.permite_agencia ?? detail.permite_agencias ?? detail.puede_agencias),
                activo: normalizeBool(detail.activo),
                perfiles_minimos_req: detail.perfiles_minimos_req ?? detail.perfiles_minimos ?? 3,
                capital_total: detail.capital_total ? parseFloat(detail.capital_total) : 0
            });
            setFormErrors({});
            setIsCasaModalOpen(true);
        } catch (e) {
            console.error('Error cargando casa para edición', e);
            alert('No se pudo cargar la casa para edición');
        } finally {
            setIsLoadingAction(false);
        }
    };

    const validateCasaForm = () => {
        const errors: Record<string, string> = {};

        if (!casaForm.nombre.trim()) {
            errors.nombre = 'El nombre es requerido';
        }

        if (!casaForm.url_backoffice.trim()) {
            errors.url_backoffice = 'La URL del backoffice es requerida';
        } else {
            try {
                new URL(casaForm.url_backoffice);
            } catch {
                errors.url_backoffice = 'URL inválida (debe incluir http:// o https://)';
            }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmitCasa = async () => {
        if (!validateCasaForm()) return;

        if (!editingCasa && !creatingHouseForDistId) {
            alert('✗ Error: No se ha seleccionado una distribuidora');
            return;
        }

        setIsLoadingAction(true);
        try {
            const payload: any = {
                nombre: casaForm.nombre,
                url_backoffice: casaForm.url_backoffice,
                puede_tener_agencia: casaForm.puede_tener_agencia,
                activo: casaForm.activo
            };

            if (editingCasa) {
                payload.perfiles_minimos_req = casaForm.perfiles_minimos_req;
                await updateCasa(editingCasa.id_casa, payload);
                setToast({ message: 'Casa de apuestas actualizada', type: 'success' });
            } else {
                payload.distribuidora = creatingHouseForDistId;
                await createCasa(payload);
                setToast({ message: 'Casa de apuestas creada', type: 'success' });
            }

            setIsCasaModalOpen(false);
            resetCasaForm();
            await refetchDistribuidoras();
        } catch (e: any) {
            let errorMsg = 'Error desconocido';
            if (e.response?.data) {
                if (typeof e.response.data === 'object' && !e.response.data.message) {
                    const errors = Object.entries(e.response.data)
                        .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
                        .join('\n');
                    errorMsg = errors || JSON.stringify(e.response.data);
                } else {
                    errorMsg = e.response.data.message || e.response.data.detail || JSON.stringify(e.response.data);
                }
            } else if (e.message) {
                errorMsg = e.message;
            }

            alert(`✗ Error al guardar casa de apuestas:\n\n${errorMsg}`);
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

    const toggleSportSelection = (id: number) => {
        setDistForm(prev => {
            const exists = prev.deportes.includes(id);
            return {
                ...prev,
                deportes: exists
                    ? prev.deportes.filter(d => d !== id)
                    : [...prev.deportes, id]
            };
        });
    };

    return (
        <section className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-3xl shadow-xl overflow-hidden" id="co-explorer">
            {toast && (
                <div className="fixed top-4 right-4 z-50 animate-in fade-in-50 duration-200 drop-shadow-2xl">
                    <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${toast.type === 'success' ? 'bg-[#0f2018] border-[#00ff88]/30 text-[#bfffe0]' : 'bg-[#2a0d0d] border-[#ff4d4d]/30 text-[#ffd7d7]'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${toast.type === 'success' ? 'bg-[#00ff88]' : 'bg-[#ff4d4d]'}`} />
                        <span className="text-sm font-semibold whitespace-nowrap">{toast.message}</span>
                        <button onClick={() => setToast(null)} className="text-xs text-[#888] hover:text-white transition-colors">Cerrar</button>
                    </div>
                </div>
            )}

            <div className="px-8 py-6 border-b border-[#1f1f1f] flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <Layers size={22} className="text-[#00ff88]" />
                    <h2 className="text-sm font-black text-white uppercase tracking-widest">Distribuidoras De Datos</h2>
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
                                        const isStringHouse = typeof house === 'string';
                                        const houseName = isStringHouse ? house : house.nombre;
                                        const houseId = isStringHouse ? house : house.id_casa;
                                        const allowAgencies = normalizeBool(
                                            !isStringHouse && (
                                                house.puede_tener_agencia ??
                                                house.permite_agencia ??
                                                house.permite_agencias ??
                                                house.puede_agencias ??
                                                house.allow_agencies ??
                                                house.allows_agencies
                                            )
                                        );

                                        const houseProfiles = ecoProfiles.filter(p => p.bookie?.toLowerCase() === houseName?.toLowerCase());
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
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-black text-white uppercase tracking-widest">{houseName}</span>
                                                                {allowAgencies === null ? (
                                                                    <span className="px-2 py-0.5 text-[9px] rounded-full border flex items-center gap-1 shadow-sm bg-[#111] border-[#333] text-[#aaa]">
                                                                        <Building2 size={10} className="text-[#777]" />
                                                                        Sin dato
                                                                    </span>
                                                                ) : (
                                                                    <span className={`px-2 py-0.5 text-[9px] rounded-full border flex items-center gap-1 shadow-sm ${allowAgencies ? 'bg-[#0f2018] border-[#00ff88]/40 text-[#bfffe0]' : 'bg-[#1c0f0f] border-[#ff4d4d]/40 text-[#ffd7d7]'}`}>
                                                                        <Building2 size={10} className={allowAgencies ? 'text-[#00ff88]' : 'text-[#ff8080]'} />
                                                                        {allowAgencies ? 'Permite agencias' : 'No permite agencias'}
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                                <div key={p.id} className={`p-4 bg-[#0d0d0d] border rounded-2xl flex items-center justify-between hover:border-[#00ff88] transition-all group cursor-pointer ${isA ? 'border-[#00ff88]/30 shadow-lg shadow-[#00ff88]/5' : 'border-white/5 opacity-60'} ${hasAgency ? 'ring-1 ring-primary/20' : ''}`}>
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

            {/* --- CRUD MODALS --- */}
            <Modal isOpen={isDistModalOpen} onClose={() => setIsDistModalOpen(false)} title={editingDist ? "Editar Distribuidora" : "Nueva Distribuidora"}>
                <div className="space-y-4">
                    <Input
                        label="Nombre de Distribuidora"
                        value={distForm.nombre}
                        onChange={(e) => setDistForm({ ...distForm, nombre: e.target.value })}
                        placeholder="Ej. ALTENAR (Ecuador)"
                    />

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider block">Deportes Disponibles</label>
                        {isLoadingDeportes ? (
                            <div className="flex items-center gap-2 text-xs text-[#666]">
                                <Loader2 size={14} className="animate-spin" /> Cargando deportes...
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {(deportes || []).map((deporte) => {
                                    const isSelected = distForm.deportes.includes(deporte.id_deporte);
                                    return (
                                        <button
                                            key={deporte.id_deporte}
                                            onClick={() => toggleSportSelection(deporte.id_deporte)}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all border ${isSelected
                                                ? 'bg-[#00ff88] text-black border-[#00ff88] shadow-[0_0_10px_rgba(0,255,136,0.3)]'
                                                : 'bg-[#111] text-[#666] border-[#333] hover:text-white hover:border-[#666]'
                                                }`}
                                        >
                                            {deporte.nombre}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>

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

            <Modal isOpen={isCasaModalOpen} onClose={() => { setIsCasaModalOpen(false); resetCasaForm(); }} title={editingCasa ? "✏️ Editar Casa de Apuestas" : "➕ Nueva Casa de Apuestas"}>
                <div className="space-y-5 animate-in fade-in-50 duration-200">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Store size={14} className="text-[#00ff88]" />
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Nombre de la Casa</label>
                        </div>
                        <Input
                            value={casaForm.nombre}
                            onChange={(e) => { setCasaForm({ ...casaForm, nombre: e.target.value }); setFormErrors({ ...formErrors, nombre: '' }); }}
                            placeholder="Ej. ECUABET"
                            aria-label="Nombre de la casa de apuestas"
                            className={`transition-all ${formErrors.nombre ? 'border-red-500 animate-shake' : ''}`}
                        />
                        {formErrors.nombre && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.nombre}</p>}
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <ExternalLink size={14} className="text-[#00ff88]" />
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">URL del Backoffice</label>
                        </div>
                        <Input
                            value={casaForm.url_backoffice}
                            onChange={(e) => { setCasaForm({ ...casaForm, url_backoffice: e.target.value }); setFormErrors({ ...formErrors, url_backoffice: '' }); }}
                            placeholder="https://admin.ejemplo.com"
                            aria-label="URL del backoffice"
                            className={`transition-all ${formErrors.url_backoffice ? 'border-red-500 animate-shake' : ''}`}
                        />
                        {formErrors.url_backoffice && <p className="text-red-400 text-xs mt-1 flex items-center gap-1"><AlertCircle size={12} /> {formErrors.url_backoffice}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">¿Permite Agencias?</label>
                            <button
                                onClick={() => setCasaForm({ ...casaForm, puede_tener_agencia: !casaForm.puede_tener_agencia })}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${casaForm.puede_tener_agencia ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30 shadow-[0_0_10px_rgba(0,255,136,0.1)]' : 'bg-[#111] text-[#666] border-[#333]'}`}
                            >
                                {casaForm.puede_tener_agencia ? 'SÍ PERMITE' : 'NO PERMITE'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider">Estado</label>
                            <button
                                onClick={() => setCasaForm({ ...casaForm, activo: !casaForm.activo })}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border ${casaForm.activo ? 'bg-[#00ff88]/20 text-[#00ff88] border-[#00ff88]/30' : 'bg-[#1a0f0f] text-red-400 border-red-900/30'}`}
                            >
                                {casaForm.activo ? 'OPERATIVA' : 'INACTIVA'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <div>
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1.5 block">Capital Total (USD)</label>
                            <Input
                                type="number"
                                value={casaForm.capital_total}
                                onChange={(e) => setCasaForm({ ...casaForm, capital_total: parseFloat(e.target.value) || 0 })}
                                className="font-mono text-[#00ff88]"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1.5 block">Perfiles Mínimos</label>
                            <div className="flex items-center h-[42px] bg-[#111] border border-[#333] rounded-xl px-4">
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={casaForm.perfiles_minimos_req}
                                    onChange={(e) => setCasaForm({ ...casaForm, perfiles_minimos_req: parseInt(e.target.value) })}
                                    className="w-full accent-[#00ff88] cursor-pointer"
                                />
                                <span className="ml-3 text-xs font-bold text-white min-w-[20px]">{casaForm.perfiles_minimos_req}</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-end gap-3 border-t border-white/5 mt-4">
                        <Button variant="secondary" onClick={() => { setIsCasaModalOpen(false); resetCasaForm(); }}>Cancelar</Button>
                        <Button onClick={handleSubmitCasa} isLoading={isLoadingAction} icon={<Save size={14} />}>Guardar Casa</Button>
                    </div>
                </div>
            </Modal>

        </section>
    );
};

export default DistribuidorasSection;
