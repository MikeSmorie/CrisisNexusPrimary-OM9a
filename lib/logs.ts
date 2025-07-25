// CrisisNexus Emergency Management System
// Emergency logging service
import { db } from "@db";
import { disasterErrorLogs } from "@db/schema";

export type LogEventType = 'USER_ACTION' | 'SYSTEM_EVENT' | 'EMERGENCY_ALERT' | 'INCIDENT_CREATED';
export type LogSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EmergencyLogEvent {
  level: LogSeverity;
  message: string;
  source: string;
  eventType?: LogEventType;
  metadata?: any;
}

export async function logEvent(event: EmergencyLogEvent) {
  try {
    await db.insert(disasterErrorLogs).values({
      level: event.level,
      message: event.message,
      source: event.source,
      stackTrace: event.metadata ? JSON.stringify(event.metadata) : null,
    });
  } catch (error) {
    console.error("Emergency logging failed:", error);
  }
}