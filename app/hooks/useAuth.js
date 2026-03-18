// app/hooks/useAuth.js
import { useEffect } from 'react';
import { useAuthStore, useTransactionStore } from '../store';
import { onAuthChange, getUserProfile, signInWithGoogle, signOut } from '../services/authService';
import { useGoogleAuth } from '../services/authService';

export function useAuth() {
  const { user, loading, spreadsheetId, setUser, setLoading, setSpreadsheetId, signOut: clearUser } = useAuthStore();
  const { subscribe, clear } = useTransactionStore();
  const { request, response, promptAsync } = useGoogleAuth();

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await getUserProfile(firebaseUser.uid);
        if (profile?.spreadsheetId) setSpreadsheetId(profile.spreadsheetId);
        subscribe(firebaseUser.uid);
      } else {
        clearUser();
        clear();
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Handle Google OAuth response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token, access_token } = response.params;
      signInWithGoogle(id_token, access_token).catch(console.error);
    }
  }, [response]);

  const handleSignIn = () => promptAsync();

  const handleSignOut = async () => {
    await signOut();
    clearUser();
    clear();
  };

  return { user, loading, spreadsheetId, handleSignIn, handleSignOut, request };
}
