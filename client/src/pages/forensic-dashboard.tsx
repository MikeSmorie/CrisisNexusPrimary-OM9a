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
            <Hash className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">Smart Contract Integration</span>
          </CardTitle>
          <CardDescription className="line-clamp-2">
            Immutable emergency response logging with fraud prevention
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg min-h-[80px] flex flex-col justify-center">
              <Badge variant="outline" className="text-green-600 mb-1 mx-auto">Phase 1</Badge>
              <div className="text-xs leading-tight px-1">Off-chain with Testnet Backup</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg min-h-[80px] flex flex-col justify-center">
              <Badge variant="outline" className="text-amber-600 mb-1 mx-auto">Phase 2</Badge>
              <div className="text-xs leading-tight px-1">IPFS Content Storage</div>
            </div>
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg min-h-[80px] flex flex-col justify-center">
              <Badge variant="outline" className="text-blue-600 mb-1 mx-auto">Phase 3</Badge>
              <div className="text-xs leading-tight px-1">Government Chain Integration</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forensic Logging */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Database className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Encrypted Logs</span>
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              Tamper-proof emergency response records
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">Total Log Entries</span>
                <Badge variant="outline" className="flex-shrink-0 text-xs">{auditLogs?.length || 0}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">Encryption Status</span>
                <Badge variant="outline" className="text-green-600 flex-shrink-0 text-xs">AES-256</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">Integrity Checks</span>
                <Badge variant="outline" className="text-green-600 flex-shrink-0 text-xs">Verified</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <Shield className="h-5 w-5 flex-shrink-0" />
              <span className="truncate">Access Control</span>
            </CardTitle>
            <CardDescription className="text-sm line-clamp-2">
              Role-based forensic data transparency
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">Commander Access</span>
                <Badge variant="outline" className="text-blue-600 flex-shrink-0 text-xs">Regional</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">Admin Access</span>
                <Badge variant="outline" className="text-purple-600 flex-shrink-0 text-xs">Full</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm flex-1 pr-2">AI Monitor</span>
                <Badge variant="outline" className="text-amber-600 flex-shrink-0 text-xs">Redacted</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Audit Entries */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Recent Forensic Entries</CardTitle>
          <CardDescription className="text-sm line-clamp-2">
            Latest emergency response audit trail entries
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {auditLogs?.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Lock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{log.action}</div>
                    <div className="text-sm text-gray-500 truncate">
                      User: {log.userId} | {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-purple-600 flex-shrink-0 ml-3 text-xs">
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
        <CardHeader className="pb-3">
          <CardTitle className="text-blue-800 dark:text-blue-200 truncate">
            Post-Crisis Reconstruction Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button variant="outline" className="justify-start text-sm">
              <FileCheck className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Timeline Report</span>
            </Button>
            <Button variant="outline" className="justify-start text-sm">
              <Database className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Decision Audit</span>
            </Button>
            <Button variant="outline" className="justify-start text-sm">
              <Hash className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Blockchain Verification</span>
            </Button>
            <Button variant="outline" className="justify-start text-sm">
              <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">Full Forensic Analysis</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}