/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Appbar, Text, useTheme, Surface } from 'react-native-paper';
import Slider from '@react-native-community/slider';
import { useSettingStore } from '../store/useSettingStore';

const { width } = Dimensions.get('window');

const TimeConfigScreen = ({ navigation }: any) => {
    const theme = useTheme();

    // Store State
    const clickThreshold = useSettingStore((state) => state.clickThreshold);
    const setClickThreshold = useSettingStore((state) => state.setClickThreshold);
    const shortPressThreshold = useSettingStore((state) => state.shortPressThreshold);
    const setShortPressThreshold = useSettingStore((state) => state.setShortPressThreshold);
    const longPressThreshold = useSettingStore((state) => state.longPressThreshold);
    const setLongPressThreshold = useSettingStore((state) => state.setLongPressThreshold);
    const doubleClickInterval = useSettingStore((state) => state.doubleClickInterval);
    const setDoubleClickInterval = useSettingStore((state) => state.setDoubleClickInterval);

    // Timeline Visualization
    const MAX_TIME = 2000; // Max time on the visualization bar (ms)

    // Calculate widths for timeline segments (percentage)
    const getPercent = (value: number) => Math.min((value / MAX_TIME) * 100, 100);

    // Segments:
    // 0 -> Click Threshold (Click)
    // Click -> Short Threshold (Short Press)
    // Short -> Long Threshold (Long Press)
    // Long -> MAX (Hold)

    const clickWidth = getPercent(clickThreshold);
    const shortWidth = getPercent(shortPressThreshold - clickThreshold);
    const longWidth = getPercent(longPressThreshold - shortPressThreshold);
    const holdWidth = getPercent(MAX_TIME - longPressThreshold);

    const renderSliderCard = (
        title: string,
        value: number,
        setValue: (val: number) => void,
        min: number = 0,
        max: number = 2000,
        color: string = theme.colors.primary,
        description?: string
    ) => (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
            <View style={styles.headerRow}>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>{title}</Text>
                <Text variant="titleLarge" style={{ color: color, fontWeight: 'bold' }}>{value} ms</Text>
            </View>
            {description && (
                <Text variant="bodySmall" style={{ opacity: 0.7, marginBottom: 12 }}>{description}</Text>
            )}
            <View style={styles.sliderContainer}>
                <Text variant="labelSmall">{min}ms</Text>
                <Slider
                    style={{ flex: 1, height: 40 }}
                    minimumValue={min}
                    maximumValue={max}
                    step={10}
                    value={value}
                    onValueChange={setValue}
                    minimumTrackTintColor={color}
                    maximumTrackTintColor={theme.colors.outline}
                    thumbTintColor={color}
                />
                <Text variant="labelSmall">{max}ms</Text>
            </View>
        </Surface>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="时间配置" />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. Visual Timeline Card */}
                <Surface style={[styles.card, { backgroundColor: theme.colors.surface, marginBottom: 24 }]} elevation={2}>
                    <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>按键响应时间轴</Text>

                    {/* Timeline Bar */}
                    <View style={styles.timelineContainer}>
                        {/* Click Segment */}
                        <View style={[styles.timelineSegment, { width: `${clickWidth}%`, backgroundColor: theme.colors.primary }]}>
                            {clickWidth > 15 && <Text style={styles.timelineLabel}>点击</Text>}
                        </View>
                        {/* Short Press Segment */}
                        <View style={[styles.timelineSegment, { width: `${shortWidth}%`, backgroundColor: theme.colors.secondary }]}>
                            {shortWidth > 15 && <Text style={styles.timelineLabel}>短按</Text>}
                        </View>
                        {/* Long Press Segment */}
                        <View style={[styles.timelineSegment, { width: `${longWidth}%`, backgroundColor: theme.colors.tertiary }]}>
                            {longWidth > 15 && <Text style={styles.timelineLabel}>长按</Text>}
                        </View>
                        {/* Hold/Max Segment */}
                        <View style={[styles.timelineSegment, { width: `${holdWidth}%`, backgroundColor: theme.colors.error }]}>
                            {holdWidth > 15 && <Text style={styles.timelineLabel}>...</Text>}
                        </View>
                    </View>

                    {/* Timeline Legend/Markers */}
                    <View style={styles.timelineMarkers}>
                        <View style={{ position: 'absolute', left: `${getPercent(clickThreshold)}%` }}>
                            <Text style={[styles.markerText, { color: theme.colors.onSurface }]}>{clickThreshold}</Text>
                        </View>
                        <View style={{ position: 'absolute', left: `${getPercent(shortPressThreshold)}%` }}>
                            <Text style={[styles.markerText, { color: theme.colors.onSurface }]}>{shortPressThreshold}</Text>
                        </View>
                        <View style={{ position: 'absolute', left: `${getPercent(longPressThreshold)}%` }}>
                            <Text style={[styles.markerText, { color: theme.colors.onSurface }]}>{longPressThreshold}</Text>
                        </View>
                    </View>

                    <Text variant="bodySmall" style={{ marginTop: 24, textAlign: 'center', opacity: 0.6 }}>
                        可视化显示各触发阶段的时间范围
                    </Text>
                </Surface>

                {/* 2. Sliders */}
                {renderSliderCard(
                    '点击阈值',
                    clickThreshold,
                    setClickThreshold,
                    50,
                    500,
                    theme.colors.primary,
                    '小于此时间且无后续操作即判定为单击'
                )}

                {renderSliderCard(
                    '短按阈值',
                    shortPressThreshold,
                    setShortPressThreshold,
                    200,
                    1000,
                    theme.colors.secondary,
                    '超过单击阈值但未达到长按阈值'
                )}

                {renderSliderCard(
                    '长按阈值',
                    longPressThreshold,
                    setLongPressThreshold,
                    500,
                    2000,
                    theme.colors.tertiary,
                    '按住超过此时间判定为长按'
                )}

                {renderSliderCard(
                    '双击间隔',
                    doubleClickInterval,
                    setDoubleClickInterval,
                    100,
                    800,
                    theme.colors.primary,
                    '两次点击的最大间隔时间'
                )}

                <View style={{ height: 40 }} />
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
        padding: 20,
        borderRadius: 20,
        marginBottom: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    sliderContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timelineContainer: {
        height: 30,
        flexDirection: 'row',
        borderRadius: 15,
        overflow: 'hidden',
        backgroundColor: '#e0e0e0',
    },
    timelineSegment: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineLabel: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    timelineMarkers: {
        height: 20,
        marginTop: 4,
        position: 'relative',
        width: '100%',
    },
    markerText: {
        fontSize: 10,
        transform: [{ translateX: -10 }], // Center the text on the tick
    }
});

export default TimeConfigScreen;
