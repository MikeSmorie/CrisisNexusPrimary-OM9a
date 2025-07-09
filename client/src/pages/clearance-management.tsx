import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Lock, Shield, Eye, AlertTriangle, Key } from "lucide-react";

export default function ClearanceManagement() {
  const { data: clearanceData } = useQuery({
    queryKey: ['/api/disaster/clearance'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/clearance');
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 45000
  });

  const clearanceLevels = [
    { level: 'UNCLASSIFIED', color: 'text-green-600', count: 5 },
    { level: 'RESTRICTED', color: 'text-blue-600', count: 3 },
    { level: 'SECRET', color: 'text-amber-600', count: 2 },
    { level: 'TOP SECRET', color: 'text-red-600', count: 1 },
    { level: 'FORENSIC ONLY', color: 'text-purple-600', count: 1 }
  ];

  const compartments = [
    { name: 'Alpha Zone', access: 'Full Access', users: 8 },
    { name: 'Bravo Zone', access: 'Restricted', users: 5 },
    { name: 'Charlie Zone', access: 'Limited', users: 3 },
    { name: 'Delta Zone', access: 'Emergency Only', users: 2 }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Lock className="h-6 w-6 text-red-600" />
          <h1 className="text-3xl font-bold tracking-tight">Clearance Management</h1>
        </div>
        <Badge variant="destructive" className="animate-pulse">
          SCI/SAP Classification System
        </Badge>
      </div>

      {/* Classification System Overview */}
      <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800 dark:text-red-200">
            <Shield className="h-5 w-5" />
            Military-Grade Access Control
          </CardTitle>
          <CardDescription>
            Five-tier clearance system with role-based access matrix
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {clearanceLevels.map((level) => (
              <div key={level.level} className="text-center">
                <div className={`text-lg font-bold ${level.color}`}>{level.count}</div>
                <div className="text-xs font-medium">{level.level}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Compartmentalization */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Eye className="h-5 w-5" />
              Geographic Zones
            </CardTitle>
            <CardDescription>
              Compartmentalized access by operational zones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {compartments.map((comp) => (
                <div key={comp.name} className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div>
                    <div className="font-medium">{comp.name}</div>
                    <div className="text-sm text-gray-500">{comp.access}</div>
                  </div>
                  <Badge variant="outline" className="text-blue-600">
                    {comp.users} Users
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Key className="h-5 w-5" />
              Emergency Override System
            </CardTitle>
            <CardDescription>
              Temporary clearance elevation with authorization codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Active Overrides</span>
                <Badge variant="outline" className="text-amber-600">0</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Authorization Codes</span>
                <Badge variant="outline" className="text-green-600">Valid</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Time Limits</span>
                <Badge variant="outline" className="text-blue-600">4 Hour Max</Badge>
              </div>
              <Button variant="destructive" size="sm" className="w-full mt-3">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Request Emergency Override
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Redaction Engine */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Shield className="h-5 w-5" />
            AI Data Redaction Engine
          </CardTitle>
          <CardDescription>
            Automatic data obfuscation based on user clearance levels
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-purple-600">15</div>
              <div className="text-sm text-gray-500">Redaction Rules</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">99.7%</div>
              <div className="text-sm text-gray-500">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-blue-600">247</div>
              <div className="text-sm text-gray-500">Items Processed</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-amber-600">0</div>
              <div className="text-sm text-gray-500">Security Incidents</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle>Real-time Access Monitoring</CardTitle>
          <CardDescription>
            Comprehensive audit trail with anomaly detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <div className="text-green-800 dark:text-green-200 font-medium">Normal Access</div>
                <div className="text-2xl font-bold text-green-600">156</div>
                <div className="text-sm text-green-700 dark:text-green-300">Last 24 hours</div>
              </div>
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
                <div className="text-amber-800 dark:text-amber-200 font-medium">Elevated Access</div>
                <div className="text-2xl font-bold text-amber-600">3</div>
                <div className="text-sm text-amber-700 dark:text-amber-300">Emergency overrides</div>
              </div>
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                <div className="text-red-800 dark:text-red-200 font-medium">Denied Access</div>
                <div className="text-2xl font-bold text-red-600">0</div>
                <div className="text-sm text-red-700 dark:text-red-300">Security violations</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}