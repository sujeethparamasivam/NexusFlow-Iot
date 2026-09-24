import axios from 'axios';
import { ITelemetryData } from '../types';

const API_URL = '/api';

export const telemetryService = {
  async ingestTelemetry(telemetry: ITelemetryData): Promise<void> {
    await axios.post(`${API_URL}/telemetry/ingest`, telemetry);
  },

  async ingestBatch(telemetry: ITelemetryData[]): Promise<void> {
    await axios.post(`${API_URL}/telemetry/batch`, telemetry);
  },

  async getTelemetry(
    deviceId: string,
    options?: { from?: Date; to?: Date; limit?: number }
  ): Promise<ITelemetryData[]> {
    const { data } = await axios.get(`${API_URL}/telemetry/${deviceId}`, {
      params: options,
    });
    return data.data;
  },
};
