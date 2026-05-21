import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

/**
 * useMonthlyDealCount
 * Custom hook that queries Firestore for the current user's deals in the current calendar month
 * using the createdAt Timestamp field, and returns a live count.
 */
export function useMonthlyDealCount(orgId: string, userId: string, debugDate?: Date) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!orgId || !userId) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Compute month boundaries dynamically — no hardcoded months or years
    // DEV ONLY — debugDate param, remove before Dealer tier launch
    const referenceDate = debugDate || new Date();
    const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0, 0);
    const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const startTimestamp = Timestamp.fromDate(startOfMonth);
    const endTimestamp = Timestamp.fromDate(endOfMonth);

    const path = `organizations/${orgId}/deals`;
    const dealsRef = collection(db, 'organizations', orgId, 'deals');
    const dealsQuery = query(
      dealsRef,
      where('userId', '==', userId),
      where('createdAt', '>=', startTimestamp),
      where('createdAt', '<=', endTimestamp)
    );

    const unsubscribe = onSnapshot(
      dealsQuery,
      (snapshot) => {
        setCount(snapshot.size);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
        setCount(0);
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [orgId, userId, debugDate ? debugDate.getTime() : null]);

  return { count, loading };
}
