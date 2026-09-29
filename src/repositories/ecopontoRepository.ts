/**
 * Ecoponto (Collection Points) Repository
 * Manages drop-off points, geolocation, and opening hours for Postos & Mapa.
 * Aligned with EcoRetorna Participante schema:
 * id, name, address, neighborhood, city, operatingHours, acceptedMaterials,
 * latitude, longitude, description, active, notes.
 * 
 * Rules:
 * - Remote-first writes;
 * - No silent fallback when Firebase is active.
 */

import type { CollectionPoint } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const ecopontoRepository = {
  async getAll(): Promise<CollectionPoint[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'collectionPoints'));
        const remoteList = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name || '',
            address: data.address || '',
            neighborhood: data.neighborhood || '',
            city: data.city || 'Fraiburgo - SC',
            operatingHours: data.operatingHours || data.openingHours || '08:00 às 18:00',
            acceptedMaterials: data.acceptedMaterials || ['PET', 'Alumínio'],
            latitude: Number(data.latitude) || 0,
            longitude: Number(data.longitude) || 0,
            description: data.description || '',
            active: Boolean(data.active ?? true),
            notes: data.notes || '',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          } as CollectionPoint;
        });
        localStore.data.collectionPoints = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'collectionPoints', auth?.currentUser);
      }
    }
    return [...localStore.data.collectionPoints];
  },

  async getActive(): Promise<CollectionPoint[]> {
    const all = await this.getAll();
    return all.filter((p) => p.active);
  },

  async getById(id: string): Promise<CollectionPoint | null> {
    const all = await this.getAll();
    return all.find((p) => p.id === id) || null;
  },

  async create(point: Omit<CollectionPoint, 'id' | 'createdAt' | 'updatedAt'> & { createdAt?: string; updatedAt?: string }): Promise<CollectionPoint> {
    const id = `pt_${Date.now()}`;
    const now = new Date().toISOString();
    const { id: _ignoredId, ...payload } = point as any;

    const firestorePayload = {
      ...payload,
      operatingHours: payload.operatingHours || payload.openingHours || '08:00 às 18:00',
      city: payload.city || 'Fraiburgo - SC',
      description: payload.description || '',
      notes: payload.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('collectionPoints', id, firestorePayload, 'set');

    const newPoint: CollectionPoint = {
      id,
      ...firestorePayload,
    };

    localStore.data.collectionPoints.unshift(newPoint);
    localStore.save();

    return newPoint;
  },

  async update(id: string, updates: Partial<CollectionPoint>): Promise<CollectionPoint> {
    const index = localStore.data.collectionPoints.findIndex((p) => p.id === id);
    const existing = index >= 0 ? localStore.data.collectionPoints[index] : null;

    if (!existing && !isFirebaseConfigured) {
      throw new Error(`Ecoponto com ID '${id}' não encontrado.`);
    }

    const { id: _ignoredId, ...payloadUpdates } = updates as any;
    const now = new Date().toISOString();

    const firestorePayload = {
      ...payloadUpdates,
      updatedAt: now,
    };

    // Remote-first
    await writeToFirestoreFirst('collectionPoints', id, firestorePayload, 'update');

    const updated: CollectionPoint = {
      ...(existing || {
        id,
        name: '',
        address: '',
        neighborhood: '',
        city: 'Fraiburgo - SC',
        operatingHours: '08:00 às 18:00',
        acceptedMaterials: ['PET', 'Alumínio'],
        latitude: 0,
        longitude: 0,
        description: '',
        active: true,
        notes: '',
        createdAt: now,
      }),
      ...firestorePayload,
      operatingHours: payloadUpdates.operatingHours || payloadUpdates.openingHours || existing?.operatingHours || '08:00 às 18:00',
      id,
    };

    if (index >= 0) {
      localStore.data.collectionPoints[index] = updated;
    } else {
      localStore.data.collectionPoints.unshift(updated);
    }
    localStore.save();

    return updated;
  },

  async toggleActive(id: string, active: boolean): Promise<CollectionPoint> {
    return this.update(id, { active });
  },

  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'collectionPoints', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `collectionPoints/${id}`, auth?.currentUser);
      }
    }
    localStore.data.collectionPoints = localStore.data.collectionPoints.filter((p) => p.id !== id);
    localStore.save();
  },
};
