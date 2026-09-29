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
import { collection, getDocs } from 'firebase/firestore';
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
   * Returns recent records ordered by creation date
   */
  async getRecent(limitCount = 10): Promise<RecyclingRecord[]> {
    const all = await this.getAll();
    return all
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limitCount);
  },
};
