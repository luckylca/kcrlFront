/* eslint-disable react-native/no-inline-styles */
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, useTheme, Surface, Text, IconButton, Dialog, Portal, Button, Divider, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingStore } from '../store/useSettingStore';
import { useScriptStore } from '../store/useScriptStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the trigger types
const TRIGGERS = [
    { key: 'onpress', label: '按下 (Press)' },
    { key: 'click', label: '单击 (Click)' },
    { key: 'dblclick', label: '双击 (Double Click)' },
    { key: 'short_press', label: '短按 (Short Press)' },
    { key: 'long_press', label: '长按 (Long Press)' },
];

const KeyConfigScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { keyevent, setKeyevent, device } = useSettingStore();
    const { savedScripts } = useScriptStore();

    // State for separate dialogs
    const [isAddKeyVisible, setIsAddKeyVisible] = useState(false);
    const [isScriptDialogVisible, setIsScriptDialogVisible] = useState(false);
    const [currentEditingKey, setCurrentEditingKey] = useState<string | null>(null);
    const [currentEditingTrigger, setCurrentEditingTrigger] = useState<string | null>(null);

    // --- Actions ---

    // Directly Add Key from Device Selection
    const handleAddKey = (path: string) => {
        if (!keyevent[path]) {
            setKeyevent({
                ...keyevent,
                [path]: {
                    onpress: '',
                    click: '',
                    dblclick: '',
                    short_press: '',
                    long_press: '',
                },
            });
            setIsAddKeyVisible(false);
        }
    };

    const handleDeleteKey = (keyCode: string) => {
        const updated = { ...keyevent };
        delete updated[keyCode];
        setKeyevent(updated);
    };

    const openScriptSelector = (keyCode: string, trigger: string) => {
        setCurrentEditingKey(keyCode);
        setCurrentEditingTrigger(trigger);
        setIsScriptDialogVisible(true);
    };

    const handleSelectScript = (scriptName: string) => {
        if (currentEditingKey && currentEditingTrigger) {
            const currentConfig = keyevent[currentEditingKey] || {};
            setKeyevent({
                ...keyevent,
                [currentEditingKey]: {
                    ...currentConfig,
                    [currentEditingTrigger]: scriptName,
                },
            });
        }
        setIsScriptDialogVisible(false);
        setCurrentEditingKey(null);
        setCurrentEditingTrigger(null);
    };

    // --- Render Items ---

    const renderKeyCard = (keyCode: string) => {
        const config = keyevent[keyCode];
        if (!config) return null;

        return (
            <Surface key={keyCode} style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={0}>
                {/* Key Header */}
                <View style={[styles.cardHeader, { backgroundColor: theme.colors.secondaryContainer }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <MaterialCommunityIcons name="usb" size={24} color={theme.colors.onSecondaryContainer} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSecondaryContainer }}>
                                {keyCode}
                            </Text>
                            <Text variant="bodySmall" style={{ color: theme.colors.onSecondaryContainer, opacity: 0.7 }}>
                                已配置的设备事件
                            </Text>
                        </View>
                    </View>
                    <IconButton
                        icon="delete"
                        size={20}
                        iconColor={theme.colors.error}
                        onPress={() => handleDeleteKey(keyCode)}
                    />
                </View>

                {/* Triggers List */}
                <View style={[styles.cardContent, { borderColor: theme.colors.outlineVariant, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }]}>
                    {TRIGGERS.map((trigger, index) => {
                        const scriptName = (config as any)[trigger.key] || '';
                        return (
                            <View key={trigger.key}>
                                <TouchableOpacity
                                    onPress={() => openScriptSelector(keyCode, trigger.key)}
                                    style={styles.triggerRow}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text variant="bodyMedium" style={{ fontWeight: '500' }}>{trigger.label}</Text>
                                        <Text variant="bodySmall" style={{ color: scriptName ? theme.colors.primary : theme.colors.outline, marginTop: 2 }}>
                                            {scriptName || '未绑定脚本'}
                                        </Text>
                                    </View>
                                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
                                </TouchableOpacity>
                                {index < TRIGGERS.length - 1 && <Divider />}
                            </View>
                        );
                    })}
                </View>
            </Surface>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="按键配置" />
                <Appbar.Action icon="usb" onPress={() => navigation.navigate('DevicePath')} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                {/* Add Key Button at the TOP - Flat with Ripple */}
                <Button
                    mode="outlined"
                    onPress={() => setIsAddKeyVisible(true)}
                    style={styles.addKeyButton}
                    contentStyle={styles.addKeyContent}
                    icon={({ size, color }) => (
                        <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                    )}
                >
                    <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
                        添加配置
                    </Text>
                </Button>

                <Text variant="bodyMedium" style={{ color: theme.colors.secondary, marginVertical: 16 }}>
                    已配置的设备映射:
                </Text>

                {Object.keys(keyevent).length === 0 ? (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="playlist-remove" size={48} color={theme.colors.outline} />
                        <Text style={{ color: theme.colors.outline, marginTop: 16 }}>暂无设备配置，请点击上方添加</Text>
                    </View>
                ) : (
                    Object.keys(keyevent).map(keyCode => renderKeyCard(keyCode))
                )}
            </ScrollView>

            {/* Dialog: Add Key Selection (From Device Paths) */}
            <Portal>
                <Dialog visible={isAddKeyVisible} onDismiss={() => setIsAddKeyVisible(false)}>
                    <Dialog.Title>选择设备</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            {device.length === 0 && (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: theme.colors.error, marginBottom: 10 }}>没有可用的设备路径</Text>
                                    <Button mode="contained" onPress={() => { setIsAddKeyVisible(false); navigation.navigate('DevicePath'); }}>
                                        去配置设备路径
                                    </Button>
                                </View>
                            )}

                            {device.map((path) => (
                                <TouchableOpacity
                                    key={path}
                                    style={styles.keyOption}
                                    onPress={() => handleAddKey(path)}
                                    disabled={!!keyevent[path]}
                                >
                                    <MaterialCommunityIcons name="usb" size={24} color={!!keyevent[path] ? theme.colors.outline : theme.colors.onSurface} />
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text variant="bodyLarge" style={{ color: !!keyevent[path] ? theme.colors.outline : theme.colors.onSurface }}>
                                            {path}
                                        </Text>
                                    </View>
                                    {keyevent[path] ? (
                                        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>已添加</Text>
                                    ) : (
                                        <MaterialCommunityIcons name="plus" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setIsAddKeyVisible(false)}>取消</Button>
                    </Dialog.Actions>
                </Dialog>

                {/* Dialog: Select Script */}
                <Dialog visible={isScriptDialogVisible} onDismiss={() => setIsScriptDialogVisible(false)} style={{ maxHeight: '80%' }}>
                    <Dialog.Title>选择脚本</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            <TouchableOpacity
                                style={styles.scriptOption}
                                onPress={() => handleSelectScript('')}
                            >
                                <Text style={{ color: theme.colors.error }}>解除绑定 (None)</Text>
                            </TouchableOpacity>
                            <Divider style={{ marginVertical: 8 }} />

                            {savedScripts.length === 0 && (
                                <Text style={{ textAlign: 'center', color: theme.colors.outline, padding: 20 }}>
                                    暂无已保存的脚本
                                </Text>
                            )}

                            {savedScripts.map((script) => (
                                <TouchableOpacity
                                    key={script.id}
                                    style={styles.scriptOption}
                                    onPress={() => handleSelectScript(script.name)}
                                >
                                    <View>
                                        <Text variant="bodyLarge">{script.name}</Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                            {script.steps.length} 步操作
                                        </Text>
                                    </View>
                                    {keyevent[currentEditingKey!] && (keyevent[currentEditingKey!] as any)[currentEditingTrigger!] === script.name && (
                                        <MaterialCommunityIcons name="check" size={20} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setIsScriptDialogVisible(false)}>取消</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    card: {
        borderRadius: 16,
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    cardContent: {
        backgroundColor: '#fff',
    },
    triggerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    addKeyButton: {
        marginBottom: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#79747E', // Explicit color or use theme in component
    },
    addKeyContent: {
        height: 56,
        justifyContent: 'center',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    scriptOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    },
    keyOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 8,
    }
});

export default KeyConfigScreen;
