/**
 * Campaign Repository
 * Manages promotional recycling campaigns (multipliers and quantity bonuses).
 * 
 * Rules:
 * - Remote-first writes;
 * - No silent fallback to mock seeds when Firebase is active.
 */

import type { Campaign } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { isCampaignCurrentlyActive } from '../utils/calculations';

export const campaignRepository = {
  async getAll(): Promise<Campaign[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'campaigns'));
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Campaign));
        localStore.data.campaigns = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'campaigns', auth?.currentUser);
      }
    }
    return [...localStore.data.campaigns];
  },

  async getActive(): Promise<Campaign[]> {
    const all = await this.getAll();
    return all.filter((c) => isCampaignCurrentlyActive(c));
  },

  async getById(id: string): Promise<Campaign | null> {
    const all = await this.getAll();
    return all.find((c) => c.id === id) || null;
  },

  async create(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<Campaign> {
    const id = `camp-${Date.now()}`;
    const now = new Date().toISOString();

    // Separate id from payload so DocumentReference defines document ID
    const { id: _ignoredId, ...payload } = campaign as any;

    const firestorePayload = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('campaigns', id, firestorePayload, 'set');

    const newCampaign: Campaign = {
      id,
      ...firestorePayload,
    };

    localStore.data.campaigns.unshift(newCampaign);
    localStore.save();

    return newCampaign;
  },

  async update(id: string, updates: Partial<Campaign>): Promise<Campaign> {
    const index = localStore.data.campaigns.findIndex((c) => c.id === id);
    const existing = index >= 0 ? localStore.data.campaigns[index] : null;

    if (!existing && !isFirebaseConfigured) {
      throw new Error(`Campanha com ID '${id}' não encontrada.`);
    }

    const { id: _ignoredId, ...payloadUpdates } = updates as any;
    const now = new Date().toISOString();

    const firestorePayload = {
      ...payloadUpdates,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('campaigns', id, firestorePayload, 'update');

    const updated: Campaign = {
      ...(existing || {
        id,
        title: '',
        description: '',
        type: 'multiplier',
        materialId: 'pet_2l',
        startDate: '',
        endDate: '',
        active: true,
        createdAt: now,
        createdBy: '',
      }),
      ...firestorePayload,
      id,
    };

    if (index >= 0) {
      localStore.data.campaigns[index] = updated;
    } else {
      localStore.data.campaigns.unshift(updated);
    }
    localStore.save();

    return updated;
  },

  async toggleActive(id: string, active: boolean): Promise<Campaign> {
    return this.update(id, { active });
  },

  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'campaigns', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `campaigns/${id}`, auth?.currentUser);
      }
    }
    localStore.data.campaigns = localStore.data.campaigns.filter((c) => c.id !== id);
    localStore.save();
  },
};
