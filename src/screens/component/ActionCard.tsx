/* eslint-disable react-native/no-inline-styles */
/**
 * ActionCard:
 * 封装好的有动画的卡片组件
 * 
 */

import React, { useRef } from 'react';
import { View, Animated } from 'react-native';
import { Text, Surface, TouchableRipple, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type ActionCardProps = {
    icon: string;
    title: string;
    subtitle: string;
    onPress: () => void;
    containerColor: string;
    contentColor: string;
};

const ActionCard = ({
    icon,
    title,
    subtitle,
    onPress,
    containerColor,
    contentColor,
}: ActionCardProps) => {
    const theme = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.96,
            useNativeDriver: true,
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Surface style={{ borderRadius: 24, overflow: 'hidden', backgroundColor: containerColor }} elevation={2}>
                <TouchableRipple
                    onPress={onPress}
                    onPressIn={onPressIn}
                    onPressOut={onPressOut}
                    style={{ padding: 24 }}
                    borderless={true}
                    rippleColor={theme.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'} // Ensure ripple visual
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <MaterialCommunityIcons name={icon} size={32} color={contentColor} />
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text variant="titleMedium" style={{ color: contentColor, fontWeight: 'bold' }}>{title}</Text>
                            <Text variant="bodySmall" style={{ color: contentColor, opacity: 0.8 }}>{subtitle}</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={contentColor} style={{ opacity: 0.5 }} />
                    </View>
                </TouchableRipple>
            </Surface>
        </Animated.View>
    );
};

export default ActionCard;
