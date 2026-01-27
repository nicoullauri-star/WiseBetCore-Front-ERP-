import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

// --- HELPERS ---
const fmtMoney = (x: number) => {
    if (x === null || x === undefined || isNaN(x)) return "—";
    const sign = x < 0 ? "-" : "";
    const v = Math.abs(x);
    if (v >= 1000) return sign + "$" + (v / 1000).toFixed(1) + "k";
    return sign + "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
};

const fmtPct = (x: number) => {
    if (x === null || x === undefined || isNaN(x)) return "—";
    return (x * 100).toLocaleString("en-US", { maximumFractionDigits: 1 }) + "%";
};

// --- PORTAL TOOLTIP COMPONENT ---
const PortalTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({
                top: rect.top - 10,
                left: rect.left + (rect.width / 2)
            });
            setVisible(true);
        }
    };

    return (
        <>
            <div ref={triggerRef} onMouseEnter={handleMouseEnter} onMouseLeave={() => setVisible(false)} className="inline-flex cursor-help">
                {children}
            </div>
            {visible && createPortal(
                <div
                    className="fixed z-[10000] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-[11px] leading-tight rounded-lg shadow-xl border border-white/10 backdrop-blur-md max-w-[200px] text-center animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div>
                </div>,
                document.body
            )}
        </>
    );
};

// --- DATA TYPES & MOCK GENERATOR ---
interface Trade {
    id: string;
    Fecha_iso: string;
    Plan: string;
    Vertical: 'Picks EV+' | 'Valuebets' | 'SurebettingEC';
    Liga: string;
    Partido: string;
    Mercado: string;
    Cuota_tip: number;
    Stake_tip: number;
    Resultado_tip: 'WIN' | 'LOSS' | 'VOID' | 'PENDING';
    Profit_tip: number;
    Cuota_real: number;
    Stake_monto: number;
    Ejecutada_user: boolean;
    Profit_me: number;
    Distribuidor: string;
    Bookie: string;
    Mes: string;
}

const generateAuditData = (): Trade[] => {
    const data: Trade[] = [];
    const plans = ['PREMIUM', 'ELITE', 'STANDARD'];
    const books = ['Bet365', 'Pinnacle', 'Betfair', '1xBet', 'Coolbet', 'WilliamHill'];

    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - 180);

    for (let i = 0; i < 1200; i++) {
        currentDate.setHours(currentDate.getHours() + Math.floor(Math.random() * 6));
        const iso = currentDate.toISOString().split('T')[0];
        const mes = iso.substring(0, 7);

        const randV = Math.random();
        let vertical: 'Picks EV+' | 'Valuebets' | 'SurebettingEC' = 'Picks EV+';
        if (randV > 0.55) vertical = 'Valuebets';
        if (randV > 0.85) vertical = 'SurebettingEC';

        const bookie = books[Math.floor(Math.random() * books.length)];
        const isSurebet = vertical === 'SurebettingEC';
        const isValue = vertical === 'Valuebets';

        const odds = isSurebet ? (1.02 + Math.random() * 0.15) : (1.7 + Math.random() * 1.5);
        const stake = isSurebet ? (200 + Math.random() * 800) : (50 + Math.random() * 150);

        const isPending = i < 15;
        const winThreshold = isSurebet ? 0.98 : (isValue ? 0.45 : 0.52);
        const r = Math.random();

        let res: 'WIN' | 'LOSS' | 'VOID' | 'PENDING' = isPending ? 'PENDING' : (r < winThreshold ? 'WIN' : 'LOSS');
        if (!isPending && Math.random() < 0.03) res = 'VOID';

        let profit = 0;
        if (res === 'WIN') profit = stake * (odds - 1);
        else if (res === 'LOSS') profit = -stake;
        if (isSurebet && res !== 'PENDING') {
            profit = res === 'WIN' ? stake * 0.03 : -stake;
        }

        data.push({
            id: `OP-${10000 + i}`,
            Fecha_iso: iso,
            Mes: mes,
            Plan: plans[Math.floor(Math.random() * plans.length)],
            Vertical: vertical,
            Liga: 'League Mock',
            Partido: 'Team A vs Team B',
            Mercado: isSurebet ? 'Arbitrage' : (isValue ? 'Moneyline' : 'Asian Handicap'),
            Cuota_tip: odds,
            Stake_tip: stake,
            Resultado_tip: res,
            Profit_tip: profit,
            Cuota_real: odds,
            Stake_monto: stake,
            Ejecutada_user: true,
            Profit_me: profit,
            Distribuidor: 'System',
            Bookie: bookie
        });
    }
    return data.sort((a, b) => b.Fecha_iso.localeCompare(a.Fecha_iso));
};

const AuditPanel: React.FC = () => {
    const navigate = useNavigate();
    const [data, setData] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [opType, setOpType] = useState('Global (Todas)');
    const [dateRange, setDateRange] = useState('90d');
    const [bookieFilter, setBookieFilter] = useState<string | null>(null);
    const [showOpenBets, setShowOpenBets] = useState(true);

    // UI Toggles
    const [showBankroll, setShowBankroll] = useState(false);
    const [isTableCollapsed, setIsTableCollapsed] = useState(false);

    // Interaction State
    const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
    const [tableSearch, setTableSearch] = useState('');

    // Chart Refs
    const chartEquityRef = useRef<HTMLCanvasElement>(null);
    const chartMonthlyRef = useRef<HTMLCanvasElement>(null);
    const chartVolRef = useRef<HTMLCanvasElement>(null);
    const chartDDContribRef = useRef<HTMLCanvasElement>(null);
    const chartBookieBalanceRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<any[]>([]);

    useEffect(() => {
        setData(generateAuditData());
        setLoading(false);
    }, []);

    // --- METRICS ENGINE ---
    const { filteredData, kpis, chartData } = useMemo(() => {
        if (data.length === 0) return { filteredData: [], kpis: null, chartData: null };

        let res = [...data];
        if (opType !== 'Global (Todas)') res = res.filter(r => r.Vertical === opType);
        if (bookieFilter) res = res.filter(r => r.Bookie === bookieFilter);
        if (!showOpenBets) res = res.filter(r => r.Resultado_tip !== 'PENDING');

        if (dateRange !== 'all') {
            const days = dateRange === 'mes' ? 30 : parseInt(dateRange);
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - days);
            const cutoffIso = cutoff.toISOString().split('T')[0];
            res = res.filter(r => r.Fecha_iso >= cutoffIso);
        }

        const sortedAsc = [...res].sort((a, b) => a.Fecha_iso.localeCompare(b.Fecha_iso));
        const uniqueDays = new Set(sortedAsc.map(r => r.Fecha_iso));

        let totalStake = 0, totalProfit = 0, count = 0;
        const verticalStats = {
            'Picks EV+': { profit: 0, stake: 0, count: 0 },
            'Valuebets': { profit: 0, stake: 0, count: 0 },
            'SurebettingEC': { profit: 0, stake: 0, count: 0 },
        };

        const bookieStats: Record<string, { stake: number; profit: number; count: number }> = {};
        const dailyPL: Record<string, number> = {};
        const equityPoints: { date: string, global: number, picks: number, val: number, sure: number }[] = [];
        let runGlobal = 0, runPicks = 0, runVal = 0, runSure = 0;

        sortedAsc.forEach(r => {
            const p = r.Profit_me;
            const s = r.Stake_monto;

            if (r.Resultado_tip !== 'PENDING') {
                totalStake += s;
                totalProfit += p;
                count++;
                if (verticalStats[r.Vertical]) {
                    verticalStats[r.Vertical].profit += p;
                    verticalStats[r.Vertical].stake += s;
                    verticalStats[r.Vertical].count += 1;
                }
                dailyPL[r.Fecha_iso] = (dailyPL[r.Fecha_iso] || 0) + p;
                runGlobal += p;
                if (r.Vertical === 'Picks EV+') runPicks += p;
                if (r.Vertical === 'Valuebets') runVal += p;
                if (r.Vertical === 'SurebettingEC') runSure += p;
            }

            if (!bookieStats[r.Bookie]) bookieStats[r.Bookie] = { stake: 0, profit: 0, count: 0 };
            bookieStats[r.Bookie].stake += s;
            if (r.Resultado_tip !== 'PENDING') {
                bookieStats[r.Bookie].profit += p;
                bookieStats[r.Bookie].count += 1;
            }

            equityPoints.push({
                date: r.Fecha_iso,
                global: runGlobal,
                picks: runPicks,
                val: runVal,
                sure: runSure
            });
        });

        const roi = totalStake ? totalProfit / totalStake : 0;

        const monthlyPL: Record<string, { total: number, picks: number, val: number, sure: number }> = {};
        const currentMonthStr = new Date().toISOString().substring(0, 7);
        let currentMonthProfit = 0;

        sortedAsc.forEach(r => {
            if (r.Resultado_tip === 'PENDING') return;
            if (!monthlyPL[r.Mes]) monthlyPL[r.Mes] = { total: 0, picks: 0, val: 0, sure: 0 };
            monthlyPL[r.Mes].total += r.Profit_me;
            if (r.Mes === currentMonthStr) currentMonthProfit += r.Profit_me;

            if (r.Vertical === 'Picks EV+') monthlyPL[r.Mes].picks += r.Profit_me;
            if (r.Vertical === 'Valuebets') monthlyPL[r.Mes].val += r.Profit_me;
            if (r.Vertical === 'SurebettingEC') monthlyPL[r.Mes].sure += r.Profit_me;
        });

        const months = Object.keys(monthlyPL).sort();

        // RIESGO Metrics
        let peak = -Infinity, maxDD = 0;
        equityPoints.forEach(pt => {
            if (pt.global > peak) peak = pt.global;
            const dd = peak - pt.global;
            if (dd > maxDD) maxDD = dd;
        });

        const dailyProfits = Object.values(dailyPL);
        const worstDay = dailyProfits.length ? Math.min(...dailyProfits) : 0;

        const mean = dailyProfits.reduce((a, b) => a + b, 0) / dailyProfits.length;
        const stdDev = dailyProfits.length > 1
            ? Math.sqrt(dailyProfits.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / dailyProfits.length)
            : 0;

        const topVerticalEntry = Object.entries(verticalStats).sort((a, b) => b[1].stake - a[1].stake)[0];
        const topVerticalName = topVerticalEntry ? topVerticalEntry[0] : '—';
        const topVerticalPct = totalStake ? (topVerticalEntry[1].stake / totalStake) : 0;

        return {
            filteredData: res,
            kpis: {
                // RETORNO
                totalProfit,
                roi,
                currentMonthProfit,
                profitPerTrade: count ? totalProfit / count : 0,
                // RIESGO
                maxDD,
                worstDay,
                stdDev,
                topVerticalName,
                topVerticalPct,
                // ACTIVIDAD
                totalStake,
                count,
                coverage: 0.962, // Mocked as requested for CEO view
                clvAvg: 0.034   // Mocked for Valuebets
            },
            chartData: { equityPoints, monthlyPL, months, dailyProfits, bookieStats }
        };
    }, [data, opType, dateRange, bookieFilter, showOpenBets]);

    // --- CHARTS RENDERING ---
    useEffect(() => {
        if (!window.Chart || !chartData || opType !== 'Global (Todas)') return;

        chartInstances.current.forEach(c => c.destroy());
        chartInstances.current = [];

        const commonOpts = (yFormatter: (v: any) => string) => ({
            responsive: true, maintainAspectRatio: false,
            devicePixelRatio: window.devicePixelRatio || 2,
            layout: { padding: { top: 10, bottom: 5, left: 10, right: 10 } },
            interaction: { mode: 'index', intersect: false },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#64748b', maxTicksLimit: 6, font: { size: 10, weight: '500' }, autoSkip: true }
                },
                y: {
                    grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
                    ticks: { color: '#64748b', font: { size: 10, weight: '500' }, callback: yFormatter, padding: 10 }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    align: 'end',
                    labels: { color: '#9da6b9', usePointStyle: true, font: { size: 10, weight: '600' }, padding: 15 }
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    titleColor: '#fff', bodyColor: '#cbd5e1',
                    borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
                    padding: 12, cornerRadius: 8, titleFont: { size: 12, weight: '700' }, bodyFont: { size: 11 }
                }
            }
        });

        const standardYFormatter = (v: any) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : v <= -1000 ? `-$${(Math.abs(v) / 1000).toFixed(1)}k` : `$${v}`;

        // 1. Equity
        if (chartEquityRef.current) {
            const points = chartData.equityPoints.filter((_, i) => i % 5 === 0 || i === chartData.equityPoints.length - 1);
            chartInstances.current.push(new window.Chart(chartEquityRef.current, {
                type: 'line',
                data: {
                    labels: points.map(p => p.date),
                    datasets: [
                        { label: 'Global', data: points.map(p => p.global), borderColor: '#135bec', borderWidth: 3, pointRadius: 0, fill: true, backgroundColor: 'rgba(19, 91, 236, 0.05)', tension: 0.2 },
                        { label: 'Picks', data: points.map(p => p.picks), borderColor: '#10b981', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.2 },
                        { label: 'Value', data: points.map(p => p.val), borderColor: '#a855f7', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.2 }
                    ]
                },
                options: commonOpts(standardYFormatter) as any
            }));
        }

        // 2. Monthly
        if (chartMonthlyRef.current) {
            chartInstances.current.push(new window.Chart(chartMonthlyRef.current, {
                type: 'bar',
                data: {
                    labels: chartData.months,
                    datasets: [
                        { label: 'Picks', data: chartData.months.map(m => chartData.monthlyPL[m].picks), backgroundColor: '#10b981', borderRadius: 4 },
                        { label: 'Value', data: chartData.months.map(m => chartData.monthlyPL[m].val), backgroundColor: '#a855f7', borderRadius: 4 },
                        { label: 'Sure', data: chartData.months.map(m => chartData.monthlyPL[m].sure), backgroundColor: '#f59e0b', borderRadius: 4 }
                    ]
                },
                options: {
                    ...commonOpts(standardYFormatter) as any,
                    scales: {
                        x: { stacked: true, ...commonOpts(standardYFormatter).scales.x },
                        y: { stacked: true, ...commonOpts(standardYFormatter).scales.y }
                    }
                }
            }));
        }

        // 3. Vol Conc (Donut) - FIXED: Show Capital (SUM Stake)
        if (chartVolRef.current) {
            const topBooks = Object.entries(chartData.bookieStats).sort((a, b) => b[1].stake - a[1].stake).slice(0, 6);
            const totalStakePeriod = topBooks.reduce((acc, b) => acc + b[1].stake, 0);

            chartInstances.current.push(new window.Chart(chartVolRef.current, {
                type: 'doughnut',
                data: {
                    labels: topBooks.map(b => b[0]),
                    datasets: [{ data: topBooks.map(b => b[1].stake), backgroundColor: ['#135bec', '#10b981', '#a855f7', '#f59e0b', '#ef4444', '#64748b'], borderWidth: 0, hoverOffset: 15 }]
                },
                options: {
                    responsive: true, maintainAspectRatio: false, cutout: '70%',
                    plugins: {
                        legend: { position: 'right', labels: { color: '#9da6b9', boxWidth: 10, font: { size: 10, weight: '600' }, padding: 10 } },
                        tooltip: {
                            ...commonOpts(standardYFormatter).plugins.tooltip,
                            callbacks: {
                                label: (context: any) => {
                                    const val = context.raw;
                                    const pct = (val / totalStakePeriod * 100).toFixed(1);
                                    return ` Capital: ${fmtMoney(val)} (${pct}%)`;
                                }
                            }
                        }
                    },
                    onClick: (evt: any, elements: any) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            setBookieFilter(topBooks[index][0]);
                        }
                    }
                } as any
            }));
        }

        // 4. DD Contribution (Horizontal Bar)
        if (chartDDContribRef.current) {
            chartInstances.current.push(new window.Chart(chartDDContribRef.current, {
                type: 'bar',
                data: {
                    labels: ['Picks EV+', 'Valuebets', 'SurebettingEC'],
                    datasets: [{ label: 'DD Contrib', data: [-1450, -2800, -250], backgroundColor: ['#10b981', '#a855f7', '#f59e0b'], borderRadius: 6, barThickness: 20 }]
                },
                options: {
                    ...commonOpts(standardYFormatter) as any, indexAxis: 'y',
                    plugins: { ...commonOpts(standardYFormatter).plugins, legend: { display: false } },
                    onClick: (evt: any, elements: any) => {
                        if (elements.length > 0) {
                            const index = elements[0].index;
                            setOpType(['Picks EV+', 'Valuebets', 'SurebettingEC'][index]);
                        }
                    }
                }
            }));
        }

        // 5. NEW: Bookie Balance / Overexposure
        if (chartBookieBalanceRef.current) {
            const balanceData = Object.entries(chartData.bookieStats)
                .map(([name, stats]) => ({ name, profit: stats.profit, stake: stats.stake, count: stats.count }))
                .sort((a, b) => Math.abs(b.profit) - Math.abs(a.profit));

            chartInstances.current.push(new window.Chart(chartBookieBalanceRef.current, {
                type: 'bar',
                data: {
                    labels: balanceData.map(d => d.name),
                    datasets: [{
                        label: 'Net P/L',
                        data: balanceData.map(d => d.profit),
                        backgroundColor: balanceData.map(d => d.profit >= 0 ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'),
                        borderColor: balanceData.map(d => d.profit >= 0 ? '#10b981' : '#ef4444'),
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    ...commonOpts(standardYFormatter) as any,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            ...commonOpts(standardYFormatter).scales.x,
                            grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false }
                        },
                        y: {
                            ...commonOpts(standardYFormatter).scales.y,
                            grid: { display: false }
                        }
                    },
                    plugins: {
                        ...commonOpts(standardYFormatter).plugins,
                        legend: { display: false },
                        tooltip: {
                            ...commonOpts(standardYFormatter).plugins.tooltip,
                            callbacks: {
                                label: (context: any) => {
                                    const d = balanceData[context.dataIndex];
                                    const roi = d.stake ? (d.profit / d.stake * 100).toFixed(2) : '0.00';
                                    return [
                                        ` Net P/L: ${fmtMoney(d.profit)}`,
                                        ` Staked: ${fmtMoney(d.stake)}`,
                                        ` Ops: ${d.count}`,
                                        ` ROI: ${roi}%`
                                    ];
                                }
                            }
                        }
                    }
                }
            }));
        }

    }, [chartData, opType]);

    const tableData = useMemo(() => {
        let d = filteredData;
        if (tableSearch) {
            const s = tableSearch.toLowerCase();
            d = d.filter(r => r.id.toLowerCase().includes(s) || r.Partido.toLowerCase().includes(s) || r.Mercado.toLowerCase().includes(s));
        }
        return d.slice(0, 50);
    }, [filteredData, tableSearch]);

    return (
        <div className="flex-1 overflow-y-auto bg-background-dark p-3 sm:p-4 lg:p-6 text-white font-sans relative custom-scrollbar">

            {/* HEADER & TOP CONTROLS */}
            <div className="flex flex-col gap-4 sm:gap-6 mb-6 sm:mb-8 border-b border-border-dark pb-4 sm:pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="bg-primary/20 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-2xl sm:text-3xl">fact_check</span>
                    </div>
                    <div>
                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
                            {opType === 'Global (Todas)' ? 'Control Global' : opType}
                            {opType !== 'Global (Todas)' && <button onClick={() => setOpType('Global (Todas)')} className="text-[10px] bg-white/5 hover:bg-white/10 text-text-secondary px-2 py-1 rounded transition-colors uppercase">Restablecer</button>}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <p className="text-text-secondary text-sm font-medium">Auditoría consolidada de portafolio</p>
                            {bookieFilter && (
                                <span className="flex items-center gap-1 bg-primary/20 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border border-primary/20 animate-in fade-in zoom-in duration-300">
                                    Bookie: {bookieFilter} <button onClick={() => setBookieFilter(null)} className="hover:text-white ml-1">×</button>
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3 items-center w-full sm:w-auto">
                    <div className="flex items-center bg-surface-dark border border-border-dark rounded-lg p-1">
                        <button
                            onClick={() => setShowOpenBets(!showOpenBets)}
                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded transition-all duration-300 ${showOpenBets ? 'bg-primary text-white shadow-lg' : 'text-text-secondary hover:text-white'}`}
                        >
                            {showOpenBets ? 'Incluye Abiertas' : 'Solo Liquidadas'}
                        </button>
                    </div>

                    <div className="h-8 w-[1px] bg-border-dark mx-1 hidden sm:block"></div>

                    <select
                        value={opType}
                        onChange={e => { setOpType(e.target.value); setBookieFilter(null); }}
                        className="bg-surface-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-primary min-w-[140px] cursor-pointer"
                    >
                        <option>Global (Todas)</option>
                        <option>Picks EV+</option>
                        <option>Valuebets</option>
                        <option>SurebettingEC</option>
                    </select>

                    <select
                        value={dateRange}
                        onChange={e => setDateRange(e.target.value)}
                        className="bg-surface-dark border border-border-dark text-white text-xs rounded-lg px-3 py-2 outline-none focus:border-primary cursor-pointer"
                    >
                        <option value="7d">Últimos 7 Días</option>
                        <option value="30d">Últimos 30 Días</option>
                        <option value="90d">Últimos 90 Días</option>
                        <option value="mes">Mes Actual</option>
                        <option value="all">Todo el Año</option>
                    </select>
                </div>
            </div>

            {/* MÉTRICAS CLAVE - Restored all 12 KPIs */}
            <div className="space-y-6 sm:space-y-8 mb-8 sm:mb-10">
                {/* RETORNO Group */}
                <div>
                    <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-primary/30"></span> RETORNO
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                        <KpiCard
                            title="Profit Neto Global"
                            value={fmtMoney(kpis?.totalProfit || 0)}
                            sub="Realizado (P/L)"
                            color={kpis?.totalProfit >= 0 ? 'success' : 'danger'}
                            tooltip="Ganancia o pérdida neta absoluta acumulada de todas las apuestas liquidadas."
                        />
                        <KpiCard
                            title="ROI Global"
                            value={fmtPct(kpis?.roi || 0)}
                            sub="Retorno s/ Inversión"
                            color={kpis?.roi >= 0 ? 'success' : 'danger'}
                            tooltip="Ratio de retorno (Profit / Stake). Mide la eficiencia del capital desplegado."
                        />
                        <KpiCard
                            title="Profit Mensual"
                            value={fmtMoney(kpis?.currentMonthProfit || 0)}
                            sub="Mes en curso"
                            color={kpis?.currentMonthProfit >= 0 ? 'success' : 'danger'}
                            tooltip="Resultado acumulado solo durante el mes natural actual."
                        />
                        <KpiCard
                            title="Profit / Apuesta"
                            value={fmtMoney(kpis?.profitPerTrade || 0)}
                            sub="Valor esperado real"
                            color={kpis?.profitPerTrade >= 0 ? 'success' : 'danger'}
                            tooltip="Promedio de ganancia neta obtenida por cada operación liquidada."
                        />
                    </div>
                </div>

                {/* RIESGO Group */}
                <div>
                    <h3 className="text-xs font-black text-rose-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-rose-500/30"></span> RIESGO
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                        <KpiCard
                            title="Drawdown Máximo"
                            value={fmtPct(kpis?.maxDD / 25000)} // Using a base bank of 25k for the pct
                            sub={`Val: ${fmtMoney(kpis?.maxDD || 0)}`}
                            color="danger"
                            tooltip="La mayor caída histórica desde el punto máximo del capital. Indicador crítico de riesgo."
                        />
                        <KpiCard
                            title="Peor Día (P/L)"
                            value={fmtMoney(kpis?.worstDay || 0)}
                            sub="Sesión más negativa"
                            color="danger"
                            tooltip="La mayor pérdida neta registrada en un solo día natural."
                        />
                        <KpiCard
                            title="Volatilidad (Σ)"
                            value={fmtMoney(kpis?.stdDev || 0)}
                            sub="Std Dev diaria"
                            color="warning"
                            tooltip="Desviación estándar de los retornos diarios; mide la dispersión y el riesgo del portafolio."
                        />
                        <KpiCard
                            title="Concentración Vertical"
                            value={fmtPct(kpis?.topVerticalPct || 0)}
                            sub={`Dominante: ${kpis?.topVerticalName}`}
                            color="warning"
                            tooltip="Porcentaje de volumen total concentrado en la vertical con mayor exposición."
                        />
                    </div>
                </div>

                {/* ACTIVIDAD Group */}
                <div>
                    <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-emerald-500/30"></span> ACTIVIDAD
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
                        <KpiCard
                            title="Total Apostado"
                            value={fmtMoney(kpis?.totalStake || 0)}
                            sub="Capital en riesgo"
                            tooltip="Suma total de stakes colocados en el periodo seleccionado."
                        />
                        <KpiCard
                            title="# Operaciones"
                            value={(kpis?.count || 0).toString()}
                            sub="Trades liquidados"
                            tooltip="Cantidad total de apuestas que han sido cerradas y auditadas."
                        />
                        <KpiCard
                            title="Cobertura Ejec."
                            value={fmtPct(kpis?.coverage || 0)}
                            sub="Picks: 98% | Val: 94%"
                            tooltip="Ratio de operaciones ejecutadas exitosamente sobre el total de señales recibidas."
                        />
                        <KpiCard
                            title="CLV Promedio"
                            value={fmtPct(kpis?.clvAvg || 0)}
                            sub="Solo Valuebets"
                            tooltip="Closing Line Value: Diferencia entre la cuota de entrada y la cuota de cierre de mercado."
                        />
                    </div>
                </div>
            </div>

            {/* CHARTS GRID */}
            {opType === 'Global (Todas)' ? (
                <div className="space-y-6 mb-8">
                    {/* Row 1: Equity & Monthly */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="xl:col-span-2 bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[420px] overflow-hidden relative group transition-all hover:border-gray-700">
                            <div className="flex justify-between items-center mb-4 z-10">
                                <h3 className="font-bold text-white tracking-tight flex items-center gap-2">Crecimiento de Capital</h3>
                                <div className="flex gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                </div>
                            </div>
                            <div className="flex-1 w-full relative">
                                <canvas ref={chartEquityRef}></canvas>
                            </div>
                        </div>
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[420px] overflow-hidden relative transition-all hover:border-gray-700">
                            <h3 className="font-bold text-white mb-4 tracking-tight">Performance Mensual</h3>
                            <div className="flex-1 w-full relative">
                                <canvas ref={chartMonthlyRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: NEW Balance Chart */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[420px] overflow-hidden relative transition-all hover:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-white tracking-tight">Bookie Balance / Overexposure</h3>
                                    <p className="text-[10px] text-text-secondary font-medium uppercase mt-1">Goal: avoid extreme imbalance per bookie to maintain operational equilibrium.</p>
                                </div>
                                <PortalTooltip text="Muestra el P/L neto por casa de apuesta. Los valores extremos (muy positivos o muy negativos) pueden indicar riesgos de limitación o exposición excesiva.">
                                    <span className="material-symbols-outlined text-[14px] text-text-secondary cursor-help">info</span>
                                </PortalTooltip>
                            </div>
                            <div className="flex-1 w-full relative mt-4">
                                <canvas ref={chartBookieBalanceRef}></canvas>
                            </div>
                        </div>
                    </div>

                    {/* Row 3: Donut & Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[320px] overflow-hidden relative transition-all hover:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white tracking-tight">Top Bookies (Capital Apostado)</h3>
                                <PortalTooltip text="Concentración de capital total (Stake) por casa de apuesta.">
                                    <span className="material-symbols-outlined text-[14px] text-text-secondary cursor-help">help</span>
                                </PortalTooltip>
                            </div>
                            <div className="flex-1 w-full relative">
                                <canvas ref={chartVolRef}></canvas>
                            </div>
                        </div>

                        <div className="xl:col-span-2 bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[320px] overflow-hidden relative transition-all hover:border-gray-700">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-white tracking-tight">Impacto en Drawdown por Vertical</h3>
                                <PortalTooltip text="Contribución histórica de cada vertical a los eventos de drawdown.">
                                    <span className="material-symbols-outlined text-[14px] text-text-secondary cursor-help">info</span>
                                </PortalTooltip>
                            </div>
                            <div className="flex-1 w-full relative">
                                <canvas ref={chartDDContribRef}></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* UNDER DEVELOPMENT Banner for Non-Global Verticals */
                <div className="bg-surface-dark border border-border-dark rounded-xl p-10 mb-8 flex flex-col items-center justify-center h-[500px] text-center border-dashed">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">construction</span>
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">Módulo en Desarrollo</h3>
                    <p className="text-text-secondary max-w-md text-sm leading-relaxed">
                        Estamos trabajando en la visualización granular para <span className="text-primary font-bold">{opType}</span>.
                        Utiliza la vista <span className="text-white font-bold">Global</span> para ver el rendimiento consolidado o consulta el historial a continuación.
                    </p>
                    <button
                        onClick={() => setOpType('Global (Todas)')}
                        className="mt-6 px-6 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-xs font-black uppercase rounded-lg transition-all"
                    >
                        Volver a Vista Global
                    </button>
                </div>
            )}

            {/* OPERATIONS HISTORY SECTION - UNCHANGED */}
            <div className="bg-surface-dark border border-border-dark rounded-xl shadow-2xl overflow-hidden mb-20 transition-all duration-300">
                {/* Section Header */}
                <div
                    className="p-4 bg-gradient-to-r from-[#1a212e] to-surface-dark border-b border-border-dark flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                >
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg transition-all duration-300 ${isTableCollapsed ? 'bg-background-dark text-text-secondary' : 'bg-primary/20 text-primary shadow-lg shadow-primary/10'}`}>
                            <span className={`material-symbols-outlined transition-transform duration-300 ${isTableCollapsed ? '-rotate-90' : ''}`}>history</span>
                        </div>
                        <div>
                            <h3 className="font-black text-white text-sm uppercase tracking-widest flex items-center gap-2">
                                Operations History
                                {filteredData.length > 0 && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded-full font-black">{filteredData.length}</span>}
                            </h3>
                            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-tighter">Activity log consolidada • Live Sync</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Summary Strip (Visible when collapsed) */}
                        <div className={`hidden md:flex items-center gap-3 transition-all duration-500 ${isTableCollapsed ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 pointer-events-none'}`}>
                            <SummaryChip label="Filtro" val={opType === 'Global (Todas)' ? 'Full Scope' : opType} icon="filter_alt" />
                            {bookieFilter && <SummaryChip label="Bookie" val={bookieFilter} icon="store" col="primary" />}
                            <div className="h-6 w-[1px] bg-border-dark"></div>
                            {(opType !== 'Global (Todas)' || bookieFilter) && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpType('Global (Todas)'); setBookieFilter(null); }}
                                    className="text-[9px] text-rose-500 hover:text-white font-black uppercase underline decoration-dotted underline-offset-4"
                                >
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            {!isTableCollapsed && (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-text-secondary group-focus-within:text-primary transition-colors">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar por equipo, liga o ID..."
                                            value={tableSearch}
                                            onChange={(e) => setTableSearch(e.target.value)}
                                            className="pl-9 pr-4 py-2 bg-background-dark border border-border-dark rounded-lg text-xs text-white placeholder-gray-600 outline-none focus:border-primary w-[240px] transition-all"
                                        />
                                    </div>
                                    <button className="flex items-center gap-1.5 bg-background-dark hover:bg-border-dark border border-border-dark text-text-secondary hover:text-white px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">
                                        <span className="material-symbols-outlined text-[16px]">download</span> CSV
                                    </button>
                                </div>
                            )}
                            <span className={`material-symbols-outlined text-text-secondary transition-transform duration-500 ${isTableCollapsed ? '' : 'rotate-180'}`}>expand_more</span>
                        </div>
                    </div>
                </div>

                {/* Table Container - Smooth Expand */}
                <div className={`transition-all duration-500 ease-in-out ${isTableCollapsed ? 'max-h-0' : 'max-h-[1500px]'}`}>
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-background-dark/80 text-[10px] uppercase text-text-secondary font-black border-b border-border-dark tracking-widest sticky top-0 z-20 backdrop-blur-xl">
                                    <th className="px-6 py-4">Execution Date</th>
                                    <th className="px-6 py-4">Tx ID</th>
                                    <th className="px-6 py-4">Vertical / System</th>
                                    <th className="px-6 py-4">Event Details</th>
                                    <th className="px-6 py-4 text-right">Odds</th>
                                    <th className="px-6 py-4 text-right">Stake</th>
                                    <th className="px-6 py-4 text-right">P/L Net</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-xs">
                                {tableData.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center gap-3 opacity-30">
                                                <span className="material-symbols-outlined text-5xl">inventory_2</span>
                                                <p className="text-sm font-bold uppercase tracking-widest italic">No trades found in current scope</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : tableData.map((trade) => (
                                    <tr
                                        key={trade.id}
                                        onClick={() => setSelectedTrade(trade)}
                                        className="border-b border-border-dark/20 hover:bg-white/[0.02] cursor-pointer transition-all duration-200 group relative"
                                    >
                                        <td className="px-6 py-4 text-text-secondary whitespace-nowrap font-medium tabular-nums">{trade.Fecha_iso}</td>
                                        <td className="px-6 py-4 text-primary font-black group-hover:underline tracking-tight">{trade.id}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight border ${trade.Vertical === 'Picks EV+' ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' :
                                                    trade.Vertical === 'Valuebets' ? 'bg-purple-500/5 border-purple-500/20 text-purple-400' :
                                                        'bg-amber-500/5 border-amber-500/20 text-amber-400'
                                                }`}>{trade.Vertical}</span>
                                        </td>
                                        <td className="px-6 py-4 text-white">
                                            <p className="font-bold truncate max-w-[220px] tracking-tight">{trade.Partido}</p>
                                            <p className="text-[10px] text-text-secondary font-medium tracking-tighter opacity-70 uppercase">{trade.Mercado} • {trade.Bookie}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-white font-mono font-bold">{trade.Cuota_real.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right text-gray-500 font-mono tabular-nums">${trade.Stake_monto.toFixed(0)}</td>
                                        <td className={`px-6 py-4 text-right font-black font-mono text-sm tabular-nums ${trade.Profit_me > 0 ? 'text-emerald-500' : trade.Profit_me < 0 ? 'text-rose-500' : 'text-gray-600'}`}>
                                            {trade.Resultado_tip === 'PENDING' ? '—' : (trade.Profit_me > 0 ? `+${fmtMoney(trade.Profit_me)}` : fmtMoney(trade.Profit_me))}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[9px] font-black px-2.5 py-1 rounded uppercase tracking-widest ${trade.Resultado_tip === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    trade.Resultado_tip === 'LOSS' ? 'bg-rose-500/10 text-rose-500' :
                                                        trade.Resultado_tip === 'PENDING' ? 'bg-blue-500/10 text-blue-500 animate-pulse' :
                                                            'bg-gray-700/30 text-gray-500'
                                                }`}>{trade.Resultado_tip === 'WIN' ? 'Settled: Win' : trade.Resultado_tip === 'LOSS' ? 'Settled: Loss' : trade.Resultado_tip === 'PENDING' ? 'Live/Open' : 'Void/Push'}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Mock */}
                    <div className="p-4 bg-background-dark/20 flex justify-between items-center text-[10px] text-text-secondary font-black uppercase tracking-widest border-t border-border-dark/50">
                        <span className="opacity-50 tracking-tighter">View {tableData.length} of {filteredData.length} operations</span>
                        <div className="flex gap-2">
                            <button className="hover:text-white transition-colors p-1"><span className="material-symbols-outlined text-[18px]">first_page</span></button>
                            <button className="hover:text-white transition-colors p-1"><span className="material-symbols-outlined text-[18px]">chevron_left</span></button>
                            <div className="flex items-center gap-1 px-4 text-white">Page 1</div>
                            <button className="hover:text-white transition-colors p-1"><span className="material-symbols-outlined text-[18px]">chevron_right</span></button>
                            <button className="hover:text-white transition-colors p-1"><span className="material-symbols-outlined text-[18px]">last_page</span></button>
                        </div>
                    </div>
                </div>
            </div>

            {/* DETAIL DRAWER */}
            {selectedTrade && (
                <div className="fixed inset-0 z-[100] flex justify-end" onClick={() => setSelectedTrade(null)}>
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-500"></div>
                    <div className="relative w-full max-w-md bg-surface-dark border-l border-border-dark shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-400" onClick={e => e.stopPropagation()}>
                        <div className="p-8 border-b border-border-dark flex justify-between items-center bg-[#151b26] relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none"><span className="material-symbols-outlined text-8xl">receipt</span></div>
                            <div>
                                <p className="text-[10px] text-primary uppercase font-black tracking-widest mb-1">{selectedTrade.Vertical} System</p>
                                <h2 className="text-2xl font-black text-white flex items-center gap-3 tracking-tighter">
                                    {selectedTrade.id}
                                    <span className={`text-[10px] px-2 py-0.5 rounded font-black tracking-widest uppercase ${selectedTrade.Profit_me > 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                                        {selectedTrade.Resultado_tip}
                                    </span>
                                </h2>
                            </div>
                            <button onClick={() => setSelectedTrade(null)} className="text-gray-500 hover:text-white p-2 transition-colors focus:outline-none">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-8 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-y-8 gap-x-6">
                                <DetailItem label="Event Name" val={selectedTrade.Partido} />
                                <DetailItem label="Market Scope" val={selectedTrade.Mercado} />
                                <DetailItem label="Execution Platform" val={selectedTrade.Bookie} />
                                <DetailItem label="Timestamp (UTC)" val={selectedTrade.Fecha_iso} />
                                <DetailItem label="Client Tier" val={selectedTrade.Plan} />
                                <DetailItem label="Audited Result" val={selectedTrade.Resultado_tip} />
                            </div>

                            <div className="bg-background-dark p-6 rounded-3xl border border-border-dark shadow-inner relative">
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Captured Odds</span>
                                    <span className="text-white font-black font-mono text-xl tabular-nums">{selectedTrade.Cuota_real.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-text-secondary text-[10px] font-black uppercase tracking-widest">Stake Magnitude</span>
                                    <span className="text-white font-black font-mono text-xl tabular-nums">${selectedTrade.Stake_monto.toLocaleString()}</span>
                                </div>
                                <div className="h-[1px] bg-border-dark my-6"></div>
                                <div className="flex justify-between items-center">
                                    <span className="text-white font-black text-xs uppercase tracking-widest">Net Realized P/L</span>
                                    <span className={`text-3xl font-black font-mono tabular-nums ${selectedTrade.Profit_me > 0 ? 'text-emerald-500' : selectedTrade.Profit_me < 0 ? 'text-rose-500' : 'text-gray-600'}`}>
                                        {selectedTrade.Profit_me > 0 ? '+' : ''}{fmtMoney(selectedTrade.Profit_me)}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-border-dark/50">
                                <h4 className="text-[10px] font-black uppercase text-text-secondary tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                                    Auditor Diagnostic
                                </h4>
                                <div className="flex items-start gap-4 p-4 bg-white/[0.03] rounded-2xl border border-white/5 shadow-sm">
                                    <span className="material-symbols-outlined text-primary text-xl mt-0.5">verified</span>
                                    <p className="text-xs text-gray-300 italic leading-relaxed font-medium">Tx validated by consensus algorithm. Zero slippage detected at point of execution. Reference odds confirmed via independent feed.</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-border-dark bg-[#151b26]/50">
                            <button className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all active:scale-95 border border-white/5">Report Discrepancy</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

// --- SUB COMPONENTS ---

const KpiCard = ({ title, value, sub, color = 'white', tooltip }: any) => (
    <div className="bg-surface-dark border border-border-dark rounded-xl p-5 shadow-sm relative group transition-all hover:border-primary/40 cursor-default">
        <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase font-black text-text-secondary tracking-widest">{title}</p>
            {tooltip && (
                <PortalTooltip text={tooltip}>
                    <span className="material-symbols-outlined text-[14px] text-text-secondary/40 hover:text-white transition-colors">info</span>
                </PortalTooltip>
            )}
        </div>
        <p className={`text-3xl font-black tracking-tight ${color === 'success' ? 'text-emerald-500' :
                color === 'danger' ? 'text-rose-500' :
                    color === 'warning' ? 'text-amber-500' : 'text-white'
            }`}>
            {value}
        </p>
        {sub && <p className="text-[10px] text-text-secondary font-black mt-1.5 uppercase tracking-widest opacity-70">{sub}</p>}
    </div>
);

const SummaryChip = ({ label, val, icon, col = 'secondary' }: any) => (
    <div className="flex items-center gap-2 px-3 py-1 bg-background-dark rounded-full border border-border-dark shadow-sm">
        <span className={`material-symbols-outlined text-[14px] ${col === 'primary' ? 'text-primary' : 'text-text-secondary'}`}>{icon}</span>
        <span className="text-[9px] text-text-secondary font-black uppercase tracking-tighter">{label}:</span>
        <span className="text-[10px] text-white font-black truncate max-w-[90px]">{val}</span>
    </div>
);

const DetailItem = ({ label, val }: any) => (
    <div className="flex flex-col gap-1.5">
        <p className="text-[9px] text-text-secondary font-black uppercase tracking-widest">{label}</p>
        <p className="text-sm text-white font-bold leading-tight" title={val}>{val}</p>
    </div>
);

export default AuditPanel;