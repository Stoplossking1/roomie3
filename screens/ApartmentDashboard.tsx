import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../components/firebase';
import { doc, collection, query, onSnapshot, addDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

export default function ApartmentDashboard({ navigation, route }) {
  const { apartmentId } = route.params;
  const [activeTab, setActiveTab] = useState('tasks');
  const [apartmentData, setApartmentData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChoreModalVisible, setIsChoreModalVisible] = useState(false);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [selectedChores, setSelectedChores] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [customChore, setCustomChore] = useState('');
  const [customExpenseTitle, setCustomExpenseTitle] = useState('');
  const [customExpenseAmount, setCustomExpenseAmount] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null); // Track open dropdown

  // Predetermined members (replace with dynamic data if needed)
  const predeterminedMembers = [
    { id: "adam", name: "Adam" },
    { id: "ayoub", name: "Ayoub" },
    { id: "jordan", name: "Jordan" },
  ];

  // Example chores and expenses
  const exampleChores = [
    "Clean Kitchen", "Take out Trash", "Vacuum Living Room", 
    "Wash Dishes", "Mop Floors", "Clean Bathroom", 
    "Dust Furniture", "Water Plants", "Organize Closet",
    "Sweep Balcony", "Wipe Down Counters"
  ];
  
  const exampleExpenses = [
    "Groceries", "Internet Bill", "Electricity Bill", 
    "Rent", "Water Bill", "Gas Bill", "Streaming Services",
    "Maintenance Fee"
  ];

  // Fetch apartment data, tasks, and expenses
  useEffect(() => {
    const apartmentRef = doc(db, "apartments", apartmentId);
    const tasksQuery = query(collection(apartmentRef, "tasks"));
    const expensesQuery = query(collection(apartmentRef, "expenses"));

    const unsubscribeApartment = onSnapshot(apartmentRef, (doc) => {
      if (doc.exists()) {
        setApartmentData({
          id: doc.id,
          ...doc.data(),
        });
      }
    });

    const unsubscribeTasks = onSnapshot(tasksQuery, (querySnapshot) => {
      const tasksData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "Pending",
      }));
      setTasks(tasksData);
    });

    const unsubscribeExpenses = onSnapshot(expensesQuery, (querySnapshot) => {
      const expensesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        status: doc.data().status || "Pending",
      }));
      setExpenses(expensesData);
      setLoading(false);
    });

    return () => {
      unsubscribeApartment();
      unsubscribeTasks();
      unsubscribeExpenses();
    };
  }, [apartmentId]);

  // Toggle task status
  const toggleTaskStatus = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    const newStatus = 
      task.status === "Pending" 
        ? "In Progress" 
        : task.status === "In Progress" 
          ? "Finished" 
          : "Pending";
    
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "tasks", taskId), { status: newStatus });
    } catch (error) {
      Alert.alert("Error updating task status:", error.message);
    }
  };

  // Toggle expense status
  const toggleExpenseStatus = async (expenseId) => {
    const expense = expenses.find((e) => e.id === expenseId);
    const newStatus = 
      expense.status === "Pending" 
        ? "In Progress" 
        : expense.status === "In Progress" 
          ? "Finished" 
          : "Pending";
    
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "expenses", expenseId), { status: newStatus });
    } catch (error) {
      Alert.alert("Error updating expense status:", error.message);
    }
  };

  // Assign member to task via dropdown
  const assignMemberToTask = async (taskId, memberId) => {
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "tasks", taskId), { assignedTo: memberId });
      setActiveDropdown(null); // Close dropdown
    } catch (error) {
      Alert.alert("Error assigning chore:", error.message);
    }
  };

  // Assign member to expense via dropdown
  const assignMemberToExpense = async (expenseId, memberId) => {
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "expenses", expenseId), { paidBy: memberId });
      setActiveDropdown(null); // Close dropdown
    } catch (error) {
      Alert.alert("Error assigning expense:", error.message);
    }
  };

  // Add chores from modal
  const handleAddChores = async () => {
    try {
      selectedChores.forEach(async (title) => {
        await addDoc(collection(db, "apartments", apartmentId, "tasks"), {
          title,
          assignedTo: "",
          dueDate: new Date().toISOString().split('T')[0],
          status: "Pending",
        });
      });
      if (customChore.trim()) {
        await addDoc(collection(db, "apartments", apartmentId, "tasks"), {
          title: customChore,
          assignedTo: "",
          dueDate: new Date().toISOString().split('T')[0],
          status: "Pending",
        });
        setCustomChore("");
      }
      setSelectedChores([]);
      setIsChoreModalVisible(false);
      Alert.alert("Chores added successfully!");
    } catch (error) {
      Alert.alert("Error adding chores:", error.message);
    }
  };

  // Add expenses from modal
  const handleAddExpenses = async () => {
    try {
      selectedExpenses.forEach(async (title) => {
        await addDoc(collection(db, "apartments", apartmentId, "expenses"), {
          title,
          amount: 0,
          paidBy: "",
          date: new Date().toISOString().split('T')[0],
          status: "Pending",
        });
      });
      if (customExpenseTitle.trim() && customExpenseAmount) {
        await addDoc(collection(db, "apartments", apartmentId, "expenses"), {
          title: customExpenseTitle,
          amount: parseFloat(customExpenseAmount),
          paidBy: "",
          date: new Date().toISOString().split('T')[0],
          status: "Pending",
        });
        setCustomExpenseTitle("");
        setCustomExpenseAmount("");
      }
      setSelectedExpenses([]);
      setIsExpenseModalVisible(false);
      Alert.alert("Expenses added successfully!");
    } catch (error) {
      Alert.alert("Error adding expenses:", error.message);
    }
  };

  // Render a single chore with dropdown
const renderChore = ({ item }) => (
  <View style={styles.taskCard}>
    <TouchableOpacity 
      style={styles.taskHeader}
      onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
    >
      <Text style={styles.taskTitle}>{item.title}</Text>
      <TouchableOpacity 
        style={[
          styles.statusBadge,
          item.status === "Pending" && styles.pendingBadge,
          item.status === "In Progress" && styles.inProgressBadge,
          item.status === "Finished" && styles.completedBadge,
        ]}
        onPress={() => toggleTaskStatus(item.id)}
      >
        <Text style={styles.statusText}>{item.status}</Text>
      </TouchableOpacity>
    </TouchableOpacity>

    {/* Assigned Member Info */}
    <View style={styles.assignContainer}>
      <Text style={styles.assignedTo}>
        Assigned to: {apartmentData.members.find(m => m.id === item.assignedTo)?.name || "Unassigned"}
      </Text>
      <TouchableOpacity 
        style={styles.assignButton} 
        onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
      >
        <Text style={styles.assignButtonText}>Assign</Text>
      </TouchableOpacity>
    </View>

    {/* Accordion Dropdown for Members */}
    {activeDropdown === item.id && (
      <View style={styles.dropdown}>
        {predeterminedMembers.map((member) => (
          <TouchableOpacity 
            key={member.id}
            style={styles.dropdownItem}
            onPress={() => assignMemberToTask(item.id, member.id)}
          >
            <Text>{member.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

// Render a single expense with dropdown
const renderExpense = ({ item }) => (
  <View style={styles.expenseCard}>
    <TouchableOpacity 
      style={styles.taskHeader}
      onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
    >
      <Text style={styles.expenseTitle}>{item.title}</Text>
      <TouchableOpacity 
        style={[
          styles.statusBadge,
          item.status === "Pending" && styles.pendingBadge,
          item.status === "In Progress" && styles.inProgressBadge,
          item.status === "Finished" && styles.completedBadge,
        ]}
        onPress={() => toggleExpenseStatus(item.id)}
      >
        <Text style={styles.statusText}>{item.status}</Text>
      </TouchableOpacity>
    </TouchableOpacity>

    {/* Expense Details */}
    <View style={styles.expenseDetails}>
      <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
      <Text style={styles.assignedTo}>
        Paid by: {apartmentData.members.find(m => m.id === item.paidBy)?.name || "Unassigned"}
      </Text>
      <TouchableOpacity 
        style={styles.assignButton} 
        onPress={() => setActiveDropdown(activeDropdown === item.id ? null : item.id)}
      >
        <Text style={styles.assignButtonText}>Assign</Text>
      </TouchableOpacity>
    </View>

    {/* Accordion Dropdown for Members */}
    {activeDropdown === item.id && (
      <View style={styles.dropdown}>
        {predeterminedMembers.map((member) => (
          <TouchableOpacity 
            key={member.id}
            style={styles.dropdownItem}
            onPress={() => assignMemberToExpense(item.id, member.id)}
          >
            <Text>{member.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    )}
  </View>
);

  if (loading || !apartmentData) {
    return <ActivityIndicator size="large" color="#007AFF" />;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{apartmentData.name}</Text>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
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
          style={styles.addButton} 
          onPress={() => setIsChoreModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Chore</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setIsExpenseModalVisible(true)}
        >
          <Text style={styles.addButtonText}>Add Expense</Text>
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

      {/* Content */}
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

      {/* Chore Modal */}
      <Modal visible={isChoreModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Chores</Text>
            <FlatList
              data={exampleChores}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.exampleItem,
                    selectedChores.includes(item) && styles.selectedItem,
                  ]}
                  onPress={() => setSelectedChores(prev => 
                    prev.includes(item) 
                      ? prev.filter(c => c !== item) 
                      : [...prev, item]
                  )}
                >
                  <Text>{item}</Text>
                  <MaterialCommunityIcons 
                    name={selectedChores.includes(item) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24} 
                    color="#007AFF"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TextInput
              placeholder="Custom Chore"
              value={customChore}
              onChangeText={setCustomChore}
              style={styles.input}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddChores}>
              <Text style={styles.modalButtonText}>Add Chores</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setIsChoreModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Expense Modal */}
      <Modal visible={isExpenseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Expenses</Text>
            <FlatList
              data={exampleExpenses}
              numColumns={2}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.exampleItem,
                    selectedExpenses.includes(item) && styles.selectedItem,
                  ]}
                  onPress={() => setSelectedExpenses(prev => 
                    prev.includes(item) 
                      ? prev.filter(e => e !== item) 
                      : [...prev, item]
                  )}
                >
                  <Text>{item}</Text>
                  <MaterialCommunityIcons 
                    name={selectedExpenses.includes(item) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24} 
                    color="#007AFF"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item}
            />
            <TextInput
              placeholder="Custom Expense Title"
              value={customExpenseTitle}
              onChangeText={setCustomExpenseTitle}
              style={styles.input}
            />
            <TextInput
              placeholder="Amount"
              value={customExpenseAmount}
              onChangeText={setCustomExpenseAmount}
              keyboardType="numeric"
              style={styles.input}
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleAddExpenses}>
              <Text style={styles.modalButtonText}>Add Expenses</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setIsExpenseModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    backgroundColor: '#007AFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  backButton: {
    padding: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 10,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    paddingVertical: 15,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  listContainer: {
    padding: 20,
  },
  taskCard: {
    backgroundColor: 'white',
    borderRadius: 10,
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
    padding: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    backgroundColor: '#f9f9f9',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
  },
  inProgressBadge: {
    backgroundColor: '#FFF9C4',
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  assignContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  assignedTo: {
    color: '#666',
    fontSize: 14,
  },
  assignButton: {
    backgroundColor: '#FF9500',
    padding: 5,
    borderRadius: 5,
  },
  assignButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  dropdown: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginHorizontal: 15,
    marginBottom: 10,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  expenseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    elevation: 2,
  },
  expenseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  expenseDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingBottom: 10,
  },
  expenseAmount: {
    fontSize: 14,
    color: '#666',
  },
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
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  exampleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    backgroundColor: '#f9f9f9',
  },
  selectedItem: {
    backgroundColor: '#E8F5E9',
    borderColor: '#007AFF',
  },
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
  modalButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});