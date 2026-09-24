/**
 * Redemption Repository
 * Provides aggregate metrics of reward claims requested by participants.
 * Admin does not manually forge redemption records.
 * 
 * Rules:
 * - When Firebase is configured, strictly reads from Firestore. If empty, returns [].
 */

import type { RedemptionRecord } from '../types';
import { localStore } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export interface RedemptionAggregateMetrics {
  totalRedemptions: number;
  totalPointsSpent: number;
  mostPopularBenefit: {
    benefitId: string;
    benefitTitle: string;
    count: number;
  } | null;
}

export const redemptionRepository = {
  async getAll(): Promise<RedemptionRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'redemptions'));
        const remoteList = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            benefitId: data.benefitId,
            benefitTitle: data.benefitTitle || data.description || 'Recompensa',
            date: data.date,
            pointsSpent: Number(data.pointsSpent) || 0,
            reaisValue: Number(data.reaisValue) || 0,
            description: data.description,
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || 'concluido',
            demonstrative: data.demonstrative,
          } as RedemptionRecord;
        });
        localStore.data.redemptions = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'redemptions', auth?.currentUser);
      }
    }
    return [...localStore.data.redemptions];
  },

  async getAggregates(): Promise<RedemptionAggregateMetrics> {
    const records = await this.getAll();
    const totalRedemptions = records.length;
    const totalPointsSpent = records.reduce((acc, curr) => acc + (curr.pointsSpent || 0), 0);

    const countsByBenefit: Record<string, { title: string; count: number }> = {};
    for (const r of records) {
      const bId = r.benefitId || 'default-benefit';
      const bTitle = r.benefitTitle || 'Recompensa';
      if (!countsByBenefit[bId]) {
        countsByBenefit[bId] = { title: bTitle, count: 0 };
      }
      countsByBenefit[bId].count++;
    }

    let mostPopularBenefit: RedemptionAggregateMetrics['mostPopularBenefit'] = null;
    let maxCount = 0;
    for (const [benefitId, info] of Object.entries(countsByBenefit)) {
      if (info.count > maxCount) {
        maxCount = info.count;
        mostPopularBenefit = {
          benefitId,
          benefitTitle: info.title,
          count: info.count,
        };
      }
    }

    return {
      totalRedemptions,
      totalPointsSpent,
      mostPopularBenefit,
    };
  },
};
