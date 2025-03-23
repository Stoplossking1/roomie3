import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, FlatList, Modal, Alert, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../components/firebase';
import { onSnapshot, doc, collection, query, where, addDoc, deleteDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

export default function ProfileScreen({ navigation, route }) {
  const [userProfile, setUserProfile] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [ratings, setRatings] = useState([]);
  const [isMenuVisible, setIsMenuVisible] = useState(false); // Controls the visibility of the popup menu
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [newRating, setNewRating] = useState(0);
  const [comment, setComment] = useState('');
  const [hasRated, setHasRated] = useState(false);

  const profileUserId = route.params?.userId; // Get the profile user ID from route params

  // Check if profileUserId is defined
  if (!profileUserId) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>User ID is missing. Please go back and try again.</Text>
      </SafeAreaView>
    );
  }

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, "users", profileUserId);
        const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile(docSnap.data());
          } else {
            console.error("User profile not found");
          }
        });

        return () => unsubscribeUser();
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [profileUserId]);

  // Fetch rooms for the user
  useEffect(() => {
    if (!userProfile?.email) {
      return; // Wait until userProfile is populated
    }

    const fetchRooms = async () => {
      try {
        const roomsRef = collection(db, "rooms");
        const q = query(roomsRef, where("members", "array-contains", userProfile.email));
        const unsubscribeRooms = onSnapshot(q, (querySnapshot) => {
          const roomsData = [];
          querySnapshot.forEach((doc) => {
            roomsData.push({ id: doc.id, ...doc.data() });
          });
          setRooms(roomsData);
        });

        return () => unsubscribeRooms();
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, [userProfile?.email]);

  // Fetch ratings for the user
  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const ratingsRef = collection(db, "ratings");
        const q = query(ratingsRef, where("userId", "==", profileUserId));
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const ratingsData = [];
          querySnapshot.forEach((doc) => {
            ratingsData.push({ id: doc.id, ...doc.data() });
          });
          setRatings(ratingsData);

          // Check if the current user has already rated this profile
          const currentUserRating = ratingsData.find((rating) => rating.raterId === auth.currentUser.uid);
          setHasRated(!!currentUserRating);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching ratings:", error);
      }
    };

    fetchRatings();
  }, [profileUserId]);

  // Handle rating submission
  const handleSubmitRating = async () => {
    if (!comment.trim() || comment.split(' ').length < 5) {
      Alert.alert('Error', 'Please provide a valid comment with at least 5 words.');
      return;
    }

    try {
      // Prevent self-rating
      if (auth.currentUser.uid === profileUserId) {
        Alert.alert('Error', 'You cannot rate yourself.');
        return;
      }

      // Prevent multiple ratings
      if (hasRated) {
        Alert.alert('Error', 'You have already rated this user.');
        return;
      }

      // Add the new rating to Firestore
      await addDoc(collection(db, "ratings"), {
        userId: profileUserId,
        raterId: auth.currentUser.uid,
        rating: newRating,
        comment: comment.trim(),
        createdAt: new Date(),
      });

      // Reset form and close modal
      setNewRating(0);
      setComment('');
      setRatingModalVisible(false);
      setHasRated(true);
      Alert.alert('Success', 'Your rating has been submitted.');
    } catch (error) {
      console.error('Submit rating error:', error.message);
      Alert.alert('Error', 'Failed to submit rating.');
    }
  };

  // Handle rating deletion
  const handleDeleteRating = async (ratingId) => {
    try {
      const ratingRef = doc(db, "ratings", ratingId);
      await deleteDoc(ratingRef);
      Alert.alert('Success', 'Your rating has been deleted.');
    } catch (error) {
      console.error('Delete rating error:', error.message);
      Alert.alert('Error', 'Failed to delete rating.');
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Auth');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity onPress={() => setIsMenuVisible(true)}>
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Scrollable Content */}
      <ScrollView style={styles.scrollContainer}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: userProfile?.avatar || 'https://api.a0.dev/assets/image?text=user%20profile%20picture&aspect=1:1' }}
            style={styles.avatar}
          />
          <Text style={styles.profileName}>{userProfile?.name || 'Loading...'}</Text>
          <Text style={styles.profileEmail}>{userProfile?.email || 'Loading...'}</Text>
        </View>

        {/* Rooms Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <FlatList
            data={rooms}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Text style={styles.roomItem}>{item.name}</Text>
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Ratings Section */}
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
                {item.raterId === auth.currentUser.uid && (
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteRating(item.id)}
                  >
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            scrollEnabled={false}
          />
        </View>

        {/* Rate User Button */}
        <TouchableOpacity
          style={[styles.rateButton, (hasRated || auth.currentUser.uid === profileUserId) && styles.disabledButton]}
          onPress={() => {
            if (auth.currentUser.uid === profileUserId) {
              Alert.alert('Error', 'You cannot rate yourself.');
            } else if (hasRated) {
              Alert.alert('Error', 'You have already rated this user.');
            } else {
              setRatingModalVisible(true);
            }
          }}
          disabled={hasRated || auth.currentUser.uid === profileUserId}
        >
          <Text style={styles.rateButtonText}>
            {auth.currentUser.uid === profileUserId
              ? 'You cannot rate yourself'
              : hasRated
              ? 'Already Rated'
              : 'Rate This User'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Rating Modal */}
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

      {/* Popup Menu Modal */}
      <Modal visible={isMenuVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setIsMenuVisible(false)} // Close the menu when tapping outside
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('EditProfile', { userId: profileUserId });
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
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuVisible(false);
                handleLogout();
              }}
            >
              <Text style={styles.menuText}>Logout</Text>
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
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
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
    marginBottom: 10,
  },
  roomItem: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  ratingItem: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 5,
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  rateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
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
    width: '60%',
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
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});