/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    Animated,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Button,
    Snackbar,
    Portal,
    Dialog,
    RadioButton,
    ActivityIndicator,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary, Asset } from 'react-native-image-picker';
import { pick, types as docTypes, isErrorWithCode, errorCodes } from '@react-native-documents/picker';
import RNFS from 'react-native-fs';
import { useScriptStore, SavedScript } from '../store/useScriptStore';
import OLAPI from '../api/OLAPI';

// ─── Animated Tag Chip ─────────────────────────────────────────────
const TagChip = ({
    label,
    isSelected,
    onSelect,
    theme,
}: {
    label: string;
    isSelected: boolean;
    onSelect: (label: string) => void;
    theme: any;
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
                onPress={() => onSelect(label)}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={0.8}
            >
                <Surface
                    style={[
                        styles.tagChip,
                        {
                            backgroundColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.surface,
                            borderColor: isSelected
                                ? 'transparent'
                                : theme.colors.outline,
                            borderWidth: isSelected ? 0 : 1,
                        },
                    ]}
                    elevation={isSelected ? 2 : 0}
                >
                    <Text
                        style={{
                            color: isSelected
                                ? theme.colors.onPrimary
                                : theme.colors.onSurfaceVariant,
                            fontWeight: isSelected ? 'bold' : 'normal',
                            fontSize: 13,
                        }}
                    >
                        {label}
                    </Text>
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );
};

// ─── CreatePostScreen ──────────────────────────────────────────────
const CreatePostScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();

    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [author, setAuthor] = useState('');
    const [selectedTag, setSelectedTag] = useState('');
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // ── Attachments ──
    const [selectedImages, setSelectedImages] = useState<Asset[]>([]);
    const [selectedScript, setSelectedScript] = useState<SavedScript | null>(null);
    const [scriptDialogVisible, setScriptDialogVisible] = useState(false);
    const [selectedExtFile, setSelectedExtFile] = useState<{ uri: string; name: string; type: string; size?: number } | null>(null);

    const savedScripts = useScriptStore(state => state.savedScripts);

    const tags = ['模块', '主题', '工具', '脚本', '闲聊'];

    const tagToCategoryMap: Record<string, string> = {
        '模块': 'extension',
        '主题': 'theme',
        '工具': 'article',
        '脚本': 'script',
        '帖子': 'article',
    };

    // ── Load saved author name ──
    useEffect(() => {
        OLAPI.getUserInfo().then(info => {
            if (info?.name) {
                setAuthor(info.name);
            }
        });
    }, []);

    const canSubmit = title.trim().length > 0 && body.trim().length > 0 && selectedTag.length > 0 && author.trim().length > 0;

    // ── Image Picker ──
    const handlePickImages = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                selectionLimit: 9,
                quality: 0.8,
            },
            (response) => {
                if (response.didCancel || response.errorCode) { return; }
                if (response.assets) {
                    setSelectedImages(prev => {
                        const combined = [...prev, ...response.assets!];
                        return combined.slice(0, 9); // max 9 images
                    });
                }
            },
        );
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
    };

    // ── Script Picker ──
    const handleSelectScript = (script: SavedScript) => {
        setSelectedScript(script);
        setScriptDialogVisible(false);
    };

    const removeScript = () => {
        setSelectedScript(null);
    };

    // ── Extension File Picker ──
    const handlePickExtension = async () => {
        try {
            const [result] = await pick({
                type: [docTypes.allFiles],
            });
            if (result) {
                setSelectedExtFile({
                    uri: result.uri,
                    name: result.name || 'unknown_file',
                    type: result.type || 'application/octet-stream',
                    size: result.size ?? undefined,
                });
            }
        } catch (err) {
            if (isErrorWithCode(err) && err.code === errorCodes.OPERATION_CANCELED) {
                return; // 用户取消，忽略
            }
            setSnackMessage('文件选择失败');
            setSnackVisible(true);
        }
    };

    const removeExtension = () => {
        setSelectedExtFile(null);
    };

    // ── Publish ──
    const handlePublish = async () => {
        if (!canSubmit) {
            setSnackMessage('请填写标题、选择分类并输入正文');
            setSnackVisible(true);
            return;
        }

        setIsUploading(true);
        try {
            // Save author name for next time
            await OLAPI.saveUserInfo({ name: author.trim() });

            const postData: any = {
                title,
                author: author.trim(),
                content: body,
                summary: body.substring(0, 100),
                category: tagToCategoryMap[selectedTag] || 'article',
            };

            // Attach first image if selected
            if (selectedImages.length > 0) {
                const img = selectedImages[0];
                postData.image = {
                    uri: img.uri,
                    type: img.type || 'image/jpeg',
                    name: img.fileName || 'image.jpg',
                };
            }

            // Attach script .sh file via file field
            if (selectedScript) {
                const safeName = selectedScript.name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
                const SCRIPTS_DIR = `${RNFS.ExternalDirectoryPath}/scripts`;
                const shPath = `${SCRIPTS_DIR}/${safeName}.sh`;
                const shExists = await RNFS.exists(shPath);
                if (shExists) {
                    postData.file = {
                        uri: Platform.OS === 'android' ? `file://${shPath}` : shPath,
                        type: 'application/x-sh',
                        name: `${safeName}.sh`,
                    };
                } else {
                    setSnackMessage(`脚本文件 ${safeName}.sh 不存在，请先保存脚本`);
                    setSnackVisible(true);
                    setIsUploading(false);
                    return;
                }
            }

            // Attach extension file (any file) to file field
            if (selectedExtFile) {
                postData.file = {
                    uri: selectedExtFile.uri,
                    type: selectedExtFile.type,
                    name: selectedExtFile.name,
                };
            }

            const result = await OLAPI.uploadPost(postData);

            if (result.success) {
                setSnackMessage('发布完成，正在审核');
                setSnackVisible(true);
                setTimeout(() => navigation.goBack(), 1500);
            } else {
                setSnackMessage(result.message || '发布失败');
                setSnackVisible(true);
            }
        } catch (error) {
            setSnackMessage('发布失败，请检查网络');
            setSnackVisible(true);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* ── Appbar ── */}
            <Appbar.Header
                style={{ backgroundColor: 'transparent' }}
                statusBarHeight={insets.top}
            >
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="发帖" titleStyle={{ fontWeight: 'bold' }} />
                <Button
                    mode="contained"
                    onPress={handlePublish}
                    disabled={!canSubmit || isUploading}
                    style={styles.publishBtn}
                    labelStyle={{ fontWeight: 'bold', fontSize: 13 }}
                    contentStyle={{ height: 36 }}
                >
                    {isUploading ? '发布中...' : '发布'}
                </Button>
            </Appbar.Header>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── 发送 ID (作者) ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                        发送 ID
                    </Text>
                    <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                        <TextInput
                            placeholder="输入你的昵称/ID..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={author}
                            onChangeText={setAuthor}
                            style={[styles.titleInput, { color: theme.colors.onSurface }]}
                            maxLength={20}
                        />
                    </Surface>
                    <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 4 }}>
                        设置后将自动记住，下次发帖无需重新填写
                    </Text>

                    {/* ── 标题 ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant, marginTop: 20 }]}>
                        标题
                    </Text>
                    <Surface style={[styles.inputSurface, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                        <TextInput
                            placeholder="输入帖子标题..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={title}
                            onChangeText={setTitle}
                            style={[styles.titleInput, { color: theme.colors.onSurface }]}
                            maxLength={80}
                        />
                    </Surface>
                    <Text variant="labelSmall" style={{ color: theme.colors.outline, textAlign: 'right', marginTop: 4 }}>
                        {title.length}/80
                    </Text>

                    {/* ── 分类 ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant, marginTop: 20 }]}>
                        分类
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.tagsRow}
                    >
                        {tags.map(tag => (
                            <TagChip
                                key={tag}
                                label={tag}
                                isSelected={selectedTag === tag}
                                onSelect={setSelectedTag}
                                theme={theme}
                            />
                        ))}
                    </ScrollView>

                    {/* ── 正文 ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant, marginTop: 20 }]}>
                        正文
                    </Text>
                    <Surface style={[styles.inputSurface, styles.bodyInputSurface, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                        <TextInput
                            placeholder="分享你的想法..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={body}
                            onChangeText={setBody}
                            style={[styles.bodyInput, { color: theme.colors.onSurface }]}
                            multiline
                            textAlignVertical="top"
                        />
                    </Surface>

                    {/* ── 附件区域 ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant, marginTop: 24 }]}>
                        附件
                    </Text>

                    {/* ── 图片选择 ── */}
                    <Surface style={[styles.attachSection, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                        <View style={styles.attachHeader}>
                            <MaterialCommunityIcons name="image-multiple" size={20} color={theme.colors.primary} />
                            <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: '600' }}>
                                图片
                            </Text>
                            <Text variant="labelSmall" style={{ marginLeft: 8, color: theme.colors.outline }}>
                                {selectedImages.length}/9
                            </Text>
                        </View>

                        {selectedImages.length > 0 && (
                            <View style={styles.imageGrid}>
                                {selectedImages.map((img, index) => (
                                    <View key={index} style={styles.imageThumb}>
                                        <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                                        <TouchableOpacity
                                            style={[styles.removeBtn, { backgroundColor: theme.colors.error }]}
                                            onPress={() => removeImage(index)}
                                            activeOpacity={0.7}
                                        >
                                            <MaterialCommunityIcons name="close" size={14} color="#fff" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.addAttachBtn, { borderColor: theme.colors.outline + '60' }]}
                            onPress={handlePickImages}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
                            <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                                从相册选择
                            </Text>
                        </TouchableOpacity>
                    </Surface>

                    {/* ── 脚本选择 ── */}
                    <Surface style={[styles.attachSection, { backgroundColor: theme.colors.elevation.level1, marginTop: 12 }]} elevation={0}>
                        <View style={styles.attachHeader}>
                            <MaterialCommunityIcons name="script-text" size={20} color={theme.colors.tertiary} />
                            <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: '600' }}>
                                脚本
                            </Text>
                        </View>

                        {selectedScript && (
                            <Surface
                                style={[styles.scriptChip, { backgroundColor: theme.colors.secondaryContainer }]}
                                elevation={0}
                            >
                                <MaterialCommunityIcons name="script-text-outline" size={18} color={theme.colors.onSecondaryContainer} />
                                <Text
                                    variant="bodyMedium"
                                    style={{ flex: 1, marginLeft: 8, color: theme.colors.onSecondaryContainer, fontWeight: '500' }}
                                    numberOfLines={1}
                                >
                                    {selectedScript.name}
                                </Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer + '80', marginRight: 8 }}>
                                    {selectedScript.steps.length} 步
                                </Text>
                                <TouchableOpacity onPress={removeScript} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.onSecondaryContainer + '80'} />
                                </TouchableOpacity>
                            </Surface>
                        )}

                        <TouchableOpacity
                            style={[styles.addAttachBtn, { borderColor: theme.colors.outline + '60' }]}
                            onPress={() => {
                                if (savedScripts.length === 0) {
                                    setSnackMessage('暂无已保存的脚本');
                                    setSnackVisible(true);
                                    return;
                                }
                                setScriptDialogVisible(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.tertiary} />
                            <Text variant="labelMedium" style={{ color: theme.colors.tertiary, marginLeft: 6 }}>
                                选择脚本
                            </Text>
                        </TouchableOpacity>
                    </Surface>

                    {/* ── 扩展文件选择 ── */}
                    <Surface style={[styles.attachSection, { backgroundColor: theme.colors.elevation.level1, marginTop: 12 }]} elevation={0}>
                        <View style={styles.attachHeader}>
                            <MaterialCommunityIcons name="file-plus" size={20} color={theme.colors.secondary} />
                            <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: '600' }}>
                                扩展附件
                            </Text>
                            <Text variant="labelSmall" style={{ marginLeft: 8, color: theme.colors.outline }}>
                                支持任意文件
                            </Text>
                        </View>

                        {selectedExtFile && (
                            <Surface
                                style={[styles.scriptChip, { backgroundColor: theme.colors.secondaryContainer }]}
                                elevation={0}
                            >
                                <MaterialCommunityIcons name="file-outline" size={18} color={theme.colors.onSecondaryContainer} />
                                <View style={{ flex: 1, marginLeft: 8 }}>
                                    <Text
                                        variant="bodyMedium"
                                        style={{ color: theme.colors.onSecondaryContainer, fontWeight: '500' }}
                                        numberOfLines={1}
                                    >
                                        {selectedExtFile.name}
                                    </Text>
                                    {selectedExtFile.size != null && (
                                        <Text variant="labelSmall" style={{ color: theme.colors.onSecondaryContainer + '80', marginTop: 2 }}>
                                            {selectedExtFile.size > 1024 * 1024
                                                ? `${(selectedExtFile.size / 1024 / 1024).toFixed(1)} MB`
                                                : `${(selectedExtFile.size / 1024).toFixed(1)} KB`}
                                        </Text>
                                    )}
                                </View>
                                <TouchableOpacity onPress={removeExtension} activeOpacity={0.7}>
                                    <MaterialCommunityIcons name="close-circle" size={20} color={theme.colors.onSecondaryContainer + '80'} />
                                </TouchableOpacity>
                            </Surface>
                        )}

                        <TouchableOpacity
                            style={[styles.addAttachBtn, { borderColor: theme.colors.outline + '60' }]}
                            onPress={handlePickExtension}
                            activeOpacity={0.7}
                        >
                            <MaterialCommunityIcons name="plus" size={22} color={theme.colors.secondary} />
                            <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 6 }}>
                                选择文件
                            </Text>
                        </TouchableOpacity>
                    </Surface>

                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Loading Overlay ── */}
            {isUploading && (
                <View style={styles.loadingOverlay}>
                    <Surface style={[styles.loadingCard, { backgroundColor: theme.colors.surface }]} elevation={4}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                        <Text variant="bodyMedium" style={{ marginTop: 12, color: theme.colors.onSurface }}>
                            正在发布...
                        </Text>
                    </Surface>
                </View>
            )}

            {/* ── Script Selection Dialog ── */}
            <Portal>
                <Dialog
                    visible={scriptDialogVisible}
                    onDismiss={() => setScriptDialogVisible(false)}
                    style={{ borderRadius: 24 }}
                >
                    <Dialog.Title>选择脚本</Dialog.Title>
                    <Dialog.ScrollArea style={{ paddingHorizontal: 0, maxHeight: 320 }}>
                        <ScrollView>
                            {savedScripts.map((script) => (
                                <TouchableOpacity
                                    key={script.id}
                                    style={[
                                        styles.scriptListItem,
                                        selectedScript?.id === script.id && { backgroundColor: theme.colors.secondaryContainer + '40' },
                                    ]}
                                    onPress={() => handleSelectScript(script)}
                                    activeOpacity={0.7}
                                >
                                    <MaterialCommunityIcons name="script-text-outline" size={22} color={theme.colors.primary} />
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <Text variant="bodyLarge" style={{ fontWeight: '500', color: theme.colors.onSurface }}>
                                            {script.name}
                                        </Text>
                                        <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                                            {script.steps.length} 个步骤 · 更新于 {new Date(script.updatedAt).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    {selectedScript?.id === script.id && (
                                        <MaterialCommunityIcons name="check-circle" size={22} color={theme.colors.primary} />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Dialog.ScrollArea>
                    <Dialog.Actions>
                        <Button onPress={() => setScriptDialogVisible(false)}>取消</Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>

            {/* ── Snackbar ── */}
            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={2000}
                style={{ marginBottom: insets.bottom + 8 }}
            >
                {snackMessage}
            </Snackbar>
        </View>
    );
};

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    label: {
        marginBottom: 8,
        fontWeight: '600',
    },
    inputSurface: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    titleInput: {
        fontSize: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
    },
    tagsRow: {
        flexDirection: 'row',
        gap: 8,
        paddingVertical: 4,
    },
    tagChip: {
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    bodyInputSurface: {
        minHeight: 200,
    },
    bodyInput: {
        fontSize: 15,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 14,
        minHeight: 200,
    },
    publishBtn: {
        borderRadius: 20,
        marginRight: 8,
    },
    // ── Attachment Styles ──
    attachSection: {
        borderRadius: 16,
        padding: 16,
    },
    attachHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    imageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    imageThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'hidden',
    },
    thumbImage: {
        width: '100%',
        height: '100%',
    },
    removeBtn: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addAttachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: 'dashed',
    },
    scriptChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 14,
        marginBottom: 12,
    },
    scriptListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingCard: {
        paddingHorizontal: 40,
        paddingVertical: 32,
        borderRadius: 24,
        alignItems: 'center',
    },
});

export default CreatePostScreen;
