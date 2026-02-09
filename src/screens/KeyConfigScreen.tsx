/* eslint-disable react-native/no-inline-styles */
import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, Dimensions } from 'react-native';
import { Appbar, useTheme, Surface, Text, TouchableRipple, Switch, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const KeyConfigSummaryItem = ({ label, value, index, theme }: any) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.stagger(100 * index, [
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 600,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 600,
                    useNativeDriver: true,
                }),
            ]),
        ]).start();
    }, [index, fadeAnim, slideAnim]);

    return (
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <View style={styles.cardRow}>
                    <View style={styles.iconContainer}>
                        <IconButton icon="keyboard-variant" size={24} iconColor={theme.colors.primary} />
                    </View>
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{label}</Text>
                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>{value}</Text>
                    </View>
                    <Switch value={true} onValueChange={() => { }} color={theme.colors.primary} />
                </View>
            </Surface>
        </Animated.View>
    );
};

const KeyConfigScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const configs = [
        { id: 1, label: 'Volume Up Trigger', value: 'Map to: Swipe Left' },
        { id: 2, label: 'Volume Down Trigger', value: 'Map to: Swipe Right' },
        { id: 3, label: 'Double Tap Power', value: 'Map to: Like Post' },
        { id: 4, label: 'Long Press Home', value: 'Map to: Open Comments' },
    ];

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header style={{ backgroundColor: 'transparent' }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="按键配置" />
                <Appbar.Action icon="dots-vertical" onPress={() => { }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}>
                <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 20, paddingHorizontal: 4 }}>
                    自定义输入
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginBottom: 24, paddingHorizontal: 4 }}>
                    将硬件按键映射到应用操作，实现无缝体验。
                </Text>

                {configs.map((item, index) => (
                    <KeyConfigSummaryItem
                        key={item.id}
                        label={item.label}
                        value={item.value}
                        index={index}
                        theme={theme}
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
    content: {
        padding: 16,
    },
    card: {
        borderRadius: 20,
        marginBottom: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default KeyConfigScreen;
