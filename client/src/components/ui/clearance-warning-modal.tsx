import { useState } from "react";
import { Shield, AlertTriangle, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ClassificationBadge, ClearanceIndicator } from "./classification-badge";

interface ClearanceWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredLevel: number;
  userLevel: number;
  resourceType: string;
  resourceName: string;
  onProceed?: (overrideCode?: string) => void;
  onDeny?: () => void;
  allowOverride?: boolean;
}

export function ClearanceWarningModal({
  isOpen,
  onClose,
  requiredLevel,
  userLevel,
  resourceType,
  resourceName,
  onProceed,
  onDeny,
  allowOverride = false
}: ClearanceWarningModalProps) {
  const [overrideCode, setOverrideCode] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  const handleProceed = () => {
    if (onProceed) {
      onProceed(overrideCode || undefined);
    }
    handleClose();
  };

  const handleDeny = () => {
    if (onDeny) {
      onDeny();
    }
    handleClose();
  };

  const handleClose = () => {
    setOverrideCode("");
    setAcknowledged(false);
    onClose();
  };

  const getLevelName = (level: number): string => {
    const levels = {
      1: "UNCLASSIFIED",
      2: "RESTRICTED", 
      3: "SECRET",
      4: "TOP SECRET",
      5: "FORENSIC ONLY"
    };
    return levels[level as keyof typeof levels] || "UNKNOWN";
  };

  const getSeverityColor = () => {
    const diff = requiredLevel - userLevel;
    if (diff >= 3) return "bg-red-900 border-red-500";
    if (diff >= 2) return "bg-orange-900 border-orange-500";
    return "bg-yellow-900 border-yellow-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`max-w-md ${getSeverityColor()} text-white`}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-red-600 p-2 rounded-full">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold">
                SECURITY CLEARANCE REQUIRED
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Classification Comparison */}
          <div className="bg-black/20 p-4 rounded border border-white/20">
            <Label className="text-sm font-medium text-gray-300">
              Clearance Comparison
            </Label>
            <div className="mt-2">
              <ClearanceIndicator 
                userLevel={userLevel}
                requiredLevel={requiredLevel}
              />
            </div>
          </div>

          {/* Resource Information */}
          <div className="bg-black/20 p-4 rounded border border-white/20">
            <Label className="text-sm font-medium text-gray-300">
              Requested Resource
            </Label>
            <div className="mt-2 space-y-1">
              <p className="text-white font-medium">{resourceName}</p>
              <p className="text-gray-300 text-sm">Type: {resourceType}</p>
              <p className="text-gray-300 text-sm">
                Required: <ClassificationBadge level={requiredLevel} size="sm" />
              </p>
            </div>
          </div>

          {/* Warning Message */}
          <div className="bg-red-800/30 border border-red-500/50 p-4 rounded">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-2">
                <p className="text-red-200 text-sm font-medium">
                  Access to this resource requires {getLevelName(requiredLevel)} clearance.
                </p>
                <p className="text-red-300 text-xs">
                  Your current clearance level is {getLevelName(userLevel)}.
                  Unauthorized access may result in disciplinary action or legal consequences.
                </p>
              </div>
            </div>
          </div>

          {/* Emergency Override Section */}
          {allowOverride && (
            <div className="bg-yellow-800/30 border border-yellow-500/50 p-4 rounded">
              <div className="flex items-start space-x-2">
                <Lock className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-3 flex-1">
                  <p className="text-yellow-200 text-sm font-medium">
                    Emergency Override Available
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="override-code" className="text-yellow-300 text-xs">
                      Authorization Code
                    </Label>
                    <Input
                      id="override-code"
                      type="password"
                      placeholder="Enter emergency authorization code"
                      value={overrideCode}
                      onChange={(e) => setOverrideCode(e.target.value)}
                      className="bg-black/30 border-yellow-500/50 text-white placeholder-gray-400"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Acknowledgment */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              id="acknowledge"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1"
            />
            <Label htmlFor="acknowledge" className="text-sm text-gray-300">
              I acknowledge the security implications of this access attempt and understand
              that all activities are logged and monitored.
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Button
              variant="outline"
              onClick={handleDeny}
              className="flex-1 border-gray-500 text-gray-300 hover:bg-gray-700"
            >
              Cancel Access
            </Button>
            {allowOverride && (
              <Button
                onClick={handleProceed}
                disabled={!acknowledged || !overrideCode.trim()}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black font-medium"
              >
                Emergency Override
              </Button>
            )}
          </div>

          {/* Legal Notice */}
          <div className="text-xs text-gray-400 pt-2 border-t border-white/10">
            <p>
              This system is for authorized personnel only. All access attempts are
              logged and may be subject to audit. Misuse may result in disciplinary
              action or prosecution under applicable laws.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface QuickClearanceCheckProps {
  userLevel: number;
  requiredLevel: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showWarning?: boolean;
}

export function QuickClearanceCheck({
  userLevel,
  requiredLevel,
  children,
  fallback,
  showWarning = true
}: QuickClearanceCheckProps) {
  const hasAccess = userLevel >= requiredLevel;

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showWarning) {
      return (
        <div className="bg-red-50 border border-red-200 p-3 rounded">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4 text-red-500" />
            <span className="text-red-700 text-sm font-medium">
              Requires {getLevelName(requiredLevel)} clearance
            </span>
          </div>
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

function getLevelName(level: number): string {
  const levels = {
    1: "UNCLASSIFIED",
    2: "RESTRICTED",
    3: "SECRET", 
    4: "TOP SECRET",
    5: "FORENSIC ONLY"
  };
  return levels[level as keyof typeof levels] || "UNKNOWN";
}