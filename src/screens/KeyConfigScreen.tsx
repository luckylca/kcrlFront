/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useRef } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, useTheme, Surface, Text, IconButton, Dialog, Portal, Button, Divider, TouchableRipple, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingStore } from '../store/useSettingStore';
import { useScriptStore } from '../store/useScriptStore';
import { CPPAPISocket, KeyInputMonitor } from '../api/CPPAPISocket';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Define the trigger types
const TRIGGERS = [
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

    const [isAddKeyVisible, setIsAddKeyVisible] = useState(false);
    const [isScriptDialogVisible, setIsScriptDialogVisible] = useState(false);
    const [currentEditingKey, setCurrentEditingKey] = useState<string | null>(null);
    const [currentEditingTrigger, setCurrentEditingTrigger] = useState<string | null>(null);

    const [isScanning, setIsScanning] = useState(false);
    const [scanningDevice, setScanningDevice] = useState<string | null>(null);
    const [scannedKey, setScannedKey] = useState<string | null>(null);
    const [scanError, setScanError] = useState<string | null>(null);

    const socketRef = useRef<CPPAPISocket | null>(null);
    const monitorRef = useRef<KeyInputMonitor | null>(null);
    const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // --- Actions ---

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
            const finalScriptName = scriptName && !scriptName.endsWith('.sh')
                ? `${scriptName}.sh`
                : scriptName;
            setKeyevent({
                ...keyevent,
                [currentEditingKey]: {
                    ...currentConfig,
                    [currentEditingTrigger]: finalScriptName,
                },
            });
        }
        setIsScriptDialogVisible(false);
        setCurrentEditingKey(null);
        setCurrentEditingTrigger(null);
    };

    useEffect(() => {
        return () => {
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
            if (monitorRef.current) {
                monitorRef.current.stop();
            }
        };
    }, []);

    const startKeyScan = async (devicePath: string) => {
        setIsScanning(true);
        setScanningDevice(devicePath);
        setScannedKey(null);
        setScanError(null);
        setIsAddKeyVisible(false);

        try {
            if (!socketRef.current) {
                socketRef.current = new CPPAPISocket();
            }

            const initialized = await socketRef.current.init();
            if (!initialized) {
                setScanError('无法连接到服务，请确保后台服务正在运行');
                return;
            }

            monitorRef.current = new KeyInputMonitor();
            const started = await monitorRef.current.start(socketRef.current, devicePath);

            if (!started) {
                setScanError('启动按键监听失败');
                return;
            }

            scanIntervalRef.current = setInterval(async () => {
                if (!monitorRef.current) return;

                try {
                    const result = await monitorRef.current.get();
                    if (result && result.keycode) {
                        setScannedKey(result.keycode);
                        if (scanIntervalRef.current) {
                            clearInterval(scanIntervalRef.current);
                        }
                        await monitorRef.current.stop();
                    }
                } catch (e) {
                    console.error('Scan error:', e);
                }
            }, 200);
        } catch (e) {
            console.error('Start scan error:', e);
            setScanError('扫描启动失败');
        }
    };

    const confirmScannedKey = () => {
        if (scannedKey) {
            if (!keyevent[scannedKey]) {
                setKeyevent({
                    ...keyevent,
                    [scannedKey]: {
                        onpress: '',
                        click: '',
                        dblclick: '',
                        short_press: '',
                        long_press: '',
                    },
                });
            }
        }
        cancelScan();
    };

    const cancelScan = async () => {
        if (scanIntervalRef.current) {
            clearInterval(scanIntervalRef.current);
            scanIntervalRef.current = null;
        }
        if (monitorRef.current) {
            await monitorRef.current.stop();
            monitorRef.current = null;
        }
        setIsScanning(false);
        setScanningDevice(null);
        setScannedKey(null);
        setScanError(null);
    };


    const renderKeyCard = (keyCode: string) => {
        const config = keyevent[keyCode];
        if (!config) return null;

        return (
            <Surface key={keyCode} style={{ borderRadius: 16, marginBottom: 16, backgroundColor: theme.colors.surface }} elevation={0}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderTopLeftRadius: 16, borderTopRightRadius: 16, backgroundColor: theme.colors.secondaryContainer }}>
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
                <View style={{ backgroundColor: '#fff', borderColor: theme.colors.outlineVariant, borderWidth: 1, borderTopWidth: 0, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
                    {TRIGGERS.map((trigger, index) => {
                        const scriptName = (config as any)[trigger.key] || '';
                        return (
                            <View key={trigger.key}>
                                <TouchableOpacity
                                    onPress={() => openScriptSelector(keyCode, trigger.key)}
                                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16 }}
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
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="按键配置" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                <Button
                    mode="outlined"
                    onPress={() => setIsAddKeyVisible(true)}
                    style={{ marginBottom: 10, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: '#79747E' }}
                    contentStyle={{ height: 56, justifyContent: 'center' }}
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
                    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40 }}>
                        <MaterialCommunityIcons name="playlist-remove" size={48} color={theme.colors.outline} />
                        <Text style={{ color: theme.colors.outline, marginTop: 16 }}>暂无设备配置，请点击上方添加</Text>
                    </View>
                ) : (
                    Object.keys(keyevent).map(keyCode => renderKeyCard(keyCode))
                )}
            </ScrollView>

            <Portal>
                <Dialog visible={isAddKeyVisible} onDismiss={() => setIsAddKeyVisible(false)}>
                    <Dialog.Title>选择设备</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                                onPress={() => { setIsAddKeyVisible(false); navigation.navigate('DevicePath'); }}
                            >
                                <MaterialCommunityIcons name="cog" size={24} color={theme.colors.primary} />
                                <View style={{ marginLeft: 16, flex: 1 }}>
                                    <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                                        配置设备路径
                                    </Text>
                                    <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                        添加或管理设备路径
                                    </Text>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
                            </TouchableOpacity>

                            <Divider style={{ marginVertical: 8 }} />

                            {device.length === 0 && (
                                <View style={{ padding: 20, alignItems: 'center' }}>
                                    <Text style={{ color: theme.colors.outline, textAlign: 'center' }}>
                                        暂无设备路径，请先配置
                                    </Text>
                                </View>
                            )}

                            {device.map((path) => (
                                <TouchableOpacity
                                    key={path}
                                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                                    onPress={() => !keyevent[path] && startKeyScan(path)}
                                    disabled={!!keyevent[path]}
                                >
                                    <MaterialCommunityIcons name="usb" size={24} color={!!keyevent[path] ? theme.colors.outline : theme.colors.onSurface} />
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text variant="bodyLarge" style={{ color: !!keyevent[path] ? theme.colors.outline : theme.colors.onSurface }}>
                                            {path}
                                        </Text>
                                    </View>
                                    {!!keyevent[path] ? (
                                        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>已添加</Text>
                                    ) : (
                                        <MaterialCommunityIcons name="radar" size={22} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setIsAddKeyVisible(false)}>取消</Button>
                    </Dialog.Actions>
                </Dialog>

                <Dialog visible={isScriptDialogVisible} onDismiss={() => setIsScriptDialogVisible(false)} style={{ maxHeight: '80%' }}>
                    <Dialog.Title>选择脚本</Dialog.Title>
                    <Dialog.ScrollArea>
                        <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
                                onPress={() => { setIsScriptDialogVisible(false); navigation.navigate('ScriptConfig'); }}
                            >
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <MaterialCommunityIcons name="plus" size={24} color={theme.colors.primary} />
                                    <View style={{ marginLeft: 16, flex: 1 }}>
                                        <Text variant="bodyLarge" style={{ color: theme.colors.primary }}>
                                            添加脚本
                                        </Text>
                                        <Text variant="bodySmall" style={{ color: theme.colors.outline }}>
                                            创建或编辑脚本
                                        </Text>
                                    </View>
                                </View>
                                <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.outline} />
                            </TouchableOpacity>
                            <Divider style={{ marginVertical: 8 }} />

                            <TouchableOpacity
                                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
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
                                    style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8 }}
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

                <Dialog visible={isScanning} onDismiss={cancelScan}>
                    <Dialog.Title>按键扫描</Dialog.Title>
                    <Dialog.Content>
                        <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                            {scanError ? (
                                <>
                                    <MaterialCommunityIcons name="alert-circle" size={48} color={theme.colors.error} />
                                    <Text style={{ color: theme.colors.error, marginTop: 16, textAlign: 'center' }}>
                                        {scanError}
                                    </Text>
                                </>
                            ) : scannedKey ? (
                                <>
                                    <MaterialCommunityIcons name="check-circle" size={48} color={theme.colors.primary} />
                                    <Text variant="titleMedium" style={{ marginTop: 16, fontWeight: 'bold' }}>
                                        检测到按键
                                    </Text>
                                    <View style={{ padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: theme.colors.primaryContainer, marginTop: 12 }}>
                                        <Text variant="bodySmall" style={{ color: theme.colors.onPrimaryContainer }}>
                                            设备: {scanningDevice}
                                        </Text>
                                        <Text variant="titleLarge" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold', marginTop: 4 }}>
                                            键码: {scannedKey}
                                        </Text>
                                    </View>
                                </>
                            ) : (
                                <>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                    <Text variant="bodyMedium" style={{ marginTop: 16, color: theme.colors.onSurface }}>
                                        请按下设备上的按键...
                                    </Text>
                                    <Text variant="bodySmall" style={{ marginTop: 8, color: theme.colors.outline }}>
                                        设备: {scanningDevice}
                                    </Text>
                                </>
                            )}
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions>
                        {scanError || scannedKey ? (
                            <>
                                <Button onPress={cancelScan}>
                                    {scanError ? '关闭' : '取消'}
                                </Button>
                                {scannedKey && (
                                    <Button onPress={confirmScannedKey}>确认添加</Button>
                                )}
                            </>
                        ) : (
                            <Button onPress={cancelScan}>取消扫描</Button>
                        )}
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

export default KeyConfigScreen;
