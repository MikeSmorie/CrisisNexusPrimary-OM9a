import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Shield, 
  Users, 
  AlertTriangle, 
  Clock, 
  Eye,
  Lock,
  Search,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Timer
} from "lucide-react";
import { ClassificationBadge, EmergencyOverrideBadge } from "@/components/ui/classification-badge";
import { ClearanceWarningModal } from "@/components/ui/clearance-warning-modal";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

interface UserClearance {
  id: number;
  userId: number;
  userName: string;
  userRole: string;
  clearanceLevel: number;
  compartments: string[];
  grantedAt: string;
  expiresAt?: string;
  active: boolean;
  temporaryAccess: boolean;
}

interface SecurityIncident {
  id: number;
  incidentType: string;
  severity: string;
  userId: number;
  userName: string;
  description: string;
  createdAt: string;
  investigationStatus: string;
}

interface EmergencyOverride {
  id: number;
  userId: number;
  userName: string;
  originalClearance: number;
  overrideClearance: number;
  reason: string;
  validUntil: string;
  status: string;
  authorizationCode: string;
}

export default function ClearanceManagement() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [selectedUser, setSelectedUser] = useState<UserClearance | null>(null);
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);

  // Form states
  const [grantForm, setGrantForm] = useState({
    userId: "",
    clearanceLevel: "2",
    compartments: [] as string[],
    justification: "",
    expiresAt: ""
  });

  const [overrideForm, setOverrideForm] = useState({
    userId: "",
    overrideClearance: "3",
    reason: "",
    validHours: "24",
    incidentId: ""
  });

  // Fetch user clearances
  const { data: clearances, isLoading: clearancesLoading } = useQuery({
    queryKey: ['/api/clearance/users'],
    queryFn: async () => {
      const response = await fetch('/api/clearance/users');
      if (!response.ok) throw new Error('Failed to fetch clearances');
      return response.json();
    }
  });

  // Fetch security incidents
  const { data: incidents } = useQuery({
    queryKey: ['/api/clearance/incidents'],
    queryFn: async () => {
      const response = await fetch('/api/clearance/incidents');
      if (!response.ok) throw new Error('Failed to fetch incidents');
      return response.json();
    }
  });

  // Fetch emergency overrides
  const { data: overrides } = useQuery({
    queryKey: ['/api/clearance/overrides'],
    queryFn: async () => {
      const response = await fetch('/api/clearance/overrides');
      if (!response.ok) throw new Error('Failed to fetch overrides');
      return response.json();
    }
  });

  // Fetch audit logs
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/clearance/audit'],
    queryFn: async () => {
      const response = await fetch('/api/clearance/audit');
      if (!response.ok) throw new Error('Failed to fetch audit logs');
      return response.json();
    }
  });

  // Grant clearance mutation
  const grantClearance = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/clearance/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to grant clearance');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clearance Granted",
        description: "Security clearance has been successfully granted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clearance/users'] });
      setShowGrantModal(false);
      resetGrantForm();
    }
  });

  // Emergency override mutation
  const grantOverride = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/clearance/emergency-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to grant override');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Emergency Override Granted",
        description: `Authorization code: ${data.authorizationCode}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clearance/overrides'] });
      setShowOverrideModal(false);
      resetOverrideForm();
    }
  });

  // Revoke clearance mutation
  const revokeClearance = useMutation({
    mutationFn: async (clearanceId: number) => {
      const response = await fetch(`/api/clearance/revoke/${clearanceId}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to revoke clearance');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Clearance Revoked",
        description: "Security clearance has been revoked",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clearance/users'] });
    }
  });

  const resetGrantForm = () => {
    setGrantForm({
      userId: "",
      clearanceLevel: "2",
      compartments: [],
      justification: "",
      expiresAt: ""
    });
  };

  const resetOverrideForm = () => {
    setOverrideForm({
      userId: "",
      overrideClearance: "3",
      reason: "",
      validHours: "24",
      incidentId: ""
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-50';
      case 'high': return 'text-orange-500 bg-orange-50';
      case 'medium': return 'text-yellow-500 bg-yellow-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500';
      case 'expired': return 'text-gray-500';
      case 'revoked': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const mockClearances: UserClearance[] = [
    {
      id: 1,
      userId: 1,
      userName: "Emergency1",
      userRole: "responder",
      clearanceLevel: 2,
      compartments: ["zone_alpha"],
      grantedAt: new Date().toISOString(),
      active: true,
      temporaryAccess: false
    },
    {
      id: 2,
      userId: 2, 
      userName: "Commander1",
      userRole: "commander",
      clearanceLevel: 3,
      compartments: ["zone_alpha", "zone_bravo"],
      grantedAt: new Date().toISOString(),
      active: true,
      temporaryAccess: false
    }
  ];

  const mockIncidents: SecurityIncident[] = [
    {
      id: 1,
      incidentType: "unauthorized_access",
      severity: "medium",
      userId: 1,
      userName: "Emergency1",
      description: "Attempted access to SECRET level document",
      createdAt: new Date().toISOString(),
      investigationStatus: "open"
    }
  ];

  const mockOverrides: EmergencyOverride[] = [
    {
      id: 1,
      userId: 1,
      userName: "Emergency1",
      originalClearance: 2,
      overrideClearance: 3,
      reason: "Critical incident response",
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: "active",
      authorizationCode: "EMG-ABC123"
    }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clearance Management</h1>
              <p className="text-gray-600">Security classification and access control</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={() => setShowGrantModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Grant Clearance
            </Button>
            <Button onClick={() => setShowOverrideModal(true)} variant="outline">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Emergency Override
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Clearances</p>
                <p className="text-2xl font-bold">{mockClearances.filter(c => c.active).length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Security Incidents</p>
                <p className="text-2xl font-bold">{mockIncidents.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Emergency Overrides</p>
                <p className="text-2xl font-bold">{mockOverrides.filter(o => o.status === 'active').length}</p>
              </div>
              <Timer className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Audit Entries Today</p>
                <p className="text-2xl font-bold">247</p>
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="clearances" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="clearances">User Clearances</TabsTrigger>
          <TabsTrigger value="incidents">Security Incidents</TabsTrigger>
          <TabsTrigger value="overrides">Emergency Overrides</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
        </TabsList>

        {/* User Clearances Tab */}
        <TabsContent value="clearances">
          <Card>
            <CardHeader>
              <CardTitle>Active Security Clearances</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockClearances.map((clearance) => (
                  <div
                    key={clearance.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{clearance.userName}</p>
                        <p className="text-sm text-gray-600">{clearance.userRole}</p>
                      </div>
                      <ClassificationBadge level={clearance.clearanceLevel} />
                      {clearance.temporaryAccess && (
                        <EmergencyOverrideBadge 
                          expiresAt={new Date(clearance.expiresAt!)} 
                        />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Compartments: {clearance.compartments.join(", ") || "None"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Granted: {new Date(clearance.grantedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(clearance)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => revokeClearance.mutate(clearance.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Incidents Tab */}
        <TabsContent value="incidents">
          <Card>
            <CardHeader>
              <CardTitle>Security Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded ${getSeverityColor(incident.severity)}`}>
                        <AlertTriangle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium">{incident.incidentType.replace('_', ' ').toUpperCase()}</p>
                        <p className="text-sm text-gray-600">{incident.description}</p>
                        <p className="text-xs text-gray-500">
                          User: {incident.userName} | {new Date(incident.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                        {incident.severity.toUpperCase()}
                      </span>
                      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
                        {incident.investigationStatus.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Overrides Tab */}
        <TabsContent value="overrides">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Clearance Overrides</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockOverrides.map((override) => (
                  <div
                    key={override.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium">{override.userName}</p>
                        <p className="text-sm text-gray-600">{override.reason}</p>
                        <p className="text-xs text-gray-500">
                          Code: {override.authorizationCode}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ClassificationBadge level={override.originalClearance} size="sm" />
                        <span>→</span>
                        <ClassificationBadge level={override.overrideClearance} size="sm" />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          Expires: {new Date(override.validUntil).toLocaleString()}
                        </p>
                        <span className={`text-xs ${getStatusColor(override.status)}`}>
                          {override.status.toUpperCase()}
                        </span>
                      </div>
                      {override.status === 'active' && (
                        <Button size="sm" variant="outline">
                          Revoke
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Access Audit Trail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Audit trail implementation in progress</p>
                <p className="text-sm">Real-time access monitoring and logging</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grant Clearance Modal */}
      <Dialog open={showGrantModal} onOpenChange={setShowGrantModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grant Security Clearance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="user">User</Label>
              <Select value={grantForm.userId} onValueChange={(value) => setGrantForm({ ...grantForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Emergency1</SelectItem>
                  <SelectItem value="2">Commander1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="clearance">Clearance Level</Label>
              <Select value={grantForm.clearanceLevel} onValueChange={(value) => setGrantForm({ ...grantForm, clearanceLevel: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">UNCLASSIFIED</SelectItem>
                  <SelectItem value="2">RESTRICTED</SelectItem>
                  <SelectItem value="3">SECRET</SelectItem>
                  <SelectItem value="4">TOP SECRET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="justification">Justification</Label>
              <Textarea
                id="justification"
                placeholder="Reason for granting clearance..."
                value={grantForm.justification}
                onChange={(e) => setGrantForm({ ...grantForm, justification: e.target.value })}
              />
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowGrantModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => grantClearance.mutate(grantForm)}>
                Grant Clearance
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Emergency Override Modal */}
      <Dialog open={showOverrideModal} onOpenChange={setShowOverrideModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Emergency Clearance Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <span className="text-yellow-800 text-sm font-medium">
                  Emergency use only - All overrides are logged and monitored
                </span>
              </div>
            </div>
            
            <div>
              <Label htmlFor="override-user">User</Label>
              <Select value={overrideForm.userId} onValueChange={(value) => setOverrideForm({ ...overrideForm, userId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Emergency1</SelectItem>
                  <SelectItem value="2">Commander1</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="override-level">Override Clearance Level</Label>
              <Select value={overrideForm.overrideClearance} onValueChange={(value) => setOverrideForm({ ...overrideForm, overrideClearance: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">RESTRICTED</SelectItem>
                  <SelectItem value="3">SECRET</SelectItem>
                  <SelectItem value="4">TOP SECRET</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="override-reason">Emergency Reason</Label>
              <Textarea
                id="override-reason"
                placeholder="Critical incident requiring elevated access..."
                value={overrideForm.reason}
                onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="valid-hours">Valid Duration (Hours)</Label>
              <Select value={overrideForm.validHours} onValueChange={(value) => setOverrideForm({ ...overrideForm, validHours: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Hour</SelectItem>
                  <SelectItem value="4">4 Hours</SelectItem>
                  <SelectItem value="12">12 Hours</SelectItem>
                  <SelectItem value="24">24 Hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setShowOverrideModal(false)}>
                Cancel
              </Button>
              <Button onClick={() => grantOverride.mutate(overrideForm)} className="bg-red-600 hover:bg-red-700">
                Grant Override
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}