import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomTabBar from '../components/CustomTabBar';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import MainScreen from '../screens/MainScreens';
import AboutScreen from '../screens/AboutScreen';
import KeyConfigScreen from '../screens/KeyConfigScreen';
import DevicePathScreen from '../screens/DevicePathScreen';
import TimeConfigScreen from '../screens/TimeConfigScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import ScriptConfigScreen from '../screens/ScriptConfigScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import DeveloperScreen from '../screens/DeveloperScreen';


// 1. 定义路由参数列表
export type RootStackParamList = {
    MainTabs: undefined;
    About: undefined;
    KeyConfig: undefined;
    DevicePath: undefined;
    TimeConfig: undefined;
    ThemeSettings: undefined;
    ScriptConfig: undefined;
    Setting: undefined;
    Developer: undefined;
    CreatePost: undefined;
    PostDetail: { post: any };
};

// 2. 定义 Tab 参数列表
export type TabParamList = {
    Home: undefined;
    Community: undefined;
    Setting: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: "transparent" } }}>
            <Stack.Screen
                name="MainTabs"
                component={MainScreen}
            />
            <Stack.Screen
                name="About"
                component={AboutScreen}
            />
            <Stack.Screen
                name="KeyConfig"
                component={KeyConfigScreen}
            />
            <Stack.Screen
                name="DevicePath"
                component={DevicePathScreen}
            />
            <Stack.Screen
                name="TimeConfig"
                component={TimeConfigScreen}
            />
            <Stack.Screen
                name="ThemeSettings"
                component={ThemeSettingsScreen}
            />
            <Stack.Screen
                name="ScriptConfig"
                component={ScriptConfigScreen}
            />
            <Stack.Screen
                name="CreatePost"
                component={CreatePostScreen}
            />
            <Stack.Screen
                name="PostDetail"
                component={PostDetailScreen}
            />
            <Stack.Screen
                name="Developer"
                component={DeveloperScreen}
            />
        </Stack.Navigator>
    );
};

export default RootNavigator;
export { RootNavigator };