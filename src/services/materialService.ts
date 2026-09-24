/**
 * Material Service
 * Manages material catalog and scoring rules.
 * Crucial invariant: Changes to base points only affect future recycling transactions.
 * Existing historical recyclingRecords remain completely immutable.
 */

import { materialRepository } from '../repositories/materialRepository';
import { recyclingRepository } from '../repositories/recyclingRepository';
import type { Material } from '../types';

export const materialService = {
  async getAllMaterials(): Promise<Material[]> {
    return materialRepository.getAll();
  },

  async getActiveMaterials(): Promise<Material[]> {
    return materialRepository.getActive();
  },

  async updateScoring(id: string, pointsPerUnit: number, co2eFactor?: number): Promise<Material> {
    if (pointsPerUnit <= 0) {
      throw new Error('A pontuação base por unidade deve ser maior que zero.');
    }
    const updates: Partial<Material> = { pointsPerUnit };
    if (co2eFactor !== undefined) {
      if (co2eFactor < 0) {
        throw new Error('O fator de CO₂e não pode ser negativo.');
      }
      updates.co2eFactor = co2eFactor;
    }
    return materialRepository.update(id, updates);
  },

  async saveMaterial(materialData: {
    id?: string;
    name: string;
    category: Material['category'];
    pointsPerUnit: number;
    co2eFactor: number;
    active: boolean;
    description?: string;
  }): Promise<Material> {
    if (!materialData.name.trim()) {
      throw new Error('O nome do material é obrigatório.');
    }
    if (materialData.pointsPerUnit <= 0) {
      throw new Error('A pontuação base deve ser maior que zero.');
    }
    if (materialData.co2eFactor < 0) {
      throw new Error('O fator de CO₂e não pode ser negativo.');
    }

    const cleanPayload: Omit<Material, 'id' | 'updatedAt'> = {
      name: materialData.name.trim(),
      category: materialData.category,
      pointsPerUnit: Number(materialData.pointsPerUnit),
      co2eFactor: Number(materialData.co2eFactor),
      active: Boolean(materialData.active),
      unit: 'unidade',
      ...(materialData.description?.trim() ? { description: materialData.description.trim() } : {}),
    };

    if (materialData.id) {
      return materialRepository.update(materialData.id, cleanPayload);
    } else {
      return materialRepository.create(cleanPayload);
    }
  },

  async deactivateMaterial(id: string): Promise<Material> {
    return materialRepository.toggleActive(id, false);
  },

  async toggleStatus(id: string, active: boolean): Promise<Material> {
    return materialRepository.toggleActive(id, active);
  },

  async hasHistoricalRecords(materialId: string): Promise<boolean> {
    const allRecords = await recyclingRepository.getAll();
    return allRecords.some((r) => r.materialId === materialId);
  },
};
