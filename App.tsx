/* eslint-disable react-native/no-inline-styles */
import * as React from 'react';
import { StatusBar, ImageBackground, View, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme as NavDefaultTheme, DarkTheme as NavDarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from './src/navigation';
import { PaperProvider, MD3LightTheme, MD3DarkTheme, adaptNavigationTheme } from 'react-native-paper';
import { useSettingStore } from './src/store/useSettingStore';

import Utest, { testable } from './src/screens/Utest/libUtest.tsx';



const { LightTheme, DarkTheme } = adaptNavigationTheme({
  reactNavigationLight: NavDefaultTheme,
  reactNavigationDark: NavDarkTheme,
});

function App() {
  if (testable) return <Utest />;

  const isDarkMode = useSettingStore(state => state.isDarkMode);
  const themeColor = useSettingStore(state => state.themeColor);
  const backgroundImage = useSettingStore(state => state.backgroundImage);
  const backgroundOpacity = useSettingStore(state => state.backgroundOpacity);

  // Dynamic Theme Construction
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  const navTheme = isDarkMode ? DarkTheme : LightTheme;

  const theme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: themeColor,
      primaryContainer: isDarkMode ? undefined : themeColor + '20', // rough approximation for container
      // We can add more color derivation logic here if needed,
      // but for "simple", overriding primary is the biggest impact.
    },
  };

  const combinedTheme = {
    ...navTheme,
    ...theme,
    colors: {
      ...navTheme.colors,
      ...theme.colors,
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
                  backgroundColor: theme.colors.background,
                  opacity: 1 - backgroundOpacity,
                }}
              />
            </ImageBackground>
          </View>
        ) : null}

        <NavigationContainer theme={combinedTheme}>
          <RootNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
    // <Utest />
  );
}

export default App;