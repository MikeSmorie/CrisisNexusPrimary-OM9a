import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Grid3X3, 
  ArrowLeft,
  Package,
  Lock
} from "lucide-react";
import DisasterManagementModule from "@/pages/disaster-management-module";
import IncidentManagement from "@/pages/incident-management";
import EmergencyAlerts from "@/pages/emergency-alerts";
import ResourceDeployment from "@/pages/resource-deployment";
import CommunicationCenter from "@/pages/communication-center";
import ForensicDashboard from "@/pages/forensic-dashboard";
import ClearanceManagement from "@/pages/clearance-management";

interface ModuleViewProps {
  moduleId?: string;
}

export default function ModuleView({ moduleId }: ModuleViewProps) {
  const params = useParams();
  const [, navigate] = useLocation();
  const id = moduleId || params.id;
  
  // Disaster Management System - Distributed Modules
  switch (id) {
    case "1":
      return <IncidentManagement />;
    case "2":
      return <EmergencyAlerts />;
    case "3":
      return <ResourceDeployment />;
    case "4":
      return <CommunicationCenter />;
    case "5":
      return <ForensicDashboard />;
    case "6":
      return <ClearanceManagement />;
    case "9":
      return <DisasterManagementModule />;
    default:
      // Continue with original empty module logic
      break;
  }
  
  // Module name logic - show "Unnamed Module" if no name is set
  const moduleName = `Module ${id}`;
  const displayName = moduleName || "Unnamed Module";

  return (
    <div className="content-inner">
      {/* Header Section */}
      <div className="module-section">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="icon-text-safe flex-1 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="flex-shrink-0">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Button>
            <Separator orientation="vertical" className="h-6 mx-4 flex-shrink-0" />
            <div className="icon-text-safe min-w-0">
              <Grid3X3 className="h-6 w-6 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <h1 className="text-3xl font-bold tracking-tight text-contained text-gray-900 dark:text-white">
                Module #{id}
              </h1>
            </div>
          </div>
          
          <Badge variant="outline" className="badge-contained flex-shrink-0">
            Inactive
          </Badge>
        </div>
      </div>

      {/* Subheading */}
      <div className="module-section">
        <p className="text-xl text-contained text-gray-600 dark:text-gray-400">
          This module is currently inactive.
        </p>
      </div>

      {/* Body Text */}
      <div className="module-card">
        <div className="card-content-safe">
          <div className="icon-text-safe mb-4">
            <Package className="h-5 w-5 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-contained text-gray-900 dark:text-white">
              Module Information
            </h3>
          </div>
          <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 text-contained text-gray-700 dark:text-gray-300 italic">
            "Modules are sealed functional containers assigned by the system developer. This space is reserved for application logic, tools, or features to be added in future phases. Users cannot build or modify modules directly."
          </blockquote>
        </div>
      </div>

      {/* Module Content Area (Reserved) */}
      <div className="module-card">
        <div className="card-content-safe">
          <div className="icon-text-safe mb-2">
            <Lock className="h-5 w-5 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-contained text-gray-900 dark:text-white">
              Module Content Area (Reserved)
            </h3>
          </div>
          <p className="text-contained text-gray-600 dark:text-gray-400 mb-6">
            This space is reserved for system developer assignment
          </p>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center bg-gray-50 dark:bg-gray-900 force-contain">
            <Grid3X3 className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4 flex-shrink-0" />
            <h4 className="text-lg font-semibold mb-2 text-contained text-gray-900 dark:text-white">
              {displayName}
            </h4>
            <p className="text-contained text-gray-600 dark:text-gray-400 mb-4">
              This module container is awaiting developer assignment.<br />
              Functional components will be activated by the system administrator.
            </p>
            <div className="icon-text-safe justify-center text-sm text-gray-500 dark:text-gray-400">
              <Lock className="h-4 w-4 flex-shrink-0" />
              <span className="text-contained">Read-Only Access</span>
            </div>
          </div>
        </div>
      </div>

      {/* Module Status */}
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe text-gray-900 dark:text-white">Status</h3>
              <Grid3X3 className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold text-contained text-gray-900 dark:text-white">Inactive</div>
            <p className="text-xs text-contained text-gray-600 dark:text-gray-400">
              Awaiting system developer activation
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe text-gray-900 dark:text-white">Assignment</h3>
              <Package className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold text-contained text-gray-900 dark:text-white">Pending</div>
            <p className="text-xs text-contained text-gray-600 dark:text-gray-400">
              No functional components assigned
            </p>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="dashboard-card-content">
            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium text-truncate-safe text-gray-900 dark:text-white">Access</h3>
              <Lock className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
            </div>
            <div className="text-2xl font-bold text-contained text-gray-900 dark:text-white">Read-Only</div>
            <p className="text-xs text-contained text-gray-600 dark:text-gray-400">
              User modification not permitted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}