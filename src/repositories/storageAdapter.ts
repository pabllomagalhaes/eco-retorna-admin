/**
 * Unified Storage Adapter
 * Bridges Firestore and local memory persistence.
 * 
 * CRITICAL ARCHITECTURE RULE:
 * When Firebase is configured:
 * 1. Execute Firestore operation FIRST;
 * 2. Await remote confirmation;
 * 3. Only on success, update local state/cache;
 * 4. On failure, throw formatted error and NEVER update local state;
 * 5. NEVER silently fallback to mock seeds if Firebase is active.
 */

import {
  doc,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  SEED_USERS,
  SEED_MATERIALS,
  SEED_CAMPAIGNS,
  SEED_BENEFITS,
  SEED_EVENTS,
  SEED_COLLECTION_POINTS,
  SEED_RECYCLING_RECORDS,
  SEED_REDEMPTIONS,
} from './seedData';

type Listener = () => void;

class ReactiveStore {
  private listeners: Set<Listener> = new Set();
  private storageKey = 'ecoretorna_admin_data_v2'; // Bumped for canonical schema alignment

  public data = {
    users: [...SEED_USERS],
    materials: [...SEED_MATERIALS],
    campaigns: [...SEED_CAMPAIGNS],
    benefits: [...SEED_BENEFITS],
    events: [...SEED_EVENTS],
    collectionPoints: [...SEED_COLLECTION_POINTS],
    recyclingRecords: [...SEED_RECYCLING_RECORDS],
    redemptions: [...SEED_REDEMPTIONS],
  };

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.data = {
          users: parsed.users || SEED_USERS,
          materials: parsed.materials || SEED_MATERIALS,
          campaigns: parsed.campaigns || SEED_CAMPAIGNS,
          benefits: parsed.benefits || SEED_BENEFITS,
          events: parsed.events || SEED_EVENTS,
          collectionPoints: parsed.collectionPoints || SEED_COLLECTION_POINTS,
          recyclingRecords: parsed.recyclingRecords || SEED_RECYCLING_RECORDS,
          redemptions: parsed.redemptions || SEED_REDEMPTIONS,
        };
      }
    } catch {
      // Fallback to default memory seeds
    }
  }

  public save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.data));
    } catch {
      // ignore quota errors
    }
    this.notify();
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToSeeds() {
    this.data = {
      users: [...SEED_USERS],
      materials: [...SEED_MATERIALS],
      campaigns: [...SEED_CAMPAIGNS],
      benefits: [...SEED_BENEFITS],
      events: [...SEED_EVENTS],
      collectionPoints: [...SEED_COLLECTION_POINTS],
      recyclingRecords: [...SEED_RECYCLING_RECORDS],
      redemptions: [...SEED_REDEMPTIONS],
    };
    this.save();
  }
}

export const localStore = new ReactiveStore();

/**
 * Executes a write to Firestore first.
 * If Firebase is configured and the write fails, an error is thrown and
 * the local store is NOT modified.
 */
export async function writeToFirestoreFirst<T extends Record<string, any>>(
  collectionName: string,
  docId: string,
  data: T,
  operation: 'set' | 'update'
): Promise<void> {
  if (isFirebaseConfigured && db) {
    try {
      const docRef = doc(db, collectionName, docId);
      if (operation === 'set') {
        await setDoc(docRef, data, { merge: true });
      } else {
        await updateDoc(docRef, data);
      }
    } catch (error) {
      handleFirestoreError(
        error,
        operation === 'set' ? OperationType.CREATE : OperationType.UPDATE,
        `${collectionName}/${docId}`,
        auth?.currentUser
      );
    }
  }
}
