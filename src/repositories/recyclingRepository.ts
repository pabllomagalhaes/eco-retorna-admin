/**
 * Recycling Repository
 * Records raw recycling transactions performed by participants.
 * Strictly immutable once recorded. All participant statistics (balance, impact, ranking, badges)
 * are derived dynamically from these records.
 * 
 * Invariants:
 * - Remote-first: Writes to Firestore FIRST before mutating local memory state.
 * - No silent fallback: When Firebase is active, empty collection returns [], never mock seeds.
 */

import type { RecyclingRecord } from '../types';
import { localStore } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, getDocs, doc, writeBatch, setDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export const recyclingRepository = {
  /**
   * Retrieves all recycling transactions.
   * When Firebase is configured, strictly reads from Firestore. If empty, returns [].
   */
  async getAll(): Promise<RecyclingRecord[]> {
    if (isFirebaseConfigured && db) {
      try {
        const snap = await getDocs(collection(db, 'recyclingRecords'));
        const remoteList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecyclingRecord));
        localStore.data.recyclingRecords = remoteList;
        localStore.save();
        return remoteList;
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'recyclingRecords', auth?.currentUser);
      }
    }
    return [...localStore.data.recyclingRecords];
  },

  /**
   * Creates a batch of recycling records.
   * When Firebase is configured:
   * 1. Prepares Firestore batch write;
   * 2. Commits to Firestore FIRST;
   * 3. Only on remote commit success, updates localStore and cache;
   * 4. If remote write fails, throws error immediately without touching localStore.
   */
  async createBatch(records: Omit<RecyclingRecord, 'id'>[]): Promise<RecyclingRecord[]> {
    const created: RecyclingRecord[] = [];
    const timestamp = Date.now();

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      const id = `rec-${timestamp}-${i + 1}`;
      created.push({ id, ...record });
    }

    if (isFirebaseConfigured && db) {
      try {
        const batch = writeBatch(db);
        for (const item of created) {
          const docRef = doc(db, 'recyclingRecords', item.id);
          batch.set(docRef, item);
        }
        // Commit remotely first
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'recyclingRecords', auth?.currentUser);
      }
    }

    // Only update local store after remote write succeeded
    for (const item of created) {
      localStore.data.recyclingRecords.unshift(item);
    }
    localStore.save();

    return created;
  },

  /**
   * Returns recent records ordered by creation date
   */
  async getRecent(limitCount = 10): Promise<RecyclingRecord[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  },
};
