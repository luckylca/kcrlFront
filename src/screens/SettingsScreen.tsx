/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, StyleSheet, ScrollView, Animated, Dimensions, Easing } from 'react-native';
import { Text, Switch, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------
type SettingsItemType = {
    id: string;
    title: string;
    subtitle?: string;
    icon: string;
    type: 'route' | 'toggle' | 'button';
    route?: string;
    value?: boolean;
    onToggle?: (val: boolean) => void;
    onPress?: () => void;
};

// ------------------------------------------------------------------
// Animation Constants
// ------------------------------------------------------------------
const STAGGER_DELAY = 80;
const ANIMATION_DURATION = 500;
const INITIAL_TRANSLATE_Y = 50;

// ------------------------------------------------------------------
// Component: Settings Card
// ------------------------------------------------------------------
const SettingsCard = ({ item, index, theme, navigation }: { item: SettingsItemType, index: number, theme: any, navigation: any }) => {
    // Animation Values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(INITIAL_TRANSLATE_Y)).current;

    // Scale Animation for Press
    const scaleAnim = useRef(new Animated.Value(1)).current;

    useFocusEffect(
        useCallback(() => {
            // Reset values
            fadeAnim.setValue(0);
            slideAnim.setValue(INITIAL_TRANSLATE_Y);

            const delay = index * STAGGER_DELAY;

            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: ANIMATION_DURATION,
                    delay,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: ANIMATION_DURATION,
                    delay,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.back(1.5)), // Slight bounce
                }),
            ]).start();

            return () => {
                // Cleanup if needed
                fadeAnim.setValue(0);
            };
        }, [index, fadeAnim, slideAnim])
    );

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            speed: 20,
            bounciness: 10,
        }).start();
    };

    const handlePress = () => {
        if (item.onPress) {
            item.onPress();
            return;
        }

        if (item.type === 'route' && item.route) {
            navigation.navigate(item.route);
        }
    };

    return (
        <Animated.View
            style={{
                opacity: fadeAnim,
                transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                ],
                marginBottom: 12,
            }}
        >
            <Surface
                style={[
                    styles.card,
                    {
                        backgroundColor: theme.colors.surface,
                        opacity: 0.9,
                        borderRadius: 24, // Material You Large Radius
                    }
                ]}
                elevation={1}
            >
                <TouchableRipple
                    onPress={item.type === 'toggle' ? undefined : handlePress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    rippleColor={theme.colors.primary + '20'} // 20% opacity primary
                    style={styles.touchable}
                    borderless={true}
                >
                    <View style={styles.cardContent}>
                        {/* Icon Box */}
                        <View style={[styles.iconBox, { backgroundColor: theme.colors.secondaryContainer }]}>
                            <MaterialCommunityIcons name={item.icon} size={24} color={theme.colors.onSecondaryContainer} />
                        </View>

                        {/* Text Content */}
                        <View style={styles.textContainer}>
                            <Text variant="titleMedium" style={{ color: theme.colors.onSurface, fontWeight: '600' }}>
                                {item.title}
                            </Text>
                            {item.subtitle && (
                                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                                    {item.subtitle}
                                </Text>
                            )}
                        </View>

                        {/* Action Component */}
                        <View style={styles.actionContainer}>
                            {item.type === 'route' && (
                                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSurfaceVariant} />
                            )}
                            {item.type === 'toggle' && (
                                <Switch
                                    value={item.value}
                                    onValueChange={item.onToggle}
                                    color={theme.colors.primary}
                                    style={{ transform: [{ scale: 0.9 }] }}
                                />
                            )}
                            {item.type === 'button' && (
                                <MaterialCommunityIcons name="arrow-top-right" size={20} color={theme.colors.primary} />
                            )}
                        </View>
                    </View>
                </TouchableRipple>
            </Surface>
        </Animated.View>
    );
};

// ------------------------------------------------------------------
// Main Screen
// ------------------------------------------------------------------
const SettingsScreen = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const theme = useTheme();

    // State for Toggles
    const [isLogEnabled, setIsLogEnabled] = useState(false);

    // Configuration Items
    const settingsItems: SettingsItemType[] = [
        {
            id: 'device_path',
            title: '设备路径配置',
            subtitle: '管理设备连接与存储路径',
            icon: 'folder-cog-outline',
            type: 'route',
            route: 'DevicePath',
        },
        {
            id: 'time_config',
            title: '时间配置',
            subtitle: '自定义操作的延时',
            icon: 'clock-edit-outline',
            type: 'route',
            route: 'TimeConfig',
        },
        {
            id: 'theme_config',
            title: '主题设置',
            subtitle: '个性化界面风格',
            icon: 'palette-swatch-outline',
            type: 'route',
            route: 'ThemeSettings',
        },
        {
            id: 'script_config',
            title: '脚本配置',
            subtitle: '自定义自动化脚本',
            icon: 'script-text-outline',
            type: 'route',
            route: 'ScriptConfig',
        },
        {
            id: 'log_config',
            title: '日志配置',
            subtitle: '启用系统日志记录',
            icon: 'file-document-outline',
            type: 'toggle',
            value: isLogEnabled,
            onToggle: (val) => setIsLogEnabled(val),
        },
        {
            id: 'send_logs',
            title: '发送日志',
            subtitle: '上传日志文件至服务器',
            icon: 'cloud-upload-outline',
            type: 'button',
            onPress: () => {
                console.log('Sending logs...');
                // Add actual log sending logic here
            },
        },
        {
            id: 'about',
            title: '关于应用',
            subtitle: '版本信息与开发者',
            icon: 'information-outline',
            type: 'route',
            route: 'About',
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            {/* Header / AppBar */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <Text variant="displaySmall" style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
                    设置
                </Text>
            </View>

            {/* Scrollable Content */}
            <ScrollView
                contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {settingsItems.map((item, index) => (
                    <SettingsCard
                        key={item.id}
                        item={item}
                        index={index}
                        theme={theme}
                        navigation={navigation}
                    />
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20,
        backgroundColor: 'transparent',
    },
    headerTitle: {
        fontWeight: 'bold',
        fontFamily: 'Roboto',
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 8,
    },
    card: {
        overflow: 'hidden',
        marginHorizontal: 4, // Space for shadow
    },
    touchable: {
        padding: 16,
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 16, // Medium Rounding
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    actionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});

export default SettingsScreen;