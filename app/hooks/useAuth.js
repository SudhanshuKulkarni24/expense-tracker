// app/hooks/useAuth.js
import { useEffect, useMemo } from 'react';
import { useAuthStore, useTransactionStore } from '../store';
import { onAuthChange, getUserProfile, signInWithGoogle, signOut } from '../services/authService';

export function useAuth() {
  const { setUser, setLoading, setSpreadsheetId, signOut: clearUser } = useAuthStore();
  const { subscribe, clear } = useTransactionStore();

  console.log('🔴 useAuth hook called');

  // Memoize functions to prevent dependency changes on every render
  const deps = useMemo(() => ({ setUser, setLoading, setSpreadsheetId, clearUser, subscribe, clear }), [setUser, setLoading, setSpreadsheetId, clearUser, subscribe, clear]);

  useEffect(() => {
    console.log('🟠 useAuth useEffect running');
    let isMounted = true;

    // Fallback: clear loading after 3 seconds
    const timeout = setTimeout(() => {
      if (isMounted) {
        console.log('💥 AUTH TIMEOUT - forcing loading = false');
        deps.setLoading(false);
      }
    }, 3000);

    try {
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        console.log('🔷 onAuthChange fired, user:', firebaseUser?.uid);
        if (!isMounted) return;

        try {
          if (firebaseUser) {
            deps.setUser(firebaseUser);
            const profile = await getUserProfile(firebaseUser.uid);
            if (profile?.spreadsheetId) deps.setSpreadsheetId(profile.spreadsheetId);
            deps.subscribe(firebaseUser.uid);
          } else {
            deps.clearUser();
            deps.clear();
          }
        } catch (error) {
          console.error('Auth error:', error);
        } finally {
          if (isMounted) {
            console.log('🟢 Setting loading = false');
            deps.setLoading(false);
            clearTimeout(timeout);
          }
        }
      });

      return () => {
        isMounted = false;
        clearTimeout(timeout);
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error('Auth setup error:', error);
      deps.setLoading(false);
    }
  }, [deps]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    deps.clearUser();
    deps.clear();
  };

  return { handleSignIn, handleSignOut };
}
