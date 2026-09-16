import { Subscription } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { setupLogger } from '../config/logger.js';
import { compileAndExecute, IGraph, validateGraph } from '../compiler/StreamCompiler.js';
import { Server as SocketIOServer } from 'socket.io';
import { AlertService } from './AlertService.js';
import { telemetryStream$ } from './telemetryStream.js';

const logger = setupLogger();

export interface IActiveRule {
  graphId: string;
  graph: IGraph;
  subscription: Subscription;
  startTime: Date;
  eventCount: number;
  alertCount: number;
  lastEvent?: any;
  lastAlert?: any;
  status: 'Draft' | 'Active' | 'Paused' | 'Error';
}

export class RuleEngine {
  private activeRules: Map<string, IActiveRule> = new Map();
  private io: SocketIOServer;

  constructor(io: SocketIOServer) {
    this.io = io;
  }

  activateRule(graphId: string, graph: IGraph): { success: boolean; message: string } {
    try {
      if (!graph || !graph.nodes || !Array.isArray(graph.nodes)) {
        return { success: false, message: 'Invalid graph structure' };
      }

      const validation = validateGraph(graph);
      if (!validation.valid) {
        return { success: false, message: validation.errors.map((error) => error.message).join('; ') };
      }

      if (this.activeRules.has(graphId)) {
        this.deactivateRule(graphId);
      }

      logger.info(`Activating rule: ${graphId}`, { name: graph.name });

      const pipeline$ = compileAndExecute(graph, telemetryStream$);
      const subscription = pipeline$
        .pipe(
          tap((event) => {
            const rule = this.activeRules.get(graphId);
            if (!rule) return;

            rule.eventCount += 1;
            rule.lastEvent = event;

            this.io.emit('rule:execution', {
              event: 'rule:execution',
              ruleId: graphId,
              nodeId: event?.nodeId ?? 'processor',
              status: 'processing',
              timestamp: new Date().toISOString(),
              data: event,
            });

            if (event?.alert === true || event?.condition === '>' || event?.condition === '<' || event?.condition === '>=') {
              this.recordAlert(graphId, {
                ruleId: graphId,
                deviceId: event?.deviceId ?? 'unknown',
                severity: event?.severity ?? 'warning',
                message: `Condition triggered for ${event?.deviceId ?? 'device'}`,
                metric: event?.metric ?? 'value',
                value: Number(event?.value ?? 0),
                threshold: event?.threshold ?? 0,
              });
            }
          }),
          catchError((error) => {
            logger.error(`Rule execution error: ${graphId}`, error);
            this.io.emit('rule:update', {
              event: 'rule:update',
              ruleId: graphId,
              status: 'Error',
              timestamp: new Date().toISOString(),
            });
            this.deactivateRule(graphId);
            throw error;
          })
        )
        .subscribe({
          error: (error) => {
            logger.error(`Rule pipeline error: ${graphId}`, error);
            this.deactivateRule(graphId);
          },
          complete: () => {
            logger.info(`Rule pipeline completed: ${graphId}`);
            this.deactivateRule(graphId);
          },
        });

      const ruleEntry: IActiveRule = {
        graphId,
        graph,
        subscription,
        startTime: new Date(),
        eventCount: 0,
        alertCount: 0,
        status: 'Active',
      };

      this.activeRules.set(graphId, ruleEntry);
      this.io.emit('rule:update', {
        event: 'rule:update',
        ruleId: graphId,
        status: 'Active',
        timestamp: new Date().toISOString(),
      });

      logger.info(`✓ Rule activated: ${graphId}`);
      return { success: true, message: `Rule ${graphId} activated` };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error(`Rule activation failed: ${graphId}`, error);
      return { success: false, message: `Failed to activate rule: ${message}` };
    }
  }

  deactivateRule(graphId: string): { success: boolean; message: string } {
    try {
      const rule = this.activeRules.get(graphId);
      if (!rule) {
        return { success: false, message: 'Rule not found' };
      }

      rule.subscription.unsubscribe();
      this.activeRules.delete(graphId);

      this.io.emit('rule:update', {
        event: 'rule:update',
        ruleId: graphId,
        status: 'Paused',
        timestamp: new Date().toISOString(),
      });

      logger.info(`✓ Rule deactivated: ${graphId}`, {
        uptime: Date.now() - rule.startTime.getTime(),
        eventCount: rule.eventCount,
        alertCount: rule.alertCount,
      });

      return { success: true, message: `Rule ${graphId} deactivated` };
    } catch (error) {
      logger.error(`Rule deactivation failed: ${graphId}`, error);
      return { success: false, message: 'Failed to deactivate rule' };
    }
  }

  getActiveRules(): any[] {
    return Array.from(this.activeRules.values()).map((rule) => ({
      graphId: rule.graphId,
      name: rule.graph.name,
      description: rule.graph.description,
      uptime: Date.now() - rule.startTime.getTime(),
      eventCount: rule.eventCount,
      alertCount: rule.alertCount,
      lastEvent: rule.lastEvent,
      status: rule.status,
      startTime: rule.startTime,
    }));
  }

  getRuleStatus(graphId: string): any {
    const rule = this.activeRules.get(graphId);
    if (!rule) {
      return null;
    }

    return {
      graphId: rule.graphId,
      active: true,
      status: rule.status,
      uptime: Date.now() - rule.startTime.getTime(),
      eventCount: rule.eventCount,
      alertCount: rule.alertCount,
      lastEvent: rule.lastEvent,
      lastAlert: rule.lastAlert,
      startTime: rule.startTime,
    };
  }

  shutdown(): void {
    Array.from(this.activeRules.keys()).forEach((graphId) => {
      this.deactivateRule(graphId);
    });
    logger.info('✓ All rules shut down');
  }

  async recordAlert(graphId: string, alert: any): Promise<void> {
    const rule = this.activeRules.get(graphId);
    if (!rule) return;

    rule.alertCount += 1;
    rule.lastAlert = alert;

    const saved = await AlertService.createAlert({
      ruleId: graphId,
      deviceId: alert.deviceId,
      severity: alert.severity ?? 'warning',
      message: alert.message,
      metric: alert.metric,
      value: Number(alert.value ?? 0),
      threshold: alert.threshold,
    });

    const payload = {
      event: 'alert:created',
      alertId: saved?._id?.toString?.() ?? undefined,
      graphId,
      ...alert,
      timestamp: new Date().toISOString(),
    };

    this.io.emit('alert:created', payload);
    this.io.emit('alert:updated', payload);
    logger.warn(`ALERT: ${graphId}`, payload);
  }
}
