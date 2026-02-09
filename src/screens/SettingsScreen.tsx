/* eslint-disable react-native/no-inline-styles */
import React = require("react");
import { ViewStyle, TextStyle, StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Text, Avatar, Card, Switch, Modal, Portal, TextInput, IconButton, HelperText, Dialog, Snackbar } from 'react-native-paper';
import Header from "./component/Header";

interface Styles {
}


const SettingsScreen = ({ navigation }: any) => {

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text variant="headlineMedium" style={{ fontWeight: 'bold', marginBottom: 16 }}>设置</Text>
            <Button
                mode="contained"
                onPress={() => navigation.navigate('About')}
                style={{ marginTop: 20 }}
            >
                About App
            </Button>
        </ScrollView>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        padding: 20,
        paddingBottom: 120, // Increased to clear floating tab bar
    }
});

export default SettingsScreen;