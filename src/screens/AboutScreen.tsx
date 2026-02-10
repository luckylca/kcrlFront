/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef } from 'react';
import { View, ScrollView, StyleSheet, Animated, Linking, Easing, Dimensions } from 'react-native';
import { Card, Text, Button, useTheme, Avatar, TouchableRipple, Surface } from 'react-native-paper';
import ActionCard from './component/ActionCard';
import { Appbar } from 'react-native-paper';

const AboutScreen = ({ navigation }: any) => {
    const theme = useTheme();

    // Animation values for staggered entry
    const fadeAnim1 = useRef(new Animated.Value(0)).current;
    const slideAnim1 = useRef(new Animated.Value(50)).current;

    const fadeAnim2 = useRef(new Animated.Value(0)).current;
    const slideAnim2 = useRef(new Animated.Value(50)).current;

    const fadeAnim3 = useRef(new Animated.Value(0)).current;
    const slideAnim3 = useRef(new Animated.Value(50)).current;

    const fadeAnim4 = useRef(new Animated.Value(0)).current;
    const slideAnim4 = useRef(new Animated.Value(50)).current;

    const fadeAnim5 = useRef(new Animated.Value(0)).current;
    const slideAnim5 = useRef(new Animated.Value(50)).current;

    const animations = [
        { fade: fadeAnim1, slide: slideAnim1 },
        { fade: fadeAnim2, slide: slideAnim2 },
        { fade: fadeAnim3, slide: slideAnim3 },
        { fade: fadeAnim4, slide: slideAnim4 },
        { fade: fadeAnim5, slide: slideAnim5 },
    ];

    useEffect(() => {
        const animatedTiming = (animValue: Animated.Value, toValue: number, delay: number) =>
            Animated.timing(animValue, {
                toValue,
                duration: 600,
                delay,
                useNativeDriver: true,
                easing: Easing.out(Easing.back(1.5)), // Elastic bounce effect
            });

        const parallelAnimations = animations.map((anim, index) => {
            return Animated.parallel([
                animatedTiming(anim.fade, 1, index * 100),
                animatedTiming(anim.slide, 0, index * 100),
            ]);
        });

        Animated.stagger(100, parallelAnimations).start();
    }, [animations]);

    const openLink = (url: string) => {
        Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
    };

    // 渐进动画组件
    const AnimatedWrapper = ({
        style,
        children,
        index
    }: {
        style?: any,
        children: React.ReactNode,
        index: number
    }) => {
        return (
            <Animated.View
                style={[
                    style,
                    {
                        opacity: animations[index].fade,
                        transform: [
                            { translateY: animations[index].slide },
                        ],
                    },
                ]}
            >
                {children}
            </Animated.View>
        );
    };


    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.colors.background }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="关于" />
            </Appbar.Header>
            {/* 1. Project Info Card */}
            <AnimatedWrapper index={0} style={styles.cardWrapper}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Cover
                        source={{ uri: 'https://picsum.photos/id/10/800/400' }}
                        style={styles.cardCover}
                    />
                    <Card.Title
                        title="KCtrl Manager"
                        subtitle="Android按键映射管理工具"
                        titleStyle={[styles.cardTitle, { color: theme.colors.onSurface }]}
                        subtitleStyle={[styles.cardSubtitle, { color: theme.colors.onSurfaceVariant }]}
                        left={(props) => <Avatar.Icon {...props} icon="application-brackets-outline" style={{ backgroundColor: theme.colors.primaryContainer }} color={theme.colors.onPrimaryContainer} />}
                    />
                    <Card.Content>
                        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                            KCtrl Manager 是一款专为 Android 设备设计的按键映射管理工具，旨在帮助用户轻松自定义按键功能,支持单击，双击和长按等多种触发方式。
                        </Text>
                    </Card.Content>
                </Card>
            </AnimatedWrapper>

            {/* 2. Community Group Button */}
            <AnimatedWrapper index={1} style={styles.cardWrapper}>
                <ActionCard
                    icon="account-group"
                    title="侧键控制器交流群"
                    subtitle="群号：764576035"
                    onPress={() => openLink('https://discord.gg/example')}
                    containerColor={theme.colors.secondaryContainer}
                    contentColor={theme.colors.onSecondaryContainer}
                />
            </AnimatedWrapper>

            {/* 3. Developer Info Button */}
            <AnimatedWrapper index={2} style={styles.cardWrapper}>
                <ActionCard
                    icon="code-tags"
                    title="开发者信息"
                    subtitle="查看源代码和贡献者"
                    onPress={() => openLink('https://github.com/example')}
                    containerColor={theme.colors.tertiaryContainer}
                    contentColor={theme.colors.onTertiaryContainer}
                />
            </AnimatedWrapper>

            {/* 4. Official Website Button */}
            <AnimatedWrapper index={3} style={styles.cardWrapper}>
                <ActionCard
                    icon="web"
                    title="官方网站"
                    subtitle="文档与更新"
                    onPress={() => openLink('https://example.com')}
                    containerColor={theme.colors.surfaceVariant}
                    contentColor={theme.colors.onSurfaceVariant}
                />
            </AnimatedWrapper>

            {/* 5. Version Info Card */}
            <AnimatedWrapper index={4} style={styles.cardWrapper}>
                <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
                    <Card.Content style={styles.versionContent}>
                        <View>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>Version 1.0.0</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Build 20240207</Text>
                        </View>
                        <Button
                            mode="contained-tonal"
                            onPress={() => console.log('Check for updates')}
                            icon="update"
                            style={styles.updateButton}
                        >
                            检查更新
                        </Button>
                    </Card.Content>
                </Card>
            </AnimatedWrapper>

            <View style={styles.footerSpacer} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: 16,
        paddingBottom: 120, // Increased to clear floating tab bar
    },
    headerSpacer: {
        height: 20,
    },
    footerSpacer: {
        height: 40,
    },
    cardWrapper: {
        marginBottom: 16,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
    },
    cardCover: {
        height: 150,
    },
    cardTitle: {
        fontWeight: 'bold',
    },
    cardSubtitle: {
        opacity: 0.7,
    },
    versionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    updateButton: {
        borderRadius: 50,
    }
});

export default AboutScreen;
