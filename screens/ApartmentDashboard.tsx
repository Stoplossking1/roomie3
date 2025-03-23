import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../components/firebase';
import { collection, doc, query, onSnapshot, addDoc, updateDoc, getDoc } from "firebase/firestore";

// SetCodeModal Component
const SetCodeModal = ({ isVisible, onClose, apartmentId }) => {
  const [code, setCode] = useState('');

  const handleSetCode = async () => {
    if (code.length !== 6 || isNaN(code)) {
      alert("Please enter a valid 6-digit code.");
      return;
    }

    try {
      const apartmentRef = doc(db, "apartments", apartmentId);
      await updateDoc(apartmentRef, { code: code });
      alert("Code updated successfully!");
      onClose();
    } catch (error) {
      alert("Error updating code: " + error.message);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set 6-Digit Code</Text>
          <TextInput
            placeholder="Enter 6-digit code"
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
            style={styles.input}
          />
          <TouchableOpacity style={styles.modalButton} onPress={handleSetCode}>
            <Text style={styles.modalButtonText}>Set Code</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.modalCancelButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function ApartmentDashboard({ navigation, route }) {
  const { apartmentId } = route.params;
  const [activeTab, setActiveTab] = useState('tasks');
  const [apartmentData, setApartmentData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSetCodeModalVisible, setIsSetCodeModalVisible] = useState(false);

  // Modals for adding chores and expenses
  const [isChoreModalVisible, setIsChoreModalVisible] = useState(false);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);

  // Fetch apartment data, tasks, and expenses
  useEffect(() => {
    const apartmentRef = doc(db, "apartments", apartmentId);
    const tasksQuery = query(collection(apartmentRef, "tasks"));
    const expensesQuery = query(collection(apartmentRef, "expenses"));

    const unsubscribeApartment = onSnapshot(apartmentRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const members = Array.isArray(data.members) ? data.members : [];
        const memberDetails = await Promise.all(
          members.map(async (memberId) => {
            const userSnapshot = await getDoc(doc(db, "users", memberId));
            return userSnapshot.exists() ? { id: memberId, ...userSnapshot.data() } : null;
          })
        );
        setApartmentData({
          id: doc.id,
          name: data.name || "Unnamed Apartment",
          address: data.address || "No Address",
          members: memberDetails.filter(Boolean),
          code: data.code || "No Code Set",
        });
      }
    });

    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setTasks(tasksData);
    });

    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
      const expensesData = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => {
      unsubscribeApartment();
      unsubscribeTasks();
      unsubscribeExpenses();
    };
  }, [apartmentId]);

  // Render a single chore
  const renderChore = ({ item }) => (
    <View style={styles.taskCard}>
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
        <TouchableOpacity 
          style={styles.assignButton} 
          onPress={() => handleAssignChore(item.id)}
        >
          <Text style={styles.assignButtonText}>Assign Chore</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render a single expense
  const renderExpense = ({ item }) => (
    <View style={styles.expenseCard}>
      <Text style={styles.expenseTitle}>{item.title}</Text>
      <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      <TouchableOpacity 
        style={styles.assignButton} 
        onPress={() => handleAssignExpense(item.id)}
      >
        <Text style={styles.assignButtonText}>Assign Expense</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{apartmentData?.name}</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Display Current Code */}
      <View style={styles.codeContainer}>
        <Text style={styles.codeText}>Current Code: {apartmentData?.code}</Text>
        <TouchableOpacity 
          style={styles.setCodeButton} 
          onPress={() => setIsSetCodeModalVisible(true)}
        >
          <Text style={styles.setCodeButtonText}>Set Code</Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setIsChoreModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Add Chore</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={() => setIsExpenseModalVisible(true)}
        >
          <Text style={styles.actionButtonText}>Add Expense</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'tasks' && styles.activeTab]}
          onPress={() => setActiveTab('tasks')}
        >
          <Text style={[styles.tabText, activeTab === 'tasks' && styles.activeTabText]}>Chores</Text>
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
          renderItem={renderChore}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlatList
          data={expenses}
          renderItem={renderExpense}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* SetCodeModal */}
      <SetCodeModal 
        isVisible={isSetCodeModalVisible} 
        onClose={() => setIsSetCodeModalVisible(false)} 
        apartmentId={apartmentId}
      />

      {/* Chore Modal */}
      <Modal visible={isChoreModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Chore</Text>
            {/* Add your chore input fields here */}
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsChoreModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expense</Text>
            {/* Add your expense input fields here */}
            <TouchableOpacity style={styles.modalButton} onPress={() => setIsExpenseModalVisible(false)}>
              <Text style={styles.modalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20 
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  addButton: { 
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeContainer: {
    padding: 20,
    alignItems: 'center',
  },
  codeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  setCodeButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  setCodeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButtons: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 20 
  },
  actionButton: { 
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  actionButtonText: { color: 'white', fontWeight: 'bold' },
  tabBar: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    marginTop: 20 
  },
  tab: { 
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  activeTab: { borderBottomColor: '#007AFF' },
  listContainer: { padding: 20 },
  taskCard: { 
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  taskHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  taskTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  statusBadge: { 
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadge: { backgroundColor: '#E8F5E9' },
  pendingBadge: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 12, fontWeight: '500' },
  taskDetails: { flexDirection: 'row', justifyContent: 'space-between' },
  assignedTo: { color: '#666', fontSize: 14 },
  assignButton: { 
    backgroundColor: '#FF9500',
    padding: 5,
    borderRadius: 5,
    marginLeft: 10,
  },
  assignButtonText: { color: 'white', fontWeight: 'bold' },
  expenseCard: { 
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  expenseTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  expenseAmount: { fontSize: 14, color: '#666' },
  modalContainer: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: { 
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  input: { 
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginVertical: 10,
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
  modalButtonText: { color: 'white', fontWeight: 'bold' },
});