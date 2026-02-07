// src/store/useSettingStore.ts
// 这里面放的是设置相关的信息，比如自动播放，快进倍速，选中的频道ID等
import {create} from 'zustand';

interface SettingState {
    autoPlay: boolean;
    setAutoPlay: (value: boolean) => void;
    fastForwardRate?: number;
    setFastForwardRate?: (value: number) => void;
    chanelId?: string;
    setChanelId?: (value: string) => void;
}

export const useSettingStore = create<SettingState>((set) => ({
    autoPlay: false,
    setAutoPlay: (value: boolean) => set(() => ({ autoPlay: value })),
    fastForwardRate: 2.0,
    setFastForwardRate: (value: number) => set(() => ({ fastForwardRate: value })),
    chanelId: "0",
    setChanelId: (value: string) => set(() => ({ chanelId: value })),
}));