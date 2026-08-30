import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc
} from 'firebase/firestore';
import type { JournalSession } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Connect to the specific named database or default
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    googleProvider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    const errorCode = error?.code || '';
    const errorMsg = error?.message || '';
    if (
      errorCode === 'auth/popup-closed-by-user' ||
      errorCode === 'auth/cancelled-popup-request' ||
      errorCode === 'auth/user-cancelled' ||
      errorCode === 'auth/popup-blocked' ||
      errorMsg.includes('popup-closed-by-user') ||
      errorMsg.includes('cancelled-popup-request')
    ) {
      // User closed the popup window voluntarily or opened another popup request
      return null;
    }
    console.error('Firebase Auth error:', errorMsg || error);
    throw error;
  }
};

export const signOutUser = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

/**
 * Storage operations strictly isolated by `users/{userId}/interactions/{interactionId}`
 */

// Helper to strip undefined values before sending to Firestore
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null ? sanitizeForFirestore(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeForFirestore(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  return sanitized as T;
}

export const saveJournalSession = async (userId: string, session: JournalSession): Promise<void> => {
  if (!userId) throw new Error('Unauthenticated user cannot write to Firestore');
  if (session.userId !== userId) throw new Error('Security violation: userId mismatch');
  
  const interactionRef = doc(db, 'users', userId, 'interactions', session.id);
  const cleanData = sanitizeForFirestore({
    ...session,
    updatedAt: new Date().toISOString()
  });
  
  await setDoc(interactionRef, cleanData, { merge: true });
};

export const fetchUserJournalSessions = async (userId: string): Promise<JournalSession[]> => {
  if (!userId) throw new Error('Unauthenticated user cannot read from Firestore');
  
  const interactionsRef = collection(db, 'users', userId, 'interactions');
  const q = query(interactionsRef, orderBy('createdAt', 'desc'));
  
  const querySnapshot = await getDocs(q);
  const sessions: JournalSession[] = [];
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data() as JournalSession;
    sessions.push({
      ...data,
      id: docSnap.id
    });
  });
  
  return sessions;
};

export const fetchJournalSessionById = async (userId: string, sessionId: string): Promise<JournalSession | null> => {
  if (!userId) throw new Error('Unauthenticated user cannot read from Firestore');
  
  const interactionRef = doc(db, 'users', userId, 'interactions', sessionId);
  const docSnap = await getDoc(interactionRef);
  if (docSnap.exists()) {
    return docSnap.data() as JournalSession;
  }
  return null;
};

export const deleteJournalSession = async (userId: string, sessionId: string): Promise<void> => {
  if (!userId) throw new Error('Unauthenticated user cannot delete from Firestore');
  
  const interactionRef = doc(db, 'users', userId, 'interactions', sessionId);
  await deleteDoc(interactionRef);
};

export const updateJournalTitle = async (userId: string, sessionId: string, newTitle: string): Promise<void> => {
  if (!userId) throw new Error('Unauthenticated user cannot update Firestore');
  
  const interactionRef = doc(db, 'users', userId, 'interactions', sessionId);
  await updateDoc(interactionRef, {
    title: newTitle.trim() || 'Untitled Journal',
    updatedAt: new Date().toISOString()
  });
};
