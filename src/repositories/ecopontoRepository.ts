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
            city: data.city || 'Curitiba - PR',
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

  async create(point: Omit<CollectionPoint, 'id'>): Promise<CollectionPoint> {
    const id = `pt_${Date.now()}`;
    const newPoint: CollectionPoint = {
      id,
      ...point,
      operatingHours: point.operatingHours || point.openingHours || '08:00 às 18:00',
      city: point.city || 'Curitiba - PR',
      description: point.description || '',
      notes: point.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('collectionPoints', id, newPoint, 'set');

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

    const updated: CollectionPoint = {
      ...(existing || {
        id,
        name: '',
        address: '',
        neighborhood: '',
        city: 'Curitiba - PR',
        operatingHours: '08:00 às 18:00',
        acceptedMaterials: ['PET', 'Alumínio'],
        latitude: -25.4411,
        longitude: -49.2785,
        description: '',
        active: true,
        notes: '',
        createdAt: '',
      }),
      ...updates,
      operatingHours: updates.operatingHours || updates.openingHours || existing?.operatingHours || '08:00 às 18:00',
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('collectionPoints', id, updated, 'update');

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
