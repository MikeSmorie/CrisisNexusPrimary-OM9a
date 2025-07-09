import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { 
  Shield, 
  AlertTriangle, 
  Radio, 
  Users, 
  MapPin, 
  BarChart3, 
  MessageSquare, 
  Clock, 
  FileCheck, 
  Lock,
  ArrowLeft,
  Activity
} from "lucide-react";

// Import the existing disaster components
import DisasterDashboard from "@/pages/disaster-dashboard";
import IncidentManagement from "@/pages/incident-management";
import EmergencyAlerts from "@/pages/emergency-alerts";
import ResourceDeployment from "@/pages/resource-deployment";
import CommunicationCenter from "@/pages/communication-center";
import ForensicDashboard from "@/pages/forensic-dashboard";
import ClearanceManagement from "@/pages/clearance-management";

interface TabConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  component: React.ComponentType;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

export default function DisasterManagementModule() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("dashboard");

  // Get real-time stats for badges
  const { data: stats } = useQuery({
    queryKey: ['/api/disaster/stats'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/stats');
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const tabs: TabConfig[] = [
    {
      id: "dashboard",
      label: "Emergency Operations Center",
      icon: Shield,
      component: DisasterDashboard,
    },
    {
      id: "incidents",
      label: "Incident Management",
      icon: AlertTriangle,
      component: IncidentManagement,
      badge: stats?.activeIncidents > 0 ? stats.activeIncidents.toString() : undefined,
      badgeVariant: stats?.activeIncidents > 0 ? "destructive" : undefined,
    },
    {
      id: "alerts",
      label: "Emergency Alerts",
      icon: MessageSquare,
      component: EmergencyAlerts,
      badge: stats?.criticalAlerts > 0 ? stats.criticalAlerts.toString() : undefined,
      badgeVariant: stats?.criticalAlerts > 0 ? "destructive" : undefined,
    },
    {
      id: "resources",
      label: "Resource Deployment",
      icon: Users,
      component: ResourceDeployment,
    },
    {
      id: "communications",
      label: "Communication Center",
      icon: Radio,
      component: CommunicationCenter,
    },
    {
      id: "forensic",
      label: "Forensic Dashboard",
      icon: FileCheck,
      component: ForensicDashboard,
    },
    {
      id: "clearance",
      label: "Clearance Management",
      icon: Lock,
      component: ClearanceManagement,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || DisasterDashboard;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-red-600" />
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Disaster Management - Module 9
            </h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="destructive" className="animate-pulse">
            Emergency Response System
          </Badge>
          <div className={`w-2 h-2 rounded-full ${stats?.systemStatus === 'operational' ? 'bg-green-400' : 'bg-red-400'}`}></div>
        </div>
      </div>

      {/* System Status Overview */}
      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Activity className="h-5 w-5" />
            System Status Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats?.activeIncidents || 0}</div>
              <div className="text-sm text-red-700 dark:text-red-300">Active Incidents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">{stats?.criticalAlerts || 0}</div>
              <div className="text-sm text-amber-700 dark:text-amber-300">Critical Alerts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats?.availableResources || 0}</div>
              <div className="text-sm text-green-700 dark:text-green-300">Available Resources</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats?.personnelDeployed || 0}</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Personnel Deployed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Operations Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 bg-red-100 dark:bg-red-900">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id} 
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.badge && (
                    <Badge 
                      variant={tab.badgeVariant || "default"} 
                      className="ml-1 text-xs px-1 py-0"
                    >
                      {tab.badge}
                    </Badge>
                  )}
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-6">
            <div className="min-h-[600px]">
              <tab.component />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}