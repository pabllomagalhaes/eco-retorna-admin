/**
 * Admin Authentication Service
 * Strictly enforces that only users with role: 'admin' in users/{auth.uid}
 * can access the panel.
 * 
 * Rules:
 * - Uses onAuthStateChanged listener to track session.
 * - When Firebase is active: NEVER trusts email text or mock JSON.
 * - Queries users/{uid} and verifies role == 'admin'.
 * - If not admin, immediately calls signOut() and denies access.
 */

import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { userRepository } from '../repositories/userRepository';
import type { UserProfile } from '../types';

const ADMIN_SESSION_KEY = 'ecoretorna_admin_session_v2';

export const authService = {
  /**
   * Initializes auth listener with onAuthStateChanged.
   * On reload, waits for Firebase Auth, verifies users/{uid} has role == 'admin'.
   * If not admin: signOut() + callback(null).
   */
  initAuthListener(onAuthChanged: (user: UserProfile | null, loading: boolean) => void): () => void {
    const firebaseAuth = auth;
    if (isFirebaseConfigured && firebaseAuth) {
      onAuthChanged(null, true);
      const unsubscribe = onAuthStateChanged(firebaseAuth, async (fbUser: FirebaseUser | null) => {
        if (!fbUser) {
          localStorage.removeItem(ADMIN_SESSION_KEY);
          onAuthChanged(null, false);
          return;
        }

        try {
          const profile = await userRepository.getUserById(fbUser.uid);
          if (profile && profile.role === 'admin') {
            localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(profile));
            onAuthChanged(profile, false);
          } else {
            console.warn('[Auth] Acesso negado: usuário não possui role: admin em users/{uid}.');
            await fbSignOut(firebaseAuth);
            localStorage.removeItem(ADMIN_SESSION_KEY);
            onAuthChanged(null, false);
          }
        } catch (error) {
          console.error('[Auth] Erro ao validar perfil de administrador:', error);
          await fbSignOut(firebaseAuth);
          localStorage.removeItem(ADMIN_SESSION_KEY);
          onAuthChanged(null, false);
        }
      });

      return unsubscribe;
    }

    // Local development mode session restoration
    const session = this.getCurrentSession();
    onAuthChanged(session, false);
    return () => {};
  },

  /**
   * Signs in an admin user.
   * Strictly validates role == 'admin' directly from Firestore users/{uid}.
   */
  async login(email: string, password?: string): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      throw new Error('Por favor, informe seu e-mail administrativo.');
    }

    if (isFirebaseConfigured && auth) {
      if (!password) {
        throw new Error('Por favor, informe sua senha de acesso.');
      }

      try {
        const credential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        const profile = await userRepository.getUserById(credential.user.uid);

        if (!profile || profile.role !== 'admin') {
          await fbSignOut(auth);
          throw new Error('Esta conta não possui permissão administrativa.');
        }

        this.setStoredSession(profile);
        return profile;
      } catch (err: any) {
        if (err.message === 'Esta conta não possui permissão administrativa.') {
          throw err;
        }
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          throw new Error('Credenciais administrativas incorretas.');
        }
        throw new Error(err.message || 'Falha ao autenticar no Firebase.');
      }
    }

    // Local / Dev Authentication Evaluation
    // Reject participants
    const participantCheck = await userRepository.findParticipantByEmail(cleanEmail);
    if (participantCheck) {
      throw new Error('Esta conta não possui permissão administrativa.');
    }

    // Verify if email is a recognized admin in localStore
    const admin = await userRepository.findAdminByEmail(cleanEmail);
    if (!admin) {
      if (cleanEmail === 'admin@ecoretorna.com') {
        const defaultAdmin: UserProfile = {
          id: 'admin-master',
          name: 'Coordenação EcoRetorna',
          email: 'admin@ecoretorna.com',
          role: 'admin',
          active: true,
          status: 'active',
          createdAt: new Date().toISOString(),
        };
        await userRepository.upsertUser(defaultAdmin);
        this.setStoredSession(defaultAdmin);
        return defaultAdmin;
      }
      throw new Error('Esta conta não possui permissão administrativa.');
    }

    this.setStoredSession(admin);
    return admin;
  },

  getCurrentSession(): UserProfile | null {
    if (typeof localStorage === 'undefined') return null;
    try {
      const stored = localStorage.getItem(ADMIN_SESSION_KEY);
      if (stored) {
        const user: UserProfile = JSON.parse(stored);
        if (user.role === 'admin') {
          return user;
        }
      }
    } catch {
      // ignore parse errors
    }
    return null;
  },

  setStoredSession(user: UserProfile) {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(user));
      } catch {
        // ignore
      }
    }
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      try {
        await fbSignOut(auth);
      } catch {
        // ignore
      }
    }
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(ADMIN_SESSION_KEY);
      } catch {
        // ignore
      }
    }
  },
};
