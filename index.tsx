
declare const Chart: any;

/**
 * WISEBET LAB - ULTIMATE ANALYTICS V13 ULTRA PRO
 * Analytics Terminal con Simulación de Banca Real-Time.
 */

const STORAGE_KEY = 'wisebet_data_v4';
const CONFIG_KEY = 'wisebet_config_v4';
const AUTH_KEY = 'wisebet_auth_v4';
const DEFAULT_AUTH = 'admin123';
const fUSD = (v: number) => new Intl.NumberFormat('es-US', { style: 'currency', currency: 'USD' }).format(v);
const fPct = (v: number) => (v || 0).toFixed(2) + '%';
const fNum = (v: number) => (v || 0).toFixed(2);

function safeParse(key: string, fallback: any) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (e) {
        console.error(`Error parsing ${key}:`, e);
        return fallback;
    }
}

function newChart(id: string, type: string, labels: any[], datasets: any[], allowZoom = false, isMoney = false) {
    if (state.charts[id]) state.charts[id].destroy();
    const canvas = document.getElementById(id) as HTMLCanvasElement;
    if (!canvas) return;

    const options: any = {
        indexAxis: 'x',
        responsive: true,
        maintainAspectRatio: false,
        animation: {
            duration: 600,
            easing: 'easeOutExpo'
        },
        layout: {
            padding: { top: 20, bottom: 20, left: 15, right: 30 }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                align: 'end',
                labels: {
                    color: '#94a3b8',
                    usePointStyle: true,
                    pointStyle: 'circle',
                    padding: 30,
                    font: { size: 11, weight: '800', family: 'Plus Jakarta Sans' }
                }
            },
            tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(5, 7, 12, 0.98)',
                titleColor: '#fff',
                titleFont: { size: 14, weight: '900', family: 'Outfit' },
                bodyColor: '#94a3b8',
                bodyFont: { family: 'JetBrains Mono', size: 12, weight: '700' },
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 16,
                displayColors: true,
                cornerRadius: 12,
                caretSize: 6,
                callbacks: {
                    label: function (context: any) {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== undefined) {
                            const val = context.parsed.y;
                            const formatted = isMoney ? fUSD(val) : val.toFixed(2) + '%';
                            return `${label} ${formatted}`;
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                stacked: false,
                ticks: {
                    color: '#94a3b8',
                    font: { size: 10, weight: '700', family: 'Outfit' },
                    padding: 12,
                    maxRotation: 0,
                    autoSkip: true,
                    autoSkipPadding: 40
                },
                grid: {
                    display: true,
                    color: 'rgba(255,255,255,0.02)',
                    drawBorder: false
                }
            },
            y: {
                stacked: false,
                beginAtZero: true,
                ticks: {
                    color: '#94a3b8',
                    font: { size: 11, weight: '800', family: 'JetBrains Mono' },
                    padding: 15,
                    callback: (val: any) => {
                        if (isMoney) {
                            if (val === 0) return '$0';
                            if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
                            if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'k';
                            return '$' + val.toLocaleString();
                        }
                        return val.toFixed(0) + '%';
                    }
                },
                grid: {
                    color: 'rgba(255,255,255,0.04)',
                    drawBorder: false,
                    lineWidth: 1
                }
            }
        },
        elements: {
            line: {
                tension: 0.3,
                borderWidth: 3,
                capBezierPoints: true
            },
            point: {
                radius: 0,
                hitRadius: 15,
                hoverRadius: 6
            }
        }
    };

    if (allowZoom) {
        options.plugins.zoom = {
            zoom: {
                wheel: { enabled: true, speed: 0.1 },
                pinch: { enabled: true },
                mode: 'x',
            },
            pan: {
                enabled: true,
                mode: 'x',
                threshold: 10
            }
        };
    }
    state.charts[id] = new Chart(canvas, { type, data: { labels, datasets }, options });
}

let state: any = {
    picks: [],
    charts: {} as Record<string, any>,
    config: {
        bank: 10000,
        stakePct: 1,
        planConfigs: { 'ELITE': 1, 'PREMIUM': 1, 'STANDARD': 1, 'PERSONAL': 1 },
        planBanks: { 'ELITE': 2500, 'PREMIUM': 2500, 'STANDARD': 2500, 'PERSONAL': 2500 },
        useGlobalBank: true,
        editMode: false
    },
    pagination: { currentPage: 1, rowsPerPage: 100 },
    filters: {
        dateRange: 'ALL', dateStart: '', dateEnd: '', source: [], market: [],
        result: 'ALL', search: '', filterDrawdown: 'OFF', oddsRange: 'ALL'
    },
    tempRangeStart: null,
    tempRangeEnd: null
};

async function loadState() {
    try {
        const res = await fetch('/api/data');
        const db = await res.json();

        // Server (database.json) is the ONLY authority for picks
        if (db.picks) {
            state.picks = db.picks;
            state.config = { ...state.config, ...db.config };
        }

        // Configuration can still have local preference if server is empty
        const localConfig = safeParse(CONFIG_KEY, null);
        if (localConfig && (!db.config || Object.keys(db.config).length === 0)) {
            state.config = { ...state.config, ...localConfig };
        }

        // Migrate structure if needed
        state.picks = state.picks.map((p: any) => {
            if (!p.matches) p.matches = [{ event: p.event || '---', bet: p.bet || '---' }];
            return p;
        });

        // Forced cleanup on load
        removeDuplicates();
    } catch (e) {
        console.error("Error loading state from server:", e);
    }
}



function extractTotalGoals(resultStr: string): number | null {
    if (!resultStr) return null;
    const scoreMatch = resultStr.match(/(\d+)\s*[\-\: ]\s*(\d+)/);
    if (scoreMatch) return parseInt(scoreMatch[1]) + parseInt(scoreMatch[2]);
    const singleNumMatch = resultStr.match(/^\d+$/);
    if (singleNumMatch) return parseInt(singleNumMatch[0]);
    return null;
}

function getMarketLabel(bet: string): string {
    const b = (bet || '').toUpperCase();
    if (b.includes('BTTS')) return 'BTTS';
    if (b.includes('OVER')) return 'OVERS';
    if (b.includes('UNDER')) return 'UNDERS';
    if (b.includes('CORNER')) return 'CORNERS';
    if (b.includes('DNB') || b.includes('DRAW NO BET')) return 'DNB';
    if (b.includes('1X2')) return '1X2';
    if (b.startsWith('1 ') || b === '1') return '1';
    if (b.startsWith('X ') || b === 'X') return 'X';
    if (b.startsWith('2 ') || b === '2') return '2';
    if (b.startsWith('1X ') || b === '1X') return '1X';
    if (b.startsWith('X2 ') || b === 'X2') return 'X2';
    if (b.includes('AH') || b.includes('ASIAN HANDICAP')) return 'AH';

    const keywords = ['BTTS', 'OVER', 'UNDER', 'CORNER', 'DNB', 'AH'];
    for (const k of keywords) {
        if (b.includes(k)) {
            if (k === 'OVER') return 'OVERS';
            if (k === 'UNDER') return 'UNDERS';
            if (k === 'CORNER') return 'CORNERS';
            return k;
        }
    }
    return 'OTRO';
}

function settleAsianTotal(market: string, odds: number, stake: number, totalGoals: number) {
    const asianMatch = market.match(/(Over|Under)\s+([\d.]+),([\d.]+)/i) || market.match(/(Over|Under)\s+([\d.]+)/i);
    if (!asianMatch) return null;

    const type = asianMatch[1].toLowerCase();
    let l1 = parseFloat(asianMatch[2]);
    let l2 = asianMatch[3] ? parseFloat(asianMatch[3]) : l1;

    // Handle .25 and .75 (e.g., Over 2.25 -> 2.0 & 2.5, Over 2.75 -> 2.5 & 3.0)
    if (!asianMatch[3]) {
        const mod = l1 % 1;
        if (Math.abs(mod - 0.25) < 0.001) {
            l2 = l1 + 0.25;
            l1 = l1 - 0.25;
        } else if (Math.abs(mod - 0.75) < 0.001) {
            l2 = l1 + 0.25;
            l1 = l1 - 0.25;
        }
    }

    if (Math.abs(l1 - l2) !== 0.5 && l1 !== l2) return null;

    const subStake = stake / 2;
    const settle = (line: number) => {
        if (type === 'over') {
            if (totalGoals > line) return 'WIN';
            if (totalGoals === line) return 'PUSH';
            return 'LOSS';
        } else {
            if (totalGoals < line) return 'WIN';
            if (totalGoals === line) return 'PUSH';
            return 'LOSS';
        }
    };

    const r1 = settle(l1);
    const r2 = settle(l2);
    const calc = (res: string) => {
        if (res === 'WIN') return { p: subStake * (odds - 1), u: (odds - 1) / 2 };
        if (res === 'LOSS') return { p: -subStake, u: -0.5 };
        return { p: 0, u: 0 };
    };

    const c1 = calc(r1); const c2 = calc(r2);
    const profit = c1.p + c2.p;
    const units = c1.u + c2.u;

    let label = "";
    if (r1 === 'WIN' && r2 === 'WIN') label = "WIN";
    else if (r1 === 'LOSS' && r2 === 'LOSS') label = "LOSS";
    else if (r1 === 'PUSH' && r2 === 'PUSH') label = "PUSH";
    else if ((r1 === 'WIN' && r2 === 'PUSH') || (r1 === 'PUSH' && r2 === 'WIN')) label = "HALF WIN";
    else if ((r1 === 'LOSS' && r2 === 'PUSH') || (r1 === 'PUSH' && r2 === 'LOSS')) label = "HALF LOSS";
    else label = "MIXED";

    return { label, profit, units };
}


async function saveState() {
    // 1. Clean data before saving
    removeDuplicates();
    state.picks.sort((a: any, b: any) => a.date.localeCompare(b.date) || a.ts - b.ts);

    // 2. Clear picks from localStorage (Force JSON to be the master)
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(CONFIG_KEY, JSON.stringify(state.config));

    try {
        await fetch('/api/data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ picks: state.picks, config: state.config })
        });
    } catch (e) {
        console.error("Error saving to server:", e);
    }
}

function parsePicks(text: string, source: string) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const dateRegex = /^(\d{2})\.(\d{2})\.(\d{2,4})$/;
    const batch: any[] = [];
    let current: any = null;
    let pendingMatch: any = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const low = line.toLowerCase();

        if (dateRegex.test(line)) {
            if (current) {
                if (pendingMatch) current.matches.push(pendingMatch);
                batch.push(current);
            }
            const [d, m, y] = line.split('.');
            current = {
                id: Math.random().toString(36).substring(2, 11),
                date: `${y.length === 2 ? '20' + y : y}-${m}-${d}`,
                matches: [], odds: 0, result: 'PENDING', source,
                ts: Date.now(),
                metadata: {}
            };
            pendingMatch = null;
        } else if (current) {
            if (low.startsWith('bet:')) {
                if (pendingMatch) {
                    pendingMatch.bet = line.substring(4).trim();
                    current.matches.push(pendingMatch);
                    pendingMatch = null;
                }
            } else if (low === 'odds') {
                const val = parseFloat(lines[i + 1]);
                if (!isNaN(val)) { current.odds = val; i++; }
            } else if (low === 'ft') {
                current.result = (lines[i + 1] || "").toUpperCase();
                i++;
            } else if (low === 'unit') {
                current.metadata.unit = lines[i + 1];
                i++;
            } else if (low === 'rate') {
                current.metadata.rate = lines[i + 1];
                i++;
            } else if (['single', 'double', 'triple', 'system'].includes(low)) {
                // skip block type
            } else if (line.length > 3 && !line.includes('/') && !line.includes('%') && !line.includes('Bet:') && !line.includes('Odds') &&
                !/^(january|february|march|april|may|june|july|august|september|october|november|december)/i.test(line)) {
                // Probablemente el nombre del evento
                if (pendingMatch) current.matches.push(pendingMatch);
                pendingMatch = { event: line, bet: '' };
            }
        }
    }
    if (current) {
        if (pendingMatch) current.matches.push(pendingMatch);
        batch.push(current);
    }
    return batch;
}

function removeDuplicates() {
    const unique = new Map();
    state.picks.forEach((p: any) => {
        // Create a strict unique key (case insensitive and trimmed)
        const matchesKey = p.matches.map((m: any) =>
            `${m.event.trim().toLowerCase()}-${m.bet.trim().toLowerCase()}`
        ).sort().join('|');

        const key = `${p.date}-${p.source.toUpperCase()}-${matchesKey}-${parseFloat(p.odds).toFixed(2)}`;

        if (!unique.has(key)) {
            unique.set(key, p);
        } else {
            // If duplicate found, keep the one with a result if the other is PENDING
            const existing = unique.get(key);
            if (existing.result === 'PENDING' && p.result !== 'PENDING') {
                unique.set(key, p);
            }
        }
    });

    const originalCount = state.picks.length;
    state.picks = Array.from(unique.values());
    const removed = originalCount - state.picks.length;
    if (removed > 0) {
        console.log(`[DEDUP] Eliminados ${removed} duplicados.`);
    }
    return removed;
}

function getFilteredAndProcessedData() {
    const { bank: initialBank, stakePct } = state.config;
    const activeSource = state.filters.source;

    // 1. Calculate Date Boundaries first
    let rangeStart = '';
    let rangeEnd = '';
    const getLocalDateStr = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayStr = getLocalDateStr(new Date());

    if (state.filters.dateRange === 'HOY') {
        rangeStart = rangeEnd = todayStr;
    } else if (state.filters.dateRange === 'AYER') {
        const d = new Date(); d.setDate(d.getDate() - 1);
        rangeStart = rangeEnd = getLocalDateStr(d);
    } else if (state.filters.dateRange === 'SEMANA') {
        const d = new Date(); const day = d.getDay();
        const diff = d.getDate() - (day === 0 ? 6 : day - 1); // Monday start
        const mon = new Date(d.getFullYear(), d.getMonth(), diff);
        rangeStart = getLocalDateStr(mon);
        rangeEnd = todayStr;
    } else if (state.filters.dateRange === 'MES') {
        rangeStart = todayStr.substring(0, 8) + '01';
        rangeEnd = todayStr;
    } else if (state.filters.dateRange === 'MES_PASADO') {
        const d = new Date(); d.setMonth(d.getMonth() - 1);
        const start = new Date(d.getFullYear(), d.getMonth(), 1);
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
        rangeStart = getLocalDateStr(start);
        rangeEnd = getLocalDateStr(end);
    } else if (state.filters.dateRange === 'AÑO_ACTUAL') {
        rangeStart = `${new Date().getFullYear()}-01-01`;
        rangeEnd = todayStr;
    } else if (state.filters.dateRange === 'AÑO_PASADO') {
        const y = new Date().getFullYear() - 1;
        rangeStart = `${y}-01-01`;
        rangeEnd = `${y}-12-31`;
    } else if (state.filters.dateRange === 'CUSTOM') {
        rangeStart = state.filters.dateStart;
        rangeEnd = state.filters.dateEnd;
    }

    // 2. Filter the raw picks using ALL active filters
    const allSorted = [...state.picks].sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);

    const filteredPicks = allSorted.filter(p => {
        const matches = p.matches || [];
        const matchesText = matches.map((m: any) => `${m.event} ${m.bet}`).join(' ').toLowerCase();
        const matchSearch = matchesText.includes(state.filters.search.toLowerCase());
        const matchSource = state.filters.source.length === 0 || state.filters.source.includes(p.source);
        const matchMarket = state.filters.market.length === 0 || state.filters.market.some(m => getMarketLabel(matches[0]?.bet) === m);
        const matchResult = state.filters.result === 'ALL' || p.result.includes(state.filters.result);
        const matchDateStart = !rangeStart || p.date >= rangeStart;
        const matchDateEnd = !rangeEnd || p.date <= rangeEnd;

        let matchOdds = true;
        if (state.filters.oddsRange === 'LOW') matchOdds = p.odds < 1.6;
        else if (state.filters.oddsRange === 'MED') matchOdds = p.odds >= 1.6 && p.odds <= 2.5;
        else if (state.filters.oddsRange === 'HIGH') matchOdds = p.odds > 2.5;

        return matchSearch && matchSource && matchMarket && matchResult && matchDateStart && matchDateEnd && matchOdds;
    });

    // 3. Determine Initial Bank for the start of the period
    let initialBankCalculated = initialBank;
    if (state.config.useGlobalBank) {
        initialBankCalculated = state.config.bank;
    } else {
        if (activeSource && activeSource.length > 0) {
            initialBankCalculated = activeSource.reduce((acc: number, src: string) => acc + (state.config.planBanks?.[src] ?? 0), 0);
        } else {
            const planBanksValues = Object.values(state.config.planBanks || {});
            initialBankCalculated = planBanksValues.length > 0 ? planBanksValues.reduce((a, b) => (a as any) + (b as any), 0) : initialBank;
        }
    }

    // 4. Run accumulation logic ONLY on filtered picks
    let currentBank = initialBankCalculated;
    let peakBank = initialBankCalculated;
    let maxDDValueGlobal = 0;
    let maxDDDurationDays = 0;
    const now = new Date();
    const currentMonthKey = now.toISOString().substring(0, 7);

    const planBanksLive: Record<string, number> = {
        'ELITE': state.config.planBanks?.['ELITE'] ?? 2500,
        'PREMIUM': state.config.planBanks?.['PREMIUM'] ?? 2500,
        'STANDARD': state.config.planBanks?.['STANDARD'] ?? 2500,
        'PERSONAL': state.config.planBanks?.['PERSONAL'] ?? 2500
    };
    const planPeaksLive: Record<string, number> = { ...planBanksLive };

    const equityHistory: any[] = [{
        date: filteredPicks[0]?.date ? filteredPicks[0].date + ' (INICIO)' : 'INICIO',
        currentBank: initialBankCalculated,
        ddValue: 0,
        units: 0,
        planBanks: { ...planBanksLive },
        planDDs: Object.keys(planBanksLive).reduce((acc, k) => ({ ...acc, [k]: 0 }), {})
    }];

    let currentUnits = 0;
    let peakUnits = 0;
    let peakDate = filteredPicks[0]?.date || '';
    let maxDDInfo = { val: 0, units: 0, start: '', trough: '', end: '', peakVal: initialBankCalculated, peakUnits: 0 };

    let fWins = 0, fLosses = 0, fGrossWins = 0, fGrossLosses = 0, fTotalStaked = 0, fTotalProfit = 0;
    let uProfitTotal = 0, uStakedTotal = 0;
    let curWinStreak = 0, maxWinStreak = 0, curLossStreak = 0, maxLossStreak = 0;
    let statusCounts = { VOID: 0, CANCELED: 0, PENDING: 0, WIN: 0, LOSS: 0, HALF_WIN: 0, HALF_LOSS: 0 };
    let weightedOddsSum = 0;

    const weeksMap: Record<string, number> = {};
    const monthsMap: Record<string, number> = {};
    const daysMap: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 }; // 0 = Sunday
    const monthPlanProfit: Record<string, Record<string, number>> = {};
    const planROI: Record<string, { s: number, p: number }> = {};
    const marketROI: Record<string, { s: number, p: number, w: number, t: number }> = {};
    const monthlyDD: Record<string, number> = {};

    const oddsBuckets = [
        { l: '1.0-1.4', min: 1, max: 1.4, p: 0, s: 0, w: 0, t: 0 }, { l: '1.4-1.6', min: 1.4, max: 1.6, p: 0, s: 0, w: 0, t: 0 },
        { l: '1.6-1.8', min: 1.6, max: 1.8, p: 0, s: 0, w: 0, t: 0 }, { l: '1.8-2.0', min: 1.8, max: 2, p: 0, s: 0, w: 0, t: 0 },
        { l: '2.0-2.5', min: 2, max: 2.5, p: 0, s: 0, w: 0, t: 0 }, { l: '2.5-3.0', min: 2.5, max: 3, p: 0, s: 0, w: 0, t: 0 },
        { l: '3.0-4.0', min: 3, max: 4, p: 0, s: 0, w: 0, t: 0 }, { l: '4.0-99', min: 4, max: 99, p: 0, s: 0, w: 0, t: 0 }
    ];

    const allProcessed = filteredPicks.map(p => {
        let profitValue = 0;
        let unitProfit = 0;
        const res = p.result.toUpperCase();

        const pInitialBank = state.config.useGlobalBank
            ? state.config.bank
            : (state.config.planBanks?.[p.source] ?? (initialBank / 4));
        const pStakePct = state.config.planConfigs?.[p.source] ?? state.config.stakePct ?? 1;
        const pFixedStake = pInitialBank * (pStakePct / 100);

        const tGoals = extractTotalGoals(res);
        const asian = (tGoals !== null) ? settleAsianTotal(p.matches[0]?.bet || '', p.odds, pFixedStake, tGoals) : null;

        if (asian) {
            profitValue = asian.profit;
            unitProfit = asian.units;
            (p as any).auditLabel = asian.label;
        } else {
            if (res.includes('WIN')) { profitValue = pFixedStake * (p.odds - 1); unitProfit = (p.odds - 1); }
            else if (res.includes('LOSS')) { profitValue = -pFixedStake; unitProfit = -1; }
            else if (res.includes('HALF WIN')) { profitValue = (pFixedStake / 2) * (p.odds - 1); unitProfit = (p.odds - 1) / 2; }
            else if (res.includes('HALF LOSS')) { profitValue = -(pFixedStake / 2); unitProfit = -0.5; }
        }

        currentBank += profitValue;
        currentUnits += unitProfit;
        fTotalStaked += pFixedStake; fTotalProfit += profitValue; uProfitTotal += unitProfit;
        uStakedTotal += 1;
        weightedOddsSum += (p.odds * pFixedStake);

        if (res.includes('WIN')) {
            fWins++; fGrossWins += profitValue; statusCounts.WIN++;
            curWinStreak++; maxWinStreak = Math.max(maxWinStreak, curWinStreak); curLossStreak = 0;
        } else if (res.includes('LOSS')) {
            fLosses++; fGrossLosses += Math.abs(profitValue); statusCounts.LOSS++;
            curLossStreak++; maxLossStreak = Math.max(maxLossStreak, curLossStreak); curWinStreak = 0;
        } else if (res.includes('VOID')) statusCounts.VOID++;
        else if (res.includes('CANCEL')) statusCounts.CANCELED++;
        else if (res.includes('PENDING')) statusCounts.PENDING++;

        // Drawdown Logic
        if (currentBank >= peakBank) {
            peakBank = currentBank;
            peakUnits = currentUnits;
            peakDate = p.date;
        } else {
            const ddValue = peakBank - currentBank;
            const ddUnits = peakUnits - currentUnits;
            if (ddValue > maxDDValueGlobal) {
                maxDDValueGlobal = ddValue;
                maxDDInfo = { val: ddValue, units: ddUnits, start: peakDate, trough: p.date, end: '', peakVal: peakBank, peakUnits: peakUnits };
            }
            const mKey = p.date.substring(0, 7);
            monthlyDD[mKey] = Math.max(monthlyDD[mKey] || 0, ddValue);
            const d1 = new Date(peakDate); const d2 = new Date(p.date);
            const duration = Math.ceil((d2.getTime() - d1.getTime()) / 86400000);
            if (duration > maxDDDurationDays) maxDDDurationDays = duration;
        }

        // Analytics Maps
        const d = new Date(p.date);
        const wKey = `S${Math.ceil(d.getDate() / 7)} ${p.date.substring(5, 7)}`;
        weeksMap[wKey] = (weeksMap[wKey] || 0) + profitValue;
        const mKey = p.date.substring(0, 7);
        monthsMap[mKey] = (monthsMap[mKey] || 0) + profitValue;
        const dayOfWeek = new Date(p.date + 'T12:00:00').getDay();
        daysMap[dayOfWeek] = (daysMap[dayOfWeek] || 0) + profitValue;
        if (!monthPlanProfit[mKey]) monthPlanProfit[mKey] = {};
        monthPlanProfit[mKey][p.source] = (monthPlanProfit[mKey][p.source] || 0) + profitValue;

        planROI[p.source] = planROI[p.source] || { s: 0, p: 0 }; planROI[p.source].s += pFixedStake; planROI[p.source].p += profitValue;
        const firstMatchBet = p.matches?.[0]?.bet || '';
        const marketLabel = getMarketLabel(firstMatchBet);
        if (!marketROI[marketLabel]) marketROI[marketLabel] = { s: 0, p: 0, w: 0, t: 0 };
        marketROI[marketLabel].s += pFixedStake;
        marketROI[marketLabel].p += profitValue;
        marketROI[marketLabel].t++;
        if (res.includes('WIN')) marketROI[marketLabel].w++;

        const b = oddsBuckets.find(bk => p.odds >= bk.min && p.odds < bk.max);
        if (b) { b.p += profitValue; b.s += pFixedStake; b.t++; if (res.includes('WIN')) b.w++; }

        planBanksLive[p.source] = (planBanksLive[p.source] || 0) + profitValue;
        if (planBanksLive[p.source] > planPeaksLive[p.source]) planPeaksLive[p.source] = planBanksLive[p.source];

        const currentPlanDDs: Record<string, number> = {};
        Object.keys(planBanksLive).forEach(pn => { currentPlanDDs[pn] = planPeaksLive[pn] - planBanksLive[pn]; });

        equityHistory.push({
            date: p.date,
            currentBank,
            ddValue: peakBank - currentBank,
            units: currentUnits,
            planBanks: { ...planBanksLive },
            planDDs: currentPlanDDs
        });

        return { ...p, stakeAmount: pFixedStake, profit: profitValue, unitProfit, currentBank, currentUnits, market: marketLabel };
    });

    // Populate end date for maxDDInfo
    for (const ep of allProcessed) {
        if (ep.date > maxDDInfo.trough && ep.currentBank >= maxDDInfo.peakVal && !maxDDInfo.end) {
            maxDDInfo.end = ep.date;
        }
    }

    const currentDDInfo = {
        val: peakBank - currentBank,
        units: peakUnits - currentUnits,
        start: peakDate,
        trough: allProcessed.reduce((prev, curr) => (curr.date >= peakDate && curr.currentBank < prev.bank ? { date: curr.date, bank: curr.currentBank } : prev), { date: peakDate, bank: peakBank }).date,
        peakVal: peakBank, peakUnits: peakUnits
    };

    const dates: any = allProcessed.map(f => f.date).sort();
    let totalDays = 1;
    const startBoundary = rangeStart || (dates.length > 0 ? dates[0] : todayStr);
    const endBoundary = rangeEnd || (dates.length > 0 ? dates[dates.length - 1] : todayStr);
    if (startBoundary && endBoundary) {
        const dStart = new Date(startBoundary).getTime();
        const dEnd = new Date(endBoundary).getTime();
        totalDays = Math.max(1, Math.round((dEnd - dStart) / 86400000) + 1);
    }

    const bankTotalCalculated = initialBankCalculated + fTotalProfit;
    const roiBankCalculated = initialBankCalculated > 0 ? (fTotalProfit / initialBankCalculated) * 100 : 0;
    const avgWeightedOdds = fTotalStaked > 0 ? weightedOddsSum / fTotalStaked : 0;

    const profits = allProcessed.map(p => p.profit);
    const avgProfit = profits.length > 0 ? fTotalProfit / profits.length : 0;
    const variance = profits.length > 0 ? profits.reduce((sum, p) => sum + Math.pow(p - avgProfit, 2), 0) / profits.length : 0;
    const stdDev = Math.sqrt(variance);
    const sharpe = stdDev > 0 ? avgProfit / stdDev : 0;

    const winRateVal = (statusCounts.WIN + statusCounts.LOSS) > 0 ? (statusCounts.WIN / (statusCounts.WIN + statusCounts.LOSS)) : 0;
    const lossRateVal = 1 - winRateVal;
    const kelly = avgWeightedOdds > 1 ? (winRateVal * (avgWeightedOdds - 1) - lossRateVal) / (avgWeightedOdds - 1) : 0;
    const years = totalDays / 365 || 0.0001;
    const cagr = initialBankCalculated > 0 ? (Math.pow(bankTotalCalculated / initialBankCalculated, 1 / years) - 1) * 100 : 0;

    const plans = ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL'];
    const planStats = plans.map(pName => {
        const pInitialBank = state.config.planBanks?.[pName] ?? 2500;
        const pStakePct = state.config.planConfigs?.[pName] ?? 1;
        const planPicks = allProcessed.filter(p => p.source === pName);
        return {
            name: pName, bank: pInitialBank, stakePct: pStakePct, stakeVal: pInitialBank * (pStakePct / 100),
            periodProfit: planPicks.reduce((sum, p) => sum + p.profit, 0),
            betCount: planPicks.length,
            dateRange: planPicks.length > 0 ? `${planPicks[0].date.split('-').reverse().join('/')} al ${planPicks[planPicks.length - 1].date.split('-').reverse().join('/')}` : '---'
        };
    });

    return {
        allProcessed, filtered: allProcessed,
        uniqueMarkets: Array.from(new Set(state.picks.map((p: any) => {
            return getMarketLabel(p.matches?.[0]?.bet);
        }))).filter((m: any) => m !== 'OTRO').sort(),
        equityHistory,
        totalFiltered: allProcessed.length,
        range: `${(dates as any)[0] || '---'} → ${(dates as any)[(dates as any).length - 1] || '---'}`,
        chartData: { weeks: weeksMap, months: monthsMap, days: daysMap, monthPlanProfit, plans: planROI, markets: marketROI, odds: oddsBuckets },
        planStats,
        avgStakeSum: planStats.reduce((a, b) => a + b.stakeVal, 0),
        metrics: {
            count: allProcessed.length, statusCounts, totalStaked: fTotalStaked,
            avgStake: allProcessed.length > 0 ? fTotalStaked / allProcessed.length : 0,
            stakeConfigPct: state.config.stakePct, profit: fTotalProfit, grossWins: fGrossWins, grossLosses: fGrossLosses,
            roiStake: fTotalStaked > 0 ? (fTotalProfit / fTotalStaked) * 100 : 0,
            roiBank: roiBankCalculated, cagr, yield: fTotalStaked > 0 ? (fTotalProfit / fTotalStaked) * 100 : 0,
            winrate: winRateVal * 100, profitFactor: fGrossLosses > 0 ? fGrossWins / fGrossLosses : (fGrossWins > 0 ? 99.9 : 0),
            avgOdds: allProcessed.length > 0 ? allProcessed.reduce((a, b) => a + b.odds, 0) / allProcessed.length : 0,
            avgWeightedOdds, profitPerPick: allProcessed.length > 0 ? fTotalProfit / allProcessed.length : 0,
            breakeven: avgWeightedOdds > 0 ? (1 / avgWeightedOdds) * 100 : 0,
            maxWinStreak, maxLossStreak, currentDD: peakBank - currentBank, volatility: stdDev, sharpe, kelly: kelly * 100,
            bankTotal: bankTotalCalculated, profitDay: fTotalProfit / totalDays, profitMonthAvg: fTotalProfit / (totalDays / 30.4375),
            profitMonthActual: monthsMap[currentMonthKey] || 0, avgStakedDaily: fTotalStaked / totalDays,
            avgStakedWeekly: fTotalStaked / (totalDays / 7), avgStakedMonthly: fTotalStaked / (totalDays / 30.4375),
            uStakedTotal, uProfitTotal, uProfitPeriod: uProfitTotal, bankInitial: initialBankCalculated,
            maxDD: maxDDValueGlobal, maxDDDurationDays, monthlyDD, isRecovering: currentBank < peakBank,
            ddRelativeBank: initialBankCalculated > 0 ? (maxDDValueGlobal / initialBankCalculated) * 100 : 0,
            maxDDInfo, currentDDInfo
        },
        paginated: [...allProcessed].reverse().slice(0, state.pagination.currentPage * state.pagination.rowsPerPage),
        totalPages: Math.ceil(allProcessed.length / state.pagination.rowsPerPage) || 1
    };
}

function renderApp() {
    const app = document.getElementById('app');
    if (!app || sessionStorage.getItem(AUTH_KEY) !== 'true') { renderLogin(app!); return; }

    app.innerHTML = `
    <div class="dashboard-wrapper">
        <header class="top-bar-header">
            <div class="brand">WISEBET<span>LAB</span></div>
            <div class="header-actions">
                <div class="has-tooltip" style="position: relative;">
                    <div class="tooltip-container" style="top: calc(100% + 15px); bottom: auto; transform: translateX(-50%) translateY(-10px);">Auditoría, importación y gestión técnica de datos</div>
                    <button class="btn-premium btn-accent" id="btn-toggle-hub">
                        <span>TERMINAL DE DATOS</span>
                    </button>
                </div>
            </div>
        </header>

        <div id="control-hub-overlay" class="hub-overlay"></div>
        <aside id="control-hub">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px;">
                <h2 style="font-size:16px; font-weight:900; color:var(--accent-turq); letter-spacing:2px;">TERMINAL TÉCNICA</h2>
                <div id="btn-close-hub" style="cursor:pointer; opacity:0.6; font-size:20px;">✕</div>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(0,0,0,0.2)">
                <div class="sc-title">IMPORTACIÓN DE PICKS</div>
                <textarea id="inp-text" placeholder="Pega los bloques de picks aquí..." style="min-height:200px; margin-bottom:20px;"></textarea>
                <div class="field-premium">
                    <label>ASIGNAR A PROGRAMA</label>
                    <select id="inp-source-batch">
                        <option>ELITE</option>
                        <option>PREMIUM</option>
                        <option>STANDARD</option>
                        <option>PERSONAL</option>
                    </select>
                </div>
                <button class="btn-premium btn-accent" id="btn-import" style="width:100%">PROCESAR E IMPORTAR</button>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(255,255,255,0.01)">
                <div class="sc-title">ESTADO DE AUDITORÍA</div>
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span style="opacity: 0.5;">Base de Datos:</span>
                        <span style="font-family:'JetBrains Mono'; font-weight: 800; color: var(--accent-green);" id="hub-total-picks">0 picks</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 12px;">
                        <span style="opacity: 0.5;">Pendientes:</span>
                        <span style="font-family:'JetBrains Mono'; font-weight: 800; color: var(--warn);" id="hub-pending-picks">0 picks</span>
                    </div>
                </div>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(0,0,0,0.2)">
                <div class="sc-title">CARGAR BACKUP</div>
                <input type="file" id="inp-file-import" style="display:none;" accept=".json,.csv">
                <button class="btn-premium" id="btn-trigger-file" style="width:100%; border-color:var(--accent-green)">📂 SELECCIONAR ARCHIVO</button>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(0,0,0,0.2)">
                <div class="sc-title">EXPORTACIÓN</div>
                <div style="display:grid; grid-template-columns: 1fr; gap:12px;">
                    <button class="btn-premium" id="btn-export-json" style="width:100%">💾 BACKUP (JSON)</button>
                    <button class="btn-premium" id="btn-export-csv" style="width:100%">📊 AUDITORÍA (CSV)</button>
                </div>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(0,242,255,0.02); border-color:rgba(0,242,255,0.1)">
                <div class="sc-title" style="color:var(--accent-turq)">HUB DE AUTOMATIZACIÓN</div>
                <div class="field-premium">
                    <label>PLAN A SINCRONIZAR</label>
                    <select id="sync-plan">
                        <option value="ALL">TODOS LOS PLANES</option>
                        <option>ELITE</option>
                        <option>PREMIUM</option>
                        <option>STANDARD</option>
                    </select>
                </div>
                <div class="field-premium">
                    <label>PROFUNDIDAD</label>
                    <select id="sync-duration">
                        <option value="ALL">TODO EL HISTORIAL</option>
                        <option value="MONTH">MES ACTUAL</option>
                        <option value="WEEK">SEMANA ACTUAL</option>
                        <option value="YESTERDAY">SOLO AYER</option>
                    </select>
                </div>
                <button class="btn-premium btn-accent" id="btn-run-sync" style="width:100%; margin-bottom:12px;">🚀 INICIAR SINCRONIZACIÓN</button>
                <button class="btn-premium" id="btn-refresh-after-sync" style="width:100%; margin-bottom:15px; border-color:var(--accent-green);">✨ ACTUALIZAR DASHBOARD</button>
                
                <label style="font-size:9px; font-weight:900; color:var(--text-dim); margin-bottom:8px; display:block; letter-spacing:1px;">LOGS DEL SISTEMA</label>
                <div id="sync-logs-viewer" style="height:150px; background:rgba(0,0,0,0.5); border-radius:8px; padding:12px; font-family:'JetBrains Mono'; font-size:10px; color:var(--accent-green); overflow-y:auto; border:1px solid rgba(255,255,255,0.05);">
                    Esperando inicio...
                </div>
            </div>

            <div class="glass-card field-premium" style="padding:24px; background:rgba(255,59,59,0.02); border-color:rgba(255,59,59,0.1)">
                <div class="sc-title" style="color:var(--danger)">MANTENIMIENTO</div>
                <div style="display:grid; grid-template-columns: 1fr; gap:12px;">
                    <button class="btn-premium" id="btn-dedup" style="width:100%">🔎 BUSCAR DUPLICADOS</button>
                    <button class="btn-premium btn-danger" id="btn-reset" style="width:100%">⚠️ FORMATEAR DB</button>
                </div>
            </div>
        </aside>

        <main class="content">
            <div class="filters-container fade-in">
                <div class="global-filters glass-card">
                    <div class="f-item" style="min-width:320px;">
                        <label>Rango de Fecha</label>
                        <div id="f-daterange-chips" class="filter-box-multi"></div>
                    </div>
                    <div class="f-item custom-date-grp" style="display:${state.filters.dateRange === 'CUSTOM' ? 'block' : 'none'}">
                        <label>Desde</label><input type="date" id="f-start" value="${state.filters.dateStart}" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                    </div>
                    <div class="f-item custom-date-grp" style="display:${state.filters.dateRange === 'CUSTOM' ? 'block' : 'none'}">
                        <label>Hasta</label><input type="date" id="f-end" value="${state.filters.dateEnd}" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                    </div>
                    <div class="f-item" style="max-width:300px;">
                        <label>Plan Estratégico (Multi)</label>
                        <div id="f-source-global" class="filter-box-multi"></div>
                    </div>
                    <div class="f-item" style="max-width:300px;">
                        <label>Mercado / Tipo (Multi)</label>
                        <div id="f-market-global" class="filter-box-multi"></div>
                    </div>
                    <div class="f-item">
                        <label>Resultado</label>
                        <select id="f-result" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                            <option value="ALL" ${state.filters.result === 'ALL' ? 'selected' : ''}>TODOS</option>
                            <option value="WIN" ${state.filters.result === 'WIN' ? 'selected' : ''}>WIN</option>
                            <option value="LOSS" ${state.filters.result === 'LOSS' ? 'selected' : ''}>LOSS</option>
                            <option value="VOID" ${state.filters.result === 'VOID' ? 'selected' : ''}>VOID</option>
                            <option value="HALF WIN" ${state.filters.result === 'HALF WIN' ? 'selected' : ''}>HALF WIN</option>
                            <option value="HALF LOSS" ${state.filters.result === 'HALF LOSS' ? 'selected' : ''}>HALF LOSS</option>
                        </select>
                    </div>
                    <div class="f-item">
                        <label>Filtrar Evento</label>
                        <input type="text" id="f-search" value="${state.filters.search}" placeholder="Equipo o apuesta..." style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                    </div>
                </div>
                
                <div id="active-filters-bar" style="margin-top: 16px; display: flex; flex-wrap: wrap; gap: 8px;"></div>
            </div>

            <!-- CUADRO DE CONFIGURACIÓN ACTIVA -->
            <div id="config-info-box" style="margin-bottom:32px"></div>

            <div class="kpi-sections-container" id="kpi-root"></div>
            
            <div class="charts-masonry">
                <div class="chart-card wide">
                    <div class="ch-h">EVOLUCIÓN PATRIMONIAL ($) <span class="zoom-hint">Inicia en banca seleccionada</span></div>
                    <div class="canvas-h"><canvas id="ch-equity"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="ch-h">YIELD (%) POR RANGO DE CUOTAS</div>
                    <div class="canvas-h"><canvas id="ch-range-yield"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="ch-h">RATIO DE ACIERTO (%) POR CUOTAS</div>
                    <div class="canvas-h"><canvas id="ch-range-hr"></canvas></div>
                </div>
                <div class="chart-card" style="background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.6) 100%); border-color: rgba(178, 207, 62, 0.1);">
                    <div class="ch-h">MATRIZ DE RENDIMIENTO POR PLAN</div>
                    <div class="canvas-h"><canvas id="ch-performance"></canvas></div>
                </div>
                <div class="chart-card" style="background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.4) 100%);">
                    <div class="ch-h">COMPARATIVA DE MÉTRICAS POR PLAN</div>
                    <div class="canvas-h"><canvas id="ch-plan-comparison"></canvas></div>
                </div>
                <div class="chart-card" style="background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%);">
                    <div class="ch-h">PROFIT POR MES Y PLAN ($)</div>
                    <div class="canvas-h"><canvas id="ch-month-plan-profit"></canvas></div>
                </div>
                <div class="chart-card">
                    <div class="ch-h">ESTACIONALIDAD: PROFIT POR DÍA ($)</div>
                    <div class="canvas-h"><canvas id="ch-day-profit"></canvas></div>
                </div>
                <div class="chart-card wide" style="background: linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0.5) 100%);">
                    <div class="ch-h" style="display:flex; justify-content:space-between; align-items:center;">
                        <div>DRAWDOWN ANALYTICS <span style="color:var(--accent-turq); opacity:0.5; margin-left:10px;">($)</span></div>
                        <div id="dd-selection-status" style="font-size:11px; color:#fff; font-weight:800; font-family:'JetBrains Mono';">
                            ${state.filters.dateRange === 'CUSTOM' ? `<span style="color:var(--accent-turq)">📅 ${state.filters.dateStart.split('-').reverse().join('/')} - ${state.filters.dateEnd.split('-').reverse().join('/')}</span>` : '<span style="opacity:0.6">✨ ARRASTRA PARA SELECCIONAR RANGO</span>'}
                            ${state.filters.source.length > 0 ? `<span style="color:var(--accent-green); margin-left:12px; background:rgba(178,207,62,0.1); padding:2px 8px; border-radius:4px; font-size:9px;">PLAN: ${state.filters.source.join(', ')}</span>` : ''}
                        </div>
                    </div>
                    <div class="canvas-h" style="position:relative; margin-top:10px;">
                        <canvas id="ch-drawdown"></canvas>
                        <div id="dd-selection-box" style="position:absolute; top:-10px; bottom:-10px; background:rgba(0,242,255,0.08); border-left:2px solid var(--accent-turq); border-right:2px solid var(--accent-turq); box-shadow: 0 0 30px rgba(0,242,255,0.15); pointer-events:none; display:none; z-index:10;"></div>
                    </div>
                </div>
            </div>

            <div class="table-section fade-in" style="margin-bottom: 40px; border-color: rgba(0, 242, 255, 0.1);">
                <div style="padding: 24px 40px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="font-size:16px; font-weight:900; color:var(--accent-turq); letter-spacing:2px; text-transform:uppercase;">MATRIZ DE RENDIMIENTO POR MERCADO</h2>
                    <div style="font-size:10px; opacity:0.5; font-weight:700;">DATOS BASADOS EN FILTROS ACTUALES</div>
                </div>
                <div id="market-matrix-root"></div>
            </div>

            <div class="table-section fade-in">
                <div style="padding: 30px 40px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border);">
                    <h2 style="font-size:18px; font-weight:900; color:#fff; letter-spacing:2px; text-transform:uppercase;">HISTORIAL DE APUESTAS</h2>
                    <button class="btn-premium btn-danger" onclick="resetHistFilters()" style="padding: 8px 16px; font-size:9px;">REINICIAR FILTROS</button>
                </div>
                <div class="table-header-controls">
                    <div class="global-filters" style="background:transparent; padding:0; display:flex; flex-wrap:wrap; gap:30px; align-items:flex-end;">
                        <div class="f-item" style="min-width:320px;">
                            <label>Rango de Fecha</label>
                            <div id="t-daterange-chips" class="filter-box-multi"></div>
                        </div>
                        <div class="f-item custom-date-grp" style="display:${state.filters.dateRange === 'CUSTOM' ? 'block' : 'none'}">
                            <label>Desde</label><input type="date" id="t-start" value="${state.filters.dateStart}" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                        </div>
                        <div class="f-item custom-date-grp" style="display:${state.filters.dateRange === 'CUSTOM' ? 'block' : 'none'}">
                            <label>Hasta</label><input type="date" id="t-end" value="${state.filters.dateEnd}" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                        </div>
                        <div class="f-item" style="max-width:300px;">
                            <label>Plan Estratégico (Multi)</label>
                            <div id="t-source-global" class="filter-box-multi"></div>
                        </div>
                        <div class="f-item" style="max-width:300px;">
                            <label>Mercado / Tipo (Multi)</label>
                            <div id="t-market-global" class="filter-box-multi"></div>
                        </div>
                        <div class="f-item">
                            <label>Resultado</label>
                            <select id="t-result" style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                                <option value="ALL" ${state.filters.result === 'ALL' ? 'selected' : ''}>TODOS</option>
                                <option value="WIN" ${state.filters.result === 'WIN' ? 'selected' : ''}>WIN</option>
                                <option value="LOSS" ${state.filters.result === 'LOSS' ? 'selected' : ''}>LOSS</option>
                                <option value="VOID" ${state.filters.result === 'VOID' ? 'selected' : ''}>VOID</option>
                                <option value="HALF WIN" ${state.filters.result === 'HALF WIN' ? 'selected' : ''}>HALF WIN</option>
                                <option value="HALF LOSS" ${state.filters.result === 'HALF LOSS' ? 'selected' : ''}>HALF LOSS</option>
                            </select>
                        </div>
                        <div class="f-item">
                            <label>Filtrar Evento</label>
                            <input type="text" id="t-search" value="${state.filters.search}" placeholder="Equipo o apuesta..." style="height:44px; background:rgba(0,0,0,0.3); border:1px solid var(--border); color:#fff; border-radius:12px; padding:0 15px; font-weight:800; font-size:11px;">
                        </div>
                    </div>
                    <div style="margin-top:20px; display:flex; justify-content:space-between; align-items:center;">
                        <div class="pg-info" id="pagination-top" style="font-size:11px; font-weight:900; color:var(--accent-green); letter-spacing:1px;"></div>
                        <div style="font-size:10px; color:var(--text-dim); font-weight:600;">FILTRADO REAL-TIME PRO</div>
                    </div>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>FECHA</th>
                                <th>PLAN</th>
                                <th>MERCADO</th>
                                <th>EVENTO / APUESTA</th>
                                <th>CUOTA</th>
                                <th>STAKE</th>
                                <th>RES.</th>
                                <th style="text-align:right">PROFIT ($)</th>
                            </tr>
                        </thead>
                        <tbody id="hist-body"></tbody>
                    </table>
                </div>
                <div id="load-more-root" class="load-more-container"></div>
            </div>
        </main>
    </div>`;

    attachEvents();
    updateUI();
}

function renderLogin(container: HTMLElement) {
    container.innerHTML = `
    <div class="login-screen" style="display:flex; align-items:center; justify-content:center; min-height:100vh; background:var(--bg);">
        <div class="glass-card shimmer" style="width:100%; max-width:420px; padding:60px; text-align:center;">
            <div class="brand" style="justify-content:center; margin-bottom:10px;">WISEBET<span>LAB</span></div>
            <p style="font-size:12px; font-weight:700; color:var(--accent-green); letter-spacing:4px; margin-bottom:50px; opacity:0.8;">ULTRA TERMINAL V2.0</p>
            <div class="field-premium">
                <label>CÓDIGO DE ACCESO</label>
                <input type="password" id="log-p" placeholder="••••••••" style="text-align:center; font-size:24px; letter-spacing:8px;">
            </div>
            <button class="btn-premium btn-accent" id="btn-login-go" style="width:100%; justify-content:center; padding:18px;">AUTENTICAR SISTEMA</button>
        </div>
    </div>`;
    document.getElementById('btn-login-go')?.addEventListener('click', () => {
        const val = (document.getElementById('log-p') as any).value;
        if (val === DEFAULT_AUTH) {
            sessionStorage.setItem(AUTH_KEY, 'true');
            renderApp();
        } else { alert("Código Inválido"); }
    });
}

function attachEvents() {
    const toggleHub = () => {
        document.getElementById('control-hub')?.classList.toggle('open');
        document.getElementById('control-hub-overlay')?.classList.toggle('open');
    };
    document.getElementById('btn-toggle-hub')?.addEventListener('click', toggleHub);
    document.getElementById('btn-close-hub')?.addEventListener('click', toggleHub);
    document.getElementById('control-hub-overlay')?.addEventListener('click', toggleHub);

    const syncFilters = (id: string, key: keyof typeof state.filters) => {
        document.getElementById(id)?.addEventListener('change', (e: any) => {
            const el = e.target as any;
            if (el.multiple) {
                const values = Array.from(el.selectedOptions).map((opt: any) => opt.value);
                if (values.includes('ALL')) {
                    (state.filters as any)[key] = [];
                    Array.from(el.options).forEach((opt: any) => { if (opt.value !== 'ALL') opt.selected = false; });
                } else {
                    (state.filters as any)[key] = values;
                }
            } else {
                (state.filters as any)[key] = el.value;
            }
            if (id === 'f-daterange') {
                const grp = document.querySelectorAll('.custom-date-grp');
                grp.forEach(el => (el as HTMLElement).style.display = e.target.value === 'CUSTOM' ? 'block' : 'none');
            }
            updateUI();
        });
    };

    document.getElementById('t-dd-filter')?.addEventListener('change', (e: any) => {
        state.filters.filterDrawdown = e.target.value;
        updateUI();
    });

    document.getElementById('t-odds-filter')?.addEventListener('change', (e: any) => {
        state.filters.oddsRange = e.target.value;
        updateUI();
    });

    syncFilters('f-start', 'dateStart');
    syncFilters('f-end', 'dateEnd');
    syncFilters('t-start', 'dateStart');
    syncFilters('t-end', 'dateEnd');
    syncFilters('f-result', 'result');
    syncFilters('t-result', 'result');
    document.getElementById('f-search')?.addEventListener('input', (e: any) => { state.filters.search = e.target.value; updateUI(); });
    document.getElementById('t-search')?.addEventListener('input', (e: any) => { state.filters.search = e.target.value; updateUI(); });

    document.getElementById('btn-import')?.addEventListener('click', async () => {
        const txt = (document.getElementById('inp-text') as any).value;
        const src = (document.getElementById('inp-source-batch') as any).value;
        if (!txt) return;
        const newPicks = parsePicks(txt, src);
        state.picks = [...state.picks, ...newPicks];
        await saveState(); // Guardar en el servidor
        (document.getElementById('inp-text') as any).value = "";
        updateUI();
        toggleHub();
        alert(`¡Éxito! Se han importado ${newPicks.length} picks correctamente.`);
    });

    (window as any).clearFilter = (key: keyof typeof state.filters) => {
        if (key === 'dateRange') state.filters.dateRange = 'ALL';
        else if (key === 'source') state.filters.source = [];
        else if (key === 'market') state.filters.market = [];
        else if (key === 'search') state.filters.search = '';
        else if (key === 'oddsRange') state.filters.oddsRange = 'ALL';
        else if (key === 'result') state.filters.result = 'ALL';
        updateUI();
    };

    (window as any).resetAllFilters = () => {
        state.filters = {
            dateRange: 'ALL',
            dateStart: '',
            dateEnd: '',
            source: [],
            market: [],
            result: 'ALL',
            search: '',
            filterDrawdown: 'OFF',
            oddsRange: 'ALL'
        };
        updateUI();
    };

    document.getElementById('btn-reset')?.addEventListener('click', async () => {
        if (confirm("¿ESTÁS COMPLETAMENTE SEGURO? Esta acción borrará todas las picks guardadas permanentemente en el servidor y localmente.")) {
            state.picks = [];
            localStorage.removeItem(STORAGE_KEY);
            await saveState(); // Sincronizar con el servidor
            updateUI();
            toggleHub();
            alert("Base de datos reseteada con éxito.");
        }
    });

    (window as any).loadMorePicks = () => {
        state.pagination.currentPage++;
        updateUI();
    };

    document.getElementById('btn-dedup')?.addEventListener('click', () => {
        const removed = removeDuplicates();
        alert(removed > 0 ? `Se han eliminado ${removed} picks duplicadas.` : "No se encontraron duplicados.");
        if (removed > 0) toggleHub();
    });

    // LOGIC FOR AUTOMATION HUB
    const fetchLogs = async () => {
        try {
            const res = await fetch('/api/logs');
            const text = await res.text();
            const viewer = document.getElementById('sync-logs-viewer');
            if (viewer) {
                viewer.innerText = text;
                viewer.scrollTop = viewer.scrollHeight;
            }
        } catch (e) { }
    };

    let logInterval: any = null;
    document.getElementById('btn-run-sync')?.addEventListener('click', async () => {
        const plan = (document.getElementById('sync-plan') as any).value;
        const duration = (document.getElementById('sync-duration') as any).value;

        const btn = document.getElementById('btn-run-sync') as HTMLButtonElement;
        const viewer = document.getElementById('sync-logs-viewer');

        btn.disabled = true;
        btn.innerText = "⏳ SINCRONIZANDO...";
        if (viewer) viewer.innerText = "Iniciando conexión...";

        try {
            const res = await fetch('/api/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan, duration })
            });
            const data = await res.json();

            if (data.success) {
                if (logInterval) clearInterval(logInterval);
                const refreshBtn = document.getElementById('btn-refresh-after-sync') as HTMLButtonElement;
                if (refreshBtn) {
                    refreshBtn.disabled = true;
                    refreshBtn.style.opacity = "0.4";
                    refreshBtn.innerText = "⏳ SINCRONIZANDO...";
                }

                logInterval = setInterval(async () => {
                    try {
                        const lRes = await fetch('/api/logs?v=' + Date.now());
                        const text = await lRes.text();
                        if (viewer) {
                            viewer.innerText = text;
                            viewer.scrollTop = viewer.scrollHeight;
                        }

                        if (text.toUpperCase().includes("FINALIZADA") || text.toUpperCase().includes("ERROR CRITICO")) {
                            clearInterval(logInterval);
                            btn.disabled = false;
                            btn.innerText = "🚀 INICIAR SINCRONIZACIÓN";
                            if (refreshBtn) {
                                refreshBtn.disabled = false;
                                refreshBtn.style.opacity = "1";
                                refreshBtn.style.boxShadow = "0 0 30px #00f2ff";
                                refreshBtn.innerText = "✨ ¡LISTO! ACTUALIZAR DASHBOARD";
                                refreshBtn.classList.add('shimmer');
                            }
                        }
                    } catch (e) { }
                }, 1000);
            }
        } catch (e) {
            alert("Error al iniciar sincronización");
            btn.disabled = false;
            btn.innerText = "🚀 INICIAR SINCRONIZACIÓN";
        }
    });

    // Cargar logs al abrir el hub
    document.getElementById('btn-refresh-after-sync')?.addEventListener('click', async () => {
        const btn = document.getElementById('btn-refresh-after-sync') as HTMLButtonElement;
        const viewer = document.getElementById('sync-logs-viewer');
        const oldPicksCount = state.picks.length;

        btn.innerText = "⏳ ACTUALIZANDO...";
        await loadState();
        updateUI();

        const newPicksCount = state.picks.length;
        const added = newPicksCount - oldPicksCount;

        // Extraer info de actualizaciones si existe en el log
        let updateMsg = "";
        if (viewer && viewer.innerText.includes("Resultados liquidados:")) {
            const matches = viewer.innerText.match(/Resultados liquidados: (\d+)/);
            if (matches && matches[1] !== "0") updateMsg = ` y se liquidaron ${matches[1]} pendientes.`;
        }

        alert(`Sincronización completada:\n- Se agregaron ${added > 0 ? added : 0} picks nuevos${updateMsg}\n- Sistema actualizado con éxito.`);

        btn.innerText = "✨ ACTUALIZAR DASHBOARD";
        btn.style.boxShadow = "none";
        btn.classList.remove('shimmer');
    });

    document.getElementById('btn-toggle-hub')?.addEventListener('click', fetchLogs);

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state.picks, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `wisebet_backup_${new Date().toISOString().split('T')[0]}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });

    document.getElementById('btn-export-csv')?.addEventListener('click', () => {
        // Sort picks chronologically for CSV
        const sortedPicks = [...state.picks].sort((a, b) => a.date.localeCompare(b.date) || a.ts - b.ts);
        const count = sortedPicks.length;
        const range = count > 0 ? `${sortedPicks[0].date} a ${sortedPicks[count - 1].date}` : "N/A";

        // Legend / Manifest Section
        const legend = [
            ["--- REPORTE DE AUDITORÍA WISEBETLAB ---"],
            ["BANCA SIMULADA (BASE)", "$10,000.00"],
            ["STAKE SIMULADO (1.0u)", "$100.00"],
            ["TOTAL TRANSACCIONES", count.toString()],
            ["PERIODO", range],
            ["GENERADO EL", new Date().toLocaleString()],
            [""], // Empty Spacer Row
            ["FECHA", "PLAN", "MERCADO", "EVENTO / PARTIDO", "APUESTA / DETALLE", "CUOTA", "STAKE", "RESULTADO", "PROFIT ($ SIM)"]
        ];

        const rows = sortedPicks.map((p: any) => {
            const unitValue = 100;
            const res = p.result.toUpperCase();
            let simProfit = 0;

            const tGoals = extractTotalGoals(res);
            const asian = (tGoals !== null) ? settleAsianTotal(p.matches?.[0]?.bet || '', p.odds, unitValue, tGoals) : null;

            if (asian) {
                simProfit = asian.profit;
            } else {
                if (res.includes('WIN')) simProfit = unitValue * (p.odds - 1);
                else if (res.includes('LOSS')) simProfit = -unitValue;
                else if (res.includes('HALF WIN')) simProfit = (unitValue / 2) * (p.odds - 1);
                else if (res.includes('HALF LOSS')) simProfit = -(unitValue / 2);
            }

            const market = p.matches?.length > 1 ? 'MULTI' : (p.matches?.[0]?.bet?.split(' ')[0] || 'VAR');
            const eventName = p.matches?.map((m: any) => m.event).join(' | ') || 'N/A';
            const betDetail = p.matches?.map((m: any) => m.bet).join(' | ') || 'N/A';

            return [
                p.date,
                p.source,
                market,
                `"${eventName.replace(/"/g, '""')}"`,
                `"${betDetail.replace(/"/g, '""')}"`,
                p.odds.toFixed(2),
                "1.0u",
                p.result,
                simProfit.toFixed(2)
            ];
        });

        const fullContent = [...legend, ...rows];
        let csvContent = "data:text/csv;charset=utf-8," + fullContent.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `wisebet_audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    });

    // FILE IMPORT LOGIC
    const fileInput = document.getElementById('inp-file-import') as HTMLInputElement;
    document.getElementById('btn-trigger-file')?.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e: any) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event: any) => {
            const content = event.target.result;
            try {
                if (file.name.endsWith('.json')) {
                    const importedPicks = JSON.parse(content);
                    if (Array.isArray(importedPicks)) {
                        state.picks = importedPicks;
                        removeDuplicates();
                        updateUI();
                        alert(`¡Éxito! Se han cargado ${importedPicks.length} picks desde JSON.`);
                    }
                } else if (file.name.endsWith('.csv')) {
                    const lines = content.split('\n').filter((l: string) => l.trim().length > 0);
                    // Find header line (skips legend)
                    const headerIdx = lines.findIndex((l: string) => l.toUpperCase().includes('FECHA,PLAN'));
                    if (headerIdx === -1) {
                        alert("Error: El CSV no tiene un formato válido.");
                        return;
                    }

                    const header = lines[headerIdx].toUpperCase().split(',');
                    const isNewFormat = header.includes('EVENTO / PARTIDO');
                    const imported: any[] = [];

                    for (let i = headerIdx + 1; i < lines.length; i++) {
                        // Basic CSV parse to handle quotes and commas inside quotes
                        const row = lines[i];
                        const cols: string[] = [];
                        let curr = '', inQuotes = false;
                        for (let char of row) {
                            if (char === '"') inQuotes = !inQuotes;
                            else if (char === ',' && !inQuotes) { cols.push(curr.trim()); curr = ''; }
                            else curr += char;
                        }
                        cols.push(curr.trim());

                        if (cols.length >= 5) {
                            const date = cols[0];
                            const source = cols[1];
                            const odds = parseFloat(isNewFormat ? cols[5] : cols[2]) || 0;
                            const result = (isNewFormat ? cols[7] : cols[4]).toUpperCase();
                            const events = isNewFormat ? cols[3].split(' | ') : ['Importado de CSV'];
                            const bets = isNewFormat ? cols[4].split(' | ') : ['Desconocido'];

                            imported.push({
                                id: Math.random().toString(36).substring(2, 11),
                                date,
                                source,
                                odds,
                                result,
                                matches: events.map((e, idx) => ({ event: e, bet: bets[idx] || bets[0] })),
                                ts: Date.now() + i
                            });
                        }
                    }
                    state.picks = [...state.picks, ...imported];
                    removeDuplicates();
                    updateUI();
                    alert(`¡Éxito! Se han cargado ${imported.length} picks desde CSV.`);
                }
            } catch (err) {
                alert("Error al procesar el archivo. Asegúrate que el formato sea correcto.");
            }
        };
        reader.readAsText(file);
    });
}

function updateUI() {
    const data = getFilteredAndProcessedData();
    const m = data.metrics;

    // Synchronize input values across copies
    ['f-search', 't-search'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el && document.activeElement !== el) el.value = state.filters.search;
    });
    ['f-result', 't-result'].forEach(id => {
        const el = document.getElementById(id) as HTMLSelectElement;
        if (el) el.value = state.filters.result;
    });
    ['f-start', 't-start'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = state.filters.dateStart;
    });
    ['f-end', 't-end'].forEach(id => {
        const el = document.getElementById(id) as HTMLInputElement;
        if (el) el.value = state.filters.dateEnd;
    });

    // Synchronize custom date visibility
    const dateGrps = document.querySelectorAll('.custom-date-grp');
    dateGrps.forEach(el => (el as HTMLElement).style.display = state.filters.dateRange === 'CUSTOM' ? 'block' : 'none');

    // UPDATE AUDITOR TERMINAL VALUES
    const hubTotal = document.getElementById('hub-total-picks');
    const hubPending = document.getElementById('hub-pending-picks');
    if (hubTotal) hubTotal.innerText = `${state.picks.length} picks`;
    if (hubPending) hubPending.innerText = `${state.picks.filter((p: any) => p.result.toUpperCase() === 'PENDING').length} picks`;

    // RENDER ACTIVE FILTER CHIPS
    const activeFiltersBar = document.getElementById('active-filters-bar');
    if (activeFiltersBar) {
        let chips = [];
        if (state.filters.dateRange !== 'ALL') chips.push(`<div class="filter-chip" onclick="clearFilter('dateRange')">📅 ${state.filters.dateRange} <span class="close-icon">✕</span></div>`);
        if (state.filters.source.length > 0) chips.push(`<div class="filter-chip" onclick="clearFilter('source')">🏷️ ${state.filters.source.join(', ')} <span class="close-icon">✕</span></div>`);
        if (state.filters.market.length > 0) chips.push(`<div class="filter-chip" onclick="clearFilter('market')">⚽ ${state.filters.market.join(', ')} <span class="close-icon">✕</span></div>`);
        if (state.filters.search) chips.push(`<div class="filter-chip" onclick="clearFilter('search')">🔍 ${state.filters.search} <span class="close-icon">✕</span></div>`);
        if (state.filters.oddsRange !== 'ALL') chips.push(`<div class="filter-chip" onclick="clearFilter('oddsRange')">📊 ${state.filters.oddsRange} <span class="close-icon">✕</span></div>`);
        if (state.filters.result !== 'ALL') chips.push(`<div class="filter-chip" onclick="clearFilter('result')">🏆 ${state.filters.result} <span class="close-icon">✕</span></div>`);

        if (chips.length > 0) {
            chips.push(`<div style="color:var(--danger); font-size:11px; font-weight:800; cursor:pointer; padding:6px 12px; margin-left:auto;" onclick="resetAllFilters()">RESET ALL</div>`);
            activeFiltersBar.innerHTML = chips.join('');
        } else {
            activeFiltersBar.innerHTML = '';
        }
    }
    // RENDER ENHANCED SIMULATION BOX
    const infoBox = document.getElementById('config-info-box');
    if (infoBox) {
        const isGlobal = state.filters.source === 'ALL';
        const isMobile = window.innerWidth < 768;

        infoBox.innerHTML = `
            <div class="glass-card" style="padding: 0; overflow: hidden; margin-bottom: 40px; border-color: rgba(0, 242, 255, 0.15); box-shadow: 0 20px 50px rgba(0,0,0,0.4);">
                <div style="background: rgba(0, 242, 255, 0.04); padding: 24px 40px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="width: 44px; height: 44px; background: var(--accent-brand); border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 20px var(--accent-turq-glow);">
                            <span style="font-size: 20px;">🛡️</span>
                        </div>
                        <div>
                            <div style="font-weight: 900; font-size: 16px; letter-spacing: 2px; color: #fff; text-transform: uppercase;">
                                MULTIPROGRAMA <span style="color: var(--accent-turq);">GLOBAL</span>
                            </div>
                            <div style="font-size: 11px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 1px;">Gestión de Capital & Seguridades</div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 16px;">
                        ${state.config.editMode ? `
                            <div style="display:flex; align-items:center; gap:12px; background:rgba(0,0,0,0.4); padding:10px 20px; border-radius:14px; border:1px solid var(--accent-turq-glow);">
                                <label style="font-size:10px; font-weight:900; color:var(--accent-turq); letter-spacing:1px;">BANCA BASE:</label>
                                <input type="number" value="${state.config.bank}" onchange="updateGlobalBankValue(this.value)" style="background:transparent; border:none; color:#fff; width:140px; font-size:20px; font-weight:900; outline:none; font-family:'JetBrains Mono' !important;">
                            </div>
                        ` : ''}
                        <button class="btn-premium ${state.config.useGlobalBank ? 'btn-accent' : ''}" onclick="toggleGlobalBank()" style="padding: 10px 20px; font-size: 10px;">
                            <span>${state.config.useGlobalBank ? '🌐 BANCA GLOBAL ON' : '📂 BANCA POR PLAN'}</span>
                        </button>
                        <button class="btn-premium ${state.config.editMode ? 'btn-accent' : ''}" onclick="toggleConfigEdit()" style="padding: 10px 20px; font-size: 10px;">
                            ${state.config.editMode ? '<span>💾 GUARDAR CAMBIOS</span>' : '<span>⚙️ AJUSTAR VALORES</span>'}
                        </button>
                    </div>
                </div>
                <div style="padding: 30px 40px;">
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
                        ${data.planStats.map((ps: any) => `
                            <div class="glass-card sim-row-hover" style="padding: 24px; background: rgba(255,255,255,0.01); border-radius: 18px; display: flex; justify-content: space-between; align-items: center;">
                                <div style="flex: 1;">
                                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 8px;">
                                        <div style="width: 10px; height: 10px; border-radius: 50%; background: var(--accent-green); box-shadow: 0 0 15px var(--accent-green);"></div>
                                        <div style="font-size: 16px; font-weight: 900; color: #fff; letter-spacing: 0.5px;">${ps.name}</div>
                                        <div style="font-size: 9px; font-weight: 800; background: rgba(0, 242, 255, 0.1); color: var(--accent-turq); padding: 3px 8px; border-radius: 6px; letter-spacing: 1px;">${ps.betCount} PICKS</div>
                                    </div>
                                    ${state.config.editMode ? `
                                        <div style="display: flex; gap: 15px; margin-top: 15px;">
                                            <div style="display:flex; flex-direction:column; gap:6px">
                                                <label style="font-size:9px; font-weight:900; color:var(--accent-turq); letter-spacing:1px;">BANK $</label>
                                                <input type="number" value="${ps.bank}" onchange="updatePlanConfig('${ps.name}', 'bank', this.value)" style="background:rgba(0,0,0,0.5); border:1px solid var(--border); border-radius:10px; color:#fff; width:130px; font-size:16px; font-weight:900; padding:10px 14px; font-family:'JetBrains Mono' !important;">
                                            </div>
                                            <div style="display:flex; flex-direction:column; gap:6px">
                                                <label style="font-size:9px; font-weight:900; color:var(--accent-green); letter-spacing:1px;">STAKE %</label>
                                                <input type="number" step="0.1" value="${ps.stakePct}" onchange="updatePlanConfig('${ps.name}', 'stake', this.value)" style="background:rgba(0,0,0,0.5); border:1px solid var(--border); border-radius:10px; color:#fff; width:100px; font-size:16px; font-weight:900; padding:10px 14px; font-family:'JetBrains Mono' !important;">
                                            </div>
                                        </div>
                                    ` : `
                                        <div style="font-family:'JetBrains Mono'; font-size: 14px; font-weight: 700; color: var(--text-dim); transition: all 0.3s ease;">
                                            BANK: <span style="color:${state.config.useGlobalBank ? 'var(--text-muted)' : '#fff'}; filter:${state.config.useGlobalBank ? 'grayscale(1) opacity(0.5)' : 'none'}">${fUSD(ps.bank)}</span>
                                            ${state.config.useGlobalBank ? '<span style="font-size:8px; margin-left:8px; color:var(--accent-turq)">(GLOBAL OVERRIDE)</span>' : ''}
                                        </div>
                                        <div style="font-size: 10px; font-weight: 600; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.5px;">${ps.dateRange}</div>
                                    `}
                                </div>
                                <div style="text-align: right;">
                                    ${state.config.editMode ? '' : `
                                        <div style="font-family:'JetBrains Mono'; font-size: 18px; font-weight: 900; color: var(--accent-green);">${ps.stakePct}% <span style="font-size:10px; opacity:0.4;">(${fUSD(ps.stakeVal)})</span></div>
                                        <div style="font-family:'JetBrains Mono'; font-size: 16px; font-weight: 800; color: ${ps.periodProfit >= 0 ? 'var(--accent-green)' : 'var(--danger)'}; margin-top: 5px;">
                                            ${ps.periodProfit >= 0 ? '+' : ''}${fUSD(ps.periodProfit)}
                                        </div>
                                    `}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    // RENDER MULTI-FILTERS
    const renderMultiFilter = (id: string, key: 'source' | 'market', options: string[], labels: string[]) => {
        const container = document.getElementById(id);
        if (!container) return;
        const current = state.filters[key];

        let html = `<div class="multi-filter-tag ${current.length === 0 ? 'active' : ''}" onclick="toggleMultiFilter('${key}', 'ALL')">TODOS</div>`;
        options.forEach((opt, i) => {
            const isActive = current.includes(opt);
            html += `<div class="multi-filter-tag ${isActive ? 'active' : ''}" onclick="toggleMultiFilter('${key}', '${opt}')">${labels[i] || opt}</div>`;
        });
        container.innerHTML = html;
    };

    const renderDateRangeFilter = (id: string) => {
        const container = document.getElementById(id);
        if (!container) return;
        const current = state.filters.dateRange;
        const options = ['ALL', 'HOY', 'AYER', 'SEMANA', 'MES', 'MES_PASADO', 'AÑO_ACTUAL', 'AÑO_PASADO', 'CUSTOM'];
        const labels = ['TODOS', 'HOY', 'AYER', 'SEMANA', 'MES', 'MES PASADO', 'AÑO ACTUAL', 'AÑO PASADO', 'CUSTOM'];

        let html = '';
        options.forEach((opt, i) => {
            const isActive = current === opt;
            html += `<div class="multi-filter-tag ${isActive ? 'active' : ''}" onclick="toggleDateRangeFilter('${opt}')">${labels[i]}</div>`;
        });
        container.innerHTML = html;
    };

    renderDateRangeFilter('f-daterange-chips');
    renderDateRangeFilter('t-daterange-chips');
    renderMultiFilter('f-source-global', 'source', ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL'], ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL']);
    renderMultiFilter('t-source-global', 'source', ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL'], ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL']);
    renderMultiFilter('f-market-global', 'market', data.uniqueMarkets as any[], data.uniqueMarkets as any[]);
    renderMultiFilter('t-market-global', 'market', data.uniqueMarkets as any[], data.uniqueMarkets as any[]);

    const kpiRoot = document.getElementById('kpi-root');
    if (kpiRoot) {
        const categories = [
            {
                title: "MÉTRICAS PRINCIPALES", kpis: [
                    {
                        l: "Profit Neto", v: fUSD(m.profit), s: "Resultado total acumulado", c: m.profit >= 0 ? 'var(--accent-green)' : 'var(--danger)',
                        g: true,
                        detail: [
                            { l: "Ingresos (Winning)", v: fUSD(m.grossWins) },
                            { l: "Pérdidas (Losing)", v: fUSD(m.grossLosses) },
                            { l: "Profit (%)", v: fPct((m.profit / m.bankInitial) * 100) }
                        ]
                    },
                    {
                        l: "Total Apostado", v: fUSD(m.totalStaked), s: "Volumen bruto de inversión", c: 'var(--accent-turq)',
                        g: true,
                        detail: [
                            ...Object.entries(data.chartData.plans).map(([pn, pv]) => ({ l: `Apostado ${pn}`, v: fUSD(pv.s) })),
                            { l: "Avg. por Pick", v: fUSD(m.avgStake) }
                        ]
                    },
                    {
                        l: "Apostado Promedio", v: fUSD(m.avgStakedDaily), s: "Gasto operativo diario", c: '#fff',
                        detail: [
                            { l: "Promedio Diario", v: fUSD(m.avgStakedDaily) },
                            { l: "Promedio Semanal", v: fUSD(m.avgStakedWeekly) },
                            { l: "Promedio Mensual", v: fUSD(m.avgStakedMonthly) }
                        ]
                    },
                    {
                        l: "Capital Total", v: fUSD(m.bankTotal), s: "Balance de banca + beneficio", c: '#fff',
                        g: true,
                        detail: [
                            { l: "Crecimiento Banca", v: fPct(((m.bankTotal - m.bankInitial) / m.bankInitial) * 100) },
                            { l: "Banca Inicial", v: fUSD(m.bankInitial) },
                            ...Object.entries(state.config.planBanks || {}).map(([pn, pv]) => ({ l: `Banca ${pn}`, v: fUSD(pv as number) })),
                            { l: "CAGR Anual", v: fPct(m.cagr) }
                        ]
                    },
                    {
                        l: "Unidades", v: fNum(m.uProfitTotal) + ' u.', s: "Profit neto en valor unitario", c: m.uProfitTotal >= 0 ? 'var(--accent-green)' : 'var(--danger)',
                        g: true,
                        detail: [{ l: "U. Apostadas", v: fNum(m.uStakedTotal) }, { l: "U. Profit (Filtro)", v: fNum(m.uProfitPeriod) }]
                    },
                    {
                        l: "Stake Promedio", v: fPct((m.avgStake / m.bankInitial) * 100),
                        v2: fUSD(m.avgStake), s: "Riesgo medio por apuesta", c: 'var(--accent-turq)',
                        detail: [
                            { l: "Stake Promedio ($)", v: fUSD(m.avgStake) },
                            { l: "Stake Promedio (%)", v: fPct((m.avgStake / m.bankInitial) * 100) }
                        ]
                    }
                ]
            },
            {
                title: "RENTABILIDAD & ROI", kpis: [
                    {
                        l: "Esperanza (EV)", v: fUSD(m.profitPerPick), s: "Valor esperado por cada apuesta", c: m.profitPerPick >= 0 ? 'var(--accent-green)' : 'var(--danger)',
                        detail: [{ l: "EV en Unidades", v: fNum(m.uProfitTotal / (m.count || 1)) + ' u.' }]
                    },
                    {
                        l: "ROI (Stake)", v: fPct(m.roiStake), s: "Retorno sobre inversión", c: 'var(--accent-turq)',
                        detail: [{ l: "ROI s/ Banca", v: fPct(m.roiBank) }, { l: "ROI Mensual (avg)", v: fPct(m.roiStake / (Math.max(1, m.count / 30))) }]
                    },
                    {
                        l: "Yield (%)", v: fPct(m.yield), s: "Eficiencia por unidad", c: 'var(--accent-turq)',
                        detail: [{ l: "Misma que ROI", v: "Stake based" }, { l: "Profit Factor", v: fNum(m.profitFactor) }]
                    },
                    {
                        l: "CAGR (Anual)", v: fPct(m.cagr), s: "Crecimiento anualizado", c: m.cagr >= 0 ? 'var(--accent-green)' : 'var(--danger)',
                        detail: [{ l: "Years tracked", v: fNum(m.profitDay > 0 ? m.profit / (m.profitDay * 365) : 0) }]
                    }
                ]
            },
            {
                title: "CALIDAD Y RENDIMIENTO", kpis: [
                    {
                        l: "Winrate", v: fPct(m.winrate), s: "Efectividad (W/L)", c: 'var(--accent-turq)', g: true,
                        detail: [{ l: "WINS", v: m.statusCounts.WIN }, { l: "LOSSES", v: m.statusCounts.LOSS }, { l: "VOIDS", v: m.statusCounts.VOID }]
                    },
                    {
                        l: "Edge (Ventaja)", v: fPct(m.winrate - m.breakeven), s: "WR vs Breakeven", c: (m.winrate - m.breakeven) >= 0 ? 'var(--accent-green)' : 'var(--danger)',
                        detail: [{ l: "Breakeven", v: fPct(m.breakeven) }, { l: "WR Real", v: fPct(m.winrate) }]
                    },
                    {
                        l: "Cuota Media", v: fNum(m.avgOdds), s: "Dificultad media", c: '#fff',
                        detail: [{ l: "Cuota Ponderada", v: fNum(m.avgWeightedOdds) }]
                    },
                    {
                        l: "Apuestas", v: m.count, s: "Volumen filtrado", c: '#fff',
                        detail: [{ l: "Apostado", v: fUSD(m.totalStaked) }, { l: "Avg. Stake", v: fUSD(m.avgStake) }]
                    }
                ]
            },
            {
                title: "ESTADÍSTICAS AVANZADAS", kpis: [
                    { l: "Sharpe Ratio", v: fNum(m.sharpe), s: "Métrica de retorno ajustado al riesgo (volatilidad)", c: m.sharpe > 1 ? 'var(--accent-green)' : '#fff' },
                    { l: "Volatilidad", v: fUSD(m.volatility), s: "Desviación estándar de los retornos diarios" },
                    { l: "Kelly Crit.", v: fPct(m.kelly), s: "Cálculo matemático del stake óptimo para maximizar crecimiento", c: 'var(--accent-turq)' }
                ]
            },
            {
                title: "RIESGO Y DRAWDOWN", kpis: [
                    {
                        l: "Drawdown Máx", v: fUSD(m.maxDD), s: m.isRecovering ? "📉 Recuperando..." : "✅ Máximo histórico", c: m.isRecovering ? 'var(--warn)' : '#fff',
                        detail: [
                            {
                                html: `
                                <div class="dd-tech-table">
                                    <div class="dd-tech-section">
                                        <div class="dd-tech-title">Drawdown Máximo</div>
                                        <div class="dd-tech-row"><span>Dinero</span><span>${fUSD(m.maxDDInfo.val)}</span></div>
                                        <div class="dd-tech-row"><span>Unidades</span><span>${fNum(m.maxDDInfo.units)} u.</span></div>
                                        <div class="dd-tech-row"><span>Máximo Previo</span><span>${fUSD(m.maxDDInfo.peakVal)}</span></div>
                                        <div class="dd-tech-row"><span>Comienzo</span><span>${m.maxDDInfo.start}</span></div>
                                        <div class="dd-tech-row"><span>Mínimo</span><span>${m.maxDDInfo.trough}</span></div>
                                        <div class="dd-tech-row"><span>Fin</span><span>${m.maxDDInfo.end || '---'}</span></div>
                                    </div>
                                    <div class="dd-tech-section" style="margin-top:12px; border-top:1px solid rgba(255,255,255,0.05); padding-top:12px;">
                                        <div class="dd-tech-title">Drawdown Actual</div>
                                        <div class="dd-tech-row"><span>Dinero</span><span>${fUSD(m.currentDDInfo.val)}</span></div>
                                        <div class="dd-tech-row"><span>Unidades</span><span>${fNum(m.currentDDInfo.units)} u.</span></div>
                                        <div class="dd-tech-row"><span>Máximo Previo</span><span>${fUSD(m.currentDDInfo.peakVal)}</span></div>
                                        <div class="dd-tech-row"><span>Comienzo</span><span>${m.currentDDInfo.start}</span></div>
                                        <div class="dd-tech-row"><span>Mínimo</span><span>${m.currentDDInfo.trough}</span></div>
                                    </div>
                                </div>
                            ` }
                        ]
                    },
                    { l: "W. Streak", v: m.maxWinStreak, s: "Racha ganadora", c: 'var(--accent-green)' },
                    { l: "L. Streak", v: m.maxLossStreak, s: "Racha perdedora", c: 'var(--danger)' }
                ]
            },
            {
                title: "FLUJO OPERATIVO", kpis: [
                    { l: "Profit Diario", v: fUSD(m.profitDay), s: "Media diaria estimada", c: m.profitDay >= 0 ? 'var(--accent-green)' : 'var(--danger)' },
                    { l: "Profit Mensual", v: fUSD(m.profitMonthAvg), s: "Media mensual estimada", c: m.profitMonthAvg >= 0 ? 'var(--accent-green)' : 'var(--danger)' },
                    { l: "Profit por Pick", v: fUSD(m.profitPerPick), s: "Ganancia media por apuesta", c: m.profitPerPick >= 0 ? 'var(--accent-green)' : '#fff' },
                    {
                        l: "Picks Válidos", v: m.statusCounts.WIN + m.statusCounts.LOSS, s: "Finalizados",
                        detail: [
                            { l: "Pendientes", v: m.statusCounts.PENDING },
                            { l: "Cancelados", v: m.statusCounts.CANCELED },
                            { l: "Profit Mes Actual", v: fUSD(m.profitMonthActual) }
                        ]
                    }
                ]
            }
        ];

        if (data.totalFiltered === 0) {
            kpiRoot.innerHTML = `
                <div style="grid-column: 1/-1; padding: 60px; text-align: center; background: var(--panel); border: 1px dashed var(--border); border-radius: 24px; color: var(--text-dim);">
                    <div style="font-size: 40px; margin-bottom: 16px;">🔍</div>
                    <div style="font-weight: 800; font-size: 18px; color: #fff; margin-bottom: 8px;">No se encontraron resultados</div>
                    <div style="font-size: 13px; opacity: 0.6;">Ajusta los filtros o importa picks desde la "Terminal de Control" para comenzar.</div>
                </div>
            `;
            return;
        }

        kpiRoot.innerHTML = categories.map((cat, ci) => `
            <div class="kpi-group fade-in" style="animation-delay: ${ci * 0.1}s">
                <div class="group-title">${cat.title}</div>
                <div class="kpi-grid">
                    ${cat.kpis.map((k, ki) => {
            const hasDetail = k.detail && k.detail.length > 0;
            const kId = `kpi-${ci}-${ki}`;
            return `
                        <div class="kpi-card-wrapper has-tooltip">
                            <div class="tooltip-container">${k.s}</div>
                            <div class="kpi-card-inner" id="${kId}">
                                <div class="glass-card kpi-card">
                                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                                        <div class="k-label">${k.l}</div>
                                        <div style="font-size:12px; opacity:0.3; cursor:help;" title="${k.s}">ⓘ</div>
                                    </div>
                                    <div class="k-value ${k.isSmall ? 'v-small' : ''} ${k.g ? 'glow' : ''}" style="color:${k.c || 'white'}">${k.v}</div>
                                    <div class="k-sub" style="display:flex; align-items:center; gap:6px;">
                                        <span style="opacity:0.6">${k.s}</span>
                                    </div>
                                    ${hasDetail ? `<div class="btn-detail-toggle" onclick="toggleKpiDetail('${kId}')"><span>DATOS TÉCNICOS</span> <i class="icon-arr">↓</i></div>` : ''}
                                </div>
                            </div>
                            ${hasDetail ? `
                            <div class="kpi-detail-panel" id="${kId}-detail">
                                <div class="detail-header">
                                    <div class="detail-title">${k.l}</div>
                                    <div class="btn-detail-close" onclick="toggleKpiDetail('${kId}')">✕</div>
                                </div>
                                <div class="detail-grid">
                                    ${k.detail.map((d: any) => d.html ? d.html : `
                                        <div class="d-item">
                                            <div class="d-l">${d.l}</div>
                                            <div class="d-v">${d.v}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>`;
        }).join('')}
                </div>
            </div>
        `).join('');
    }

    renderCharts(data);

    const matrixRoot = document.getElementById('market-matrix-root');
    if (matrixRoot) {
        const markets = Object.entries(data.chartData.markets).sort((a, b) => (b[1] as any).p - (a[1] as any).p);
        matrixRoot.innerHTML = `
            <div class="table-container" style="padding:0">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.02)">
                            <th style="padding:15px 40px; text-align:left; font-size:10px; color:var(--text-dim);">MERCADO</th>
                            <th style="padding:15px; text-align:center; font-size:10px; color:var(--text-dim);">APUESTAS</th>
                            <th style="padding:15px; text-align:center; font-size:10px; color:var(--text-dim);">WINRATE</th>
                            <th style="padding:15px; text-align:center; font-size:10px; color:var(--text-dim);">PROFIT ($)</th>
                            <th style="padding:15px; text-align:center; font-size:10px; color:var(--text-dim);">ROI %</th>
                            <th style="padding:15px 40px; text-align:right; font-size:10px; color:var(--text-dim);">EFICIENCIA</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${markets.map(([mName, mStats]: any) => {
            const roi = mStats.s > 0 ? (mStats.p / mStats.s) * 100 : 0;
            const wr = mStats.t > 0 ? (mStats.w / mStats.t) * 100 : 0;
            const efficiency = mStats.t > 0 ? (mStats.p / mStats.t) : 0;
            return `
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.03);">
                                <td style="padding:20px 40px; font-weight:900; color:#fff;">${mName}</td>
                                <td style="padding:20px; text-align:center; font-weight:800; color:var(--accent-turq);">${mStats.t}</td>
                                <td style="padding:20px; text-align:center; font-weight:700; color:${wr >= 50 ? 'var(--accent-green)' : 'var(--warn)'};">${wr.toFixed(1)}%</td>
                                <td style="padding:20px; text-align:center; font-weight:800; color:${mStats.p >= 0 ? 'var(--accent-green)' : 'var(--danger)'};">${fUSD(mStats.p)}</td>
                                <td style="padding:20px; text-align:center; font-weight:800; color:${roi >= 0 ? 'var(--accent-green)' : 'var(--danger)'};">${roi.toFixed(1)}%</td>
                                <td style="padding:20px 40px; text-align:right;">
                                    <div style="height:6px; background:rgba(255,255,255,0.05); border-radius:3px; width:100px; display:inline-block; overflow:hidden;">
                                        <div style="height:100%; width:${Math.min(Math.max(roi + 50, 0), 100)}%; background:${roi >= 0 ? 'var(--accent-green)' : 'var(--danger)'};"></div>
                                    </div>
                                </td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    const histBody = document.getElementById('hist-body');
    const loadMoreRoot = document.getElementById('load-more-root');

    if (histBody) {
        histBody.innerHTML = data.paginated.map((p: any) => {
            const isProfit = p.profit >= 0;
            const isMulti = p.matches.length > 1;

            return `
            <tr class="pick-row fade-in">
                <td style="padding: 24px 30px;">
                    <div style="font-size:11px; font-weight:800; color:#fff; margin-bottom:4px;" class="mono">${p.date.split('-').reverse().join('/')}</div>
                    ${isMulti ? `<span class="badge" style="background: var(--accent-brand); color:#000; font-size:7px; padding:2px 6px;">MULTIPICK</span>` : ''}
                </td>
                <td><span class="badge b-${p.source}">${p.source}</span></td>
                <td><span style="font-size:10px; font-weight:800; color:var(--text-dim); border:1px solid var(--border); padding:4px 10px; border-radius:6px; letter-spacing:1px;">${p.type || (isMulti ? 'COMBINADA' : (p.matches[0]?.bet || 'PICK'))}</span></td>
                <td>
                    ${p.matches.map((m: any, mi: number) => `
                        <div style="display: flex; flex-direction: column; gap: 2px; ${mi > 0 ? 'margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--border);' : ''}">
                            <div style="font-size:14px; font-weight:900; color:#fff; letter-spacing:-0.4px;">${m.event}</div>
                            <div style="font-size:10px; color:var(--accent-turq); font-weight:800; text-transform:uppercase; opacity:0.7;">${m.bet}</div>
                        </div>
                    `).join('')}
                </td>
                <td class="mono" style="font-weight:900; color:var(--accent-turq); font-size:15px;">@${p.odds.toFixed(2)}</td>
                <td class="mono">
                    <div style="color:#fff; font-size:13px; font-weight:800;">1.00u</div>
                    <div style="font-size:10px; color:var(--text-muted); font-weight:600;">${fUSD(p.stakeAmount)}</div>
                </td>
                <td><span class="badge b-${(p.auditLabel || p.result).replace(' ', '_')}">${p.auditLabel || p.result}</span></td>
                <td class="mono-profit txt-right ${isProfit ? 'profit-pos' : 'profit-neg'}" style="font-size: 1.1rem;">
                    ${isProfit ? '+' : ''}${fUSD(p.profit)}
                </td>
            </tr>`;
        }).join('');
    }

    if (loadMoreRoot) {
        if (data.paginated.length < data.totalFiltered) {
            loadMoreRoot.innerHTML = `<button class="btn-load-more" onclick="loadMorePicks()">MOSTRAR SIGUIENTES 100 APUESTAS ↓</button>`;
        } else {
            loadMoreRoot.innerHTML = `<p style="font-size:10px; font-weight:800; color:var(--text-muted); letter-spacing:2px;">FIN DEL HISTORIAL - ${data.totalFiltered} APUESTAS AUDITADAS</p>`;
        }
    }

    const pgTop = document.getElementById('pagination-top');
    if (pgTop) pgTop.innerHTML = `<span style="color:var(--accent-green); font-size:16px;">${data.totalFiltered}</span> RESULTADOS ENCONTRADOS`;
}

function renderCharts(data: any) {
    const { chartData, equityHistory } = data;

    const equityDatasets = [
        {
            label: 'Capital Total',
            data: equityHistory.map((h: any) => h.currentBank),
            borderColor: '#b2cf3e',
            borderWidth: 4,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointBackgroundColor: '#b2cf3e',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            backgroundColor: (context: any) => {
                const chart = context.chart;
                const { ctx, chartArea } = chart;
                if (!chartArea) return null;
                const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                gradient.addColorStop(0, 'rgba(178, 207, 62, 0.25)');
                gradient.addColorStop(0.5, 'rgba(178, 207, 62, 0.05)');
                gradient.addColorStop(1, 'rgba(178, 207, 62, 0)');
                return gradient;
            },
            fill: true, tension: 0.4
        },
        {
            label: 'ELITE',
            data: equityHistory.map((h: any) => h.planBanks?.['ELITE']),
            borderColor: '#00f2ff', borderWidth: 2,
            fill: false, tension: 0.4, pointRadius: 0,
            borderDash: [6, 4]
        },
        {
            label: 'PREMIUM',
            data: equityHistory.map((h: any) => h.planBanks?.['PREMIUM']),
            borderColor: '#b2cf3e', borderWidth: 2,
            fill: false, tension: 0.4, pointRadius: 0,
            borderDash: [6, 4]
        },
        {
            label: 'STANDARD',
            data: equityHistory.map((h: any) => h.planBanks?.['STANDARD']),
            borderColor: '#ff9f0a', borderWidth: 2,
            fill: false, tension: 0.4, pointRadius: 0,
            borderDash: [6, 4]
        },
        {
            label: 'PERSONAL',
            data: equityHistory.map((h: any) => h.planBanks?.['PERSONAL']),
            borderColor: '#ffffff', borderWidth: 1.5,
            fill: false, tension: 0.4, pointRadius: 0,
            borderDash: [6, 4]
        }
    ];

    newChart('ch-equity', 'line', equityHistory.map((h: any) => h.date), equityDatasets, true, true);

    newChart('ch-range-yield', 'bar', chartData.odds.map((o: any) => o.l), [{
        label: 'Yield %', data: chartData.odds.map((o: any) => o.s > 0 ? (o.p / o.s) * 100 : 0),
        backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return null;
            return chartData.odds.map((o: any) => {
                const grad = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                if (o.p >= 0) {
                    grad.addColorStop(0, '#b2cf3e');
                    grad.addColorStop(1, 'rgba(178, 207, 62, 0.4)');
                } else {
                    grad.addColorStop(0, '#ff3b3b');
                    grad.addColorStop(1, 'rgba(255, 59, 59, 0.4)');
                }
                return grad;
            })[context.dataIndex];
        },
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        barPercentage: 0.9,
        categoryPercentage: 0.85
    }]);

    // NEW: Winrate by Odds Range
    newChart('ch-range-hr', 'bar', chartData.odds.map((o: any) => o.l), [{
        label: 'Winrate %',
        data: chartData.odds.map((o: any) => o.t > 0 ? (o.w / o.t) * 100 : 0),
        backgroundColor: '#ff9800',
        borderRadius: 12,
        barPercentage: 0.9,
        categoryPercentage: 0.85
    }]);

    // PERFORMANCE CHART: PREMIUM VERTICAL GROUPED BARS
    // PERFORMANCE CHART: PREMIUM VERTICAL GROUPED BARS
    const plansComp = ['ELITE', 'PREMIUM', 'STANDARD', 'PERSONAL'];

    const dsROI = plansComp.map(pName => {
        const stats = chartData.plans[pName] || { s: 0, p: 0 };
        return stats.s > 0 ? (stats.p / stats.s) * 100 : 0;
    });

    const dsVol = plansComp.map(pName => {
        const stats = chartData.plans[pName] || { s: 0, p: 0 };
        const pInitialBank = state.config.planBanks?.[pName] ?? 2500;
        return Math.min((stats.s / pInitialBank) * 100, 200);
    });

    const dsWin = plansComp.map(pName => {
        const pProcessed = data.allProcessed.filter((x: any) => x.source === pName);
        return pProcessed.length > 0 ? (pProcessed.filter((x: any) => x.result.includes('WIN')).length / pProcessed.length) * 100 : 0;
    });

    const dsEff = plansComp.map(pName => {
        const pProcessed = data.allProcessed.filter((x: any) => x.source === pName);
        const losses = Math.abs(pProcessed.filter((x: any) => x.profit < 0).reduce((sum, x) => sum + x.profit, 0));
        const wins = pProcessed.filter((x: any) => x.profit > 0).reduce((sum, x) => sum + x.profit, 0);
        return losses > 0 ? Math.min((wins / losses) * 20, 100) : (wins > 0 ? 100 : 0);
    });

    const perfDatasets = [
        { label: 'ROI %', data: dsROI, backgroundColor: '#b2cf3e', borderRadius: 8, barPercentage: 0.85, categoryPercentage: 0.8 },
        { label: 'Volumen %', data: dsVol, backgroundColor: '#00f2ff', borderRadius: 8, barPercentage: 0.85, categoryPercentage: 0.8 },
        { label: 'Winrate %', data: dsWin, backgroundColor: '#ff9800', borderRadius: 8, barPercentage: 0.85, categoryPercentage: 0.8 },
        { label: 'Eficiencia %', data: dsEff, backgroundColor: '#94a3b8', borderRadius: 8, barPercentage: 0.85, categoryPercentage: 0.8 }
    ];

    newChart('ch-performance', 'bar', plansComp, perfDatasets.map(ds => ({
        ...ds,
        backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return ds.backgroundColor;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, ds.backgroundColor + '33');
            gradient.addColorStop(1, ds.backgroundColor);
            return gradient;
        }
    })), true);

    // PLAN COMPARISON LINE CHART
    const compROI = plansComp.map(p => {
        const s = chartData.plans[p] || { s: 0, p: 0 };
        return s.s > 0 ? (s.p / s.s) * 100 : 0;
    });
    const compProfit = plansComp.map(p => {
        const s = chartData.plans[p] || { s: 0, p: 0 };
        const pInitialBank = state.config.planBanks?.[p] ?? 2500;
        return (s.p / pInitialBank) * 100;
    });
    const compYield = compROI;

    newChart('ch-plan-comparison', 'line', plansComp, [
        {
            label: 'ROI (Stake) %', data: compROI,
            borderColor: '#b2cf3e',
            backgroundColor: 'rgba(178, 207, 62, 0.15)',
            fill: true, tension: 0.4, borderWidth: 4, pointRadius: 6, pointHoverRadius: 10,
            pointBackgroundColor: '#fff', pointBorderWidth: 3
        },
        {
            label: 'Profit (Bank) %', data: compProfit,
            borderColor: '#00f2ff',
            backgroundColor: 'rgba(0, 242, 255, 0.15)',
            fill: true, tension: 0.4, borderWidth: 4, pointRadius: 6, pointHoverRadius: 10,
            pointBackgroundColor: '#fff', pointBorderWidth: 3
        },
        {
            label: 'Yield %', data: compYield,
            borderColor: '#ff9800',
            backgroundColor: 'transparent',
            fill: false, tension: 0.4, borderWidth: 3, borderDash: [6, 6], pointRadius: 4
        }
    ]);

    // NEW: Profit by Month and Plan Bar Chart
    const mLabels = Object.keys(chartData.monthPlanProfit).sort();
    const planColors: Record<string, string> = { 'ELITE': '#00f2ff', 'PREMIUM': '#b2cf3e', 'STANDARD': '#ff9f0a', 'PERSONAL': '#ffffff' };
    const monthPlanDatasets = plansComp.map(pName => ({
        label: pName,
        data: mLabels.map(mKey => chartData.monthPlanProfit[mKey][pName] || 0),
        backgroundColor: planColors[pName] || '#94a3b8',
        borderRadius: 6,
        barPercentage: mLabels.length > 5 ? 0.8 : 0.4,
        categoryPercentage: mLabels.length > 5 ? 0.8 : 0.4
    }));

    newChart('ch-month-plan-profit', 'bar', mLabels.map(l => l.split('-').reverse().join('/')), monthPlanDatasets.map(ds => ({
        ...ds,
        backgroundColor: (context: any) => {
            const chart = context.chart;
            const { ctx, chartArea } = chart;
            if (!chartArea) return ds.backgroundColor;
            const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
            gradient.addColorStop(0, ds.backgroundColor + '44');
            gradient.addColorStop(1, ds.backgroundColor);
            return gradient;
        }
    })), true, true);

    // NEW: Profit by Day of the Week Chart
    const dayLabels = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
    const dayData = [0, 1, 2, 3, 4, 5, 6].map(d => chartData.days[d] || 0);
    newChart('ch-day-profit', 'bar', dayLabels, [{
        label: 'Profit ($)',
        data: dayData,
        backgroundColor: (context: any) => {
            const val = context.raw;
            return val >= 0 ? 'rgba(178, 207, 62, 0.7)' : 'rgba(255, 59, 59, 0.7)';
        },
        borderRadius: 8
    }], false, true);

    // NEW: Drawdown Chart
    const ddDatasets = [
        {
            label: 'Drawdown Global ($)',
            data: equityHistory.map((h: any) => h.ddValue),
            borderColor: '#ff3b3b',
            borderWidth: 3,
            backgroundColor: 'rgba(255, 59, 59, 0.1)',
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointBackgroundColor: '#ff3b3b',
            order: 0
        },
        ...plansComp.map(pName => ({
            label: `DD ${pName}`,
            data: equityHistory.map((h: any) => h.planDDs?.[pName] || 0),
            borderColor: planColors[pName],
            borderWidth: 1.5,
            fill: false,
            tension: 0.1,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderDash: [5, 5],
            hidden: pName !== state.filters.source && state.filters.source !== 'ALL',
            order: 1
        }))
    ];

    newChart('ch-drawdown', 'line', equityHistory.map((h: any) => h.date), ddDatasets, true, true);

    // CLICK AND DRAG HANDLER FOR DRAWDOWN RANGE
    const ddChart = state.charts['ch-drawdown'];
    if (ddChart) {
        const canvas = document.getElementById('ch-drawdown') as HTMLCanvasElement;
        const box = document.getElementById('dd-selection-box') as HTMLElement;
        const status = document.getElementById('dd-selection-status') as HTMLElement;
        let isDragging = false;
        let startX = 0;

        canvas.onmousedown = (e: MouseEvent) => {
            const chartArea = ddChart.chartArea;
            if (e.offsetX < chartArea.left || e.offsetX > chartArea.right) return;
            isDragging = true;
            startX = e.offsetX;
            box.style.display = 'block';
            box.style.left = startX + 'px';
            box.style.width = '0px';

            const xVal = ddChart.scales.x.getValueForPixel(startX);
            state.tempRangeStart = ddChart.data.labels[xVal]?.split(' (')[0];
        };

        window.onmousemove = (e: MouseEvent) => {
            if (!isDragging) return;
            const rect = canvas.getBoundingClientRect();
            const currentX = Math.max(ddChart.chartArea.left, Math.min(ddChart.chartArea.right, e.clientX - rect.left));

            const left = Math.min(startX, currentX);
            const width = Math.abs(currentX - startX);
            box.style.left = left + 'px';
            box.style.width = width + 'px';

            const xVal = ddChart.scales.x.getValueForPixel(currentX);
            state.tempRangeEnd = ddChart.data.labels[xVal]?.split(' (')[0];

            if (status && state.tempRangeStart && state.tempRangeEnd) {
                const s = state.tempRangeStart <= state.tempRangeEnd ? state.tempRangeStart : state.tempRangeEnd;
                const f = state.tempRangeStart <= state.tempRangeEnd ? state.tempRangeEnd : state.tempRangeStart;
                status.innerText = `📅 ${s.split('-').reverse().join('/')} - ${f.split('-').reverse().join('/')}`;
            }
        };

        window.onmouseup = () => {
            if (!isDragging) return;
            isDragging = false;
            box.style.display = 'none';

            if (state.tempRangeStart && state.tempRangeEnd) {
                const start = state.tempRangeStart;
                const end = state.tempRangeEnd;
                state.filters.dateRange = 'CUSTOM';
                state.filters.dateStart = start <= end ? start : end;
                state.filters.dateEnd = start <= end ? end : start;

                state.tempRangeStart = null;
                state.tempRangeEnd = null;
                updateUI();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
    }
}

(window as any).toggleKpiDetail = (id: string) => {
    const card = document.getElementById(id);
    const detail = document.getElementById(id + '-detail');
    if (card && detail) {
        card.classList.toggle('slid');
        detail.classList.toggle('open');
    }
};

(window as any).toggleConfigEdit = () => {
    state.config.editMode = !state.config.editMode;
    if (!state.config.editMode) {
        saveState();
    }
    updateUI();
};

(window as any).updateGlobalBankValue = (val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    state.config.bank = num;
    saveState();
    updateUI();
};

(window as any).updatePlanConfig = (name: string, type: 'bank' | 'stake', val: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return;
    if (type === 'bank') {
        state.config.planBanks[name] = num;
    } else {
        state.config.planConfigs[name] = num;
    }
    saveState();
    updateUI();
};

(window as any).toggleGlobalBank = () => {
    state.config.useGlobalBank = !state.config.useGlobalBank;
    saveState();
    updateUI();
};

(window as any).resetHistFilters = () => {
    (window as any).resetAllFilters();
};

(window as any).toggleMultiFilter = (key: 'source' | 'market', value: string) => {
    if (value === 'ALL') {
        state.filters[key] = [];
    } else {
        const current = state.filters[key];
        if (current.includes(value)) {
            state.filters[key] = current.filter((v: string) => v !== value);
        } else {
            state.filters[key] = [...current, value];
        }
    }
    updateUI();
};

(window as any).toggleDateRangeFilter = (value: string) => {
    state.filters.dateRange = value;
    updateUI();
};

// Inject extra visual styles
const style = document.createElement('style');
style.textContent = `
    .sim-row-hover:hover {
        background: rgba(255,255,255,0.05) !important;
        transform: translateX(5px);
    }
    .glow {
        text-shadow: 0 0 15px currentColor;
    }
    .v-small {
        font-size: 1.5rem !important;
    }
    .shimmer {
        animation: shimmer 2s infinite linear;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        background-size: 200% 100%;
    }
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    .filter-box-multi {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        background: rgba(0,0,0,0.3);
        padding: 8px;
        border-radius: 12px;
        border: 1px solid var(--border);
        min-height: 44px;
        max-height: 120px;
        overflow-y: auto;
    }
    .multi-filter-tag {
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 9px;
        font-weight: 800;
        cursor: pointer;
        background: rgba(255,255,255,0.03);
        border: 1px solid var(--border);
        color: var(--text-dim);
        transition: all 0.2s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        white-space: nowrap;
    }
    .multi-filter-tag:hover {
        border-color: var(--accent-turq);
        color: #fff;
    }
    .multi-filter-tag.active {
        background: var(--accent-brand);
        color: #000;
        border-color: transparent;
        box-shadow: 0 0 15px var(--accent-turq-glow);
    }
`;
document.head.appendChild(style);

window.onload = () => {
    loadState().then(renderApp);
};
