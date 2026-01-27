
import { useState, useMemo, useCallback } from 'react';
import { ProfileItemV8 } from '../types/tradingZoneTypes';

interface SplitSettings {
    method: 'FIXED' | 'LIQUIDITY' | 'KELLY';
    roundTo: 1 | 5 | 10;
    maxProfiles: number;
    minMontoPerProfile: number;
    allowMaxStakeOverride: boolean;
    affinityWeight: number;
    maxBankrollPct: number;
    stakeRangePct: number;
    antiDetection: boolean;
}

export const useSplitEngine = (
    totalMonto: number,
    profiles: ProfileItemV8[],
    mode: 'AUTO' | 'MANUAL',
    settings: SplitSettings,
    sportAffinity: string,
    isTargeted: boolean = false
) => {
    const [manualStakes, setManualStakes] = useState<Record<string, number>>({});
    const [lockedProfiles, setLockedProfiles] = useState<string[]>([]);
    const [trigger, setTrigger] = useState(0);

    const splitResult = useMemo(() => {
        const stakes: Record<string, number> = {};

        if (mode === 'MANUAL') {
            let assignedResult = 0;
            profiles.forEach(p => {
                const val = (manualStakes[p.id] as number) || 0;
                stakes[p.id] = val;
                assignedResult += val;
            });
            return { stakes, assigned: assignedResult, remaining: totalMonto - assignedResult, profileCount: Object.values(manualStakes).filter(v => (v as number) > 0).length };
        }

        // --- AUTO SPLIT ALGORITHM (REVISIÓN V8.9: ITERATIVO) ---
        const round = (val: number) => {
            if (val <= 0) return 0;
            let result = val;
            if (settings.roundTo > 1) {
                result = Math.round(val / settings.roundTo) * settings.roundTo;
            } else {
                result = Math.round(val);
            }

            // --- SMART STAKING: ANTI-DETECTION JITTER ---
            if ((settings as any).antiDetection) {
                // Add/Subtract a random value between 0.05 and 0.45
                const jitter = (Math.random() * 0.4) + 0.05;
                result = Math.max(settings.minMontoPerProfile, result - jitter);
            }
            return result;
        };

        const viable = profiles.filter(p =>
            ['HEALTHY', 'ACTIVE', 'healthy', 'active'].includes(p.status) &&
            p.balance >= settings.minMontoPerProfile
        );

        const scored = viable.map(p => {
            let score = 1;
            if (p.tags?.includes(sportAffinity)) score += settings.affinityWeight;
            score *= (p.balance / 1000);
            return { profile: p, score };
        }).sort((a, b) => b.score - a.score);

        const limit = isTargeted ? profiles.length : settings.maxProfiles;
        const selected = scored.slice(0, limit);
        let assignedTotal = 0;
        const autoStakes: Record<string, number> = {};

        // Profiles available for dynamic allocation
        let dynamicProfiles = selected.filter(s => !lockedProfiles.includes(s.profile.id));

        // Initial setup for autoStakes
        selected.forEach(s => autoStakes[s.profile.id] = 0);

        // Pre-apply locked/manual stakes
        lockedProfiles.forEach(id => {
            const val = (manualStakes[id] as number) || 0;
            autoStakes[id] = val;
            assignedTotal += val;
        });

        let remainingToDistribute = totalMonto - assignedTotal;

        // --- ITERATIVE DISTRIBUTION PASSES ---
        // Max 10 passes to prevent any infinite loop (though logic should be stable)
        for (let pass = 0; pass < 10 && remainingToDistribute > 0.5 && dynamicProfiles.length > 0; pass++) {
            const totalScore = dynamicProfiles.reduce((acc, s) => acc + s.score, 0);
            const profilesToRemove: string[] = [];

            dynamicProfiles.forEach(s => {
                if (remainingToDistribute <= 0) return;

                let share = 0;
                if (settings.method === 'LIQUIDITY') {
                    share = (s.score / totalScore) * remainingToDistribute;
                } else {
                    share = remainingToDistribute / dynamicProfiles.length;
                }

                // Caps
                let cap = s.profile.balance;
                const bankrollLimit = s.profile.balance * ((settings.maxBankrollPct || 50) / 100);
                cap = Math.min(cap, bankrollLimit);

                // Adaptive Stake Range Logic
                const avg = s.profile.averageStake || 50;
                const rangeLimit = avg * (1 + (settings.stakeRangePct / 100));
                cap = Math.min(cap, rangeLimit);

                if (!settings.allowMaxStakeOverride) {
                    cap = Math.min(cap, s.profile.maxStakeSuggested || 1000);
                }

                const current = autoStakes[s.profile.id] || 0;
                const canAdd = cap - current;

                if (canAdd <= 0) {
                    profilesToRemove.push(s.profile.id);
                    return;
                }

                const toAdd = Math.min(share, canAdd);
                autoStakes[s.profile.id] = (autoStakes[s.profile.id] || 0) + toAdd;
                assignedTotal += toAdd;
                remainingToDistribute -= toAdd;

                if (toAdd >= canAdd - 0.1) {
                    profilesToRemove.push(s.profile.id);
                }
            });

            dynamicProfiles = dynamicProfiles.filter(s => !profilesToRemove.includes(s.profile.id));
        }

        // Check if we have missing profiles
        if (selected.length === 0 && totalMonto > 0) {
            console.warn("SplitEngine: No profiles eligible for distribution");
        }

        // Final rounding step
        Object.keys(autoStakes).forEach(id => {
            autoStakes[id] = round(autoStakes[id]);
        });

        // Recalculate totals after rounding
        let finalAssigned = Object.values(autoStakes).reduce((a, b) => a + b, 0);

        // --- ROUNDING CORRECTION (NEW v10.2) ---
        // If the gap after rounding is small but not zero, and we have profiles, 
        // try to put the difference in the first profile that isn't locked.
        let diff = totalMonto - finalAssigned;
        if (Math.abs(diff) > 0.01 && Math.abs(diff) < 20 && selected.length > 0) {
            const firstId = selected[0].profile.id;
            if (!lockedProfiles.includes(firstId)) {
                autoStakes[firstId] = Math.max(0, autoStakes[firstId] + diff);
                finalAssigned += diff;
            }
        }

        return {
            stakes: autoStakes,
            assigned: finalAssigned,
            remaining: Math.max(0, totalMonto - finalAssigned),
            profileCount: Object.values(autoStakes).filter(v => (v as number) > 0).length
        };

    }, [totalMonto, profiles, mode, settings, sportAffinity, manualStakes, lockedProfiles, trigger]);

    const setProfileStake = useCallback((id: string, value: number) => {
        setManualStakes(prev => ({ ...prev, [id]: value }));
        if (!lockedProfiles.includes(id)) {
            setLockedProfiles(prev => [...prev, id]);
        }
    }, [lockedProfiles]);

    const toggleLock = useCallback((id: string) => {
        setLockedProfiles(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    }, []);

    const reset = useCallback(() => {
        setManualStakes({});
        setLockedProfiles([]);
    }, []);

    const redistribute = useCallback(() => {
        setTrigger(t => t + 1);
        setManualStakes({});
        setLockedProfiles([]);
        console.log("Algo: Redistribución forzada");
    }, []);

    return { ...splitResult, setProfileStake, toggleLock, reset, redistribute, lockedProfiles };
};
