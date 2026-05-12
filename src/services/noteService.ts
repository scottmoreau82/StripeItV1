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
import { db } from '../lib/firebase';
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
    const notesRef = getNotesRef(orgId);
    const docRef = await addDoc(notesRef, {
      ...noteData,
      orgId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  },

  /**
   * Get notes for a user within an organization
   */
  async getUserNotes(orgId: string, userId: string): Promise<QuickNote[]> {
    const q = query(
      getNotesRef(orgId),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as QuickNote));
  },

  /**
   * Update a note
   */
  async updateNote(orgId: string, noteId: string, updates: Partial<QuickNote>): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.NOTES, noteId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Delete a note
   */
  async deleteNote(orgId: string, noteId: string): Promise<void> {
    const docRef = doc(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.NOTES, noteId);
    await deleteDoc(docRef);
  }
};
