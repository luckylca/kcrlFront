/* eslint-disable react-native/no-inline-styles */
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { View } from 'react-native';
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

    const requestedTabKey = route?.params?.initialTab;

    useEffect(() => {
        if (!requestedTabKey) return;
        const targetIndex = routes.findIndex(r => r.key === requestedTabKey);
        if (targetIndex >= 0 && targetIndex !== activeIndex) {
            setActiveIndex(targetIndex);
            pagerRef.current?.setPage(targetIndex);
        }
        navigation.setParams({ initialTab: undefined });
    }, [requestedTabKey, routes, activeIndex, navigation]);

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
        <View style={{ flex: 1, backgroundColor: 'transparent' }}>
            <PagerView
                ref={pagerRef}
                style={{ flex: 1, backgroundColor: 'transparent' }}
                initialPage={0}
                onPageSelected={onPageSelected}
                overdrag={true} // Android 上的回弹效果
            >
                {/* 第一页：Home */}
                < View key="home" style={{ flex: 1, backgroundColor: 'transparent' }} >
                    {/* <HomeScreen /> */}
                    < HomeScreen navigation={navigation} route={route} name="首页内容" />
                </View >

                {/* 第二页：Community */}
                < View key="community" style={{ flex: 1, backgroundColor: 'transparent' }} >
                    {/* <CommunityScreen /> */}
                    < CommunityScreen navigation={navigation} route={route} name="社区内容" />
                </View >

                {/* 第三页：Setting */}
                < View key="setting" style={{ flex: 1, backgroundColor: 'transparent' }} >
                    {/* <SettingScreen /> */}
                    < SettingsScreen navigation={navigation} route={route} name="设置内容" />
                </View >
            </PagerView >

            <CustomTabBar
                activeIndex={activeIndex}
                onIndexChange={handleTabPress}
                routes={routes}
            />
        </View >
    );
};

export default MainScreen;
