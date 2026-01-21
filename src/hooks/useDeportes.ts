/**
 * useDeportes Hook
 * Hook personalizado para gestionar el estado de deportes
 */

import { useState, useEffect, useCallback } from 'react';
import { deportesService } from '../services';
import type { Deporte } from '../types';

interface UseDeportesState {
    deportes: Deporte[];
    isLoading: boolean;
    error: string | null;
}

interface UseDeportesReturn extends UseDeportesState {
    refetch: () => Promise<void>;
}

/**
 * Hook para obtener y gestionar deportes (catálogo)
 */
export function useDeportes(): UseDeportesReturn {
    const [state, setState] = useState<UseDeportesState>({
        deportes: [],
        isLoading: true,
        error: null,
    });

    const fetchDeportes = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await deportesService.getAll();
            setState({
                deportes: response.results,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar deportes';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, []);

    useEffect(() => {
        fetchDeportes();
    }, [fetchDeportes]);

    return {
        ...state,
        refetch: fetchDeportes,
    };
}
