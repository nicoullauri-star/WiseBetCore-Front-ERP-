/**
 * Services Index
 * Exportación centralizada de todos los servicios
 */

export { apiClient, tokenManager } from './api.client';
export { distribuidorasService } from './distribuidoras.service';
export { deportesService } from './deportes.service';
export { objetivosService } from './objetivos.service';

// Re-export types for convenience
export type {
    GetDistribuidorasParams,
    CreateDistribuidoraData,
    UpdateDistribuidoraData
} from './distribuidoras.service';

// Casas Apuestas Exports
export { casasService } from './casas.service';
export type {
    GetCasasParams,
    CreateCasaData,
    UpdateCasaData
} from './casas.service';

export { agenciasService } from './agencias.service';
export type {
    GetAgenciasParams,
    CreateAgenciaData,
    UpdateAgenciaData
} from './agencias.service';

