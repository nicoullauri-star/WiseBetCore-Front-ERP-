import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { transaccionesService, type Transaccion, type TransactionType, type PaymentMethod, type TransactionStatus } from '../services/transacciones.service';
import { perfilesService, type PerfilOperativo } from '../services/perfiles.service';
import { Modal, Input, Button } from '../components/ui';
import { ArrowDownCircle, ArrowUpCircle, Filter, Download, RotateCcw, Plus, Save, Loader2, User } from 'lucide-react';

const FinanceModule: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'depositos' | 'retiros' | 'transferencias' | 'resumen'>('depositos');

    // --- STATE ---
    const [transactions, setTransactions] = useState<Transaccion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filters, setFilters] = useState({
        search: '',
        status: 'TODOS' as TransactionStatus | 'TODOS',
        method: 'TODOS' as PaymentMethod | 'TODOS',
    });
    const [monthlyStats, setMonthlyStats] = useState({
        total: 0,
        confirmed: 0,
        pending: 0,
        net: 0
    });

    // --- CREATE MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [profilesList, setProfilesList] = useState<PerfilOperativo[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(false);

    // Initial Form State
    const initialFormState = {
        perfil: 0,
        tipo: 'DEPOSITO' as TransactionType,
        metodo: 'USDT' as PaymentMethod,
        estado: 'PENDIENTE' as TransactionStatus,
        monto: 0,
        referencia: ''
    };
    const [newTx, setNewTx] = useState(initialFormState);

    // --- EDIT STATUS STATE ---
    const [editingTx, setEditingTx] = useState<Transaccion | null>(null);
    const [tempStatus, setTempStatus] = useState<TransactionStatus>('PENDIENTE');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const tabs = [
        { id: 'depositos', label: 'Depósitos', icon: 'arrow_downward' },
        { id: 'retiros', label: 'Retiros', icon: 'arrow_upward' },
        { id: 'transferencias', label: 'Transferencias', icon: 'swap_horiz' },
        { id: 'resumen', label: 'Resumen', icon: 'pie_chart' },
    ];

    // --- FETCH LOGIC ---
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const params: any = {
                ordering: '-created_at',
                page_size: 100 // Fetch decent amount for prototyping KPIs
            };

            // Filters
            if (filters.status !== 'TODOS') params.estado = filters.status;
            if (filters.method !== 'TODOS') params.metodo = filters.method;
            if (filters.search) params.search = filters.search;

            // Tab Filters
            if (activeTab === 'depositos') params.tipo = 'DEPOSITO';
            if (activeTab === 'retiros') params.tipo = 'RETIRO';
            // 'transferencias' logic depends on backend support or type convention

            const res = await transaccionesService.getAll(params);
            setTransactions(res.results);

            // Simple Client-Side KPI Calculation for prototype
            // In real app, this should be a separate endpoint
            const total = res.results.reduce((acc, curr) => acc + Number(curr.monto), 0);
            const confirmed = res.results.filter(t => t.estado === 'COMPLETADO').reduce((acc, curr) => acc + Number(curr.monto), 0);
            const pending = res.results.filter(t => t.estado === 'PENDIENTE').reduce((acc, curr) => acc + Number(curr.monto), 0);
            const net = res.results.reduce((acc, curr) => curr.tipo_transaccion === 'DEPOSITO' ? acc + Number(curr.monto) : acc - Number(curr.monto), 0);

            setMonthlyStats({ total, confirmed, pending, net });
        } catch (e) {
            console.error("Error fetching finance data", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, filters]);

    // --- CREATE LOGIC ---
    const fetchProfiles = async () => {
        try {
            setIsLoadingProfiles(true);
            const res = await perfilesService.getAll();
            setProfilesList(res.results);
        } catch (e) {
            console.error("Error loading profiles", e);
        } finally {
            setIsLoadingProfiles(false);
        }
    };

    useEffect(() => {
        if (isModalOpen && profilesList.length === 0) {
            fetchProfiles();
        }
    }, [isModalOpen]);

    const handleCreateTransaction = async () => {
        if (!newTx.perfil || !newTx.monto || !newTx.referencia) {
            alert("Completa los campos obligatorios");
            return;
        }

        try {
            setIsCreating(true);
            const payload: any = {
                tipo_transaccion: newTx.tipo,
                metodo_pago: newTx.metodo,
                fecha_transaccion: new Date().toISOString(),
                perfil: newTx.perfil,
                monto: newTx.monto,
                estado: newTx.estado,
                referencia: newTx.referencia
            };
            await transaccionesService.create(payload);
            setIsModalOpen(false);
            setNewTx(initialFormState);
            // Refresh list
            fetchData();
            alert("Transacción creada exitosamente");
        } catch (e) {
            console.error("Error creating transaction", e);
            alert("Error al crear transacción");
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!editingTx) return;

        try {
            setIsUpdatingStatus(true);
            await transaccionesService.update(editingTx.id_transaccion, { estado: tempStatus });

            // Close and refresh
            setEditingTx(null);
            fetchData();

            // Optional: Success feedback could be added here
        } catch (e) {
            console.error("Error updating transaction status", e);
            alert("Error al actualizar el estado");
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openEditModal = (tx: Transaccion) => {
        setEditingTx(tx);
        setTempStatus(tx.estado);
    };

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
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg">
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Módulo Financiero</span>
                        </div>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-black font-bold rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
                        >
                            <Plus size={16} className="text-black" />
                            <span className="text-xs uppercase tracking-wider">Nueva Transacción</span>
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-6 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
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
                {/* Dynamic KPIs */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                        <p className="text-xs text-text-secondary uppercase font-semibold">Total Operado</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">${monthlyStats.total.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                        <p className="text-xs text-text-secondary uppercase font-semibold">Confirmado</p>
                        <p className="text-2xl font-bold text-emerald-500 mt-1">${monthlyStats.confirmed.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                        <p className="text-xs text-text-secondary uppercase font-semibold">Pendiente</p>
                        <p className="text-2xl font-bold text-amber-500 mt-1">${monthlyStats.pending.toLocaleString()}</p>
                    </div>
                    <div className="bg-white dark:bg-surface-dark p-4 rounded-xl border border-gray-200 dark:border-border-dark shadow-sm">
                        <p className="text-xs text-text-secondary uppercase font-semibold">Neto (Dep - Ret)</p>
                        <p className={`text-2xl font-bold mt-1 ${monthlyStats.net >= 0 ? 'text-primary' : 'text-rose-500'}`}>
                            {monthlyStats.net >= 0 ? '+' : ''}${monthlyStats.net.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Filter Bar */}
                {/* Filter Bar */}
                <div className="flex flex-wrap gap-3 mb-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <span className="absolute left-3 top-2.5 material-symbols-outlined text-gray-400 text-[18px]">search</span>
                        <input
                            type="text"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                            placeholder="Buscar por referencia..."
                            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                        className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                        <option value="TODOS">Todos los Estados</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="COMPLETADO">Completado</option>
                        <option value="RECHAZADO">Rechazado</option>
                    </select>
                    <select
                        value={filters.method}
                        onChange={(e) => setFilters(prev => ({ ...prev, method: e.target.value as any }))}
                        className="px-4 py-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-lg text-sm text-slate-900 dark:text-white outline-none cursor-pointer"
                    >
                        <option value="TODOS">Todos los Métodos</option>
                        <option value="SKRILL">Skrill</option>
                        <option value="NETELLER">Neteller</option>
                        <option value="USDT">USDT</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                    </select>
                </div>

                {/* Transactions Table */}
                <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-200 dark:border-border-dark shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            <p className="text-sm text-text-secondary animate-pulse">Cargando transacciones...</p>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8">
                            <div className="p-6 bg-gray-50 dark:bg-background-dark/50 rounded-full mb-4">
                                <span className="material-symbols-outlined text-4xl text-gray-400">receipt_long</span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Sin registros</h3>
                            <p className="text-text-secondary text-sm max-w-sm text-center">
                                No se encontraron transacciones con los filtros seleccionados.
                            </p>
                            <button
                                onClick={() => setFilters({ search: '', status: 'TODOS', method: 'TODOS' })}
                                className="mt-4 px-4 py-2 bg-primary/10 text-primary rounded-lg text-sm font-bold hover:bg-primary/20 transition-colors"
                            >
                                Limpiar Filtros
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-border-dark bg-gray-50/50 dark:bg-background-dark/50">
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">ID / Ref</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Usuario</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Fecha</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Tipo</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest">Método</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest text-right">Monto</th>
                                        <th className="p-4 text-[10px] font-black uppercase text-text-secondary tracking-widest text-center">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-border-dark">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id_transaccion} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">#{tx.id_transaccion}</p>
                                                <p className="text-[10px] text-text-secondary font-mono">{tx.referencia}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{tx.perfil_usuario || 'N/A'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs text-slate-700 dark:text-gray-300">{new Date(tx.fecha_transaccion).toLocaleDateString()}</p>
                                                <p className="text-[10px] text-text-secondary">{new Date(tx.fecha_transaccion).toLocaleTimeString().slice(0, 5)}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${tx.tipo_transaccion === 'DEPOSITO'
                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                    {tx.tipo_transaccion === 'DEPOSITO' ? <ArrowDownCircle size={12} /> : <ArrowUpCircle size={12} />}
                                                    {tx.tipo_transaccion === 'DEPOSITO' ? 'Depósito' : 'Retiro'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs font-medium text-slate-700 dark:text-gray-300">{tx.metodo_pago}</p>
                                            </td>
                                            <td className="p-4 text-right">
                                                <p className={`text-sm font-black font-mono ${tx.tipo_transaccion === 'DEPOSITO' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                                                    }`}>
                                                    {tx.tipo_transaccion === 'DEPOSITO' ? '+' : '-'}${Number(tx.monto).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </p>
                                            </td>
                                            <td className="p-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide ${tx.estado === 'COMPLETADO'
                                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                        : tx.estado === 'RECHAZADO'
                                                            ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                        }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${tx.estado === 'COMPLETADO' ? 'bg-emerald-500' : tx.estado === 'RECHAZADO' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                                                        {tx.estado}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditModal(tx);
                                                        }}
                                                        className="p-1 text-gray-400 hover:text-primary transition-colors rounded hover:bg-primary/10"
                                                        title="Editar Estado"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">edit</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Transacción Financiera">
                <div className="space-y-4">
                    {/* Profile Selector */}
                    <div>
                        <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1 block">Perfil / Usuario</label>
                        {isLoadingProfiles ? (
                            <div className="flex items-center gap-2 text-xs text-[#666]"><Loader2 size={14} className="animate-spin" /> Cargando perfiles...</div>
                        ) : (
                            <select
                                value={newTx.perfil}
                                onChange={(e) => setNewTx({ ...newTx, perfil: Number(e.target.value) })}
                                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                            >
                                <option value={0}>Seleccione un perfil...</option>
                                {profilesList.map(p => (
                                    <option key={p.id_perfil} value={p.id_perfil}>
                                        {p.usuario_username} ({p.nombre_usuario})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Amount & Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Monto"
                            type="number"
                            value={newTx.monto}
                            onChange={(e) => setNewTx({ ...newTx, monto: Number(e.target.value) })}
                            placeholder="0.00"
                        />
                        <div>
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1 block">Tipo</label>
                            <div className="flex bg-[#111] rounded-lg p-1 border border-[#333]">
                                <button
                                    onClick={() => setNewTx({ ...newTx, tipo: 'DEPOSITO' })}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${newTx.tipo === 'DEPOSITO' ? 'bg-emerald-500/20 text-emerald-500' : 'text-[#666]'}`}
                                >
                                    Depósito
                                </button>
                                <button
                                    onClick={() => setNewTx({ ...newTx, tipo: 'RETIRO' })}
                                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${newTx.tipo === 'RETIRO' ? 'bg-rose-500/20 text-rose-500' : 'text-[#666]'}`}
                                >
                                    Retiro
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Method & Ref */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1 block">Método</label>
                            <select
                                value={newTx.metodo}
                                onChange={(e) => setNewTx({ ...newTx, metodo: e.target.value as any })}
                                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                            >
                                <option value="USDT">USDT</option>
                                <option value="SKRILL">Skrill</option>
                                <option value="NETELLER">Neteller</option>
                                <option value="TRANSFERENCIA">Transferencia</option>
                            </select>
                        </div>
                        <Input
                            label="Referencia / Hash"
                            value={newTx.referencia}
                            onChange={(e) => setNewTx({ ...newTx, referencia: e.target.value })}
                            placeholder="TXID123..."
                        />
                    </div>

                    {/* Status */}
                    <div>
                        <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider mb-1 block">Estado Inicial</label>
                        <select
                            value={newTx.estado}
                            onChange={(e) => setNewTx({ ...newTx, estado: e.target.value as any })}
                            className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                        >
                            <option value="PENDIENTE">Pendiente</option>
                            <option value="COMPLETADO">Completado</option>
                        </select>
                    </div>

                    <div className="pt-4 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreateTransaction} isLoading={isCreating}>Guardar</Button>
                    </div>
                </div>
            </Modal>
            {/* STATUS EDIT MODAL */}
            <Modal
                isOpen={!!editingTx}
                onClose={() => setEditingTx(null)}
                title="Actualizar Estado"
            >
                <div className="space-y-6">
                    <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10">
                        <p className="text-xs text-text-secondary uppercase font-bold mb-1">Transacción ID</p>
                        <p className="text-sm font-mono text-slate-900 dark:text-white">#{editingTx?.id_transaccion} - {editingTx?.referencia}</p>
                        <div className="mt-3 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-[10px] text-text-secondary uppercase font-bold">Monto</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">${editingTx?.monto}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-text-secondary uppercase font-bold">Usuario</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{editingTx?.perfil_usuario}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase">Nuevo Estado</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['PENDIENTE', 'COMPLETADO', 'RECHAZADO'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setTempStatus(status as any)}
                                    className={`py-3 px-2 rounded-xl text-xs font-black uppercase border transition-all ${tempStatus === status
                                        ? status === 'COMPLETADO'
                                            ? 'bg-emerald-500 text-black border-emerald-500 shadow-lg shadow-emerald-500/20'
                                            : status === 'RECHAZADO'
                                                ? 'bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20'
                                                : 'bg-amber-500 text-black border-amber-500 shadow-lg shadow-amber-500/20'
                                        : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-400 hover:border-primary/50'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => setEditingTx(null)} className="flex-1">
                            Cancelar
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleUpdateStatus}
                            disabled={isUpdatingStatus || tempStatus === editingTx?.estado}
                            className="flex-1"
                        >
                            {isUpdatingStatus ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin" /> Actualizando...
                                </span>
                            ) : 'Guardar Cambios'}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default FinanceModule;