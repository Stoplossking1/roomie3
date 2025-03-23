// AuthScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../components/firebase'; // Adjust the path if needed
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth"; // Import Firebase auth functions

export default function AuthScreen({ navigation }) {
  const [isLogin, setIsLogin] = useState(true); // Toggle between login and register modes
  const [email, setEmail] = useState(''); // Email input state
  const [password, setPassword] = useState(''); // Password input state

  // Handle authentication (login or register)
  const handleAuth = async () => {
    try {
      if (isLogin) {
        // Login with email and password
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in successfully');
        navigation.replace('Main'); // Navigate to the main app (replace current screen)
      } else {
        // Register with email and password
        await createUserWithEmailAndPassword(auth, email, password);
        console.log('User registered successfully');
        navigation.replace('Main'); // Navigate to the main app (replace current screen)
      }
    } catch (error) {
      // Handle errors (e.g., invalid email, weak password, etc.)
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* App Logo */}
        <Image
          source={{ uri: 'https://api.a0.dev/assets/image?text=roommate%20management%20app%20modern%20logo&aspect=1:1' }}
          style={styles.logo}
        />

        {/* Title and Subtitle */}
        <Text style={styles.title}>RoomMate Manager</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Welcome back!' : 'Create your account'}
        </Text>

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Login/Register Button */}
        <TouchableOpacity style={styles.button} onPress={handleAuth}>
          <Text style={styles.buttonText}>
            {isLogin ? 'Login' : 'Register'}
          </Text>
        </TouchableOpacity>

        {/* Switch Between Login and Register */}
        <TouchableOpacity 
          style={styles.switchButton}
          onPress={() => setIsLogin(!isLogin)}
        >
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 20,
    borderRadius: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    color: '#007AFF',
    fontSize: 14,
  },
});