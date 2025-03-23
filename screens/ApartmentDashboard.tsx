import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Image, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../components/firebase';
import { collection, doc, query, onSnapshot, addDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

export default function ApartmentDashboard({ navigation, route }) {
  const { apartmentId } = route.params;
  const [activeTab, setActiveTab] = useState('tasks');
  const [apartmentData, setApartmentData] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals for adding chores/expenses
  const [isChoreModalVisible, setIsChoreModalVisible] = useState(false);
  const [isExpenseModalVisible, setIsExpenseModalVisible] = useState(false);
  const [selectedChores, setSelectedChores] = useState([]);
  const [selectedExpenses, setSelectedExpenses] = useState([]);
  const [customChore, setCustomChore] = useState('');
  const [customExpenseTitle, setCustomExpenseTitle] = useState('');
  const [customExpenseAmount, setCustomExpenseAmount] = useState('');
  
  // New state for assignment modals
  const [isAssignChoreModalVisible, setIsAssignChoreModalVisible] = useState(false);
  const [isAssignExpenseModalVisible, setIsAssignExpenseModalVisible] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedExpenseId, setSelectedExpenseId] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);

  // Example chores and expenses
  const exampleChores = ["Clean Kitchen", "Take out Trash", "Vacuum Living Room", "Wash Dishes", "Mop Floors"];
  const exampleExpenses = ["Groceries", "Internet Bill", "Electricity Bill", "Rent"];

  // Fetch apartment data, tasks, and expenses
  useEffect(() => {
    const apartmentRef = doc(db, "apartments", apartmentId);
    const tasksQuery = query(collection(apartmentRef, "tasks"));
    const expensesQuery = query(collection(apartmentRef, "expenses"));
  
    const unsubscribeApartment = onSnapshot(apartmentRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const members = Array.isArray(data.members) ? data.members : [];
        try {
          const memberDetails = await Promise.all(
            members.map(async (memberId) => {
              const userSnapshot = await getDoc(doc(db, "users", memberId));
              return userSnapshot.exists() ? { id: memberId, ...userSnapshot.data() } : null;
            })
          );
          setApartmentData({
            id: docSnap.id,
            name: data.name || "Unnamed Apartment",
            address: data.address || "No Address",
            members: memberDetails.filter(Boolean),
          });
        } catch (error) {
          console.error("Error fetching member details:", error);
          setApartmentData(null); // Set to null if there's an error
        }
      } else {
        console.error("Apartment document does not exist.");
        setApartmentData(null); // Set to null if the document doesn't exist
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

  // Add chores from modal
  const handleAddChores = async () => {
    try {
      selectedChores.forEach(async (title) => {
        await addDoc(collection(db, "apartments", apartmentId, "tasks"), {
          title,
          assignedTo: "",
          dueDate: new Date().toISOString().split('T')[0],
          completed: false,
        });
      });
      if (customChore.trim()) {
        await addDoc(collection(db, "apartments", apartmentId, "tasks"), {
          title: customChore,
          assignedTo: "",
          dueDate: new Date().toISOString().split('T')[0],
          completed: false,
        });
        setCustomChore("");
      }
      setSelectedChores([]);
      setIsChoreModalVisible(false);
      alert("Chores added successfully!");
    } catch (error) {
      alert("Error adding chores: " + error.message);
    }
  };

  // Add expenses from modal
  const handleAddExpenses = async () => {
    try {
      selectedExpenses.forEach(async (title) => {
        const amount = prompt(`Enter amount for "${title}":`);
        if (amount) {
          await addDoc(collection(db, "apartments", apartmentId, "expenses"), {
            title,
            amount: parseFloat(amount),
            paidBy: "",
            date: new Date().toISOString().split('T')[0],
          });
        }
      });
      if (customExpenseTitle.trim() && customExpenseAmount) {
        await addDoc(collection(db, "apartments", apartmentId, "expenses"), {
          title: customExpenseTitle,
          amount: parseFloat(customExpenseAmount),
          paidBy: "",
          date: new Date().toISOString().split('T')[0],
        });
        setCustomExpenseTitle("");
        setCustomExpenseAmount("");
      }
      setSelectedExpenses([]);
      setIsExpenseModalVisible(false);
      alert("Expenses added successfully!");
    } catch (error) {
      alert("Error adding expenses: " + error.message);
    }
  };

  // Assign chore to a member
  const handleAssignChore = async () => {
    if (!selectedMember) {
      alert("Please select a member.");
      return;
    }
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "tasks", selectedTaskId), {
        assignedTo: selectedMember,
      });
      alert("Chore assigned successfully!");
      setIsAssignChoreModalVisible(false);
      setSelectedMember(null);
    } catch (error) {
      alert("Error assigning chore: " + error.message);
    }
  };

  // Assign expense to a member
  const handleAssignExpense = async () => {
    if (!selectedMember) {
      alert("Please select a member.");
      return;
    }
    try {
      await updateDoc(doc(db, "apartments", apartmentId, "expenses", selectedExpenseId), {
        paidBy: selectedMember,
      });
      alert("Expense assigned successfully!");
      setIsAssignExpenseModalVisible(false);
      setSelectedMember(null);
    } catch (error) {
      alert("Error assigning expense: " + error.message);
    }
  };

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
        <Text style={styles.assignedTo}>Assigned to: {item.assignedToName || "Unassigned"}</Text>
        <TouchableOpacity 
          style={styles.assignButton} 
          onPress={() => {
            setSelectedTaskId(item.id);
            setIsAssignChoreModalVisible(true);
          }}
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
        onPress={() => {
          setSelectedExpenseId(item.id);
          setIsAssignExpenseModalVisible(true);
        }}
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

      {/* Chore Modal */}
      <Modal visible={isChoreModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Chores</Text>
            <FlatList
              data={exampleChores}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.exampleItem}
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
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsChoreModalVisible(false)}>
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
              renderItem={({ item }) => (
                <View style={styles.exampleExpenseContainer}>
                  <Text>{item}</Text>
                  <TextInput
                    placeholder="Amount"
                    keyboardType="numeric"
                    onChangeText={(amount) => {
                      setSelectedExpenses((prev) => 
                        prev.map((exp) => exp.title === item ? { ...exp, amount } : exp)
                      );
                    }}
                    style={styles.amountInput}
                  />
                  <MaterialCommunityIcons 
                    name={selectedExpenses.some(exp => exp.title === item) ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24} 
                    color="#007AFF"
                    onPress={() => {
                      setSelectedExpenses((prev) => 
                        prev.some(exp => exp.title === item)
                          ? prev.filter(exp => exp.title !== item)
                          : [...prev, { title: item, amount: 0 }]
                      );
                    }}
                  />
                </View>
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
            <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsExpenseModalVisible(false)}>
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Chore Modal */}
      <Modal visible={isAssignChoreModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Chore to Member</Text>
            <FlatList
              data={apartmentData.members}
              renderItem={({ item: member }) => (
                <TouchableOpacity 
                  style={styles.memberItem}
                  onPress={() => setSelectedMember(member.id)}
                >
                  <Text>{member.name}</Text>
                  <MaterialCommunityIcons 
                    name={selectedMember === member.id ? "radiobox-marked" : "radiobox-blank"}
                    size={24} 
                    color="#007AFF"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(member) => member.id}
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleAssignChore}
              disabled={!selectedMember}
            >
              <Text style={styles.modalButtonText}>Confirm Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setIsAssignChoreModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Assign Expense Modal */}
      <Modal visible={isAssignExpenseModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Assign Expense to Member</Text>
            <FlatList
              data={apartmentData.members}
              renderItem={({ item: member }) => (
                <TouchableOpacity 
                  style={styles.memberItem}
                  onPress={() => setSelectedMember(member.id)}
                >
                  <Text>{member.name}</Text>
                  <MaterialCommunityIcons 
                    name={selectedMember === member.id ? "radiobox-marked" : "radiobox-blank"}
                    size={24} 
                    color="#007AFF"
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(member) => member.id}
            />
            <TouchableOpacity 
              style={styles.modalButton} 
              onPress={handleAssignExpense}
              disabled={!selectedMember}
            >
              <Text style={styles.modalButtonText}>Confirm Assignment</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setIsAssignExpenseModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
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
  exampleItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
  },
  exampleExpenseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  amountInput: {
    width: 100,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginHorizontal: 10,
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
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 10,
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