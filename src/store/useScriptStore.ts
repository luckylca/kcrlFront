import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ScriptType = 'logic' | 'function' | 'music' | 'other';

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
