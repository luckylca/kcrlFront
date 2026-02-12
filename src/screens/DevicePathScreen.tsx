/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, useTheme, IconButton, Surface, Divider, Portal, ActivityIndicator } from 'react-native-paper';
import { useSettingStore } from '../store/useSettingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DevicesGetter, InputDevice } from '../api/devicesGetter';
import { CPPAPISocket } from "../api/CPPAPISocket.ts";


const DevicePathScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { device, setDevice, allDevices, setAllDevices } = useSettingStore();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [devices, setDevices] = React.useState<InputDevice[]>([]);

    const toggleDevice = (path: string) => {
        if (device.includes(path)) {
            setDevice(device.filter(d => d !== path));
        } else {
            setDevice([...device, path]);
        }
    };
    const fetchDevices = async () => {
        setLoading(true);
        setError(null);
        setDevices([]);

        try {
            // 创建 CPPAPISocket 实例
            const socket = new CPPAPISocket();
            //需要初始化
            socket.init();
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
        fetchDevices();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Portal>
                {loading && (
                    <ActivityIndicator
                        size="large"
                        color="#007AFF"
                        style={{ marginVertical: 10 }}
                    />
                )}
                {error && <Text variant="bodyMedium" style={{ color: theme.colors.error }}>{error}</Text>}
            </Portal>
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="设备路径配置" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginBottom: 16 }}>
                    请选择需要监听的输入设备 (多选):
                </Text>

                <Surface style={[styles.listContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    {devices.map((item, index) => {
                        const isSelected = device.includes(item.path);
                        return (
                            <View key={item.path}>
                                <TouchableOpacity
                                    style={styles.itemRow}
                                    onPress={() => toggleDevice(item.path)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <IconButton
                                            icon={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                            iconColor={isSelected ? theme.colors.primary : theme.colors.outline}
                                            size={24}
                                            onPress={() => toggleDevice(item.path)}
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
