/* eslint-disable react-native/no-inline-styles */
import React = require("react");
import { ViewStyle, TextStyle, StyleSheet, View, ScrollView, TouchableOpacity } from 'react-native';
import { Button, Text, Avatar, Card, Switch, Modal, Portal, TextInput, IconButton, HelperText, Dialog, Snackbar } from 'react-native-paper';
import Header from "./component/Header";

interface Styles {
    container: ViewStyle; // 容器样式
    card: ViewStyle; // 卡片容器样式
    cardContent: TextStyle; // 卡片样式
    avatar: ViewStyle; // 头像样式
    loginCard: ViewStyle;
    rowBetween: ViewStyle;
    centeredRow: ViewStyle;
    loginContainer: ViewStyle;
    modalContainer: ViewStyle;
    closeButton: ViewStyle;
    input: TextStyle;
    passwordInput: TextStyle;
    loginButton: ViewStyle;
    hintText: TextStyle;
}


const SettingsScreen = ({ navigation: _navigation }: any) => {

    return (

        <ScrollView contentContainerStyle={styles.container}>
        </ScrollView>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        flexGrow: 1,
        alignItems: 'center',
        paddingBottom: 30, // 底部留白
    },
    card: {
        backgroundColor: '#F5F5F5',
        // marginTop: 200,
        // marginBottom: 30,
        width: '100%',
        height: 90,
        justifyContent: 'center',
        // alignItems: 'center',
    },
    loginCard: {
        marginBottom: 30,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginContainer: {
        alignItems: 'center',
        marginTop: 30,
        width: '30%',
    },
    cardContent: {
        // margin: 8,
        textAlign: 'center',
        fontSize: 18,
    },
    avatar: {
        marginTop: 30,
        marginBottom: 20,
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    centeredRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        margin: 20,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: -10,
        left: 125,
    },
    input: {
        width: 200,
    },
    passwordInput: {
        marginTop: 0,
        width: 200,
    },
    loginButton: {
        margin: 10,
        width: 100,
    },
    hintText: {
        textAlign: 'center',
        marginBottom: 10,
    },
});

export default SettingsScreen;