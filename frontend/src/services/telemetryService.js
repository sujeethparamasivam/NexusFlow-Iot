import axios from 'axios';
const API_URL = '/api';
export const telemetryService = {
    async ingestTelemetry(telemetry) {
        await axios.post(`${API_URL}/telemetry/ingest`, telemetry);
    },
    async ingestBatch(telemetry) {
        await axios.post(`${API_URL}/telemetry/batch`, telemetry);
    },
    async getTelemetry(deviceId, options) {
        const { data } = await axios.get(`${API_URL}/telemetry/${deviceId}`, {
            params: options,
        });
        return data.data;
    },
};
