import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Shield, Radio, MapPin, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export function ResponderOutput() {
  const [responseMessage, setResponseMessage] = useState('');
  const [responseAction, setResponseAction] = useState('');
  const [emergencyType, setEmergencyType] = useState('');
  const [dispatchStatus, setDispatchStatus] = useState('pending');

  const emergencyTypes = [
    { value: 'fire', label: 'Fire Emergency', color: 'text-red-600' },
    { value: 'medical', label: 'Medical Emergency', color: 'text-green-600' },
    { value: 'police', label: 'Police Emergency', color: 'text-blue-600' },
    { value: 'rescue', label: 'Search & Rescue', color: 'text-orange-600' },
    { value: 'hazmat', label: 'Hazmat Incident', color: 'text-purple-600' }
  ];

  const dispatchActions = [
    'Dispatch Fire Department',
    'Dispatch EMS Units',
    'Dispatch Police Units',
    'Dispatch Search & Rescue',
    'Multi-Agency Response',
    'Hazmat Team Response'
  ];

  const handleDispatch = () => {
    setDispatchStatus('dispatching');
    setTimeout(() => {
      setDispatchStatus('dispatched');
    }, 2000);
  };

  const getStatusBadge = () => {
    switch (dispatchStatus) {
      case 'pending':
        return <Badge variant="outline">Pending Review</Badge>;
      case 'dispatching':
        return <Badge variant="secondary" className="animate-pulse">Dispatching...</Badge>;
      case 'dispatched':
        return <Badge variant="default" className="bg-green-600">Units Dispatched</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-green-600" />
          Emergency Responder
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Radio className="h-3 w-3 mr-1" />
            Dispatch Ready
          </Badge>
          {getStatusBadge()}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Emergency Classification</label>
          <Select value={emergencyType} onValueChange={setEmergencyType}>
            <SelectTrigger>
              <SelectValue placeholder="Select emergency type" />
            </SelectTrigger>
            <SelectContent>
              {emergencyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <span className={`font-medium ${type.color}`}>
                    {type.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 space-y-2">
          <label className="text-sm font-medium">Translated Emergency Message</label>
          <Textarea
            value={responseMessage}
            onChange={(e) => setResponseMessage(e.target.value)}
            placeholder="Processed emergency message from translator..."
            className="flex-1 min-h-24 resize-none"
            readOnly
          />
        </div>

        <Separator />

        <div className="space-y-2">
          <label className="text-sm font-medium">Response Action</label>
          <Select value={responseAction} onValueChange={setResponseAction}>
            <SelectTrigger>
              <SelectValue placeholder="Select dispatch action" />
            </SelectTrigger>
            <SelectContent>
              {dispatchActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 p-2 rounded bg-gray-50 dark:bg-gray-900">
            <MapPin className="h-3 w-3 text-blue-500" />
            <span>Location: Auto-detected</span>
          </div>
          <div className="flex items-center gap-1 p-2 rounded bg-gray-50 dark:bg-gray-900">
            <Clock className="h-3 w-3 text-amber-500" />
            <span>Response: 4-6 min</span>
          </div>
          <div className="flex items-center gap-1 p-2 rounded bg-gray-50 dark:bg-gray-900">
            <Users className="h-3 w-3 text-green-500" />
            <span>Units: 3 assigned</span>
          </div>
          <div className="flex items-center gap-1 p-2 rounded bg-gray-50 dark:bg-gray-900">
            <AlertTriangle className="h-3 w-3 text-red-500" />
            <span>Priority: HIGH</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button 
            onClick={handleDispatch}
            disabled={dispatchStatus === 'dispatched' || !emergencyType || !responseAction}
            className="w-full"
            variant={dispatchStatus === 'dispatched' ? 'outline' : 'default'}
          >
            {dispatchStatus === 'dispatched' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Units Dispatched
              </>
            ) : dispatchStatus === 'dispatching' ? (
              <>
                <Radio className="h-4 w-4 mr-2 animate-pulse" />
                Dispatching Units...
              </>
            ) : (
              <>
                <Radio className="h-4 w-4 mr-2" />
                Dispatch Emergency Response
              </>
            )}
          </Button>

          {dispatchStatus === 'dispatched' && (
            <div className="text-center p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
              <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                Emergency units have been dispatched successfully!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}