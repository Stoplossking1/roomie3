import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import { Toaster } from 'sonner-native';
import AuthScreen from "./screens/AuthScreen"
import RoomsScreen from "./screens/RoomsScreen"
import RoomDashboard from "./screens/RoomDashboard"

const Stack = createNativeStackNavigator();

function RootStack() {
  return (    <Stack.Navigator screenOptions={{
      headerShown: false
    }}>
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Rooms" component={RoomsScreen} />
      <Stack.Screen name="RoomDashboard" component={RoomDashboard} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <Toaster />
      <NavigationContainer>
        <RootStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});