// App.tsx
import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { auth } from './components/firebase'; // Adjust the path if needed
import AppNavigator from './components/AppNavigator';
import AuthScreen from './screens/AuthScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true); // User is signed in
      } else {
        setIsAuthenticated(false); // User is signed out
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  return (
    <SafeAreaProvider>
      <Toaster />
      {isAuthenticated ? <AppNavigator /> : <AuthScreen />}
    </SafeAreaProvider>
  );
}