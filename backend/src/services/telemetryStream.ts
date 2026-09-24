import { Subject, Observable } from 'rxjs';

export type TelemetryRecord = {
  _id?: string;
  timestamp: Date | string;
  deviceId: string;
  deviceName?: string;
  metric: string;
  value: number;
  unit?: string;
  metadata?: Record<string, any>;
};

const telemetrySubject = new Subject<TelemetryRecord>();

export const telemetryStream$: Observable<TelemetryRecord> = telemetrySubject.asObservable();

export function publishTelemetry(data: TelemetryRecord): void {
  const normalized = {
    ...data,
    timestamp: data.timestamp instanceof Date ? data.timestamp : new Date(data.timestamp),
    metadata: data.metadata ?? {},
  };

  telemetrySubject.next(normalized);
}

export function resetTelemetryStream(): void {
  telemetrySubject.complete();
}
