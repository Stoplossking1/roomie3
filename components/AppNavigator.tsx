// AppNavigator.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import ApartmentScreen from '../screens/ApartmentsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ApartmentDashboard from '../screens/ApartmentDashboard'; // Import RoomDashboard
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Create a stack navigator for the "Apartment" tab
function ApartmentStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ApartmentScreen" component={ApartmentScreen} />
      <Stack.Screen name="ApartmentDashboard" component={ApartmentDashboard} />
    </Stack.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Apartment') {
              iconName = 'home-outline';
            } else if (route.name === 'Profile') {
              iconName = 'account-outline';
            }

            return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#666',
          tabBarStyle: {
            height: 70,
            borderTopWidth: 1,
            borderTopColor: '#ddd',
            elevation: 4,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarLabelStyle: {
            fontSize: 14,
            marginBottom: 5,
          },
        })}
      >
        {/* Apartment Tab */}
        <Tab.Screen
          name="Apartment"
          component={ApartmentStack}
          options={{ headerShown: false }}
        />

        {/* Profile Tab */}
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}