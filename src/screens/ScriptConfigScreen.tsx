/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, useTheme, Surface, IconButton, TextInput, Button, Divider, Portal, Dialog, Paragraph } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useScriptStore, ScriptStep, ScriptType } from '../store/useScriptStore';
import { useSettingStore } from '../store/useSettingStore';
import { useNavigation } from '@react-navigation/native';

import RNFS from 'react-native-fs';
import { generateShellScript } from '../utils/scriptGenerator';

// ------------------------------------------------------------------
// Template Data
// ------------------------------------------------------------------
type TemplateItem = {
    type: ScriptType;
    name: string;
    command: string; // Default or placeholder command
    icon: string;
};

type TemplateCategory = {
    title: string;
    data: TemplateItem[];
};

export const TEMPLATE_LIBRARY: TemplateCategory[] = [
    {
        title: '默认',
        data: [
            { type: 'system', name: '严格模式(set -e)', command: 'set -e', icon: 'alert-circle-outline' },
            { type: 'system', name: '打印(ECHO)', command: 'echo "Hello"', icon: 'message-text-outline' },
            { type: 'system', name: '延时 0.3s', command: 'sleep 0.3', icon: 'clock-outline' },
            { type: 'system', name: '延时 1s', command: 'sleep 1', icon: 'clock-outline' },
            { type: 'system', name: '定义变量', command: 'VAR="value"', icon: 'variable' },
            { type: 'system', name: '读取变量', command: 'echo "$VAR"', icon: 'variable-box' },
        ],
    },

    {
        title: '逻辑类',
        data: [
            // if 条件拼接：配合脚本生成器，会把 if/elif 后续条件片段用空格拼成一行
            { type: 'logic', name: '如果(if)', command: 'if ', icon: 'call-split' },
            { type: 'logic', name: '并且(&&)', command: ' && ', icon: 'logic-and' },
            { type: 'logic', name: '或者(||)', command: ' || ', icon: 'logic-or' },
            { type: 'logic', name: '则(then)', command: '; then', icon: 'code-greater-than' },
            { type: 'logic', name: '否则(else)', command: 'else', icon: 'call-merge' },
            { type: 'logic', name: '闭合(fi)', command: 'fi', icon: 'close-circle-outline' },

            // 常用判断
            { type: 'logic', name: '屏幕亮？', command: 'dumpsys power | grep -q "Display Power: state=ON"', icon: 'monitor' },
            { type: 'logic', name: '网络通？(ping)', command: 'ping -c 1 -W 1 8.8.8.8 >/dev/null 2>&1', icon: 'wifi' },
            { type: 'logic', name: '进程存在？(包名)', command: 'pidof "【包名】" >/dev/null 2>&1', icon: 'format-list-checks' },
            {
                type: 'logic',
                name: '前台应用？(包名)',
                command: 'dumpsys window | grep -E "mCurrentFocus|mFocusedApp" | head -n 1 | grep -q "【包名】"',
                icon: 'application-outline',
            },
            { type: 'logic', name: '文件存在？', command: '[ -f "【文件路径】" ]', icon: 'file-check-outline' },
            { type: 'logic', name: '目录存在？', command: '[ -d "【目录路径】" ]', icon: 'folder-check-outline' },
            { type: 'logic', name: '字符串相等？', command: '[ "$A" = "$B" ]', icon: 'code-equal' },
            { type: 'logic', name: '数字大于？', command: '[ "$A" -gt "$B" ]', icon: 'numeric' },
            { type: 'logic', name: '数字小于？', command: '[ "$A" -lt "$B" ]', icon: 'numeric' },
        ],
    },

    {
        title: '功能控制类',
        data: [
            // 输入事件
            { type: 'function', name: '息屏/开屏(电源键)', command: 'input keyevent 26', icon: 'power' },
            { type: 'function', name: '返回', command: 'input keyevent 4', icon: 'keyboard-return' },
            { type: 'function', name: 'Home', command: 'input keyevent 3', icon: 'home-outline' },
            { type: 'function', name: '最近任务', command: 'input keyevent 187', icon: 'view-grid-outline' },
            { type: 'function', name: '音量+', command: 'input keyevent 24', icon: 'volume-plus' },
            { type: 'function', name: '音量-', command: 'input keyevent 25', icon: 'volume-minus' },
            { type: 'function', name: '静音键(切换)', command: 'input keyevent 164', icon: 'volume-mute' },

            // 通知栏/快捷设置
            { type: 'function', name: '展开通知栏', command: 'cmd statusbar expand-notifications', icon: 'chevron-down' },
            { type: 'function', name: '展开快捷设置', command: 'cmd statusbar expand-settings', icon: 'tune-variant' },
            { type: 'function', name: '收起面板', command: 'cmd statusbar collapse', icon: 'chevron-up' },

            // 触控模拟
            { type: 'function', name: '点击(tap)', command: 'input tap 【x】 【y】', icon: 'gesture-tap' },
            { type: 'function', name: '滑动(swipe)', command: 'input swipe 【x1】 【y1】 【x2】 【y2】 【duration_ms】', icon: 'gesture-swipe' },
            { type: 'function', name: '输入文本', command: 'input text "hello"', icon: 'form-textbox' },

            // 截图
            { type: 'function', name: '截屏(示例)', command: 'screencap -p /sdcard/Download/screenshot.png', icon: 'camera' },
        ],
    },

    {
        title: '系统控制类',
        data: [
            { type: 'system', name: 'WiFi 开', command: 'svc wifi enable', icon: 'wifi' },
            { type: 'system', name: 'WiFi 关', command: 'svc wifi disable', icon: 'wifi-off' },
            { type: 'system', name: '蓝牙 开', command: 'svc bluetooth enable', icon: 'bluetooth' },
            { type: 'system', name: '蓝牙 关', command: 'svc bluetooth disable', icon: 'bluetooth-off' },

            // 亮度/旋转（不同 ROM 可能限制）
            { type: 'system', name: '亮度 30%', command: 'settings put system screen_brightness 77', icon: 'brightness-6' },
            { type: 'system', name: '亮度 80%', command: 'settings put system screen_brightness 204', icon: 'brightness-7' },
            { type: 'system', name: '自动旋转 开', command: 'settings put system accelerometer_rotation 1', icon: 'screen-rotation' },
            { type: 'system', name: '自动旋转 关', command: 'settings put system accelerometer_rotation 0', icon: 'screen-rotation' },
        ],
    },

    {
        title: '情景模式控制类',
        data: [
            { type: 'system', name: '响铃', command: 'cmd audio set-ringer-mode NORMAL', icon: 'bell-ring-outline' },
            { type: 'system', name: '震动', command: 'cmd audio set-ringer-mode VIBRATE', icon: 'vibrate' },
            { type: 'system', name: '静音', command: 'cmd audio set-ringer-mode SILENT', icon: 'volume-mute' },

            { type: 'system', name: '勿扰 开', command: 'cmd notification set_dnd on', icon: 'bell-off' },
            { type: 'system', name: '勿扰 关', command: 'cmd notification set_dnd off', icon: 'bell-ring' },
        ],
    },

    {
        title: '音乐控制类',
        data: [
            { type: 'music', name: '播放/暂停', command: 'input keyevent 85', icon: 'play-pause' },
            { type: 'music', name: '下一首', command: 'input keyevent 87', icon: 'skip-next' },
            { type: 'music', name: '上一首', command: 'input keyevent 88', icon: 'skip-previous' },
            { type: 'music', name: '停止', command: 'input keyevent 86', icon: 'stop' },
        ],
    },

    {
        title: '功能组合',
        data: [
            { type: 'function', name: '打开相机(示例)', command: 'am start -a android.media.action.IMAGE_CAPTURE', icon: 'camera-outline' },
            { type: 'function', name: '打开设置(示例)', command: 'am start -a android.settings.SETTINGS', icon: 'cog-outline' },
            {
                type: 'function',
                name: '示例：屏幕亮则截屏',
                command:
                    `if dumpsys power | grep -q "Display Power: state=ON"; then
  screencap -p /sdcard/Download/screenshot.png
fi`,
                icon: 'layers-triple-outline',
            },
        ],
    },
];

// ------------------------------------------------------------------
// Main Component
// ------------------------------------------------------------------
const ScriptConfigScreen = () => {
    const theme = useTheme();
    const navigation = useNavigation();

    // Store Actions
    const {
        scripts: savedScripts,
        savedScripts: libraryScripts,
        currentScriptName,
        setScripts: setStoreScripts,
        saveScript,
        deleteSavedScript,
        renameScript,
        loadScript,
        setCurrentScriptName,
        clearScripts
    } = useScriptStore();

    const { keyevent, setKeyevent } = useSettingStore();

    // Local State
    const [localScripts, setLocalScripts] = useState<ScriptStep[]>([]);
    const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');

    const initialCollapsedState = TEMPLATE_LIBRARY.reduce((acc, category) => {
        acc[category.title] = true;
        return acc;
    }, {} as Record<string, boolean>);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>(initialCollapsedState);

    const [confirmDialog, setConfirmDialog] = useState<{
        visible: boolean;
        title: string;
        content: string;
        onConfirm: () => void;
    }>({ visible: false, title: '', content: '', onConfirm: () => { } });


    const [isSaveDialogVisible, setIsSaveDialogVisible] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveError, setSaveError] = useState('');

    const [isRenameDialogVisible, setIsRenameDialogVisible] = useState(false);
    const [renameId, setRenameId] = useState('');
    const [renameOldName, setRenameOldName] = useState('');
    const [renameName, setRenameName] = useState('');
    const [renameError, setRenameError] = useState('');

    // 从store初始化本地状态
    useEffect(() => {
        setLocalScripts(savedScripts);
        setSaveName(currentScriptName);
    }, [savedScripts, currentScriptName]);

    const handleAddTemplate = (template: TemplateItem) => {
        const newStep: ScriptStep = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: template.type,
            name: template.name,
            command: template.command,
        };
        setLocalScripts([...localScripts, newStep]);
    };

    // 展开
    const toggleCategory = (title: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [title]: !prev[title]
        }));
    };

    // 删除对象
    const handleRemoveItem = useCallback((id: string) => {
        setLocalScripts(prev => prev.filter((item) => item.id !== id));
    }, []);

    // 更新命令
    const handleUpdateCommand = useCallback((id: string, text: string) => {
        setLocalScripts(prev =>
            prev.map((item) => (item.id === id ? { ...item, command: text } : item))
        );
    }, []);

    // 打开保存对话框
    const handleOpenSaveDialog = () => {
        if (localScripts.length === 0) {
            setConfirmDialog({
                visible: true,
                title: '提示',
                content: '脚本内容不能为空',
                onConfirm: () => setConfirmDialog(prev => ({ ...prev, visible: false }))
            });
            return;
        }
        setSaveName(currentScriptName || '');
        setSaveError('');
        setIsSaveDialogVisible(true);
    };

    // 确认保存
    const handleConfirmSave = async () => {
        if (!saveName.trim()) {
            setSaveError('请输入脚本名称');
            return;
        }

        saveScript(saveName, localScripts);
        setCurrentScriptName(saveName);
        setIsSaveDialogVisible(false);
    };

    // 加载脚本
    const handleLoadScript = (id: string) => {
        setConfirmDialog({
            visible: true,
            title: '确认加载',
            content: '加载新脚本将覆盖当前未保存的更改，是否继续？',
            onConfirm: () => {
                loadScript(id);
                setConfirmDialog(prev => ({ ...prev, visible: false }));
            }
        });
    };

    // 删除脚本
    const handleDeleteSavedScript = (id: string, name: string) => {
        setConfirmDialog({
            visible: true,
            title: '确认删除',
            content: `确定要删除脚本 "${name}" 吗？`,
            onConfirm: () => {
                deleteSavedScript(id);
                setConfirmDialog(prev => ({ ...prev, visible: false }));
            }
        });
    };

    // 清空编辑区
    const handleClear = () => {
        setConfirmDialog({
            visible: true,
            title: '确认清空',
            content: '确定要清空当前编辑区吗？',
            onConfirm: () => {
                setLocalScripts([]);
                setSaveName('');
                clearScripts();
                setConfirmDialog(prev => ({ ...prev, visible: false }));
            }
        });
    };

    const handleRenameScript = (id: string, oldName: string) => {
        setRenameId(id);
        setRenameOldName(oldName);
        setRenameName(oldName);
        setRenameError('');
        setIsRenameDialogVisible(true);
    };

    const handleConfirmRename = () => {
        const newName = renameName.trim();
        if (!newName) {
            setRenameError('请输入脚本名称');
            return;
        }
        if (newName === renameOldName) {
            setIsRenameDialogVisible(false);
            return;
        }
        if (libraryScripts.some(s => s.name === newName && s.id !== renameId)) {
            setRenameError('该名称已存在');
            return;
        }
        renameScript(renameId, newName);
        const oldFileName = `${renameOldName}.sh`;
        const newFileName = `${newName}.sh`;
        const updatedKeyevent = { ...keyevent };
        let changed = false;
        for (const key of Object.keys(updatedKeyevent)) {
            const evt = { ...(updatedKeyevent[key] as any) };
            for (const trigger of ['onpress', 'click', 'dblclick', 'short_press', 'long_press']) {
                if (evt[trigger] === oldFileName) {
                    evt[trigger] = newFileName;
                    changed = true;
                }
            }
            updatedKeyevent[key] = evt;
        }
        if (changed) {
            setKeyevent(updatedKeyevent);
        }

        setIsRenameDialogVisible(false);
    };

    // 单个卡片
    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ScriptStep>) => {
        let borderLeftColor = theme.colors.outline;
        if (item.type === 'logic') borderLeftColor = theme.colors.tertiary;
        if (item.type === 'function') borderLeftColor = theme.colors.primary;
        if (item.type === 'music') borderLeftColor = theme.colors.secondary;
        if (item.type === 'system') borderLeftColor = theme.colors.error;

        return (
            <ScaleDecorator>
                <View
                    style={{
                        flexDirection: 'row',
                        marginBottom: 12,
                        marginHorizontal: 16,
                        backgroundColor: theme.colors.surface,
                        borderRadius: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: borderLeftColor,
                        overflow: 'hidden',
                    }}
                >
                    <TouchableOpacity onPressIn={drag} style={{ padding: 16, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        <MaterialCommunityIcons name="drag-vertical" size={24} color={theme.colors.onSurfaceVariant} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text variant="labelSmall" style={{ color: borderLeftColor, fontWeight: 'bold' }}>
                                {item.name}
                            </Text>
                            <IconButton
                                icon="close"
                                size={16}
                                onPress={() => handleRemoveItem(item.id)}
                            />
                        </View>
                        <TextInput
                            mode="outlined"
                            value={item.command}
                            onChangeText={(text) => handleUpdateCommand(item.id, text)}
                            dense
                            style={{ height: 40 }}
                        />
                    </View>
                </View>
            </ScaleDecorator>
        );
    }, [theme, handleRemoveItem, handleUpdateCommand]);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
                {/* Header */}
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                    <Appbar.Content title="脚本配置" />
                    <Appbar.Action icon="delete-sweep-outline" onPress={handleClear} />
                    <Appbar.Action icon="content-save-outline" onPress={handleOpenSaveDialog} />
                </Appbar.Header>

                <View style={{ flex: 1, flexDirection: 'row' }}>
                    {/* Sidebar: Sidebar (30%) */}
                    <View style={{ width: '30%', borderRightWidth: 1, padding: 8, borderRightColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }}>
                        {/* Tabs for Sidebar */}
                        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                            <TouchableOpacity
                                style={[{ flex: 1, alignItems: 'center', paddingVertical: 8 }, activeTab === 'templates' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                                onPress={() => setActiveTab('templates')}
                            >
                                <Text style={{ color: activeTab === 'templates' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>组件库</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[{ flex: 1, alignItems: 'center', paddingVertical: 8 }, activeTab === 'saved' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                                onPress={() => setActiveTab('saved')}
                            >
                                <Text style={{ color: activeTab === 'saved' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>已保存</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {activeTab === 'templates' ? (
                                // Template List
                                TEMPLATE_LIBRARY.map((category, index) => {
                                    const isCollapsed = collapsedCategories[category.title];
                                    return (
                                        <View key={index} style={{ marginBottom: 8 }}>
                                            <TouchableOpacity
                                                onPress={() => toggleCategory(category.title)}
                                                style={{ flexDirection: 'row', alignItems: 'center', padding: 8, marginBottom: 4 }}
                                            >
                                                <MaterialCommunityIcons
                                                    name={isCollapsed ? "chevron-right" : "chevron-down"}
                                                    size={20}
                                                    color={theme.colors.onSurfaceVariant}
                                                />
                                                <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginLeft: 4, fontWeight: 'bold' }}>
                                                    {category.title}
                                                </Text>
                                            </TouchableOpacity>

                                            {!isCollapsed && category.data.map((template, tIndex) => (
                                                <TouchableOpacity
                                                    key={tIndex}
                                                    style={{ flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 8, elevation: 0, backgroundColor: theme.colors.surfaceVariant, marginLeft: 1 }}
                                                    onPress={() => handleAddTemplate(template)}
                                                    activeOpacity={0.7}
                                                >
                                                    {/* <MaterialCommunityIcons name={template.icon} size={18} color={theme.colors.onSurface} /> */}
                                                    <Text variant="bodySmall" numberOfLines={1} style={{ marginLeft: 8, flex: 1 }}>
                                                        {template.name}
                                                    </Text>
                                                    {/* <MaterialCommunityIcons name="plus-circle-outline" size={16} color={theme.colors.primary} /> */}
                                                </TouchableOpacity>
                                            ))}
                                            <Divider style={{ marginVertical: 12 }} />
                                        </View>
                                    );
                                })
                            ) : (
                                <View>
                                    {libraryScripts.length === 0 ? (
                                        <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }}>暂无保存的脚本</Text>
                                    ) : (
                                        libraryScripts.map((script) => (
                                            <TouchableOpacity
                                                key={script.id}
                                                style={[
                                                    { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 8, marginBottom: 8 },
                                                    {
                                                        backgroundColor: theme.colors.surfaceVariant,
                                                        borderColor: script.name === currentScriptName ? theme.colors.primary : 'transparent',
                                                        borderWidth: 1
                                                    }
                                                ]}
                                                onPress={() => handleLoadScript(script.id)}
                                                onLongPress={() => handleRenameScript(script.id, script.name)}
                                            >
                                                <View style={{ flex: 1 }}>
                                                    <Text variant="bodyMedium" numberOfLines={1} style={{ fontWeight: 'bold' }}>{script.name}</Text>
                                                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                                                        {script.steps.length} 个步骤
                                                    </Text>
                                                </View>
                                                <IconButton
                                                    icon="delete-outline"
                                                    size={16}
                                                    iconColor={theme.colors.error}
                                                    onPress={() => handleDeleteSavedScript(script.id, script.name)}
                                                />
                                            </TouchableOpacity>
                                        ))
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {/* Main Area: Script Editor (70%) */}
                    <View style={{ flex: 1, backgroundColor: 'transparent', overflow: 'hidden' }}>
                        {localScripts.length === 0 ? (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.7 }}>
                                <MaterialCommunityIcons name="playlist-edit" size={64} color={theme.colors.surfaceVariant} />
                                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
                                    从左侧添加组件或加载脚本
                                </Text>
                            </View>
                        ) : (
                            <DraggableFlatList
                                data={localScripts}
                                onDragEnd={({ data }) => setLocalScripts(data)}
                                keyExtractor={(item) => item.id}
                                extraData={localScripts}
                                activationDistance={10}
                                dragItemOverflow={true}
                                renderItem={renderItem}
                                contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
                            />
                        )}
                    </View>
                </View>

                {/* Portal for Dialogs */}
                <Portal>
                    {/* General Confirmation Dialog */}
                    <Dialog visible={confirmDialog.visible} onDismiss={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}>
                        <Dialog.Title>{confirmDialog.title}</Dialog.Title>
                        <Dialog.Content>
                            <Paragraph>{confirmDialog.content}</Paragraph>
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}>取消</Button>
                            <Button onPress={confirmDialog.onConfirm}>确定</Button>
                        </Dialog.Actions>
                    </Dialog>

                    {/* Save Script Dialog */}
                    <Dialog visible={isSaveDialogVisible} onDismiss={() => setIsSaveDialogVisible(false)}>
                        <Dialog.Title>保存脚本</Dialog.Title>
                        <Dialog.Content>
                            <TextInput
                                label="脚本名称"
                                value={saveName}
                                onChangeText={setSaveName}
                                mode="outlined"
                                autoFocus
                                error={!!saveError}
                            />
                            {!!saveError && <Text style={{ color: theme.colors.error, marginTop: 4 }}>{saveError}</Text>}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setIsSaveDialogVisible(false)}>取消</Button>
                            <Button onPress={handleConfirmSave}>保存</Button>
                        </Dialog.Actions>
                    </Dialog>

                    {/* Rename Script Dialog */}
                    <Dialog visible={isRenameDialogVisible} onDismiss={() => setIsRenameDialogVisible(false)}>
                        <Dialog.Title>重命名脚本</Dialog.Title>
                        <Dialog.Content>
                            <TextInput
                                label="新名称"
                                value={renameName}
                                onChangeText={setRenameName}
                                mode="outlined"
                                autoFocus
                                error={!!renameError}
                            />
                            {!!renameError && <Text style={{ color: theme.colors.error, marginTop: 4 }}>{renameError}</Text>}
                        </Dialog.Content>
                        <Dialog.Actions>
                            <Button onPress={() => setIsRenameDialogVisible(false)}>取消</Button>
                            <Button onPress={handleConfirmRename}>确定</Button>
                        </Dialog.Actions>
                    </Dialog>
                </Portal>
            </View>
        </GestureHandlerRootView>
    );
};

export default ScriptConfigScreen;
