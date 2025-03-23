import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../components/firebase'; // Import Firestore
import { collection, doc, query, onSnapshot, addDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

export default function RoomDashboard({ navigation, route }) {
  const { roomId } = route.params; // Get roomId from navigation params
  const [activeTab, setActiveTab] = useState('tasks');
  const [roomData, setRoomData] = useState(null); // Room data from Firestore
  const [tasks, setTasks] = useState([]); // Tasks in the room
  const [loading, setLoading] = useState(true); // Loading state

  // Fetch room data and tasks from Firestore
  useEffect(() => {
    const roomRef = doc(db, "rooms", roomId);
    const tasksQuery = query(collection(roomRef, "tasks"));

    const unsubscribeRoom = onSnapshot(roomRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const members = Array.isArray(data.members) ? data.members : [];

        // Fetch user details for each member
        const memberDetails = await Promise.all(
          members.map(async (memberId) => {
            const userSnapshot = await getDoc(doc(db, "users", memberId));
            if (userSnapshot.exists()) {
              return { id: memberId, ...userSnapshot.data() };
            }
            return null; // Handle invalid users gracefully
          })
        );

        setRoomData({
          id: doc.id,
          name: data.name || "Unnamed Room",
          members: memberDetails.filter(Boolean), // Filter out invalid users
        });
      }
    });

    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((taskDoc) => {
        tasksData.push({ id: taskDoc.id, ...taskDoc.data() });
      });
      console.log("Tasks Data:", tasksData); // Debugging
      setTasks(tasksData);
      setLoading(false);
    });

    return () => {
      unsubscribeRoom();
      unsubscribeTasks();
    };
  }, [roomId]);

  // Add a new roommate to the room
  const handleAddRoommate = async () => {
    const userId = prompt("Enter User ID to add:");
    if (!userId) {
      alert("Please enter a valid User ID.");
      return;
    }

    // Check if the user exists in the 'users' collection
    const userRef = doc(db, "users", userId);
    const userSnapshot = await getDoc(userRef);

    if (!userSnapshot.exists()) {
      alert("User does not exist. Please enter a valid User ID.");
      return;
    }

    // Check if the user is already in the room
    if (roomData?.members.some(member => member.id === userId)) {
      alert("User is already in the room.");
      return;
    }

    try {
      // Add the user to the room's members array
      await updateDoc(doc(db, "rooms", roomId), {
        members: arrayUnion(userId),
      });
      alert("Roommate added successfully!");
    } catch (error) {
      alert("Error adding roommate: " + error.message);
    }
  };

  // Assign tasks equally among roommates
  const handleAssignTasks = async () => {
    if (!roomData || !roomData.members.length) {
      alert("No roommates available to assign tasks.");
      return;
    }

    setLoading(true);
    const members = roomData.members;
    const tasksPerMember = Math.ceil(tasks.length / members.length);

    try {
      tasks.forEach((task, index) => {
        const assignedTo = members[index % members.length].id;
        updateDoc(doc(db, "rooms", roomId, "tasks", task.id), {
          assignedTo,
        });
      });
      alert("Tasks assigned successfully!");
    } catch (error) {
      alert("Error assigning tasks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Render a single task
  const renderTask = ({ item }) => (
    <TouchableOpacity style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <TouchableOpacity 
          style={[styles.statusBadge, item.completed ? styles.completedBadge : styles.pendingBadge]}
        >
          <Text style={styles.statusText}>{item.completed ? 'Completed' : 'Pending'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.taskDetails}>
        <Text style={styles.assignedTo}>Assigned to: {item.assignedTo || "Unassigned"}</Text>
        <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
      </View>
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
      <View style={styles.header}>
        <Text style={styles.title}>{roomData?.name || "Room Dashboard"}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Rooms')}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Display Roommates */}
      <ScrollView horizontal style={styles.roommateList}>
        {roomData?.members.length > 0 ? (
          roomData.members.map((member) => (
            <View key={member.id} style={styles.roommateItem}>
              <TouchableOpacity style={styles.roommateAvatar}>
                <Image source={{ uri: member.avatar || "https://api.a0.dev/assets/image?text=young%20professional%20headshot&aspect=1:1" }} style={styles.avatarImage} />
              </TouchableOpacity>
              <Text style={styles.roommateName}>{member.name || "Unknown User"}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.noRoommatesText}>No roommates added yet.</Text>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddRoommate}>
          <Text style={styles.actionButtonText}>Add Roommate</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={handleAssignTasks}>
          <Text style={styles.actionButtonText}>Assign Tasks</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'expenses' && styles.activeTab]}
          onPress={() => setActiveTab('expenses')}
        >
          <Text style={[styles.tabText, activeTab === 'expenses' && styles.activeTabText]}>Expenses</Text>
        </TouchableOpacity>
      </View>

      {/* Content Based on Active Tab */}
      {activeTab === 'tasks' ? (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <Text>No expenses yet.</Text>
      )}
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roommateList: {
    maxHeight: 100,
    paddingHorizontal: 20,
  },
  roommateItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  roommateAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ddd',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  roommateName: {
    marginTop: 5,
    fontSize: 12,
    color: '#666',
  },
  noRoommatesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    color: '#666',
    fontSize: 16,
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  listContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  assignedTo: {
    color: '#666',
    fontSize: 14,
  },
  dueDate: {
    color: '#666',
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  actionButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});