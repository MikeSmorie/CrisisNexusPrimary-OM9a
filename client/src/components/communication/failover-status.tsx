import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Satellite, 
  Wifi, 
  Smartphone, 
  Radio, 
  WifiOff,
  RefreshCw,
  Signal,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface ChannelStatus {
  channel: string;
  available: boolean;
  latency: number;
  lastTest: Date;
  errorRate: number;
  bandwidth: number;
}

interface FailoverStatusProps {
  className?: string;
}

export function FailoverStatus({ className }: FailoverStatusProps) {
  const [channels, setChannels] = useState<ChannelStatus[]>([]);
  const [activeChannel, setActiveChannel] = useState<string>('satellite');
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  // Mock data for demonstration
  useEffect(() => {
    const mockChannels: ChannelStatus[] = [
      {
        channel: 'satellite',
        available: true,
        latency: 450,
        lastTest: new Date(),
        errorRate: 0.02,
        bandwidth: 2048
      },
      {
        channel: 'internet',
        available: true,
        latency: 85,
        lastTest: new Date(),
        errorRate: 0.01,
        bandwidth: 50000
      },
      {
        channel: 'gsm',
        available: true,
        latency: 1200,
        lastTest: new Date(),
        errorRate: 0.08,
        bandwidth: 384
      },
      {
        channel: 'mesh',
        available: false,
        latency: 3500,
        lastTest: new Date(Date.now() - 5 * 60 * 1000),
        errorRate: 0.25,
        bandwidth: 56
      },
      {
        channel: 'offline',
        available: true,
        latency: 0,
        lastTest: new Date(),
        errorRate: 0,
        bandwidth: 0
      }
    ];

    setChannels(mockChannels);
    setActiveChannel('satellite');
    setIsOnline(true);
    setOfflineQueueCount(0);
  }, []);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'satellite': return <Satellite className="h-4 w-4" />;
      case 'internet': return <Wifi className="h-4 w-4" />;
      case 'gsm': return <Smartphone className="h-4 w-4" />;
      case 'mesh': return <Radio className="h-4 w-4" />;
      case 'offline': return <WifiOff className="h-4 w-4" />;
      default: return <Signal className="h-4 w-4" />;
    }
  };

  const getChannelName = (channel: string) => {
    switch (channel) {
      case 'satellite': return 'Tier-1 Satellite';
      case 'internet': return 'Internet/Wi-Fi';
      case 'gsm': return 'GSM Network';
      case 'mesh': return 'Mesh/Helium';
      case 'offline': return 'Offline Cache';
      default: return channel;
    }
  };

  const getStatusColor = (available: boolean, latency: number) => {
    if (!available) return 'destructive';
    if (latency > 3000) return 'secondary';
    if (latency > 1000) return 'outline';
    return 'default';
  };

  const formatBandwidth = (bandwidth: number) => {
    if (bandwidth === 0) return 'N/A';
    if (bandwidth < 1000) return `${bandwidth} kbps`;
    return `${(bandwidth / 1000).toFixed(1)} Mbps`;
  };

  const testAllChannels = async () => {
    // Simulate channel testing
    setLastUpdate(new Date());
    
    // Mock random updates to demonstrate dynamic failover
    setChannels(prev => prev.map(ch => ({
      ...ch,
      available: Math.random() > (ch.channel === 'mesh' ? 0.7 : 0.1),
      latency: Math.random() * (ch.channel === 'satellite' ? 800 : ch.channel === 'gsm' ? 2000 : 200) + 50,
      lastTest: new Date(),
      errorRate: Math.max(0, ch.errorRate + (Math.random() - 0.5) * 0.1)
    })));
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Signal className="h-5 w-5" />
            <span>Communication Failover Status</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={isOnline ? "default" : "destructive"}>
              {isOnline ? "ONLINE" : "OFFLINE"}
            </Badge>
            <Button variant="outline" size="sm" onClick={testAllChannels}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Test
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Active Channel Display */}
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getChannelIcon(activeChannel)}
              <div>
                <h4 className="font-semibold text-green-900">
                  Active: {getChannelName(activeChannel)}
                </h4>
                <p className="text-sm text-green-700">
                  Primary communication channel operational
                </p>
              </div>
            </div>
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
        </div>

        {/* Channel Status List */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Channel Health</h4>
          {channels.map((channel, index) => (
            <div key={channel.channel} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(channel.channel)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{getChannelName(channel.channel)}</span>
                      <Badge variant={getStatusColor(channel.available, channel.latency)}>
                        {channel.available ? "Online" : "Offline"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>Latency: {channel.latency}ms</span>
                      <span>Error: {(channel.errorRate * 100).toFixed(1)}%</span>
                      <span>BW: {formatBandwidth(channel.bandwidth)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {channel.available ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
              
              {/* Latency Bar */}
              <div className="ml-7">
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        channel.latency > 3000 ? 'bg-red-500' : 
                        channel.latency > 1000 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min((channel.latency / 3000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {channel.latency > 3000 ? 'Slow' : channel.latency > 1000 ? 'Fair' : 'Fast'}
                  </span>
                </div>
              </div>

              {index < channels.length - 1 && <Separator />}
            </div>
          ))}
        </div>

        {/* Offline Queue Status */}
        {offlineQueueCount > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-900">
                {offlineQueueCount} messages queued for delivery
              </span>
            </div>
          </div>
        )}

        {/* Last Update */}
        <div className="text-xs text-gray-500 text-center">
          Last tested: {lastUpdate.toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}