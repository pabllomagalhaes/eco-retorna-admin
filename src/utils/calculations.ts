/**
 * Business Calculation Engine
 * Handles point calculations, campaign multiplier/quantity bonus evaluations,
 * and environmental impact estimates.
 */

import type { Material, Campaign, CalculationItemResult } from '../types';
import { DEFAULT_GENERAL_SETTINGS } from '../repositories/settingsRepository';

/**
 * Checks if a campaign is currently active based on dates and active flag
 */
export function isCampaignCurrentlyActive(campaign: Campaign, targetDate: Date = new Date()): boolean {
  if (!campaign.active) return false;

  const target = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()).getTime();
  const [startY, startM, startD] = campaign.startDate.split('-').map(Number);
  const [endY, endM, endD] = campaign.endDate.split('-').map(Number);

  const start = new Date(startY, startM - 1, startD).getTime();
  const end = new Date(endY, endM - 1, endD, 23, 59, 59).getTime();

  return target >= start && target <= end;
}

/**
 * Finds the best active campaign for a given material
 */
export function getActiveCampaignForMaterial(
  materialId: string,
  campaigns: Campaign[],
  targetDate: Date = new Date()
): Campaign | null {
  const matches = campaigns.filter(
    (c) => c.materialId === materialId && isCampaignCurrentlyActive(c, targetDate)
  );

  if (matches.length === 0) return null;
  // Return the first active campaign found (or prioritize multiplier)
  return matches[0];
}

/**
 * Calculates points and campaign bonus for a specific item and quantity
 */
export function calculateItemPoints(
  material: Material,
  quantity: number,
  campaigns: Campaign[],
  targetDate: Date = new Date(),
  pointValueBRL: number = DEFAULT_GENERAL_SETTINGS.pointValueBRL
): CalculationItemResult {
  const basePointsPerUnit = material.pointsPerUnit;
  const totalBasePoints = quantity * basePointsPerUnit;
  const applicableCampaign = getActiveCampaignForMaterial(material.id, campaigns, targetDate);

  let campaignBonusPoints = 0;
  let ruleExplanation = `${quantity} un × ${basePointsPerUnit} pts = ${totalBasePoints} pts base`;

  if (applicableCampaign && quantity > 0) {
    if (applicableCampaign.type === 'multiplier' && applicableCampaign.multiplier) {
      const multiplier = applicableCampaign.multiplier;
      const totalMultiplied = totalBasePoints * multiplier;
      campaignBonusPoints = totalMultiplied - totalBasePoints;
      ruleExplanation = `${quantity} un × ${basePointsPerUnit} pts × ${multiplier}x (${applicableCampaign.title}) = ${totalMultiplied} pts`;
    } else if (applicableCampaign.type === 'quantity_bonus' && applicableCampaign.minimumQuantity && applicableCampaign.bonusPoints) {
      if (quantity >= applicableCampaign.minimumQuantity) {
        // Multiples of threshold
        const tiers = Math.floor(quantity / applicableCampaign.minimumQuantity);
        campaignBonusPoints = tiers * applicableCampaign.bonusPoints;
        ruleExplanation = `${totalBasePoints} pts base + ${campaignBonusPoints} pts bônus (${applicableCampaign.title}: ${tiers}x bônus)`;
      } else {
        ruleExplanation = `${totalBasePoints} pts base (campanha '${applicableCampaign.title}' requer mín. ${applicableCampaign.minimumQuantity} un)`;
      }
    }
  }

  const totalPointsEarned = totalBasePoints + campaignBonusPoints;
  const reaisEquivalent = Number((totalPointsEarned * pointValueBRL).toFixed(2));
  const co2eAvoidedKg = Number((quantity * (material.co2eFactor || 0.18)).toFixed(2));

  return {
    material,
    quantity,
    basePointsPerUnit,
    totalBasePoints,
    applicableCampaign,
    campaignBonusPoints,
    totalPointsEarned,
    reaisEquivalent,
    co2eAvoidedKg,
    ruleExplanation,
  };
}

/**
 * Formats points with suffix
 */
export function formatPoints(points: number): string {
  return `${new Intl.NumberFormat('pt-BR').format(points)} pts`;
}

/**
 * Formats CO2e in kg or tons
 */
export function formatCO2e(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} t CO₂e`;
  }
  return `${kg.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} kg CO₂e`;
}

/**
 * Formats dates into PT-BR format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return new Date(dateString).toLocaleDateString('pt-BR');
}
