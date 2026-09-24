/**
 * Impact Service
 * Aggregates all environmental and operational indicators DERIVED STRICTLY
 * from existing recyclingRecords and materials configuration.
 * Never stores arbitrary pre-calculated totals in the database.
 * 
 * Invariants:
 * - Respects historical records: Reads record.co2eAvoidedKg from each record.
 * - Respects material categories: pet and aluminio.
 */

import { recyclingRepository } from '../repositories/recyclingRepository';
import { materialRepository } from '../repositories/materialRepository';
import { campaignRepository } from '../repositories/campaignRepository';
import { benefitRepository } from '../repositories/benefitRepository';
import { eventRepository } from '../repositories/eventRepository';
import type { AggregatedImpact, Material } from '../types';

export interface DashboardMetrics {
  totalRecords: number;
  totalContainers: number;
  totalCO2eKg: number;
  uniqueParticipants: number;
  totalPointsGranted: number;
  activeCampaignsCount: number;
  activeBenefitsCount: number;
  upcomingEventsCount: number;
}

export const impactService = {
  /**
   * Computes high-level dashboard metrics dynamically from raw transactional records
   */
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [records, materials, campaigns, benefits, events] = await Promise.all([
      recyclingRepository.getAll(),
      materialRepository.getAll(),
      campaignRepository.getActive(),
      benefitRepository.getActive(),
      eventRepository.getAll(),
    ]);

    const materialMap = new Map<string, Material>();
    materials.forEach((m) => materialMap.set(m.id, m));

    let totalContainers = 0;
    let totalPointsGranted = 0;
    let totalCO2eKg = 0;
    const participantSet = new Set<string>();

    for (const record of records) {
      totalContainers += record.quantity || 0;
      totalPointsGranted += record.pointsEarned || 0;
      if (record.userId) {
        participantSet.add(record.userId);
      }

      // Prioritize historical co2eAvoidedKg saved with the transaction
      if (record.co2eAvoidedKg !== undefined && record.co2eAvoidedKg !== null) {
        totalCO2eKg += Number(record.co2eAvoidedKg);
      } else {
        const mat = materialMap.get(record.materialId);
        const fallbackFactor = (mat?.category === 'aluminio' || record.materialCategory === 'aluminio' || record.materialId === 'lata_aluminio') ? 0.22 : 0.18;
        const factor = mat?.co2eFactor || fallbackFactor;
        totalCO2eKg += record.quantity * factor;
      }
    }

    const today = new Date().toISOString().split('T')[0];
    const upcomingEventsCount = events.filter((e) => e.active && e.date >= today).length;

    return {
      totalRecords: records.length,
      totalContainers,
      totalCO2eKg: Number(totalCO2eKg.toFixed(2)),
      uniqueParticipants: participantSet.size,
      totalPointsGranted,
      activeCampaignsCount: campaigns.length,
      activeBenefitsCount: benefits.length,
      upcomingEventsCount,
    };
  },

  /**
   * Computes complete general impact breakdown by material category and monthly timeline
   */
  async getGeneralImpact(): Promise<AggregatedImpact> {
    const [records, materials] = await Promise.all([
      recyclingRepository.getAll(),
      materialRepository.getAll(),
    ]);

    const materialMap = new Map<string, Material>();
    materials.forEach((m) => materialMap.set(m.id, m));

    let totalContainers = 0;
    let totalPoints = 0;
    let totalCO2eKg = 0;
    const participantSet = new Set<string>();

    // By material breakdown
    const breakdownMap = new Map<
      string,
      { materialName: string; quantity: number; points: number; co2eKg: number }
    >();

    // By monthly timeline
    const monthlyMap = new Map<
      string,
      { monthLabel: string; quantity: number; co2eKg: number; points: number; sortKey: string }
    >();

    for (const record of records) {
      const qty = record.quantity || 0;
      const pts = record.pointsEarned || 0;
      totalContainers += qty;
      totalPoints += pts;

      if (record.userId) {
        participantSet.add(record.userId);
      }

      const mat = materialMap.get(record.materialId);
      const fallbackFactor = (mat?.category === 'aluminio' || record.materialCategory === 'aluminio' || record.materialId === 'lata_aluminio') ? 0.22 : 0.18;
      const co2e =
        record.co2eAvoidedKg !== undefined && record.co2eAvoidedKg !== null
          ? Number(record.co2eAvoidedKg)
          : qty * (mat?.co2eFactor || fallbackFactor);

      totalCO2eKg += co2e;

      // Material breakdown
      const matId = record.materialId;
      const matName = record.materialName || mat?.name || (matId === 'pet_2l' ? 'Garrafa PET 2 L' : 'Lata de Alumínio');
      const existingMat = breakdownMap.get(matId) || {
        materialName: matName,
        quantity: 0,
        points: 0,
        co2eKg: 0,
      };
      existingMat.quantity += qty;
      existingMat.points += pts;
      existingMat.co2eKg += co2e;
      breakdownMap.set(matId, existingMat);

      // Month grouping
      const dateStr = record.date || record.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0];
      const [yearStr, monthStr] = dateStr.split('-');
      const sortKey = `${yearStr}-${monthStr}`;

      const dateObj = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, 1);
      const monthLabel = dateObj.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });

      const existingMonth = monthlyMap.get(sortKey) || {
        monthLabel,
        quantity: 0,
        co2eKg: 0,
        points: 0,
        sortKey,
      };
      existingMonth.quantity += qty;
      existingMonth.co2eKg += co2e;
      existingMonth.points += pts;
      monthlyMap.set(sortKey, existingMonth);
    }

    const materialsBreakdown = Array.from(breakdownMap.entries()).map(([materialId, data]) => ({
      materialId,
      materialName: data.materialName,
      quantity: data.quantity,
      points: data.points,
      co2eKg: Number(data.co2eKg.toFixed(2)),
    }));

    const monthlyEvolution = Array.from(monthlyMap.values())
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
      .map(({ monthLabel, quantity, co2eKg, points }) => ({
        monthLabel,
        quantity,
        co2eKg: Number(co2eKg.toFixed(2)),
        points,
      }));

    return {
      totalContainers,
      totalPoints,
      totalCO2eKg: Number(totalCO2eKg.toFixed(2)),
      totalRecyclingSessions: records.length,
      uniqueParticipants: participantSet.size,
      materialsBreakdown,
      monthlyEvolution,
    };
  },
};
