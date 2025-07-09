import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, MapPin, Clock, Users } from "lucide-react";

export default function IncidentManagement() {
  const { data: incidents } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 15000
  });

  return (
    <div className="space-y-6 max-w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0 flex-1">
          <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
          <h1 className="text-3xl font-bold tracking-tight truncate">Incident Management</h1>
        </div>
        <Badge variant="destructive" className="animate-pulse flex-shrink-0 ml-4">
          {incidents?.filter(i => i.status === 'active').length || 0} Active
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {incidents?.map((incident: any) => (
          <Card key={incident.id} className="border-red-200 dark:border-red-800">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-red-800 dark:text-red-200 truncate">
                    {incident.incidentCode}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-sm">
                    {incident.description}
                  </CardDescription>
                </div>
                <Badge 
                  variant={incident.severity === 'critical' ? 'destructive' : 'outline'}
                  className="flex-shrink-0"
                >
                  {incident.severity?.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="truncate">{incident.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="truncate">{new Date(incident.reportedAt).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="truncate">{incident.assignedPersonnel || 0} Personnel</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )) || (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              No incidents currently active
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}