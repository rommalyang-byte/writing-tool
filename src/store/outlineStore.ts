// 大纲-细纲-节拍 状态管理
import { create } from "zustand";
import type { Outline, Section, Beat } from "@/types";
import * as db from "@/lib/db";

interface OutlineState {
  outlines: Outline[];
  sections: Map<string, Section[]>;
  beats: Map<string, Beat[]>;
  /** 当前选中的作品 ID */
  projectId: string | null;
  /** 当前展开的大纲 ID（树视图用） */
  expandedOutlines: Set<string>;
  /** 加载中标志 */
  loading: boolean;

  // Actions
  setProject: (projectId: string) => Promise<void>;
  loadOutlines: () => Promise<void>;
  loadSections: (outlineId: string) => Promise<Section[]>;
  loadBeats: (sectionId: string) => Promise<Beat[]>;
  addOutline: (title: string) => Promise<string>;
  addSection: (outlineId: string, title: string) => Promise<string>;
  addBeat: (sectionId: string, title: string) => Promise<string>;
  deleteOutline: (id: string) => Promise<void>;
  deleteSection: (id: string) => Promise<void>;
  deleteBeat: (id: string) => Promise<void>;
  toggleExpand: (outlineId: string) => void;
  reorderOutlines: (items: { id: string; sort_order: number }[]) => Promise<void>;
  reorderSections: (items: { id: string; sort_order: number }[]) => Promise<void>;
  reorderBeats: (items: { id: string; sort_order: number }[]) => Promise<void>;
  /** 将 section 移动到另一个 outline 下 */
  moveSection: (sectionId: string, newOutlineId: string) => Promise<void>;
  /** 将 beat 移动到另一个 section 下 */
  moveBeat: (beatId: string, newSectionId: string) => Promise<void>;
}

export const useOutlineStore = create<OutlineState>((set, get) => ({
  outlines: [],
  sections: new Map(),
  beats: new Map(),
  projectId: null,
  expandedOutlines: new Set(),
  loading: false,

  setProject: async (projectId: string) => {
    set({ projectId, outlines: [], sections: new Map(), beats: new Map() });
    await get().loadOutlines();
  },

  loadOutlines: async () => {
    const { projectId } = get();
    if (!projectId) return;
    set({ loading: true });
    try {
      const outlines = await db.getOutlinesByProject(projectId);
      set({ outlines });
    } finally {
      set({ loading: false });
    }
  },

  loadSections: async (outlineId: string) => {
    const sections = await db.getSectionsByOutline(outlineId);
    set((state) => {
      const newMap = new Map(state.sections);
      newMap.set(outlineId, sections);
      return { sections: newMap };
    });
    return sections;
  },

  loadBeats: async (sectionId: string) => {
    const beats = await db.getBeatsBySection(sectionId);
    set((state) => {
      const newMap = new Map(state.beats);
      newMap.set(sectionId, beats);
      return { beats: newMap };
    });
    return beats;
  },

  addOutline: async (title: string) => {
    const { projectId, outlines } = get();
    if (!projectId) return "";
    const sortOrder = outlines.length;
    const id = await db.createOutline(projectId, title, "", null, sortOrder);
    await get().loadOutlines();
    return id;
  },

  addSection: async (outlineId: string, title: string) => {
    const { projectId, sections } = get();
    if (!projectId) return "";
    const existing = sections.get(outlineId) ?? [];
    const sortOrder = existing.length;
    const id = await db.createSection(projectId, outlineId, title, "", null, sortOrder);
    await get().loadSections(outlineId);
    return id;
  },

  addBeat: async (sectionId: string, title: string) => {
    const { projectId, beats } = get();
    if (!projectId) return "";
    const existing = beats.get(sectionId) ?? [];
    const sortOrder = existing.length;
    const id = await db.createBeat(projectId, sectionId, title, "", sortOrder);
    await get().loadBeats(sectionId);
    return id;
  },

  deleteOutline: async (id: string) => {
    await db.deleteOutline(id);
    await get().loadOutlines();
  },

  deleteSection: async (id: string) => {
    await db.deleteSection(id);
    // 刷新所有已加载的 sections
    const { sections: loadedSections } = get();
    for (const [outlineId] of loadedSections) {
      await get().loadSections(outlineId);
    }
  },

  deleteBeat: async (id: string) => {
    await db.deleteBeat(id);
    const { beats: loadedBeats } = get();
    for (const [sectionId] of loadedBeats) {
      await get().loadBeats(sectionId);
    }
  },

  toggleExpand: (outlineId: string) => {
    set((state) => {
      const newSet = new Set(state.expandedOutlines);
      if (newSet.has(outlineId)) {
        newSet.delete(outlineId);
      } else {
        newSet.add(outlineId);
      }
      return { expandedOutlines: newSet };
    });
  },

  reorderOutlines: async (items) => {
    await db.batchUpdateSortOrder("outline", items);
    await get().loadOutlines();
  },

  reorderSections: async (items) => {
    await db.batchUpdateSortOrder("section", items);
    const { sections: loadedSections } = get();
    for (const [outlineId] of loadedSections) {
      await get().loadSections(outlineId);
    }
  },

  reorderBeats: async (items) => {
    await db.batchUpdateSortOrder("beat", items);
    const { beats: loadedBeats } = get();
    for (const [sectionId] of loadedBeats) {
      await get().loadBeats(sectionId);
    }
  },

  moveSection: async (sectionId: string, newOutlineId: string) => {
    await db.updateSection(sectionId, { outline_id: newOutlineId });
    const { sections: loadedSections } = get();
    for (const [outlineId] of loadedSections) {
      await get().loadSections(outlineId);
    }
  },

  moveBeat: async (beatId: string, newSectionId: string) => {
    await db.updateBeat(beatId, { section_id: newSectionId });
    const { beats: loadedBeats } = get();
    for (const [sectionId] of loadedBeats) {
      await get().loadBeats(sectionId);
    }
  },
}));