/**
 * useDistribuidoras Hook
 * Hook personalizado para gestionar el estado de distribuidoras
 */

import { useState, useEffect, useCallback } from 'react';
import { distribuidorasService } from '../services';
import type { DistribuidoraExpanded, Ecosistema } from '../types';

interface UseDistribuidorasState {
    distribuidoras: DistribuidoraExpanded[];
    ecosistemas: Ecosistema[];
    isLoading: boolean;
    error: string | null;
}

interface UseDistribuidorasReturn extends UseDistribuidorasState {
    refetch: () => Promise<void>;
    createDistribuidora: (data: any) => Promise<any>;
    updateDistribuidora: (id: number, data: any) => Promise<any>;
    deleteDistribuidora: (id: number) => Promise<void>;
}

/**
 * Hook para obtener y gestionar distribuidoras
 * Proporciona tanto el formato original como el formato Ecosistema para compatibilidad
 */
export function useDistribuidoras(): UseDistribuidorasReturn {
    const [state, setState] = useState<UseDistribuidorasState>({
        distribuidoras: [],
        ecosistemas: [],
        isLoading: true,
        error: null,
    });

    const fetchDistribuidoras = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await distribuidorasService.getAllWithCasas({ page_size: 100 });

            // Transformar a formato Ecosistema para compatibilidad, conservando casas completas
            const ecosistemas: Ecosistema[] = (response.results || []).map(dist => ({
                id: dist.id_distribuidora.toString(),
                name: dist.nombre,
                houses: dist.casas
            }));

            setState({
                distribuidoras: response.results,
                ecosistemas,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar distribuidoras';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, []);

    useEffect(() => {
        fetchDistribuidoras();
    }, [fetchDistribuidoras]);

    const createDistribuidora = async (data: any) => {
        try {
            const newDist = await distribuidorasService.create(data);
            await fetchDistribuidoras();
            return newDist;
        } catch (err) {
            throw err;
        }
    };

    const updateDistribuidora = async (id: number, data: any) => {
        try {
            const updatedDist = await distribuidorasService.update(id, data);
            await fetchDistribuidoras();
            return updatedDist;
        } catch (err) {
            throw err;
        }
    };

    const deleteDistribuidora = async (id: number) => {
        try {
            await distribuidorasService.delete(id);
            await fetchDistribuidoras();
        } catch (err) {
            throw err;
        }
    };

    return {
        ...state,
        refetch: fetchDistribuidoras,
        createDistribuidora,
        updateDistribuidora,
        deleteDistribuidora,
    };
}
