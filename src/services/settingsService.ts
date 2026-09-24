/**
 * Settings Service
 * Centralizes access to system settings, financial conversion (1 pt = R$ 0,125),
 * and official environmental factors (PET: 0.18, Alumínio: 0.22 kg CO2e).
 */

import { settingsRepository, DEFAULT_GENERAL_SETTINGS } from '../repositories/settingsRepository';
import type { GeneralSettings } from '../types';

export const settingsService = {
  /**
   * Retrieves full general settings configuration
   */
  async getGeneralSettings(): Promise<GeneralSettings> {
    return settingsRepository.getGeneralSettings();
  },

  /**
   * Returns canonical point value in BRL (default: 0.125)
   */
  async getPointValueBRL(): Promise<number> {
    const settings = await settingsRepository.getGeneralSettings();
    return settings.pointValueBRL ?? DEFAULT_GENERAL_SETTINGS.pointValueBRL;
  },

  /**
   * Returns official environmental factors
   */
  async getEnvironmentalFactors(): Promise<GeneralSettings['environmentalFactors']> {
    const settings = await settingsRepository.getGeneralSettings();
    return settings.environmentalFactors;
  },

  /**
   * Converts points to Reais equivalent using central pointValueBRL
   */
  async convertPointsToReais(points: number): Promise<number> {
    const pointValue = await this.getPointValueBRL();
    return Number((points * pointValue).toFixed(2));
  },

  /**
   * Synchronous helper for UI formatting (fallback to canonical 0.125)
   */
  calculateReaisSync(points: number, pointValue = DEFAULT_GENERAL_SETTINGS.pointValueBRL): number {
    return Number((points * pointValue).toFixed(2));
  },

  /**
   * Formats BRL currency in pt-BR
   */
  formatBRL(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
};
