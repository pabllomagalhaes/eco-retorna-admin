/**
 * Benefit Service
 * Handles reward creation, stock management, and redemption metrics analysis.
 */

import { benefitRepository } from '../repositories/benefitRepository';
import { redemptionRepository, type RedemptionAggregateMetrics } from '../repositories/redemptionRepository';
import type { Benefit, BenefitCategory } from '../types';

export const benefitService = {
  async getAllBenefits(): Promise<Benefit[]> {
    return benefitRepository.getAll();
  },

  async getRedemptionStats(): Promise<RedemptionAggregateMetrics> {
    return redemptionRepository.getAggregates();
  },

  async saveBenefit(data: {
    id?: string;
    title: string;
    description: string;
    category: BenefitCategory;
    pointsRequired: number;
    stock: number | null;
    active: boolean;
    imageUrl?: string;
  }): Promise<Benefit> {
    if (!data.title.trim()) {
      throw new Error('O título do benefício é obrigatório.');
    }
    if (!data.pointsRequired || data.pointsRequired <= 0) {
      throw new Error('Informe a pontuação necessária (maior que zero).');
    }
    if (data.stock !== null && data.stock < 0) {
      throw new Error('O estoque não pode ser negativo.');
    }

    if (data.id) {
      return benefitRepository.update(data.id, data);
    } else {
      return benefitRepository.create({
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<Benefit> {
    return benefitRepository.toggleActive(id, active);
  },
};
