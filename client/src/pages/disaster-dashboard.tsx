import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Users, MapPin, Radio, Clock, Shield } from "lucide-react";

interface DisasterIncident {
  id: number;
  incidentCode: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  description: string;
  createdAt: string;
  casualtiesCount: number;
  evacuationsCount: number;
}

interface DisasterAlert {
  id: number;
  alertType: string;
  severity: string;
  title: string;
  message: string;
  targetZones: string;
  activeUntil: string;
  createdAt: string;
}

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'catastrophic': return 'bg-red-600 text-white';
    case 'critical': return 'bg-red-500 text-white';
    case 'major': return 'bg-orange-500 text-white';
    case 'minor': return 'bg-yellow-500 text-black';
    default: return 'bg-gray-500 text-white';
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active': return 'bg-red-500 text-white';
    case 'contained': return 'bg-orange-500 text-white';
    case 'resolved': return 'bg-green-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export default function DisasterDashboard() {
  const { data: incidents, isLoading: incidentsLoading } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json() as DisasterIncident[];
    }
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['/api/disaster/alerts'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/alerts');
      if (!response.ok) throw new Error('Failed to fetch alerts');
      return response.json() as DisasterAlert[];
    }
  });

  const { data: resources, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/disaster/resources'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    }
  });

  const activeIncidents = incidents?.filter(i => i.status === 'active') || [];
  const criticalAlerts = alerts?.filter(a => a.severity === 'emergency' || a.severity === 'warning') || [];
  const availableResources = resources?.filter((r: any) => r.status === 'available') || [];

  if (incidentsLoading || alertsLoading || resourcesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Emergency Operations Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-red-200 pb-4">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Emergency Operations Center</h1>
            <p className="text-lg text-gray-600">DisasterMng-1-OM9 | Real-time Emergency Response</p>
          </div>
        </div>
      </div>

      {/* Critical Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{activeIncidents.length}</div>
            <p className="text-xs text-muted-foreground">
              Requiring immediate response
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <Radio className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Active emergency warnings
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Resources</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{availableResources.length}</div>
            <p className="text-xs text-muted-foreground">
              Ready for deployment
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Evacuations</CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {incidents?.reduce((sum, i) => sum + (i.evacuationsCount || 0), 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              People safely evacuated
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Incidents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>Active Emergency Incidents</span>
          </CardTitle>
          <CardDescription>Real-time incident monitoring and response coordination</CardDescription>
        </CardHeader>
        <CardContent>
          {activeIncidents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <p className="text-lg font-medium">No Active Emergencies</p>
              <p className="text-sm">All clear - monitoring continues</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <div key={incident.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="font-mono">
                          {incident.incidentCode}
                        </Badge>
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.toUpperCase()}
                        </Badge>
                      </div>
                      <h3 className="font-semibold text-lg text-gray-900 mb-1">
                        {incident.type.replace(/_/g, ' ').toUpperCase()} - {incident.location}
                      </h3>
                      <p className="text-gray-700 mb-2">{incident.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(incident.createdAt).toLocaleString()}</span>
                        </span>
                        {incident.casualtiesCount > 0 && (
                          <span className="text-red-600 font-medium">
                            Casualties: {incident.casualtiesCount}
                          </span>
                        )}
                        {incident.evacuationsCount > 0 && (
                          <span className="text-orange-600 font-medium">
                            Evacuated: {incident.evacuationsCount}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col space-y-2">
                      <Button size="sm" variant="destructive">
                        Manage Incident
                      </Button>
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Radio className="h-5 w-5" />
              <span>Critical Emergency Alerts</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalAlerts.map((alert) => (
                <div key={alert.id} className="border border-orange-300 rounded-lg p-3 bg-white">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge className="bg-orange-600 text-white">
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {alert.alertType.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-orange-900">{alert.title}</h4>
                      <p className="text-orange-800 text-sm mt-1">{alert.message}</p>
                      {alert.targetZones && (
                        <p className="text-orange-700 text-xs mt-1">
                          Zones: {alert.targetZones}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}