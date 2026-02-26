/* eslint-disable react-native/no-inline-styles */
import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Animated, Linking, Easing, Dimensions } from 'react-native';
import { Card, Text, Button, useTheme, Avatar, TouchableRipple, Surface, Portal, Dialog, Snackbar } from 'react-native-paper';
import ActionCard from './component/ActionCard';
import { Appbar } from 'react-native-paper';
import ApiService from '../api/OLAPI';
import DeviceInfo from 'react-native-device-info';


const AboutScreen = ({ navigation }: any) => {
    const theme = useTheme();

    const [updateInfo, setUpdateInfo] = useState({
        version: 1,
        version_name: '1.0 Preview',
        updates: '暂无更新',
        download: '暂无更新',
    });

    const [dialogVisible, setDialogVisible] = useState(false);
    const [snackbarVisible, setSnackbarVisible] = useState(false);
    const [checking, setChecking] = useState(false);

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

    useEffect(() => {
        checkUpdate()
    }, []);

    const checkUpdate = () => {
        setChecking(true);
        ApiService.getUpdataInfo().then((res: any) => {
            const currentBuild = Number(DeviceInfo.getBuildNumber());
            if (res.version > currentBuild) {
                setDialogVisible(true);
            } else {
                setSnackbarVisible(true);
            }
        }).catch(() => {
            setSnackbarVisible(true);
        }).finally(() => {
            setChecking(false);
        });
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
            style={{ flex: 1, backgroundColor: theme.colors.background }}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
        >
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="关于" />
            </Appbar.Header>
            {/* 1. Project Info Card */}
            <AnimatedWrapper index={0} style={{ marginBottom: 16 }}>
                <Card style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
                    <Card.Cover
                        source={{ uri: 'https://picsum.photos/id/10/800/400' }}
                        style={{ height: 150 }}
                    />
                    <Card.Title
                        title="KCtrl Manager"
                        subtitle="Android按键映射管理工具"
                        titleStyle={{ fontWeight: 'bold', color: theme.colors.onSurface }}
                        subtitleStyle={{ opacity: 0.7, color: theme.colors.onSurfaceVariant }}
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
            <AnimatedWrapper index={1} style={{ marginBottom: 16 }}>
                <ActionCard
                    icon="account-group"
                    title="侧键控制器交流群"
                    subtitle="群号：764576035"
                    onPress={() => openLink('https://qm.qq.com/q/5jRKZnZLuw')}
                    containerColor={theme.colors.secondaryContainer}
                    contentColor={theme.colors.onSecondaryContainer}
                />
            </AnimatedWrapper>

            {/* 3. Developer Info Button */}
            <AnimatedWrapper index={2} style={{ marginBottom: 16 }}>
                <ActionCard
                    icon="code-tags"
                    title="开发者信息"
                    subtitle="查看源代码和贡献者"
                    onPress={() => navigation.navigate('Developer')}
                    containerColor={theme.colors.tertiaryContainer}
                    contentColor={theme.colors.onTertiaryContainer}
                />
            </AnimatedWrapper>

            {/* 4. Official Website Button */}
            <AnimatedWrapper index={3} style={{ marginBottom: 16 }}>
                <ActionCard
                    icon="web"
                    title="官方网站"
                    subtitle="文档与更新"
                    onPress={() => openLink('http://47.113.189.138/')}
                    containerColor={theme.colors.surfaceVariant}
                    contentColor={theme.colors.onSurfaceVariant}
                />
            </AnimatedWrapper>

            {/* 5. Version Info Card */}
            <AnimatedWrapper index={4} style={{ marginBottom: 16 }}>
                <Card style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: theme.colors.surface }}>
                    <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }}>
                        <View>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{updateInfo.version_name}</Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>Build {updateInfo.version}</Text>
                        </View>
                        <Button
                            mode="contained-tonal"
                            onPress={checkUpdate}
                            icon="update"
                            style={{ borderRadius: 50 }}
                            loading={checking}
                            disabled={checking}
                        >
                            检查更新
                        </Button>
                    </Card.Content>
                </Card>
            </AnimatedWrapper>

            <View style={{ height: 40 }} />

            {/* Update Available Dialog */}
            <Portal>
                <Dialog
                    visible={dialogVisible}
                    onDismiss={() => setDialogVisible(false)}
                    style={{ borderRadius: 28, backgroundColor: theme.colors.surface }}
                >
                    <Dialog.Icon icon="cellphone-arrow-down" size={32} />
                    <Dialog.Title style={{ textAlign: 'center', fontWeight: '600' }}>发现新版本</Dialog.Title>
                    <Dialog.Content>
                        <View style={{ alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 50, marginBottom: 16, backgroundColor: theme.colors.primaryContainer }}>
                            <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer, fontWeight: '600' }}>
                                v{updateInfo.version_name}
                            </Text>
                        </View>
                        <Text variant="titleSmall" style={{ fontWeight: '600', marginBottom: 8, color: theme.colors.onSurface }}>
                            更新内容
                        </Text>
                        <View style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.surfaceVariant }}>
                            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, lineHeight: 22 }}>
                                {updateInfo.updates}
                            </Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
                        <Button
                            onPress={() => setDialogVisible(false)}
                            textColor={theme.colors.onSurfaceVariant}
                            style={{ borderRadius: 50 }}
                        >
                            取消
                        </Button>
                        <Button
                            mode="contained"
                            onPress={() => {
                                setDialogVisible(false);
                                Linking.openURL(updateInfo.download).catch(() => { });
                            }}
                            icon="download"
                            style={{ borderRadius: 50 }}
                        >
                            立即更新
                        </Button>
                    </Dialog.Actions>
                </Dialog>
                <Snackbar
                    visible={snackbarVisible}
                    onDismiss={() => setSnackbarVisible(false)}
                    duration={2500}
                    style={{ borderRadius: 16, position: 'absolute', bottom: 50, marginLeft: "10%", marginRight: "10%" }}
                    action={{ label: '好的', onPress: () => setSnackbarVisible(false) }}
                >
                    当前已是最新版本
                </Snackbar>
            </Portal>
        </ScrollView>
    );
};

export default AboutScreen;
