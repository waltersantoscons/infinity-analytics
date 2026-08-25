/**
 * ============================================================================
 * CONFIG.JS — Configuração central da aplicação
 * ============================================================================
 * Este é o ÚNICO arquivo que a maioria das pessoas precisa editar para
 * conectar o dashboard à própria API do Infinity Analytics (Google Apps
 * Script publicado a partir da planilha).
 * ============================================================================
 */

/**
 * URL da API publicada pelo Google Apps Script (termina em "/exec").
 * Veja docs/GUIA_DE_INSTALACAO.md para o passo a passo de como gerar essa URL.
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzPmpmwb76C1mdTTaGJKEzQ45DchJFE9a-HAmKX4xa45lcXhuEb7Aq2B44XDckzCdi3GQ/exec';

/** Intervalo de sincronização automática, em milissegundos (60000 = 1 minuto). */
const INTERVALO_SINCRONIZACAO_MS = 60000;

/**
 * Tempo de vida do cache local (sessionStorage), em milissegundos.
 * Requisições feitas dentro dessa janela reaproveitam a última resposta
 * em vez de chamar a API de novo.
 */
const CACHE_TTL_MS = 45000;

/** Tentativas automáticas em caso de falha de rede, com backoff exponencial. */
const MAX_TENTATIVAS_FETCH = 3;
const ESPERA_BASE_RETRY_MS = 800;

window.APP_CONFIG = {
  API_BASE_URL, INTERVALO_SINCRONIZACAO_MS,
  CACHE_TTL_MS, MAX_TENTATIVAS_FETCH, ESPERA_BASE_RETRY_MS
};
