import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker'; // For image picking
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../components/firebase'; // Import Firebase modules
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore'; // Firestore methods
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export default function EditProfileScreen({ navigation, route }) {
  const { userId } = route.params; // Get userId from route params
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [avatar, setAvatar] = useState(''); // Store the Base64 string
  const [loading, setLoading] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setName(userData.name || '');
          setEmail(userData.email || '');
          setAvatar(userData.avatar || ''); // Initialize avatar as an empty string if undefined
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [userId]);

  // Handle profile image selection
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Please allow access to your photo library.');
      return;
    }
  
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // 🔥 Reduce quality to 30%
    });
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      console.log('Original Image URI:', imageUri);
  
      try {
        // 🔥 Resize to 150x150 pixels
        const resizedImage = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 150, height: 150 } }],
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG } // 🔥 Reduce compression further
        );
  
        console.log('Resized Image URI:', resizedImage.uri);
  
        const base64Data = await FileSystem.readAsStringAsync(resizedImage.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
  
        const base64String = `data:image/jpeg;base64,${base64Data}`;
        
        // 🔥 Check final size before updating state
        console.log(`Base64 Length: ${base64String.length} bytes`);
        setAvatar(base64String);
        
      } catch (error) {
        console.error('Error processing image:', error);
        Alert.alert('Error', 'Failed to process image. Try again.');
      }
    } else {
      Alert.alert('Error', 'No image was selected.');
    }
  };  

  // Handle profile update
  const handleUpdateProfile = async () => {
    if (!name || !email) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    setLoading(true);

    try {
      // Prepare the data to update
      const updateData = {
        name: name,
        email: email,
        avatar: avatar || '', // Ensure avatar is never undefined
      };

      console.log('Updating Firestore with:', updateData); // Debugging: Log the update data

      // Update Firestore user data
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updateData);

      // Update email if it has changed
      if (email !== auth.currentUser.email) {
        await updateEmail(auth.currentUser, email);
      }

      // Update password if a new one is provided
      if (newPassword && currentPassword) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPassword);
      }

      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Image */}
        <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.profileImage} />
          ) : (
            <MaterialCommunityIcons name="account-circle" size={100} color="#007AFF" />
          )}
          <View style={styles.editIcon}>
            <MaterialCommunityIcons name="pencil" size={20} color="white" />
          </View>
        </TouchableOpacity>

        {/* Name Input */}
        <TextInput
          style={styles.input}
          placeholder="Name"
          value={name}
          onChangeText={setName}
        />

        {/* Email Input */}
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Current Password Input */}
        <TextInput
          style={styles.input}
          placeholder="Current Password (required for password change)"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
        />

        {/* New Password Input */}
        <TextInput
          style={styles.input}
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
        />

        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdateProfile} disabled={loading}>
          <Text style={styles.updateButtonText}>
            {loading ? 'Updating...' : 'Update Profile'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    padding: 5,
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
  updateButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});