/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Animated, Keyboard } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const TabItem = ({ route, index, state, descriptors, navigation, theme }: any) => {
    const { options } = descriptors[route.key];
    const label =
        options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
                ? options.title
                : route.name;

    const isFocused = state.index === index;

    const onPress = () => {
        const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
        }
    };

    const onLongPress = () => {
        navigation.emit({
            type: 'tabLongPress',
            target: route.key,
        });
    };

    // Icon logic
    const iconName =
        route.name === 'Home' ? 'home' :
            route.name === 'Community' ? 'account-group' :
                route.name === 'Setting' ? 'cog' : 'circle';

    // Tab Item Animation
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
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.8}
        >
            <Animated.View style={{ transform: [{ scale }], opacity, alignItems: 'center' }}>
                <MaterialCommunityIcons
                    name={iconName}
                    size={24}
                    color={isFocused ? theme.colors.primary : theme.colors.onSurfaceVariant}
                />
                {isFocused && (
                    <Animated.View style={{ opacity }}>
                        <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: 'bold', marginTop: 2 }}>
                            {label as string}
                        </Text>
                    </Animated.View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [keyboardVisible, setKeyboardVisible] = useState(false);

    // Animation for active tab indicator
    const translateValue = useRef(new Animated.Value(0)).current;

    // Calculate tab width based on number of tabs
    const tabWidth = (width - 40) / state.routes.length; // 40 is total horizontal margin

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setKeyboardVisible(false)
        );

        return () => {
            keyboardDidHideListener.remove();
            keyboardDidShowListener.remove();
        };
    }, []);

    useEffect(() => {
        Animated.spring(translateValue, {
            toValue: state.index * tabWidth,
            useNativeDriver: true,
            damping: 15,
            mass: 1,
            stiffness: 100,
        }).start();
    }, [state.index, tabWidth, translateValue]);

    if (keyboardVisible) return null; // Hide tab bar when keyboard is open

    return (
        <View style={[styles.container, { bottom: 20 + insets.bottom }]}>
            <View style={[styles.tabBar, { backgroundColor: theme.colors.elevation.level3, shadowColor: theme.colors.shadow }]}>
                {/* Animated Indicator */}
                <Animated.View
                    style={[
                        styles.activeTab,
                        {
                            width: tabWidth - 10, // Slightly smaller than tab width
                            transform: [{ translateX: translateValue }],
                            backgroundColor: theme.colors.primaryContainer,
                        },
                    ]}
                />

                {state.routes.map((route, index) => (
                    <TabItem
                        key={route.key}
                        route={route}
                        index={index}
                        state={state}
                        descriptors={descriptors}
                        navigation={navigation}
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
        // bottom is handled inline
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        height: 60,
        borderRadius: 30,
        elevation: 5,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        alignItems: 'center',
        paddingHorizontal: 5, // Inner padding for the indicator
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
        left: 5, // Match paddingHorizontal
    },
});

export default CustomTabBar;
