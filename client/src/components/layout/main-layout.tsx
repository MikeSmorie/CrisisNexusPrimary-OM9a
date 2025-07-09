import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { DisasterNavigation } from "./disaster-navigation";
import LoginStatusGuard from "@/components/login-status-guard";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [location] = useLocation();

  // All routes use the standard Omega layout

  // Use original layout for legacy/admin routes
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <LoginStatusGuard>
            {children}
          </LoginStatusGuard>
        </main>
      </div>
    </div>
  );
}