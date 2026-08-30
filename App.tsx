import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useUserStore } from './src/store/useUserStore';

import MapScreen from "./src/screens/Home/MapScreen";
import PlannerPage from "./src/screens/Planner/Planer";
import TaskPage from "./src/screens/Planner/Tasks";
import ChatPage from "./src/screens/Chat/ChatPage";
import TimerPage from "./src/screens/Timer/Timer";
import MyPage from "./src/screens/Mypage/MyPage";
import CategoryPage from "./src/screens/Category/CategoryPage";
import DdayPage from './src/screens/Mypage/DdayPage';

import StudyGrass from "./src/screens/Mypage/StudyHeatmap";
import DailyTaskStats from './src/screens/Mypage/DailyTaskStats';

// 하단 탭 네비게이터 생성
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// 히딘 탭 네비게이터를 하나의 컴포넌트로 분리
function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={MapScreen} options={{title: '홈'}} />
      <Tab.Screen name="Tasks" component={TaskPage} options={{title: '플랜'}} />
      <Tab.Screen name="Chat" component={ChatPage} options={{title: '채팅'}} />
      <Tab.Screen name="Timer" component={TimerPage} options={{title: '타이머'}} />
      <Tab.Screen name="Settings" component={MyPage} options={{title: '마이'}} />
    </Tab.Navigator>
  )
}

export default function App() {
  const fetchProfile = useUserStore((state) => state.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, []);

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <NavigationContainer>
        <Stack.Navigator>
          {/* 앱 실행 시 가장 먼저 보여질 하단 탭 묶음 */}
          <Stack.Screen 
            name="MainTabs"
            component={TabNavigator}
            options={{ headerShown: false }}
          />

          {/* 마이페이지에서 버튼 눌렀을 때 이동할 서브 화면들 등록 */}
          <Stack.Screen 
            name="CategoryPage"
            component={CategoryPage}
            options={{ title: '카테고리 관리' }}
          />

          <Stack.Screen 
            name="StudyGrassPage"
            component={StudyGrass}
            options={{ title: '공부시간 통계' }}
          />

          <Stack.Screen 
            name="DailyTaskStatsPage"
            component={DailyTaskStats}
            options={{ title: '플래너 달성률' }}
          />

          <Stack.Screen
            name="DdayPage"
            component={DdayPage}
            options={{ title: '디데이' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#111827"
  },
  screenWrap: {
    flex: 1,
    backgroundColor: "#fbfcf9"
  },
  tabBarWrap: {
    backgroundColor: "#111827"
  }
});
