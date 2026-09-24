/**
 * Campaign Service
 * Handles business validation for creating and editing marketing and incentive campaigns.
 */

import { campaignRepository } from '../repositories/campaignRepository';
import { materialRepository } from '../repositories/materialRepository';
import type { Campaign } from '../types';

export const campaignService = {
  async getAllCampaigns(): Promise<Campaign[]> {
    return campaignRepository.getAll();
  },

  async getActiveCampaigns(): Promise<Campaign[]> {
    return campaignRepository.getActive();
  },

  async saveCampaign(campaignData: {
    id?: string;
    title: string;
    description: string;
    type: 'multiplier' | 'quantity_bonus';
    materialId: string;
    multiplier?: number;
    minimumQuantity?: number;
    bonusPoints?: number;
    startDate: string;
    endDate: string;
    active: boolean;
    createdBy: string;
  }): Promise<Campaign> {
    if (!campaignData.title.trim()) {
      throw new Error('O título da campanha é obrigatório.');
    }
    if (!campaignData.materialId) {
      throw new Error('Selecione o material associado à campanha.');
    }
    if (!campaignData.startDate || !campaignData.endDate) {
      throw new Error('Defina a data inicial e final do período.');
    }
    if (new Date(campaignData.endDate) < new Date(campaignData.startDate)) {
      throw new Error('A data final não pode ser anterior à data inicial.');
    }

    if (campaignData.type === 'multiplier') {
      if (!campaignData.multiplier || campaignData.multiplier <= 1) {
        throw new Error('O multiplicador deve ser maior que 1 (ex: 2 para pontos em dobro).');
      }
    } else if (campaignData.type === 'quantity_bonus') {
      if (!campaignData.minimumQuantity || campaignData.minimumQuantity <= 0) {
        throw new Error('Defina a quantidade mínima para o bônus.');
      }
      if (!campaignData.bonusPoints || campaignData.bonusPoints <= 0) {
        throw new Error('Defina os pontos de bônus concedidos.');
      }
    }

    if (campaignData.id) {
      return campaignRepository.update(campaignData.id, campaignData);
    } else {
      return campaignRepository.create({
        ...campaignData,
        createdAt: new Date().toISOString(),
      });
    }
  },

  async toggleStatus(id: string, active: boolean): Promise<Campaign> {
    return campaignRepository.toggleActive(id, active);
  },
};
