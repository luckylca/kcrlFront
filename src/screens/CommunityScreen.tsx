/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableOpacity, FlatList, Easing, RefreshControl, ActivityIndicator } from 'react-native';
import { Searchbar, Text, useTheme, FAB, Surface, Avatar, Card, TouchableRipple } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OLAPI, { Post } from '../api/OLAPI';

const { width } = Dimensions.get('window');


// Component for Animated Filter Chip
const FilterChip = ({
    label,
    isSelected,
    onSelect,
    theme
}: {
    label: string,
    isSelected: boolean,
    onSelect: (label: string) => void,
    theme: any
}) => {
    const scale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
    };
    const onPressOut = () => {
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
    };

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
                        styles.filterChip,
                        {
                            backgroundColor: isSelected ? theme.colors.primary : theme.colors.surface,
                            borderColor: isSelected ? 'transparent' : theme.colors.outline,
                            borderWidth: isSelected ? 0 : 1,
                        }
                    ]}
                    elevation={isSelected ? 2 : 0}
                >
                    <Text
                        style={{
                            color: isSelected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
                            fontWeight: isSelected ? 'bold' : 'normal',
                        }}
                    >
                        {label}
                    </Text>
                </Surface>
            </TouchableOpacity>
        </Animated.View>
    );
};

// Separated PostItem without entrance animation
const PostItem = ({ item, theme, onPress }: { item: Post, theme: any, onPress?: () => void }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.98, useNativeDriver: true }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();

    return (
        <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableRipple
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                style={[styles.postCard, { backgroundColor: theme.colors.surface }]}
                borderless
                rippleColor="rgba(0, 0, 0, .1)"
            >
                <View>
                    <Card.Content>
                        <View style={styles.postHeader}>
                            <View style={styles.authorContainer}>
                                <Avatar.Text size={28} label={(item.author || '?')[0]} style={{ marginRight: 8, backgroundColor: theme.colors.secondaryContainer }} color={theme.colors.onSecondaryContainer} />
                                <View>
                                    <Text variant="labelMedium" style={{ color: theme.colors.onSurface }}>{item.author}</Text>
                                </View>
                            </View>
                            <Surface style={[styles.tagChip, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={0}>
                                <Text variant="labelSmall" style={{ color: theme.colors.onTertiaryContainer, fontWeight: 'bold' }}>{item.category}</Text>
                            </Surface>
                        </View>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold', marginTop: 12, marginBottom: 4 }}>{item.title}</Text>
                        <Text variant="bodyMedium" numberOfLines={2} style={{ color: theme.colors.onSurfaceVariant }}>
                            {item.summary || item.content}
                        </Text>
                    </Card.Content>
                </View>
            </TouchableRipple>
        </Animated.View>
    );
};

const CommunityScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [selectedFilter, setSelectedFilter] = useState('全部');

    // ── API State ──
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // 1. Search Bar Animation
    const searchAnim = useRef(new Animated.Value(0)).current;
    const inputRef = useRef<any>(null);

    // 2. Filter Slide-in Animation
    const filtersSlideAnim = useRef(new Animated.Value(20)).current;
    const filtersFadeAnim = useRef(new Animated.Value(0)).current;

    // 3. FAB Pop-in Animation
    const fabScaleAnim = useRef(new Animated.Value(0)).current;

    const filters = ['全部', '模块', '主题', '工具', '脚本', '闲聊'];

    // ── Fetch Posts ──
    const fetchPosts = useCallback(async (category?: string, search?: string) => {
        try {
            const result = await OLAPI.getPosts({ category, search });
            if (result.success && result.data) {
                setPosts(result.data);
            } else {
                setPosts([]);
            }
        } catch (err) {
            console.error('Fetch posts error:', err);
            setPosts([]);
        }
    }, []);

    useEffect(() => {
        setLoading(true);
        fetchPosts(selectedFilter === '全部' ? undefined : selectedFilter).finally(() => setLoading(false));

        // Run Entrance Animations
        Animated.parallel([
            Animated.timing(filtersSlideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
                easing: Easing.out(Easing.cubic)
            }),
            Animated.timing(filtersFadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true
            }),
            Animated.spring(fabScaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 50,
                useNativeDriver: true,
                delay: 200,
            })
        ]).start();
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            fetchPosts(selectedFilter, searchQuery).finally(() => setLoading(false));
        }, 500); // 用户停止输入 500ms 后再搜索

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, selectedFilter, fetchPosts]);

    useEffect(() => {
        setLoading(true);
        fetchPosts(selectedFilter === '全部' ? undefined : selectedFilter).finally(() => setLoading(false));
    }, [selectedFilter, fetchPosts]);

    // Pull-to-refresh
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await fetchPosts(selectedFilter === '全部' ? undefined : selectedFilter);
        setRefreshing(false);
    }, [selectedFilter, fetchPosts]);


    const toggleSearch = () => {
        if (isSearchExpanded) {
            Animated.timing(searchAnim, {
                toValue: 0,
                duration: 350, // Slightly longer for smoothness
                useNativeDriver: false,
                easing: Easing.inOut(Easing.cubic), // Silky easing
            }).start(() => setIsSearchExpanded(false));
            setSearchQuery('');
            inputRef.current?.blur();
        } else {
            setIsSearchExpanded(true);
            Animated.timing(searchAnim, {
                toValue: 1,
                duration: 350,
                useNativeDriver: false,
                easing: Easing.inOut(Easing.cubic),
            }).start(() => inputRef.current?.focus());
        }
    };

    const searchWidth = searchAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [48, width - 32],
    });

    const iconOpacity = searchAnim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [1, 0, 0],
    });

    // Extracted render logic to keep render function clean
    const renderHeader = () => (
        <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
            <View style={styles.headerRow}>
                {!isSearchExpanded && (
                    <Animated.View style={{ opacity: iconOpacity, flex: 1, transform: [{ translateX: searchAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] }) }] }}>
                        <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: theme.colors.onBackground }}>社区</Text>
                    </Animated.View>
                )}

                <Animated.View style={[styles.searchContainer, { width: searchWidth }]}>
                    {isSearchExpanded ? (
                        <Searchbar
                            ref={inputRef}
                            placeholder="搜索主题..."
                            onChangeText={setSearchQuery}
                            value={searchQuery}
                            style={[styles.searchBar, { backgroundColor: theme.colors.elevation.level2 }]}
                            inputStyle={styles.searchInput}
                            icon="arrow-left"
                            onIconPress={toggleSearch}
                            elevation={0} // Removed default elevation shadow
                        />
                    ) : (
                        <TouchableOpacity onPress={toggleSearch} activeOpacity={0.7} style={{ borderRadius: 24 }}>
                            <Surface style={[styles.searchIconBtn, { backgroundColor: theme.colors.elevation.level2 }]} elevation={0}>
                                <MaterialCommunityIcons name="magnify" size={24} color={theme.colors.onSurface} />
                            </Surface>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            </View>

            {/* Filters */}
            <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterContainer}
                style={{
                    opacity: filtersFadeAnim,
                    transform: [{ translateX: filtersSlideAnim }]
                }}
            >
                {filters.map((filter) => (
                    <FilterChip
                        key={filter}
                        label={filter}
                        isSelected={selectedFilter === filter}
                        onSelect={setSelectedFilter}
                        theme={theme}
                    />
                ))}
            </Animated.ScrollView>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {renderHeader()}

            {loading && posts.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text variant="bodyMedium" style={{ color: theme.colors.outline, marginTop: 12 }}>加载中...</Text>
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={({ item }) => <PostItem item={item} theme={theme} onPress={() => { console.log(item); navigation.navigate('PostDetail', { post: item }) }} />}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text variant="bodyLarge" style={{ color: theme.colors.outline, textAlign: 'center' }}>暂时没有帖子{"\n"}快来发第一篇帖子吧 ✨</Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={[theme.colors.primary]}
                            tintColor={theme.colors.primary}
                        />
                    }
                />
            )}

            <Animated.View
                style={[
                    styles.fabContainer,
                    {
                        transform: [{ scale: fabScaleAnim }],
                        bottom: insets.bottom + 90 // Lift above TabBar (60 + padding 20 + extra)
                    }
                ]}
            >
                <FAB
                    icon="plus"
                    style={[styles.fab, { backgroundColor: theme.colors.primary }]}
                    color={theme.colors.onPrimary}
                    onPress={() => navigation.navigate('CreatePost')}
                    customSize={64}
                />
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        // paddingTop handled dynamically
        paddingBottom: 8,
        backgroundColor: 'transparent',
        zIndex: 1,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        justifyContent: 'space-between',
        height: 56,
    },
    searchContainer: {
        height: 48,
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    searchBar: {
        flex: 1,
        borderRadius: 24,
        height: 44, // Slightly taller for better touch target
        // No shadow here, handled by elevation=0 in props
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)', // Subtle border instead of shadow
    },
    searchInput: {
        minHeight: 0,
        alignSelf: 'center',
    },
    searchIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        // No shadow here, handled by elevation=0
    },
    filterContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
    },
    filterChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 60,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 120, // Increased to clear floating tab bar
        paddingTop: 8,
    },
    postCard: {
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        elevation: 0, // Removed card elevation for cleaner look or set to 1
        borderWidth: 1,
        height: 130,
        borderColor: 'rgba(0,0,0,0.05)', // Subtle border
    },
    postHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    authorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tagChip: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    fabContainer: {
        position: 'absolute',
        right: 24,
        // bottom handled dynamically
    },
    fab: {
        borderRadius: 20,
        elevation: 4,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        paddingTop: 80,
        alignItems: 'center',
    },
});

export default CommunityScreen;