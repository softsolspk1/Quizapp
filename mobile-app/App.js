import 'react-native-gesture-handler';
import 'react-native-reanimated';
import { enableScreens } from 'react-native-screens';
enableScreens();
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

// Context
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Screens
import SplashScreenComponent from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import CompetitionScreen from './src/screens/CompetitionScreen';
import CompetitionLeaderboardScreen from './src/screens/CompetitionLeaderboardScreen';
import QuizScreen from './src/screens/QuizScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';
import MultiplayerScreen from './src/screens/MultiplayerScreen';
import MultiplayerQuizScreen from './src/screens/MultiplayerQuizScreen';
import PinQuizScreen from './src/screens/PinQuizScreen';
import WardActivitiesScreen from './src/screens/WardActivitiesScreen';
import SupportScreen from './src/screens/SupportScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import ChatListScreen from './src/screens/ChatListScreen';
import ChatRoomScreen from './src/screens/ChatRoomScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}

import FooterBanner from './src/components/FooterBanner';
import { View } from 'react-native';

function MainTabs() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Leaderboard') {
              iconName = focused ? 'trophy' : 'trophy-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#db2777',
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
      <FooterBanner />
    </View>
  );
}

function DrawerNavigator() {
  return (
    <Drawer.Navigator
      useLegacyImplementation={false}
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: '#db2777',
        drawerInactiveTintColor: '#4b5563',
        drawerLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 16,
        },
      }}
    >
      <Drawer.Screen 
        name="HomeTabs" 
        component={MainTabs} 
        options={{
          title: 'Home',
          drawerIcon: ({ color }) => (
            <Ionicons name="home-outline" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="WardActivities" 
        component={WardActivitiesScreen} 
        options={{
          title: 'Ward Activity',
          drawerIcon: ({ color }) => (
            <Ionicons name="medical-outline" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
        options={{
          title: 'Notifications',
          drawerIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={24} color={color} />
          )
        }}
      />
      <Drawer.Screen 
        name="Messages" 
        component={ChatListScreen} 
        options={{
          title: 'Messages',
          drawerIcon: ({ color }) => (
            <Ionicons name="chatbubbles-outline" size={24} color={color} />
          )
        }}
      />
    </Drawer.Navigator>
  );
}

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <SplashScreenComponent />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, detachInactiveScreens: false }}>
        {user ? (
          <>
            <Stack.Screen name="Drawer" component={DrawerNavigator} />
            <Stack.Screen name="Category" component={CategoryScreen} />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="Quiz" component={QuizScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
            <Stack.Screen name="Multiplayer" component={MultiplayerScreen} />
            <Stack.Screen name="MultiplayerQuiz" component={MultiplayerQuizScreen} />
            <Stack.Screen name="Competition" component={CompetitionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CompetitionLeaderboard" component={CompetitionLeaderboardScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PinQuiz" component={PinQuizScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthStack} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts
        await Font.loadAsync({
          'Inter-Regular': require('./assets/fonts/Inter-Regular.ttf'),
          'Inter-Medium': require('./assets/fonts/Inter-Medium.ttf'),
          'Inter-SemiBold': require('./assets/fonts/Inter-SemiBold.ttf'),
          'Inter-Bold': require('./assets/fonts/Inter-Bold.ttf'),
        });
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreen.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="auto" />
          <Toast />
        </AuthProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}


