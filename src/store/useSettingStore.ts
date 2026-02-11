// src/store/useSettingStore.ts
// 这里面放的是设置相关的信息，包含UI的设置和CPPAPIConfig的设置
import { create } from 'zustand';
import { CPPAPIConfig } from '../api/CPPAPIConfig';
import RNFS from 'react-native-fs';

interface KeyEvent {
    onpress: string;
    click: string;
    dblclick: string;
    short_press: string;
    long_press: string;
}

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

    //CPPAPIConfig剩下的东西
    device: string[];
    setDevice: (value: string[]) => void;
    name: string;
    setName: (value: string) => void;
    enable_log: boolean;
    setEnableLog: (value: boolean) => void;
    cpu_affinity: number[];
    setCpuAffinity: (value: number[]) => void;
    keyevent: Record<string, KeyEvent>;
    setKeyevent: (value: Record<string, KeyEvent>) => void;


}

export const useSettingStore = create<SettingState>((set) => ({
    logRecord: false,
    setLogRecord: (value: boolean) => set(() => ({ logRecord: value })),
    // 主题设置,不放到设置API里面
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

    //CPPAPIConfig剩下的东西
    device: ['/dev/input/event0'],
    setDevice: (value: string[]) => set(() => ({ device: value })),
    name: 'sample_name',
    setName: (value: string) => set(() => ({ name: value })),
    enable_log: false,
    setEnableLog: (value: boolean) => set(() => ({ enable_log: value })),
    cpu_affinity: [0],
    setCpuAffinity: (value: number[]) => set(() => ({ cpu_affinity: value })),
    keyevent: {},
    setKeyevent: (value: Record<string, KeyEvent>) => set(() => ({ keyevent: value })),

}));

// 1. 实现防抖函数
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// 2. 定义具体的保存逻辑
const saveToFile = async (state: SettingState) => {
    const config = new CPPAPIConfig();

    // 映射数据 (将 Store 数据转为 Config 格式)
    config.device = state.device;
    config.name = state.name;
    config.click_threshold = state.clickThreshold.toString();
    config.short_press_threshold = state.shortPressThreshold.toString();
    config.long_press_threshold = state.longPressThreshold.toString();
    config.double_click_interval = state.doubleClickInterval.toString();
    config.enable_log = state.enable_log ? 1 : 0;
    config.cpu_affinity = state.cpu_affinity;
    config.keyevent = state.keyevent;

    const text = config.save();
    const path = `${RNFS.DocumentDirectoryPath}/kctrl.conf`;

    try {
        // 4. 写入文件 (UTF-8 编码)
        await RNFS.writeFile(path, text, 'utf8');
        console.log('文件保存成功，路径:', path);
    } catch (err) {
        console.error('文件保存失败:', err);
    }

};

// 3. 创建防抖后的保存函数 (1秒冷静期)
const debouncedSave = debounce(saveToFile, 1000);

// 4. 监听 Store 变化
useSettingStore.subscribe((state) => {
    debouncedSave(state);
});