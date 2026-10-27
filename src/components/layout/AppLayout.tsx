import { ReactNode, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Search } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import ClinicSwitcher from "@/components/layout/ClinicSwitcher";
import { useClinic } from "@/contexts/ClinicContext";
import { getTrialDaysRemaining } from "@/lib/clinic-plans";

const AppLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const isMobile = useIsMobile();
  const [searchOpen, setSearchOpen] = useState(false);
  const { trialActive, activeClinic } = useClinic();
  const trialDaysLeft = getTrialDaysRemaining(activeClinic?.trial_ends_at);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <MobileBottomNav />
      <div className={isMobile ? "pl-0 pb-20" : "lg:pl-64 pl-16"}>
        <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30">
          <div className="flex items-center">
            {isMobile && <div className="w-16" />}
            <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <ClinicSwitcher />
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg border border-border bg-secondary/50 hover:bg-secondary transition-colors text-sm text-muted-foreground"
              aria-label="Rechercher"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Rechercher...</span>
              <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </button>
            <NotificationBell />
          </div>
        </header>
        {trialActive && trialDaysLeft !== null && (
          <div className="mx-4 sm:mx-6 mt-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p className="text-foreground">
              Essai Pro : <span className="font-semibold">{trialDaysLeft} jour{trialDaysLeft > 1 ? "s" : ""}</span> restant{trialDaysLeft > 1 ? "s" : ""}.
            </p>
            <Link to="/subscriptions" className="text-primary font-medium hover:underline shrink-0">
              Choisir un abonnement
            </Link>
          </div>
        )}
        <main className="p-4 sm:p-6">{children}</main>
      </div>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default AppLayout;
