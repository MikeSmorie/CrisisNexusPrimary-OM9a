import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Shield, 
  Bell, 
  Globe, 
  Radio, 
  Smartphone,
  Lock,
  Users,
  Volume2,
  Eye,
  Save,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

interface SystemSettings {
  notifications: {
    sound: boolean;
    vibration: boolean;
    emergencyAlerts: boolean;
    systemUpdates: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'emergency';
    fontSize: 'small' | 'medium' | 'large';
    highContrast: boolean;
    animations: boolean;
  };
  communication: {
    primaryChannel: string;
    backupChannels: string[];
    encryptionLevel: 'standard' | 'enhanced' | 'maximum';
    offlineMode: boolean;
  };
  location: {
    gpsEnabled: boolean;
    locationSharing: boolean;
    accuracy: 'low' | 'medium' | 'high';
  };
  emergency: {
    quickDial911: boolean;
    panicButton: boolean;
    autoBackup: boolean;
    emergencyContacts: string[];
  };
}

export default function EmergencySettings() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();

  // Mock settings - in real implementation, fetch from API
  const [settings, setSettings] = useState<SystemSettings>({
    notifications: {
      sound: true,
      vibration: true,
      emergencyAlerts: true,
      systemUpdates: false
    },
    display: {
      theme: 'emergency',
      fontSize: 'medium',
      highContrast: false,
      animations: true
    },
    communication: {
      primaryChannel: 'cellular',
      backupChannels: ['satellite', 'radio'],
      encryptionLevel: 'enhanced',
      offlineMode: true
    },
    location: {
      gpsEnabled: true,
      locationSharing: true,
      accuracy: 'high'
    },
    emergency: {
      quickDial911: true,
      panicButton: true,
      autoBackup: true,
      emergencyContacts: ['Command Center', 'Supervisor', 'Emergency Backup']
    }
  });

  // Save settings mutation
  const saveSettings = useMutation({
    mutationFn: async (newSettings: SystemSettings) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Emergency system settings updated successfully",
      });
    }
  });

  const handleSaveSettings = () => {
    saveSettings.mutate(settings);
  };

  const resetToDefaults = () => {
    setSettings({
      notifications: {
        sound: true,
        vibration: true,
        emergencyAlerts: true,
        systemUpdates: false
      },
      display: {
        theme: 'emergency',
        fontSize: 'medium',
        highContrast: false,
        animations: true
      },
      communication: {
        primaryChannel: 'cellular',
        backupChannels: ['satellite', 'radio'],
        encryptionLevel: 'enhanced',
        offlineMode: true
      },
      location: {
        gpsEnabled: true,
        locationSharing: true,
        accuracy: 'high'
      },
      emergency: {
        quickDial911: true,
        panicButton: true,
        autoBackup: true,
        emergencyContacts: ['Command Center', 'Supervisor', 'Emergency Backup']
      }
    });
    toast({
      title: "Settings Reset",
      description: "All settings restored to emergency defaults",
    });
  };

  const updateSettings = (section: keyof SystemSettings, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-red-600 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Emergency System Settings</h1>
              <p className="text-gray-600">Configure your emergency response system preferences</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              onClick={resetToDefaults}
              className="flex items-center space-x-2"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Reset Defaults</span>
            </Button>
            <Button 
              onClick={handleSaveSettings}
              disabled={saveSettings.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              <Save className="h-4 w-4 mr-2" />
              {saveSettings.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </div>
      </div>

      {/* User Info */}
      <Card className="bg-red-50 border-red-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Emergency Personnel: {user?.username}</h3>
              <p className="text-red-700">Role: {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} | Status: Active</p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
              System Operational
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="display">Display</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Sound Alerts</Label>
                    <p className="text-sm text-gray-600">Play audio notifications for alerts and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.sound}
                    onCheckedChange={(value) => updateSettings('notifications', 'sound', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Vibration</Label>
                    <p className="text-sm text-gray-600">Vibrate device for critical notifications</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.vibration}
                    onCheckedChange={(value) => updateSettings('notifications', 'vibration', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Emergency Alerts</Label>
                    <p className="text-sm text-gray-600">Receive critical emergency notifications</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.emergencyAlerts}
                    onCheckedChange={(value) => updateSettings('notifications', 'emergencyAlerts', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">System Updates</Label>
                    <p className="text-sm text-gray-600">Notifications for system maintenance and updates</p>
                  </div>
                  <Switch 
                    checked={settings.notifications.systemUpdates}
                    onCheckedChange={(value) => updateSettings('notifications', 'systemUpdates', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Display Settings */}
        <TabsContent value="display" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Display & Accessibility</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">Theme</Label>
                  <p className="text-sm text-gray-600 mb-2">Choose your interface theme</p>
                  <Select 
                    value={settings.display.theme} 
                    onValueChange={(value) => updateSettings('display', 'theme', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="emergency">Emergency (Recommended)</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Font Size</Label>
                  <p className="text-sm text-gray-600 mb-2">Adjust text size for readability</p>
                  <Select 
                    value={settings.display.fontSize} 
                    onValueChange={(value) => updateSettings('display', 'fontSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large (Emergency)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">High Contrast Mode</Label>
                    <p className="text-sm text-gray-600">Enhanced visibility for emergency situations</p>
                  </div>
                  <Switch 
                    checked={settings.display.highContrast}
                    onCheckedChange={(value) => updateSettings('display', 'highContrast', value)}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Animations</Label>
                    <p className="text-sm text-gray-600">Enable interface animations and transitions</p>
                  </div>
                  <Switch 
                    checked={settings.display.animations}
                    onCheckedChange={(value) => updateSettings('display', 'animations', value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Communication Settings */}
        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Radio className="h-5 w-5" />
                <span>Communication Channels</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-base font-medium">Primary Channel</Label>
                  <p className="text-sm text-gray-600 mb-2">Main communication method</p>
                  <Select 
                    value={settings.communication.primaryChannel} 
                    onValueChange={(value) => updateSettings('communication', 'primaryChannel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cellular">Cellular Network</SelectItem>
                      <SelectItem value="satellite">Satellite</SelectItem>
                      <SelectItem value="radio">Radio Network</SelectItem>
                      <SelectItem value="wifi">Wi-Fi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-base font-medium">Encryption Level</Label>
                  <p className="text-sm text-gray-600 mb-2">Data security level</p>
                  <Select 
                    value={settings.communication.encryptionLevel} 
                    onValueChange={(value) => updateSettings('communication', 'encryptionLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="enhanced">Enhanced (Recommended)</SelectItem>
                      <SelectItem value="maximum">Maximum Security</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Offline Mode</Label>
                  <p className="text-sm text-gray-600">Continue operations without connectivity</p>
                </div>
                <Switch 
                  checked={settings.communication.offlineMode}
                  onCheckedChange={(value) => updateSettings('communication', 'offlineMode', value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Location Settings */}
        <TabsContent value="location" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Smartphone className="h-5 w-5" />
                <span>Location Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">GPS Enabled</Label>
                    <p className="text-sm text-gray-600">Enable GPS for location tracking</p>
                  </div>
                  <Switch 
                    checked={settings.location.gpsEnabled}
                    onCheckedChange={(value) => updateSettings('location', 'gpsEnabled', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Location Sharing</Label>
                    <p className="text-sm text-gray-600">Share location with command center</p>
                  </div>
                  <Switch 
                    checked={settings.location.locationSharing}
                    onCheckedChange={(value) => updateSettings('location', 'locationSharing', value)}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Location Accuracy</Label>
                  <p className="text-sm text-gray-600 mb-2">GPS precision level (affects battery usage)</p>
                  <Select 
                    value={settings.location.accuracy} 
                    onValueChange={(value) => updateSettings('location', 'accuracy', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (Battery Saving)</SelectItem>
                      <SelectItem value="medium">Medium (Balanced)</SelectItem>
                      <SelectItem value="high">High (Emergency Precision)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Emergency Settings */}
        <TabsContent value="emergency" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Emergency Features</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Quick Dial 911</Label>
                    <p className="text-sm text-gray-600">Enable emergency hotline quick access</p>
                  </div>
                  <Switch 
                    checked={settings.emergency.quickDial911}
                    onCheckedChange={(value) => updateSettings('emergency', 'quickDial911', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Panic Button</Label>
                    <p className="text-sm text-gray-600">Emergency panic button for critical situations</p>
                  </div>
                  <Switch 
                    checked={settings.emergency.panicButton}
                    onCheckedChange={(value) => updateSettings('emergency', 'panicButton', value)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Auto Backup</Label>
                    <p className="text-sm text-gray-600">Automatically backup critical data</p>
                  </div>
                  <Switch 
                    checked={settings.emergency.autoBackup}
                    onCheckedChange={(value) => updateSettings('emergency', 'autoBackup', value)}
                  />
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-base font-medium">Emergency Contacts</Label>
                  <p className="text-sm text-gray-600 mb-3">Quick access emergency contact list</p>
                  <div className="space-y-2">
                    {settings.emergency.emergencyContacts.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input value={contact} readOnly className="flex-1" />
                        <Button variant="outline" size="sm">Edit</Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full">
                      Add Emergency Contact
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}