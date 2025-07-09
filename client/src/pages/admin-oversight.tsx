import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Shield, 
  Users, 
  Activity, 
  Download, 
  Search, 
  Filter, 
  UserX, 
  UserCheck, 
  Settings,
  Zap,
  Globe,
  Radio,
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SystemMetrics {
  activeIncidents: number;
  totalUsers: number;
  systemUptime: string;
  aiSystemStatus: string;
  translationSystemStatus: string;
  communicationsStatus: string;
}

interface ActivityLog {
  id: number;
  timestamp: string;
  userId: number;
  username: string;
  action: string;
  details: string;
  severity: string;
  module: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
  createdAt: string;
}

export default function AdminOversight() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timeFilter, setTimeFilter] = useState('24h');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch system metrics
  const { data: metrics } = useQuery({
    queryKey: ['/api/disaster/admin/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/admin/metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Fetch activity logs
  const { data: logs = [] } = useQuery({
    queryKey: ['/api/disaster/admin/logs', timeFilter, userFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeFilter,
        userFilter,
        actionFilter
      });
      const response = await fetch(`/api/disaster/admin/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Fetch users
  const { data: users = [] } = useQuery({
    queryKey: ['/api/disaster/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // User management mutations
  const updateUserStatus = useMutation({
    mutationFn: async ({ userId, action }: { userId: number; action: string }) => {
      const response = await fetch(`/api/disaster/admin/users/${userId}/${action}`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error(`Failed to ${action} user`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "User Updated",
        description: `User ${variables.action} completed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/admin/users'] });
    }
  });

  // Export logs mutation
  const exportLogs = useMutation({
    mutationFn: async (format: string) => {
      const response = await fetch(`/api/disaster/admin/logs/export?format=${format}`);
      if (!response.ok) throw new Error('Failed to export logs');
      return response.blob();
    },
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `emergency_logs_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: `Logs exported as ${format.toUpperCase()} file`,
      });
    }
  });

  const filteredLogs = logs.filter((log: ActivityLog) => {
    if (searchTerm && !log.action.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !log.username.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  const activeUsers = users.filter((user: User) => user.status === 'active').length;
  const onlineUsers = users.filter((user: User) => {
    const lastLogin = new Date(user.lastLogin);
    const now = new Date();
    return (now.getTime() - lastLogin.getTime()) < 30 * 60 * 1000; // Online if logged in within 30 minutes
  }).length;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSystemStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      default: return <AlertTriangle className="h-5 w-5 text-gray-600" />;
    }
  };

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
              <h1 className="text-2xl font-bold text-gray-900">System Oversight</h1>
              <p className="text-gray-600">Emergency Management System Administration</p>
            </div>
          </div>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            Administrator Access
          </Badge>
        </div>
      </div>

      {/* System Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Incidents</p>
                <p className="text-2xl font-bold text-red-600">{metrics?.activeIncidents || 0}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{activeUsers}/{metrics?.totalUsers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-2xl font-bold text-green-600">{metrics?.systemUptime || '99.9%'}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Now</p>
                <p className="text-2xl font-bold text-purple-600">{onlineUsers}</p>
              </div>
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>System Health Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getSystemStatusIcon(metrics?.aiSystemStatus || 'operational')}
                <div>
                  <p className="font-medium">AI Processing Hub</p>
                  <p className="text-sm text-gray-600">Translation & Analysis</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {metrics?.aiSystemStatus || 'Operational'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getSystemStatusIcon(metrics?.translationSystemStatus || 'operational')}
                <div>
                  <p className="font-medium">Translation Engine</p>
                  <p className="text-sm text-gray-600">Multilingual Support</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {metrics?.translationSystemStatus || 'Active'}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                {getSystemStatusIcon(metrics?.communicationsStatus || 'operational')}
                <div>
                  <p className="font-medium">Communication Channels</p>
                  <p className="text-sm text-gray-600">Radio, Satellite, Cellular</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {metrics?.communicationsStatus || 'All Active'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="settings">System Settings</TabsTrigger>
        </TabsList>

        {/* Activity Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Live Activity Logs</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => exportLogs.mutate('csv')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={timeFilter} onValueChange={setTimeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24h</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="commander">Commanders</SelectItem>
                    <SelectItem value="responder">Responders</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="report">Report</SelectItem>
                    <SelectItem value="assign">Assignment</SelectItem>
                    <SelectItem value="alert">Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Logs Table */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredLogs.map((log: ActivityLog) => (
                  <div key={log.id} className={cn("p-3 rounded-lg border", getSeverityColor(log.severity))}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-sm">
                          <span className="font-medium">{log.username}</span>
                          <span className="text-gray-600 ml-2">{log.action}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {log.module}
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{log.details}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Emergency Personnel Management</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Total Personnel: {users.length} | Active: {activeUsers} | Online: {onlineUsers}
                  </p>
                  <Button variant="outline" size="sm">
                    Add Personnel
                  </Button>
                </div>

                <div className="space-y-2">
                  {users.map((user: User) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn("h-3 w-3 rounded-full", 
                          user.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        <div>
                          <p className="font-medium">{user.username}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <Badge variant="outline">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedUser(user)}>
                              Edit
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Manage User: {selectedUser?.username}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-2">
                                <Button 
                                  variant="outline"
                                  onClick={() => updateUserStatus.mutate({ 
                                    userId: selectedUser?.id || 0, 
                                    action: 'promote' 
                                  })}
                                >
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  Promote
                                </Button>
                                <Button 
                                  variant="outline"
                                  onClick={() => updateUserStatus.mutate({ 
                                    userId: selectedUser?.id || 0, 
                                    action: 'suspend' 
                                  })}
                                >
                                  <UserX className="h-4 w-4 mr-2" />
                                  Suspend
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="h-5 w-5" />
                  <span>AI Router Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">OpenAI Provider</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Claude Provider</span>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Disabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Fallback Rules</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Emergency Override</span>
                  <Badge variant="outline" className="bg-red-50 text-red-700">Manual Only</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Globe className="h-5 w-5" />
                  <span>Translation Engine</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Language Support</span>
                  <Badge variant="outline">EN, ES, FR</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Translation Accuracy</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700">94%</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing Queue</span>
                  <Badge variant="outline">7 pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Offline Mode</span>
                  <Button variant="outline" size="sm">Configure</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}