import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Users, Truck, Package, Wrench, MapPin, Plus, Eye, Settings, CheckCircle, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DisasterResource {
  id: number;
  resourceType: string;
  name: string;
  identifier: string;
  status: string;
  location: string;
  capabilities?: string;
  assignedTo?: number;
  lastUpdated: string;
  currentMission?: string;
}

function getResourceIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'personnel': return <Users className="h-5 w-5" />;
    case 'vehicle': return <Truck className="h-5 w-5" />;
    case 'equipment': return <Wrench className="h-5 w-5" />;
    case 'supplies': return <Package className="h-5 w-5" />;
    case 'medical': return '🚑';
    default: return <Package className="h-5 w-5" />;
  }
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'available': return 'bg-green-500 text-white';
    case 'deployed': return 'bg-blue-500 text-white';
    case 'maintenance': return 'bg-yellow-500 text-black';
    case 'out_of_service': return 'bg-red-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

export default function ResourceDeployment() {
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<DisasterResource | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: resources, isLoading } = useQuery({
    queryKey: ['/api/disaster/resources'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/resources');
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json() as DisasterResource[];
    }
  });

  const { data: incidents } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    }
  });

  const deployResourceMutation = useMutation({
    mutationFn: async ({ resourceId, incidentId, location }: { resourceId: number; incidentId?: number; location: string }) => {
      const response = await fetch(`/api/disaster/resources/${resourceId}/deploy`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          incidentId, 
          location,
          status: 'deployed',
          userId: 1 // TODO: Get actual user ID
        })
      });
      if (!response.ok) throw new Error('Failed to deploy resource');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/resources'] });
      setDeployDialogOpen(false);
      setSelectedResource(null);
      toast({
        title: "Resource Deployed",
        description: "Resource has been successfully deployed to the field."
      });
    }
  });

  const recallResourceMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      const response = await fetch(`/api/disaster/resources/${resourceId}/recall`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'available',
          location: 'Central Station',
          userId: 1 // TODO: Get actual user ID
        })
      });
      if (!response.ok) throw new Error('Failed to recall resource');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/resources'] });
      toast({
        title: "Resource Recalled",
        description: "Resource has been recalled and is now available for deployment."
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Resource Management System...</p>
        </div>
      </div>
    );
  }

  const availableResources = resources?.filter(r => r.status === 'available') || [];
  const deployedResources = resources?.filter(r => r.status === 'deployed') || [];
  const maintenanceResources = resources?.filter(r => r.status === 'maintenance') || [];
  const outOfServiceResources = resources?.filter(r => r.status === 'out_of_service') || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-red-200 pb-4">
        <div className="flex items-center space-x-3">
          <Users className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Resource Deployment</h1>
            <p className="text-lg text-gray-600">Emergency Resource Management and Coordination</p>
          </div>
        </div>
        
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      {/* Resource Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold text-green-600">{availableResources.length}</p>
                <p className="text-sm text-gray-600">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{deployedResources.length}</p>
                <p className="text-sm text-gray-600">Deployed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{maintenanceResources.length}</p>
                <p className="text-sm text-gray-600">Maintenance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div>
                <p className="text-2xl font-bold text-red-600">{outOfServiceResources.length}</p>
                <p className="text-sm text-gray-600">Out of Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployed Resources */}
      {deployedResources.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-blue-700 flex items-center space-x-2">
            <Truck className="h-5 w-5" />
            <span>DEPLOYED RESOURCES</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {deployedResources.map((resource) => (
              <Card key={resource.id} className="border-blue-300 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(resource.resourceType)}
                      <div>
                        <h3 className="font-semibold text-blue-900">{resource.name}</h3>
                        <p className="text-sm text-blue-700 font-mono">{resource.identifier}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-blue-800">
                      <MapPin className="h-4 w-4" />
                      <span>{resource.location}</span>
                    </div>
                    {resource.capabilities && (
                      <p className="text-blue-700 text-xs bg-white p-2 rounded">
                        {resource.capabilities}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      Track
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-green-600 hover:bg-green-700 flex-1"
                      onClick={() => recallResourceMutation.mutate(resource.id)}
                      disabled={recallResourceMutation.isPending}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Recall
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Available Resources */}
      {availableResources.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-green-700 flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>AVAILABLE RESOURCES</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableResources.map((resource) => (
              <Card key={resource.id} className="border-green-300 bg-green-50">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      {getResourceIcon(resource.resourceType)}
                      <div>
                        <h3 className="font-semibold text-green-900">{resource.name}</h3>
                        <p className="text-sm text-green-700 font-mono">{resource.identifier}</p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(resource.status)}>
                      {resource.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2 text-green-800">
                      <MapPin className="h-4 w-4" />
                      <span>{resource.location}</span>
                    </div>
                    {resource.capabilities && (
                      <p className="text-green-700 text-xs bg-white p-2 rounded">
                        {resource.capabilities}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="h-4 w-4 mr-1" />
                      Configure
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700 flex-1"
                      onClick={() => {
                        setSelectedResource(resource);
                        setDeployDialogOpen(true);
                      }}
                    >
                      <ArrowRight className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Other Resources */}
      {(maintenanceResources.length > 0 || outOfServiceResources.length > 0) && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-700">Maintenance & Service</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {maintenanceResources.length > 0 && (
              <div>
                <h3 className="font-medium text-yellow-700 mb-2">Maintenance Required</h3>
                <div className="space-y-2">
                  {maintenanceResources.map((resource) => (
                    <Card key={resource.id} className="border-yellow-300 bg-yellow-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(resource.resourceType)}
                            <div>
                              <p className="font-medium text-yellow-900">{resource.name}</p>
                              <p className="text-sm text-yellow-700">{resource.identifier}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(resource.status)}>
                            MAINTENANCE
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {outOfServiceResources.length > 0 && (
              <div>
                <h3 className="font-medium text-red-700 mb-2">Out of Service</h3>
                <div className="space-y-2">
                  {outOfServiceResources.map((resource) => (
                    <Card key={resource.id} className="border-red-300 bg-red-50">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getResourceIcon(resource.resourceType)}
                            <div>
                              <p className="font-medium text-red-900">{resource.name}</p>
                              <p className="text-sm text-red-700">{resource.identifier}</p>
                            </div>
                          </div>
                          <Badge className={getStatusColor(resource.status)}>
                            OUT OF SERVICE
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Deploy Resource Dialog */}
      <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deploy Resource</DialogTitle>
            <DialogDescription>
              Deploy {selectedResource?.name} to an incident or location.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Deploy to Incident (Optional)</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select an active incident" />
                </SelectTrigger>
                <SelectContent>
                  {incidents?.filter((i: any) => i.status === 'active').map((incident: any) => (
                    <SelectItem key={incident.id} value={incident.id.toString()}>
                      {incident.incidentCode} - {incident.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Deployment Location *</label>
              <Input placeholder="Enter deployment location" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Mission Notes</label>
              <Textarea placeholder="Optional mission description or special instructions" />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeployDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                if (selectedResource) {
                  deployResourceMutation.mutate({
                    resourceId: selectedResource.id,
                    location: "Field Deployment" // TODO: Get from form
                  });
                }
              }}
              disabled={deployResourceMutation.isPending}
            >
              {deployResourceMutation.isPending ? 'Deploying...' : 'Deploy Resource'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}