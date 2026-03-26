// app/screens/LoginScreen.js
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView,
} from 'react-native';
import { signInWithGoogle } from '../services/authService';
import { useAuthStore } from '../store';
import { THEME } from '../utils/constants';

const T = THEME.dark;

export default function LoginScreen() {
  const { setUser, setAccessToken } = useAuthStore();

  const handleSignIn = async () => {
    try {
      const { user, accessToken } = await signInWithGoogle();
      setUser(user);
      setAccessToken(accessToken);
    } catch (error) {
      console.error('Sign in failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Logo area */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💰</Text>
          </View>
          <Text style={styles.appName}>Expense Tracker</Text>
          <Text style={styles.tagline}>Your money, organized.</Text>
        </View>

        {/* Features list */}
        <View style={styles.features}>
          {[
            { icon: '📊', text: 'Track income, expenses & loans' },
            { icon: '📄', text: 'Sync to your Google Sheet' },
            { icon: '📈', text: 'Visual analytics & reports' },
            { icon: '🔐', text: 'Secure Google login' },
          ].map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>

        {/* Sign in button */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleSignIn}
        >
          <>
            <Text style={styles.googleIcon}>G</Text>
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By signing in, you agree to our Terms & Privacy Policy.
          Your data is stored in your own Google Sheet.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },
  inner: {
    flex: 1, paddingHorizontal: 28, justifyContent: 'center', alignItems: 'center',
  },
  logoWrap: { alignItems: 'center', marginBottom: 48 },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: T.bg3, borderWidth: 1, borderColor: T.border2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  logoEmoji: { fontSize: 36 },
  appName: { fontSize: 28, fontWeight: '700', color: T.text, letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: T.text2, marginTop: 6 },

  features: { width: '100%', marginBottom: 48 },
  featureRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: T.bg3, borderRadius: 12,
    borderWidth: 1, borderColor: T.border,
    padding: 14, marginBottom: 8,
  },
  featureIcon: { fontSize: 20, marginRight: 14 },
  featureText: { fontSize: 14, color: T.text, fontWeight: '400' },

  googleBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: T.blue, borderRadius: 14, paddingVertical: 16, gap: 10,
  },
  googleIcon: {
    fontSize: 18, fontWeight: '700', color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 28, height: 28, borderRadius: 14,
    textAlign: 'center', lineHeight: 28,
  },
  googleBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },

  terms: {
    fontSize: 12, color: T.text3, textAlign: 'center',
    marginTop: 20, lineHeight: 18,
  },
});

