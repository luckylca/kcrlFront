import React = require("react");
import { ViewStyle, TextStyle, StyleSheet, View } from 'react-native';
interface Styles {
  container: ViewStyle; // 容器样式
  card: TextStyle; // 卡片样式
}
const HomeScreen = ({navigation}:any) => {

    return (
        <View style={styles.container}>
        </View>
    );
}

const styles = StyleSheet.create<Styles>({
    container: {
        flex: 1,
    },
});  
export default HomeScreen;