/**
 * useAgencias Hook
 * Hook para gestionar el estado de agencias
 */

import { useState, useEffect, useCallback } from 'react';
import { agenciasService } from '../services';
import type { Agencia, CreateAgenciaData, UpdateAgenciaData } from '../types';

interface UseAgenciasState {
    agencias: Agencia[];
    isLoading: boolean;
    error: string | null;
}

interface UseAgenciasReturn extends UseAgenciasState {
    refetch: () => Promise<void>;
    createAgencia: (data: CreateAgenciaData) => Promise<Agencia>;
    updateAgencia: (id: number, data: UpdateAgenciaData) => Promise<Agencia>;
    deleteAgencia: (id: number) => Promise<void>;
}

export function useAgencias(): UseAgenciasReturn {
    const [state, setState] = useState<UseAgenciasState>({
        agencias: [],
        isLoading: true,
        error: null,
    });

    const fetchAgencias = useCallback(async () => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            const response = await agenciasService.getAll({ page_size: 100 });
            setState({
                agencias: response.results,
                isLoading: false,
                error: null,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error al cargar agencias';
            setState(prev => ({
                ...prev,
                isLoading: false,
                error: errorMessage,
            }));
        }
    }, []);

    useEffect(() => {
        fetchAgencias();
    }, [fetchAgencias]);

    const createAgencia = async (data: CreateAgenciaData) => {
        try {
            const newAgencia = await agenciasService.create(data);
            await fetchAgencias();
            return newAgencia;
        } catch (err) {
            throw err;
        }
    };

    const updateAgencia = async (id: number, data: UpdateAgenciaData) => {
        try {
            const updatedAgencia = await agenciasService.update(id, data);
            await fetchAgencias();
            return updatedAgencia;
        } catch (err) {
            throw err;
        }
    };

    const deleteAgencia = async (id: number) => {
        try {
            await agenciasService.delete(id);
            await fetchAgencias();
        } catch (err) {
            throw err;
        }
    };

    return {
        ...state,
        refetch: fetchAgencias,
        createAgencia,
        updateAgencia,
        deleteAgencia,
    };
}
