import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Rocket, 
  MapPin, 
  Layers, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Target,
  Users,
  BarChart3,
  Download,
  Play,
  Pause,
  Settings,
  Shield
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Zone {
  id: string;
  name: string;
  regions: string[];
  complexity: 'low' | 'medium' | 'high';
  phase: number;
  status: 'planned' | 'ready' | 'deploying' | 'deployed' | 'failed';
  readiness: number;
}

interface Module {
  id: string;
  name: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  readiness: number;
  dependencies: string[];
  zones: string[];
}

interface DeploymentPlan {
  id: string;
  zone: string;
  modules: string[];
  status: 'draft' | 'approved' | 'executing' | 'completed' | 'failed';
  progress: number;
  startTime?: string;
  estimatedCompletion?: string;
  currentStep?: string;
}

export default function DeploymentControl() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedZone, setSelectedZone] = useState<string>('alpha');
  const [selectedPlan, setSelectedPlan] = useState<DeploymentPlan | null>(null);

  // Mock data - in real implementation, this would come from APIs
  const zones: Zone[] = [
    {
      id: 'alpha',
      name: 'Coastal Flood Risk',
      regions: ['Western Cape', 'KwaZulu-Natal coastal'],
      complexity: 'medium',
      phase: 1,
      status: 'ready',
      readiness: 95
    },
    {
      id: 'bravo',
      name: 'High Unrest Risk',
      regions: ['Gauteng corridors', 'Metropolitan areas'],
      complexity: 'high',
      phase: 2,
      status: 'planned',
      readiness: 82
    },
    {
      id: 'charlie',
      name: 'Rural Under-Service',
      regions: ['Eastern Cape interior', 'Northern Cape remote'],
      complexity: 'low',
      phase: 3,
      status: 'planned',
      readiness: 75
    },
    {
      id: 'delta',
      name: 'Border Conflict',
      regions: ['Limpopo', 'Mpumalanga borders'],
      complexity: 'high',
      phase: 4,
      status: 'planned',
      readiness: 68
    }
  ];

  const modules: Module[] = [
    {
      id: 'detection',
      name: 'Incident Detection & Reporting',
      priority: 'critical',
      readiness: 100,
      dependencies: [],
      zones: ['alpha', 'bravo', 'charlie', 'delta']
    },
    {
      id: 'classification',
      name: 'AI-Driven Threat Classification',
      priority: 'high',
      readiness: 95,
      dependencies: ['detection'],
      zones: ['alpha', 'bravo', 'charlie', 'delta']
    },
    {
      id: 'command',
      name: 'Command Center Dashboard',
      priority: 'high',
      readiness: 90,
      dependencies: ['detection', 'classification'],
      zones: ['alpha', 'bravo', 'charlie', 'delta']
    },
    {
      id: 'dispatch',
      name: 'Alert Dispatch System',
      priority: 'medium',
      readiness: 85,
      dependencies: ['command'],
      zones: ['bravo', 'charlie', 'delta']
    },
    {
      id: 'logger',
      name: 'Communication Logger',
      priority: 'medium',
      readiness: 80,
      dependencies: ['command'],
      zones: ['charlie', 'delta']
    },
    {
      id: 'audit',
      name: 'Audit & Forensic Recorder',
      priority: 'low',
      readiness: 70,
      dependencies: ['logger'],
      zones: ['delta']
    }
  ];

  const [deploymentPlans, setDeploymentPlans] = useState<DeploymentPlan[]>([
    {
      id: 'plan-alpha-001',
      zone: 'alpha',
      modules: ['detection', 'classification', 'command'],
      status: 'approved',
      progress: 0,
      currentStep: 'Ready for deployment'
    }
  ]);

  // Deployment mutations
  const createDeploymentPlan = useMutation({
    mutationFn: async (planData: any) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { id: `plan-${planData.zone}-${Date.now()}`, ...planData };
    },
    onSuccess: (newPlan) => {
      setDeploymentPlans(prev => [...prev, newPlan]);
      toast({
        title: "Deployment Plan Created",
        description: `Plan for Zone ${newPlan.zone.toUpperCase()} created successfully`,
      });
    }
  });

  const executeDeployment = useMutation({
    mutationFn: async (planId: string) => {
      // Simulate deployment execution
      const plan = deploymentPlans.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Update plan status
      setDeploymentPlans(prev => prev.map(p => 
        p.id === planId 
          ? { ...p, status: 'executing', startTime: new Date().toISOString(), progress: 0 }
          : p
      ));

      // Simulate progress updates
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 500));
        setDeploymentPlans(prev => prev.map(p => 
          p.id === planId 
            ? { ...p, progress: i, currentStep: `Step ${Math.floor(i/20) + 1}: ${getStepName(i)}` }
            : p
        ));
      }

      // Complete deployment
      setDeploymentPlans(prev => prev.map(p => 
        p.id === planId 
          ? { ...p, status: 'completed', progress: 100, currentStep: 'Deployment completed' }
          : p
      ));

      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Deployment Completed",
        description: "Zone deployment executed successfully",
      });
    }
  });

  const getStepName = (progress: number) => {
    if (progress < 20) return 'Infrastructure preparation';
    if (progress < 40) return 'Database migration';
    if (progress < 60) return 'Module deployment';
    if (progress < 80) return 'Integration testing';
    return 'System activation';
  };

  const getZoneStatus = (zone: Zone) => {
    switch (zone.status) {
      case 'ready': return { color: 'bg-green-500', label: 'Ready', icon: CheckCircle };
      case 'planned': return { color: 'bg-blue-500', label: 'Planned', icon: Clock };
      case 'deploying': return { color: 'bg-yellow-500', label: 'Deploying', icon: Rocket };
      case 'deployed': return { color: 'bg-purple-500', label: 'Deployed', icon: Shield };
      case 'failed': return { color: 'bg-red-500', label: 'Failed', icon: AlertTriangle };
      default: return { color: 'bg-gray-500', label: 'Unknown', icon: AlertTriangle };
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-400 text-white';
    }
  };

  const handleCreatePlan = () => {
    const zone = zones.find(z => z.id === selectedZone);
    if (!zone) return;

    const zoneModules = modules.filter(m => m.zones.includes(selectedZone));
    
    createDeploymentPlan.mutate({
      zone: selectedZone,
      modules: zoneModules.map(m => m.id),
      status: 'draft',
      progress: 0
    });
  };

  const selectedZoneData = zones.find(z => z.id === selectedZone);
  const selectedZoneModules = modules.filter(m => m.zones.includes(selectedZone));
  const activePlans = deploymentPlans.filter(p => p.status === 'executing');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Deployment Control Center</h1>
              <p className="text-gray-600">Zone-based Emergency System Rollout Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              System Operational
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export Plans
            </Button>
          </div>
        </div>
      </div>

      {/* Zone Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {zones.map((zone) => {
          const status = getZoneStatus(zone);
          const StatusIcon = status.icon;
          
          return (
            <Card key={zone.id} className="shadow-md cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedZone(zone.id)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className={cn("w-3 h-3 rounded-full", status.color)} />
                    <span className="font-medium">Zone {zone.id.toUpperCase()}</span>
                  </div>
                  <StatusIcon className="h-4 w-4 text-gray-500" />
                </div>
                
                <h3 className="font-semibold text-sm mb-2">{zone.name}</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span>Readiness</span>
                    <span>{zone.readiness}%</span>
                  </div>
                  <Progress value={zone.readiness} className="h-2" />
                  
                  <div className="flex items-center justify-between">
                    <Badge className={getComplexityColor(zone.complexity)}>
                      {zone.complexity}
                    </Badge>
                    <span className="text-xs text-gray-500">Phase {zone.phase}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="planning" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="planning">Deployment Planning</TabsTrigger>
          <TabsTrigger value="execution">Active Deployments</TabsTrigger>
          <TabsTrigger value="monitoring">System Monitoring</TabsTrigger>
          <TabsTrigger value="analytics">Analytics & Reports</TabsTrigger>
        </TabsList>

        {/* Deployment Planning Tab */}
        <TabsContent value="planning" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Zone Selection and Planning */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Zone Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="flex-1">
                      <label className="text-sm font-medium">Target Zone</label>
                      <Select value={selectedZone} onValueChange={setSelectedZone}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {zones.map(zone => (
                            <SelectItem key={zone.id} value={zone.id}>
                              Zone {zone.id.toUpperCase()} - {zone.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      onClick={handleCreatePlan}
                      disabled={createDeploymentPlan.isPending}
                      className="mt-6"
                    >
                      <Target className="h-4 w-4 mr-2" />
                      Create Plan
                    </Button>
                  </div>

                  {selectedZoneData && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Regions</p>
                          <p className="text-sm">{selectedZoneData.regions.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Complexity</p>
                          <Badge className={getComplexityColor(selectedZoneData.complexity)}>
                            {selectedZoneData.complexity}
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Deployment Readiness</p>
                        <Progress value={selectedZoneData.readiness} className="h-3" />
                        <p className="text-xs text-gray-500 mt-1">{selectedZoneData.readiness}% ready for deployment</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Module Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Layers className="h-5 w-5" />
                    <span>Module Configuration</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedZoneModules.map(module => (
                      <div key={module.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Badge className={getPriorityColor(module.priority)}>
                              {module.priority}
                            </Badge>
                            <span className="font-medium">{module.name}</span>
                          </div>
                          {module.dependencies.length > 0 && (
                            <p className="text-xs text-gray-500">
                              Dependencies: {module.dependencies.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{module.readiness}%</p>
                          <div className="w-16">
                            <Progress value={module.readiness} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Deployment Plans Sidebar */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Deployment Plans</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deploymentPlans.map(plan => (
                    <div key={plan.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">Zone {plan.zone.toUpperCase()}</span>
                        <Badge variant={plan.status === 'approved' ? 'default' : 'outline'}>
                          {plan.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">
                        {plan.modules.length} modules | {plan.currentStep}
                      </p>
                      {plan.progress > 0 && (
                        <Progress value={plan.progress} className="h-2" />
                      )}
                      <div className="flex space-x-2 mt-2">
                        {plan.status === 'approved' && (
                          <Button 
                            size="sm" 
                            onClick={() => executeDeployment.mutate(plan.id)}
                            disabled={executeDeployment.isPending}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Deploy
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedPlan(plan)}
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Active Deployments Tab */}
        <TabsContent value="execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5" />
                <span>Active Deployments ({activePlans.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activePlans.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Rocket className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No active deployments</p>
                  <p className="text-sm">Create and execute deployment plans to see them here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activePlans.map(plan => (
                    <div key={plan.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-medium">Zone {plan.zone.toUpperCase()} Deployment</h3>
                          <p className="text-sm text-gray-600">{plan.currentStep}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{plan.progress}%</p>
                          <p className="text-xs text-gray-500">Complete</p>
                        </div>
                      </div>
                      <Progress value={plan.progress} className="h-3 mb-3" />
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Started: {plan.startTime ? new Date(plan.startTime).toLocaleTimeString() : 'N/A'}</span>
                        <span>Modules: {plan.modules.length}</span>
                        <Button size="sm" variant="outline">
                          <Pause className="h-3 w-3 mr-1" />
                          Pause
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">847</p>
                <p className="text-sm text-gray-600">Active Users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">99.7%</p>
                <p className="text-sm text-gray-600">System Uptime</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-gray-600">Active Incidents</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">1.2s</p>
                <p className="text-sm text-gray-600">Avg Response</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Zone Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {zones.filter(z => z.status === 'deployed' || z.status === 'deploying').map(zone => (
                  <div key={zone.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">Zone {zone.id.toUpperCase()}</p>
                      <p className="text-sm text-gray-600">{zone.name}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">99.2%</p>
                        <p className="text-xs text-gray-500">Uptime</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">156</p>
                        <p className="text-xs text-gray-500">Users</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-orange-600">8</p>
                        <p className="text-xs text-gray-500">Incidents</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics & Reports Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Deployment Success Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <p className="text-4xl font-bold text-green-600">94.7%</p>
                  <p className="text-gray-600">Overall Success Rate</p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Zone Alpha</span>
                    <span className="text-green-600">100%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zone Bravo</span>
                    <span className="text-green-600">98%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zone Charlie</span>
                    <span className="text-yellow-600">89%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zone Delta</span>
                    <span className="text-gray-500">Pending</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Phase 1 Complete</p>
                      <p className="text-xs text-gray-500">Zone Alpha deployed successfully</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                    <div>
                      <p className="text-sm font-medium">Phase 2 In Progress</p>
                      <p className="text-xs text-gray-500">Zone Bravo preparation ongoing</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Phase 3 Planned</p>
                      <p className="text-xs text-gray-500">Zone Charlie scheduled for Q2</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                    <div>
                      <p className="text-sm font-medium">Phase 4 Planned</p>
                      <p className="text-xs text-gray-500">Zone Delta scheduled for Q3</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Plan Details Dialog */}
      {selectedPlan && (
        <Dialog open={!!selectedPlan} onOpenChange={() => setSelectedPlan(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Deployment Plan: Zone {selectedPlan.zone.toUpperCase()}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <Badge>{selectedPlan.status}</Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Progress</p>
                  <p className="text-lg font-bold">{selectedPlan.progress}%</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-600 mb-2">Modules ({selectedPlan.modules.length})</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlan.modules.map(moduleId => {
                    const module = modules.find(m => m.id === moduleId);
                    return (
                      <div key={moduleId} className="border rounded p-2">
                        <p className="text-sm font-medium">{module?.name}</p>
                        <Badge size="sm" className={getPriorityColor(module?.priority || 'low')}>
                          {module?.priority}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>

              {selectedPlan.currentStep && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Step</p>
                  <p className="text-sm">{selectedPlan.currentStep}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}