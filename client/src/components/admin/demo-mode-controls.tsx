import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Play, 
  Square, 
  RotateCcw, 
  AlertTriangle, 
  Database, 
  Users, 
  Activity,
  CheckCircle,
  XCircle,
  Settings,
  Trash2,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DemoConfig {
  incidentCount: number;
  resourceCount: number;
  alertCount: number;
  communicationCount: number;
  responderCount: number;
}

interface DemoStatus {
  isDemoMode: boolean;
  mockDataCounts: {
    incidents: number;
    resources: number;
    alerts: number;
    communications: number;
    users: number;
  };
}

export function DemoModeControls() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetReason, setResetReason] = useState("");
  
  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    incidentCount: 12,
    resourceCount: 25,
    alertCount: 8,
    communicationCount: 30,
    responderCount: 15
  });

  // Fetch demo status
  const { data: demoStatus, isLoading: statusLoading } = useQuery<DemoStatus>({
    queryKey: ['/api/demo-admin/demo-status'],
    queryFn: async () => {
      const response = await fetch('/api/demo-admin/demo-status');
      if (!response.ok) throw new Error('Failed to fetch demo status');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ['/api/demo-admin/system-stats'],
    queryFn: async () => {
      const response = await fetch('/api/demo-admin/system-stats');
      if (!response.ok) throw new Error('Failed to fetch system stats');
      return response.json();
    },
    refetchInterval: 60000
  });

  // Generate demo data mutation
  const generateDemo = useMutation({
    mutationFn: async (config: DemoConfig) => {
      const response = await fetch('/api/demo-admin/generate-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Failed to generate demo data');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Demo Mode Activated",
        description: `Generated ${Object.values(data.summary).reduce((a: number, b: number) => a + b, 0)} mock data entries`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/demo-admin/demo-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/resources'] });
      setShowConfigDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Demo Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Clear mock data mutation
  const clearMockData = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/demo-admin/clear-mock', {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to clear mock data');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Mock Data Cleared",
        description: `Removed ${Object.values(data.summary).reduce((a: number, b: number) => a + b, 0)} mock entries`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/demo-admin/demo-status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/resources'] });
    },
    onError: (error: any) => {
      toast({
        title: "Clear Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // System reset mutation
  const systemReset = useMutation({
    mutationFn: async ({ confirmationText, emergencyReason }: { confirmationText: string; emergencyReason: string }) => {
      const response = await fetch('/api/demo-admin/system-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationText, emergencyReason })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reset system');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "System Reset Complete",
        description: "All data has been cleared. System ready for first deployment.",
      });
      queryClient.invalidateQueries();
      setShowResetDialog(false);
      setResetConfirmation("");
      setResetReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGenerateDemo = () => {
    generateDemo.mutate(demoConfig);
  };

  const handleClearMock = () => {
    clearMockData.mutate();
  };

  const handleSystemReset = () => {
    if (resetConfirmation !== "RESET") {
      toast({
        title: "Invalid Confirmation",
        description: "Type 'RESET' exactly to confirm system reset",
        variant: "destructive"
      });
      return;
    }
    
    if (resetReason.trim().length < 10) {
      toast({
        title: "Reason Required",
        description: "Please provide a detailed reason for the system reset",
        variant: "destructive"
      });
      return;
    }

    systemReset.mutate({ confirmationText: resetConfirmation, emergencyReason: resetReason });
  };

  const getDemoModeStatus = () => {
    if (statusLoading) return { color: "bg-gray-500", text: "Loading..." };
    if (demoStatus?.isDemoMode) return { color: "bg-green-500", text: "Demo Mode Active" };
    return { color: "bg-gray-500", text: "Production Mode" };
  };

  const status = getDemoModeStatus();

  return (
    <div className="space-y-6">
      {/* Demo Mode Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Demo Mode Controls</span>
            </CardTitle>
            <Badge className={cn("text-white", status.color)}>
              {status.text}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Status Grid */}
          {demoStatus && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{demoStatus.mockDataCounts.incidents}</div>
                <div className="text-sm text-gray-600">Mock Incidents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{demoStatus.mockDataCounts.resources}</div>
                <div className="text-sm text-gray-600">Mock Resources</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{demoStatus.mockDataCounts.alerts}</div>
                <div className="text-sm text-gray-600">Mock Alerts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{demoStatus.mockDataCounts.communications}</div>
                <div className="text-sm text-gray-600">Mock Messages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{demoStatus.mockDataCounts.users}</div>
                <div className="text-sm text-gray-600">Mock Users</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={showConfigDialog} onOpenChange={setShowConfigDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={generateDemo.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {generateDemo.isPending ? 'Generating...' : 'Generate Demo Data'}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configure Demo Data Generation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="incidents">Incidents</Label>
                      <Input
                        id="incidents"
                        type="number"
                        value={demoConfig.incidentCount}
                        onChange={(e) => setDemoConfig({ ...demoConfig, incidentCount: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label htmlFor="resources">Resources</Label>
                      <Input
                        id="resources"
                        type="number"
                        value={demoConfig.resourceCount}
                        onChange={(e) => setDemoConfig({ ...demoConfig, resourceCount: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label htmlFor="alerts">Alerts</Label>
                      <Input
                        id="alerts"
                        type="number"
                        value={demoConfig.alertCount}
                        onChange={(e) => setDemoConfig({ ...demoConfig, alertCount: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="30"
                      />
                    </div>
                    <div>
                      <Label htmlFor="communications">Messages</Label>
                      <Input
                        id="communications"
                        type="number"
                        value={demoConfig.communicationCount}
                        onChange={(e) => setDemoConfig({ ...demoConfig, communicationCount: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="100"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="responders">Responders</Label>
                      <Input
                        id="responders"
                        type="number"
                        value={demoConfig.responderCount}
                        onChange={(e) => setDemoConfig({ ...demoConfig, responderCount: parseInt(e.target.value) || 0 })}
                        min="1"
                        max="50"
                      />
                    </div>
                  </div>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will generate realistic mock data for demonstration purposes. 
                      All mock data is flagged and can be easily removed.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setShowConfigDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleGenerateDemo} disabled={generateDemo.isPending}>
                      Generate Demo Data
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button 
              variant="outline"
              onClick={handleClearMock}
              disabled={clearMockData.isPending || !demoStatus?.isDemoMode}
            >
              <Square className="h-4 w-4 mr-2" />
              {clearMockData.isPending ? 'Clearing...' : 'Clear Mock Data'}
            </Button>

            <Button 
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/demo-admin/demo-status'] })}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* System Reset Section */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-700">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              System reset will permanently delete ALL data except admin users. 
              This action cannot be undone and should only be used for emergencies or system redeployment.
            </AlertDescription>
          </Alert>

          <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="w-full">
                <Trash2 className="h-4 w-4 mr-2" />
                Full System Reset
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-red-700">Confirm System Reset</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This will permanently delete ALL incidents, resources, alerts, communications, 
                    and non-admin users. This action CANNOT be undone.
                  </AlertDescription>
                </Alert>

                <div>
                  <Label htmlFor="reset-reason">Emergency Reason (Required)</Label>
                  <Textarea
                    id="reset-reason"
                    placeholder="Provide a detailed reason for this system reset..."
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="reset-confirm">Type 'RESET' to confirm</Label>
                  <Input
                    id="reset-confirm"
                    value={resetConfirmation}
                    onChange={(e) => setResetConfirmation(e.target.value)}
                    placeholder="RESET"
                    className="mt-1"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={handleSystemReset}
                    disabled={systemReset.isPending || resetConfirmation !== "RESET"}
                  >
                    {systemReset.isPending ? 'Resetting...' : 'Confirm Reset'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* System Information */}
      {systemStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>System Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Environment:</strong> {systemStats.systemInfo?.environment}
              </div>
              <div>
                <strong>Version:</strong> {systemStats.systemInfo?.version}
              </div>
              <div>
                <strong>Uptime:</strong> {Math.floor((systemStats.systemInfo?.uptime || 0) / 60)} minutes
              </div>
              <div>
                <strong>Last Updated:</strong> {new Date().toLocaleTimeString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}