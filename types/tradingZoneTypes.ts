
import { ProfileItem } from '../types/orchestratorTypes';
import { PickSource } from '../components/OperatorComponents';

// Extension of ProfileItem for the new Trading Zone UX
export interface ProfileItemV8 extends ProfileItem {
    balance: number;
    city?: string;
    tags?: string[];
    cooldownUntil?: string; // ISO Date
    maxStakeSuggested?: number;
    notes?: string;
    lastUsed?: string; // ISO Date
    ecosystem?: string;
    averageStake?: number;
}

export interface SignalV8 {
    id: string;
    event: string;
    market: string;
    sport: string;
    fairOdd: number;
    minOdd: number;
    recommendedStake: number;
}

// Extension of PickSource
export interface PickSourceV8 extends PickSource {
    leagueId?: string;
    category?: string; // e.g. 'Esports', 'Tennis'
    leaderConfig?: {
        minOddMultiplier?: number;
        maxProfilesPerBet?: number;
    }
}

// Mock Adapter for missing data
export const enhanceProfile = (p: any): ProfileItemV8 => ({
    ...p,
    city: p.city || 'Quito, EC',
    tags: p.tags || ['Fútbol', 'Goles'],
    maxStakeSuggested: p.maxStakeSuggested || 1000,
    notes: p.notes || 'Buen perfil histórico',
});
