import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mic, FileText, Camera, MessageSquare, MapPin, AlertTriangle, CheckCircle, Radio } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Alert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  acknowledged: boolean;
}

interface Incident {
  id: number;
  incidentCode: string;
  incidentType: string;
  status: string;
  severity: string;
  location: string;
  createdAt: string;
}

interface Communication {
  id: number;
  messageType: string;
  message: string;
  senderRole: string;
  createdAt: string;
}

export default function ResponderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [reportText, setReportText] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const [reportType, setReportType] = useState<string>("");

  // Fetch active alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['/api/disaster/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Fetch my incidents
  const { data: incidents = [] } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Fetch communications
  const { data: communications = [] } = useQuery({
    queryKey: ['/api/disaster/communications'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/communications');
      if (!response.ok) throw new Error('Failed to fetch communications');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Report incident mutation
  const reportIncident = useMutation({
    mutationFn: async (incidentData: any) => {
      const response = await fetch('/api/disaster/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(incidentData)
      });
      if (!response.ok) throw new Error('Failed to report incident');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Incident Reported",
        description: "Emergency incident has been successfully reported to command center",
        variant: "default"
      });
      setReportText("");
      setReportType("");
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
    }
  });

  // Acknowledge alert mutation
  const acknowledgeAlert = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await fetch(`/api/disaster/alerts/${alertId}/acknowledge`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to acknowledge alert');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Alert Acknowledged",
        description: "Alert acknowledgment sent to command center",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/alerts'] });
    }
  });

  const handleQuickReport = (type: 'voice' | 'text' | 'image') => {
    if (type === 'voice') {
      toast({
        title: "Voice Report",
        description: "Voice recording feature will be implemented with WebRTC",
      });
    } else if (type === 'image') {
      toast({
        title: "Image Upload",
        description: "Photo capture feature will be implemented with camera API",
      });
    } else {
      setReportType('text');
    }
  };

  const handleSubmitReport = () => {
    if (!reportText.trim() || !reportType) {
      toast({
        title: "Missing Information",
        description: "Please fill in report details",
        variant: "destructive"
      });
      return;
    }

    reportIncident.mutate({
      incidentType: 'general',
      severity: 'minor',
      title: `Field Report: ${reportType}`,
      description: reportText,
      location: 'GPS coordinates pending',
      reportedBy: 'field_responder'
    });
  };

  const activeAlerts = alerts.filter((alert: Alert) => !alert.acknowledged);
  const myIncidents = incidents.slice(0, 5); // Show last 5 incidents
  const recentComms = communications.slice(0, 3); // Show last 3 communications

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'destructive';
      case 'warning': return 'destructive';
      case 'critical': return 'destructive';
      case 'major': return 'secondary';
      default: return 'outline';
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-red-600';
      case 'contained': return 'text-yellow-600';
      case 'resolved': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto space-y-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Radio className="h-6 w-6" />
            <div>
              <h1 className="text-lg font-bold">Field Responder</h1>
              <p className="text-red-200 text-sm">Emergency Response Unit</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white text-red-600">
            ACTIVE
          </Badge>
        </div>
      </div>

      {/* Quick Report Buttons */}
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>Emergency Report</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Button 
              onClick={() => handleQuickReport('voice')}
              className="h-16 flex flex-col space-y-1 bg-red-600 hover:bg-red-700"
            >
              <Mic className="h-6 w-6" />
              <span className="text-xs">VOICE</span>
            </Button>
            <Button 
              onClick={() => handleQuickReport('text')}
              variant={reportType === 'text' ? 'default' : 'outline'}
              className="h-16 flex flex-col space-y-1"
            >
              <FileText className="h-6 w-6" />
              <span className="text-xs">TEXT</span>
            </Button>
            <Button 
              onClick={() => handleQuickReport('image')}
              className="h-16 flex flex-col space-y-1 bg-amber-600 hover:bg-amber-700"
            >
              <Camera className="h-6 w-6" />
              <span className="text-xs">IMAGE</span>
            </Button>
          </div>

          {reportType === 'text' && (
            <div className="space-y-2">
              <Textarea
                placeholder="Describe the emergency situation..."
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                className="min-h-20"
              />
              <Button 
                onClick={handleSubmitReport}
                disabled={reportIncident.isPending}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {reportIncident.isPending ? "Sending..." : "Send Report"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Language Toggle */}
      <Card className="shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Language:</span>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">🇺🇸 EN</SelectItem>
                <SelectItem value="es">🇪🇸 ES</SelectItem>
                <SelectItem value="fr">🇫🇷 FR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Active Alerts */}
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-red-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Active Alerts</span>
            </div>
            <Badge variant="destructive">{activeAlerts.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeAlerts.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active alerts</p>
          ) : (
            activeAlerts.map((alert: Alert) => (
              <div key={alert.id} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge variant={severityColor(alert.severity)} className="text-xs">
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">{alert.alertType}</span>
                    </div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="text-xs text-gray-600 mt-1">{alert.location}</p>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => acknowledgeAlert.mutate(alert.id)}
                    disabled={acknowledgeAlert.isPending}
                    className="ml-2 bg-green-600 hover:bg-green-700"
                  >
                    ACK
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* My Incidents */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-700 flex items-center space-x-2">
            <MapPin className="h-5 w-5" />
            <span>My Incidents</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {myIncidents.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent incidents</p>
          ) : (
            myIncidents.map((incident: Incident) => (
              <div key={incident.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{incident.incidentCode}</span>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="text-xs">
                      {incident.incidentType}
                    </Badge>
                    {incident.status === 'resolved' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className={cn("h-2 w-2 rounded-full", 
                        incident.status === 'active' ? 'bg-red-500' : 
                        incident.status === 'contained' ? 'bg-yellow-500' : 'bg-gray-500'
                      )} />
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{incident.location}</p>
                <p className={cn("text-xs font-medium", statusColor(incident.status))}>
                  {incident.status.toUpperCase()}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* HQ Communications */}
      <Card className="shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-gray-700 flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>HQ Comms</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentComms.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent messages</p>
          ) : (
            recentComms.map((comm: Communication) => (
              <div key={comm.id} className="border-l-4 border-blue-500 bg-blue-50 pl-3 py-2">
                <div className="flex items-center justify-between mb-1">
                  <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                    {comm.senderRole}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(comm.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm">{comm.message}</p>
              </div>
            ))
          )}
          <div className="flex space-x-2 mt-3">
            <Button variant="outline" size="sm" className="flex-1">
              Quick Reply
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Voice Reply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}