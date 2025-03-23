import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../components/firebase'; // Import Firestore and Firebase Auth
import { collection, query, onSnapshot, addDoc, updateDoc, doc, where } from "firebase/firestore"; // Firestore methods

export default function ApartmentsScreen({ navigation }) {
  const [apartments, setApartments] = useState([]); // State to hold apartments
  const [loading, setLoading] = useState(true); // Loading state for Firestore fetch
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal visibility state
  const [apartmentName, setApartmentName] = useState(''); // Apartment name input
  const [apartmentAddress, setApartmentAddress] = useState(''); // Apartment address input

  // Fetch apartments from Firestore
  useEffect(() => {
    const currentUser = auth.currentUser; // Get the current user
    if (!currentUser) {
      console.error("No user is currently logged in.");
      return;
    }

    const q = query(
      collection(db, "apartments"),
      where("members", "array-contains", currentUser.uid) // Filter apartments by current user's ID
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
    const currentUser = auth.currentUser; // Get the current user
    if (!currentUser) {
      alert("You must be logged in to create an apartment.");
      return;
    }

    if (!apartmentName || !apartmentAddress) {
      alert("Please enter both the apartment name and address.");
      return;
    }

    try {
      // Step 1: Create the apartment document in Firestore
      const apartmentRef = await addDoc(collection(db, "apartments"), {
        name: apartmentName,
        address: apartmentAddress,
        members: [currentUser.uid], // Initialize members as an array with the current user's ID
      });

      // Step 2: Retrieve the unique ID of the newly created apartment
      const apartmentId = apartmentRef.id;

      // Step 3: Update the apartment document to include the apartmentId field
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

  // Render a single apartment
  const renderApartment = ({ item }) => (
    <TouchableOpacity 
      style={styles.apartmentCard}
      onPress={() => navigation.navigate('ApartmentDashboard', { apartmentId: item.id })}
    >
      <MaterialCommunityIcons name="home" size={24} color="#007AFF" />
      <View style={styles.apartmentInfo}>
        <Text style={styles.apartmentName}>{item.name}</Text>
        <Text style={styles.addressText}>{item.address}</Text>
        <Text style={styles.membersText}>{item.members.length} members</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#666" />
    </TouchableOpacity>
  );

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
          onPress={() => setIsModalVisible(true)} // Open the modal
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Apartment</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={() => alert("Join functionality not implemented yet.")}
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

      {/* Custom Prompt Modal */}
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
    backgroundColor: '#FF9500',
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
    shadowRadius: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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