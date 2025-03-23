import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from './firebase'; // Import Firestore
import { collection, query, onSnapshot, addDoc } from "firebase/firestore"; // Firestore methods
import Footer from './Footer'; // Import the reusable Footer component

export default function RoomsScreen({ navigation }) {
  const [rooms, setRooms] = useState([]); // State to hold rooms
  const [loading, setLoading] = useState(true); // Loading state for Firestore fetch

  // Fetch rooms from Firestore
  useEffect(() => {
    const q = query(collection(db, "rooms")); // Query the "rooms" collection
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const roomsData = [];
      querySnapshot.forEach((doc) => {
        roomsData.push({ id: doc.id, ...doc.data() }); // Add room data to array
      });
      setRooms(roomsData); // Update state with fetched rooms
      setLoading(false); // Stop loading
    });

    return () => unsubscribe(); // Unsubscribe from listener on unmount
  }, []);

  // Function to create a new room
  const handleCreateRoom = async () => {
    try {
      const roomName = prompt("Enter room name:");
      if (roomName) {
        await addDoc(collection(db, "rooms"), {
          name: roomName,
          members: 1, // Default number of members
        });
        alert("Room created successfully!");
      }
    } catch (error) {
      alert("Error creating room: " + error.message);
    }
  };

  // Handle footer tab press
  const handleFooterPress = (tab: string) => {
    if (tab === 'profile') {
      navigation.navigate('Profile'); // Matches the navigator name "Profile"
    }
  };

  // Render a single room
  const renderRoom = ({ item }) => (
    <TouchableOpacity 
      style={styles.roomCard}
      onPress={() => navigation.navigate('RoomDashboard', { roomId: item.id })}
    >
      <MaterialCommunityIcons name="home" size={24} color="#007AFF" />
      <View style={styles.roomInfo}>
        <Text style={styles.roomName}>{item.name}</Text>
        <Text style={styles.membersText}>{item.members} members</Text>
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
        <Text style={styles.title}>Your Rooms</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreateRoom}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Room</Text>
        </TouchableOpacity>
      </View>

      {/* Room List */}
      <FlatList
        data={rooms}
        renderItem={renderRoom}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Footer */}
      <Footer activeTab="apartment" onTabPress={handleFooterPress} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  createButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '500',
  },
  listContainer: {
    padding: 20,
  },
  roomCard: {
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
  roomInfo: {
    flex: 1,
    marginLeft: 15,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
});