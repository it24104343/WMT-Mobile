import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ClassesScreen from './src/screens/ClassesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import StudentManagementScreen from './src/screens/StudentManagementScreen';
import TeacherManagementScreen from './src/screens/TeacherManagementScreen';
import ClassManagementScreen from './src/screens/ClassManagementScreen';
import PaymentManagementScreen from './src/screens/PaymentManagementScreen';
import AttendanceExamScreen from './src/screens/AttendanceExamScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';

import { View, Text } from 'react-native';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
};

const AppStack = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#16213e',
          borderTopColor: '#22c55e',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📊</Text>,
        }}
      />
      <Tab.Screen
        name="Students"
        component={StudentManagementScreen}
        options={{
          tabBarLabel: 'Students',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👨‍🎓</Text>,
        }}
      />
      <Tab.Screen
        name="Teachers"
        component={TeacherManagementScreen}
        options={{
          tabBarLabel: 'Teachers',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👨‍🏫</Text>,
        }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassManagementScreen}
        options={{
          tabBarLabel: 'Classes',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📚</Text>,
        }}
      />
      <Tab.Screen
        name="Payments"
        component={PaymentManagementScreen}
        options={{
          tabBarLabel: 'Payments',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>💳</Text>,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceExamScreen}
        options={{
          tabBarLabel: 'Attendance',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text>,
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🔔</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const RootNavigator = () => {
  const { state } = React.useContext(AuthContext);

  return (
    <NavigationContainer>
      {state.isLoading ? (
        <Stack.Navigator>
          <Stack.Screen
            name="SplashScreen"
            component={() => (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
                <Text style={{ color: '#fff', fontSize: 18 }}>Loading...</Text>
              </View>
            )}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      ) : state.user ? (
        <AppStack />
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
