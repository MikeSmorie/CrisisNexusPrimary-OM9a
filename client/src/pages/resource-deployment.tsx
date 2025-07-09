import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Users, Truck, MapPin, Activity } from "lucide-react";

export default function ResourceDeployment() {
  const { data: resources } = useQuery({
    queryKey: ['/api/disaster/resources'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/resources');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 20000
  });

  const availableResources = resources?.filter(r => r.status === 'available') || [];
  const deployedResources = resources?.filter(r => r.status === 'deployed') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-green-600" />
          <h1 className="text-3xl font-bold tracking-tight">Resource Deployment</h1>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="text-green-600">
            {availableResources.length} Available
          </Badge>
          <Badge variant="outline" className="text-blue-600">
            {deployedResources.length} Deployed
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Available Resources */}
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">
              Available Resources
            </CardTitle>
            <CardDescription>
              Ready for immediate deployment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableResources.map((resource: any) => (
                <div key={resource.id} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    {resource.resourceType === 'vehicle' ? (
                      <Truck className="h-5 w-5 text-green-600" />
                    ) : (
                      <Users className="h-5 w-5 text-green-600" />
                    )}
                    <div>
                      <div className="font-medium">{resource.name}</div>
                      <div className="text-sm text-gray-500">{resource.resourceType}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Deploy
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deployed Resources */}
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-blue-800 dark:text-blue-200">
              Deployed Resources
            </CardTitle>
            <CardDescription>
              Currently active in field operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deployedResources.map((resource: any) => (
                <div key={resource.id} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-3">
                    {resource.resourceType === 'vehicle' ? (
                      <Truck className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Users className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-medium">{resource.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {resource.location || 'Field Operation'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-blue-600" />
                    <Badge variant="outline" className="text-blue-600">Active</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Deployment Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Deployment Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{availableResources.length}</div>
              <div className="text-sm text-gray-500">Available</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{deployedResources.length}</div>
              <div className="text-sm text-gray-500">Deployed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {resources?.filter(r => r.resourceType === 'vehicle').length || 0}
              </div>
              <div className="text-sm text-gray-500">Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {resources?.filter(r => r.resourceType === 'personnel').length || 0}
              </div>
              <div className="text-sm text-gray-500">Personnel</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}