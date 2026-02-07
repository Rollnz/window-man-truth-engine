export interface TrackingHealthData {
  systemStatus: 'healthy' | 'degraded' | 'critical';
  statusReason: string;
  emqScore: {
    overall: number;
    breakdown: {
      email: number;
      phone: number;
      firstName: number;
      lastName: number;
      fbp: number;
      fbc: number;
    };
    trend: 'up' | 'down' | 'stable';
    previousScore: number;
    totalEvents: number;
  };
  fixQueue: {
    pendingCount: number;
    deadLetterCount: number;
    resolvedToday: number;
    oldestPending: string | null;
    byDestination: Record<string, number>;
  };
  diagnostics: {
    orphanEvents: number;
    duplicateEvents: number;
    conversionIntegrity: {
      ok: number;
      missing: number;
    };
    errorRate: number;
    totalEvents: number;
  };
  costImpact: {
    lostAttributedRevenue: number;
    potentialRecovery: number;
  };
}

export type HealthStatus = 'healthy' | 'degraded' | 'critical';
