/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TextInput,
    Animated,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import {
    Appbar,
    Text,
    useTheme,
    Surface,
    Button,
    Snackbar,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
    const [selectedTag, setSelectedTag] = useState('');
    const [snackVisible, setSnackVisible] = useState(false);

    const tags = ['模块', '主题', '工具', '脚本', '其他', '闲聊'];

    const canSubmit = title.trim().length > 0 && body.trim().length > 0 && selectedTag.length > 0;

    const handlePublish = () => {
        if (!canSubmit) {
            setSnackVisible(true);
            return;
        }
        // TODO: 接后端 API
        console.log('发布帖子:', { title, body, tag: selectedTag });
        navigation.goBack();
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
                    disabled={!canSubmit}
                    style={styles.publishBtn}
                    labelStyle={{ fontWeight: 'bold', fontSize: 13 }}
                    contentStyle={{ height: 36 }}
                >
                    发布
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
                    {/* ── 标题 ── */}
                    <Text variant="labelLarge" style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
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
                </ScrollView>
            </KeyboardAvoidingView>

            {/* ── Snackbar ── */}
            <Snackbar
                visible={snackVisible}
                onDismiss={() => setSnackVisible(false)}
                duration={2000}
                style={{ marginBottom: insets.bottom + 8 }}
            >
                请填写标题、选择分类并输入正文
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
});

export default CreatePostScreen;
