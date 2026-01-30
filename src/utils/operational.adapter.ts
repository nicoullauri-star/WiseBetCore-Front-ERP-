import { SenalResponse } from '@/types/operational.types';
import { PickSource } from '@/components/OperatorComponents';

export const adaptSignalToPickSource = (senal: SenalResponse): PickSource => {
    // Basic mapping
    const base: PickSource = {
        id: String(senal.id_senal),
        sport: senal.sport,
        league: senal.league,
        startTime: senal.startTime,
        startDateTime: senal.startDateTime,
        event: senal.event,
        market: senal.market,
        selection: senal.selection,
        fairOdd: Number(senal.fairOdd),
        minOdd: Number(senal.minOdd),
        recommendedStake: Number(senal.recommendedStake),
        placedStake: Number(senal.placedStake || 0),
        status: senal.status as any, // 'NEW' | 'PARTIAL' | ...
        isLive: senal.isLive,
        source: senal.source || 'MANUAL',
        receivedAt: senal.receivedAt,
        notes: senal.notas || '',
        bookieOdds: {} // Not provided by this endpoint yet
    };

    // If it's a COMBO, we might want to adjust the display
    // e.g. "Combo 3 Picks" instead of a single event name
    if (senal.tipo_apuesta === 'COMBINADA') {
        const count = senal.picks ? senal.picks.length : 0;

        // Map sub-picks
        const subPicks = senal.picks?.map(p => ({
            event: p.partido,
            market: p.mercado,
            selection: p.seleccion,
            startTime: new Date(p.fecha_evento).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            sport: p.deporte_nombre || 'Desconocido',
            league: p.competicion_nombre || 'Desconocido'
        })) || [];

        return {
            ...base,
            event: `⚡ COMBINADA (${count} Picks)`,
            market: 'Multi-Market',
            selection: `${count} Selecciones`,
            subPicks: subPicks
        };
    }

    return base;
};
