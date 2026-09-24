import { create } from 'zustand';
import { IGraph } from '../types';
import { graphService } from '../services/graphService';

interface GraphStore {
  graphs: IGraph[];
  selectedGraph: IGraph | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchGraphs: () => Promise<void>;
  getGraph: (id: string) => Promise<void>;
  saveGraph: (graph: Omit<IGraph, '_id'>) => Promise<void>;
  updateGraph: (id: string, graph: IGraph) => Promise<void>;
  deleteGraph: (id: string) => Promise<void>;
  setSelectedGraph: (graph: IGraph | null) => void;
}

export const useGraphStore = create<GraphStore>((set) => ({
  graphs: [],
  selectedGraph: null,
  loading: false,
  error: null,

  fetchGraphs: async () => {
    set({ loading: true, error: null });
    try {
      const graphs = await graphService.getGraphs();
      set({ graphs, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch graphs', loading: false });
    }
  },

  getGraph: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const graph = await graphService.getGraph(id);
      set({ selectedGraph: graph, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch graph', loading: false });
    }
  },

  saveGraph: async (graph: Omit<IGraph, '_id'>) => {
    set({ loading: true, error: null });
    try {
      const savedGraph = await graphService.createGraph(graph);
      set((state) => ({
        graphs: [...state.graphs, savedGraph],
        selectedGraph: savedGraph,
        loading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to save graph', loading: false });
    }
  },

  updateGraph: async (id: string, graph: IGraph) => {
    set({ loading: true, error: null });
    try {
      const updatedGraph = await graphService.updateGraph(id, graph);
      set((state) => ({
        graphs: state.graphs.map((g) => (g._id === id ? updatedGraph : g)),
        selectedGraph: updatedGraph,
        loading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update graph', loading: false });
    }
  },

  deleteGraph: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await graphService.deleteGraph(id);
      set((state) => ({
        graphs: state.graphs.filter((g) => g._id !== id),
        selectedGraph: null,
        loading: false,
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete graph', loading: false });
    }
  },

  setSelectedGraph: (graph: IGraph | null) => set({ selectedGraph: graph }),
}));
