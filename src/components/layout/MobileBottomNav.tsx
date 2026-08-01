import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Video, Menu, X, LogOut, Heart, Bot,
  FileText, FileEdit, CreditCard, FlaskConical, Pill, BarChart3,
  Shield, Puzzle, Key, Workflow, Globe, UserCog, Crown, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import MedicalAIAssistant from "@/components/MedicalAIAssistant";

interface NavItem {
  icon: any;
  label: string;
  path: string;
}

const mobileNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Accueil", path: "/dashboard" },
  { icon: Calendar, label: "RDV", path: "/appointments" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: Video, label: "Télé", path: "/telemedicine" },
];

const allNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Tableau de bord", path: "/dashboard" },
  { icon: Calendar, label: "Rendez-vous", path: "/appointments" },
  { icon: Users, label: "Patients", path: "/patients" },
  { icon: FileText, label: "Dossiers médicaux", path: "/medical-records" },
  { icon: FileEdit, label: "Ordonnances", path: "/prescriptions" },
  { icon: CreditCard, label: "Paiements", path: "/payments" },
  { icon: FlaskConical, label: "Laboratoire", path: "/laboratory" },
  { icon: Pill, label: "Pharmacie", path: "/pharmacy" },
  { icon: BarChart3, label: "Rapports", path: "/reports" },
  { icon: Video, label: "Télémédecine", path: "/telemedicine" },
  { icon: Shield, label: "Sécurité", path: "/security" },
  { icon: BarChart3, label: "Analytics Avancés", path: "/advanced-analytics" },
  { icon: Puzzle, label: "Intégrations", path: "/integrations" },
  { icon: Key, label: "API Platform", path: "/api-platform" },
  { icon: Workflow, label: "Workflows", path: "/workflow-automation" },
  { icon: Globe, label: "Webhooks", path: "/webhooks" },
  { icon: UserCog, label: "Personnel", path: "/staff" },
  { icon: Crown, label: "Abonnements", path: "/subscriptions" },
  { icon: Settings, label: "Paramètres", path: "/settings" },
];

const MobileBottomNav = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();

  if (!isMobile) return null;

  const handleLogout = async () => {
    await signOut();
    setSidebarOpen(false);
    navigate("/login");
  };

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border/50 px-2 py-2 pb-safe safe-area-inset-bottom">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {mobileNavItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
                  active
                    ? "text-primary bg-primary/10 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <item.icon className="w-5 h-5 transition-transform duration-200" />
                <span className="text-[11px] font-medium leading-tight">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu Button for full navigation */}
          <button
            onClick={() => setSidebarOpen(true)}
            className={cn(
              "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 min-w-[60px]",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
            aria-label="Menu complet"
          >
            <Menu className="w-5 h-5 transition-transform duration-200" />
            <span className="text-[11px] font-medium leading-tight">Menu</span>
          </button>
        </div>
      </nav>

      {/* Premium Floating AI Button */}
      <button
        onClick={() => setShowAI(!showAI)}
        className={cn(
          "fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center",
          showAI
            ? "bg-primary text-primary-foreground scale-110 shadow-primary/50"
            : "bg-primary/10 text-primary hover:bg-primary/20 hover:scale-105"
        )}
        aria-label="Assistant IA"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Full Menu Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )} 
        onClick={() => setSidebarOpen(false)}
      >
        {/* Sidebar Panel */}
        <div 
          className={cn(
            "fixed left-0 top-0 bottom-0 w-80 h-full bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out flex flex-col",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
            <Link to="/dashboard" className="flex items-center gap-2 font-bold text-lg" onClick={() => setSidebarOpen(false)}>
              <Heart className="w-6 h-6 text-primary fill-primary" />
              <span>Gesclic</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-2">
              {allNavItems.map((item) => {
                const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
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

            <div className="p-2 border-t border-sidebar-border mt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent transition-colors w-full"
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showAI && <MedicalAIAssistant onClose={() => setShowAI(false)} />}
    </>
  );
};

export default MobileBottomNav;
