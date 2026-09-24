/**
 * Benefit Repository
 * Manages reward catalog (gifts, donations, experiences) and stock availability.
 * 
 * Rules:
 * - Canonical collection: benefits
 * - Remote-first writes;
 * - When Firebase is configured and collection is empty, returns [] (NEVER fallback to mock).
 */

import type { Benefit } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const benefitRepository = {
  async getAll(): Promise<Benefit[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'benefits'));
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Benefit));
        localStore.data.benefits = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'benefits', auth?.currentUser);
      }
    }
    return [...localStore.data.benefits];
  },

  async getActive(): Promise<Benefit[]> {
    const all = await this.getAll();
    return all.filter((b) => b.active);
  },

  async getById(id: string): Promise<Benefit | null> {
    const all = await this.getAll();
    return all.find((b) => b.id === id) || null;
  },

  async create(benefit: Omit<Benefit, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<Benefit> {
    const id = `ben-${Date.now()}`;
    const now = new Date().toISOString();
    const { id: _ignoredId, ...payload } = benefit as any;

    const firestorePayload = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('benefits', id, firestorePayload, 'set');

    const newBenefit: Benefit = {
      id,
      ...firestorePayload,
    };

    localStore.data.benefits.unshift(newBenefit);
    localStore.save();

    return newBenefit;
  },

  async update(id: string, updates: Partial<Benefit>): Promise<Benefit> {
    const index = localStore.data.benefits.findIndex((b) => b.id === id);
    const existing = index >= 0 ? localStore.data.benefits[index] : null;

    if (!existing && !isFirebaseConfigured) {
      throw new Error(`Benefício com ID '${id}' não encontrado.`);
    }

    const { id: _ignoredId, ...payloadUpdates } = updates as any;
    const now = new Date().toISOString();

    const firestorePayload = {
      ...payloadUpdates,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('benefits', id, firestorePayload, 'update');

    const updated: Benefit = {
      ...(existing || {
        id,
        title: '',
        description: '',
        category: 'gift',
        pointsRequired: 100,
        stock: null,
        active: true,
        createdAt: now,
        updatedAt: '',
      }),
      ...firestorePayload,
      id,
    };

    if (index >= 0) {
      localStore.data.benefits[index] = updated;
    } else {
      localStore.data.benefits.unshift(updated);
    }
    localStore.save();

    return updated;
  },

  async toggleActive(id: string, active: boolean): Promise<Benefit> {
    return this.update(id, { active });
  },
};
