import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const mockTasks = [
  { id: '1', title: 'Clean Kitchen', assignedTo: 'John', dueDate: '2024-03-25', completed: false },
  { id: '2', title: 'Take out Trash', assignedTo: 'Sarah', dueDate: '2024-03-24', completed: true },
  { id: '3', title: 'Vacuum Living Room', assignedTo: 'Mike', dueDate: '2024-03-26', completed: false },
];

const mockExpenses = [
  { id: '1', title: 'Groceries', amount: 120.50, paidBy: 'John', date: '2024-03-22' },
  { id: '2', title: 'Internet Bill', amount: 60.00, paidBy: 'Sarah', date: '2024-03-20' },
];

const mockRoommates = [
  { id: '1', name: 'John', rating: 4.5, avatar: 'https://api.a0.dev/assets/image?text=young%20professional%20headshot&aspect=1:1' },
  { id: '2', name: 'Sarah', rating: 4.8, avatar: 'https://api.a0.dev/assets/image?text=female%20professional%20headshot&aspect=1:1' },
  { id: '3', name: 'Mike', rating: 4.2, avatar: 'https://api.a0.dev/assets/image?text=male%20student%20headshot&aspect=1:1' },
];

export default function RoomDashboard({ navigation, route }) {
  const [activeTab, setActiveTab] = useState('tasks');

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
        <Text style={styles.assignedTo}>Assigned to: {item.assignedTo}</Text>
        <Text style={styles.dueDate}>Due: {item.dueDate}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseHeader}>
        <Text style={styles.expenseTitle}>{item.title}</Text>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      </View>
      <Text style={styles.expenseDetails}>Paid by {item.paidBy} on {item.date}</Text>
    </View>
  );

  const renderRoommate = ({ item }) => (
    <TouchableOpacity 
      style={styles.roommateCard}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: item.avatar }} style={styles.avatar} />
      </View>
      <Text style={styles.roommateName}>{item.name}</Text>
      <View style={styles.ratingContainer}>
        <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
        <Text style={styles.ratingText}>{item.rating}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Room Dashboard</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal style={styles.roommateList}>
        {mockRoommates.map((roommate) => (
          <View key={roommate.id} style={styles.roommateItem}>
            <TouchableOpacity 
              style={styles.roommateAvatar}
              onPress={() => navigation.navigate('UserProfile', { userId: roommate.id })}
            >
              <Image source={{ uri: roommate.avatar }} style={styles.avatarImage} />
            </TouchableOpacity>
            <Text style={styles.roommateName}>{roommate.name}</Text>
          </View>
        ))}
      </ScrollView>

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

      {activeTab === 'tasks' ? (
        <FlatList
          data={mockTasks}
          renderItem={renderTask}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={mockExpenses}
          renderItem={renderExpense}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
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
  expenseCard: {
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
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  expenseDetails: {
    color: '#666',
    fontSize: 14,
  },
});