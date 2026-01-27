/**
 * Services Index
 * Exportación centralizada de todos los servicios
 */

export { apiClient, tokenManager } from './api.client';
export { distribuidorasService } from './distribuidoras.service';

// Re-export types for convenience
export type {
    GetDistribuidorasParams,
    CreateDistribuidoraData,
    UpdateDistribuidoraData
} from './distribuidoras.service';
