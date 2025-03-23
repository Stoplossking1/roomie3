import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const mockRooms = [
  { id: '1', name: 'Downtown Apartment', members: 3 },
  { id: '2', name: 'Student House', members: 4 },
];

export default function RoomsScreen({ navigation }) {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your Rooms</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => navigation.navigate('CreateRoom')}
        >
          <MaterialCommunityIcons name="plus" size={24} color="white" />
          <Text style={styles.createButtonText}>Create Room</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={mockRooms}
        renderItem={renderRoom}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
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
});