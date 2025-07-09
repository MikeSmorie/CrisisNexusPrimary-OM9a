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
    <div className="content-inner">
      <div className="module-section">
        <div className="flex items-center justify-between mb-6">
          <div className="icon-text-safe flex-1">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
            <h1 className="text-3xl font-bold tracking-tight text-contained">Incident Management</h1>
          </div>
          <Badge variant="destructive" className="badge-contained animate-pulse ml-4">
            {incidents?.filter(i => i.status === 'active').length || 0} Active
          </Badge>
        </div>
      </div>

      <div className="grid-cards">
        {incidents?.map((incident: any) => (
          <div key={incident.id} className="incident-card border-red-200 dark:border-red-800">
            <div className="incident-content">
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 text-truncate-safe">
                    {incident.incidentCode}
                  </h3>
                  <p className="text-multiline-safe text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {incident.description}
                  </p>
                </div>
                <Badge 
                  variant={incident.severity === 'critical' ? 'destructive' : 'outline'}
                  className="badge-contained"
                >
                  {incident.severity?.toUpperCase()}
                </Badge>
              </div>
              
              <div className="incident-details">
                <div className="incident-detail-item">
                  <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <span className="incident-detail-text">{incident.location}</span>
                </div>
                <div className="incident-detail-item">
                  <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                  <span className="incident-detail-text">{new Date(incident.createdAt).toLocaleString()}</span>
                </div>
                <div className="incident-detail-item">
                  <Users className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="incident-detail-text">
                    {incident.resourcesNeeded ? 
                      JSON.parse(incident.resourcesNeeded).personnelCount || 0 : 0} Personnel Needed
                  </span>
                </div>
              </div>
            </div>
          </div>
        )) || (
          <div className="module-card">
            <div className="card-content-safe text-center text-gray-500">
              No incidents currently active
            </div>
          </div>
        )}
      </div>
    </div>
  );
}