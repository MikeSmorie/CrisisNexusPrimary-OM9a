import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Radio, Users, MapPin, Settings, BarChart3, MessageSquare, Clock, Home, FileCheck, Lock, LogOut, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import { useToast } from "@/hooks/use-toast";
import { CustomThemeToggle } from "@/components/custom-theme-toggle";
import { FontSizeControls } from "@/components/font-size-controls";
import { GPTSupportAgent } from "@/components/GPTSupportAgent";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: "default" | "destructive" | "outline" | "secondary";
}

const navigationItems: NavItem[] = [
  {
    title: "Operations Center",
    href: "/",
    icon: Home,
  },
  {
    title: "Incident Management",
    href: "/incidents", 
    icon: AlertTriangle,
    badge: "active",
    badgeVariant: "destructive"
  },
  {
    title: "Emergency Alerts",
    href: "/alerts",
    icon: Radio,
    badge: "live",
    badgeVariant: "destructive"
  },
  {
    title: "Resource Deployment",
    href: "/resources",
    icon: Users,
  },
  {
    title: "Communications",
    href: "/communications",
    icon: MessageSquare,
  },
  {
    title: "Situation Map",
    href: "/map",
    icon: MapPin,
  },
  {
    title: "Activity Logs",
    href: "/activity",
    icon: Clock,
  },
  {
    title: "Analytics",
    href: "/analytics", 
    icon: BarChart3,
  },
  {
    title: "Forensic Audit",
    href: "/forensic",
    icon: FileCheck,
    badge: "secure",
    badgeVariant: "secondary"
  },
  {
    title: "Clearance Management",
    href: "/clearance",
    icon: Lock,
    badge: "classified",
    badgeVariant: "destructive"
  },
  {
    title: "System Settings",
    href: "/emergency-settings",
    icon: Settings,
  }
];

export function DisasterNavigation() {
  const [location, navigate] = useLocation();
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [isSupportAgentOpen, setIsSupportAgentOpen] = useState(false);

  // Get real-time counts for badges
  const { data: stats } = useQuery({
    queryKey: ['/api/disaster/stats'],
    queryFn: async () => {
      const response = await fetch('/api/disaster/stats');
      if (!response.ok) return null;
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const handleLogout = async () => {
    try {
      const result = await logout();
      if (!result.ok) {
        throw new Error(result.message);
      }
      toast({
        title: "Logged out successfully",
        description: "See you next time!",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  return (
    <nav className="w-64 bg-red-900 text-white min-h-screen shadow-xl flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-red-800">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-red-300" />
          <div>
            <h1 className="text-xl font-bold">DisasterMng</h1>
            <p className="text-red-300 text-sm">Emergency Response</p>
          </div>
        </div>
      </div>

      {/* Status Indicators */}
      <div className="p-4 border-b border-red-800">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-red-800 rounded p-2 text-center">
            <div className="font-bold text-lg">{stats?.activeIncidents || 0}</div>
            <div className="text-red-300">Active</div>
          </div>
          <div className="bg-red-800 rounded p-2 text-center">
            <div className="font-bold text-lg">{stats?.availableResources || 0}</div>
            <div className="text-red-300">Resources</div>
          </div>
        </div>
        <div className="mt-2 flex items-center space-x-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${stats?.systemStatus === 'operational' ? 'bg-green-400' : 'bg-red-400'}`}></div>
          <span className="text-red-300">
            System {stats?.systemStatus || 'Unknown'}
          </span>
        </div>
      </div>

      {/* Navigation Items */}
      <div className="py-4">
        <div className="px-4 mb-2">
          <h2 className="text-red-300 text-xs font-semibold uppercase tracking-wider">
            Emergency Operations
          </h2>
        </div>
        
        <div className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            
            // Dynamic badge logic based on real data
            let displayBadge = item.badge;
            let badgeVariant = item.badgeVariant;
            
            if (item.href === "/incidents" && stats?.activeIncidents > 0) {
              displayBadge = stats.activeIncidents.toString();
              badgeVariant = "destructive";
            } else if (item.href === "/alerts" && stats?.criticalAlerts > 0) {
              displayBadge = stats.criticalAlerts.toString();
              badgeVariant = "destructive";
            }

            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center space-x-3 px-4 py-3 mx-2 rounded-lg transition-colors",
                    isActive
                      ? "bg-red-700 text-white"
                      : "text-red-200 hover:bg-red-800 hover:text-white"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="flex-1 font-medium">{item.title}</span>
                  {displayBadge && (
                    <Badge 
                      variant={badgeVariant} 
                      className={cn(
                        "text-xs px-2 py-0.5",
                        badgeVariant === "destructive" && "bg-red-600 text-white animate-pulse"
                      )}
                    >
                      {displayBadge}
                    </Badge>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* User Controls */}
      <div className="mt-auto p-4 border-t border-red-800 space-y-3">
        {/* User Info */}
        <div className="bg-red-800 rounded-lg p-3">
          <div className="text-xs text-red-300 mb-1">Logged in as:</div>
          <div className="font-bold text-white">{user?.username}</div>
          <div className="text-xs text-red-300 mt-1">Role: {user?.role || 'user'}</div>
        </div>

        {/* Theme and Font Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CustomThemeToggle />
            <FontSizeControls />
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSupportAgentOpen(true)}
              className="text-red-300 hover:text-white hover:bg-red-700 p-1"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-red-300 hover:text-white hover:bg-red-700 p-1"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-800 rounded-lg p-3">
          <div className="text-xs text-red-300 mb-1">Emergency Hotline</div>
          <div className="font-bold">📞 911</div>
          <div className="text-xs text-red-300 mt-1">24/7 Dispatch Center</div>
        </div>
      </div>

      {/* Support Agent */}
      {isSupportAgentOpen && (
        <GPTSupportAgent 
          onClose={() => setIsSupportAgentOpen(false)}
          onMinimize={() => setIsSupportAgentOpen(false)}
        />
      )}
    </nav>
  );
}