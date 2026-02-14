/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, InteractionManager } from 'react-native';
import { Appbar, Text, useTheme, IconButton, Surface, Divider, Portal, ActivityIndicator, Menu } from 'react-native-paper';
import { useSettingStore } from '../store/useSettingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevicesGetter, InputDevice } from '../api/devicesGetter';
import { CPPAPISocket } from "../api/CPPAPISocket.ts";


const DevicePathScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { device, setDevice, allDevices, setAllDevices, lockMethod, setLockMethod } = useSettingStore();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [devices, setDevices] = React.useState<InputDevice[]>([]);
    const [visible, setVisible] = React.useState(false);

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

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
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

                <Surface style={[styles.listContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    {devices.map((item, index) => {
                        const value = lockMethod === 'name' ? item.name : item.path;
                        const isSelected = device.includes(value);
                        return (
                            <View key={item.path}>
                                <TouchableOpacity
                                    style={styles.itemRow}
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
                                </TouchableOpacity>
                                {index < devices.length - 1 && <Divider />}
                            </View>
                        );
                    })}
                </Surface>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContainer: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
});

export default DevicePathScreen;
