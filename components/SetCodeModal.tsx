import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db } from '../components/firebase';
import { doc, updateDoc } from "firebase/firestore";

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

const styles = StyleSheet.create({
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

export default SetCodeModal;