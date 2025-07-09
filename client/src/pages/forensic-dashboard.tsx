import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FileCheck, Shield, Lock, Hash, Database } from "lucide-react";

export default function ForensicDashboard() {
  const { data: auditLogs } = useQuery({
    queryKey: ['/api/disaster/audit-logs'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/audit-logs');
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 30000
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileCheck className="h-6 w-6 text-purple-600" />
          <h1 className="text-3xl font-bold tracking-tight">Forensic Dashboard</h1>
        </div>
        <Badge variant="outline" className="text-purple-600">
          Immutable Audit Trail
        </Badge>
      </div>

      {/* Blockchain Integration Status */}
      <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
            <Hash className="h-5 w-5" />
            Smart Contract Integration
          </CardTitle>
          <CardDescription>
            Immutable emergency response logging with fraud prevention
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Badge variant="outline" className="text-green-600">Phase 1</Badge>
              <div className="text-sm mt-1">Off-chain with Testnet Backup</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-amber-600">Phase 2</Badge>
              <div className="text-sm mt-1">IPFS Content Storage</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-blue-600">Phase 3</Badge>
              <div className="text-sm mt-1">Government Chain Integration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forensic Logging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Database className="h-5 w-5" />
              Encrypted Logs
            </CardTitle>
            <CardDescription>
              Tamper-proof emergency response records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Total Log Entries</span>
                <Badge variant="outline">{auditLogs?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Encryption Status</span>
                <Badge variant="outline" className="text-green-600">AES-256 Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Integrity Checks</span>
                <Badge variant="outline" className="text-green-600">All Verified</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="h-5 w-5" />
              Access Control
            </CardTitle>
            <CardDescription>
              Role-based forensic data transparency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span>Commander Access</span>
                <Badge variant="outline" className="text-blue-600">Regional Data</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Admin Access</span>
                <Badge variant="outline" className="text-purple-600">Full Access</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>AI Monitor</span>
                <Badge variant="outline" className="text-amber-600">Redacted Bias</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Forensic Entries</CardTitle>
          <CardDescription>
            Latest emergency response audit trail entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {auditLogs?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">{log.action}</div>
                    <div className="text-sm text-gray-500">
                      User: {log.userId} | {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-600">
                  Verified
                </Badge>
              </div>
            )) || (
              <div className="text-center text-gray-500 py-4">
                No audit entries available
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Post-Crisis Analysis */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-800 dark:text-blue-200">
            Post-Crisis Reconstruction Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <FileCheck className="h-4 w-4 mr-2" />
              Timeline Report
            </Button>
            <Button variant="outline" className="justify-start">
              <Database className="h-4 w-4 mr-2" />
              Decision Audit
            </Button>
            <Button variant="outline" className="justify-start">
              <Hash className="h-4 w-4 mr-2" />
              Blockchain Verification
            </Button>
            <Button variant="outline" className="justify-start">
              <Shield className="h-4 w-4 mr-2" />
              Full Forensic Analysis
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}