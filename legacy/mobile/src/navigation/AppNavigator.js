import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, ActivityIndicator, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme';

import LoginScreen         from '../screens/auth/LoginScreen';
import RegisterScreen      from '../screens/auth/RegisterScreen';
import FeedScreen          from '../screens/FeedScreen';
import JournalDetailScreen from '../screens/JournalDetailScreen';
import CreateJournalScreen from '../screens/CreateJournalScreen';
import SearchScreen        from '../screens/SearchScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import UserProfileScreen   from '../screens/UserProfileScreen';
import ProfileScreen       from '../screens/ProfileScreen';
import JournalBudgetScreen from '../screens/JournalBudgetScreen';
import JournalPackingScreen from '../screens/JournalPackingScreen';
import MeetwaysScreen      from '../screens/MeetwaysScreen';
import MeetwayDetailScreen from '../screens/MeetwayDetailScreen';
import CreateMeetwayScreen from '../screens/CreateMeetwayScreen';
import TravelLensScreen    from '../screens/TravelLensScreen';
import AIPlannerScreen     from '../screens/AIPlannerScreen';
import JustSplitScreen     from '../screens/JustSplitScreen';
import JustSplitDetailScreen from '../screens/JustSplitDetailScreen';

const Stack = createNativeStackNavigator();
const Tab   = createBottomTabNavigator();

const HDR = {
  headerStyle: { backgroundColor: C.surface },
  headerTintColor: C.text,
  headerTitleStyle: { fontWeight: '700', color: C.text, fontSize: 16 },
  headerShadowVisible: false,
};

function TabIcon({ emoji, focused }) {
  return (
    <Text style={{ fontSize: focused ? 22 : 19, opacity: focused ? 1 : 0.45 }}>
      {emoji}
    </Text>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 10,
          paddingTop: 6,
        },
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Explore"
        component={FeedScreen}
        options={{
          tabBarLabel: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🧭" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Meetways"
        component={MeetwaysScreen}
        options={{
          tabBarLabel: 'Meetways',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="TravelLens"
        component={TravelLensScreen}
        options={{
          tabBarLabel: 'Flights',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✈️" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="JustSplit"
        component={JustSplitScreen}
        options={{
          tabBarLabel: 'JustSplit',
          tabBarIcon: ({ focused }) => <TabIcon emoji="💰" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: C.primary, fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 }}>Roamera</Text>
        <ActivityIndicator color={C.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: C.bg },
          headerShown: false,
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="JournalDetail"
              component={JournalDetailScreen}
              options={{ ...HDR, headerShown: true, title: 'Journal' }}
            />
            <Stack.Screen
              name="CreateJournal"
              component={CreateJournalScreen}
              options={{ ...HDR, headerShown: true, title: 'New Journal' }}
            />
            <Stack.Screen
              name="Search"
              component={SearchScreen}
              options={{ ...HDR, headerShown: true, title: 'Search' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ ...HDR, headerShown: true, title: 'Notifications' }}
            />
            <Stack.Screen
              name="UserProfile"
              component={UserProfileScreen}
              options={({ route }) => ({ ...HDR, headerShown: true, title: route.params?.username ? `@${route.params.username}` : 'Profile' })}
            />
            <Stack.Screen
              name="JournalBudget"
              component={JournalBudgetScreen}
              options={{ ...HDR, headerShown: true, title: 'Budget Tracker' }}
            />
            <Stack.Screen
              name="JournalPacking"
              component={JournalPackingScreen}
              options={{ ...HDR, headerShown: true, title: 'Packing Lists' }}
            />
            <Stack.Screen
              name="MeetwayDetail"
              component={MeetwayDetailScreen}
              options={({ route }) => ({ ...HDR, headerShown: true, title: route.params?.title || 'Meetway' })}
            />
            <Stack.Screen
              name="CreateMeetway"
              component={CreateMeetwayScreen}
              options={{ ...HDR, headerShown: true, title: 'Create Meetway' }}
            />
            <Stack.Screen
              name="AIPlanner"
              component={AIPlannerScreen}
              options={{ ...HDR, headerShown: true, title: 'AI Trip Planner' }}
            />
            <Stack.Screen
              name="JustSplitDetail"
              component={JustSplitDetailScreen}
              options={({ route }) => ({ ...HDR, headerShown: true, title: route.params?.name || 'Group' })}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen}    />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
