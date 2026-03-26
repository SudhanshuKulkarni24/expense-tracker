// App.js
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import AppNavigator from './app/navigation/AppNavigator';
import { useAuth } from './app/hooks/useAuth';

console.log('🔵 App.js loaded');

export default function App() {
  console.log('🟢 App() rendering');
  
  useAuth();

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
}
