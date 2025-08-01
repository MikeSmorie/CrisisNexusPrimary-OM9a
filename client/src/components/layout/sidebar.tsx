import { useState } from "react";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";
import { useAdmin } from "@/contexts/admin-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Settings, 
  Grid3X3, 
  User, 
  CreditCard,
  Shield,
  Crown,
  KeyRound,
  FileText,
  Gift,
  BarChart3,
  Brain,
  ChevronRight,
  ChevronDown,
  HeadphonesIcon,
  AlertTriangle,
  MessageSquare,
  Users,
  Radio,
  Lock,
  Database,
  Languages
} from "lucide-react";

// Only show implemented disaster management modules
const moduleItems = [
  {
    id: 1,
    name: "Incident Management",
    href: "/module/1",
    icon: AlertTriangle,
    description: "Active incidents and reporting"
  },
  {
    id: 2,
    name: "Emergency Alerts",
    href: "/module/2", 
    icon: MessageSquare,
    description: "Alert broadcasting and management"
  },
  {
    id: 3,
    name: "Resource Deployment", 
    href: "/module/3",
    icon: Users,
    description: "Personnel and equipment tracking"
  },
  {
    id: 4,
    name: "Communication Center",
    href: "/module/4",
    icon: Radio,
    description: "5-tier failover communication system"
  },
  {
    id: 5,
    name: "Forensic Dashboard",
    href: "/module/5",
    icon: FileText,
    description: "Immutable audit logging"
  },
  {
    id: 6,
    name: "Clearance Management",
    href: "/module/6",
    icon: Lock,
    description: "Military-grade access control"
  },
  {
    id: 9,
    name: "Emergency Operations",
    href: "/module/9",
    icon: Shield,
    description: "Emergency Operations Center overview"
  },
  {
    id: 'translation',
    name: "Translation Demo",
    href: "/translation-demo",
    icon: Languages,
    description: "CrisisNexus multilingual helpline simulation"
  }
];

// Special Omega-10 Audit Module
const auditModule = {
  id: 10,
  name: "Omega-10 Audit",
  href: "/module/omega-10",
  icon: FileText,
  restricted: true
};

// Admin dropdown items (includes all main navigation)
const adminDropdownItems = [
  {
    name: "Incident Management",
    href: "/",
    icon: Home
  },
  {
    name: "Profile", 
    href: "/profile",
    icon: User
  },
  {
    name: "AI Support",
    href: "/support-ai",
    icon: HeadphonesIcon
  },
  {
    name: "Two-Factor Auth",
    href: "/2fa",
    icon: KeyRound
  }
];

const adminItems = [
  {
    name: "Admin Panel",
    href: "/admin",
    icon: Shield
  },
  {
    name: "User Management",
    href: "/admin/users",
    icon: User
  },
  {
    name: "Logs",
    href: "/admin/logs",
    icon: Settings
  }
];

const supergodItems = [
  {
    name: "Supergod Panel",
    href: "/supergod",
    icon: Crown
  },
  {
    name: "Audit Logs",
    href: "/admin/audit",
    icon: Shield
  },
  {
    name: "AI Analytics",
    href: "/admin/analytics",
    icon: BarChart3
  }
];

const systemControlItems = [
  {
    name: "AI Model Routing",
    href: "/admin/model-router",
    icon: Brain
  }
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useUser();
  const { isSupergod } = useAdmin();
  const [adminExpanded, setAdminExpanded] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const isAdminSectionActive = () => {
    return adminDropdownItems.some(item => isActive(item.href));
  };

  return (
    <div className="flex h-full w-64 flex-col border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">DisasterMng-1-OM9</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Emergency Operations</p>
          </div>
          {isSupergod && (
            <Badge variant="destructive" className="text-xs px-2 py-1">
              <Crown className="h-3 w-3 mr-1" />
              SuperGod
            </Badge>
          )}
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3">
        {/* Admin Dropdown Section */}
        <div className="space-y-1">
          <Button
            variant={isAdminSectionActive() ? "secondary" : "ghost"}
            className={cn(
              "w-full justify-start text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800",
              isAdminSectionActive() && "bg-gray-100 dark:bg-gray-800"
            )}
            onClick={() => setAdminExpanded(!adminExpanded)}
          >
            {adminExpanded ? (
              <ChevronDown className="mr-2 h-4 w-4" />
            ) : (
              <ChevronRight className="mr-2 h-4 w-4" />
            )}
            <Shield className="mr-2 h-4 w-4" />
            Admin
          </Button>
          
          {adminExpanded && (
            <div className="ml-6 space-y-1">
              {adminDropdownItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                    )}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-3 w-3" />
                      {item.name}
                    </a>
                  </Button>
                );
              })}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <div className="space-y-1">
          <h3 className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            Modules
          </h3>
          {moduleItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.href}
                variant={isActive(item.href) ? "secondary" : "ghost"}
                size="sm"
                className={cn(
                  "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                  isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                )}
                asChild
              >
                <a href={item.href}>
                  <Icon className="mr-2 h-3 w-3" />
                  {item.name}
                </a>
              </Button>
            );
          })}
          
          {/* Omega-10 Audit Module - Admin/Supergod Only */}
          {(user?.role === "admin" || user?.role === "supergod") && (
            <Button
              variant={isActive(auditModule.href) ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "w-full justify-start text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/20",
                isActive(auditModule.href) && "bg-red-50 dark:bg-red-950/20"
              )}
              asChild
            >
              <a href={auditModule.href}>
                <FileText className="mr-2 h-3 w-3" />
                {auditModule.name}
              </a>
            </Button>
          )}
        </div>

        {(user?.role === "admin" || user?.role === "supergod") && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <h3 className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                Administration
              </h3>
              {adminItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                    )}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-3 w-3" />
                      {item.name}
                    </a>
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {user?.role === "supergod" && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              <h3 className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                Supergod
              </h3>
              {supergodItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
                      isActive(item.href) && "bg-gray-100 dark:bg-gray-800"
                    )}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-3 w-3" />
                      {item.name}
                    </a>
                  </Button>
                );
              })}
            </div>
            
            <Separator className="my-4" />
            <div className="space-y-1">
              <h3 className="px-2 py-1 text-sm font-medium text-gray-600 dark:text-gray-400">
                System Controls
              </h3>
              {systemControlItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Button
                    key={item.href}
                    variant={isActive(item.href) ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "w-full justify-start text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/20",
                      isActive(item.href) && "bg-blue-50 dark:bg-blue-950/20"
                    )}
                    asChild
                  >
                    <a href={item.href}>
                      <Icon className="mr-2 h-3 w-3" />
                      {item.name}
                    </a>
                  </Button>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>
      
      {/* Version Footer */}
      <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Omega-9-Clean-Core v1.0.0
        </div>
      </div>
    </div>
  );
}