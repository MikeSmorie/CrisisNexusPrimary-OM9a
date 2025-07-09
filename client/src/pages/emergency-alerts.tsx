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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="h-6 w-6 text-amber-600" />
          <h1 className="text-3xl font-bold tracking-tight">Emergency Alert System</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm">
            <Volume2 className="h-4 w-4 mr-2" />
            Send Emergency Alert
          </Button>
        </div>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="text-amber-800 dark:text-amber-200">
            Multi-Channel Alert Dispatch
          </CardTitle>
          <CardDescription>
            Broadcast emergency alerts across all communication channels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">Satellite</Badge>
              <div className="text-sm mt-1">Ready</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">SMS/GSM</Badge>
              <div className="text-sm mt-1">Active</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">Radio</Badge>
              <div className="text-sm mt-1">Online</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-blue-600">Digital</Badge>
              <div className="text-sm mt-1">Standby</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        <h2 className="text-xl font-semibold">Recent Alerts</h2>
        {alerts?.map((alert: any) => (
          <Card key={alert.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {alert.alertType === 'evacuation' ? (
                      <Volume2 className="h-5 w-5 text-red-600" />
                    ) : (
                      <MessageSquare className="h-5 w-5 text-amber-600" />
                    )}
                    {alert.alertType?.toUpperCase()} ALERT
                  </CardTitle>
                  <CardDescription>{alert.message}</CardDescription>
                </div>
                <Badge 
                  variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
                >
                  {alert.severity?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(alert.sentAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Delivered to {alert.targetAudience}</span>
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