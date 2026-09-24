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

    const cleanPayload: Omit<Benefit, 'id' | 'createdAt' | 'updatedAt'> = {
      title: data.title.trim(),
      description: data.description.trim(),
      category: data.category,
      pointsRequired: Number(data.pointsRequired),
      stock: data.stock !== null && data.stock !== undefined ? Number(data.stock) : null,
      active: Boolean(data.active),
      ...(data.imageUrl?.trim() ? { imageUrl: data.imageUrl.trim() } : {}),
    };

    if (data.id) {
      return benefitRepository.update(data.id, cleanPayload);
    } else {
      return benefitRepository.create(cleanPayload);
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<Benefit> {
    return benefitRepository.toggleActive(id, active);
  },
};
