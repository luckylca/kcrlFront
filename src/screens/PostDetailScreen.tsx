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
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Avatar,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OLAPI from '../api/OLAPI';

const API_BASE_URL = 'http://47.113.189.138/';

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



// ─── PostDetailScreen ──────────────────────────────────────────────
const PostDetailScreen = ({ navigation, route }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const post = route.params?.post;

    const [fullPost, setFullPost] = useState(post);
    const [loading, setLoading] = useState(false);

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

    const handleDownload = (filePath: string) => {
        const fullUrl = filePath.startsWith('http') ? filePath : `${API_BASE_URL}${filePath}`;
        Linking.canOpenURL(fullUrl).then(supported => {
            if (supported) {
                Linking.openURL(fullUrl);
            } else {
                Alert.alert('无法打开', '无法打开此文件链接');
            }
        });
    };

    // Extract filename from path
    const getFileName = (filePath: string) => {
        return filePath.split('/').pop() || '未知文件';
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

                    {/* ── 附件区域 ── */}
                    {fullPost?.file_path && (
                        <TouchableOpacity
                            activeOpacity={0.7}
                            onPress={() => handleDownload(fullPost.file_path)}
                            style={styles.attachmentSection}
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
                                    {getFileName(fullPost.file_path)}
                                </Text>
                                <MaterialCommunityIcons name="open-in-new" size={20} color={theme.colors.primary} />
                            </Surface>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            )}
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
});

export default PostDetailScreen;
