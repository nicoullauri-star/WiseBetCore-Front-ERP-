/**
 * useObjetivos Hook
 * Hook personalizado para gestionar objetivos de creación de perfiles
 */

import { useState, useEffect, useCallback } from 'react';
import { objetivosService } from '../services/objetivos.service';
import type { ObjetivoPerfiles, CreateObjetivoData } from '../types';

// ============================================================================
// HOOK: useObjetivosPendientes
// ============================================================================

export function useObjetivosPendientes() {
    const [objetivos, setObjetivos] = useState<ObjetivoPerfiles[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPendientes = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await objetivosService.getPendientes();
            setObjetivos(data);
            return data; // Retornar datos para permitir await
        } catch (err) {
            setError('Error al cargar objetivos pendientes');
            console.error('Error fetching objetivos pendientes:', err);
            throw err; // Re-throw para que Promise.all pueda manejarlo
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPendientes();
    }, [fetchPendientes]);

    return { 
        objetivos, 
        isLoading, 
        error, 
        refetch: fetchPendientes 
    };
}

// ============================================================================
// HOOK: useObjetivos (CRUD completo)
// ============================================================================

export function useObjetivos(agenciaId?: number) {
    const [objetivos, setObjetivos] = useState<ObjetivoPerfiles[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchObjetivos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await objetivosService.getAll({ agencia: agenciaId });
            setObjetivos(response.results);
        } catch (err) {
            setError('Error al cargar objetivos');
            console.error('Error fetching objetivos:', err);
        } finally {
            setIsLoading(false);
        }
    }, [agenciaId]);

    const createObjetivo = useCallback(async (data: CreateObjetivoData) => {
        try {
            const newObjetivo = await objetivosService.create(data);
            setObjetivos(prev => [newObjetivo, ...prev]);
            return newObjetivo;
        } catch (err) {
            console.error('Error creating objetivo:', err);
            throw err;
        }
    }, []);

    const deleteObjetivo = useCallback(async (id: number) => {
        try {
            await objetivosService.delete(id);
            setObjetivos(prev => prev.filter(obj => obj.id_objetivo !== id));
        } catch (err) {
            console.error('Error deleting objetivo:', err);
            throw err;
        }
    }, []);

    useEffect(() => {
        fetchObjetivos();
    }, [fetchObjetivos]);

    return {
        objetivos,
        isLoading,
        error,
        createObjetivo,
        deleteObjetivo,
        refetch: fetchObjetivos
    };
}

// ============================================================================
// HOOK: useObjetivosAgencia (Historial de objetivos por agencia)
// ============================================================================

export function useObjetivosAgencia(agenciaId: number | null) {
    const [historial, setHistorial] = useState<ObjetivoPerfiles[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHistorial = useCallback(async () => {
        if (!agenciaId) {
            setHistorial([]);
            return;
        }
        
        setIsLoading(true);
        setError(null);
        try {
            const data = await objetivosService.getHistorialByAgencia(agenciaId);
            // El endpoint retorna HistorialAgencia que contiene un array de objetivos
            setHistorial(Array.isArray(data) ? data : (data as any)?.objetivos || []);
        } catch (err) {
            setError('Error al cargar historial de objetivos');
            console.error('Error fetching historial:', err);
            setHistorial([]); // Asegurar que siempre sea un array
        } finally {
            setIsLoading(false);
        }
    }, [agenciaId]);

    useEffect(() => {
        fetchHistorial();
    }, [fetchHistorial]);

    return { 
        historial, 
        isLoading, 
        error, 
        refetch: fetchHistorial 
    };
}

// ============================================================================
// HOOK: useCalendarioEventos (Eventos para el calendario)
// ============================================================================

export function useCalendarioEventos() {
    const [eventos, setEventos] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEventos = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await objetivosService.getCalendarioEventos();
            setEventos(Array.isArray(data) ? data : []);
            return data; // Retornar datos para permitir await
        } catch (err) {
            setError('Error al cargar eventos del calendario');
            console.error('Error fetching calendario eventos:', err);
            setEventos([]); // Asegurar que siempre sea un array
            throw err; // Re-throw para que Promise.all pueda manejarlo
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchEventos();
    }, [fetchEventos]);

    return { 
        eventos, 
        isLoading, 
        error, 
        refetch: fetchEventos 
    };
}
