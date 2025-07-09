import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, Grid3X3, List, Users, Zap, Radio, Satellite, RefreshCw, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Incident {
  id: number;
  incidentCode: string;
  incidentType: string;
  status: string;
  severity: string;
  title: string;
  description: string;
  location: string;
  createdAt: string;
  assignedResponders?: number;
  recommendedResponders?: number;
}

interface Resource {
  id: number;
  resourceType: string;
  name: string;
  status: string;
  location: string;
  capabilities: string[];
}

export default function CommanderDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'map' | 'grid' | 'list'>('grid');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<number | null>(null);

  // Fetch incidents
  const { data: incidents = [], refetch: refetchIncidents } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    },
    refetchInterval: 15000
  });

  // Fetch resources
  const { data: resources = [] } = useQuery({
    queryKey: ['/api/disaster/resources'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['/api/disaster/stats'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Approve AI recommendation mutation
  const approveAIRecommendation = useMutation({
    mutationFn: async ({ incidentId, action }: { incidentId: number; action: string }) => {
      const response = await fetch(`/api/disaster/incidents/${incidentId}/approve-ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      if (!response.ok) throw new Error('Failed to approve AI recommendation');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Recommendation Approved",
        description: "Resource deployment has been authorized",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
    }
  });

  // Assign responder mutation
  const assignResponder = useMutation({
    mutationFn: async ({ incidentId, resourceId }: { incidentId: number; resourceId: number }) => {
      const response = await fetch(`/api/disaster/incidents/${incidentId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceId })
      });
      if (!response.ok) throw new Error('Failed to assign responder');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Responder Assigned",
        description: "Resource has been deployed to incident",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/resources'] });
    }
  });

  // Activate fallback channel mutation
  const activateFallback = useMutation({
    mutationFn: async (channel: string) => {
      const response = await fetch('/api/disaster/communications/fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel })
      });
      if (!response.ok) throw new Error('Failed to activate fallback channel');
      return response.json();
    },
    onSuccess: (data, channel) => {
      toast({
        title: "Fallback Channel Activated",
        description: `${channel} communication channel is now active`,
      });
    }
  });

  const filteredIncidents = incidents.filter((incident: Incident) => {
    if (severityFilter === 'all') return true;
    return incident.severity === severityFilter;
  });

  const activeIncidents = filteredIncidents.filter((incident: Incident) => 
    incident.status === 'active' || incident.status === 'investigating'
  );

  const availableResources = resources.filter((resource: Resource) => 
    resource.status === 'available'
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'catastrophic':
      case 'critical': return 'bg-red-600 text-white';
      case 'major': return 'bg-orange-500 text-white';
      case 'minor': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🔴';
      case 'contained': return '🟡';
      case 'resolved': return '🟢';
      case 'investigating': return '🔵';
      default: return '⚫';
    }
  };

  const renderIncidentCard = (incident: Incident) => (
    <Card key={incident.id} className="shadow-lg border-l-4 border-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            <span>{getStatusIcon(incident.status)}</span>
            <span>{incident.incidentCode}</span>
          </CardTitle>
          <Badge className={getSeverityColor(incident.severity)}>
            {incident.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium">{incident.title}</p>
          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
          <div className="flex items-center space-x-2 mt-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">{incident.location}</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Resource Deployment:</span>
            <span className="text-sm text-gray-600">
              {incident.assignedResponders || 0}/{incident.recommendedResponders || 5}
            </span>
          </div>
          
          {/* AI Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">AI Suggests:</span>
            </div>
            <p className="text-sm text-blue-600">Deploy +2 additional units (Confidence: 87%)</p>
            <div className="flex space-x-2 mt-2">
              <Button 
                size="sm" 
                onClick={() => approveAIRecommendation.mutate({ 
                  incidentId: incident.id, 
                  action: 'deploy_additional' 
                })}
                className="bg-green-600 hover:bg-green-700"
              >
                APPROVE
              </Button>
              <Button size="sm" variant="outline">
                MODIFY
              </Button>
            </div>
          </div>

          {/* Available Resources */}
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Available Resources:</p>
            <div className="flex flex-wrap gap-1">
              {availableResources.slice(0, 4).map((resource: Resource) => (
                <Button
                  key={resource.id}
                  size="sm"
                  variant="outline"
                  onClick={() => assignResponder.mutate({ 
                    incidentId: incident.id, 
                    resourceId: resource.id 
                  })}
                  className="text-xs h-7"
                >
                  {resource.resourceType === 'vehicle' ? '🚒' : 
                   resource.resourceType === 'personnel' ? '👨‍🚒' : '🚑'} 
                  {resource.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
              <p className="text-gray-600">Incident Command & Resource Coordination</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchIncidents()}
              className="flex items-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              System Operational
            </Badge>
          </div>
        </div>
      </div>

      {/* Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats?.activeIncidents || 0}</div>
            <div className="text-sm text-gray-600">Active Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{availableResources.length}</div>
            <div className="text-sm text-gray-600">Available Resources</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {activeIncidents.filter(i => i.severity === 'critical' || i.severity === 'major').length}
            </div>
            <div className="text-sm text-gray-600">Critical Incidents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {incidents.filter(i => i.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved Today</div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle and Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)}>
          <TabsList>
            <TabsTrigger value="map" className="flex items-center space-x-2">
              <MapPin className="h-4 w-4" />
              <span>MAP</span>
            </TabsTrigger>
            <TabsTrigger value="grid" className="flex items-center space-x-2">
              <Grid3X3 className="h-4 w-4" />
              <span>GRID</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center space-x-2">
              <List className="h-4 w-4" />
              <span>LIST</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="major">Major</SelectItem>
                <SelectItem value="minor">Minor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Incidents View */}
        <div className="lg:col-span-2">
          {viewMode === 'map' && (
            <Card className="h-96">
              <CardHeader>
                <CardTitle>Live Incidents Map</CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <div className="bg-gray-100 rounded-lg h-full flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-2" />
                    <p>Interactive map will be implemented with real-time incident locations</p>
                    <div className="mt-4 text-sm">
                      <span className="inline-block w-3 h-3 bg-red-500 rounded-full mr-2"></span>Critical
                      <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2 ml-4"></span>Major
                      <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2 ml-4"></span>Minor
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {viewMode === 'grid' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Incidents ({activeIncidents.length})
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {activeIncidents.map(renderIncidentCard)}
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <Card>
              <CardHeader>
                <CardTitle>Incident List View</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activeIncidents.map((incident: Incident) => (
                    <div key={incident.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <span>{getStatusIcon(incident.status)}</span>
                        <div>
                          <p className="font-medium">{incident.incidentCode}</p>
                          <p className="text-sm text-gray-600">{incident.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getSeverityColor(incident.severity)}>
                          {incident.severity}
                        </Badge>
                        <Button size="sm" variant="outline">Manage</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Resource Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Resource Deployment</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-gray-600 mb-2">Available Units:</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">🚒 Fire Units</span>
                  <Badge variant="outline">3 Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">🚑 Medical Units</span>
                  <Badge variant="outline">2 Available</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">👮 Police Units</span>
                  <Badge variant="outline">4 Available</Badge>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                Drag resources to incident cards to assign responders
              </p>
            </CardContent>
          </Card>

          {/* Fallback Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Radio className="h-5 w-5" />
                <span>Emergency Channels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Satellite className="h-4 w-4 text-gray-600" />
                    <span className="text-sm">Satellite</span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => activateFallback.mutate('satellite')}
                  >
                    ACTIVATE
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Radio className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Radio Net</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ACTIVE
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-blue-600 rounded" />
                    <span className="text-sm">Cellular</span>
                  </div>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    ACTIVE
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}