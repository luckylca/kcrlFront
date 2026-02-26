/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, ScrollView, TouchableOpacity, InteractionManager } from 'react-native';
import { Appbar, Text, useTheme, IconButton, Surface, Divider, Portal, ActivityIndicator, Menu, Snackbar } from 'react-native-paper';
import { useSettingStore } from '../store/useSettingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevicesGetter, InputDevice } from '../api/devicesGetter';
import { CPPAPISocket, KeyInputMonitor } from '../api/CPPAPISocket';


const DevicePathScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { device, setDevice, allDevices, setAllDevices, lockMethod, setLockMethod } = useSettingStore();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [devices, setDevices] = React.useState<InputDevice[]>([]);
    const [visible, setVisible] = React.useState(false);

    // ── Listen (监听) state ──
    const [listeningPath, setListeningPath] = React.useState<string | null>(null);
    const [snackVisible, setSnackVisible] = React.useState(false);
    const [snackMessage, setSnackMessage] = React.useState('');
    const monitorRef = React.useRef<KeyInputMonitor>(new KeyInputMonitor());
    const socketRef = React.useRef<CPPAPISocket | null>(null);
    const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
    const hasTriggeredRef = React.useRef(false);

    const openMenu = () => setVisible(true);
    const closeMenu = () => setVisible(false);

    const toggleDevice = (item: InputDevice) => {
        const value = lockMethod === 'name' ? item.name : item.path;
        if (device.includes(value)) {
            setDevice(device.filter(d => d !== value));
        } else {
            setDevice([...device, value]);
        }
    };
    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        setDevices([]);
        console.log("start to load devices");
        try {
            // 创建 CPPAPISocket 实例
            const socket = new CPPAPISocket();
            //需要初始化
            const r = await socket.init();
            if (!r) {
                setError('无法连接到kctrl服务');
                return;
            }
            // 调用 DevicesGetter 获取设备 JSON
            const list = await DevicesGetter(socket);
            setDevices(list);
            setAllDevices(list);
        } catch (err: any) {
            setError(err?.message || '未知错误');
        } finally {
            setLoading(false);
        }
    };
    React.useEffect(() => {
        const task = InteractionManager.runAfterInteractions(() => {
            fetchDevices();
        });
        return () => task.cancel();
    }, []);

    // ── Monitor functions ──
    const startMonitor = async (devicePath: string) => {
        setListeningPath(devicePath);
        try {
            // Reuse existing socket or create new one
            if (!socketRef.current) {
                socketRef.current = new CPPAPISocket();
                const ok = await socketRef.current.init();
                if (!ok) {
                    setSnackMessage('Socket 初始化失败');
                    setSnackVisible(true);
                    setListeningPath(null);
                    return;
                }
            }
            const ok = await monitorRef.current.start(socketRef.current, devicePath);
            if (!ok) {
                setSnackMessage('启动监听失败');
                setSnackVisible(true);
                setListeningPath(null);
                return;
            }
            // Poll for key data
            hasTriggeredRef.current = false;
            intervalRef.current = setInterval(async () => {
                try {
                    const data = await monitorRef.current.get();
                    if (data && data.state === 1 && data.keycode && !hasTriggeredRef.current) {
                        console.log(`检测到按键: ${data.keycode}  设备: ${data.device}`);
                        hasTriggeredRef.current = true;
                        setSnackMessage(`检测到按键: ${data.keycode}  设备: ${data.device}`);
                        setSnackVisible(true);
                    }
                    // Reset trigger when state goes back to 0 (key released)
                    if (data && data.state === 0 && hasTriggeredRef.current) {
                        hasTriggeredRef.current = false;
                    }
                } catch {
                    // ignore transient errors
                }
            }, 500);
        } catch (e: any) {
            setSnackMessage('监听出错: ' + (e?.message || '未知'));
            setSnackVisible(true);
            setListeningPath(null);
        }
    };

    const stopMonitor = async () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        try {
            await monitorRef.current.stop();
        } catch { /* ignore */ }
        setListeningPath(null);
    };

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            monitorRef.current.stop().catch(() => { });
        };
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Portal>
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#007AFF"
                        style={{ marginVertical: 10, flex: 1 }}
                    />
                )}
                {error && <Text variant="bodyMedium" style={{ color: theme.colors.error }}>{error}</Text>}
            </Portal>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="设备路径配置" />
                <Menu
                    visible={visible}
                    onDismiss={closeMenu}
                    anchor={<Appbar.Action icon="cog" onPress={openMenu} />}>
                    <Menu.Item
                        onPress={() => {
                            setLockMethod('path');
                            closeMenu();
                        }}
                        title="通过路径锁定"
                        leadingIcon={lockMethod === 'path' ? 'check' : () => <View style={{ width: 24, backgroundColor: 'transparent' }} />}
                    />
                    <Menu.Item
                        onPress={() => {
                            setLockMethod('name');
                            closeMenu();
                        }}
                        title="通过名字锁定"
                        leadingIcon={lockMethod === 'name' ? 'check' : () => <View style={{ width: 24, backgroundColor: 'transparent' }} />}
                    />
                </Menu>
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginBottom: 16 }}>
                    当前锁定方式: {lockMethod === 'name' ? '设备名称' : '设备路径'} (点击右上角切换)
                </Text>

                <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.surface }} elevation={1}>
                    {devices.map((item, index) => {
                        const value = lockMethod === 'name' ? item.name : item.path;
                        const isSelected = device.includes(value);
                        return (
                            <View key={item.path}>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 8 }}
                                    onPress={() => toggleDevice(item)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <IconButton
                                            icon={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                            iconColor={isSelected ? theme.colors.primary : theme.colors.outline}
                                            size={24}
                                            onPress={() => toggleDevice(item)}
                                        />
                                        <View style={{ marginLeft: 8, flex: 1 }}>
                                            <Text variant="bodyLarge" style={{ color: isSelected ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                                                {item.name}
                                            </Text>
                                            <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                                {item.path}
                                            </Text>
                                        </View>
                                    </View>
                                    {/* Listen / Stop button */}
                                    {listeningPath === item.path ? (
                                        <IconButton
                                            icon="stop-circle-outline"
                                            iconColor={theme.colors.error}
                                            size={24}
                                            onPress={stopMonitor}
                                        />
                                    ) : (
                                        <IconButton
                                            icon="ear-hearing"
                                            iconColor={listeningPath ? theme.colors.outline + '40' : theme.colors.primary}
                                            size={24}
                                            disabled={listeningPath !== null}
                                            onPress={() => startMonitor(item.path)}
                                        />
                                    )}
                                </TouchableOpacity>
                                {index < devices.length - 1 && <Divider />}
                            </View>
                        );
                    })}
                </Surface>
            </ScrollView>

            {/* Snackbar for listen results */}
            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={3000}
                action={listeningPath ? {
                    label: '停止',
                    onPress: stopMonitor,
                } : undefined}
            >
                {snackMessage}
            </Snackbar>
        </View>
    );
};

export default DevicePathScreen;
