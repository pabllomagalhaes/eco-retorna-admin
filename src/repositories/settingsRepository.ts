/**
 * Settings Repository
 * Fetches and manages canonical settings from Firestore (settings/general)
 * or local default fallback.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import type { GeneralSettings } from '../types';

export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  pointValueBRL: 0.125,
  pointsPerBottle: 2,
  pointsPerCan: 2,
  initialBonusPoints: 44,
  environmentalFactors: {
    co2eKg: {
      pet: 0.18,
      aluminio: 0.22,
    },
    disclaimer: '*Os valores ambientais apresentados são estimativas baseadas no tipo e na quantidade de materiais reciclados.',
  },
};

export const settingsRepository = {
  /**
   * Retrieves canonical general settings from settings/general
   */
  async getGeneralSettings(): Promise<GeneralSettings> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'general');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as Partial<GeneralSettings>;
          return {
            pointValueBRL: data.pointValueBRL ?? DEFAULT_GENERAL_SETTINGS.pointValueBRL,
            pointsPerBottle: data.pointsPerBottle ?? DEFAULT_GENERAL_SETTINGS.pointsPerBottle,
            pointsPerCan: data.pointsPerCan ?? DEFAULT_GENERAL_SETTINGS.pointsPerCan,
            initialBonusPoints: data.initialBonusPoints ?? DEFAULT_GENERAL_SETTINGS.initialBonusPoints,
            environmentalFactors: {
              co2eKg: {
                pet: data.environmentalFactors?.co2eKg?.pet ?? DEFAULT_GENERAL_SETTINGS.environmentalFactors.co2eKg.pet,
                aluminio: data.environmentalFactors?.co2eKg?.aluminio ?? DEFAULT_GENERAL_SETTINGS.environmentalFactors.co2eKg.aluminio,
              },
              disclaimer: data.environmentalFactors?.disclaimer ?? DEFAULT_GENERAL_SETTINGS.environmentalFactors.disclaimer,
            },
            updatedAt: data.updatedAt,
          };
        }
        // If doc does not exist yet in configured Firestore, return default canonical settings
        return DEFAULT_GENERAL_SETTINGS;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, 'settings/general', auth?.currentUser);
      }
    }
    return DEFAULT_GENERAL_SETTINGS;
  },

  /**
   * Updates general settings in Firestore
   */
  async updateGeneralSettings(settings: Partial<GeneralSettings>): Promise<GeneralSettings> {
    const current = await this.getGeneralSettings();
    const updated: GeneralSettings = {
      ...current,
      ...settings,
      environmentalFactors: {
        ...current.environmentalFactors,
        ...(settings.environmentalFactors || {}),
        co2eKg: {
          ...current.environmentalFactors.co2eKg,
          ...(settings.environmentalFactors?.co2eKg || {}),
        },
      },
      updatedAt: new Date().toISOString(),
    };

    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'settings', 'general');
        await setDoc(docRef, updated, { merge: true });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, 'settings/general', auth?.currentUser);
      }
    }

    return updated;
  },
};
