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
    ProgressBar,
    Portal,
    Dialog,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Share from 'react-native-share';
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

const isApkFile = (filePath: string): boolean => {
    return getFileExtension(filePath) === '.apk';
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
    const [downloading, setDownloading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const [apkSize, setApkSize] = useState(0);
    const [downloadDialogVisible, setDownloadDialogVisible] = useState(false);

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

    const handleOpenApk = async (filePath: string) => {
        try {
            setDownloading(true);
            setDownloadProgress(0);
            setDownloadDialogVisible(true);

            const downloadUrl = getFullUrl(filePath);
            const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
            const savePath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

            const fileSize = await OLAPI.getFileSize(filePath);
            setApkSize(fileSize);

            const download = RNFS.downloadFile({
                fromUrl: downloadUrl,
                toFile: savePath,
                progress: (res) => {
                    if (apkSize > 0) {
                        setDownloadProgress(res.bytesWritten / apkSize);
                    }
                },
                progressDivider: 1,
            });

            const result = await download.promise;

            if (result.statusCode === 200) {
                setDownloading(false);
                setDownloadProgress(0);
                setDownloadDialogVisible(false);

                try {
                    await Share.open({
                        url: `file://${savePath}`,
                        type: 'application/vnd.android.package-archive',
                        showAppsToView: true,
                    });
                    Alert.alert('下载成功', '正在启动安装...');
                } catch (e) {
                    console.error('Open APK error:', e);
                    try {
                        await Linking.openURL(`file://${savePath}`);
                        Alert.alert('下载成功', '正在启动安装...');
                    } catch (e2) {
                        console.error('Open APK with file:// error:', e2);
                        Alert.alert('下载成功', `文件已保存到: ${savePath}\n请手动打开安装`);
                    }
                }
            } else {
                setDownloading(false);
                setDownloadProgress(0);
                setDownloadDialogVisible(false);
                Alert.alert('下载失败', `状态码: ${result.statusCode}`);
            }
        } catch (error) {
            console.error('Download error:', error);
            setDownloading(false);
            setDownloadProgress(0);
            setDownloadDialogVisible(false);
            Alert.alert('下载错误', String(error));
        }
    }

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

    // 下载主题图片到应用内部目录
    const handleSaveThemeImage = async (filePath: string) => {
        try {
            const imageUrl = getFullUrl(filePath);
            const fileName = filePath.split('/').pop() || 'theme_image.png';
            const saveDir = `${RNFS.ExternalDirectoryPath}/styles`;
            
            // 确保目录存在
            if (!(await RNFS.exists(saveDir))) {
                await RNFS.mkdir(saveDir);
            }
            
            const savePath = `${saveDir}/${fileName}`;
            
            // 下载图片
            const download = RNFS.downloadFile({
                fromUrl: imageUrl,
                toFile: savePath,
                progressDivider: 1,
            });
            
            const result = await download.promise;
            
            if (result.statusCode === 200) {
                setSnackMessage(`主题图片已保存到: ${savePath}`);
            } else {
                setSnackMessage(`下载失败，状态码: ${result.statusCode}`);
            }
        } catch (error) {
            console.error('Save theme image error:', error);
            setSnackMessage('保存图片失败: ' + String(error));
        } finally {
            setSnackVisible(true);
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
                    <View>
                        <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.elevation.level1 }} elevation={1}>
                            <Image
                                source={{ uri: imageUrl }}
                                style={{ width: SCREEN_WIDTH - 40, height: (SCREEN_WIDTH - 40) * 0.6, borderRadius: 16 }}
                                resizeMode="contain"
                            />
                            <TouchableOpacity 
                                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, backgroundColor: theme.colors.surface + 'CC' }}
                                onPress={() => handleSaveThemeImage(filePath)}
                            >
                                <MaterialCommunityIcons name="download" size={16} color={theme.colors.primary} />
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, marginLeft: 4, fontWeight: '600' }}>
                                    点击下载主题{fileSize > 0 ? ` (${formatFileSize(fileSize)})` : ''}
                                </Text>
                            </TouchableOpacity>
                        </Surface>
                    </View>
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

        // ── .apk file ──
        if (isApkFile(filePath)) {
            const isOfficial = filePath.includes('official');
            return (
                <View style={{ marginTop: 28 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant, fontWeight: '600' }}>
                            安装包
                        </Text>
                        {isOfficial && (
                            <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                                marginLeft: 8,
                                backgroundColor: theme.colors.primaryContainer
                            }}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onPrimaryContainer, fontWeight: 'bold' }}>
                                    官方
                                </Text>
                            </View>
                        )}
                    </View>
                    <Surface
                        style={{ flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, backgroundColor: theme.colors.elevation.level1 }}
                        elevation={1}
                    >
                        <View style={{ width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.primaryContainer }}>
                            <MaterialCommunityIcons name="application-cog-outline" size={24} color={theme.colors.onPrimaryContainer} />
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
                                Android 安装包{fileSize > 0 ? ` · ${formatFileSize(fileSize)}` : ''}
                            </Text>
                        </View>
                        <Button
                            mode="contained"
                            onPress={() => handleOpenApk(filePath)}
                            loading={downloading}
                            disabled={downloading}
                            icon="download"
                            compact
                            style={{ borderRadius: 20 }}
                            labelStyle={{ fontSize: 12 }}
                        >
                            下载安装
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

    // 解析包含[URL=xxx]和[IMG=xxx]的文本内容
    const parseContentWithLinks = (content: string) => {
        if (!content) return [];
        
        const parts = [];
        let lastIndex = 0;
        
        // 匹配 [URL=xxx]xxx[/URL] 格式
        const urlRegex = /\[URL=([^\]]+)\]([^\[]+)\[\/URL\]/g;
        let match;
        
        // 处理URL链接
        while ((match = urlRegex.exec(content)) !== null) {
            // 添加链接前的文本
            if (match.index > lastIndex) {
                parts.push({
                    type: 'text',
                    content: content.substring(lastIndex, match.index)
                });
            }
            
            // 添加链接
            parts.push({
                type: 'url',
                url: match[1],
                text: match[2]
            });
            
            lastIndex = urlRegex.lastIndex;
        }
        
        // 处理剩余文本中的图片
        const remainingText = content.substring(lastIndex);
        const imgRegex = /\[IMG=([^\]]+)\]/g;
        let imgMatch;
        let imgLastIndex = 0;
        
        // 如果没有URL链接，直接处理整个文本
        if (parts.length === 0) {
            imgLastIndex = 0;
            while ((imgMatch = imgRegex.exec(content)) !== null) {
                // 添加图片前的文本
                if (imgMatch.index > imgLastIndex) {
                    parts.push({
                        type: 'text',
                        content: content.substring(imgLastIndex, imgMatch.index)
                    });
                }
                
                // 添加图片
                parts.push({
                    type: 'image',
                    url: imgMatch[1]
                });
                
                imgLastIndex = imgRegex.lastIndex;
            }
            
            // 添加剩余文本
            if (imgLastIndex < content.length) {
                parts.push({
                    type: 'text',
                    content: content.substring(imgLastIndex)
                });
            }
        } else {
            // 处理剩余文本中的图片
            imgLastIndex = 0;
            while ((imgMatch = imgRegex.exec(remainingText)) !== null) {
                // 添加图片前的文本
                if (imgMatch.index > imgLastIndex) {
                    parts.push({
                        type: 'text',
                        content: remainingText.substring(imgLastIndex, imgMatch.index)
                    });
                }
                
                // 添加图片
                parts.push({
                    type: 'image',
                    url: imgMatch[1]
                });
                
                imgLastIndex = imgRegex.lastIndex;
            }
            
            // 添加剩余文本
            if (imgLastIndex < remainingText.length) {
                parts.push({
                    type: 'text',
                    content: remainingText.substring(imgLastIndex)
                });
            }
        }
        
        // 如果没有找到任何特殊标记，返回纯文本
        if (parts.length === 0) {
            parts.push({
                type: 'text',
                content: content
            });
        }
        
        return parts;
    };

    // 处理URL点击
    const handleUrlPress = (url: string) => {
        Linking.openURL(url).catch(error => {
            console.error('打开链接失败:', error);
            Alert.alert('无法打开', '无法打开此链接');
        });
    };

    // 渲染解析后的内容
    const renderParsedContent = () => {
        const contentParts = parseContentWithLinks(fullPost?.content ?? '');
        
        return (
            <View>
                {contentParts.map((part, index) => {
                    if (part.type === 'text') {
                        return (
                            <Text key={index} variant="bodyLarge" style={{ lineHeight: 24, color: theme.colors.onSurfaceVariant }}>
                                {part.content}
                            </Text>
                        );
                    } else if (part.type === 'url') {
                        return (
                            <TouchableOpacity key={index} onPress={() => handleUrlPress(part.url)}>
                                <Text variant="bodyLarge" style={{ lineHeight: 24, color: theme.colors.primary, textDecorationLine: 'underline' }}>
                                    {part.url}
                                </Text>
                            </TouchableOpacity>
                        );
                    } else if (part.type === 'image') {
                        const imageUrl = getFullUrl(part.url);
                        return (
                            <View key={index} style={{ marginVertical: 16 }}>
                                <View>
                                    <Surface style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.colors.elevation.level1 }} elevation={1}>
                                        <Image
                                            source={{ uri: imageUrl }}
                                            style={{ width: SCREEN_WIDTH - 40, height: (SCREEN_WIDTH - 40) * 0.6, borderRadius: 16 }}
                                            resizeMode="contain"
                                        />
                                    </Surface>
                                </View>
                            </View>
                        );
                    }
                    return null;
                })}
            </View>
        );
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
                    {renderParsedContent()}

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

            {/* ── Download Progress Dialog ── */}
            <Portal>
                <Dialog
                    visible={downloadDialogVisible}
                    onDismiss={() => setDownloadDialogVisible(false)}
                    style={{ borderRadius: 28, backgroundColor: theme.colors.surface }}
                >
                    <Dialog.Icon icon="download" size={32} />
                    <Dialog.Title style={{ textAlign: 'center', fontWeight: '600' }}>
                        下载安装包
                    </Dialog.Title>
                    <Dialog.Content>
                        <Text
                            variant="bodySmall"
                            style={{
                                color: theme.colors.outline,
                                marginBottom: 8,
                            }}
                        >
                            APK大小: {apkSize > 0 ? `${(apkSize / 1024 / 1024).toFixed(2)} MB` : '获取中...'}
                        </Text>
                        <View style={{ marginTop: 16 }}>
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginBottom: 8 }}>
                                下载进度
                            </Text>
                            <ProgressBar progress={downloadProgress} />
                            <Text variant="bodySmall" style={{ color: theme.colors.outline, marginTop: 4, textAlign: 'center' }}>
                                {Math.round(downloadProgress * 100)}%
                            </Text>
                        </View>
                    </Dialog.Content>
                    <Dialog.Actions
                        style={{ paddingHorizontal: 16, paddingBottom: 16 }}
                    >
                        <Button
                            onPress={() => {
                                setDownloadDialogVisible(false);
                                setDownloading(false);
                                setDownloadProgress(0);
                            }}
                            textColor={theme.colors.onSurfaceVariant}
                            style={{ borderRadius: 50 }}
                            disabled={downloading}
                        >
                            取消
                        </Button>
                    </Dialog.Actions>
                </Dialog>
            </Portal>
        </View>
    );
};

export default PostDetailScreen;
