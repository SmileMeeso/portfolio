import { create } from 'zustand';
import type {
  CadPart, PlacedInstance, Sketch, ExtrudeFeature, AssemblyLink,
} from './types';

let _id = 1;
export const genId = () => `cad-${_id++}`;

interface CadStore {
  parts: CadPart[];
  instances: PlacedInstance[];

  // Parts CRUD
  addPart: () => string;
  renamePart: (id: string, name: string) => void;
  deletePart: (id: string) => void;
  updateSketch: (id: string, sketch: Sketch) => void;
  setExtrude: (id: string, extrude: ExtrudeFeature | null) => void;

  resetAll: () => void;

  // Assembly instances
  addInstance: (partId: string, pos: [number, number, number]) => string;
  removeInstance: (instanceId: string) => void;
  setInstancePosition: (instanceId: string, pos: [number, number, number]) => void;
  setInstanceRotX: (instanceId: string, rotX: number) => void;
  linkInstances: (link: AssemblyLink & { ownerInstanceId: string }) => void;
  unlinkInstance: (instanceId: string) => void;
}

export const useCadStore = create<CadStore>((set) => ({
  parts: [],
  instances: [],

  resetAll: () => set({ parts: [], instances: [] }),

  addPart: () => {
    const id = genId();
    set((s) => ({
      parts: [...s.parts, { id, name: `부품 ${s.parts.length + 1}`, sketch: null, extrude: null }],
    }));
    return id;
  },

  renamePart: (id, name) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, name } : p)) })),

  deletePart: (id) =>
    set((s) => ({
      parts: s.parts.filter((p) => p.id !== id),
      instances: s.instances.filter((i) => i.partId !== id),
    })),

  updateSketch: (id, sketch) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, sketch } : p)) })),

  setExtrude: (id, extrude) =>
    set((s) => ({ parts: s.parts.map((p) => (p.id === id ? { ...p, extrude } : p)) })),

  addInstance: (partId, pos) => {
    const instanceId = genId();
    set((s) => ({
      instances: [
        ...s.instances,
        { instanceId, partId, position: pos, rotX: 0, links: [] },
      ],
    }));
    return instanceId;
  },

  removeInstance: (instanceId) =>
    set((s) => ({
      instances: s.instances
        .filter((i) => i.instanceId !== instanceId)
        .map((i) => ({
          ...i,
          links: i.links.filter((l) => l.targetInstanceId !== instanceId),
        })),
    })),

  setInstancePosition: (instanceId, pos) =>
    set((s) => ({
      instances: s.instances.map((i) =>
        i.instanceId === instanceId ? { ...i, position: pos } : i,
      ),
    })),

  setInstanceRotX: (instanceId, rotX) =>
    set((s) => ({
      instances: s.instances.map((i) =>
        i.instanceId === instanceId ? { ...i, rotX } : i,
      ),
    })),

  linkInstances: ({ ownerInstanceId, myEdgeId, targetInstanceId, targetEdgeId }) =>
    set((s) => ({
      instances: s.instances.map((i) => {
        if (i.instanceId !== ownerInstanceId) return i;
        const alreadyLinked = i.links.some((l) => l.myEdgeId === myEdgeId);
        if (alreadyLinked) return i;
        return { ...i, links: [...i.links, { myEdgeId, targetInstanceId, targetEdgeId }] };
      }),
    })),

  unlinkInstance: (instanceId) =>
    set((s) => ({
      instances: s.instances.map((i) =>
        i.instanceId === instanceId
          ? { ...i, links: [] }
          : { ...i, links: i.links.filter((l) => l.targetInstanceId !== instanceId) },
      ),
    })),
}));
