import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';

// Declare Chart.js global
declare global {
    interface Window {
        Chart: any;
    }
}

// --- HELPERS & FORMATTERS ---

const fmtMoney = (x: number) => {
    if (x === null || x === undefined || isNaN(x)) return "—";
    const sign = x < 0 ? "-" : "";
    const v = Math.abs(x);
    return sign + "$" + v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
};

const fmtPct = (x: number, forceSign = false) => {
    if (x === null || x === undefined || isNaN(x)) return "—";
    const sign = x > 0 && forceSign ? "+" : "";
    return sign + (x * 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) + "%";
};

const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
};

// --- PORTAL TOOLTIP COMPONENT ---
// Renders outside the stacking context of the scrollable dashboard to ensure visibility
const PortalTooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
    const [visible, setVisible] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Calculate center top position
            // Simple logic: Position above by default, fallback logic could be added
            setCoords({
                top: rect.top - 10, // 10px buffer above
                left: rect.left + (rect.width / 2)
            });
            setVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="inline-flex"
            >
                {children}
            </div>
            {visible && createPortal(
                <div
                    className="fixed z-[9999] pointer-events-none transform -translate-x-1/2 -translate-y-full px-3 py-2 bg-slate-900/95 text-white text-[11px] leading-tight rounded-lg shadow-xl border border-white/10 backdrop-blur-md max-w-[220px] text-center animate-in fade-in zoom-in-95 duration-150"
                    style={{ top: coords.top, left: coords.left }}
                >
                    {text}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900/95"></div>
                </div>,
                document.body
            )}
        </>
    );
};

// --- MOCK DATA ENGINE ---
interface Trade {
    id: string;
    date: string; // ISO
    vertical: 'Picks EV+' | 'Valuebets' | 'SurebettingEC';
    bookmaker: string;
    market: string;
    stake: number;
    odds: number;
    result: 'WIN' | 'LOSS' | 'PENDING';
    profit: number;
}

const generateMockData = (): Trade[] => {
    const data: Trade[] = [];
    const verticals = ['Picks EV+', 'Valuebets', 'SurebettingEC'] as const;
    const books = ['Bet365', 'Pinnacle', 'Betfair', 'WilliamHill', '1xBet', 'Coolbet'];
    const markets = ['Moneyline', 'Over 2.5', 'AH -0.5', 'Ambos Marcan', 'Under 3.5'];

    let currentDate = new Date();
    currentDate.setFullYear(new Date().getFullYear(), 0, 1);
    const today = new Date();

    // Optimized loop: generating ~600-1000 items is fast enough for JS
    let bank = 25000;

    while (currentDate <= today) {
        const tradesToday = Math.floor(Math.random() * 6);

        for (let i = 0; i < tradesToday; i++) {
            const vertical = verticals[Math.floor(Math.random() * verticals.length)];
            const book = books[Math.floor(Math.random() * books.length)];
            const market = markets[Math.floor(Math.random() * markets.length)];

            let winRate = 0.54;
            let avgOdds = 1.95;
            let stakePct = 0.02;

            if (vertical === 'Valuebets') { winRate = 0.46; avgOdds = 2.30; stakePct = 0.015; }
            if (vertical === 'SurebettingEC') { winRate = 0.99; avgOdds = 1.04; stakePct = 0.08; }

            const stake = bank * stakePct * (0.8 + Math.random() * 0.4);
            const odds = avgOdds * (0.9 + Math.random() * 0.2);

            const rand = Math.random();
            let result: 'WIN' | 'LOSS' | 'PENDING' = 'PENDING';

            const isRecent = (today.getTime() - currentDate.getTime()) < (24 * 60 * 60 * 1000);

            if (isRecent && Math.random() > 0.6) {
                result = 'PENDING';
            } else {
                result = rand < winRate ? 'WIN' : 'LOSS';
                if (vertical === 'SurebettingEC' && rand > 0.98) result = 'LOSS';
            }

            let profit = 0;
            if (result === 'WIN') profit = stake * (odds - 1);
            else if (result === 'LOSS') profit = -stake;

            data.push({
                id: `TR-${data.length + 1000}`,
                date: currentDate.toISOString().split('T')[0],
                vertical,
                bookmaker: book,
                market,
                stake,
                odds,
                result,
                profit
            });

            if (result !== 'PENDING') bank += profit;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    return data;
};

// --- ALERTS ENGINE ---
interface Alert {
    id: string;
    severity: 'Critical' | 'Risk' | 'Execution' | 'Finance' | 'Info';
    title: string;
    impact: string;
    time: string;
    timestampVal: number; // for sorting
    categoryIcon: string;
    cause: string;
    action: string;
    isRead: boolean;
}

const mockAlerts: Alert[] = [
    { id: '1', severity: 'Critical', title: 'Límite de Drawdown alcanzado (Valuebets)', impact: 'Riesgo: DD > 8%', time: 'hace 10 min', timestampVal: 10, categoryIcon: 'trending_down', cause: 'Racha negativa de 12 unidades en mercados de Tenis ITF.', action: 'Pausar bot de Valuebets y revisar configuración de stake.', isRead: false },
    { id: '2', severity: 'Execution', title: 'Drift de CLV negativo (Pinnacle)', impact: 'Impacto: -1.2%', time: 'hace 45 min', timestampVal: 45, categoryIcon: 'troubleshoot', cause: 'Latencia en la API de odds feed (400ms+).', action: 'Contactar soporte técnico o cambiar nodo de conexión.', isRead: false },
    { id: '3', severity: 'Finance', title: 'Saldo bajo: Skrill (USD)', impact: '< 10% Libre', time: 'hace 2h', timestampVal: 120, categoryIcon: 'account_balance_wallet', cause: 'Rotación de capital alta el fin de semana.', action: 'Realizar recarga de emergencia o mover fondos de Crypto.', isRead: true },
    { id: '4', severity: 'Risk', title: 'Alta exposición en NBA Finals', impact: 'Exp: $12k', time: 'hace 4h', timestampVal: 240, categoryIcon: 'warning', cause: 'Múltiples picks coincidentes en el mismo evento.', action: 'Monitorear evento en vivo, considerar hedge manual.', isRead: true },
    { id: '5', severity: 'Info', title: 'Récord de volumen diario', impact: 'Vol: $45k', time: 'hace 5h', timestampVal: 300, categoryIcon: 'verified', cause: 'Jornada de Champions League con alta liquidez.', action: 'Ninguna acción requerida. Buen trabajo.', isRead: true },
];

// --- MAIN COMPONENT ---
const GlobalDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [rawData, setRawData] = useState<Trade[]>([]);
    // Removed "loading" state delay for instant performance

    // Filters State
    const [dateFilter, setDateFilter] = useState<'MTD' | '7D' | '30D' | '90D' | 'YTD' | 'CUSTOM'>('MTD');
    const [customStart, setCustomStart] = useState('');
    const [customEnd, setCustomEnd] = useState('');

    // UI States
    const [chartMode, setChartMode] = useState<'ALL' | 'GLOBAL'>('ALL');
    const [rightChartMetric, setRightChartMetric] = useState<'profit' | 'volume' | 'roi'>('profit');
    const [moverGroup, setMoverGroup] = useState<'Vertical' | 'Book' | 'Market'>('Vertical');

    // Alert Center State
    const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
    const [alertFilter, setAlertFilter] = useState<'All' | 'Critical' | 'Risk' | 'Execution' | 'Finance'>('All');
    const [alertSearch, setAlertSearch] = useState('');
    const [alertSort, setAlertSort] = useState<'Time' | 'Impact'>('Time');
    const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

    // Chart Refs
    const chartEquityRef = useRef<HTMLCanvasElement>(null);
    const chartRightRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<any[]>([]);

    // --- INIT DATA (Optimized: No Timeout) ---
    useEffect(() => {
        // Generate data immediately. It's synchronous but fast enough. 
        // If it were heavier, we'd use a Web Worker, but for <5000 items JS is fine.
        const data = generateMockData();
        setRawData(data);
    }, []);

    // --- FILTER ENGINE ---
    const { metrics, filteredData } = useMemo(() => {
        if (rawData.length === 0) return { metrics: null, filteredData: [] };

        const today = new Date();
        let startDate = new Date();
        let endDate = new Date();

        switch (dateFilter) {
            case '7D': startDate.setDate(today.getDate() - 7); break;
            case '30D': startDate.setDate(today.getDate() - 30); break;
            case '90D': startDate.setDate(today.getDate() - 90); break;
            case 'YTD': startDate = new Date(today.getFullYear(), 0, 1); break;
            case 'MTD': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'CUSTOM':
                if (customStart) startDate = new Date(customStart);
                if (customEnd) endDate = new Date(customEnd);
                break;
        }

        const startIso = startDate.toISOString().split('T')[0];
        const endIso = endDate.toISOString().split('T')[0];

        // Filter Trades
        const filtered = rawData.filter(t => t.date >= startIso && t.date <= endIso);

        const closedTrades = filtered.filter(t => t.result !== 'PENDING');
        const openTrades = rawData.filter(t => t.result === 'PENDING');

        // Calculations (Memoized)
        const totalStake = closedTrades.reduce((acc, t) => acc + t.stake, 0);
        const totalProfit = closedTrades.reduce((acc, t) => acc + t.profit, 0);
        const roi = totalStake ? totalProfit / totalStake : 0;

        // Drawdown
        const sortedTrades = [...closedTrades].sort((a, b) => a.date.localeCompare(b.date));
        let run = 0;
        let peak = -Infinity;
        let currentDD = 0;
        let maxDD = 0;

        const dailyMap = new Map<string, { global: number, picks: number, val: number, sure: number }>();

        sortedTrades.forEach(t => {
            run += t.profit;
            if (run > peak) peak = run;
            currentDD = peak - run;
            if (currentDD > maxDD) maxDD = currentDD;

            if (!dailyMap.has(t.date)) dailyMap.set(t.date, { global: 0, picks: 0, val: 0, sure: 0 });
            const d = dailyMap.get(t.date)!;
            d.global += t.profit;
            if (t.vertical === 'Picks EV+') d.picks += t.profit;
            if (t.vertical === 'Valuebets') d.val += t.profit;
            if (t.vertical === 'SurebettingEC') d.sure += t.profit;
        });

        const initialBank = 25000;
        const currentBank = initialBank + totalProfit;
        const maxDDPct = maxDD / (initialBank + Math.max(peak, 0));
        const currentDDPct = currentDD / (initialBank + Math.max(peak, 0));

        const openExposure = openTrades.reduce((acc, t) => acc + t.stake, 0);
        const cashAvailable = currentBank - openExposure;
        const cashFreePct = currentBank ? cashAvailable / currentBank : 0;

        const uniqueDays = new Set(closedTrades.map(t => t.date)).size;
        const avgDailyProfit = uniqueDays ? totalProfit / uniqueDays : 0;
        const avgDailyVol = uniqueDays ? totalStake / uniqueDays : 0;
        const globalEQS = 88;

        const dates = Array.from(dailyMap.keys()).sort();
        let accG = 0, accP = 0, accV = 0, accS = 0;
        const curveGlobal: number[] = [];
        const curvePicks: number[] = [];
        const curveVal: number[] = [];
        const curveSure: number[] = [];

        dates.forEach(d => {
            const val = dailyMap.get(d)!;
            accG += val.global; accP += val.picks; accV += val.val; accS += val.sure;
            curveGlobal.push(accG);
            curvePicks.push(accP);
            curveVal.push(accV);
            curveSure.push(accS);
        });

        const verts: Trade['vertical'][] = ['Picks EV+', 'Valuebets', 'SurebettingEC'];
        const vertStats = verts.map(v => {
            const vt = closedTrades.filter(t => t.vertical === v);
            const p = vt.reduce((a, b) => a + b.profit, 0);
            const s = vt.reduce((a, b) => a + b.stake, 0);
            return { name: v, profit: p, volume: s, roi: s ? p / s : 0 };
        });
        const leader = [...vertStats].sort((a, b) => b.profit - a.profit)[0];
        const worst = [...vertStats].sort((a, b) => a.profit - b.profit)[0];

        const moversMap = new Map<string, number>();
        closedTrades.forEach(t => {
            let key: string = t.vertical;
            if (moverGroup === 'Book') key = t.bookmaker;
            if (moverGroup === 'Market') key = t.market;
            moversMap.set(key, (moversMap.get(key) || 0) + t.profit);
        });
        const moverList = Array.from(moversMap.entries()).map(([k, v]) => ({ name: k, val: v }));
        const topContributors = moverList.filter(m => m.val > 0).sort((a, b) => b.val - a.val).slice(0, 5);
        const topDrains = moverList.filter(m => m.val < 0).sort((a, b) => a.val - b.val).slice(0, 5);

        return {
            metrics: {
                profit: totalProfit,
                volume: totalStake,
                avgVolume: avgDailyVol,
                roi,
                currentDD: currentDD,
                currentDDPct,
                maxDD: maxDD,
                maxDDPct,
                cash: cashAvailable,
                cashFreePct,
                activeOps: openTrades.length,
                exposure: openExposure,
                avgDailyProfit,
                eqs: globalEQS,
                leader,
                worst,
                dates,
                curveGlobal,
                curvePicks,
                curveVal,
                curveSure,
                topContributors,
                topDrains,
                vertStats
            },
            filteredData: filtered
        };
    }, [rawData, dateFilter, customStart, customEnd, moverGroup]);

    // --- CHARTS RENDERING (Optimized & Polished) ---
    useEffect(() => {
        if (!metrics || !window.Chart) return;

        // Set Global Chart Defaults for "Institutional" look
        window.Chart.defaults.font.family = '"Inter", sans-serif';
        window.Chart.defaults.color = '#94a3b8'; // Text Secondary
        window.Chart.defaults.borderColor = 'rgba(51, 65, 85, 0.2)'; // Border Dark, low opacity

        const rafId = requestAnimationFrame(() => {
            chartInstances.current.forEach(c => c.destroy());
            chartInstances.current = [];

            // Common Chart Options for High-DPI/Retina look
            const commonOpts = {
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: window.devicePixelRatio || 1, // Ensure crisp rendering
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate-900, almost opaque
                        titleColor: '#f8fafc', // Slate-50
                        titleFont: { family: 'Inter', size: 13, weight: '600' },
                        bodyColor: '#cbd5e1', // Slate-300
                        bodyFont: { family: 'Inter', size: 12, weight: '500' },
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 4,
                        usePointStyle: true,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: { label: (c: any) => ` ${c.dataset.label}: ${fmtMoney(c.raw)}` }
                    }
                },
                animation: { duration: 600, easing: 'easeOutQuart' },
                scales: {
                    x: {
                        grid: { display: false, drawBorder: false }, // Cleaner X axis
                        ticks: { color: '#94a3b8', maxTicksLimit: 7, font: { family: 'Inter', size: 11, weight: '500' } }
                    },
                    y: {
                        grid: { color: 'rgba(51, 65, 85, 0.15)', borderDash: [4, 4], drawBorder: false }, // Subtle dashed grid
                        ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11, weight: '500' }, callback: (v: any) => '$' + v / 1000 + 'k', padding: 8 }
                    }
                }
            };

            // 1. EQUITY CHART
            if (chartEquityRef.current) {
                const ctx = chartEquityRef.current.getContext('2d');
                const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                gradient.addColorStop(0, 'rgba(19, 91, 236, 0.25)'); // Richer blue at top
                gradient.addColorStop(0.5, 'rgba(19, 91, 236, 0.05)');
                gradient.addColorStop(1, 'rgba(19, 91, 236, 0)');

                const datasets: any[] = [{
                    label: 'Global Equity',
                    data: metrics.curveGlobal,
                    borderColor: '#135bec', // Primary Blue
                    borderWidth: 3, // Slightly thicker for emphasis
                    backgroundColor: gradient,
                    fill: true,
                    pointRadius: 0,
                    pointHitRadius: 20,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#ffffff',
                    pointHoverBorderColor: '#135bec',
                    pointHoverBorderWidth: 3,
                    tension: 0.3 // Smooth curve
                }];

                if (chartMode === 'ALL') {
                    datasets.push(
                        // Thinner, dashed, lower opacity for comparisons
                        { label: 'Picks EV+', data: metrics.curvePicks, borderColor: 'rgba(16, 185, 129, 0.8)', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, tension: 0.3 },
                        { label: 'Valuebets', data: metrics.curveVal, borderColor: 'rgba(168, 85, 247, 0.8)', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, tension: 0.3 },
                        { label: 'SurebettingEC', data: metrics.curveSure, borderColor: 'rgba(245, 158, 11, 0.8)', borderDash: [6, 6], borderWidth: 2, pointRadius: 0, tension: 0.3 }
                    );
                }

                chartInstances.current.push(new window.Chart(ctx, {
                    type: 'line',
                    data: { labels: metrics.dates.map(d => formatDate(d)), datasets },
                    options: {
                        ...commonOpts,
                        plugins: {
                            ...commonOpts.plugins,
                            legend: {
                                display: true,
                                position: 'top',
                                align: 'end',
                                labels: { color: '#94a3b8', boxWidth: 8, boxHeight: 8, usePointStyle: true, font: { family: 'Inter', size: 11, weight: '500' }, padding: 20 }
                            },
                        }
                    }
                }));
            }

            // 2. VERTICAL CHART
            if (chartRightRef.current) {
                const labels = metrics.vertStats.map((v: any) => v.name);
                const vals = metrics.vertStats.map((v: any) => rightChartMetric === 'roi' ? v.roi * 100 : v[rightChartMetric]);
                const colors = labels.map((l: string) => l === 'Picks EV+' ? '#10b981' : l === 'Valuebets' ? '#a855f7' : '#f59e0b');
                const hoverColors = labels.map((l: string) => l === 'Picks EV+' ? '#34d399' : l === 'Valuebets' ? '#c084fc' : '#fbbf24');

                chartInstances.current.push(new window.Chart(chartRightRef.current, {
                    type: 'bar',
                    data: {
                        labels,
                        datasets: [{
                            data: vals,
                            backgroundColor: colors,
                            hoverBackgroundColor: hoverColors,
                            borderRadius: 4,
                            borderSkipped: false,
                            barPercentage: 0.6,
                            categoryPercentage: 0.8
                        }]
                    },
                    options: {
                        indexAxis: 'y',
                        responsive: true,
                        maintainAspectRatio: false,
                        devicePixelRatio: window.devicePixelRatio || 1,
                        plugins: {
                            legend: { display: false },
                            tooltip: {
                                ...commonOpts.plugins.tooltip,
                                callbacks: {
                                    label: (c: any) => {
                                        const val = rightChartMetric === 'roi' ? c.raw.toFixed(2) + '%' : fmtMoney(c.raw);
                                        return ` ${c.label}: ${val}`;
                                    }
                                }
                            }
                        },
                        scales: {
                            x: {
                                grid: { color: 'rgba(51, 65, 85, 0.15)', borderDash: [4, 4], drawBorder: false },
                                ticks: { color: '#94a3b8', font: { size: 10, family: 'Inter', weight: '500' }, callback: (v: any) => rightChartMetric === 'roi' ? v + '%' : '$' + v / 1000 + 'k' }
                            },
                            y: {
                                grid: { display: false, drawBorder: false },
                                ticks: { color: '#f1f5f9', font: { size: 11, weight: '600', family: 'Inter' } }
                            }
                        }
                    }
                }));
            }
        });

        return () => cancelAnimationFrame(rafId);
    }, [metrics, chartMode, rightChartMetric]);

    // --- ALERT FILTERING & LOGIC ---
    const displayedAlerts = useMemo(() => {
        let res = alerts;
        if (alertFilter !== 'All') res = res.filter(a => a.severity === alertFilter);
        if (alertSearch) res = res.filter(a => a.title.toLowerCase().includes(alertSearch.toLowerCase()));

        // Sort
        if (alertSort === 'Time') res = res.sort((a, b) => a.timestampVal - b.timestampVal);
        // Rough mock sort for impact (string length as proxy for this mock)
        if (alertSort === 'Impact') res = res.sort((a, b) => b.impact.length - a.impact.length);

        return res;
    }, [alerts, alertFilter, alertSearch, alertSort]);

    const toggleAlertRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: !a.isRead } : a));
    };

    const handleAlertClick = (id: string) => {
        setExpandedAlert(expandedAlert === id ? null : id);
        // Mark as read on expand
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    };

    // If we haven't generated metrics yet, show skeleton, but fast
    if (!metrics) return <DashboardSkeleton />;

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-background-light dark:bg-background-dark font-sans text-slate-900 dark:text-white transition-colors">

            {/* 1. TOP BAR */}
            <header className="flex-shrink-0 bg-white/80 dark:bg-surface-dark/90 backdrop-blur-md border-b border-gray-200 dark:border-border-dark px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 z-20 sticky top-0">
                <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
                    <h1 className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">DASHBOARD EJECUTIVO</h1>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full animate-in fade-in zoom-in duration-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">Sistema en línea</span>
                    </div>
                    <span className="hidden lg:inline text-xs text-text-secondary">Actualizado hace 0 min</span>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    {/* DATE FILTER - Horizontal scroll on mobile */}
                    <div className="flex items-center bg-gray-100 dark:bg-background-dark rounded-lg p-1 border border-gray-200 dark:border-border-dark shadow-inner overflow-x-auto max-w-full">
                        {(['MTD', '7D', '30D', '90D', 'YTD'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setDateFilter(f)}
                                className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded transition-all duration-200 whitespace-nowrap flex-shrink-0 ${dateFilter === f ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow-sm' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
                            >
                                {f === 'MTD' ? 'Mes' : f}
                            </button>
                        ))}
                        <button
                            onClick={() => setDateFilter('CUSTOM')}
                            className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase rounded transition-all duration-200 whitespace-nowrap flex-shrink-0 ${dateFilter === 'CUSTOM' ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow-sm' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            Custom
                        </button>
                    </div>

                    <button
                        onClick={() => navigate('/control-global')}
                        className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 flex-shrink-0"
                    >
                        <span className="material-symbols-outlined text-[16px]">fact_check</span> Auditar KPIs
                    </button>
                </div>
            </header>

            {/* CUSTOM DATE PICKER */}
            {dateFilter === 'CUSTOM' && (
                <div className="bg-surface-dark border-b border-border-dark px-6 py-2 flex items-center gap-4 animate-in slide-in-from-top-2">
                    <span className="text-xs font-bold text-text-secondary uppercase">Rango:</span>
                    <input type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} className="bg-background-dark border border-border-dark text-white text-xs rounded px-2 py-1 outline-none focus:border-primary" />
                    <span className="text-text-secondary text-xs">-</span>
                    <input type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} className="bg-background-dark border border-border-dark text-white text-xs rounded px-2 py-1 outline-none focus:border-primary" />
                    <button className="text-xs text-primary hover:text-white underline" onClick={() => { setCustomStart(''); setCustomEnd(''); setDateFilter('MTD'); }}>Cancelar</button>
                </div>
            )}

            {/* SCROLLABLE CONTENT */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">

                {/* 2. KPI ROW 1 (Critical) */}
                {metrics && (
                    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
                        <CeoKpi
                            title="Profit Neto (Global)"
                            value={fmtMoney(metrics.profit)}
                            delta="+4.5%"
                            isPositive={metrics.profit > 0}
                            tooltip="Ganancia o pérdida neta realizada en todas las verticales durante el periodo seleccionado."
                        />
                        <CeoKpi
                            title="Total Apostado"
                            value={fmtMoney(metrics.volume)}
                            sub={`Prom. diario: ${fmtMoney(metrics.avgVolume)}`}
                            tooltip="Volumen total de dinero arriesgado (Stake) en apuestas resueltas."
                        />
                        <CeoKpi
                            title="ROI Global"
                            value={fmtPct(metrics.roi, true)}
                            delta="+1.2 pts"
                            isPositive={metrics.roi > 0}
                            tooltip="Retorno sobre la Inversión: Profit Total / Total Apostado."
                        />
                        <CeoKpi
                            title="Drawdown Actual"
                            value={metrics.currentDDPct === 0 ? "En máximo (ATH)" : fmtPct(metrics.currentDDPct)}
                            sub={metrics.currentDD === 0 ? "Sin pérdidas" : `Val: ${fmtMoney(metrics.currentDD)}`}
                            isDanger={metrics.currentDDPct > 0.1}
                            isSuccess={metrics.currentDDPct === 0}
                            tooltip="Caída porcentual actual desde el pico histórico de la cuenta."
                        />
                        <CeoKpi
                            title="Drawdown Máximo (Periodo)"
                            value={fmtPct(metrics.maxDDPct)}
                            sub="De pico a valle"
                            isDanger={metrics.maxDDPct > 0.15}
                            tooltip="La mayor caída registrada en el capital durante este periodo."
                        />
                        <CeoKpi
                            title="Caja Disponible"
                            value={fmtMoney(metrics.cash)}
                            sub={`Libre: ${fmtPct(metrics.cashFreePct)}`}
                            icon="account_balance_wallet"
                            tooltip="Capital líquido disponible para nuevas operaciones (Total - Exposición)."
                        />
                    </div>
                )}

                {/* 3. KPI ROW 2 (Operational Strip) */}
                {metrics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {metrics.activeOps > 0 ? (
                            <StripKpi
                                label="Operaciones Activas (En Vivo)"
                                val1={`${metrics.activeOps} Abiertas`}
                                val2={`Exp: ${fmtMoney(metrics.exposure)}`}
                                icon="radar"
                                animateIcon
                            />
                        ) : (
                            <div className="px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 shadow-sm flex items-center justify-between">
                                <div>
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-wider mb-0.5">Estado Operativo</p>
                                    <span className="text-lg font-bold text-white">Sin operaciones</span>
                                </div>
                                <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                            </div>
                        )}

                        <StripKpi label="Ganancia Diaria Promedio" val1={fmtMoney(metrics.avgDailyProfit)} trend="up" icon="trending_up" />
                        <StripKpi label="Apostado Diario Promedio" val1={fmtMoney(metrics.avgVolume)} trend="up" icon="bar_chart" />
                        <StripKpi
                            label="EQS Global (Calidad)"
                            val1={`${metrics.eqs}/100`}
                            tag="Excelente"
                            tagCol="success"
                            icon="verified"
                            onClick={() => navigate('/ops/valuebets/quality')}
                            tooltip="Puntaje de Calidad de Ejecución: Mide slippage, latencia y errores operativos."
                        />
                    </div>
                )}

                {/* 4. MAIN CHART AREA + RIGHT COLUMN */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* MAIN CHART */}
                    <div className="lg:col-span-2 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-3 sm:p-5 shadow-sm flex flex-col min-h-[300px] sm:min-h-[400px] transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700">
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
                            <div>
                                <h3 className="text-sm sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">CURVA DE EQUITY GLOBAL</h3>
                                <p className="text-[10px] sm:text-xs text-text-secondary font-medium">Crecimiento de Capital Consolidado</p>
                            </div>
                            <div className="flex bg-gray-100 dark:bg-background-dark rounded p-0.5 border border-gray-200 dark:border-border-dark">
                                <button onClick={() => setChartMode('ALL')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${chartMode === 'ALL' ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}>Global + Verticales</button>
                                <button onClick={() => setChartMode('GLOBAL')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-all ${chartMode === 'GLOBAL' ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}>Solo Global</button>
                            </div>
                        </div>
                        <div className="flex-1 relative w-full">
                            <canvas ref={chartEquityRef}></canvas>
                        </div>
                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="flex flex-col gap-6">

                        {/* A) Performance by Vertical */}
                        {metrics && (
                            <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 shadow-sm flex flex-col h-[280px] transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase">Rendimiento por Vertical</h3>
                                    <div className="flex gap-1">
                                        {[
                                            { k: 'profit', l: 'Profit' },
                                            { k: 'volume', l: 'Volumen' },
                                            { k: 'roi', l: 'ROI' }
                                        ].map(m => (
                                            <button key={m.k} onClick={() => setRightChartMetric(m.k as any)} className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border transition-colors ${rightChartMetric === m.k ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white border-transparent shadow-sm' : 'border-transparent text-text-secondary hover:border-gray-600'}`}>{m.l}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex-1 relative w-full"><canvas ref={chartRightRef}></canvas></div>
                                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-border-dark flex justify-between text-[10px]">
                                    <div><span className="text-text-secondary">Líder:</span> <span className="font-bold text-emerald-500 ml-1">{metrics.leader.name}</span></div>
                                    {metrics.worst.profit < 0 && <div><span className="text-text-secondary">Peor:</span> <span className="font-bold text-rose-500 ml-1">{metrics.worst.name}</span></div>}
                                </div>
                            </div>
                        )}

                        {/* B) Alert Center (IMPROVED UX) */}
                        <div className="flex-1 bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-0 shadow-sm flex flex-col overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700">
                            {/* Alert Header */}
                            <div className="p-3 border-b border-gray-200 dark:border-border-dark bg-gray-50 dark:bg-background-dark flex flex-col gap-3">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Centro de Alertas
                                        {alerts.some(a => !a.isRead) && <span className="ml-1 w-2 h-2 rounded-full bg-primary"></span>}
                                    </h3>
                                    <div className="flex gap-1">
                                        {['All', 'Critical', 'Risk', 'Execution', 'Finance'].map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setAlertFilter(t as any)}
                                                className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded transition-colors ${alertFilter === t ? 'bg-gray-200 dark:bg-border-dark text-slate-900 dark:text-white' : 'text-text-secondary hover:text-white'}`}
                                            >
                                                {t === 'All' ? 'Todas' : t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Buscar alertas..."
                                        value={alertSearch}
                                        onChange={(e) => setAlertSearch(e.target.value)}
                                        className="flex-1 px-2 py-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded text-xs text-slate-900 dark:text-white outline-none focus:border-primary placeholder-text-secondary"
                                    />
                                    <select
                                        value={alertSort}
                                        onChange={(e) => setAlertSort(e.target.value as any)}
                                        className="px-2 py-1 bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark rounded text-xs text-slate-900 dark:text-white outline-none focus:border-primary cursor-pointer"
                                    >
                                        <option value="Time">Recientes</option>
                                        <option value="Impact">Impacto</option>
                                    </select>
                                </div>
                            </div>

                            {/* Alert List */}
                            <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                                {displayedAlerts.length === 0 ? (
                                    <div className="p-8 text-center text-text-secondary text-xs">No hay alertas que coincidan.</div>
                                ) : (
                                    displayedAlerts.map(alert => (
                                        <div
                                            key={alert.id}
                                            className={`border-b border-gray-100 dark:border-border-dark transition-colors cursor-pointer ${expandedAlert === alert.id ? 'bg-gray-50 dark:bg-card-dark' : 'hover:bg-gray-50 dark:hover:bg-card-dark/50'}`}
                                            onClick={() => handleAlertClick(alert.id)}
                                        >
                                            <div className="p-3 flex items-start gap-3">
                                                {/* Severity Icon */}
                                                <div className={`mt-0.5 p-1.5 rounded-md flex-shrink-0 ${alert.severity === 'Critical' ? 'bg-rose-500/10 text-rose-500' : alert.severity === 'Risk' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                                    <span className="material-symbols-outlined text-[16px]">{alert.categoryIcon}</span>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <div className="flex items-center gap-2">
                                                            <p className={`text-xs font-bold leading-tight ${alert.isRead ? 'text-text-secondary' : 'text-slate-900 dark:text-white'}`}>
                                                                {alert.title}
                                                            </p>
                                                            {!alert.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"></span>}
                                                        </div>
                                                        <span className="text-[9px] text-text-secondary whitespace-nowrap ml-2">{alert.time}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-text-secondary font-medium bg-gray-100 dark:bg-background-dark px-1.5 rounded">{alert.impact}</span>
                                                        <span className={`text-[10px] font-bold px-1 rounded ${alert.severity === 'Critical' ? 'text-rose-500' : 'text-text-secondary'}`}>{alert.severity}</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => toggleAlertRead(alert.id, e)}
                                                    className="text-text-secondary hover:text-primary transition-colors p-1"
                                                    title={alert.isRead ? "Marcar como no leída" : "Marcar como leída"}
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">{alert.isRead ? 'drafts' : 'mark_email_read'}</span>
                                                </button>
                                            </div>

                                            {/* Expanded Details */}
                                            {expandedAlert === alert.id && (
                                                <div className="px-3 pb-3 pt-0 ml-[42px] animate-in slide-in-from-top-1">
                                                    <div className="text-[10px] text-text-secondary bg-background-light dark:bg-background-dark p-2 rounded border border-gray-200 dark:border-border-dark space-y-2">
                                                        <div>
                                                            <span className="font-bold block text-slate-700 dark:text-gray-300">Causa Probable:</span>
                                                            {alert.cause}
                                                        </div>
                                                        <div>
                                                            <span className="font-bold block text-slate-700 dark:text-gray-300">Acción Recomendada:</span>
                                                            {alert.action}
                                                        </div>
                                                        <div className="pt-1 flex justify-end">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); navigate('/control-global'); }}
                                                                className="text-[10px] bg-primary hover:bg-primary-hover text-white px-3 py-1 rounded font-bold transition-colors"
                                                            >
                                                                Ver Detalles
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. BOTTOM SECTION: Top Movers */}
                {metrics && (
                    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-border-dark rounded-xl p-5 shadow-sm transition-all duration-300 hover:border-gray-300 dark:hover:border-gray-700">
                        <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-border-dark pb-3">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">swap_vert</span> Top Movimientos (Periodo)
                            </h3>
                            <div className="flex bg-gray-100 dark:bg-background-dark rounded-lg p-1">
                                {[
                                    { k: 'Vertical', l: 'Vertical' },
                                    { k: 'Book', l: 'Casa' },
                                    { k: 'Market', l: 'Mercado' }
                                ].map(g => (
                                    <button key={g.k} onClick={() => setMoverGroup(g.k as any)} className={`px-3 py-1 text-[10px] font-bold uppercase rounded transition-colors ${moverGroup === g.k ? 'bg-white dark:bg-border-dark text-slate-900 dark:text-white shadow' : 'text-text-secondary hover:text-slate-900 dark:hover:text-white'}`}>{g.l}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Contributors */}
                            <div>
                                <h4 className="text-xs font-bold text-emerald-500 uppercase mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_up</span> Mejores Contribuyentes (Profit)</h4>
                                <div className="space-y-2">
                                    {metrics.topContributors.map((m, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded bg-emerald-500/5 border border-emerald-500/10 hover:bg-emerald-500/10 transition-colors">
                                            <span className="text-xs font-bold text-slate-700 dark:text-white">{m.name}</span>
                                            <span className="text-xs font-mono font-bold text-emerald-500">+{fmtMoney(m.val)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {/* Drains */}
                            <div>
                                <h4 className="text-xs font-bold text-rose-500 uppercase mb-3 flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">trending_down</span> Mayores Pérdidas (Profit)</h4>
                                <div className="space-y-2">
                                    {metrics.topDrains.length > 0 ? metrics.topDrains.map((m, i) => (
                                        <div key={i} className="flex justify-between items-center p-2 rounded bg-rose-500/5 border border-rose-500/10 hover:bg-rose-500/10 transition-colors">
                                            <span className="text-xs font-bold text-slate-700 dark:text-white">{m.name}</span>
                                            <span className="text-xs font-mono font-bold text-rose-500">{fmtMoney(m.val)}</span>
                                        </div>
                                    )) : <div className="text-xs text-text-secondary italic p-2">Sin pérdidas significativas este periodo.</div>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

// --- SUB COMPONENTS ---

const CeoKpi = ({ title, value, delta, sub, isPositive, isDanger, isSuccess, icon, onClick, tooltip }: any) => (
    <div onClick={onClick} className={`relative p-4 rounded-xl border bg-white dark:bg-surface-dark ${isDanger ? 'border-rose-500/30 bg-rose-500/5' : isSuccess ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-gray-200 dark:border-border-dark'} shadow-sm hover:border-primary/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group`}>
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-wider">{title}</p>
                {tooltip && (
                    <PortalTooltip text={tooltip}>
                        <span className="material-symbols-outlined text-[14px] text-text-secondary/50 hover:text-text-secondary cursor-help">info</span>
                    </PortalTooltip>
                )}
            </div>
            {icon && <span className="material-symbols-outlined text-text-secondary text-[16px] group-hover:text-primary transition-colors">{icon}</span>}
        </div>
        <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isDanger ? 'text-rose-500' : isSuccess || isPositive ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>{value}</span>
            {delta && <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isPositive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 dark:bg-gray-800 text-text-secondary'}`}>{delta}</span>}
        </div>
        {sub && <p className={`text-[10px] mt-1 font-medium ${isDanger ? 'text-rose-400' : isSuccess ? 'text-emerald-500' : 'text-text-secondary'}`}>{sub}</p>}
    </div>
);

const StripKpi = ({ label, val1, val2, trend, tag, tagCol, icon, onClick, tooltip, animateIcon }: any) => (
    <div onClick={onClick} className={`px-4 py-3 rounded-xl border border-gray-200 dark:border-border-dark bg-white dark:bg-surface-dark shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group`}>
        <div>
            <div className="flex items-center gap-1 mb-0.5">
                <p className="text-[9px] font-black text-text-secondary uppercase tracking-wider">{label}</p>
                {tooltip && <PortalTooltip text={tooltip}><span className="material-symbols-outlined text-[12px] text-text-secondary/50 cursor-help">info</span></PortalTooltip>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-slate-900 dark:text-white">{val1}</span>
                {trend && <span className={`material-symbols-outlined text-sm ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>{trend === 'up' ? 'trending_up' : 'trending_down'}</span>}
                {tag && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${tagCol === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 text-gray-500'}`}>{tag}</span>}
            </div>
            {val2 && <p className="text-[9px] text-text-secondary font-medium">{val2}</p>}
        </div>
        {icon && (
            <div className={`p-2 bg-gray-50 dark:bg-background-dark rounded-lg border border-gray-100 dark:border-border-dark group-hover:border-primary/30 transition-colors`}>
                <span className={`material-symbols-outlined text-primary text-[18px] ${animateIcon ? 'animate-pulse' : ''}`}>{icon}</span>
            </div>
        )}
    </div>
);

const DashboardSkeleton = () => (
    <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-surface-dark rounded-xl border border-border-dark"></div>)}
        </div>
        <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-surface-dark rounded-xl border border-border-dark"></div>)}
        </div>
        <div className="h-96 bg-surface-dark rounded-xl border border-border-dark"></div>
    </div>
);

export default GlobalDashboard;