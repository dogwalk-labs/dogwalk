import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import MapScreen from "./screens/MapScreen";
import WalkPreferenceScreen from "./screens/WalkPreferenceScreen";
import TimeSelectScreen from "./screens/TimeSelectScreen";
import RouteSelectScreen from "./screens/RouteSelectScreen";
import WalkMapScreen from "./screens/WalkMapScreen";
import OnboardingScreen from "./screens/OnboardingScreen";

import PlaceReviewScreen from "./screens/PlaceReviewScreen";
import PlaceReviewScreen2 from "./screens/PlaceReviewScreen2";

import RankingScreen from "./screens/RankingScreen";
import CommunityScreen from "./screens/CommunityScreen";
import ProfileScreen from "./screens/ProfileScreen";
import ProfileEditScreen from "./screens/ProfileEditScreen";
import UserPublicProfileScreen from "./screens/UserPublicProfileScreen";

import BottomTabBar from "./components/BottomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

function WalkStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="WalkPreference" component={WalkPreferenceScreen} />
      <Stack.Screen name="TimeSelect" component={TimeSelectScreen} />
      <Stack.Screen name="RouteSelect" component={RouteSelectScreen} />
      <Stack.Screen name="WalkMap" component={WalkMapScreen} />

      <Stack.Screen name="PlaceReview" component={PlaceReviewScreen} />
      <Stack.Screen name="PlaceReview2" component={PlaceReviewScreen2} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BottomTabBar {...props} />}
    >
      <Tab.Screen name="Ranking" component={RankingScreen} />
      <Tab.Screen name="Walk" component={WalkStack} />
      <Tab.Screen name="Community" component={CommunityScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="MainTabs" component={MainTabs} />
        <RootStack.Screen name="UserProfile" component={UserPublicProfileScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}