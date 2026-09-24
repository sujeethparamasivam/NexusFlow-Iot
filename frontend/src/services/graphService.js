import axios from 'axios';
const API_URL = '/api';
export const graphService = {
    async getGraphs() {
        const { data } = await axios.get(`${API_URL}/graphs`);
        return data.data;
    },
    async getGraph(id) {
        const { data } = await axios.get(`${API_URL}/graphs/${id}`);
        return data.data;
    },
    async createGraph(graph) {
        const { data } = await axios.post(`${API_URL}/graphs`, graph);
        return data.data;
    },
    async updateGraph(id, graph) {
        const { data } = await axios.put(`${API_URL}/graphs/${id}`, graph);
        return data.data;
    },
    async deleteGraph(id) {
        await axios.delete(`${API_URL}/graphs/${id}`);
    },
};
