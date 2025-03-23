import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../components/firebase'; // Import Firestore and Firebase Auth
import { collection, query, onSnapshot, addDoc, updateDoc, doc, where, getDocs, arrayUnion } from "firebase/firestore"; // Firestore methods

export default function ApartmentsScreen({ navigation }) {
  const [apartments, setApartments] = useState([]); // State to hold apartments
  const [loading, setLoading] = useState(true); // Loading state for Firestore fetch
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state for creating an apartment
  const [apartmentName, setApartmentName] = useState(''); // Apartment name input
  const [apartmentAddress, setApartmentAddress] = useState(''); // Apartment address input
  const [isJoinModalVisible, setIsJoinModalVisible] = useState(false); // Modal visibility state for joining an apartment
  const [joinCode, setJoinCode] = useState(''); // Input for joining an apartment

  // Fetch apartments from Firestore
  useEffect(() => {
    const currentUser = auth.currentUser; // Get the current user
    if (!currentUser) {
      console.error("No user is currently logged in.");
      return;
    }

    // Query to fetch apartments where the current user is a roommate
    const q = query(
      collection(db, "apartments"),
      where("roommates", "array-contains", currentUser.uid) // Check if the user is in the roommates array
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const apartmentsData = [];
      querySnapshot.forEach((doc) => {
        apartmentsData.push({ id: doc.id, ...doc.data() }); // Add apartment data to array
      });
      setApartments(apartmentsData); // Update state with fetched apartments
      setLoading(false); // Stop loading
    });

    return () => unsubscribe(); // Unsubscribe from listener on unmount
  }, []);

  // Function to handle apartment creation
  const handleCreateApartment = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in to create an apartment.");
      return;
    }

    if (!apartmentName || !apartmentAddress) {
      alert("Please enter both the apartment name and address.");
      return;
    }

    try {
      const joinCode = generateRandomCode().toUpperCase(); // Ensure the code is uppercase
      console.log("Generated Join Code:", joinCode); // Debugging: Log the generated code

      const apartmentRef = await addDoc(collection(db, "apartments"), {
        name: apartmentName,
        address: apartmentAddress,
        "Roommate 1": currentUser.uid,
        roommates: [currentUser.uid], // Add the current user to the roommates array
        code: joinCode, // Store the code in uppercase
      });

      const apartmentId = apartmentRef.id;
      await updateDoc(doc(db, "apartments", apartmentId), {
        apartmentId: apartmentId,
      });

      console.log(`Apartment "${apartmentName}" created successfully with ID: ${apartmentId}`);
      setApartmentName('');
      setApartmentAddress('');
      setIsModalVisible(false);
    } catch (error) {
      console.error("Error creating apartment:", error);
      alert("Failed to create apartment. Please try again.");
    }
  };

  // Generate a random 6-character numeric code
  const generateRandomCode = () => {
    const chars = '0123456789'; // Only numeric characters
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Handle joining an apartment
  const handleJoinApartment = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in to join an apartment.");
      return;
    }

    const normalizedJoinCode = joinCode.trim();
    console.log("Entered Join Code:", normalizedJoinCode); // Debugging: Log the entered code

    if (!normalizedJoinCode || normalizedJoinCode.length !== 6) {
      alert("Please enter a valid 6-character join code.");
      return;
    }

    try {
      // Query Firestore for apartments with the matching join code
      const q = query(collection(db, "apartments"), where("code", "==", normalizedJoinCode));
      const querySnapshot = await getDocs(q);
      console.log("Query Snapshot:", querySnapshot.docs); // Debugging: Log the query results

      if (querySnapshot.empty) {
        alert("Invalid join code. Please try again.");
        return;
      }

      const apartmentDoc = querySnapshot.docs[0];
      const apartmentData = apartmentDoc.data();
      const apartmentId = apartmentDoc.id;
      console.log("Apartment Data:", apartmentData); // Debugging: Log the apartment data

      // Check if the user is already a roommate in this apartment
      if (apartmentData.roommates && apartmentData.roommates.includes(currentUser.uid)) {
        alert("You are already a member of this apartment.");
        return;
      }

      // Find the next available roommate slot
      let nextRoommateSlot = null;
      for (let i = 1; i <= 10; i++) { // Assuming a max of 10 roommates
        if (!apartmentData[`Roommate ${i}`]) {
          nextRoommateSlot = `Roommate ${i}`;
          break;
        }
      }

      if (!nextRoommateSlot) {
        alert("This apartment is full. No more roommates can be added.");
        return;
      }

      // Update the apartment document to add the new roommate
      await updateDoc(doc(db, "apartments", apartmentId), {
        [nextRoommateSlot]: currentUser.uid,
        roommates: arrayUnion(currentUser.uid), // Add the user to the roommates array
      });

      alert("You have successfully joined the apartment!");
      setIsJoinModalVisible(false);
      setJoinCode('');
    } catch (error) {
      console.error("Error joining apartment:", error);
      alert("Failed to join apartment. Please try again.");
    }
  };

  // Render a single apartment
  const renderApartment = ({ item }) => {
    // Count the number of roommates dynamically
    const roommatesCount = Object.keys(item).filter(key => key.startsWith("Roommate")).length;

    return (
      <TouchableOpacity 
        style={styles.apartmentCard}
        onPress={() => navigation.navigate('ApartmentDashboard', { apartmentId: item.id })}
      >
        <MaterialCommunityIcons name="home" size={24} color="#007AFF" />
        <View style={styles.apartmentInfo}>
          <Text style={styles.apartmentName}>{item.name}</Text>
          <Text style={styles.addressText}>{item.address}</Text>
          <Text style={styles.membersText}>{roommatesCount} members</Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Your Apartments</Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => setIsModalVisible(true)} // Open the modal for creating an apartment
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Apartment</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => setIsJoinModalVisible(true)} // Open the modal for joining an apartment
        >
          <MaterialCommunityIcons name="account-multiple-plus" size={24} color="white" />
          <Text style={styles.joinButtonText}>Join Apartment</Text>
        </TouchableOpacity>
      </View>

      {/* Apartment List */}
      <FlatList
        data={apartments}
        renderItem={renderApartment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Custom Prompt Modal for Creating an Apartment */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Apartment</Text>
            <TextInput
              placeholder="Enter apartment name"
              value={apartmentName}
              onChangeText={setApartmentName}
              style={styles.input}
            />
            <TextInput
              placeholder="Enter apartment address"
              value={apartmentAddress}
              onChangeText={setApartmentAddress}
              style={styles.input}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleCreateApartment}>
              <Text style={styles.modalButtonText}>Create</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Custom Prompt Modal for Joining an Apartment */}
      <Modal visible={isJoinModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Join an Apartment</Text>
            <TextInput
              placeholder="Enter 6-digit join code"
              value={joinCode}
              onChangeText={setJoinCode}
              style={styles.input}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleJoinApartment}>
              <Text style={styles.modalButtonText}>Join</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsJoinModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9500', // A different color to distinguish it from the create button
    padding: 10,
    borderRadius: 10,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  joinButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  apartmentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  apartmentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  apartmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  membersText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  modalButton: {
    backgroundColor: '#007AFF',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginVertical: 10,
  },
  modalCancelButton: {
    backgroundColor: '#666',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});