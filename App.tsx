import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from './src/constants';
import { RootStackParamList } from './src/types';
import * as notif from './src/services/notifications';

import HomeScreen from './src/screens/HomeScreen';
import TasksScreen from './src/screens/TasksScreen';
import AIAssistantScreen from './src/screens/AIAssistantScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import TaskDetailScreen from './src/screens/TaskDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  const bg = isDark ? '#0A0A0F' : '#F5F5FF';
  const border = isDark ? '#2A2A3A' : '#E8E8F0';
  const inactive = isDark ? '#55556A' : '#9999BB';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: bg, borderTopColor: border, height: 80, paddingBottom: 20 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: inactive,
        tabBarIcon: ({ focused, color, size }) => {
          const icons: Record<string, string> = {
            Home: 'home',
            Tasks: 'check-square',
            AI: 'zap',
            Profile: 'settings',
          };
          return <Feather name={icons[route.name] as any} size={22} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => (
          <Text style={{ color, fontSize: 11, fontWeight: focused ? '700' : '500' }}>
            {route.name === 'AI' ? 'AI Chat' : route.name}
          </Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Tasks" component={TasksScreen} />
      <Tab.Screen
        name="AI"
        component={AIAssistantScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[tabStyles.aiTab, { backgroundColor: COLORS.primary }]}>
              <Feather name="zap" size={22} color="#fff" />
            </View>
          ),
        }}
      />
      <Tab.Screen name="Profile" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  aiTab: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
});

export default function App() {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';

  useEffect(() => {
    notif.requestNotificationPermissions();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="TaskDetail" component={TaskDetailScreen} />
            <Stack.Screen
              name="AddTask"
              component={AddTaskScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="EditTask"
              component={AddTaskScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen
              name="AIAssistant"
              component={AIAssistantScreen}
              options={{ presentation: 'fullScreenModal' }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
