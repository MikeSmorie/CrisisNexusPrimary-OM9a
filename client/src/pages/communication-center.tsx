import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Satellite, 
  Wifi, 
  Smartphone, 
  Radio, 
  Mic, 
  Send, 
  AlertTriangle,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Volume2,
  MessageCircle,
  Antenna,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { getQueryFn, apiRequest } from "@/lib/queryClient";

interface CommunicationChannel {
  id: number;
  channelType: string;
  channelName: string;
  status: string;
  priority: number;
  latency: number;
  bandwidth: number;
  reliability: string;
  lastHealthCheck: string;
  isEnabled: boolean;
}

interface FailoverLog {
  id: number;
  fromChannel: number;
  toChannel: number;
  reason: string;
  timestamp: string;
  latencyBefore: number;
  latencyAfter: number;
  messagesPending: number;
  resolved: boolean;
}

interface Message {
  id: number;
  messageId: string;
  content: string;
  priority: string;
  deliveryStatus: string;
  fallbackAttempts: number;
  createdAt: string;
  deliveredAt?: string;
  offlineQueue: boolean;
}

export default function CommunicationCenter() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("channels");
  const [messageContent, setMessageContent] = useState("");
  const [messagePriority, setMessagePriority] = useState("normal");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<number[]>([]);
  const [isRecording, setIsRecording] = useState(false);

  // Queries
  const { data: channels = [], isLoading: channelsLoading } = useQuery<CommunicationChannel[]>({
    queryKey: ["/api/communication/channels"],
    queryFn: getQueryFn(),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: failoverLogs = [], isLoading: logsLoading } = useQuery<FailoverLog[]>({
    queryKey: ["/api/communication/failover-logs"],
    queryFn: getQueryFn(),
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: ["/api/communication/messages"],
    queryFn: getQueryFn(),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  const { data: healthStatus } = useQuery({
    queryKey: ["/api/communication/health"],
    queryFn: getQueryFn(),
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { content: string; priority: string; toUser?: number }) => {
      const res = await apiRequest("POST", "/api/communication/send", messageData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication/messages"] });
      setMessageContent("");
      toast({
        title: "Message Sent",
        description: "Message sent successfully with failover protection"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const emergencyBroadcastMutation = useMutation({
    mutationFn: async (broadcastData: {
      title: string;
      message: string;
      channels: string;
      priority: string;
      targetZones?: string;
      targetRoles?: string;
    }) => {
      const res = await apiRequest("POST", "/api/communication/broadcast", broadcastData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication/messages"] });
      setBroadcastTitle("");
      setBroadcastMessage("");
      setSelectedChannels([]);
      toast({
        title: "Emergency Broadcast Sent",
        description: "Emergency broadcast sent to all selected channels"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Broadcast Failed",
        description: error.message || "Failed to send emergency broadcast",
        variant: "destructive"
      });
    }
  });

  const processVoiceMutation = useMutation({
    mutationFn: async (voiceData: { originalAudio: string; isOffline: boolean }) => {
      const res = await apiRequest("POST", "/api/communication/voice", voiceData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/communication/messages"] });
      setMessageContent(data.transcription);
      toast({
        title: "Voice Processed",
        description: "Voice message transcribed successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Voice Processing Failed",
        description: error.message || "Failed to process voice message",
        variant: "destructive"
      });
    }
  });

  // Channel status helpers
  const getChannelIcon = (channelType: string) => {
    switch (channelType) {
      case "satellite": return <Satellite className="h-4 w-4" />;
      case "internet": return <Wifi className="h-4 w-4" />;
      case "gsm": return <Smartphone className="h-4 w-4" />;
      case "mesh_helium": return <Radio className="h-4 w-4" />;
      case "offline_cache": return <Volume2 className="h-4 w-4" />;
      default: return <Antenna className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500";
      case "degraded": return "bg-yellow-500";
      case "failed": return "bg-red-500";
      case "testing": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-600";
      case "high": return "bg-orange-600";
      case "normal": return "bg-blue-600";
      case "low": return "bg-gray-600";
      default: return "bg-gray-600";
    }
  };

  // Voice recording simulation
  const handleVoiceRecording = async () => {
    setIsRecording(true);
    
    // Simulate recording for 3 seconds
    setTimeout(async () => {
      setIsRecording(false);
      
      // Simulate audio data
      const mockAudioData = "base64_encoded_audio_data";
      
      processVoiceMutation.mutate({
        originalAudio: mockAudioData,
        isOffline: false
      });
    }, 3000);
  };

  // Send message
  const handleSendMessage = () => {
    if (!messageContent.trim()) return;
    
    sendMessageMutation.mutate({
      content: messageContent,
      priority: messagePriority
    });
  };

  // Send emergency broadcast
  const handleEmergencyBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastMessage.trim() || selectedChannels.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one channel",
        variant: "destructive"
      });
      return;
    }
    
    emergencyBroadcastMutation.mutate({
      title: broadcastTitle,
      message: broadcastMessage,
      channels: JSON.stringify(selectedChannels),
      priority: "critical",
      targetZones: JSON.stringify(["all"]),
      targetRoles: JSON.stringify(["all"])
    });
  };

  // Sort channels by priority
  const sortedChannels = [...channels].sort((a, b) => a.priority - b.priority);
  
  // Recent failover logs
  const recentLogs = failoverLogs.slice(0, 5);
  
  // Active channels count
  const activeChannels = channels.filter(c => c.status === "active" && c.isEnabled).length;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Radio className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Communication Center</h1>
              <p className="text-gray-600">Multi-Layer Redundancy & Failover System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-600">Active Channels</div>
              <div className="text-2xl font-bold text-green-600">{activeChannels}/{channels.length}</div>
            </div>
            <Shield className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      {healthStatus && (
        <Alert className={`border-2 ${healthStatus.status === 'operational' ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <Activity className="h-4 w-4" />
          <AlertDescription>
            <strong>System Status: {healthStatus.status.toUpperCase()}</strong>
            {' '}- {healthStatus.activeChannels}/{healthStatus.totalChannels} channels operational
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="channels">Channel Status</TabsTrigger>
          <TabsTrigger value="messaging">Messaging</TabsTrigger>
          <TabsTrigger value="broadcast">Emergency Broadcast</TabsTrigger>
          <TabsTrigger value="voice">Voice-to-Text</TabsTrigger>
          <TabsTrigger value="logs">Failover Logs</TabsTrigger>
        </TabsList>

        {/* Channel Status */}
        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedChannels.map((channel) => (
              <Card key={channel.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getChannelIcon(channel.channelType)}
                      <CardTitle className="text-lg">{channel.channelName}</CardTitle>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(channel.status)}`} />
                      <Badge variant="outline">Priority {channel.priority}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Latency</div>
                      <div className="font-semibold">{channel.latency}ms</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Reliability</div>
                      <div className="font-semibold">{channel.reliability}%</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600 text-sm mb-1">Bandwidth</div>
                    <Progress value={Math.min(channel.bandwidth / 1000, 100)} className="h-2" />
                    <div className="text-xs text-gray-500 mt-1">{channel.bandwidth} kbps</div>
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Last checked: {new Date(channel.lastHealthCheck).toLocaleTimeString()}
                  </div>
                </CardContent>
                
                {!channel.isEnabled && (
                  <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center rounded-lg">
                    <Badge variant="destructive">Disabled</Badge>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Messaging */}
        <TabsContent value="messaging" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Send className="h-5 w-5" />
                  <span>Send Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message-content">Message Content</Label>
                  <Textarea
                    id="message-content"
                    placeholder="Enter your message..."
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label htmlFor="message-priority">Priority Level</Label>
                  <Select value={messagePriority} onValueChange={setMessagePriority}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={handleSendMessage}
                  disabled={!messageContent.trim() || sendMessageMutation.isPending}
                  className="w-full"
                >
                  {sendMessageMutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>

            {/* Message History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>Recent Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {messages.slice(0, 10).map((message) => (
                    <div key={message.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Badge 
                          className={`${getPriorityColor(message.priority)} text-white`}
                        >
                          {message.priority}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          {message.deliveryStatus === 'delivered' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : message.deliveryStatus === 'failed' ? (
                            <XCircle className="h-4 w-4 text-red-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-yellow-600" />
                          )}
                          <span className="text-sm text-gray-600">{message.deliveryStatus}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-800 mb-2">{message.content}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                        {message.fallbackAttempts > 0 && (
                          <span className="text-orange-600">
                            {message.fallbackAttempts} failover{message.fallbackAttempts > 1 ? 's' : ''}
                          </span>
                        )}
                        {message.offlineQueue && (
                          <Badge variant="outline" className="text-xs">Offline Queue</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Emergency Broadcast */}
        <TabsContent value="broadcast" className="space-y-4">
          {(user?.role === 'admin' || user?.role === 'commander') ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Emergency Broadcast System</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="broadcast-title">Broadcast Title</Label>
                  <Input
                    id="broadcast-title"
                    placeholder="Emergency Alert Title"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="broadcast-message">Broadcast Message</Label>
                  <Textarea
                    id="broadcast-message"
                    placeholder="Enter emergency broadcast message..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label>Target Channels</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {channels.filter(c => c.isEnabled).map((channel) => (
                      <div key={channel.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`channel-${channel.id}`}
                          checked={selectedChannels.includes(channel.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedChannels([...selectedChannels, channel.id]);
                            } else {
                              setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`channel-${channel.id}`} className="text-sm">
                          {channel.channelName}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleEmergencyBroadcast}
                  disabled={!broadcastTitle.trim() || !broadcastMessage.trim() || selectedChannels.length === 0 || emergencyBroadcastMutation.isPending}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  {emergencyBroadcastMutation.isPending ? "Broadcasting..." : "Send Emergency Broadcast"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Alert className="border-red-500 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Access Restricted</strong> - Emergency broadcast requires Admin or Commander role
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Voice-to-Text */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mic className="h-5 w-5" />
                <span>Voice-to-Text Recording</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <Button
                  onClick={handleVoiceRecording}
                  disabled={isRecording || processVoiceMutation.isPending}
                  className={`w-32 h-32 rounded-full ${isRecording ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <Mic className="h-8 w-8" />
                    <span className="text-sm">
                      {isRecording ? "Recording..." : "Record"}
                    </span>
                  </div>
                </Button>
              </div>
              
              {isRecording && (
                <div className="text-center">
                  <div className="animate-pulse text-red-600 font-semibold">
                    Recording in progress...
                  </div>
                </div>
              )}
              
              {processVoiceMutation.isPending && (
                <div className="text-center">
                  <div className="text-blue-600 font-semibold">
                    Processing voice message...
                  </div>
                </div>
              )}
              
              <div className="text-sm text-gray-600 text-center">
                Press and hold the record button to capture voice messages.
                Voice will be automatically transcribed and can be sent as text.
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Failover Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5" />
                <span>Failover Event Logs</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLogs.map((log) => (
                  <div key={log.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <ArrowRight className="h-4 w-4 text-gray-600" />
                        <span className="text-sm font-medium">
                          Channel {log.fromChannel} → {log.toChannel}
                        </span>
                      </div>
                      <Badge variant={log.resolved ? "default" : "destructive"}>
                        {log.resolved ? "Resolved" : "Active"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      Reason: {log.reason} | Latency: {log.latencyBefore}ms → {log.latencyAfter}ms
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleString()} | {log.messagesPending} messages pending
                    </div>
                  </div>
                ))}
                
                {recentLogs.length === 0 && (
                  <div className="text-center py-6 text-gray-500">
                    No failover events recorded
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}