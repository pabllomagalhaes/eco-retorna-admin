/**
 * Recycling Service
 * Coordinates participant lookup, real-time campaign bonus calculations,
 * and immutable creation of recyclingRecords matching the exact canonical schema.
 * 
 * Rules:
 * - Documents in recyclingRecords/{id} must be directly consumable by EcoRetorna Participante:
 *   userId, date (YYYY-MM-DD), materialId, materialName, materialCategory, quantity,
 *   basePoints, campaignBonus, pointsEarned, reaisEquivalent, co2eAvoidedKg,
 *   collectionPointName, campaignId, registeredByAdminUid, createdAt (ISO).
 * - reaisEquivalent = pointsEarned * pointValueBRL (from settings/general).
 * - co2eAvoidedKg = quantity * co2eFactor (from material/official factors).
 * - Remote write failure MUST propagate and block any success message.
 */

import { userRepository } from '../repositories/userRepository';
import { materialRepository } from '../repositories/materialRepository';
import { campaignRepository } from '../repositories/campaignRepository';
import { recyclingRepository } from '../repositories/recyclingRepository';
import { settingsService } from './settingsService';
import { calculateItemPoints } from '../utils/calculations';
import type {
  UserProfile,
  Material,
  CalculationItemResult,
  RecyclingCalculationSummary,
  RecyclingRecord,
} from '../types';

export const recyclingService = {
  /**
   * Looks up a participant by email, strictly enforcing privacy boundaries
   */
  async findParticipant(email: string): Promise<UserProfile> {
    if (!email || !email.includes('@')) {
      throw new Error('Informe um e-mail válido para busca.');
    }

    const participant = await userRepository.findParticipantByEmail(email);
    if (!participant) {
      throw new Error(`Nenhum participante encontrado com o e-mail: ${email}`);
    }

    if (!participant.active) {
      throw new Error('Esta conta de participante encontra-se desativada no sistema.');
    }

    return participant;
  },

  /**
   * Prepares the real-time calculation breakdown for a participant with selected items
   */
  async calculateSummary(
    participant: UserProfile,
    selections: { materialId: string; quantity: number }[],
    collectionPointName = 'EcoPonto Praça da Sustentabilidade'
  ): Promise<RecyclingCalculationSummary> {
    const [materials, activeCampaigns, pointValueBRL, envFactors] = await Promise.all([
      materialRepository.getAll(),
      campaignRepository.getActive(),
      settingsService.getPointValueBRL(),
      settingsService.getEnvironmentalFactors(),
    ]);

    const items: CalculationItemResult[] = [];
    let totalQuantity = 0;
    let totalBasePoints = 0;
    let totalCampaignBonus = 0;
    let grandTotalPoints = 0;
    let totalReaisEquivalent = 0;
    let estimatedCO2eKg = 0;

    for (const sel of selections) {
      if (sel.quantity <= 0) continue;
      const material = materials.find((m) => m.id === sel.materialId);
      if (!material) continue;

      const calc = calculateItemPoints(material, sel.quantity, activeCampaigns, new Date(), pointValueBRL);
      const reaisEquivalent = Number((calc.totalPointsEarned * pointValueBRL).toFixed(2));
      const defaultFactor = material.category === 'aluminio' ? envFactors.co2eKg.aluminio : envFactors.co2eKg.pet;
      const factor = material.co2eFactor ?? defaultFactor;
      const co2eAvoidedKg = Number((sel.quantity * factor).toFixed(2));

      items.push({
        ...calc,
        reaisEquivalent,
        co2eAvoidedKg,
      });

      totalQuantity += sel.quantity;
      totalBasePoints += calc.totalBasePoints;
      totalCampaignBonus += calc.campaignBonusPoints;
      grandTotalPoints += calc.totalPointsEarned;
      totalReaisEquivalent += reaisEquivalent;
      estimatedCO2eKg += co2eAvoidedKg;
    }

    return {
      participant,
      items,
      totalQuantity,
      totalBasePoints,
      totalCampaignBonus,
      grandTotalPoints,
      totalReaisEquivalent: Number(totalReaisEquivalent.toFixed(2)),
      estimatedCO2eKg: Number(estimatedCO2eKg.toFixed(2)),
      collectionPointName,
    };
  },

  /**
   * Commits the recycling batch to `recyclingRecords` using the exact canonical schema.
   * Remote write failure propagates and prevents false success states.
   */
  async submitRecycling(
    summary: RecyclingCalculationSummary,
    adminUid: string
  ): Promise<RecyclingRecord[]> {
    if (!summary.items || summary.items.length === 0) {
      throw new Error('Nenhum material selecionado para registro.');
    }

    const todayDate = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const fullIsoDate = new Date().toISOString();

    const recordsToCreate: Omit<RecyclingRecord, 'id'>[] = summary.items.map((item) => ({
      userId: summary.participant.id,
      date: todayDate,
      materialId: item.material.id,
      materialName: item.material.name,
      materialCategory: item.material.category,
      quantity: item.quantity,
      basePoints: item.totalBasePoints,
      campaignBonus: item.campaignBonusPoints,
      pointsEarned: item.totalPointsEarned,
      reaisEquivalent: item.reaisEquivalent,
      co2eAvoidedKg: item.co2eAvoidedKg,
      collectionPointName: summary.collectionPointName || 'EcoPonto Praça da Sustentabilidade',
      campaignId: item.applicableCampaign ? item.applicableCampaign.id : null,
      registeredByAdminUid: adminUid,
      createdAt: fullIsoDate,
    }));

    // Must await Firestore write and throw if it fails
    return await recyclingRepository.createBatch(recordsToCreate);
  },
};
