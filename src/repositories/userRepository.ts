/**
 * User Repository
 * Enforces strict participant privacy boundaries.
 * No public bulk listing of participant personal details.
 * Supports specific lookup by email for recycling registration and admin auth verification.
 * 
 * Rules:
 * - Admin does not create arbitrary IDs for users (uses Firebase Auth UID).
 * - Queries: where email == valor, checks role == 'participant'.
 * - Returns only authorized operational fields: id, name, email, active.
 * - Diagnostic detection for documents missing the role: 'participant' field (e.g. Camila seed).
 */

import type { UserProfile } from '../types';
import { localStore, writeToFirestoreFirst } from './storageAdapter';
import { db, auth, isFirebaseConfigured } from '../firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export interface ParticipantLookupResult {
  participant: UserProfile | null;
  needsRoleRepair?: boolean;
  diagnosticMessage?: string;
}

export const userRepository = {
  /**
   * Retrieves user by document UID from users/{uid}
   */
  async getUserById(uid: string): Promise<UserProfile | null> {
    if (isFirebaseConfigured && db) {
      try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            id: userDoc.id,
            name: data.name || '',
            email: data.email || '',
            role: data.role,
            active: Boolean(data.active ?? true),
            status: data.active ? 'active' : 'inactive',
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
            city: data.city,
            neighborhood: data.neighborhood,
            avatarUrl: data.avatarUrl,
            preferences: data.preferences,
          };
        }
        return null;
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${uid}`, auth?.currentUser);
      }
    }

    const found = localStore.data.users.find((u) => u.id === uid);
    return found || null;
  },

  /**
   * Specific participant lookup by email.
   * Only returns sanitized privacy-safe fields: id, name, email, active.
   * Detects if the document exists in Firestore but is missing role: 'participant'.
   */
  async findParticipantByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return null;

    if (isFirebaseConfigured && db) {
      try {
        // Query users by email first to detect if role is missing or invalid
        const q = query(collection(db, 'users'), where('email', '==', cleanEmail));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const userDoc = snapshot.docs[0];
          const docData = userDoc.data();

          // Diagnostic check: verify if role == 'participant'
          if (!docData.role || docData.role !== 'participant') {
            throw new Error(
              `DIAGNÓSTICO CAMILA / ROLE AUSENTE: O usuário com e-mail "${cleanEmail}" foi encontrado (UID: ${userDoc.id}, Nome: "${docData.name}"), porém o documento users/${userDoc.id} não possui o atributo role: "participant". Para que o EcoRetorna Admin possa registrar reciclagens para este participante, atualize o documento adicionando role: "participant". NÃO crie um novo usuário.`
            );
          }

          return {
            id: userDoc.id,
            name: docData.name || 'Participante',
            email: docData.email,
            role: 'participant',
            active: Boolean(docData.active ?? true),
            status: (docData.active ?? true) ? 'active' : 'inactive',
            createdAt: docData.createdAt || new Date().toISOString(),
          };
        }

        // Not found in configured Firestore - do NOT fallback to mock
        return null;
      } catch (error: any) {
        if (error.message?.includes('DIAGNÓSTICO CAMILA')) {
          throw error;
        }
        handleFirestoreError(error, OperationType.LIST, 'users', auth?.currentUser);
      }
    }

    // Local development mode lookup
    const found = localStore.data.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.role === 'participant'
    );

    if (!found) return null;

    return {
      id: found.id,
      name: found.name,
      email: found.email,
      role: 'participant',
      active: found.active ?? (found.status === 'active'),
      status: found.active ? 'active' : 'inactive',
      createdAt: found.createdAt,
    };
  },

  /**
   * Diagnostic repair function: updates an existing participant document to add role: 'participant'
   * without duplicating the user.
   */
  async setParticipantRole(uid: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'users', uid);
        await updateDoc(docRef, {
          role: 'participant',
          updatedAt: new Date().toISOString(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`, auth?.currentUser);
      }
    }
  },

  /**
   * Verifies if local user exists and has admin credentials
   */
  async findAdminByEmail(email: string): Promise<UserProfile | null> {
    const cleanEmail = email.trim().toLowerCase();
    const found = localStore.data.users.find(
      (u) => u.email.toLowerCase() === cleanEmail && u.role === 'admin'
    );
    return found || null;
  },

  /**
   * Upserts user with Remote-First strategy
   */
  async upsertUser(user: UserProfile): Promise<void> {
    const index = localStore.data.users.findIndex((u) => u.id === user.id);
    const operation = index >= 0 ? 'update' : 'set';

    // Remote-first
    await writeToFirestoreFirst('users', user.id, user, operation);

    if (index >= 0) {
      localStore.data.users[index] = user;
    } else {
      localStore.data.users.push(user);
    }
    localStore.save();
  },
};
