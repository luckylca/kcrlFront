import React, { useState, useRef, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import PagerView from 'react-native-pager-view';
import CustomTabBar, { TabRoute } from '../components/CustomTabBar'; // 刚才写的组件
import { useTheme } from 'react-native-paper';

// === 导入你真实的三个页面 ===
import HomeScreen from './HomeScreen';
import CommunityScreen from './CommunityScreen';
import SettingsScreen from './SettingsScreen';


const MainScreen = ({ navigation, route }: any) => {
    const theme = useTheme();
    const [activeIndex, setActiveIndex] = useState(0);
    const pagerRef = useRef<PagerView>(null);

    // 1. 配置你的 Tab 列表
    const routes: TabRoute[] = useMemo(() => [
        { key: 'home', title: '状态', icon: 'home' },
        { key: 'community', title: '社区', icon: 'account-group' },
        { key: 'setting', title: '设置', icon: 'cog' },
    ], []);

    // 2. 处理 Tab 点击（联动 PagerView）
    const handleTabPress = (index: number) => {
        setActiveIndex(index);
        pagerRef.current?.setPage(index);
    };

    // 3. 处理滑动（联动 TabBar）
    const onPageSelected = (e: any) => {
        setActiveIndex(e.nativeEvent.position);
    };

    return (
        <View style={styles.container}>
            {/* 使用 PagerView 实现左右滑动 
               style 设置为透明，以便 App.tsx 的背景图能透出来
            */}
            < PagerView
                ref={pagerRef}
                style={styles.pagerView}
                initialPage={0}
                onPageSelected={onPageSelected}
                overdrag={true} // Android 上的回弹效果
            >
                {/* 第一页：Home */}
                < View key="home" style={styles.pageWrapper} >
                    {/* <HomeScreen /> */}
                    < HomeScreen navigation={navigation} route={route} name="首页内容" />
                </View >

                {/* 第二页：Community */}
                < View key="community" style={styles.pageWrapper} >
                    {/* <CommunityScreen /> */}
                    < CommunityScreen navigation={navigation} route={route} name="社区内容" />
                </View >

                {/* 第三页：Setting */}
                < View key="setting" style={styles.pageWrapper} >
                    {/* <SettingScreen /> */}
                    < SettingsScreen navigation={navigation} route={route} name="设置内容" />
                </View >
            </PagerView >

            {/* 自定义 TabBar 悬浮在底部 */}
            < CustomTabBar
                activeIndex={activeIndex}
                onIndexChange={handleTabPress}
                routes={routes}
            />
        </View >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'transparent', // 关键：设为透明，透出 App.tsx 的背景图
    },
    pagerView: {
        flex: 1,
        backgroundColor: 'transparent', // 关键
    },
    pageWrapper: {
        flex: 1,
        backgroundColor: 'transparent', // 关键：如果你的子页面有不透明背景，这里会被覆盖
    }
});

export default MainScreen;