import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { FailoverStatus } from "@/components/communication/failover-status";
import { VoiceRecorder } from "@/components/communication/voice-recorder";
import { useUser } from "@/hooks/use-user";
import { 
  Radio, 
  MessageSquare, 
  Satellite, 
  AlertTriangle,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CommunicationCenter() {
  const [isOnline, setIsOnline] = useState(true);
  const [activeIncidents, setActiveIncidents] = useState(12);
  const [messagesProcessed, setMessagesProcessed] = useState(1847);
  const [criticalAlerts, setCriticalAlerts] = useState(3);
  
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Simulate network status changes
    const interval = setInterval(() => {
      setIsOnline(prev => Math.random() > 0.1 ? true : !prev);
    }, 30000); // Change status every 30 seconds for demo

    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (content: string, voiceData?: ArrayBuffer): Promise<boolean> => {
    // Simulate sending message through failover system
    try {
      // In real implementation, this would use the failover system
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Message Sent",
        description: `Message delivered via ${isOnline ? 'primary channel' : 'offline queue'}`,
      });
      
      setMessagesProcessed(prev => prev + 1);
      return true;
    } catch (error) {
      toast({
        title: "Send Failed",
        description: "Message queued for retry",
        variant: "destructive"
      });
      return false;
    }
  };

  const sendTestAlert = async () => {
    const success = await handleSendMessage(
      "TEST: Communication system operational check - all channels functional",
    );
    
    if (success) {
      toast({
        title: "Test Alert Sent",
        description: "System-wide communication test completed"
      });
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Radio className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
              <p className="text-gray-600">Multi-layer redundancy & failover communication system</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={sendTestAlert}>
              <Zap className="h-4 w-4 mr-2" />
              Test All Channels
            </Button>
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "OPERATIONAL" : "FAILOVER MODE"}
            </Badge>
          </div>
        </div>
      </div>

      {/* User Info */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">
                  Communication Officer: {user?.username}
                </h3>
                <p className="text-red-700">
                  Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} | 
                  Zone: Alpha | Status: Active
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-4 text-sm">
                <div>
                  <p className="font-medium text-red-900">{activeIncidents}</p>
                  <p className="text-red-700">Active Incidents</p>
                </div>
                <div>
                  <p className="font-medium text-red-900">{messagesProcessed}</p>
                  <p className="text-red-700">Messages Today</p>
                </div>
                <div>
                  <p className="font-medium text-red-900">{criticalAlerts}</p>
                  <p className="text-red-700">Critical Alerts</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Communication Tabs */}
      <Tabs defaultValue="failover" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="failover">Failover Status</TabsTrigger>
          <TabsTrigger value="voice">Voice Recording</TabsTrigger>
          <TabsTrigger value="channels">Channel Management</TabsTrigger>
          <TabsTrigger value="emergency">Emergency Protocols</TabsTrigger>
        </TabsList>

        {/* Failover Status Tab */}
        <TabsContent value="failover" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <FailoverStatus />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Channel Performance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-900">99.2%</p>
                      <p className="text-sm text-green-700">Satellite Uptime</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-2xl font-bold text-blue-900">847ms</p>
                      <p className="text-sm text-blue-700">Avg Latency</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Failover Events</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span>Internet → Satellite</span>
                        <span className="text-gray-500">2 min ago</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>GSM → Internet</span>
                        <span className="text-gray-500">15 min ago</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Mesh → GSM</span>
                        <span className="text-gray-500">1 hr ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Voice Recording Tab */}
        <TabsContent value="voice" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VoiceRecorder 
              isOnline={isOnline}
              onSendMessage={handleSendMessage}
            />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="h-5 w-5" />
                  <span>Message Optimization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Channel Adaptations</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>🛰️ Satellite:</span>
                        <span>Full content, 2MB limit</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📶 Internet:</span>
                        <span>Standard delivery</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📱 GSM:</span>
                        <span>SMS format, 160 chars</span>
                      </div>
                      <div className="flex justify-between">
                        <span>📡 Mesh:</span>
                        <span>Ultra-compressed</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">
                      Offline Cache Active
                    </h4>
                    <p className="text-sm text-yellow-800">
                      Voice messages are encrypted and stored locally when offline.
                      Automatic delivery when connection restored.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Channel Management Tab */}
        <TabsContent value="channels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Channel Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Primary Channels</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Satellite className="h-4 w-4" />
                          <span>Tier-1 Satellite</span>
                        </div>
                        <Badge>Active</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        High-priority emergency communications
                      </p>
                    </div>
                    
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Globe className="h-4 w-4" />
                          <span>Terrestrial Internet</span>
                        </div>
                        <Badge variant="outline">Standby</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Standard operations and data transfer
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-medium">Failover Sequence</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
                      <span>Satellite Uplink</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
                      <span>Internet/Wi-Fi</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
                      <span>GSM Network</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
                      <span>Mesh/Helium</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs">5</span>
                      <span>Offline Cache</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Protocols Tab */}
        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Emergency Communication Protocols</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2">MAYDAY Protocol</h4>
                    <p className="text-sm text-red-800">
                      Life-threatening emergency. All channels activated simultaneously.
                      Immediate satellite uplink priority.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-semibold text-yellow-900 mb-2">Infrastructure Down</h4>
                    <p className="text-sm text-yellow-800">
                      Regional communication failure. Activate mesh network and 
                      GPS triangulation via GSM.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">Cyberattack Response</h4>
                    <p className="text-sm text-blue-800">
                      Internet compromise detected. Switch to satellite-only mode.
                      Enable encryption on all channels.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-medium mb-3">Quick Action Protocols</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start">
                      <Radio className="h-4 w-4 mr-2" />
                      Activate Emergency Broadcast
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Satellite className="h-4 w-4 mr-2" />
                      Force Satellite Mode
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Enable Encryption
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Test All Channels
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}