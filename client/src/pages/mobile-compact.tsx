import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { 
  Bell, 
  Mic, 
  MessageSquare, 
  MapPin, 
  Menu,
  Radio,
  Users,
  Settings,
  AlertTriangle,
  CheckCircle,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface Alert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
}

interface Message {
  id: number;
  messageType: string;
  message: string;
  senderRole: string;
  createdAt: string;
  priority: string;
}

interface Incident {
  id: number;
  incidentCode: string;
  incidentType: string;
  status: string;
  severity: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export default function MobileCompact() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  // Fetch alerts
  const { data: alerts = [] } = useQuery({
    queryKey: ['/api/disaster/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch messages
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/disaster/communications'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/communications');
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Fetch incidents for map
  const { data: incidents = [] } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
    refetchInterval: 15000
  });

  // Voice report mutation
  const submitVoiceReport = useMutation({
    mutationFn: async (audioData: any) => {
      const response = await fetch('/api/disaster/reports/voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(audioData)
      });
      if (!response.ok) throw new Error('Failed to submit voice report');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Voice Report Sent",
        description: "Emergency report transmitted to command center",
      });
      setIsRecording(false);
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

  const handleVoiceReport = () => {
    if (!isRecording) {
      setIsRecording(true);
      toast({
        title: "Recording Started",
        description: "Speak clearly into your device microphone",
      });
      // Simulate recording for 3 seconds
      setTimeout(() => {
        submitVoiceReport.mutate({
          audioData: 'voice_data_placeholder',
          location: 'GPS coordinates pending',
          timestamp: new Date().toISOString()
        });
      }, 3000);
    }
  };

  const activeAlerts = alerts.filter((alert: Alert) => !alert.acknowledged);
  const unreadMessages = messages.filter((msg: Message) => msg.priority === 'high' || msg.priority === 'critical');
  const activeIncidents = incidents.filter((incident: Incident) => incident.status === 'active');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-600';
      case 'warning': return 'bg-orange-500';
      case 'watch': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getIncidentColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'major': return '🟡';
      case 'minor': return '🟢';
      default: return '⚫';
    }
  };

  const getRoleSpecificMenu = () => {
    const baseItems = [
      { label: 'Dashboard', icon: Home, path: '/' },
      { label: 'Settings', icon: Settings, path: '/settings' }
    ];

    switch (user?.role) {
      case 'responder':
        return [
          { label: 'My Tasks', icon: CheckCircle, path: '/responder' },
          { label: 'My Team', icon: Users, path: '/team' },
          ...baseItems
        ];
      case 'commander':
        return [
          { label: 'Command Center', icon: Radio, path: '/commander' },
          { label: 'Resource Control', icon: Users, path: '/resources' },
          { label: 'Incident Map', icon: MapPin, path: '/map' },
          ...baseItems
        ];
      case 'admin':
        return [
          { label: 'System Control', icon: Settings, path: '/admin' },
          { label: 'User Management', icon: Users, path: '/admin/users' },
          { label: 'System Logs', icon: AlertTriangle, path: '/admin/logs' },
          ...baseItems
        ];
      default:
        return baseItems;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 max-w-sm mx-auto">
      {/* Compact Header */}
      <div className="bg-red-600 text-white p-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-2">
          <Radio className="h-5 w-5" />
          <h1 className="font-bold text-lg">DisasterMng</h1>
        </div>
        <Drawer>
          <DrawerTrigger asChild>
            <Button variant="ghost" size="sm" className="text-white hover:bg-red-700">
              <Menu className="h-5 w-5" />
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Emergency Menu</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 space-y-2">
              {getRoleSpecificMenu().map((item, index) => (
                <Button key={index} variant="ghost" className="w-full justify-start">
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.label}
                </Button>
              ))}
            </div>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="p-3 space-y-3">
        {/* Alert Queue */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-red-600">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Alerts</span>
              </div>
              <Badge variant="destructive">{activeAlerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            {activeAlerts.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">No active alerts</p>
            ) : (
              <Drawer>
                <DrawerTrigger asChild>
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    TAP TO VIEW ALERTS
                  </Button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Active Emergency Alerts</DrawerTitle>
                  </DrawerHeader>
                  <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                    {activeAlerts.map((alert: Alert) => (
                      <div key={alert.id} className="bg-red-50 border border-red-200 rounded p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <div className={cn("w-2 h-2 rounded-full", getSeverityColor(alert.severity))} />
                              <span className="text-xs font-medium">{alert.alertType.toUpperCase()}</span>
                            </div>
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs text-gray-600 mt-1">{alert.location}</p>
                          </div>
                          <Button 
                            size="sm" 
                            onClick={() => acknowledgeAlert.mutate(alert.id)}
                            className="ml-2 bg-green-600 hover:bg-green-700"
                          >
                            ACK
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            )}
          </CardContent>
        </Card>

        {/* Voice Report Button */}
        <Card className="shadow-lg">
          <CardContent className="p-3">
            <Button 
              className={cn(
                "w-full h-16 text-lg font-bold",
                isRecording 
                  ? "bg-red-700 hover:bg-red-800 animate-pulse" 
                  : "bg-red-600 hover:bg-red-700"
              )}
              onClick={handleVoiceReport}
              disabled={isRecording || submitVoiceReport.isPending}
            >
              <Mic className="h-6 w-6 mr-2" />
              {isRecording ? "RECORDING..." : "VOICE REPORT"}
            </Button>
            <p className="text-xs text-gray-500 text-center mt-1">
              {isRecording ? "Speak clearly into microphone" : "Tap and hold to record emergency report"}
            </p>
          </CardContent>
        </Card>

        {/* Message Center */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-blue-600">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Messages</span>
              </div>
              <Badge variant="outline">{unreadMessages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline" className="w-full">
                  TAP TO OPEN
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Command Communications</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
                  {unreadMessages.length === 0 ? (
                    <p className="text-gray-500 text-center">No new messages</p>
                  ) : (
                    unreadMessages.map((msg: Message) => (
                      <div key={msg.id} className="border-l-4 border-blue-500 bg-blue-50 pl-3 py-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                            {msg.senderRole}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </DrawerContent>
            </Drawer>
          </CardContent>
        </Card>

        {/* Live Map */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <MapPin className="h-5 w-5" />
              <span>Live Incident Map</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="bg-gray-100 rounded-lg h-48 relative overflow-hidden">
              {/* Map placeholder with incident pins */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Interactive map loading...</p>
                </div>
              </div>
              
              {/* Incident pins overlay */}
              <div className="absolute inset-0">
                {activeIncidents.slice(0, 5).map((incident: Incident, index: number) => (
                  <div 
                    key={incident.id}
                    className="absolute text-lg cursor-pointer"
                    style={{
                      left: `${20 + (index * 15)}%`,
                      top: `${30 + (index * 10)}%`
                    }}
                    title={`${incident.incidentCode} - ${incident.incidentType}`}
                  >
                    {getIncidentColor(incident.severity)}
                  </div>
                ))}
              </div>

              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute bottom-2 right-2 bg-white/80"
              >
                Zoom
              </Button>
            </div>
            
            {/* Map Legend */}
            <div className="mt-2 flex items-center justify-center space-x-4 text-xs">
              <div className="flex items-center space-x-1">
                <span>🔴</span>
                <span>Critical</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🟡</span>
                <span>Major</span>
              </div>
              <div className="flex items-center space-x-1">
                <span>🟢</span>
                <span>Minor</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Menu */}
        <Card className="shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-700">
              {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} Menu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <div className="grid grid-cols-2 gap-2">
              {getRoleSpecificMenu().slice(0, 4).map((item, index) => (
                <Button key={index} variant="outline" className="h-12 flex flex-col space-y-1">
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs">{item.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}