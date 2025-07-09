import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Monitor, 
  Brain, 
  TrendingUp, 
  Globe, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Eye,
  BarChart3,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SentimentData {
  overall: number;
  keywords: Array<{
    term: string;
    sentiment: number;
    count: number;
    trend: string;
  }>;
  heatmapRegions: Array<{
    region: string;
    intensity: number;
    level: 'normal' | 'elevated' | 'critical';
  }>;
}

interface AIRecommendation {
  id: number;
  type: string;
  title: string;
  description: string;
  confidence: number;
  priority: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'escalated';
  incidentId?: number;
}

interface TranslationJob {
  id: number;
  sourceText: string;
  targetLanguage: string;
  translatedText: string;
  accuracy: number;
  status: string;
  createdAt: string;
}

interface NLPMetrics {
  processedMessages: number;
  queueLength: number;
  averageResponseTime: number;
  accuracy: number;
  errorRate: number;
}

export default function AIMonitor() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendation | null>(null);
  const [overrideNote, setOverrideNote] = useState("");

  // Fetch sentiment data
  const { data: sentimentData } = useQuery({
    queryKey: ['/api/disaster/ai/sentiment'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/ai/sentiment');
      if (!response.ok) throw new Error('Failed to fetch sentiment data');
      return response.json();
    },
    refetchInterval: 5000 // Refresh every 5 seconds
  });

  // Fetch AI recommendations
  const { data: recommendations = [] } = useQuery({
    queryKey: ['/api/disaster/ai/recommendations'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/ai/recommendations');
      if (!response.ok) throw new Error('Failed to fetch recommendations');
      return response.json();
    },
    refetchInterval: 10000
  });

  // Fetch translation jobs
  const { data: translations = [] } = useQuery({
    queryKey: ['/api/disaster/ai/translations'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/ai/translations');
      if (!response.ok) throw new Error('Failed to fetch translations');
      return response.json();
    },
    refetchInterval: 15000
  });

  // Fetch NLP metrics
  const { data: nlpMetrics } = useQuery({
    queryKey: ['/api/disaster/ai/nlp-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/ai/nlp-metrics');
      if (!response.ok) throw new Error('Failed to fetch NLP metrics');
      return response.json();
    },
    refetchInterval: 10000
  });

  // AI recommendation actions
  const handleRecommendation = useMutation({
    mutationFn: async ({ id, action, note }: { id: number; action: string; note?: string }) => {
      const response = await fetch(`/api/disaster/ai/recommendations/${id}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note })
      });
      if (!response.ok) throw new Error(`Failed to ${action} recommendation`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Recommendation Updated",
        description: `Recommendation ${variables.action} successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/disaster/ai/recommendations'] });
      setSelectedRecommendation(null);
      setOverrideNote("");
    }
  });

  // Manual AI override
  const triggerManualOverride = useMutation({
    mutationFn: async (overrideData: any) => {
      const response = await fetch('/api/disaster/ai/manual-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      });
      if (!response.ok) throw new Error('Failed to trigger manual override');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Manual Override Activated",
        description: "AI system is now in manual oversight mode",
        variant: "destructive"
      });
    }
  });

  const getSentimentColor = (sentiment: number) => {
    if (sentiment >= 70) return 'text-green-600 bg-green-50';
    if (sentiment >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConfidenceStars = (confidence: number) => {
    const stars = Math.floor(confidence / 20);
    return '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-600 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  const pendingRecommendations = recommendations.filter((r: AIRecommendation) => r.status === 'pending');
  const criticalRecommendations = recommendations.filter((r: AIRecommendation) => r.priority === 'critical');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Monitor className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Operations Monitor</h1>
              <p className="text-gray-600">Emergency AI System Oversight & Control</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => triggerManualOverride.mutate({ reason: 'Manual oversight required' })}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manual Override
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              AI System Active
            </Badge>
          </div>
        </div>
      </div>

      {/* Sentiment Heatmap */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Live Sentiment Heatmap</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Overall Sentiment */}
            <div className="text-center p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Social Media Pulse</h3>
              <div className="flex items-center justify-center space-x-4">
                <div className={cn("px-4 py-2 rounded-lg", getSentimentColor(sentimentData?.overall || 50))}>
                  <span className="text-2xl font-bold">{sentimentData?.overall || 50}%</span>
                  <p className="text-sm">Overall Sentiment</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">Current Status:</p>
                  <Badge className={
                    (sentimentData?.overall || 50) >= 70 ? 'bg-green-500' :
                    (sentimentData?.overall || 50) >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                  }>
                    {(sentimentData?.overall || 50) >= 70 ? 'Normal' :
                     (sentimentData?.overall || 50) >= 40 ? 'Elevated' : 'Critical'}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Trending Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(sentimentData?.keywords || [
                { term: 'emergency', sentiment: 25, count: 47, trend: 'up' },
                { term: 'evacuation', sentiment: 35, count: 23, trend: 'up' },
                { term: 'help needed', sentiment: 15, count: 89, trend: 'spike' }
              ]).map((keyword: any, index: number) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">"{keyword.term}"</span>
                    <div className="flex items-center space-x-1">
                      <span className="text-sm text-gray-600">↑{keyword.count}%</span>
                      {keyword.trend === 'spike' && (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <Progress value={keyword.sentiment} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">Sentiment: {keyword.sentiment}%</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="recommendations" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
          <TabsTrigger value="translations">Translation Stream</TabsTrigger>
          <TabsTrigger value="nlp">NLP Processing</TabsTrigger>
          <TabsTrigger value="metrics">Performance</TabsTrigger>
        </TabsList>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">
                Pending Recommendations ({pendingRecommendations.length})
              </h3>
              {pendingRecommendations.map((rec: AIRecommendation) => (
                <Card key={rec.id} className="shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getPriorityColor(rec.priority)}>
                            {rec.priority.toUpperCase()}
                          </Badge>
                          <span className="text-sm text-gray-500">{rec.type}</span>
                        </div>
                        <h4 className="font-medium mb-1">{rec.title}</h4>
                        <p className="text-sm text-gray-600">{rec.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">Confidence: {rec.confidence}%</p>
                        <p className="text-xs text-gray-500">{getConfidenceStars(rec.confidence)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleRecommendation.mutate({ id: rec.id, action: 'approve' })}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedRecommendation(rec)}
                          >
                            <Settings className="h-4 w-4 mr-1" />
                            Override
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Manual Override</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                              Override AI recommendation: "{selectedRecommendation?.title}"
                            </p>
                            <Textarea
                              placeholder="Provide reason for override..."
                              value={overrideNote}
                              onChange={(e) => setOverrideNote(e.target.value)}
                            />
                            <div className="flex space-x-2">
                              <Button 
                                onClick={() => handleRecommendation.mutate({ 
                                  id: selectedRecommendation?.id || 0, 
                                  action: 'reject',
                                  note: overrideNote 
                                })}
                                variant="destructive"
                              >
                                Override & Reject
                              </Button>
                              <Button 
                                onClick={() => handleRecommendation.mutate({ 
                                  id: selectedRecommendation?.id || 0, 
                                  action: 'escalate',
                                  note: overrideNote 
                                })}
                                variant="outline"
                              >
                                Escalate to Human
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="h-5 w-5" />
                    <span>Critical Alerts</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {criticalRecommendations.slice(0, 3).map((rec: AIRecommendation) => (
                      <div key={rec.id} className="bg-red-50 border border-red-200 rounded p-2">
                        <p className="text-sm font-medium">{rec.title}</p>
                        <p className="text-xs text-gray-600">{rec.confidence}% confidence</p>
                      </div>
                    ))}
                    {criticalRecommendations.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No critical alerts</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Translation Stream Tab */}
        <TabsContent value="translations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>Live Translation Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(translations.slice(0, 10) || []).map((translation: TranslationJob) => (
                  <div key={translation.id} className="border-l-4 border-blue-500 bg-blue-50 pl-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">
                          {translation.sourceText ? 'Auto-detected' : 'EN'} → {translation.targetLanguage}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={translation.accuracy >= 90 ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                        >
                          {translation.accuracy}% Accuracy
                        </Badge>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(translation.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Original:</p>
                        <p className="text-sm">{translation.sourceText || 'Medical emergency at downtown plaza'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Translation:</p>
                        <p className="text-sm">{translation.translatedText || 'Emergencia médica en la plaza del centro'}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NLP Processing Tab */}
        <TabsContent value="nlp" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold">{nlpMetrics?.processedMessages || 142}</p>
                <p className="text-sm text-gray-600">Processed Messages</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <p className="text-2xl font-bold">{nlpMetrics?.queueLength || 7}</p>
                <p className="text-sm text-gray-600">Queue Length</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold">{nlpMetrics?.averageResponseTime || 1.2}s</p>
                <p className="text-sm text-gray-600">Avg Response</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold">{nlpMetrics?.accuracy || 94}%</p>
                <p className="text-sm text-gray-600">Accuracy Rate</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>NLP Processing Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Processing: Emergency reports</span>
                  <Badge variant="outline">23 messages</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Queue: Translation requests</span>
                  <Badge variant="outline">7 pending</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Analysis: Sentiment extraction</span>
                  <Badge variant="outline">12 in progress</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>AI System Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>67%</span>
                  </div>
                  <Progress value={67} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>84%</span>
                  </div>
                  <Progress value={84} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>API Response Time</span>
                    <span>234ms</span>
                  </div>
                  <Progress value={23} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Success Rate</span>
                    <span>98.7%</span>
                  </div>
                  <Progress value={98.7} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Monitoring</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Translation Errors</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">AI Processing Errors</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">2</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Failures</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">0</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">System Warnings</span>
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">1</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}