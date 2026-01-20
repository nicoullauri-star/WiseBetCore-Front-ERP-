/**
 * useCasas Hook
 * Hook personalizado para gestionar el estado de casas de apuestas
 */

import { useState, useEffect, useCallback } from 'react';
import { casasService } from '../services';
import type { CasaApuestas } from '../types';

interface UseCasasState {
    casas: CasaApuestas[];
    isLoading: boolean;
    error: string | null;
}

interface UseCasasReturn extends UseCasasState {
    refetch: () => Promise<void>;
    createCasa: (data: any) => Promise<CasaApuestas>;
    updateCasa: (id: number, data: any) => Promise<CasaApuestas>;
    deleteCasa: (id: number) => Promise<void>;
}

export function useCasas(distribuidoraId?: number): UseCasasReturn {
    const [state, setState] = useState<UseCasasState>({
        casas: [],
        isLoading: true,
        error: null,
    });

    const fetchCasas = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const params = distribuidoraId ? { distribuidora: distribuidoraId, page_size: 100 } : { page_size: 100 };
            const response = await casasService.getAll(params);

            setState({
                casas: response.results,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar casas de apuestas';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, [distribuidoraId]);

    const createCasa = async (data: any) => {
        try {
            const newCasa = await casasService.create(data);
            await fetchCasas();
            return newCasa;
        } catch (err) {
            throw err;
        }
    };

    const updateCasa = async (id: number, data: any) => {
        try {
            const updatedCasa = await casasService.update(id, data);
            await fetchCasas();
            return updatedCasa;
        } catch (err) {
            throw err;
        }
    };

    const deleteCasa = async (id: number) => {
        try {
            await casasService.delete(id);
            await fetchCasas();
        } catch (err) {
            throw err;
        }
    };

    useEffect(() => {
        fetchCasas();
    }, [fetchCasas]);

    return {
        ...state,
        refetch: fetchCasas,
        createCasa,
        updateCasa,
        deleteCasa,
    };
}
