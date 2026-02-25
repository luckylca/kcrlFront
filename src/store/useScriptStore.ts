import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { generateShellScript } from '../utils/scriptGenerator';

export type ScriptType = 'logic' | 'function' | 'music' | 'system' | 'other';

export interface ScriptStep {
    id: string;
    type: ScriptType;
    name: string;
    command: string;
    description?: string;
    params?: Record<string, any>;
}

export interface SavedScript {
    id: string;
    name: string;
    steps: ScriptStep[];
    createdAt: number;
    updatedAt: number;
}

interface ScriptState {
    scripts: ScriptStep[];
    savedScripts: SavedScript[];
    currentScriptName: string;
    addScript: (step: ScriptStep) => void;
    removeScript: (id: string) => void;
    updateScript: (id: string, updates: Partial<ScriptStep>) => void;
    setScripts: (scripts: ScriptStep[]) => void;
    clearScripts: () => void;
    // New actions
    saveScript: (name: string, steps: ScriptStep[]) => void;
    deleteSavedScript: (id: string) => void;
    renameScript: (id: string, newName: string) => void;
    loadScript: (id: string) => void;
    setCurrentScriptName: (name: string) => void;
}

export const useScriptStore = create<ScriptState>()(
    persist(
        (set) => ({
            scripts: [],
            savedScripts: [],
            currentScriptName: '',
            addScript: (step) => set((state) => ({ scripts: [...state.scripts, step] })),
            removeScript: (id) => set((state) => ({ scripts: state.scripts.filter((s) => s.id !== id) })),
            updateScript: (id, updates) =>
                set((state) => ({
                    scripts: state.scripts.map((s) => (s.id === id ? { ...s, ...updates } : s)),
                })),
            setScripts: (scripts) => set({ scripts }),
            clearScripts: () => set({ scripts: [], currentScriptName: '' }),

            // New implementations
            saveScript: (name, steps) => set((state) => {
                const existingIndex = state.savedScripts.findIndex(s => s.name === name);
                const now = Date.now();

                if (existingIndex >= 0) {
                    // Update existing
                    const updatedScripts = [...state.savedScripts];
                    updatedScripts[existingIndex] = {
                        ...updatedScripts[existingIndex],
                        steps,
                        updatedAt: now
                    };
                    return { savedScripts: updatedScripts, currentScriptName: name };
                } else {
                    // Create new
                    const newScript: SavedScript = {
                        id: Date.now().toString(), // Simple ID generation
                        name,
                        steps,
                        createdAt: now,
                        updatedAt: now
                    };
                    return { savedScripts: [...state.savedScripts, newScript], currentScriptName: name };
                }
            }),
            deleteSavedScript: (id) => set((state) => ({
                savedScripts: state.savedScripts.filter(s => s.id !== id)
            })),
            renameScript: (id, newName) => set((state) => {
                const script = state.savedScripts.find(s => s.id === id);
                if (!script) { return {}; }
                const oldName = script.name;
                const updatedScripts = state.savedScripts.map(s =>
                    s.id === id ? { ...s, name: newName, updatedAt: Date.now() } : s
                );
                return {
                    savedScripts: updatedScripts,
                    currentScriptName: state.currentScriptName === oldName ? newName : state.currentScriptName,
                };
            }),
            loadScript: (id) => set((state) => {
                const script = state.savedScripts.find(s => s.id === id);
                if (script) {
                    return { scripts: script.steps, currentScriptName: script.name };
                }
                return {};
            }),
            setCurrentScriptName: (name) => set({ currentScriptName: name }),
        }),
        {
            name: 'script-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);

const sanitizeFileName = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
};

// 1. 实现防抖函数
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
    let timer: ReturnType<typeof setTimeout> | null = null;
    return (...args: Parameters<T>) => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}


const saveToFile = async (state: ScriptState) => {
    const BASE_DIR = RNFS.ExternalDirectoryPath;       // /sdcard/Android/data/包名/files
    const SCRIPTS_DIR = `${BASE_DIR}/scripts`;         // 专门放 .sh 的子目录

    try {
        // A. 确保 scripts 目录存在
        if (!(await RNFS.exists(SCRIPTS_DIR))) {
            await RNFS.mkdir(SCRIPTS_DIR);
        } else {
            // (可选) 激进同步策略：先清空目录，防止你删了脚本但文件还留着
            // 如果你只希望覆盖不希望删除，可以注释掉下面两行
            await RNFS.unlink(SCRIPTS_DIR).catch(() => { });
            await RNFS.mkdir(SCRIPTS_DIR);
        }

        // B. 遍历所有保存的脚本
        const promises = state.savedScripts.map(async (script) => {
            // 1. 生成文件名 (例如: "测试脚本.sh")
            const safeName = sanitizeFileName(script.name);
            const filePath = `${SCRIPTS_DIR}/${safeName}.sh`;

            // 2. 使用你的工具生成内容
            const shContent = generateShellScript(script.steps);

            // 3. 写入文件
            await RNFS.writeFile(filePath, shContent, 'utf8');
            console.log(`📄 已生成: ${safeName}.sh`);
        });

        // 等待所有文件写入完成
        await Promise.all(promises);
        console.log(`✅ 全部 .sh 脚本同步完成，共 ${promises.length} 个`);

    } catch (err) {
        console.error('❌ .sh 导出失败:', err);
    }
};

const debouncedSave = debounce(saveToFile, 1000);

// 4. 监听 Store 变化
useScriptStore.subscribe((state) => {
    debouncedSave(state);
});
