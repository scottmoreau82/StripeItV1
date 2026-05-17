import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { QuickNote } from '../types';
import { COLLECTIONS } from '../constants';

/**
 * StripeItNoteServiceSystem
 * Handles Firestore interactions for Quick Notes.
 */

const getNotesRef = (orgId: string) => {
  return collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.NOTES);
};

export const noteService = {
  /**
   * Create a new quick note
   */
  async createNote(orgId: string, noteData: Omit<QuickNote, 'id' | 'createdAt' | 'updatedAt' | 'orgId'>): Promise<string> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.NOTES}`;
    const notesRef = getNotesRef(orgId);
    try {
      const docRef = await addDoc(notesRef, {
        ...noteData,
        orgId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
      throw error;
    }
  },

  /**
   * Get notes for a user within an organization
   */
  async getUserNotes(orgId: string, userId: string): Promise<QuickNote[]> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.NOTES}`;
    const q = query(
      getNotesRef(orgId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    try {
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickNote));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      throw error;
    }
  },

  /**
   * Update a note
   */
  async updateNote(orgId: string, noteId: string, updates: Partial<QuickNote>): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.NOTES}/${noteId}`;
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.NOTES, noteId);
    try {
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      throw error;
    }
  },

  /**
   * Delete a note
   */
  async deleteNote(orgId: string, noteId: string): Promise<void> {
    const path = `${COLLECTIONS.ORGANIZATIONS}/${orgId}/${COLLECTIONS.NOTES}/${noteId}`;
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.NOTES, noteId);
    try {
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      throw error;
    }
  }
};
