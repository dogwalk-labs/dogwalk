import React, {useEffect} from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import MapScreen from "./screens/MapScreen";
import TimeSelectScreen from "./screens/TimeSelectScreen";
import RouteSelectScreen from "./screens/RouteSelectScreen";
import WalkMapScreen from "./screens/WalkMapScreen";

import RankingScreen from "./screens/RankingScreen";
import CommunityScreen from "./screens/CommunityScreen";
import ProfileScreen from "./screens/ProfileScreen";

import BottomTabBar from "./components/BottomTabBar";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function WalkStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="TimeSelect" component={TimeSelectScreen} />
      <Stack.Screen name="RouteSelect" component={RouteSelectScreen} />
      <Stack.Screen name="WalkMap" component={WalkMapScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    fetch("http://192.168.35.196:8000/users/upsert-temp", { method: "POST" })
      .catch(() => {});
  }, []);

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
      
        tabBar={(props) => <BottomTabBar {...props} />}
      >
        <Tab.Screen name="Ranking" component={RankingScreen} />
        <Tab.Screen name="Walk" component={WalkStack} />
        <Tab.Screen name="Community" component={CommunityScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}