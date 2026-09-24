/**
 * Material Repository
 * Manages recycling materials and unit scoring parameters.
 * Historical records are never modified when material points are updated.
 * 
 * Rules:
 * - Only 'pet_2l' and 'lata_aluminio' initially.
 * - Deletion of materials is disallowed; only active=false toggle.
 * - Remote-first writes; no silent mock fallback.
 */

import type { Material } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const materialRepository = {
  async getAll(): Promise<Material[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'materials'));
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Material));
        localStore.data.materials = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'materials', auth?.currentUser);
      }
    }
    return [...localStore.data.materials];
  },

  async getActive(): Promise<Material[]> {
    const all = await this.getAll();
    return all.filter((m) => m.active);
  },

  async getById(id: string): Promise<Material | null> {
    const all = await this.getAll();
    return all.find((m) => m.id === id) || null;
  },

  async create(material: Omit<Material, 'id'>): Promise<Material> {
    const id = material.category === 'aluminio' ? 'lata_aluminio' : 'pet_2l';
    const newMaterial: Material = {
      id,
      ...material,
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('materials', id, newMaterial, 'set');

    localStore.data.materials.push(newMaterial);
    localStore.save();

    return newMaterial;
  },

  async update(id: string, updates: Partial<Material>): Promise<Material> {
    const index = localStore.data.materials.findIndex((m) => m.id === id);
    const existing = index >= 0 ? localStore.data.materials[index] : null;

    const updated: Material = {
      ...(existing || { id, name: id, category: 'pet', unit: 'unidade', pointsPerUnit: 2, co2eFactor: 0.18, active: true }),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('materials', id, updated, 'update');

    if (index >= 0) {
      localStore.data.materials[index] = updated;
    } else {
      localStore.data.materials.push(updated);
    }
    localStore.save();

    return updated;
  },

  async toggleActive(id: string, active: boolean): Promise<Material> {
    return this.update(id, { active });
  },
};
