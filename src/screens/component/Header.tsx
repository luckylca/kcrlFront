import React = require("react");
import { StyleSheet, Text, View } from "react-native";
import { Button } from "react-native-paper";

type HeaderProps = {
    navigation?: { goBack?: () => void };
    title?: string;
};

const Header = ({ navigation, title = "" }: HeaderProps) => {
    return (
        <View style={styles.container}>
            <Button
                contentStyle={{ height: 60 }}
                labelStyle={{ fontSize: 25 }}
                icon="arrow-left"
                mode="text"
                onPress={() => navigation?.goBack?.()}
            />
            <View style={{ position: "absolute", left: "50%", transform: [{ translateX: "-50%" }] }}>
                <Text style={styles.title}>{title}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 60,
        justifyContent: 'flex-start',
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: 40,
        width: '100%',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#222',
    },
});

export default Header;