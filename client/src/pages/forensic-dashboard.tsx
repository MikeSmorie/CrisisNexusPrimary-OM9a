import { useState, useEffect } from "react";
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
  Search, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  Database,
  Link,
  FileText,
  Download,
  Verified,
  Activity,
  BarChart3,
  Filter,
  RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";
import { cn } from "@/lib/utils";

interface ForensicLog {
  id: number;
  eventId: string;
  eventType: string;
  userId: number;
  eventData: Record<string, any>;
  createdAt: string;
  blockchainConfirmed: boolean;
  blockchainHash?: string;
  transactionHash?: string;
  integrityVerified: boolean;
  signature: string;
}

interface BlockchainBatch {
  id: number;
  batchId: string;
  merkleRoot: string;
  logCount: number;
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
  confirmedAt?: string;
  transactionHash?: string;
  gasUsed?: number;
}

interface ForensicStats {
  totalLogs: number;
  verifiedLogs: number;
  blockchainConfirmed: number;
  totalBatches: number;
  pendingBatches: number;
  recentLogs: number;
  verificationRate: number;
  blockchainRate: number;
}

export default function ForensicDashboard() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [selectedLog, setSelectedLog] = useState<ForensicLog | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: "",
    end: ""
  });

  // Fetch forensic statistics
  const { data: stats } = useQuery<ForensicStats>({
    queryKey: ['/api/forensic/stats'],
    queryFn: async () => {
      const response = await fetch('/api/forensic/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 30000
  });

  // Fetch forensic logs
  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/forensic/logs', { eventTypeFilter, dateRange }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (eventTypeFilter && eventTypeFilter !== "all") params.append('eventType', eventTypeFilter);
      if (dateRange.start) params.append('startDate', dateRange.start);
      if (dateRange.end) params.append('endDate', dateRange.end);
      params.append('limit', '100');
      
      const response = await fetch(`/api/forensic/logs?${params}`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Fetch blockchain batches
  const { data: batchesData } = useQuery({
    queryKey: ['/api/forensic/batches'],
    queryFn: async () => {
      const response = await fetch('/api/forensic/batches');
      if (!response.ok) throw new Error('Failed to fetch batches');
      return response.json();
    },
    refetchInterval: 15000
  });

  // Verify event integrity
  const verifyIntegrity = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch('/api/forensic/verify-integrity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      if (!response.ok) throw new Error('Failed to verify integrity');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Integrity Verification",
        description: data.verified ? "Event integrity verified successfully" : "Event integrity verification failed",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/forensic/logs'] });
    }
  });

  // Generate forensic report
  const generateReport = useMutation({
    mutationFn: async (params: { incidentId: string; reportType: string }) => {
      const response = await fetch('/api/forensic/generate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to generate report');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Report Generated",
        description: "Forensic report generated successfully",
      });
      // In a real app, this would trigger a download
      console.log("Report data:", data.report);
    }
  });

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case 'incident_created': return 'bg-red-100 text-red-800';
      case 'decision_approved': return 'bg-blue-100 text-blue-800';
      case 'resource_allocated': return 'bg-green-100 text-green-800';
      case 'resolution_submitted': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredLogs = logsData?.logs?.filter((log: ForensicLog) => {
    const matchesSearch = searchTerm === "" || 
           log.eventId.toLowerCase().includes(searchTerm.toLowerCase()) ||
           log.eventType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = eventTypeFilter === "all" || log.eventType === eventTypeFilter;
    return matchesSearch && matchesType;
  }) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Forensic Dashboard</h1>
              <p className="text-gray-600">Immutable audit trails and blockchain verification</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-green-50 text-green-700">
              Blockchain Connected
            </Badge>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Logs</p>
                <p className="text-2xl font-bold">{stats?.totalLogs || 0}</p>
              </div>
              <Database className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.recentLogs || 0} in last 24h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Verified Events</p>
                <p className="text-2xl font-bold">{stats?.verifiedLogs || 0}</p>
              </div>
              <Verified className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.verificationRate.toFixed(1) || 0}% verification rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Blockchain Confirmed</p>
                <p className="text-2xl font-bold">{stats?.blockchainConfirmed || 0}</p>
              </div>
              <Link className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.blockchainRate.toFixed(1) || 0}% on-chain
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Batches</p>
                <p className="text-2xl font-bold">{stats?.pendingBatches || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.totalBatches || 0} total batches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="logs">Forensic Logs</TabsTrigger>
          <TabsTrigger value="batches">Blockchain Batches</TabsTrigger>
          <TabsTrigger value="reports">Generate Reports</TabsTrigger>
        </TabsList>

        {/* Forensic Logs Tab */}
        <TabsContent value="logs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by event ID or type..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Event Type</label>
                  <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All types</SelectItem>
                      <SelectItem value="incident_created">Incident Created</SelectItem>
                      <SelectItem value="decision_approved">Decision Approved</SelectItem>
                      <SelectItem value="resource_allocated">Resource Allocated</SelectItem>
                      <SelectItem value="resolution_submitted">Resolution Submitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Start Date</label>
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">End Date</label>
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Forensic Event Logs</CardTitle>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="text-center py-8">Loading logs...</div>
              ) : (
                <div className="space-y-2">
                  {filteredLogs.map((log: ForensicLog) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex space-x-2">
                          {log.integrityVerified && (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          )}
                          {log.blockchainConfirmed && (
                            <Link className="h-4 w-4 text-purple-600" />
                          )}
                          {!log.integrityVerified && (
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{log.eventId}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge className={getEventTypeColor(log.eventType)}>
                          {log.eventType.replace('_', ' ')}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            verifyIntegrity.mutate(log.eventId);
                          }}
                          disabled={verifyIntegrity.isPending}
                        >
                          Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Blockchain Batches Tab */}
        <TabsContent value="batches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {batchesData?.batches?.map((batch: BlockchainBatch) => (
                  <div
                    key={batch.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{batch.batchId}</p>
                      <p className="text-sm text-gray-600">
                        {batch.logCount} logs | {new Date(batch.createdAt).toLocaleString()}
                      </p>
                      {batch.transactionHash && (
                        <p className="text-xs text-gray-500">
                          TX: {batch.transactionHash.substring(0, 20)}...
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(batch.status)}>
                        {batch.status}
                      </Badge>
                      {batch.gasUsed && (
                        <span className="text-sm text-gray-500">
                          Gas: {batch.gasUsed.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="h-5 w-5" />
                <span>Generate Forensic Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Incident ID</label>
                  <Input placeholder="Enter incident ID..." />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Report Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select report type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="timeline">Timeline Report</SelectItem>
                      <SelectItem value="decisions">Decisions Report</SelectItem>
                      <SelectItem value="resources">Resources Report</SelectItem>
                      <SelectItem value="full">Full Forensic Report</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button
                  onClick={() => generateReport.mutate({ incidentId: "example-id", reportType: "full" })}
                  disabled={generateReport.isPending}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline">
                  <Activity className="h-4 w-4 mr-2" />
                  View Templates
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Log Details Dialog */}
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Forensic Log Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Event ID</label>
                  <p className="font-mono text-sm">{selectedLog.eventId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Event Type</label>
                  <Badge className={getEventTypeColor(selectedLog.eventType)}>
                    {selectedLog.eventType.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Created At</label>
                  <p className="text-sm">{new Date(selectedLog.createdAt).toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="flex space-x-2">
                    {selectedLog.integrityVerified && (
                      <Badge className="bg-green-100 text-green-800">Verified</Badge>
                    )}
                    {selectedLog.blockchainConfirmed && (
                      <Badge className="bg-purple-100 text-purple-800">On-Chain</Badge>
                    )}
                  </div>
                </div>
              </div>
              
              {selectedLog.blockchainHash && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Blockchain Hash</label>
                  <p className="font-mono text-sm break-all">{selectedLog.blockchainHash}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">Event Data</label>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-40">
                  {JSON.stringify(selectedLog.eventData, null, 2)}
                </pre>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600">Signature</label>
                <p className="font-mono text-sm break-all">{selectedLog.signature}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}