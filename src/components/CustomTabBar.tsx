/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Keyboard } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// 1. 定义我们需要的路由结构
export interface TabRoute {
    key: string;
    title: string;
    icon: string;
}

// 2. 定义组件接收的 Props
interface CustomTabBarProps {
    activeIndex: number;                  // 当前选中的索引
    onIndexChange: (index: number) => void; // 切换时的回调
    routes: TabRoute[];                   // 路由配置
}

const TabItem = ({ route, index, activeIndex, onIndexChange, theme }: any) => {
    const isFocused = activeIndex === index;

    // 3. 点击逻辑简化：直接调用父组件传来的回调
    const onPress = () => {
        if (!isFocused) {
            onIndexChange(index);
        }
    };

    // 动画逻辑（完全保留你的原代码）
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.spring(scale, {
                toValue: isFocused ? 1 : 0.9,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: isFocused ? 1 : 0.7,
                duration: 200,
                useNativeDriver: true,
            })
        ]).start();
    }, [isFocused, opacity, scale]);

    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.8}
        >
            <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
                <MaterialCommunityIcons
                    name={route.icon}
                    size={24}
                    color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                {isFocused && (
                    <Animated.View style={{ opacity }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                            {route.title}
                        </Text>
                    </Animated.View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ activeIndex, onIndexChange, routes }: CustomTabBarProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    const translateValue = useRef(new Animated.Value(0)).current;
    const tabWidth = (width - 40) / routes.length;

    // 键盘监听（保留原逻辑）
    useEffect(() => {
        const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
        const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, []);

    // 4. 动画监听：监听 activeIndex 而不是 state.index
    useEffect(() => {
        Animated.spring(translateValue, {
            toValue: activeIndex * tabWidth,
            useNativeDriver: true,
            damping: 15,
            mass: 1,
            stiffness: 100,
        }).start();
    }, [activeIndex, tabWidth, translateValue]);

    if (keyboardVisible) return null;

    return (
        <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
            <View style={[styles.tabBar, { backgroundColor: theme.colors.elevation.level3, shadowColor: theme.colors.shadow }]}>
                <Animated.View
                    style={[
                        styles.activeTab,
                        {
                            width: tabWidth - 10,
                            transform: [{ translateX: translateValue }],
                            backgroundColor: theme.colors.primaryContainer,
                        },
                    ]}
                />

                {routes.map((route, index) => (
                    <TabItem
                        key={route.key}
                        route={route}
                        index={index}
                        activeIndex={activeIndex}
                        onIndexChange={onIndexChange}
                        theme={theme}
                    />
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        elevation: 5,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        alignItems: 'center',
        paddingHorizontal: 5,
        width: '100%',
    },
    tabItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        zIndex: 1,
    },
    activeTab: {
        position: 'absolute',
        height: 50,
        borderRadius: 25,
        left: 5,
    },
});

export default CustomTabBar;