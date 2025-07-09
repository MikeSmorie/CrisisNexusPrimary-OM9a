import { useUser } from "@/hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { ExecutivePrivileges } from "@/components/executive-privileges";
import { 
  Grid3X3, 
  User, 
  CreditCard, 
  LogOut,
  Crown,
  Shield,
  Users,
  Download
} from "lucide-react";

interface Plan {
  id: number;
  name: string;
  price: number;
}

const moduleItems = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  name: `Module ${i + 1}`,
  description: `Configure and customize Module ${i + 1} functionality`,
  href: `/module/${i + 1}`,
  icon: Grid3X3
}));

function getRoleIcon(role: string) {
  switch (role) {
    case 'supergod':
      return <Crown className="h-4 w-4 text-red-500" />;
    case 'admin':
      return <Shield className="h-4 w-4 text-blue-500" />;
    default:
      return <Users className="h-4 w-4 text-green-500" />;
  }
}

export default function Dashboard() {
  const { user } = useUser();
  const [, navigate] = useLocation();

  const handleExportProfile = async () => {
    try {
      const response = await fetch("/api/user/export", {
        method: "GET",
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "omega-user-profile.txt";
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        console.error("Failed to export user profile");
      }
    } catch (error) {
      console.error("Error exporting user profile:", error);
    }
  };

  const { data: currentPlan } = useQuery<Plan>({
    queryKey: ["/api/subscription/current-plan"],
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="content-inner">
      {/* Welcome Section */}
      <div className="module-section">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold tracking-tight text-contained text-gray-900 dark:text-white">
              Welcome back, {user.username}
            </h1>
            <p className="text-contained text-gray-600 dark:text-gray-400">
              Access your modules and manage your account
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0">
            <Button 
              onClick={handleExportProfile}
              variant="outline"
              className="button-text-safe flex items-center gap-2"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Download Profile</span>
            </Button>
            <Badge variant="outline" className="badge-contained">
              {getRoleIcon(user.role)}
              <span className="text-truncate-safe">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</span>
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Executive Privileges for Admin/Supergod */}
      <ExecutivePrivileges />

      {/* Account Overview */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe">Account Status</h3>
              <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold text-contained">Active</div>
            <p className="text-xs text-muted-foreground text-contained">
              Account in good standing
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe">Department</h3>
              <CreditCard className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold text-contained">
              {user.department || 'Emergency Management'}
            </div>
            <p className="text-xs text-muted-foreground text-contained">
              Current assignment
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe">Access Level</h3>
              <div className="flex-shrink-0">{getRoleIcon(user.role)}</div>
            </div>
            <div className="text-2xl font-bold text-contained">
              {user.role === 'supergod' ? 'Full' : user.role === 'admin' ? 'Admin' : 'Standard'}
            </div>
            <p className="text-xs text-muted-foreground text-contained">
              System permissions
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="module-card">
        <div className="card-content-safe">
          <h3 className="text-lg font-semibold text-contained mb-2">Quick Actions</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-contained mb-4">
            Manage your account and access key features
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/profile')} variant="outline" className="button-text-safe">
              <User className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Edit Profile</span>
            </Button>
            {(user.role === 'admin' || user.role === 'supergod') && (
              <Button onClick={() => navigate('/admin')} variant="outline" className="button-text-safe">
                <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Admin Panel</span>
              </Button>
            )}
            {user.role === 'supergod' && (
              <Button onClick={() => navigate('/supergod')} variant="outline" className="button-text-safe">
                <Crown className="mr-2 h-4 w-4 flex-shrink-0" />
                <span>Supergod Panel</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="module-section">
        <h2 className="text-2xl font-bold tracking-tight mb-6 text-contained text-gray-900 dark:text-white">Available Modules</h2>
        <div className="grid-cards">
          {moduleItems.map((module) => {
            const Icon = module.icon;
            return (
              <div key={module.id} className="module-card hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(module.href)}>
                <div className="card-content-compact">
                  <div className="flex items-center justify-between mb-3">
                    <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <Badge variant="secondary" className="badge-contained">Ready</Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-contained text-gray-900 dark:text-white mb-2">{module.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-multiline-safe mb-4">
                    {module.description}
                  </p>
                  <Button className="w-full button-text-safe" variant="outline" size="sm">
                    Configure
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}