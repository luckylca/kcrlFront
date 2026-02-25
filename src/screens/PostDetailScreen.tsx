/* eslint-disable react-native/no-inline-styles */
import React, { useState, useEffect } from 'react';
import {
    View,
    StyleSheet,
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
import { parseScriptSteps } from '../utils/scriptParser';

const API_BASE_URL = 'http://47.113.189.138/';
const SCREEN_WIDTH = Dimensions.get('window').width;

// ─── Helper: 时间格式化 ────────────────────────────────────────────
const formatTime = (dateStr: string) => {
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now.getTime() - date.getTime()) / 1000;
        if (diff < 60) { return '刚刚'; }
        if (diff < 3600) { return `${Math.floor(diff / 60)} 分钟前`; }
        if (diff < 86400) { return `${Math.floor(diff / 3600)} 小时前`; }
        if (diff < 604800) { return `${Math.floor(diff / 86400)} 天前`; }
        return date.toLocaleDateString();
    } catch {
        return dateStr;
    }
};

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

    const [fullPost, setFullPost] = useState(post);
    const [loading, setLoading] = useState(false);
    const [snackVisible, setSnackVisible] = useState(false);
    const [snackMessage, setSnackMessage] = useState('');
    const [saving, setSaving] = useState(false);

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
                    console.log("postData", postData);
                }
            }).finally(() => setLoading(false));
        }
    }, [post?.id]);

    const getFullUrl = (filePath: string) => {
        return filePath.startsWith('http') ? filePath : `${API_BASE_URL}${filePath}`;
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

    // Download .sh and save to script store
    const handleSaveShScript = async (filePath: string) => {
        setSaving(true);
        try {
            const fullUrl = getFullUrl(filePath);
            const fileName = (filePath.split('/').pop() || 'script.sh').replace(/\.sh$/i, '');

            // Download the .sh content
            const SCRIPTS_DIR = `${RNFS.ExternalDirectoryPath}/scripts`;
            if (!(await RNFS.exists(SCRIPTS_DIR))) {
                await RNFS.mkdir(SCRIPTS_DIR);
            }
            const localPath = `${SCRIPTS_DIR}/${fileName}.sh`;

            await RNFS.downloadFile({
                fromUrl: fullUrl,
                toFile: localPath,
            }).promise;

            // Read downloaded content
            const shContent = await RNFS.readFile(localPath, 'utf8');

            // Try to parse embedded KCRL steps metadata
            const parsedSteps = parseScriptSteps(shContent);

            if (parsedSteps && parsedSteps.length > 0) {
                // Found embedded steps — import with full block structure
                saveScript(fileName, parsedSteps);
                setSnackMessage(`脚本 "${fileName}" 已导入 (${parsedSteps.length} 个步骤)`);
            } else {
                // No metadata — save as single raw command step
                saveScript(fileName, [{
                    id: Date.now().toString(),
                    type: 'other',
                    name: fileName,
                    command: shContent,
                    description: `从社区下载: ${fullPost?.title || fileName}`,
                }]);
                setSnackMessage(`脚本 "${fileName}" 已保存 (原始脚本)`);
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

    // Extract filename from path
    const getFileName = (filePath: string) => {
        return filePath.split('/').pop() || '未知文件';
    };

    // ─── Render attachment based on file type ───
    const renderAttachment = () => {
        if (!fullPost?.file_path) { return null; }

        const filePath = fullPost.file_path;

        // ── Image: inline preview, tap to open in browser ──
        if (isImageFile(filePath)) {
            const imageUrl = getFullUrl(filePath);
            return (
                <View style={styles.attachmentSection}>
                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                        附件图片
                    </Text>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => handleOpenInBrowser(filePath)}
                    >
                        <Surface style={[styles.imageCard, { backgroundColor: theme.colors.elevation.level1 }]} elevation={1}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />
                            <View style={[styles.imageOverlay, { backgroundColor: theme.colors.surface + 'CC' }]}>
                                <MaterialCommunityIcons name="download" size={16} color={theme.colors.primary} />
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '600' }}>
                                    点击下载原图
                                </Text>
                            </View>
                        </Surface>
                    </TouchableOpacity>
                </View>
            );
        }

        // ── .sh file: save to script config ──
        if (isShellScript(filePath)) {
            return (
                <View style={styles.attachmentSection}>
                    <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                        脚本文件
                    </Text>
                    <Surface
                        style={[styles.attachmentCard, { backgroundColor: theme.colors.elevation.level1 }]}
                        elevation={1}
                    >
                        <View style={[styles.attachmentIconContainer, { backgroundColor: theme.colors.tertiaryContainer }]}>
                            <MaterialCommunityIcons name="script-text-outline" size={24} color={theme.colors.onTertiaryContainer} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 14 }}>
                            <Text
                                variant="bodyMedium"
                                style={{ color: theme.colors.onSurface, fontWeight: '500' }}
                                numberOfLines={1}
                            >
                                {getFileName(filePath)}
                            </Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                                Shell 脚本
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

        // ── Other files: open in browser ──
        return (
            <View style={styles.attachmentSection}>
                <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600', marginBottom: 12 }}>
                    附件
                </Text>
                <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => handleOpenInBrowser(filePath)}
                >
                    <Surface
                        style={[styles.attachmentCard, { backgroundColor: theme.colors.elevation.level1 }]}
                        elevation={1}
                    >
                        <View style={[styles.attachmentIconContainer, { backgroundColor: theme.colors.primaryContainer }]}>
                            <MaterialCommunityIcons name="file-download-outline" size={24} color={theme.colors.onPrimaryContainer} />
                        </View>
                        <Text
                            variant="bodyMedium"
                            style={{ flex: 1, marginLeft: 14, color: theme.colors.onSurface, fontWeight: '500' }}
                            numberOfLines={1}
                        >
                            {getFileName(filePath)}
                        </Text>
                        <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.primary} />
                    </Surface>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* ── Appbar ── */}
            <Appbar.Header style={{ backgroundColor: 'transparent' }} statusBarHeight={insets.top}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={fullPost?.title ?? '帖子详情'} titleStyle={{ fontWeight: 'bold', fontSize: 18 }} />
                <Appbar.Action icon="dots-vertical" onPress={() => { }} />
            </Appbar.Header>

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {/* ── Author Info ── */}
                    <Surface style={[styles.authorCard, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                        <View style={styles.authorRow}>
                            <Avatar.Text size={40} label={(fullPost?.author || '?')[0]} style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                            <View style={{ marginLeft: 12, flex: 1 }}>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{fullPost?.author ?? '匿名用户'}</Text>
                                <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>
                                    {fullPost?.created_at ? formatTime(fullPost.created_at) : '未知时间'}
                                </Text>
                            </View>
                            <Surface style={[styles.tagBadge, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}>{fullPost?.category ?? '其他'}</Text>
                            </Surface>
                        </View>
                    </Surface>

                    {/* ── Title ── */}
                    <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>{fullPost?.title ?? '无标题'}</Text>

                    {/* ── Body Content ── */}
                    <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>
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

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
    authorCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
    authorRow: { flexDirection: 'row', alignItems: 'center' },
    tagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    title: { fontWeight: 'bold', marginBottom: 16 },
    body: { lineHeight: 24 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    // ── Attachment Styles ──
    attachmentSection: {
        marginTop: 28,
    },
    attachmentCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 16,
    },
    attachmentIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // ── Image preview ──
    imageCard: {
        borderRadius: 16,
        overflow: 'hidden',
    },
    previewImage: {
        width: SCREEN_WIDTH - 40,
        height: (SCREEN_WIDTH - 40) * 0.6,
        borderRadius: 16,
    },
    imageOverlay: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
});

export default PostDetailScreen;
