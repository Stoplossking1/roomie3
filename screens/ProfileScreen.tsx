import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../components/firebase';
import { onSnapshot, doc, collection, query, where, addDoc, getDocs } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function ProfileScreen({ navigation }) {
  const [userProfile, setUserProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser.uid);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          }
        });

        const roomsRef = collection(db, "rooms");
        const q = query(roomsRef, where("members", "array-contains", auth.currentUser.email));
        const unsubscribeRooms = onSnapshot(q, (querySnapshot) => {
          const roomsData = [];
          querySnapshot.forEach((doc) => {
            roomsData.push({ id: doc.id, ...doc.data() });
          });
          setRooms(roomsData);
        });

        return () => {
          unsubscribeUser();
          unsubscribeRooms();
        };
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("userId", "==", auth.currentUser.uid));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ratingsData = [];
          querySnapshot.forEach((doc) => {
            ratingsData.push({ id: doc.id, ...doc.data() });
          });
          setRatings(ratingsData);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    fetchRatings();
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Signing out...');
      await signOut(auth);
      console.log('Signed out successfully');
      navigation.replace('Auth'); // Navigate to the Auth screen
    } catch (error) {
      console.error('Logout error:', error.message);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const handleSubmitRating = async () => {
    if (!comment.trim() || comment.split(' ').length < 5) {
      Alert.alert('Error', 'Please provide a valid comment with at least 5 words.');
      return;
    }

    try {
      await addDoc(collection(db, "ratings"), {
        userId: auth.currentUser.uid,
        rating: newRating,
        comment: comment.trim(),
        createdAt: new Date(),
      });

      setNewRating(0);
      setComment('');
      setRatingModalVisible(false);
      Alert.alert('Success', 'Your rating has been submitted.');
    } catch (error) {
      console.error('Submit rating error:', error.message);
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileHeader}>
        <Image
          source={{ uri: userProfile?.avatar || 'https://api.a0.dev/assets/image?text=user%20profile%20picture&aspect=1:1' }}
          style={styles.avatar}
        />
        <Text style={styles.profileName}>{userProfile?.name || 'Loading...'}</Text>
        <Text style={styles.profileEmail}>{userProfile?.email || 'Loading...'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rooms</Text>
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Text style={styles.roomItem}>{item.name}</Text>
          )}
          contentContainerStyle={styles.roomsContainer}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ratings</Text>
        <FlatList
          data={ratings}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.ratingItem}>
              <Text style={styles.ratingText}>
                {Array(item.rating).fill('★').join('')} ({item.rating}/5)
              </Text>
              <Text style={styles.commentText}>{item.comment}</Text>
            </View>
          )}
          contentContainerStyle={styles.ratingsContainer}
        />
      </View>

      <TouchableOpacity
        style={styles.rateButton}
        onPress={() => setRatingModalVisible(true)}
      >
        <Text style={styles.rateButtonText}>Rate This User</Text>
      </TouchableOpacity>

      <Modal visible={isMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('EditProfile');
              }}
            >
              <Text style={styles.menuText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('Settings');
              }}
            >
              <Text style={styles.menuText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={ratingModalVisible} transparent={true} animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setRatingModalVisible(false)}>
          <View style={styles.ratingModalContainer}>
            <Text style={styles.ratingModalTitle}>Rate This User</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setNewRating(star)}
                >
                  <MaterialCommunityIcons
                    name={star <= newRating ? 'star' : 'star-outline'}
                    size={32}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment (min 5 words)"
              value={comment}
              onChangeText={setComment}
              multiline={true}
            />
            <TouchableOpacity
              style={styles.submitRatingButton}
              onPress={handleSubmitRating}
            >
              <Text style={styles.submitRatingText}>Submit Rating</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
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
  profileHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 20,
    marginBottom: 10,
  },
  roomsContainer: {
    paddingHorizontal: 20,
  },
  roomItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  ratingsContainer: {
    paddingHorizontal: 20,
  },
  ratingItem: {
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  commentText: {
    fontSize: 14,
    color: '#666',
  },
  rateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  rateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  menuItem: {
    paddingVertical: 10,
  },
  menuText: {
    fontSize: 16,
    color: '#007AFF',
  },
  ratingModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  ratingModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentInput: {
    width: '100%',
    height: 80,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  submitRatingButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  submitRatingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});