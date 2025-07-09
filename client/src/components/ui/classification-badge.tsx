import { Shield, Eye, AlertTriangle, Lock, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClassificationBadgeProps {
  level: number;
  className?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

interface ClassificationInfo {
  name: string;
  color: string;
  textColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CLASSIFICATION_LEVELS: Record<number, ClassificationInfo> = {
  1: {
    name: "UNCLASSIFIED",
    color: "bg-green-500",
    textColor: "text-white",
    icon: Eye,
    description: "Public information"
  },
  2: {
    name: "RESTRICTED",
    color: "bg-yellow-500", 
    textColor: "text-black",
    icon: AlertTriangle,
    description: "Internal use only"
  },
  3: {
    name: "SECRET",
    color: "bg-orange-500",
    textColor: "text-white", 
    icon: Shield,
    description: "Sensitive operational data"
  },
  4: {
    name: "TOP SECRET",
    color: "bg-red-500",
    textColor: "text-white",
    icon: Lock,
    description: "Critical national security"
  },
  5: {
    name: "FORENSIC ONLY",
    color: "bg-purple-500",
    textColor: "text-white",
    icon: Search,
    description: "Investigation data only"
  }
};

export function ClassificationBadge({ 
  level, 
  className, 
  showIcon = true, 
  size = "md" 
}: ClassificationBadgeProps) {
  const classification = CLASSIFICATION_LEVELS[level] || CLASSIFICATION_LEVELS[1];
  const Icon = classification.icon;
  
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm", 
    lg: "px-4 py-2 text-base"
  };
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 rounded font-bold border border-black/20",
        classification.color,
        classification.textColor,
        sizeClasses[size],
        className
      )}
      title={classification.description}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {classification.name}
    </span>
  );
}

interface ClearanceIndicatorProps {
  userLevel: number;
  requiredLevel: number;
  className?: string;
}

export function ClearanceIndicator({ 
  userLevel, 
  requiredLevel, 
  className 
}: ClearanceIndicatorProps) {
  const hasAccess = userLevel >= requiredLevel;
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ClassificationBadge level={userLevel} size="sm" />
      <span className="text-gray-400">→</span>
      <ClassificationBadge 
        level={requiredLevel} 
        size="sm"
        className={cn(
          !hasAccess && "opacity-50 ring-2 ring-red-500"
        )}
      />
      {!hasAccess && (
        <span className="text-red-500 text-xs font-medium">
          ACCESS DENIED
        </span>
      )}
    </div>
  );
}

interface EmergencyOverrideBadgeProps {
  expiresAt: Date;
  className?: string;
}

export function EmergencyOverrideBadge({ 
  expiresAt, 
  className 
}: EmergencyOverrideBadgeProps) {
  const timeRemaining = Math.max(0, expiresAt.getTime() - Date.now());
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  return (
    <span 
      className={cn(
        "inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-bold",
        "bg-yellow-500 text-black border border-yellow-600 animate-pulse",
        className
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      EMERGENCY OVERRIDE
      <span className="ml-1 text-yellow-800">
        ({hoursRemaining}h {minutesRemaining}m)
      </span>
    </span>
  );
}