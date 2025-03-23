import React, { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Toaster } from 'sonner-native';
import { auth } from './components/firebase'; // Adjust the path if needed
import AppNavigator from './components/AppNavigator';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<null | 'Main' | 'Auth'>(null);

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setInitialRoute('Main'); // User is signed in, navigate to Main
      } else {
        setInitialRoute('Auth'); // User is signed out, navigate to Auth
      }
    });

    return () => unsubscribe(); // Cleanup subscription
  }, []);

  // Wait until the initial route is determined
  if (initialRoute === null) {
    return null; // You can replace this with a loading spinner or splash screen
  }

  return (
    <SafeAreaProvider>
      <Toaster />
      <AppNavigator initialRoute={initialRoute} />
    </SafeAreaProvider>
  );
}