import { ReactNode, useState, useEffect } from "react";
import AppSidebar from "./AppSidebar";
import MobileBottomNav from "./MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Bot, Search } from "lucide-react";
import MedicalAIAssistant from "@/components/MedicalAIAssistant";
import GlobalSearch from "@/components/GlobalSearch";
import NotificationBell from "@/components/NotificationBell";
import ClinicSwitcher from "@/components/layout/ClinicSwitcher";

const AppLayout = ({ children, title }: { children: ReactNode; title: string }) => {
  const isMobile = useIsMobile();
  const [showAI, setShowAI] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

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
            {isMobile && <div className="w-10" />}
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
            {/* Desktop-only AI button */}
            <button
              onClick={() => setShowAI(!showAI)}
              className="hidden sm:flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
              aria-label="Assistant IA"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden sm:inline">Assistant IA</span>
            </button>
          </div>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
      {showAI && <MedicalAIAssistant onClose={() => setShowAI(false)} />}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
};

export default AppLayout;
