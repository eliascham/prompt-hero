import { create } from "zustand";

interface CodeState {
  files: Record<string, string>;
  activeFile: string | null;
  diffMode: boolean;
  originalFiles: Record<string, string>;

  setFiles: (files: Record<string, string>) => void;
  updateFile: (path: string, content: string) => void;
  setActiveFile: (path: string) => void;
  toggleDiffMode: () => void;
}

export const useCodeStore = create<CodeState>((set) => ({
  files: {},
  activeFile: null,
  diffMode: false,
  originalFiles: {},

  setFiles: (files: Record<string, string>) => {
    const firstFile = Object.keys(files)[0] || null;
    set({
      files: { ...files },
      originalFiles: { ...files },
      activeFile: firstFile,
    });
  },

  updateFile: (path: string, content: string) =>
    set((s) => ({
      files: { ...s.files, [path]: content },
      activeFile: s.activeFile ?? path,
    })),

  setActiveFile: (path: string) => set({ activeFile: path }),

  toggleDiffMode: () => set((s) => ({ diffMode: !s.diffMode })),
}));
