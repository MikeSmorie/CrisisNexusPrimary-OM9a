import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, MapPin, Clock, Users, Radio, Shield, Plus, Eye, Edit, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DisasterIncident {
  id: number;
  incidentCode: string;
  type: string;
  severity: string;
  status: string;
  location: string;
  coordinates?: string;
  description: string;
  reportedBy: number;
  assignedCommander?: number;
  createdAt: string;
  updatedAt: string;
  estimatedResolution?: string;
  actualResolution?: string;
  resourcesNeeded?: string;
  casualtiesCount: number;
  evacuationsCount: number;
}

const createIncidentSchema = z.object({
  incidentCode: z.string().min(1, "Incident code is required"),
  type: z.string().min(1, "Incident type is required"),
  severity: z.string().min(1, "Severity level is required"),
  location: z.string().min(1, "Location is required"),
  coordinates: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  resourcesNeeded: z.string().optional(),
  casualtiesCount: z.number().min(0).default(0),
  evacuationsCount: z.number().min(0).default(0)
});

type CreateIncidentForm = z.infer<typeof createIncidentSchema>;

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
    case 'investigating': return 'bg-blue-500 text-white';
    default: return 'bg-gray-500 text-white';
  }
}

function getTypeIcon(type: string) {
  switch (type.toLowerCase()) {
    case 'fire': return '🔥';
    case 'flood': return '🌊';
    case 'earthquake': return '🏗️';
    case 'medical': return '🚑';
    case 'hazmat': return '☢️';
    case 'tornado': return '🌪️';
    case 'hurricane': return '🌀';
    default: return '⚠️';
  }
}

export default function IncidentManagement() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<DisasterIncident | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: incidents, isLoading } = useQuery({
    queryKey: ['/api/disaster/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json() as DisasterIncident[];
    }
  });

  const createIncidentMutation = useMutation({
    mutationFn: async (data: CreateIncidentForm) => {
      const response = await fetch('/api/disaster/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, reportedBy: 1 }) // TODO: Get actual user ID
      });
      if (!response.ok) throw new Error('Failed to create incident');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
      setCreateDialogOpen(false);
      toast({
        title: "Incident Created",
        description: "Emergency incident has been logged and response teams notified."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create incident. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/disaster/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, userId: 1 }) // TODO: Get actual user ID
      });
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/incidents'] });
      toast({
        title: "Status Updated",
        description: "Incident status has been updated."
      });
    }
  });

  const form = useForm<CreateIncidentForm>({
    resolver: zodResolver(createIncidentSchema),
    defaultValues: {
      incidentCode: '',
      type: '',
      severity: '',
      location: '',
      coordinates: '',
      description: '',
      resourcesNeeded: '',
      casualtiesCount: 0,
      evacuationsCount: 0
    }
  });

  const onSubmit = (data: CreateIncidentForm) => {
    createIncidentMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Incident Management System...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between border-b border-red-200 pb-4">
        <div className="flex items-center space-x-3">
          <AlertTriangle className="h-8 w-8 text-red-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Incident Management</h1>
            <p className="text-lg text-gray-600">Emergency Incident Command and Control</p>
          </div>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Report New Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report New Emergency Incident</DialogTitle>
              <DialogDescription>
                Fill out the incident details. All fields marked with * are required for immediate response dispatch.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidentCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Code *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., FIRE-2025-003" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Incident Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select incident type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fire">🔥 Fire</SelectItem>
                            <SelectItem value="flood">🌊 Flood</SelectItem>
                            <SelectItem value="earthquake">🏗️ Earthquake</SelectItem>
                            <SelectItem value="medical">🚑 Medical Emergency</SelectItem>
                            <SelectItem value="hazmat">☢️ Hazmat</SelectItem>
                            <SelectItem value="tornado">🌪️ Tornado</SelectItem>
                            <SelectItem value="hurricane">🌀 Hurricane</SelectItem>
                            <SelectItem value="terrorism">🚨 Security Threat</SelectItem>
                            <SelectItem value="accident">🚗 Accident</SelectItem>
                            <SelectItem value="search_rescue">🔍 Search & Rescue</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                            <SelectItem value="minor">Minor - Limited impact</SelectItem>
                            <SelectItem value="major">Major - Significant impact</SelectItem>
                            <SelectItem value="critical">Critical - Life threatening</SelectItem>
                            <SelectItem value="catastrophic">Catastrophic - Mass casualty</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location *</FormLabel>
                        <FormControl>
                          <Input placeholder="Address or landmark" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coordinates"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPS Coordinates (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="40.7128, -74.0060" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Description *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Detailed description of the emergency situation..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="resourcesNeeded"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resources Needed (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Specific equipment, personnel, or support needed..."
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
                    name="casualtiesCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Casualties Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="evacuationsCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Evacuations Count</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="0"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                    disabled={createIncidentMutation.isPending}
                  >
                    {createIncidentMutation.isPending ? 'Creating...' : 'Create Incident'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Incidents List */}
      <div className="space-y-4">
        {incidents?.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Incidents</h3>
                <p className="text-gray-600">All systems operational - no emergency incidents reported</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          incidents?.map((incident) => (
            <Card key={incident.id} className="border-l-4 border-l-red-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <span className="text-2xl">{getTypeIcon(incident.type)}</span>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="outline" className="font-mono text-sm">
                            {incident.incidentCode}
                          </Badge>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.toUpperCase()}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {incident.type.replace(/_/g, ' ').toUpperCase()} Emergency
                        </h3>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-gray-700">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Location:</span>
                          <span>{incident.location}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-700">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Reported:</span>
                          <span>{new Date(incident.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {incident.casualtiesCount > 0 && (
                          <div className="flex items-center space-x-2 text-red-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Casualties: {incident.casualtiesCount}</span>
                          </div>
                        )}
                        {incident.evacuationsCount > 0 && (
                          <div className="flex items-center space-x-2 text-orange-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Evacuated: {incident.evacuationsCount}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-700 mb-4">{incident.description}</p>

                    {incident.resourcesNeeded && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <h4 className="font-medium text-blue-900 mb-1">Resources Needed:</h4>
                        <p className="text-blue-800 text-sm">{incident.resourcesNeeded}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    {incident.status === 'active' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ id: incident.id, status: 'contained' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Contain
                      </Button>
                    )}
                    {incident.status === 'contained' && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => updateStatusMutation.mutate({ id: incident.id, status: 'resolved' })}
                        disabled={updateStatusMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}