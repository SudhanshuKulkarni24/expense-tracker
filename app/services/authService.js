// app/services/authService.js
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase/config';

// ─── Sign in with Google ─────────────────────────────────────────────────────
export async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const accessToken = credential?.accessToken;
    await upsertUserProfile(result.user);
    return { user: result.user, accessToken };
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

// ─── Create or update user profile in Firestore ──────────────────────────────
export async function upsertUserProfile(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    // First login — create profile
    await setDoc(ref, {
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      spreadsheetId: null,
      currency: 'INR',
      currencySymbol: '₹',
    });
  } else {
    // Update last login
    await setDoc(ref, { lastLoginAt: serverTimestamp() }, { merge: true });
  }
}

// ─── Get user profile from Firestore ────────────────────────────────────────
export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// ─── Sign out ────────────────────────────────────────────────────────────────
export async function signOut() {
  await firebaseSignOut(auth);
}

// ─── Auth state listener ─────────────────────────────────────────────────────
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}
