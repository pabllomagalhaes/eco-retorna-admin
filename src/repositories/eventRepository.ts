/**
 * Event Repository
 * Manages community and recycling events shown in Eventos & Alertas.
 * Supports both 'evento' and 'alerta' types with optional severity levels.
 * 
 * Rules:
 * - Remote-first writes;
 * - No silent fallback when Firebase is active.
 */

import type { EventItem } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const eventRepository = {
  async getAll(): Promise<EventItem[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'events'));
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as EventItem));
        localStore.data.events = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'events', auth?.currentUser);
      }
    }
    return [...localStore.data.events];
  },

  async getActive(): Promise<EventItem[]> {
    const all = await this.getAll();
    return all.filter((e) => e.active);
  },

  async getById(id: string): Promise<EventItem | null> {
    const all = await this.getAll();
    return all.find((e) => e.id === id) || null;
  },

  async create(eventItem: Omit<EventItem, 'id'>): Promise<EventItem> {
    const id = `ev-${Date.now()}`;
    const newEvent: EventItem = {
      id,
      ...eventItem,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('events', id, newEvent, 'set');

    localStore.data.events.unshift(newEvent);
    localStore.save();

    return newEvent;
  },

  async update(id: string, updates: Partial<EventItem>): Promise<EventItem> {
    const index = localStore.data.events.findIndex((e) => e.id === id);
    const existing = index >= 0 ? localStore.data.events[index] : null;

    if (!existing && !isFirebaseConfigured) {
      throw new Error(`Evento com ID '${id}' não encontrado.`);
    }

    const updated: EventItem = {
      ...(existing || { id, title: '', description: '', date: '', time: '', location: '', category: '', type: 'evento', active: true, createdAt: '' }),
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Remote-first
    await writeToFirestoreFirst('events', id, updated, 'update');

    if (index >= 0) {
      localStore.data.events[index] = updated;
    } else {
      localStore.data.events.unshift(updated);
    }
    localStore.save();

    return updated;
  },

  async toggleActive(id: string, active: boolean): Promise<EventItem> {
    return this.update(id, { active });
  },

  async delete(id: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'events', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `events/${id}`, auth?.currentUser);
      }
    }
    localStore.data.events = localStore.data.events.filter((e) => e.id !== id);
    localStore.save();
  },
};
