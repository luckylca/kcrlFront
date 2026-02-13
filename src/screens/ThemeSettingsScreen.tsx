/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Appbar, Text, useTheme, Switch, Button, Surface, TextInput, Slider as PaperSlider, IconButton } from 'react-native-paper'; // Note: Paper doesn't export Slider, using community one below
import Slider from '@react-native-community/slider';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSettingStore } from '../store/useSettingStore';

const COLOR_PRESETS = [
    '#6750A4', // Purple (Default)
    '#006C4C', // Green
    '#9C4146', // Red
    '#00639B', // Blue
    '#7D5260', // Pink/Terra
    '#FF8F00', // Orange
];

const ThemeSettingsScreen = ({ navigation }: any) => {
    const theme = useTheme();

    // Store State
    const isDarkMode = useSettingStore((state) => state.isDarkMode);
    const setDarkMode = useSettingStore((state) => state.setDarkMode);
    const themeColor = useSettingStore((state) => state.themeColor);
    const setThemeColor = useSettingStore((state) => state.setThemeColor);
    const backgroundImage = useSettingStore((state) => state.backgroundImage);
    const setBackgroundImage = useSettingStore((state) => state.setBackgroundImage);
    const backgroundOpacity = useSettingStore((state) => state.backgroundOpacity);
    const setBackgroundOpacity = useSettingStore((state) => state.setBackgroundOpacity);

    // Handlers
    const handlePickImage = async () => {
        const result = await launchImageLibrary({
            mediaType: 'photo',
            quality: 0.8,
        });

        if (result.assets && result.assets.length > 0) {
            setBackgroundImage(result.assets[0].uri || null);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: 'transparent' }]}>
            <Appbar.Header style={{ backgroundColor: 'transparent' }}>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="主题设置" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content}>

                {/* 1. Dark Mode Toggle */}
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, opacity: 0.9 }]} elevation={1}>
                    <View style={styles.row}>
                        <View>
                            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>黑夜模式</Text>
                            <Text variant="bodySmall" style={{ opacity: 0.7 }}>切换应用为深色外观</Text>
                        </View>
                        <Switch value={isDarkMode} onValueChange={setDarkMode} color={theme.colors.primary} />
                    </View>
                </Surface>

                {/* 2. Theme Color Picker */}
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, marginTop: 16, opacity: 0.9 }]} elevation={1}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>主题颜色</Text>
                    <View style={styles.colorRow}>
                        {COLOR_PRESETS.map((color) => (
                            <TouchableOpacity
                                key={color}
                                style={[
                                    styles.colorCircle,
                                    { backgroundColor: color },
                                    themeColor === color && styles.selectedColorCircle
                                ]}
                                onPress={() => setThemeColor(color)}
                            >
                                {themeColor === color && (
                                    <View style={styles.checkMark} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Surface>

                {/* 3. Global Background Image */}
                <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant, marginTop: 16, opacity: 0.9 }]} elevation={1}>
                    <View style={styles.row}>
                        <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>全局背景图</Text>
                        {backgroundImage && (
                            <Button mode="text" onPress={() => setBackgroundImage(null)} textColor={theme.colors.error}>
                                清除
                            </Button>
                        )}
                    </View>

                    <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 12 }}>
                        设置自定义图片作为应用背景
                    </Text>

                    {/* Image Preview */}
                    {backgroundImage ? (
                        <View style={styles.previewContainer}>
                            <Image source={{ uri: backgroundImage }} style={styles.previewImage} />
                        </View>
                    ) : null}

                    <View style={styles.actionRow}>
                        <TextInput
                            mode="outlined"
                            label="图片 URL"
                            value={backgroundImage || ''}
                            onChangeText={setBackgroundImage}
                            style={{ flex: 1, marginRight: 8, backgroundColor: theme.colors.surface }}
                            right={<TextInput.Icon icon="web" />}
                        />
                        <Button mode="contained" onPress={handlePickImage} icon="image">
                            相册
                        </Button>
                    </View>

                    {/* 4. Transparency Slider */}
                    <Text variant="titleSmall" style={{ marginTop: 24, marginBottom: 8 }}>
                        背景不透明度: {(backgroundOpacity * 100).toFixed(0)}%
                    </Text>
                    <View style={styles.sliderContainer}>
                        <Text variant="bodySmall">透明</Text>
                        <Slider
                            style={{ flex: 1, height: 40 }}
                            minimumValue={0}
                            maximumValue={1}
                            step={0.1}
                            value={backgroundOpacity}
                            onValueChange={setBackgroundOpacity}
                            minimumTrackTintColor={theme.colors.primary}
                            maximumTrackTintColor={theme.colors.outline}
                            thumbTintColor={theme.colors.primary}
                        />
                        <Text variant="bodySmall">实体</Text>
                    </View>

                </Surface>

            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    colorRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    selectedColorCircle: {
        borderWidth: 3,
        borderColor: 'white', // Needs contrast check, using white for now as it's common for selection rings
    },
    checkMark: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'white',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    previewContainer: {
        height: 150,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
        backgroundColor: '#eee',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    }
});

export default ThemeSettingsScreen;
