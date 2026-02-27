/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
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

// 创建一个简单的提示输入组件

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
                        {
                            paddingHorizontal: 18,
                            paddingVertical: 10,
                            borderRadius: 20,
                            justifyContent: 'center',
                            alignItems: 'center',
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
    const [selectedExtFile, setSelectedExtFile] = useState<{
      uri: string;
      name: string;
      type: string;
      size?: number;
    } | null>(null);
    
    // 新增：正文中的图片和链接
    const [bodyImages, setBodyImages] = useState<Asset[]>([]);
    const [bodyLinks, setBodyLinks] = useState<string[]>([]);
    const [showInsertTools, setShowInsertTools] = useState(false);

    const savedScripts = useScriptStore(state => state.savedScripts);

    const tags = ['扩展', '主题', '脚本', '帖子'];

    const tagToCategoryMap: Record<string, string> = {
        '扩展': 'extension',
        '主题': 'theme',
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

    // ── Check if attachments are allowed for selected category ──
    const canAddImages = selectedTag === '主题';
    const canAddScripts = selectedTag === '脚本';
    const canAddExtensions = selectedTag === '扩展'; // Only "扩展" category can add extensions
    const canAddAnyAttachment = selectedTag === '帖子'; // No attachments allowed

    // ── Image Picker ──
    const handlePickImages = () => {
        launchImageLibrary(
            {
                mediaType: 'photo',
                selectionLimit: 1,
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

    // 新增：处理正文中的图片和链接
    const [insertImageDialogVisible, setInsertImageDialogVisible] = useState(false);
    const [insertLinkDialogVisible, setInsertLinkDialogVisible] = useState(false);
    const [imageInputValue, setImageInputValue] = useState('');
    const [linkInputValue, setLinkInputValue] = useState('');

    const handleInsertImage = () => {
        setImageInputValue('');
        setInsertImageDialogVisible(true);
    };

    const handleInsertLink = () => {
        setLinkInputValue('');
        setInsertLinkDialogVisible(true);
    };

    const confirmInsertImage = () => {
        if (imageInputValue.trim()) {
            // 生成图片标记
            const imageIndex = bodyImages.length;
            const imageTag = `[IMG=${imageInputValue.trim()}]`;
            setBody(prevBody => prevBody + '\n' + imageTag + '\n');
            
            // 添加到图片列表（仅用于显示，不上传）
            setBodyImages(prev => [...prev, { uri: imageInputValue.trim(), fileName: `image_${imageIndex}`, type: 'image/jpeg' } as Asset]);
        }
        setInsertImageDialogVisible(false);
    };

    const confirmInsertLink = () => {
        if (linkInputValue.trim()) {
            const newLinks = [...bodyLinks, linkInputValue.trim()];
            setBodyLinks(newLinks);
            
            // 在正文中插入链接标记
            const linkTag = `[URL=${linkInputValue.trim()}]${linkInputValue.trim()}[/URL]`;
            setBody(prevBody => prevBody + '\n' + linkTag + '\n');
        }
        setInsertLinkDialogVisible(false);
    };

    const removeBodyImage = (index: number) => {
        const newImages = bodyImages.filter((_, i) => i !== index);
        setBodyImages(newImages);
        
        // 从正文中移除对应的图片标记
        const imageTag = `[IMG=${bodyImages[index].uri}]`;
        setBody(prevBody => prevBody.replace(imageTag, ''));
    };

    const removeBodyLink = (index: number) => {
        const newLinks = bodyLinks.filter((_, i) => i !== index);
        setBodyLinks(newLinks);
        
        // 从正文中移除对应的链接标记
        const linkTag = `[URL=${bodyLinks[index]}]${bodyLinks[index]}[/URL]`;
        setBody(prevBody => prevBody.replace(linkTag, ''));
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
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
                    style={{ borderRadius: 20, marginRight: 8 }}
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
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* ── 发送 ID (作者) ── */}
                    <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: theme.colors.onSurfaceVariant }}>
                        发送 ID
                    </Text>
                    <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                        <TextInput
                            placeholder="输入你的昵称/ID..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={author}
                            onChangeText={setAuthor}
                            style={{ fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, color: theme.colors.onSurface }}
                            maxLength={20}
                        />
                    </Surface>

                    {/* ── 标题 ── */}
                    <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: theme.colors.onSurfaceVariant, marginTop: 20 }}>
                        标题
                    </Text>
                    <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                        <TextInput
                            placeholder="输入帖子标题..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={title}
                            onChangeText={setTitle}
                            style={{ fontSize: 16, paddingHorizontal: 16, paddingVertical: 14, color: theme.colors.onSurface }}
                            maxLength={80}
                        />
                    </Surface>
                    <Text variant="labelSmall" style={{ color: theme.colors.outline, textAlign: 'right', marginTop: 4 }}>
                        {title.length}/80
                    </Text>

                    {/* ── 分类 ── */}
                    <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: theme.colors.onSurfaceVariant, marginTop: 20 }}>
                        分类
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ flexDirection: 'row', gap: 8, paddingVertical: 4 }}
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
                    <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: theme.colors.onSurfaceVariant, marginTop: 20 }}>
                        正文
                    </Text>
                    <Surface style={{ borderRadius: 16, overflow: 'hidden', minHeight: 200, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                        <TextInput
                            placeholder="分享你的想法..."
                            placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                            value={body}
                            onChangeText={setBody}
                            style={{ fontSize: 15, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, minHeight: 200, color: theme.colors.onSurface }}
                            multiline
                            textAlignVertical="top"
                        />
                        
                        {/* 正文工具栏 */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.outline + '30' }}>
                            <TouchableOpacity
                                style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.primaryContainer }}
                                onPress={() => setShowInsertTools(!showInsertTools)}
                                activeOpacity={0.7}
                            >
                                <MaterialCommunityIcons name="plus" size={18} color={theme.colors.primary} />
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4 }}>
                                    插入
                                </Text>
                            </TouchableOpacity>
                            
                            {showInsertTools && (
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.secondaryContainer }}
                                        onPress={handleInsertImage}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="image" size={16} color={theme.colors.secondary} />
                                        <Text variant="labelSmall" style={{ color: theme.colors.secondary, marginLeft: 2 }}>
                                            图片
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.tertiaryContainer }}
                                        onPress={handleInsertLink}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="link" size={16} color={theme.colors.tertiary} />
                                        <Text variant="labelSmall" style={{ color: theme.colors.tertiary, marginLeft: 2 }}>
                                            链接
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        
                        {/* 已插入的图片和链接预览 */}
                        {(bodyImages.length > 0 || bodyLinks.length > 0) && (
                            <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.outline + '30' }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.outline, marginBottom: 8 }}>
                                    已插入内容
                                </Text>
                                
                                {/* 图片预览 */}
                                {bodyImages.map((img, index) => (
                                    <View key={`img_${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <MaterialCommunityIcons name="image" size={16} color={theme.colors.secondary} />
                                        <Text variant="labelSmall" style={{ flex: 1, marginLeft: 8, color: theme.colors.onSurfaceVariant }}>
                                            [IMG={img.uri}]
                                        </Text>
                                        <TouchableOpacity onPress={() => removeBodyImage(index)}>
                                            <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                
                                {/* 链接预览 */}
                                {bodyLinks.map((link, index) => (
                                    <View key={`link_${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                        <MaterialCommunityIcons name="link" size={16} color={theme.colors.tertiary} />
                                        <Text variant="labelSmall" style={{ flex: 1, marginLeft: 8, color: theme.colors.onSurfaceVariant }} numberOfLines={1}>
                                            [URL={link}]{link}[/URL]
                                        </Text>
                                        <TouchableOpacity onPress={() => removeBodyLink(index)}>
                                            <MaterialCommunityIcons name="close-circle" size={16} color={theme.colors.error} />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}

                        {/* 插入图片对话框 */}
                        <Portal>
                            <Dialog visible={insertImageDialogVisible} onDismiss={() => setInsertImageDialogVisible(false)} style={{ borderRadius: 16 }}>
                                <Dialog.Title>插入图片链接</Dialog.Title>
                                <Dialog.Content>
                                    <Text style={{ marginBottom: 16 }}>请输入图片链接地址</Text>
                                    <TextInput
                                        value={imageInputValue}
                                        onChangeText={setImageInputValue}
                                        autoFocus
                                        multiline={false}
                                        style={{ marginBottom: 16 }}
                                    />
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button onPress={() => setInsertImageDialogVisible(false)}>取消</Button>
                                    <Button onPress={confirmInsertImage}>确定</Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>

                        {/* 插入链接对话框 */}
                        <Portal>
                            <Dialog visible={insertLinkDialogVisible} onDismiss={() => setInsertLinkDialogVisible(false)} style={{ borderRadius: 16 }}>
                                <Dialog.Title>插入链接</Dialog.Title>
                                <Dialog.Content>
                                    <Text style={{ marginBottom: 16 }}>请输入链接地址</Text>
                                    <TextInput
                                        value={linkInputValue}
                                        onChangeText={setLinkInputValue}
                                        autoFocus
                                        multiline={false}
                                        style={{ marginBottom: 16 }}
                                    />
                                </Dialog.Content>
                                <Dialog.Actions>
                                    <Button onPress={() => setInsertLinkDialogVisible(false)}>取消</Button>
                                    <Button onPress={confirmInsertLink}>确定</Button>
                                </Dialog.Actions>
                            </Dialog>
                        </Portal>
                    </Surface>

                    {/* ── 附件区域 ── */}
                    {selectedTag ? (
                        <>
                            <Text variant="labelLarge" style={{ marginBottom: 8, fontWeight: '600', color: theme.colors.onSurfaceVariant, marginTop: 24 }}>
                                附件
                            </Text>

                            {/* ── 图片选择 ── */}
                            {canAddImages && (
                                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <MaterialCommunityIcons name="image-multiple" size={20} color={theme.colors.primary} />
                                        <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: '600' }}>
                                            图片
                                        </Text>
                                        <Text variant="labelSmall" style={{ marginLeft: 8, color: theme.colors.outline }}>
                                            {selectedImages.length}/1
                                        </Text>
                                    </View>

                                    {selectedImages.length > 0 && (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                                            {selectedImages.map((img, index) => (
                                                <View key={index} style={{ width: 80, height: 80, borderRadius: 12, overflow: 'hidden' }}>
                                                    <Image source={{ uri: img.uri }} style={{ width: '100%', height: '100%' }} />
                                                    <TouchableOpacity
                                                        style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.error }}
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
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.outline + '60' }}
                                        onPress={handlePickImages}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="plus" size={22} color={theme.colors.primary} />
                                        <Text variant="labelMedium" style={{ color: theme.colors.primary, marginLeft: 6 }}>
                                            从相册选择
                                        </Text>
                                    </TouchableOpacity>
                                </Surface>
                            )}

                            {/* ── 脚本选择 ── */}
                            {canAddScripts && (
                                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.elevation.level1, marginTop: canAddImages ? 12 : 0 }} elevation={0}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <MaterialCommunityIcons name="script-text" size={20} color={theme.colors.tertiary} />
                                        <Text variant="labelLarge" style={{ marginLeft: 8, color: theme.colors.onSurface, fontWeight: '600' }}>
                                            脚本
                                        </Text>
                                    </View>

                                    {selectedScript && (
                                        <Surface
                                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 12, backgroundColor: theme.colors.secondaryContainer }}
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
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.outline + '60' }}
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
                            )}

                            {/* ── 扩展文件选择 ── */}
                            {canAddExtensions && (
                                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.elevation.level1, marginTop: (canAddImages || canAddScripts) ? 12 : 0 }} elevation={0}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
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
                                            style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, marginBottom: 12, backgroundColor: theme.colors.secondaryContainer }}
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
                                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: theme.colors.outline + '60' }}
                                        onPress={handlePickExtension}
                                        activeOpacity={0.7}
                                    >
                                        <MaterialCommunityIcons name="plus" size={22} color={theme.colors.secondary} />
                                        <Text variant="labelMedium" style={{ color: theme.colors.secondary, marginLeft: 6 }}>
                                            选择文件
                                        </Text>
                                    </TouchableOpacity>
                                </Surface>
                            )}

                            {!canAddImages && !canAddScripts && !canAddExtensions && (
                                <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.outline} />
                                        <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.outline }}>
                                            此分类不支持添加附件
                                        </Text>
                                    </View>
                                </Surface>
                            )}
                        </>
                    ) : (
                        <Surface style={{ borderRadius: 16, padding: 16, backgroundColor: theme.colors.elevation.level1, marginTop: 24 }} elevation={0}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <MaterialCommunityIcons name="information-outline" size={20} color={theme.colors.outline} />
                                <Text variant="bodyMedium" style={{ marginLeft: 8, color: theme.colors.outline }}>
                                    请先选择分类
                                </Text>
                            </View>
                        </Surface>
                    )}

                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Loading Overlay ── */}
            {isUploading && (
                <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
                    <Surface style={{ paddingHorizontal: 40, paddingVertical: 32, borderRadius: 24, alignItems: 'center', backgroundColor: theme.colors.surface }} elevation={4}>
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
                                        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 14 },
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

export default CreatePostScreen;
