
import { ProfileItemV8, SignalV8 } from '../types/tradingZoneTypes';

const DEFAULT_PROXY = {
    ip: '192.168.1.1',
    location: 'EC',
    type: 'SOAX-RES' as any,
    latency: 120,
    rotationTime: 15
};

const bookiesByEco: Record<string, string[]> = {
    'ALTENAR': ['ECUABET', 'FUNPLAY', 'DATABET', 'TURBOBET', 'OKIBET', '4BET', 'BETFINE'],
    '1XGROUP': ['1XBET', 'MELBET', '22BET', '1XBIT', 'BETWINNER'],
    'INTERNACIONAL': ['PINNACLE', 'BETINASIA', 'BETFURY', 'BETCAKE', 'VAVADA'],
    'SORTI': ['SORTI', 'VICTORY365', 'SHARK-BET'],
    'SPORTBET': ['BETPROLIVE', 'LATINBET']
};

const sports = ['Fútbol', 'Tenis', 'Basket', 'Esports'];
const operators = ['NICOLÁS', 'SANTIAGO', 'ANDRÉS', 'MATEO'];

// Generate 55 Diverse Profiles
const generateMassiveMocks = (): ProfileItemV8[] => {
    const mocks: ProfileItemV8[] = [];
    let idCounter = 1;

    Object.entries(bookiesByEco).forEach(([eco, bookies]) => {
        bookies.forEach(bookie => {
            // Create 2-3 profiles per bookie to reach ~50-60 total
            const countForBookie = Math.floor(Math.random() * 2) + 2;

            for (let i = 0; i < countForBookie; i++) {
                const sport = sports[Math.floor(Math.random() * sports.length)];
                const op = operators[Math.floor(Math.random() * operators.length)];
                // Balance between 20 and 500
                const balance = Math.floor(Math.random() * 480) + 20;

                // Average Stake: Snap some to filter values (20, 50, 100, 200, 500)
                const stakeOptions = [20, 50, 100, 200, 500];
                const avgStake = Math.random() > 0.4
                    ? stakeOptions[Math.floor(Math.random() * stakeOptions.length)]
                    : Math.floor(Math.random() * 480) + 20;


                const id = `${bookie.substring(0, 3)}-${idCounter.toString().padStart(2, '0')}`;

                mocks.push({
                    id,
                    adsId: `ads_v15_${idCounter}`,
                    name: op,
                    group: Math.random() > 0.7 ? 'ELITE' : 'STANDARD',
                    sport: sport as any,
                    bookie,
                    status: 'HEALTHY',
                    health: 80 + Math.floor(Math.random() * 20),
                    trustScore: 85 + Math.floor(Math.random() * 15),
                    latency: 100 + Math.floor(Math.random() * 200),
                    memory: 300 + Math.floor(Math.random() * 200),
                    nodeId: `n${Math.floor(idCounter / 10) + 1}`,
                    lastAction: 'Ready',
                    proxy: DEFAULT_PROXY,
                    balance,
                    ecosystem: eco,
                    tags: [sport],
                    averageStake: avgStake,
                    lastUsed: new Date(Date.now() - Math.random() * 100000000).toISOString()
                });
                idCounter++;
            }
        });
    });

    return mocks;
};

export const MOCK_PROFILES_V8: ProfileItemV8[] = generateMassiveMocks();

export const MOCK_SCENARIOS_V8: SignalV8[] = [
    { id: 'S-FUT', event: 'Real Madrid vs Liverpool', sport: 'Fútbol', market: 'Goles > 2.5', fairOdd: 1.85, minOdd: 1.75, recommendedStake: 800 },
    { id: 'S-TEN', event: 'Nadal vs Federer', sport: 'Tenis', market: 'Ganador 2-0', fairOdd: 2.10, minOdd: 2.00, recommendedStake: 300 },
    { id: 'S-BAS', event: 'Lakers vs Bulls', sport: 'Basket', market: 'Hándicap -5.5', fairOdd: 1.91, minOdd: 1.85, recommendedStake: 500 },
    { id: 'S-ESP', event: 'Faze vs G2', sport: 'Esports', market: 'Mapa 2 Winner', fairOdd: 1.70, minOdd: 1.65, recommendedStake: 1000 },
    { id: 'S-MIX', event: 'Multi-Evento Test', sport: 'Fútbol', market: 'BTTS Yes', fairOdd: 1.95, minOdd: 1.90, recommendedStake: 1500 },
];
