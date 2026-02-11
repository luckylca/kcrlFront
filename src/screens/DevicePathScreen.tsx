/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, useTheme, IconButton, Surface, Divider } from 'react-native-paper';
import { useSettingStore } from '../store/useSettingStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const DevicePathScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { device, setDevice } = useSettingStore();
    const PREDEFINED_DEVICES = Array.from({ length: 15 }, (_, i) => `/dev/input/event${i}`);

    const toggleDevice = (path: string) => {
        if (device.includes(path)) {
            setDevice(device.filter(d => d !== path));
        } else {
            setDevice([...device, path]);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="设备路径配置" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginBottom: 16 }}>
                    请选择需要监听的输入设备 (多选):
                </Text>

                <Surface style={[styles.listContainer, { backgroundColor: theme.colors.surface }]} elevation={1}>
                    {PREDEFINED_DEVICES.map((path, index) => {
                        const isSelected = device.includes(path);
                        return (
                            <View key={path}>
                                <TouchableOpacity
                                    style={styles.itemRow}
                                    onPress={() => toggleDevice(path)}
                                >
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <IconButton
                                            icon={isSelected ? "checkbox-marked-circle" : "checkbox-blank-circle-outline"}
                                            iconColor={isSelected ? theme.colors.primary : theme.colors.outline}
                                            size={24}
                                            onPress={() => toggleDevice(path)}
                                        />
                                        <Text variant="bodyLarge" style={{ marginLeft: 8, color: isSelected ? theme.colors.onSurface : theme.colors.onSurfaceVariant }}>
                                            {path}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                                {index < PREDEFINED_DEVICES.length - 1 && <Divider />}
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
