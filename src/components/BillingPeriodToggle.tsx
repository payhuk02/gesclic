import { BILLING_PERIODS, type BillingPeriodMonths } from "@/lib/clinic-plans";
import { cn } from "@/lib/utils";

interface BillingPeriodToggleProps {
  value: BillingPeriodMonths;
  onChange: (months: BillingPeriodMonths) => void;
  className?: string;
}

/**
 * Acoschool-style pill toggle: selecting a period recalculates plan totals
 * via parent state + computePlanTotal().
 */
export function BillingPeriodToggle({ value, onChange, className }: BillingPeriodToggleProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Période de facturation"
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-2 sm:gap-2.5",
        className,
      )}
    >
      {BILLING_PERIODS.map((period) => {
        const selected = value === period.months;
        const label =
          period.discountPercent > 0
            ? `${period.label} (−${period.discountPercent} %)`
            : period.label;

        return (
          <button
            key={period.months}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(period.months)}
            className={cn(
              "rounded-full px-4 sm:px-5 py-2 sm:py-2.5 text-sm font-semibold transition-all duration-200",
              "border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
              selected
                ? "border-transparent bg-[#0B1F3A] text-white shadow-md dark:bg-primary dark:text-primary-foreground"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-border dark:bg-card dark:text-muted-foreground dark:hover:bg-secondary dark:hover:text-foreground",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
