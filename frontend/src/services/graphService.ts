import axios from 'axios';
import { IGraph } from '../types';

const API_URL = '/api';

export const graphService = {
  async getGraphs(): Promise<IGraph[]> {
    const { data } = await axios.get(`${API_URL}/graphs`);
    return data.data;
  },

  async getGraph(id: string): Promise<IGraph> {
    const { data } = await axios.get(`${API_URL}/graphs/${id}`);
    return data.data;
  },

  async createGraph(graph: Omit<IGraph, '_id'>): Promise<IGraph> {
    const { data } = await axios.post(`${API_URL}/graphs`, graph);
    return data.data;
  },

  async updateGraph(id: string, graph: IGraph): Promise<IGraph> {
    const { data } = await axios.put(`${API_URL}/graphs/${id}`, graph);
    return data.data;
  },

  async deleteGraph(id: string): Promise<void> {
    await axios.delete(`${API_URL}/graphs/${id}`);
  },
};
