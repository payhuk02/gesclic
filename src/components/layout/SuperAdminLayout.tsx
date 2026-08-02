import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSuperAdmin } from "@/contexts/SuperAdminContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Building2,
  Users,
  BarChart3,
  Settings,
  CreditCard,
  Activity,
  Shield,
  LogOut,
  Menu,
  X,
  Crown,
  FileText,
  Flag,
  Server,
  Mail,
  MessageSquare,
  Megaphone,
  Database,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

interface SuperAdminNavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  badge?: string;
}

const superAdminNavItems: SuperAdminNavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/super-admin" },
  { icon: Building2, label: "Clinics", path: "/super-admin/clinics", badge: "Manage" },
  { icon: Users, label: "Platform Users", path: "/super-admin/users" },
  { icon: BarChart3, label: "Analytics", path: "/super-admin/analytics" },
  { icon: CreditCard, label: "Billing", path: "/super-admin/billing" },
  { icon: Activity, label: "Activity Logs", path: "/super-admin/activity" },
  { icon: Shield, label: "Security Center", path: "/super-admin/security" },
  { icon: FileText, label: "Audit Logs", path: "/super-admin/audit" },
  { icon: Flag, label: "Feature Flags", path: "/super-admin/feature-flags" },
  { icon: Server, label: "System Health", path: "/super-admin/health" },
  { icon: Mail, label: "Email Templates", path: "/super-admin/email" },
  { icon: MessageSquare, label: "Support Tickets", path: "/super-admin/support" },
  { icon: Megaphone, label: "Announcements", path: "/super-admin/announcements" },
  { icon: Database, label: "Backup & Restore", path: "/super-admin/backup" },
  { icon: Key, label: "API Management", path: "/super-admin/api" },


  { icon: Settings, label: "Platform Settings", path: "/super-admin/settings" },
];

interface SuperAdminLayoutProps {
  children: ReactNode;
}

const SuperAdminLayout = ({ children }: SuperAdminLayoutProps) => {
  const { isSuperAdmin, profile, loading } = useSuperAdmin();
  const { signOut } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnexion réussie");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Accès Refusé</h1>
          <p className="text-muted-foreground mb-6">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
          <Button asChild>
            <Link to="/dashboard">Retour au Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base sm:text-lg">Gesclic</h1>
            <p className="text-[10px] sm:text-xs text-slate-400">Super Admin</p>
          </div>
        </div>
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1">
        {superAdminNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== "/super-admin" && location.pathname.startsWith(item.path));
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="text-[10px] sm:text-xs">
                  {item.badge}
                </Badge>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Info */}
      <div className="p-3 sm:p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[10px] sm:text-sm font-bold">
            {profile?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "SA"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-white truncate">
              {profile?.full_name || "Super Admin"}
            </p>
            <p className="text-[10px] sm:text-xs text-slate-400 truncate">{profile?.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800 text-xs sm:text-sm"
          onClick={handleSignOut}
        >
          <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Déconnexion
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={cn(
            "fixed left-0 top-0 z-50 h-screen bg-slate-950 text-white border-r border-slate-800 transition-all duration-300",
            sidebarOpen ? "w-64" : "w-16"
          )}
        >
          <div className="flex flex-col h-full">
            <SidebarContent />
          </div>
        </aside>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-80 p-0 bg-slate-950 text-white h-full flex flex-col">
              <SheetTitle className="sr-only">Menu Super Admin</SheetTitle>
              <SidebarContent />
            </SheetContent>
          </Sheet>
        </>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "min-h-screen transition-all duration-300",
          !isMobile && sidebarOpen ? "lg:ml-64" : !isMobile ? "ml-0" : "ml-0"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between px-4 sm:px-6 h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => (isMobile ? setMobileOpen(true) : setSidebarOpen(!sidebarOpen))}
              >
                <Menu className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <div>
                <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">
                  {superAdminNavItems.find(
                    (item) =>
                      item.path === location.pathname ||
                      (item.path !== "/super-admin" && location.pathname.startsWith(item.path))
                  )?.label || "Super Admin"}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20 text-[10px] sm:text-xs">
                <Shield className="w-3 h-3 mr-1" />
                <span className="hidden sm:inline">Super Admin</span>
              </Badge>
              <Link to="/dashboard">
                <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                  <Building2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Vue Clinique</span>
                </Button>
              </Link>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
