/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import {
    View,
    ScrollView,
    Animated,
    Linking,
    Easing,
    TouchableOpacity,
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Avatar,
    Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Developer Data ────────────────────────────────────────────────
const DEVELOPERS = [
    {
        name: 'Lucky',
        role: '前端开发 / UI 设计',
        avatar: 'L',
        bio: '',
        github: 'https://github.com/luckylca',
        color: '#6750A4', // primary
    },
    {
        name: 'IDlike',
        role: '后端开发 / 架构设计',
        avatar: 'I',
        bio: '',
        github: 'https://github.com/IDlike32',
        color: '#7D5260', // tertiary
    },
];

const REPOS = [
    {
        name: 'KCtrl Frontend',
        description: 'React Native 移动端应用',
        icon: 'cellphone',
        url: 'https://github.com/luckylca/kcrlFront',
    },
    {
        name: 'KCtrl Backend',
        description: '后端交互实现',
        icon: 'server',
        url: 'https://github.com/IDlike32/kctrl_service/tree/master',
    },
];

// ─── Link Card ─────────────────────────────────────────────────────
const LinkCard = ({
    icon,
    title,
    subtitle,
    url,
    theme,
    delay,
}: {
    icon: string;
    title: string;
    subtitle: string;
    url: string;
    theme: any;
    delay: number;
}) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(30)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
            Animated.timing(slide, { toValue: 0, duration: 500, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <TouchableOpacity
                activeOpacity={0.7}
                onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start()}
                onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
                onPress={() => Linking.openURL(url).catch(() => { })}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    <Surface style={{ borderRadius: 20, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 10, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                        <View style={{ width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primaryContainer }}>
                            <MaterialCommunityIcons name={icon} size={22} color={theme.colors.onPrimaryContainer} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text variant="titleSmall" style={{ fontWeight: '600', color: theme.colors.onSurface }}>{title}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 2 }}>{subtitle}</Text>
                        </View>
                        <MaterialCommunityIcons name="open-in-new" size={18} color={theme.colors.outline} />
                    </Surface>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── Developer Card ────────────────────────────────────────────────
const DeveloperCard = ({
    dev,
    theme,
    delay,
}: {
    dev: typeof DEVELOPERS[0];
    theme: any;
    delay: number;
}) => {
    const fade = useRef(new Animated.Value(0)).current;
    const slide = useRef(new Animated.Value(40)).current;
    const scale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fade, { toValue: 1, duration: 600, delay, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) }),
            Animated.timing(slide, { toValue: 0, duration: 600, delay, useNativeDriver: true, easing: Easing.out(Easing.back(1.2)) }),
        ]).start();
    }, []);

    return (
        <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
            <Surface style={{ borderRadius: 24, overflow: 'hidden', marginBottom: 16, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                {/* Decorative accent bar */}
                <View style={{ height: 4, width: '100%', backgroundColor: dev.color }} />

                <View style={{ padding: 20 }}>
                    {/* Avatar & Info */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Avatar.Text
                            size={52}
                            label={dev.avatar}
                            style={{ backgroundColor: dev.color }}
                            color="#fff"
                        />
                        <View style={{ marginLeft: 14, flex: 1 }}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>
                                {dev.name}
                            </Text>
                            <Surface
                                style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 4, backgroundColor: dev.color + '18' }}
                                elevation={0}
                            >
                                <Text variant="labelSmall" style={{ color: dev.color, fontWeight: '600' }}>
                                    {dev.role}
                                </Text>
                            </Surface>
                        </View>
                    </View>

                    {/* Bio */}
                    <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22, marginTop: 14 }}>
                        {dev.bio}
                    </Text>

                    {/* GitHub Link */}
                    <TouchableOpacity
                        style={{ marginTop: 16, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: theme.colors.surfaceVariant }}
                        onPress={() => Linking.openURL(dev.github).catch(() => { })}
                        activeOpacity={0.7}
                        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
                        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
                    >
                        <Animated.View style={{ transform: [{ scale }], flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialCommunityIcons name="github" size={20} color={theme.colors.onSurface} />
                            <Text variant="labelMedium" style={{ color: theme.colors.onSurface, marginLeft: 8, fontWeight: '500' }}>
                                GitHub Profile
                            </Text>
                            <View style={{ flex: 1 }} />
                            <MaterialCommunityIcons name="arrow-right" size={18} color={theme.colors.outline} />
                        </Animated.View>
                    </TouchableOpacity>
                </View>
            </Surface>
        </Animated.View>
    );
};

// ─── DeveloperScreen ───────────────────────────────────────────────
const DeveloperScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    // Header animation
    const headerFade = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 400, useNativeDriver: true }),
            Animated.timing(headerSlide, { toValue: 0, duration: 400, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
        ]).start();
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Appbar.Header style={{ backgroundColor: 'transparent' }} statusBarHeight={insets.top}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="开发者信息" titleStyle={{ fontWeight: 'bold' }} />
            </Appbar.Header>

            <ScrollView
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
            >
                {/* ── Section: Team Header ── */}
                <Animated.View style={{ opacity: headerFade, transform: [{ translateY: headerSlide }], marginBottom: 24 }}>
                    <Surface style={{ borderRadius: 24, padding: 20, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.primaryContainer }} elevation={0}>
                        <MaterialCommunityIcons name="account-group" size={32} color={theme.colors.onPrimaryContainer} />
                        <View style={{ marginLeft: 16, flex: 1 }}>
                            <Text variant="titleLarge" style={{ fontWeight: 'bold', color: theme.colors.onPrimaryContainer }}>
                                KCtrl 开发者
                            </Text>
                        </View>
                    </Surface>
                </Animated.View>

                {DEVELOPERS.map((dev, index) => (
                    <DeveloperCard key={dev.name} dev={dev} theme={theme} delay={150 + index * 150} />
                ))}

                <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 14, color: theme.colors.onBackground, marginTop: 28 }}>
                    开源仓库
                </Text>

                {REPOS.map((repo, index) => (
                    <LinkCard
                        key={repo.name}
                        icon={repo.icon}
                        title={repo.name}
                        subtitle={repo.description}
                        url={repo.url}
                        theme={theme}
                        delay={450 + index * 120}
                    />
                ))}

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default DeveloperScreen;
