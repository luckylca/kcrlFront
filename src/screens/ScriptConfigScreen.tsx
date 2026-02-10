/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Appbar, Text, useTheme, Surface, IconButton, TextInput, Button, Divider, Portal, Dialog, Paragraph } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useScriptStore, ScriptStep, ScriptType } from '../store/useScriptStore';
import { useNavigation } from '@react-navigation/native';

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

const TEMPLATE_LIBRARY: TemplateCategory[] = [
    {
        title: '逻辑控制',
        data: [
            { type: 'logic', name: 'If 条件', command: 'if [ condition ]; then', icon: 'call-split' },
            { type: 'logic', name: 'Else 分支', command: 'else', icon: 'call-merge' },
            { type: 'logic', name: 'Loop 循环', command: 'for i in {1..10}; do', icon: 'refresh' },
            { type: 'logic', name: 'Delay 延时', command: 'sleep 1', icon: 'clock-outline' },
        ],
    },
    {
        title: '功能控制',
        data: [
            { type: 'function', name: '点击', command: 'input tap x y', icon: 'cursor-default-click' },
            { type: 'function', name: '滑动', command: 'input swipe x1 y1 x2 y2 duration', icon: 'gesture-swipe' },
            { type: 'function', name: '输入文本', command: 'input text "hello"', icon: 'keyboard' },
            { type: 'function', name: '启动应用', command: 'am start -n package/activity', icon: 'rocket-launch' },
        ],
    },
    {
        title: '多媒体',
        data: [
            { type: 'music', name: '播放/暂停', command: 'input keyevent 85', icon: 'play-pause' },
            { type: 'music', name: '音量+', command: 'input keyevent 24', icon: 'volume-plus' },
            { type: 'music', name: '音量-', command: 'input keyevent 25', icon: 'volume-minus' },
            { type: 'music', name: '截图', command: 'screencap -p /sdcard/screen.png', icon: 'camera' },
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
        loadScript,
        setCurrentScriptName,
        clearScripts
    } = useScriptStore();

    // Local State
    const [localScripts, setLocalScripts] = useState<ScriptStep[]>([]);
    const [activeTab, setActiveTab] = useState<'templates' | 'saved'>('templates');

    // Dialog State
    // Generic Confirmation Dialog
    const [confirmDialog, setConfirmDialog] = useState<{
        visible: boolean;
        title: string;
        content: string;
        onConfirm: () => void;
    }>({ visible: false, title: '', content: '', onConfirm: () => { } });

    // Save Dialog
    const [isSaveDialogVisible, setIsSaveDialogVisible] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveError, setSaveError] = useState('');

    // Initialize local state from store
    useEffect(() => {
        setLocalScripts(savedScripts);
        // We don't necessarily need to sync name here anymore if we only ask on save, 
        // but it's good to know what we are working on.
        setSaveName(currentScriptName);
    }, [savedScripts, currentScriptName]);

    // Add Item from Template
    const handleAddTemplate = (template: TemplateItem) => {
        const newStep: ScriptStep = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            type: template.type,
            name: template.name,
            command: template.command,
        };
        setLocalScripts([...localScripts, newStep]);
    };

    // Remove Item
    const handleRemoveItem = useCallback((id: string) => {
        setLocalScripts(prev => prev.filter((item) => item.id !== id));
    }, []);

    // Update Item Command
    const handleUpdateCommand = useCallback((id: string, text: string) => {
        setLocalScripts(prev =>
            prev.map((item) => (item.id === id ? { ...item, command: text } : item))
        );
    }, []);

    // Open Save Dialog
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
        setSaveName(currentScriptName || ''); // Pre-fill with current name if existing
        setSaveError(''); // Reset error
        setIsSaveDialogVisible(true);
    };

    // Confirm Save
    const handleConfirmSave = () => {
        if (!saveName.trim()) {
            setSaveError('请输入脚本名称');
            return;
        }

        saveScript(saveName, localScripts);
        setCurrentScriptName(saveName);
        setIsSaveDialogVisible(false);
    };

    // Handle Load Script
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

    // Handle Delete Saved Script
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

    // Handle Clear Current
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

    // Render Item
    const renderItem = useCallback(({ item, drag, isActive }: RenderItemParams<ScriptStep>) => {
        let borderLeftColor = theme.colors.outline;
        if (item.type === 'logic') borderLeftColor = theme.colors.tertiary;
        if (item.type === 'function') borderLeftColor = theme.colors.primary;
        if (item.type === 'music') borderLeftColor = theme.colors.secondary;

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
            <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
                {/* Header */}
                <Appbar.Header>
                    <Appbar.BackAction onPress={() => navigation.goBack()} />
                    <Appbar.Content title="脚本配置" />
                    <Appbar.Action icon="delete-sweep-outline" onPress={handleClear} />
                    <Appbar.Action icon="content-save-outline" onPress={handleOpenSaveDialog} />
                </Appbar.Header>

                <View style={styles.splitView}>
                    {/* Sidebar: Sidebar (30%) */}
                    <View style={[styles.sidebar, { borderRightColor: theme.colors.outlineVariant, backgroundColor: theme.colors.surface }]}>
                        {/* Tabs for Sidebar */}
                        <View style={styles.sidebarTabs}>
                            <TouchableOpacity
                                style={[styles.sidebarTab, activeTab === 'templates' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                                onPress={() => setActiveTab('templates')}
                            >
                                <Text style={{ color: activeTab === 'templates' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>组件库</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.sidebarTab, activeTab === 'saved' && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 }]}
                                onPress={() => setActiveTab('saved')}
                            >
                                <Text style={{ color: activeTab === 'saved' ? theme.colors.primary : theme.colors.onSurfaceVariant }}>已保存</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                            {activeTab === 'templates' ? (
                                // Template List
                                TEMPLATE_LIBRARY.map((category, index) => (
                                    <View key={index} style={styles.categoryBlock}>
                                        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 8, paddingLeft: 8 }}>
                                            {category.title}
                                        </Text>
                                        {category.data.map((template, tIndex) => (
                                            <TouchableOpacity
                                                key={tIndex}
                                                style={[styles.templateItem, { backgroundColor: theme.colors.surfaceVariant }]}
                                                onPress={() => handleAddTemplate(template)}
                                                activeOpacity={0.7}
                                            >
                                                <MaterialCommunityIcons name={template.icon} size={18} color={theme.colors.onSurface} />
                                                <Text variant="bodySmall" numberOfLines={1} style={{ marginLeft: 8, flex: 1 }}>
                                                    {template.name}
                                                </Text>
                                                <MaterialCommunityIcons name="plus-circle-outline" size={16} color={theme.colors.primary} />
                                            </TouchableOpacity>
                                        ))}
                                        <Divider style={{ marginVertical: 12 }} />
                                    </View>
                                ))
                            ) : (
                                // Saved Scripts List
                                <View>
                                    {libraryScripts.length === 0 ? (
                                        <Text style={{ textAlign: 'center', marginTop: 20, color: theme.colors.onSurfaceVariant }}>暂无保存的脚本</Text>
                                    ) : (
                                        libraryScripts.map((script) => (
                                            <TouchableOpacity
                                                key={script.id}
                                                style={[
                                                    styles.savedScriptItem,
                                                    {
                                                        backgroundColor: theme.colors.surfaceVariant,
                                                        borderColor: script.name === currentScriptName ? theme.colors.primary : 'transparent',
                                                        borderWidth: 1
                                                    }
                                                ]}
                                                onPress={() => handleLoadScript(script.id)}
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
                    <View style={styles.mainArea}>
                        {localScripts.length === 0 ? (
                            <View style={styles.emptyState}>
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
                </Portal>
            </View>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    splitView: {
        flex: 1,
        flexDirection: 'row',
    },
    sidebar: {
        width: '30%',
        borderRightWidth: 1,
        padding: 8,
    },
    sidebarTabs: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    sidebarTab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 8,
    },
    categoryBlock: {
        marginBottom: 8,
    },
    templateItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
        elevation: 0,
    },
    savedScriptItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8,
    },
    mainArea: {
        flex: 1,
        backgroundColor: 'transparent',
        overflow: 'hidden',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.7,
    },
});

export default ScriptConfigScreen;
