import { useState, useEffect } from 'react';
import { doc, collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { COLLECTIONS } from '../constants';

/**
 * useMonthlyDealCount
 * Custom hook that queries Firestore for deals belonging to the current authenticated user
 * within the current calendar month (1st to last day) and returns the live count.
 */
export function useMonthlyDealCount(uid: string, debugDate?: Date) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!uid) {
      setCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubDeals: (() => void) | null = null;
    const userDocRef = doc(db, COLLECTIONS.USERS, uid);

    const unsubUser = onSnapshot(userDocRef, (userSnap) => {
      // Clean up any existing deals subscription if userData changes
      if (unsubDeals) {
        unsubDeals();
        unsubDeals = null;
      }

      if (!userSnap.exists()) {
        setCount(0);
        setLoading(false);
        return;
      }

      const userData = userSnap.data();
      const orgId = userData?.orgId;

      if (!orgId) {
        setCount(0);
        setLoading(false);
        return;
      }

      // Compute month boundaries dynamically at call time using the reference date
      // DEV ONLY — remove before Dealer tier launch
      const referenceDate = debugDate || new Date();
      const startOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(startOfMonth);
      const endTimestamp = Timestamp.fromDate(endOfMonth);

      // Query the deals collection of the organization where:
      // - userId == uid
      // - createdAt is within the current month boundaries
      const dealsRef = collection(db, COLLECTIONS.ORGANIZATIONS, orgId, COLLECTIONS.DEALS);
      const dealsQuery = query(
        dealsRef,
        where('userId', '==', uid),
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp)
      );

      unsubDeals = onSnapshot(dealsQuery, (dealsSnap) => {
        setCount(dealsSnap.size);
        setLoading(false);
      }, (error) => {
        console.error('[useMonthlyDealCount] Error fetching deals count:', error);
        setCount(0);
        setLoading(false);
      });
    }, (error) => {
      console.error('[useMonthlyDealCount] Error fetching user profile:', error);
      setCount(0);
      setLoading(false);
    });

    return () => {
      unsubUser();
      if (unsubDeals) {
        unsubDeals();
      }
    };
  }, [uid, debugDate ? debugDate.getTime() : null]);

  return { count, loading };
}
