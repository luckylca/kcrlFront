/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Easing, Dimensions, ScrollView } from 'react-native';
import { Text, useTheme, Surface, Button, IconButton, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CPPAPISocket } from "../api/CPPAPISocket.ts";

const { width } = Dimensions.get('window');

// 1. Animated Ripple Component
const RippleEffect = ({ isActive, color }: { isActive: boolean, color: string }) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isActive) {
            Animated.loop(
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 1.5,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.out(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            scale.setValue(0);
            opacity.setValue(1);
        }
    }, [isActive, scale, opacity]);

    if (!isActive) return null;

    return (
        <Animated.View
            style={[
                styles.ripple,
                {
                    backgroundColor: color,
                    transform: [{ scale }],
                    opacity,
                },
            ]}
        />
    );
};

var socket: CPPAPISocket | null = null;

const HomeScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [isServiceRunning, setIsServiceRunning] = useState(false);

    // Dynamic Colors based on State
    const activeColor = '#4CAF50'; // Green
    const inactiveColor = '#F44336'; // Red
    const statusColor = isServiceRunning ? activeColor : inactiveColor;
    const statusText = isServiceRunning ? '服务已经开启' : '服务未开启';
    const statusIcon = isServiceRunning ? 'check-circle-outline' : 'stop-circle-outline';

    // Animations for Cards
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // 第一次启动启动socket
    if (socket === null) {
        socket = new CPPAPISocket()
        socket.init().then(null);
    }



    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                damping: 20,
                stiffness: 90,
                useNativeDriver: true,
            }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const statusCardPress = async () => {
        if (socket === null) {
            socket = new CPPAPISocket()
            if (!await socket.init()) return;
            setIsServiceRunning(await socket.isWorking());
            return;
        }
        if (await socket.isWorking()) {
            //尝试关闭服务
            await socket.shutdown();
        } else {
            // 尝试引导用户启动服务 + 已获取授权的话直接调用服务app的一键启动（除了shell启动外都可以使用）
            // TODO: 我做好app端的一键启动后在这块启动activity。
        }

        setIsServiceRunning(await socket.isWorking());
    };

    React.useEffect(() => {
        let mounted = true;

        const statusGet = async () => {
            if (!mounted) return;
            if (socket === null) return;

            const result = await socket.isWorking();
            if (mounted) {
                setIsServiceRunning(result);
            }
        };

        // 立即执行一次
        statusGet();

        // 每 10 秒执行一次
        const intervalId = setInterval(statusGet, 10000);

        return () => {
            mounted = false;
            clearInterval(intervalId);
        };
    }, []);


    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 + insets.bottom, paddingTop: insets.top + 20 }}>

                {/* 1. Large Status Card */}
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>仪表盘</Text>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                    <Surface style={[styles.statusCard, { backgroundColor: statusColor }]} elevation={4}>
                        <TouchableRipple
                            onPress={() => statusCardPress()}
                            style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
                            rippleColor="rgba(255, 255, 255, 0.2)"
                            borderless={true}
                        >
                            <View style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}>
                                <View style={styles.rippleContainer}>
                                    <RippleEffect isActive={isServiceRunning} color="rgba(255,255,255,0.3)" />
                                    {/* Second Ripple for overlap effect */}
                                    {isServiceRunning && <RippleEffect isActive={isServiceRunning} color="rgba(255,255,255,0.2)" />}
                                </View>

                                <View style={styles.statusContent}>
                                    <MaterialCommunityIcons name={statusIcon} size={64} color="#FFF" />
                                    <Text variant="displaySmall" style={{ color: '#FFF', fontWeight: 'bold', marginTop: 16 }}>
                                        {statusText}
                                    </Text>
                                    <Text variant="bodyLarge" style={{ color: 'rgba(255,255,255,0.8)', marginTop: 8 }}>
                                        {isServiceRunning ? '服务已经开启,可点击关闭' : '服务未开启，请点击检查服务状态'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableRipple>
                    </Surface>
                </Animated.View>

                <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], marginTop: 24 }}>
                    <Surface style={[styles.navCard, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
                        <TouchableRipple
                            onPress={() => navigation.navigate('KeyConfig')}
                            style={{ flex: 1, padding: 16 }}
                            borderless={true}
                            rippleColor="rgba(0, 0, 0, .1)"
                        >
                            <View style={styles.navContent}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Surface style={[styles.iconBox, { backgroundColor: theme.colors.background }]} elevation={0}>
                                        <MaterialCommunityIcons name="keyboard-settings" size={28} color={theme.colors.primary} />
                                    </Surface>
                                    <View style={{ marginLeft: 16 }}>
                                        <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>按键配置</Text>
                                        <Text variant="bodyMedium" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.7 }}>将硬件按键映射到操作</Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={theme.colors.onSecondaryContainer} />
                            </View>
                        </TouchableRipple>
                    </Surface>
                </Animated.View>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    statusCard: {
        borderRadius: 28,
        height: 250,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        position: 'relative',
    },
    rippleContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 0,
    },
    ripple: {
        width: 200,
        height: 200,
        borderRadius: 100,
        position: 'absolute',
    },
    statusContent: {
        zIndex: 1,
        alignItems: 'center',
    },
    controlCard: {
        borderRadius: 24,
        padding: 20,
    },
    cardHeader: {
        marginBottom: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    controlButton: {
        borderRadius: 12,
        paddingVertical: 6,
    },
    navCard: {
        borderRadius: 24,
        overflow: 'hidden', // Ensure ripple is clipped
    },
    navContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default HomeScreen;