import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, FileText, CreditCard,
  Pill, FlaskConical, UserCog, Settings, Heart, ChevronLeft,
  ChevronRight, FileEdit, LogOut, Crown, Menu, X, BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";

type AppRole = "admin" | "medecin" | "secretaire" | "infirmier";

interface NavItem {
  icon: typeof LayoutDashboard;
  label: string;
  path: string;
  roles?: AppRole[];
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
  { icon: Calendar, label: "Rendez-vous", path: "/appointments" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: FileText, label: "Dossiers médicaux", path: "/medical-records" },
  { icon: FileEdit, label: "Ordonnances", path: "/prescriptions", roles: ["admin", "medecin"] },
  { icon: CreditCard, label: "Paiements", path: "/payments", roles: ["admin", "secretaire"] },
  { icon: FlaskConical, label: "Laboratoire", path: "/laboratory", roles: ["admin", "medecin", "infirmier"] },
  { icon: Pill, label: "Pharmacie", path: "/pharmacy", roles: ["admin", "medecin", "infirmier"] },
  { icon: BarChart3, label: "Rapports", path: "/reports", roles: ["admin", "medecin"] },
  { icon: UserCog, label: "Personnel", path: "/staff", roles: ["admin"] },
  { icon: Crown, label: "Abonnements", path: "/subscriptions", roles: ["admin"] },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

const SidebarNav = ({ onNavigate }: { onNavigate?: () => void }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, roles } = useAuth();

  const handleLogout = async () => {
    await signOut();
    onNavigate?.();
    navigate("/login");
  };

  const visibleItems = navItems.filter((item) => {
    if (!item.roles) return true;
    if (roles.length === 0) return true; // no roles = show all (demo)
    return item.roles.some((r) => roles.includes(r));
  });

  return (
    <>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {visibleItems.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>
    </>
  );
};

const DesktopLogout = ({ collapsed }: { collapsed: boolean }) => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };
  return (
    <div className="p-2 border-t border-sidebar-border">
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
      >
        <LogOut className="w-5 h-5 flex-shrink-0" />
        {!collapsed && <span>Déconnexion</span>}
      </button>
    </div>
  );
};

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();
  const { roles } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Mobile: hamburger + sheet
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border shadow-md"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar text-sidebar-foreground">
            <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
            <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
              <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
                <Heart className="w-6 h-6 text-primary fill-primary" />
                <span>Gesclic</span>
              </Link>
            </div>
            <SidebarNav onNavigate={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: fixed sidebar
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span>Gesclic</span>
          </Link>
        )}
        {collapsed && <Heart className="w-6 h-6 text-primary fill-primary mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.filter((item) => {
          if (!item.roles) return true;
          if (roles.length === 0) return true;
          return item.roles.some((r) => roles.includes(r));
        }).map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <DesktopLogout collapsed={collapsed} />
    </aside>
  );
};

export default AppSidebar;
