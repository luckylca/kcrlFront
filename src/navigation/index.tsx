import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createMaterialBottomTabNavigator } from 'react-native-paper/react-navigation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import HomeScreen from '../screens/HomeScreen';
import UserScreen from '../screens/UserScreen';
import SettingsScreen from '../screens/SettingsScreen';


// 1. 定义路由参数列表
export type RootStackParamList = {
    MainTabs: undefined;
    Settings: undefined;
};

// 2. 定义 Tab 参数列表
export type TabParamList = {
    Home: undefined;
    User: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createMaterialBottomTabNavigator<TabParamList>();

// 3. 创建 Tab 导航器
const TabNavigator = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen
                name="Home"
                component={HomeScreen}
                options={{
                    tabBarLabel: '首页',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="home" color={color} size={26} />
                    ),
                }}
            />
            <Tab.Screen
                name="User"
                component={UserScreen}
                options={{
                    tabBarLabel: '我的',
                    tabBarIcon: ({ color }) => (
                        <MaterialCommunityIcons name="account" color={color} size={26} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
};

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
            />
            <Stack.Screen
                name="Settings"
                component={SettingsScreen}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;
export { RootNavigator };