/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
    View,
    ScrollView,
    ActivityIndicator,
    TouchableOpacity,
    Linking,
    Alert,
    Image,
    Dimensions,
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Avatar,
    Snackbar,
    Button,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import RNFS from 'react-native-fs';
import OLAPI from '../api/OLAPI';
import { useScriptStore } from '../store/useScriptStore';
import { parseScriptSteps, parseInnerName } from '../utils/scriptParser';

const API_BASE_URL = 'http://47.113.189.138/';
const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helper: 判断文件类型 ──────────────────────────────────────────
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'];

const getFileExtension = (filePath: string): string => {
    const name = filePath.split('/').pop() || '';
    const dotIndex = name.lastIndexOf('.');
    return dotIndex >= 0 ? name.substring(dotIndex).toLowerCase() : '';
};

const isImageFile = (filePath: string): boolean => {
    return IMAGE_EXTENSIONS.includes(getFileExtension(filePath));
};

const isShellScript = (filePath: string): boolean => {
    return getFileExtension(filePath) === '.sh';
};

// ─── PostDetailScreen ──────────────────────────────────────────────
const PostDetailScreen = ({ navigation, route }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const post = route.params?.post;
    const fromTab = route.params?.fromTab;

    const [fullPost, setFullPost] = useState(post);
    const [loading, setLoading] = useState(false);
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [saving, setSaving] = useState(false);
    const [resolvedScriptName, setResolvedScriptName] = useState<string | null>(null);
    const [fileSize, setFileSize] = useState<number>(0);

    const saveScript = useScriptStore(state => state.saveScript);

    // Fetch full post content from API if we have an ID
    useEffect(() => {
        if (post?.id) {
            setLoading(true);
            console.log("post.id", post.id);
            OLAPI.getPostById(post.id).then(result => {
                if (result.success && result.data) {
                    const postData = Array.isArray(result.data) ? result.data[0] : result.data;
                    setFullPost(postData);
                    if (postData.category === "script") {
                        setFullPost({ ...postData, category: "脚本" })
                    }
                    else if (postData.category === "extension") {
                        setFullPost({ ...postData, category: "扩展" })
                    }
                    else if (postData.category === "theme") {
                        setFullPost({ ...postData, category: "主题" })
                    }
                    else {
                        setFullPost({ ...postData, category: "其他" })
                    }
                    console.log("postData", postData);
                }
            }).finally(() => setLoading(false));
        }
    }, [post?.id]);

    const getFullUrl = (filePath: string) => {
        return filePath.startsWith('http') ? filePath : `${API_BASE_URL}${filePath}`;
    };

    // 获取sh脚本内部名字
    useEffect(() => {
        if (fullPost?.file_path && isShellScript(fullPost.file_path)) {
            const url = getFullUrl(fullPost.file_path);
            fetch(url)
                .then(res => res.text())
                .then(content => {
                    const innerName = parseInnerName(content);
                    if (innerName) {
                        setResolvedScriptName(innerName);
                    }
                })
        }
    }, [fullPost?.file_path]);

    // 获取文件大小
    useEffect(() => {
        if (fullPost?.file_path) {
            OLAPI.getFileSize(fullPost.file_path).then(size => {
                if (size > 0) { setFileSize(size); }
            });
        }
    }, [fullPost?.file_path]);

    const formatFileSize = (bytes: number): string => {
        if (bytes <= 0) { return ''; }
        if (bytes < 1024) { return `${bytes}B`; }
        if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)}KB`; }
        return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    };

    const handleOpenInBrowser = (filePath: string) => {
        const fullUrl = getFullUrl(filePath);
        Linking.canOpenURL(fullUrl).then(supported => {
            if (supported) {
                Linking.openURL(fullUrl);
            } else {
                Alert.alert('无法打开', '无法打开此文件链接');
            }
        });
    };

    // 下载sh脚本
    const handleSaveShScript = async (filePath: string) => {
        setSaving(true);
        try {
            const fullUrl = getFullUrl(filePath);
            const fileName = (filePath.split('/').pop() || 'script.sh').replace(/\.sh$/i, '');
            // 下载sh脚本
            const SCRIPTS_DIR = `${RNFS.ExternalDirectoryPath}/scripts`;
            if (!(await RNFS.exists(SCRIPTS_DIR))) {
                await RNFS.mkdir(SCRIPTS_DIR);
            }
            const localPath = `${SCRIPTS_DIR}/${fileName}.sh`;

            await RNFS.downloadFile({
                fromUrl: fullUrl,
                toFile: localPath,
            }).promise;

            // 读取下载内容
            const shContent = await RNFS.readFile(localPath, 'utf8');

            // 设置名字
            const innerName = parseInnerName(shContent);
            const scriptName = innerName || fileName;

            // 解码出步骤
            const parsedSteps = parseScriptSteps(shContent);

            if (parsedSteps && parsedSteps.length > 0) {
                saveScript(scriptName, parsedSteps);
                setSnackMessage(`脚本 "${scriptName}" 已导入 (${parsedSteps.length} 个步骤)`);
            } else {
                saveScript(scriptName, [{
                    id: Date.now().toString(),
                    type: 'other',
                    name: scriptName,
                    command: shContent,
                    description: `从社区下载: ${fullPost?.title || scriptName}`,
                }]);
                setSnackMessage(`脚本 "${scriptName}" 已保存 (原始脚本)`);
            }
            setSnackVisible(true);
        } catch (e: any) {
            console.error('Save .sh error:', e);
            setSnackMessage('保存脚本失败: ' + (e?.message || '未知错误'));
            setSnackVisible(true);
        } finally {
            setSaving(false);
        }
    };

    // 获取文件名
    const getFileName = (filePath: string) => {
        return filePath.split('/').pop() || '未知文件';
    };

    // ─── Render attachment based on file type ───
    const renderAttachment = () => {
        if (!fullPost?.file_path) { return null; }

        const filePath = fullPost.file_path;

        // ── Image ──
        if (isImageFile(filePath)) {
            const imageUrl = getFullUrl(filePath);
            return (
                <View style={{ marginTop: 28 }}>
                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                        附件图片
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenInBrowser(filePath)}
                    >
                        <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.elevation.level1 }} elevation={1}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: SCREEN_WIDTH - 40, height: (SCREEN_WIDTH - 40) * 0.6, borderRadius: 16 }}
                                resizeMode="contain"
                            />
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: theme.colors.surface + 'CC' }}>
                                <MaterialCommunityIcons name="download" size={16} color={theme.colors.primary} />
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '600' }}>
                                    点击下载原图{fileSize > 0 ? ` (${formatFileSize(fileSize)})` : ''}
                                </Text>
                            </View>
                        </Surface>
                    </TouchableOpacity>
                </View>
            );
        }

        // ── .sh file ──
        if (isShellScript(filePath)) {
            return (
                <View style={{ marginTop: 28 }}>
                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                        脚本文件
                    </Text>
                    <Surface
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: theme.colors.elevation.level1 }}
                        elevation={1}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.tertiaryContainer }}>
                            <MaterialCommunityIcons name="script-text-outline" size={24} color={theme.colors.onTertiaryContainer} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurface, fontWeight: '500' }}
                                numberOfLines={1}
                            >
                                {resolvedScriptName || getFileName(filePath)}
                            </Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                                Shell 脚本{fileSize > 0 ? ` · ${formatFileSize(fileSize)}` : ''}
                            </Text>
                        </View>
                        <Button
                            mode="contained-tonal"
                            onPress={() => handleSaveShScript(filePath)}
                            loading={saving}
                            disabled={saving}
                            icon="content-save-outline"
                            compact
                            style={{ borderRadius: 20 }}
                            labelStyle={{ fontSize: 12 }}
                        >
                            保存
                        </Button>
                    </Surface>
                </View>
            );
        }

        // ── Other files ──
        return (
            <View style={{ marginTop: 28 }}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                    附件
                </Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleOpenInBrowser(filePath)}
                >
                    <Surface
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: theme.colors.elevation.level1 }}
                        elevation={1}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primaryContainer }}>
                            <MaterialCommunityIcons name="file-download-outline" size={24} color={theme.colors.onPrimaryContainer} />
                        </View>
                        <Text
                            variant="bodyMedium"
                            style={{ flex: 1, marginLeft: 14, color: theme.colors.onSurface, fontWeight: '500' }}
                            numberOfLines={1}
                        >
                            {getFileName(filePath)}{fileSize > 0 ? ` (${formatFileSize(fileSize)})` : ''}
                        </Text>
                        <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.primary} />
                    </Surface>
                </TouchableOpacity>
            </View>
        );
    };

    const handleBack = () => {
        if (fromTab === 'community') {
            navigation.navigate('MainTabs', { initialTab: 'community' });
            return;
        }
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }
        navigation.navigate('MainTabs');
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
            {/* ── Appbar ── */}
            <Appbar.Header style={{ backgroundColor: 'transparent' }} statusBarHeight={insets.top}>
                <Appbar.BackAction onPress={handleBack} />
                <Appbar.Content title={fullPost?.title ?? '帖子详情'} titleStyle={{ fontWeight: 'bold', fontSize: 18 }} />
                <Appbar.Action icon="dots-vertical" onPress={() => { }} />
            </Appbar.Header>

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    {/* ── Author Info ── */}
                    <Surface style={{ borderRadius: 20, padding: 16, marginBottom: 20, backgroundColor: theme.colors.elevation.level1 }} elevation={0}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Avatar.Text size={40} label={(fullPost?.author || '?')[0]} style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{fullPost?.author ?? '匿名用户'}</Text>
                            </View>
                            <Surface style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12, backgroundColor: theme.colors.tertiaryContainer }} elevation={0}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}>{fullPost?.category ?? '其他'}</Text>
                            </Surface>
                        </View>
                    </Surface>

                    {/* ── Title ── */}
                    <Text variant="headlineSmall" style={{ fontWeight: 'bold', marginBottom: 16, color: theme.colors.onBackground }}>{fullPost?.title ?? '无标题'}</Text>

                    {/* ── Body Content ── */}
                    <Text variant="bodyLarge" style={{ lineHeight: 24, color: theme.colors.onSurfaceVariant }}>
                        {fullPost?.content ?? '暂无内容'}
                    </Text>

                    {/* ── 附件区域 (type-aware) ── */}
                    {renderAttachment()}
                </ScrollView>
            )}

            {/* ── Snackbar ── */}
            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={3000}
                style={{ marginBottom: insets.bottom + 8 }}
            >
                {snackMessage}
            </Snackbar>
        </View>
    );
};

export default PostDetailScreen;
