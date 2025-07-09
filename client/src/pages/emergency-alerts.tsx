import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { MessageSquare, Volume2, Clock, CheckCircle } from "lucide-react";

export default function EmergencyAlerts() {
  const { data: alerts } = useQuery({
    queryKey: ['/api/disaster/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/alerts');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 10000
  });

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <MessageSquare className="h-6 w-6 text-amber-600 flex-shrink-0" />
          <h1 className="text-3xl font-bold tracking-tight truncate">Emergency Alert System</h1>
        </div>
        <div className="flex gap-2 flex-shrink-0 ml-4">
          <Button variant="destructive" size="sm">
            <Volume2 className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="hidden sm:inline">Send Emergency Alert</span>
            <span className="sm:hidden">Alert</span>
          </Button>
        </div>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Volume2 className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Multi-Channel Alert Dispatch</span>
          </CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            Broadcast emergency alerts across all communication channels
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Badge variant="outline" className="text-green-600 mb-2">Satellite</Badge>
              <div className="text-xs">Ready</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Badge variant="outline" className="text-green-600 mb-2">SMS/GSM</Badge>
              <div className="text-xs">Active</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Badge variant="outline" className="text-green-600 mb-2">Radio</Badge>
              <div className="text-xs">Online</div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg">
              <Badge variant="outline" className="text-blue-600 mb-2">Digital</Badge>
              <div className="text-xs">Standby</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-xl font-semibold">Recent Alerts</h2>
        {alerts?.map((alert: any) => (
          <Card key={alert.id} className="border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {alert.alertType === 'evacuation' ? (
                      <Volume2 className="h-5 w-5 text-red-600 flex-shrink-0" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-amber-600 flex-shrink-0" />
                    )}
                    <span className="truncate">{alert.alertType?.toUpperCase()} ALERT</span>
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {alert.message}
                  </CardDescription>
                </div>
                <Badge 
                  variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
                  className="flex-shrink-0"
                >
                  {alert.severity?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-sm gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{new Date(alert.sentAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate">Delivered to {alert.targetAudience}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No alerts sent recently
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}