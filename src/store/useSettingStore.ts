// src/store/useSettingStore.ts
// 这里面放的是设置相关的信息，比如自动播放，快进倍速，选中的频道ID等
import { create } from 'zustand';

interface SettingState {
    logRecord: boolean;
    setLogRecord: (value: boolean) => void;
    // 主题设置
    isDarkMode: boolean;
    setDarkMode: (value: boolean) => void;
    themeColor: string;
    setThemeColor: (value: string) => void;
    backgroundImage: string | null;
    setBackgroundImage: (value: string | null) => void;
    backgroundOpacity: number;
    setBackgroundOpacity: (value: number) => void;

    // Time Config
    clickThreshold: number;
    setClickThreshold: (value: number) => void;
    shortPressThreshold: number;
    setShortPressThreshold: (value: number) => void;
    longPressThreshold: number;
    setLongPressThreshold: (value: number) => void;
    doubleClickInterval: number;
    setDoubleClickInterval: (value: number) => void;
}

export const useSettingStore = create<SettingState>((set) => ({
    logRecord: false,
    setLogRecord: (value: boolean) => set(() => ({ logRecord: value })),
    // 主题设置
    isDarkMode: false,
    setDarkMode: (value: boolean) => set(() => ({ isDarkMode: value })),
    themeColor: '#6750A4', // Default Purple
    setThemeColor: (value: string) => set(() => ({ themeColor: value })),
    backgroundImage: null,
    setBackgroundImage: (value: string | null) => set(() => ({ backgroundImage: value })),
    backgroundOpacity: 0.5,
    setBackgroundOpacity: (value: number) => set(() => ({ backgroundOpacity: value })),

    // Time Config Defaults
    clickThreshold: 200,
    setClickThreshold: (value: number) => set(() => ({ clickThreshold: value })),
    shortPressThreshold: 500,
    setShortPressThreshold: (value: number) => set(() => ({ shortPressThreshold: value })),
    longPressThreshold: 1000,
    setLongPressThreshold: (value: number) => set(() => ({ longPressThreshold: value })),
    doubleClickInterval: 300,
    setDoubleClickInterval: (value: number) => set(() => ({ doubleClickInterval: value })),


}));