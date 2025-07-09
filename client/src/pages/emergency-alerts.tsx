import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Radio, Siren, Speaker, Smartphone, Plus, Volume2, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DisasterAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  issuedBy: number;
  targetZones?: string;
  activeUntil?: string;
  createdAt: string;
  acknowledgedBy?: string;
  broadcastChannels?: string;
}

const createAlertSchema = z.object({
  alertType: z.string().min(1, "Alert type is required"),
  severity: z.string().min(1, "Severity level is required"),
  title: z.string().min(5, "Title must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  targetZones: z.string().optional(),
  activeUntil: z.string().optional(),
  broadcastChannels: z.string().min(1, "At least one broadcast channel is required")
});

type CreateAlertForm = z.infer<typeof createAlertSchema>;

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'emergency': return 'bg-red-600 text-white animate-pulse';
    case 'warning': return 'bg-orange-500 text-white';
    case 'watch': return 'bg-yellow-500 text-black';
    default: return 'bg-gray-500 text-white';
  }
}

function getAlertTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'evacuation': return '🚨';
    case 'weather': return '🌩️';
    case 'all_clear': return '✅';
    case 'public_warning': return '📢';
    case 'internal': return '🏢';
    default: return '⚠️';
  }
}

function getBroadcastIcon(channel: string) {
  switch (channel.toLowerCase()) {
    case 'radio': return <Radio className="h-4 w-4" />;
    case 'sms': return <Smartphone className="h-4 w-4" />;
    case 'sirens': return <Siren className="h-4 w-4" />;
    case 'social': return <Speaker className="h-4 w-4" />;
    default: return <Volume2 className="h-4 w-4" />;
  }
}

export default function EmergencyAlerts() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['/api/disaster/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json() as DisasterAlert[];
    }
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data: CreateAlertForm) => {
      const alertData = {
        ...data,
        issuedBy: 1, // TODO: Get actual user ID
        activeUntil: data.activeUntil ? new Date(data.activeUntil).toISOString() : null
      };
      
      const response = await fetch('/api/disaster/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData)
      });
      if (!response.ok) throw new Error('Failed to create alert');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/alerts'] });
      setCreateDialogOpen(false);
      toast({
        title: "Emergency Alert Issued",
        description: "Alert has been broadcast to all specified channels."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to issue alert. Please try again.",
        variant: "destructive"
      });
    }
  });

  const form = useForm<CreateAlertForm>({
    resolver: zodResolver(createAlertSchema),
    defaultValues: {
      alertType: '',
      severity: '',
      title: '',
      message: '',
      targetZones: '',
      activeUntil: '',
      broadcastChannels: ''
    }
  });

  const onSubmit = (data: CreateAlertForm) => {
    createAlertMutation.mutate(data);
  };

  // Filter active alerts (not expired)
  const activeAlerts = alerts?.filter(alert => {
    if (!alert.activeUntil) return true;
    return new Date(alert.activeUntil) > new Date();
  }) || [];

  const expiredAlerts = alerts?.filter(alert => {
    if (!alert.activeUntil) return false;
    return new Date(alert.activeUntil) <= new Date();
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Emergency Alert System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between border-b border-red-200 pb-4">
        <div className="flex items-center space-x-3">
          <Radio className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Alert System</h1>
            <p className="text-lg text-gray-600">Mass Notification and Public Warnings</p>
          </div>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Issue New Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Issue Emergency Alert</DialogTitle>
              <DialogDescription>
                Create and broadcast an emergency alert to the public and response teams.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="alertType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alert Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select alert type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="evacuation">🚨 Evacuation Order</SelectItem>
                            <SelectItem value="weather">🌩️ Weather Alert</SelectItem>
                            <SelectItem value="all_clear">✅ All Clear</SelectItem>
                            <SelectItem value="public_warning">📢 Public Warning</SelectItem>
                            <SelectItem value="internal">🏢 Internal Alert</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity Level *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select severity" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="watch">Watch - Monitor conditions</SelectItem>
                            <SelectItem value="warning">Warning - Take action</SelectItem>
                            <SelectItem value="emergency">Emergency - Immediate action required</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Brief, clear title for the alert" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Message *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Clear, actionable message for the public..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="targetZones"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Zones (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Zone 1, Downtown, Riverside" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="activeUntil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Active Until (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="broadcastChannels"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Broadcast Channels *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select broadcast channels" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="radio">Radio Only</SelectItem>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="sirens">Emergency Sirens</SelectItem>
                          <SelectItem value="radio,sms">Radio + SMS</SelectItem>
                          <SelectItem value="radio,sms,sirens">All Channels</SelectItem>
                          <SelectItem value="radio,sms,sirens,social">All Channels + Social Media</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-red-600 hover:bg-red-700"
                    disabled={createAlertMutation.isPending}
                  >
                    {createAlertMutation.isPending ? 'Broadcasting...' : 'Issue Alert'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-red-700 flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5" />
            <span>ACTIVE EMERGENCY ALERTS</span>
          </h2>
          
          {activeAlerts.map((alert) => (
            <Card key={alert.id} className="border-red-300 bg-red-50 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-3xl">{getAlertTypeIcon(alert.alertType)}</span>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getSeverityColor(alert.severity)}>
                            {alert.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {alert.alertType.replace(/_/g, ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-bold text-red-900">
                          {alert.title}
                        </h3>
                      </div>
                    </div>

                    <div className="bg-white p-4 rounded-lg border border-red-200 mb-4">
                      <p className="text-gray-800 text-lg leading-relaxed">{alert.message}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Clock className="h-4 w-4" />
                        <span className="font-medium">Issued:</span>
                        <span>{new Date(alert.createdAt).toLocaleString()}</span>
                      </div>
                      
                      {alert.targetZones && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Info className="h-4 w-4" />
                          <span className="font-medium">Zones:</span>
                          <span>{alert.targetZones}</span>
                        </div>
                      )}

                      {alert.activeUntil && (
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Active Until:</span>
                          <span>{new Date(alert.activeUntil).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    {alert.broadcastChannels && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-700 mb-2">
                          <Volume2 className="h-4 w-4" />
                          <span className="font-medium">Broadcast Channels:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {alert.broadcastChannels.split(',').map((channel, index) => (
                            <Badge key={index} variant="secondary" className="flex items-center space-x-1">
                              {getBroadcastIcon(channel.trim())}
                              <span>{channel.trim().toUpperCase()}</span>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button size="sm" variant="outline">
                      Edit Alert
                    </Button>
                    <Button size="sm" variant="outline">
                      Re-broadcast
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      All Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Recent Alerts History */}
      {expiredAlerts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-700 flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Recent Alert History</span>
          </h2>
          
          {expiredAlerts.slice(0, 5).map((alert) => (
            <Card key={alert.id} className="border-gray-200 bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl opacity-60">{getAlertTypeIcon(alert.alertType)}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{alert.title}</h4>
                      <p className="text-sm text-gray-600">
                        {alert.alertType.replace(/_/g, ' ')} • {new Date(alert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="opacity-60">
                    EXPIRED
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Alerts State */}
      {activeAlerts.length === 0 && expiredAlerts.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-gray-600">All systems normal - no emergency alerts active</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}