import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, Text, useTheme } from 'react-native-paper';

const DevicePathScreen = ({ navigation }: any) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Appbar.Header>
                <Appbar.BackAction onPress={() => navigation.goBack()} />
                <Appbar.Content title="设备路径配置" />
            </Appbar.Header>
            <View style={styles.content}>
                <Text variant="bodyLarge">这里是设备路径配置页面 (Placeholder)</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

export default DevicePathScreen;
