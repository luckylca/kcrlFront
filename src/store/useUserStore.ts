// src/store/useUserStore.ts
// 这里面放的是用户相关的信息，以后是可以做数据同步，主要是channel和账号相关内容
import { create } from 'zustand';

interface UserState {
    username: string;
    password?: string;
    isLoggedIn: boolean;
    login: (name: string, pass: string) => void;
    logOut?: () => void;

    chanelList?: Array<{ id: string; name: string; url: string; type: string , status: string }>;
    addChanel?: (chanel: { id: string; name: string; url: string; type: string , status: string }) => void;
    removeChanel?: (id: string) => void;
}

export const useUserStore = create<UserState>((set) => ({
    username: '',
    password: '',
    isLoggedIn: false,
    login: (name: string, pass: string) => set({ username: name, password: pass, isLoggedIn: true }),
    logOut: () => set({ username: '', password: '', isLoggedIn: false }),

    chanelList: [
        { id: '0', name: '小姐姐1', status: '在线', url: 'https://api.yujn.cn/api/zzxjj.php?type=json' , type: 'video' },
        { id: '1', name: '小姐姐2', status: '在线', url: 'https://api.yujn.cn/api/xjj.php?type=json' , type: 'video' },
    ],
    addChanel: (chanel) => set((state) => ({ chanelList: [...(state.chanelList || []), chanel] })),
    removeChanel: (id) => set((state) => ({ chanelList: (state.chanelList || []).filter(chanel => chanel.id !== id) })),
}));