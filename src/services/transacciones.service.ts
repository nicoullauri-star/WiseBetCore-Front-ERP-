import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PaginatedResponse } from '../types';

// ============================================================================
// TYPES
// ============================================================================

export type TransactionType = 'DEPOSITO' | 'RETIRO';
export type PaymentMethod = 'DEPOSITO' | 'TARJETA' | 'USDT' | 'SKRILL' | 'NETELLER' | 'TRANSFERENCIA';
export type TransactionStatus = 'PENDIENTE' | 'COMPLETADO' | 'RECHAZADO';

export interface Transaccion {
    id_transaccion: number;
    perfil: number;
    perfil_usuario: string;
    tipo_transaccion: TransactionType;
    metodo_pago: PaymentMethod;
    estado: TransactionStatus;
    monto: string; // Backend sends string "100.00"
    referencia: string;
    fecha_transaccion: string;
}

export interface GetTransaccionesParams {
    page?: number;
    page_size?: number;
    tipo?: TransactionType;
    metodo?: PaymentMethod;
    estado?: TransactionStatus;
    perfil?: number;
    created_at__gte?: string; // YYYY-MM-DD
    created_at__lte?: string; // YYYY-MM-DD
    search?: string; // Reference search
    ordering?: string; // e.g. -created_at
}

export interface CreateTransaccionData {
    perfil: number;
    tipo_transaccion: TransactionType;
    metodo_pago: PaymentMethod;
    fecha_transaccion: string;
    estado: TransactionStatus;
    monto: number;
    referencia: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const transaccionesService = {
    /**
     * Obtiene lista de transacciones con filtros y paginación
     */
    async getAll(params?: GetTransaccionesParams): Promise<PaginatedResponse<Transaccion>> {
        // Fallback endpoint if not in centralized config yet
        const endpoint = API_ENDPOINTS.TRANSACCIONES || '/gestion-operativa/transacciones/';
        return await apiClient.get<PaginatedResponse<Transaccion>>(endpoint, {
            params: params as Record<string, string | number | boolean>
        });
    },

    /**
     * Crea una nueva transacción
     */
    async create(data: CreateTransaccionData): Promise<Transaccion> {
        const endpoint = API_ENDPOINTS.TRANSACCIONES || '/gestion-operativa/transacciones/';
        return await apiClient.post<Transaccion>(endpoint, data);
    },

    /**
     * Obtiene una transacción por ID
     */
    async getById(id: number): Promise<Transaccion> {
        const endpoint = API_ENDPOINTS.TRANSACCIONES || '/gestion-operativa/transacciones/';
        return await apiClient.get<Transaccion>(`${endpoint}${id}/`);
    },

    /**
     * Actualiza parcialmente una transacción (ej. cambiar estado)
     */
    async update(id: number, data: Partial<CreateTransaccionData>): Promise<Transaccion> {
        const endpoint = API_ENDPOINTS.TRANSACCIONES || '/gestion-operativa/transacciones/';
        return await apiClient.patch<Transaccion>(`${endpoint}${id}/`, data);
    },

    /**
     * Elimina una transacción
     */
    async delete(id: number): Promise<void> {
        const endpoint = API_ENDPOINTS.TRANSACCIONES || '/gestion-operativa/transacciones/';
        return await apiClient.delete(`${endpoint}${id}/`);
    }
};
