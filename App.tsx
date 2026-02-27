/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import { StatusBar, ImageBackground, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { useSettingStore } from './src/store/useSettingStore';
import ApiService from './src/api/OLAPI';
import DeviceInfo from 'react-native-device-info';
import { createNavigationContainerRef } from '@react-navigation/native';
import UpdateCard from './src/screens/component/UpdateCard';
import Utest, { testable } from './src/screens/Utest/libUtest.tsx';



const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

// 创建导航容器引用
const navigationRef = createNavigationContainerRef();

function App() {
  if (testable) return <Utest />;

  const isDarkMode = useSettingStore(state => state.isDarkMode);
  const themeColor = useSettingStore(state => state.themeColor);
  const backgroundImage = useSettingStore(state => state.backgroundImage);
  const backgroundOpacity = useSettingStore(state => state.backgroundOpacity);

  // 后台检查更新
  // React.useEffect(() => {
  //   const checkForUpdates = async () => {
  //     try {
  //       const currentBuild = Number(DeviceInfo.getBuildNumber());
  //       const updateInfo = await ApiService.getUpdataInfo();

  //       if (updateInfo.version > currentBuild) {
  //         console.log('发现新版本:', updateInfo.version_name);
  //         // 跳转到关于页面
  //         setTimeout(() => {
  //           if (navigationRef.isReady()) {
  //             navigationRef.navigate('About');
  //           }
  //         }, 1000);
  //       }
  //     } catch (error) {
  //       console.error('检查更新失败:', error);
  //     }
  //   };

  //   // 延迟3秒后检查更新，避免影响应用启动
  //   const timer = setTimeout(checkForUpdates, 100);

  //   return () => clearTimeout(timer);
  // }, []);

  // Dynamic Theme Construction
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const navTheme = isDarkMode ? DarkTheme : LightTheme;

  // If a background image is present, the app's "background" color needs to be transparent
  // so the image (rendered below) is visible.
  // The "tint" or "opacity" is handled by the View overlaying the image.
  const appBackgroundColor = backgroundImage ? 'transparent' : baseTheme.colors.background;

  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: themeColor,
      primaryContainer: isDarkMode ? undefined : themeColor + '20',
      background: appBackgroundColor, // Make transparent if BG image exists
    },
  };

  const combinedTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      ...theme.colors,
      background: appBackgroundColor, // Apply to NavigationContainer as well
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent={true}
      />
      <PaperProvider theme={theme}>
        {/* Global Background Image Layer */}
        {backgroundImage ? (
          <View style={StyleSheet.absoluteFill}>
            <ImageBackground
              source={{ uri: backgroundImage }}
              style={{ flex: 1 }}
              resizeMode="cover"
            >
              <View
                style={{
                  flex: 1,
                  backgroundColor: baseTheme.colors.background, // Use original opaque color for the tint
                  opacity: backgroundOpacity,
                }}
              />

            </ImageBackground>
          </View>
        ) : null}

        <NavigationContainer ref={navigationRef} theme={combinedTheme}>
          <RootNavigator />
        </NavigationContainer>
        <UpdateCard />
      </PaperProvider>
    </SafeAreaProvider>
    // <Utest />
  );
}

export default App;