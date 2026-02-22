/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Animated,
    TextInput,
    TouchableOpacity,
    Keyboard,
    Platform,
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Avatar,
    IconButton,
    Divider,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ─────────────────────────────────────────────────────────
interface Reply {
    id: string;
    author: string;
    content: string;
    time: string;
    likes: number;
    liked: boolean;
}

interface Comment {
    id: string;
    author: string;
    content: string;
    time: string;
    likes: number;
    liked: boolean;
    replies: Reply[];
}

// ─── Mock Data ─────────────────────────────────────────────────────
const INITIAL_COMMENTS: Comment[] = [
    {
        id: '1',
        author: '技术达人',
        content: '写得非常好！我之前也遇到过类似的问题，这个方案确实是最优解。建议作者可以再补充一些关于性能优化方面的内容 🎯',
        time: '30 分钟前',
        likes: 8,
        liked: false,
        replies: [
            { id: '1-1', author: '楼主', content: '感谢建议！后续会更新性能优化的部分 👍', time: '20 分钟前', likes: 3, liked: false },
            { id: '1-2', author: '路人A', content: '同期待性能优化篇！', time: '15 分钟前', likes: 1, liked: false },
        ],
    },
    {
        id: '2',
        author: '新手小白',
        content: '请问这个方案在低版本 Android 上兼容性怎么样？我试了一下好像有些问题。',
        time: '1 小时前',
        likes: 4,
        liked: false,
        replies: [
            { id: '2-1', author: '楼主', content: '最低支持 Android 8.0，请检查一下你的 minSdkVersion 设置', time: '45 分钟前', likes: 5, liked: false },
        ],
    },
    {
        id: '3',
        author: '资深开发者',
        content: '这个思路很清晰，不过我有个小建议：可以考虑使用 useMemo 来优化渲染性能，特别是在列表数据量大的时候。',
        time: '2 小时前',
        likes: 12,
        liked: false,
        replies: [],
    },
    {
        id: '4',
        author: '设计师小明',
        content: '作为一个设计师，这个 UI 的实现效果让我很满意，动画过渡非常舒服 ✨',
        time: '3 小时前',
        likes: 6,
        liked: false,
        replies: [],
    },
];

// ─── Action Button ─────────────────────────────────────────────────
const ActionButton = ({
    icon,
    label,
    color,
    onPress,
}: {
    icon: string;
    label: string;
    color: string;
    onPress?: () => void;
}) => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () =>
        Animated.spring(scale, { toValue: 0.9, useNativeDriver: true }).start();
    const onPressOut = () =>
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ transform: [{ scale }], flexDirection: 'row', alignItems: 'center' }}>
            <IconButton
                icon={icon}
                size={22}
                iconColor={color}
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
            />
            <Text variant="labelMedium" style={{ color, marginLeft: -4 }}>
                {label}
            </Text>
        </Animated.View>
    );
};

// ─── Like Button (small, inline) ───────────────────────────────────
const LikeButton = ({
    likes,
    liked,
    onToggle,
    theme,
}: {
    likes: number;
    liked: boolean;
    onToggle: () => void;
    theme: any;
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const handlePress = () => {
        Animated.sequence([
            Animated.spring(scale, { toValue: 1.3, useNativeDriver: true, speed: 50 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        ]).start();
        onToggle();
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.likeBtn} activeOpacity={0.7}>
            <Animated.View style={{ transform: [{ scale }], flexDirection: 'row', alignItems: 'center' }}>
                <MaterialCommunityIcons
                    name={liked ? 'heart' : 'heart-outline'}
                    size={16}
                    color={liked ? theme.colors.error : theme.colors.outline}
                />
                <Text
                    variant="labelSmall"
                    style={{ color: liked ? theme.colors.error : theme.colors.outline, marginLeft: 4 }}
                >
                    {likes}
                </Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

// ─── Reply Item ────────────────────────────────────────────────────
const ReplyItem = ({
    reply,
    theme,
    onLike,
}: {
    reply: Reply;
    theme: any;
    onLike: () => void;
}) => (
    <View style={[styles.replyItem, { borderLeftColor: theme.colors.outlineVariant }]}>
        <View style={styles.replyHeader}>
            <Avatar.Text
                size={22}
                label={reply.author[0]}
                style={{ backgroundColor: theme.colors.secondaryContainer }}
                color={theme.colors.onSecondaryContainer}
            />
            <Text variant="labelMedium" style={{ fontWeight: '600', marginLeft: 8, flex: 1 }}>
                {reply.author}
            </Text>
            <Text variant="labelSmall" style={{ color: theme.colors.outline }}>
                {reply.time}
            </Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 6, marginLeft: 30 }}>
            {reply.content}
        </Text>
        <View style={{ marginLeft: 26, marginTop: 4 }}>
            <LikeButton likes={reply.likes} liked={reply.liked} onToggle={onLike} theme={theme} />
        </View>
    </View>
);

// ─── Comment Item ──────────────────────────────────────────────────
const CommentItem = ({
    comment,
    theme,
    onLike,
    onReplyLike,
    onReply,
    isLast,
}: {
    comment: Comment;
    theme: any;
    onLike: () => void;
    onReplyLike: (replyId: string) => void;
    onReply: (author: string) => void;
    isLast: boolean;
}) => {
    const [showAllReplies, setShowAllReplies] = useState(false);
    const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, 1);
    const hiddenCount = comment.replies.length - 1;

    return (
        <View style={!isLast ? { marginBottom: 4 } : undefined}>
            <Surface style={[styles.commentCard, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                {/* Header */}
                <View style={styles.commentHeader}>
                    <Avatar.Text
                        size={32}
                        label={comment.author[0]}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                        <Text variant="labelLarge" style={{ fontWeight: '600' }}>{comment.author}</Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.outline }}>{comment.time}</Text>
                    </View>
                </View>

                {/* Content */}
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurface, marginTop: 10, lineHeight: 22 }}>
                    {comment.content}
                </Text>

                {/* Actions Row */}
                <View style={styles.commentActions}>
                    <LikeButton likes={comment.likes} liked={comment.liked} onToggle={onLike} theme={theme} />
                    <TouchableOpacity
                        style={styles.replyBtn}
                        onPress={() => onReply(comment.author)}
                        activeOpacity={0.7}
                    >
                        <MaterialCommunityIcons name="reply" size={16} color={theme.colors.outline} />
                        <Text variant="labelSmall" style={{ color: theme.colors.outline, marginLeft: 4 }}>
                            回复
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Replies */}
                {comment.replies.length > 0 && (
                    <View style={[styles.repliesContainer, { backgroundColor: theme.colors.elevation.level2 + '40' }]}>
                        {visibleReplies.map(reply => (
                            <ReplyItem
                                key={reply.id}
                                reply={reply}
                                theme={theme}
                                onLike={() => onReplyLike(reply.id)}
                            />
                        ))}
                        {!showAllReplies && hiddenCount > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowAllReplies(true)}
                                style={styles.showMoreBtn}
                                activeOpacity={0.7}
                            >
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                    展开其余 {hiddenCount} 条回复
                                </Text>
                                <MaterialCommunityIcons name="chevron-down" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                        {showAllReplies && hiddenCount > 0 && (
                            <TouchableOpacity
                                onPress={() => setShowAllReplies(false)}
                                style={styles.showMoreBtn}
                                activeOpacity={0.7}
                            >
                                <Text variant="labelSmall" style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                    收起
                                </Text>
                                <MaterialCommunityIcons name="chevron-up" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </Surface>
        </View>
    );
};

// ─── PostDetailScreen ──────────────────────────────────────────────
const PostDetailScreen = ({ navigation, route }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const post = route.params?.post;
    const inputRef = useRef<TextInput>(null);
    const keyboardAnim = useRef(new Animated.Value(0)).current;

    const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS);
    const [inputText, setInputText] = useState('');
    const [replyTarget, setReplyTarget] = useState<string | null>(null);

    // Keyboard listener to animate input bar position
    React.useEffect(() => {
        const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
        const showSub = Keyboard.addListener(showEvent, (e) => {
            Animated.spring(keyboardAnim, {
                toValue: e.endCoordinates.height,
                useNativeDriver: false,
                damping: 20,
                stiffness: 200,
            }).start();
        });
        const hideSub = Keyboard.addListener(hideEvent, () => {
            Animated.spring(keyboardAnim, {
                toValue: 0,
                useNativeDriver: false,
                damping: 20,
                stiffness: 200,
            }).start();
        });
        return () => { showSub.remove(); hideSub.remove(); };
    }, [keyboardAnim]);

    const fullContent = `这是一篇关于「${post?.title ?? '未知'}」的详细内容。\n\n在这里可以看到帖子的完整正文。作者分享了他们的想法和经验，希望能够帮助到社区中的其他成员。\n\n这段内容只是一个占位符，等接入后端后会显示真实的帖子内容。你可以在这里讨论、分享、提问，与社区成员互动。\n\n感谢阅读！如果觉得有帮助，请点赞支持 👍`;

    // ─── Handlers ──────────────────────────────────────────────
    const toggleCommentLike = useCallback((commentId: string) => {
        setComments(prev =>
            prev.map(c =>
                c.id === commentId
                    ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
                    : c,
            ),
        );
    }, []);

    const toggleReplyLike = useCallback((commentId: string, replyId: string) => {
        setComments(prev =>
            prev.map(c =>
                c.id === commentId
                    ? {
                        ...c,
                        replies: c.replies.map(r =>
                            r.id === replyId
                                ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 }
                                : r,
                        ),
                    }
                    : c,
            ),
        );
    }, []);

    const handleReply = useCallback((author: string) => {
        setReplyTarget(author);
        setInputText('');
        inputRef.current?.focus();
    }, []);

    const handleSend = useCallback(() => {
        const text = inputText.trim();
        if (!text) { return; }

        const newComment: Comment = {
            id: Date.now().toString(),
            author: '我',
            content: replyTarget ? `回复 @${replyTarget}：${text}` : text,
            time: '刚刚',
            likes: 0,
            liked: false,
            replies: [],
        };
        setComments(prev => [newComment, ...prev]);
        setInputText('');
        setReplyTarget(null);
    }, [inputText, replyTarget]);

    const cancelReply = useCallback(() => {
        setReplyTarget(null);
        setInputText('');
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* ── Appbar ── */}
            <Appbar.Header style={{ backgroundColor: 'transparent' }} statusBarHeight={insets.top}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title={post?.title ?? '帖子详情'} titleStyle={{ fontWeight: 'bold', fontSize: 18 }} />
                <Appbar.Action icon="dots-vertical" onPress={() => { }} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* ── Author Info ── */}
                <Surface style={[styles.authorCard, { backgroundColor: theme.colors.elevation.level1 }]} elevation={0}>
                    <View style={styles.authorRow}>
                        <Avatar.Text size={40} label={post?.author?.[0] ?? '?'} style={{ backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onSurface }}>{post?.author ?? '匿名用户'}</Text>
                            <Text variant="labelSmall" style={{ color: theme.colors.outline, marginTop: 2 }}>2 小时前</Text>
                        </View>
                        <Surface style={[styles.tagBadge, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
                            <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}>{post?.tag ?? '其他'}</Text>
                        </Surface>
                    </View>
                </Surface>

                {/* ── Title ── */}
                <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>{post?.title ?? '无标题'}</Text>

                {/* ── Body Content ── */}
                <Text variant="bodyLarge" style={[styles.body, { color: theme.colors.onSurfaceVariant }]}>{fullContent}</Text>

                <Divider style={{ marginVertical: 24 }} />

                {/* ── Post Actions ── */}
                <View style={styles.actionsRow}>
                    <ActionButton icon="thumb-up-outline" label="12" color={theme.colors.primary} />
                    <ActionButton icon="comment-outline" label={`${comments.length}`} color={theme.colors.secondary} />
                    <View style={{ flex: 1 }} />
                    <ActionButton icon="share-variant-outline" label="分享" color={theme.colors.onSurfaceVariant} />
                </View>

                <Divider style={{ marginVertical: 16 }} />

                {/* ── Comments Section ── */}
                <View style={styles.commentsSectionHeader}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>
                        评论 ({comments.length})
                    </Text>
                    <TouchableOpacity activeOpacity={0.7}>
                        <Text variant="labelMedium" style={{ color: theme.colors.primary }}>最新</Text>
                    </TouchableOpacity>
                </View>

                {comments.map((comment, index) => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        theme={theme}
                        onLike={() => toggleCommentLike(comment.id)}
                        onReplyLike={(replyId) => toggleReplyLike(comment.id, replyId)}
                        onReply={handleReply}
                        isLast={index === comments.length - 1}
                    />
                ))}

            </ScrollView>

            {/* ── Floating Bottom Comment Input Bar ── */}
            <Animated.View style={[
                styles.inputBarFloat,
                { bottom: Animated.add(keyboardAnim, insets.bottom > 0 ? insets.bottom : 6) },
            ]}>
                <Surface style={[styles.inputBarInner, { backgroundColor: theme.colors.elevation.level2 + 'EE' }]} elevation={3}>
                    {/* Reply indicator */}
                    {replyTarget && (
                        <View style={[styles.replyIndicator, { backgroundColor: theme.colors.primaryContainer + '60' }]}>
                            <Text variant="labelSmall" style={{ color: theme.colors.primary, flex: 1 }}>
                                回复 @{replyTarget}
                            </Text>
                            <TouchableOpacity onPress={cancelReply}>
                                <MaterialCommunityIcons name="close" size={16} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                    <View style={styles.inputRow}>
                        <Avatar.Text
                            size={30}
                            label="我"
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            color={theme.colors.onPrimaryContainer}
                        />
                        <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceVariant + 'AA' }]}>
                            <TextInput
                                ref={inputRef}
                                placeholder={replyTarget ? `回复 @${replyTarget}...` : '写下你的评论...'}
                                placeholderTextColor={theme.colors.onSurfaceVariant + '80'}
                                value={inputText}
                                onChangeText={setInputText}
                                style={[styles.commentInput, { color: theme.colors.onSurface }]}
                                multiline
                                maxLength={500}
                            />
                        </View>
                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={!inputText.trim()}
                            activeOpacity={0.7}
                            style={[
                                styles.sendBtn,
                                {
                                    backgroundColor: inputText.trim()
                                        ? theme.colors.primary
                                        : theme.colors.surfaceVariant,
                                },
                            ]}
                        >
                            <MaterialCommunityIcons
                                name="send"
                                size={20}
                                color={inputText.trim() ? theme.colors.onPrimary : theme.colors.outline}
                            />
                        </TouchableOpacity>
                    </View>
                </Surface>
            </Animated.View>
        </View>
    );
};

// ─── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 16 },
    authorCard: { borderRadius: 20, padding: 16, marginBottom: 20 },
    authorRow: { flexDirection: 'row', alignItems: 'center' },
    tagBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 12 },
    title: { fontWeight: 'bold', marginBottom: 16 },
    body: { lineHeight: 24 },
    actionsRow: { flexDirection: 'row', alignItems: 'center' },
    commentsSectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    commentCard: {
        borderRadius: 20,
        padding: 16,
        marginBottom: 12,
    },
    commentHeader: { flexDirection: 'row', alignItems: 'center' },
    commentActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 16,
    },
    likeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
        paddingHorizontal: 4,
    },
    replyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 4,
    },
    repliesContainer: {
        marginTop: 12,
        borderRadius: 14,
        padding: 10,
    },
    replyItem: {
        paddingLeft: 10,
        borderLeftWidth: 2,
        marginBottom: 10,
    },
    replyHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    showMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        gap: 4,
    },
    // ── Floating Bottom Input Bar ──
    inputBarFloat: {
        position: 'absolute',
        left: 12,
        right: 12,
    },
    inputBarInner: {
        paddingTop: 10,
        paddingBottom: 10,
        paddingHorizontal: 14,
        borderRadius: 28,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 10,
    },
    inputWrapper: {
        flex: 1,
        borderRadius: 22,
        paddingHorizontal: 14,
        minHeight: 40,
        justifyContent: 'center',
    },
    commentInput: {
        fontSize: 14,
        maxHeight: 100,
        paddingVertical: 8,
    },
    sendBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        justifyContent: 'center',
        alignItems: 'center',
    },
    replyIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginBottom: 8,
    },
});

export default PostDetailScreen;
