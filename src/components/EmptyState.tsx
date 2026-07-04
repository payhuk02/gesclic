import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  tips?: string[];
  action?: React.ReactNode;
  secondary?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

const EmptyState = ({ icon: Icon, title, description, tips, action, secondary, className, compact }: EmptyStateProps) => {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6", compact ? "py-10" : "py-16", className)}>
      <div className="relative mb-5">
        <div className="absolute inset-0 blur-2xl gradient-hero opacity-20 rounded-full" aria-hidden />
        <div className="relative w-16 h-16 rounded-2xl gradient-hero flex items-center justify-center shadow-elevated">
          <Icon className="w-7 h-7 text-primary-foreground" strokeWidth={1.75} />
        </div>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1.5">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-4 leading-relaxed">{description}</p>
      )}
      {tips && tips.length > 0 && (
        <ul className="text-xs text-muted-foreground/90 max-w-md mb-5 space-y-1.5 text-left">
          {tips.map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-primary shrink-0" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      )}
      {(action || secondary) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondary}
        </div>
      )}
    </div>
  );
};

export default EmptyState;