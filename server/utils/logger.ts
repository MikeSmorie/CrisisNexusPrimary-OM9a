// CrisisNexus Emergency Management System
// Emergency logging utility
import { db } from "@db";
import { disasterErrorLogs } from "@db/schema";

export interface EmergencyLogData {
  level: string;
  message: string;
  source: string;
  stackTrace?: string;
}

export async function logEmergencyEvent(data: EmergencyLogData) {
  try {
    await db.insert(disasterErrorLogs).values({
      level: data.level,
      message: data.message,
      source: data.source,
      stackTrace: data.stackTrace,
    });
  } catch (error) {
    console.error("Emergency logging failed:", error);
  }
}

// Export default logger for backward compatibility
export const logger = {
  error: (message: string, source: string = "system") => 
    logEmergencyEvent({ level: "ERROR", message, source }),
  warn: (message: string, source: string = "system") => 
    logEmergencyEvent({ level: "WARNING", message, source }),
  info: (message: string, source: string = "system") => 
    logEmergencyEvent({ level: "INFO", message, source })
};

// Export legacy function for backward compatibility
export const logError = (message: string, source: string = "system", error?: any) => {
  const errorMessage = error ? `${message}: ${error.message}` : message;
  return logEmergencyEvent({ 
    level: "ERROR", 
    message: errorMessage, 
    source,
    metadata: error?.stack 
  });
};