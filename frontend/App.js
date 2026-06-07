import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import MapScreen from "./screens/walk/MapScreen";
import WalkPreferenceScreen from "./screens/walk/WalkPreferenceScreen";
import TimeSelectScreen from "./screens/walk/TimeSelectScreen";
import RouteSelectScreen from "./screens/walk/RouteSelectScreen";
import WalkMapScreen from "./screens/walk/WalkMapScreen";
import OnboardingScreen from "./screens/onboarding/OnboardingScreen";

import PlaceReviewScreen from "./screens/review/PlaceReviewScreen";
import PlaceReviewScreen2 from "./screens/review/PlaceReviewScreen2";

import RankingScreen from "./screens/ranking/RankingScreen";
import CommunityScreen from "./screens/chatBot/CommunityScreen";
import ProfileScreen from "./screens/profile/ProfileScreen";
import ProfileEditScreen from "./screens/profile/ProfileEditScreen";
import UserPublicProfileScreen from "./screens/ranking/UserPublicProfileScreen";

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
      initialRouteName="Walk"
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