import { formatNumber } from "./utils/format";

export default function StatCard({
  label,
  value,
  icon: Icon,
  loading,
  isRefreshing = false,
}) {
  return (
    <div className="group relative overflow-hidden bg-cream border border-primary/10 rounded-2xl p-4 transition-all hover:shadow-soft hover:-translate-y-0.5">
      {/* decorative gold glow */}
      <div className="absolute w-20 h-20 transition-opacity rounded-full opacity-0 pointer-events-none -top-8 -right-8 bg-gold/15 blur-2xl group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-wider text-primary/50 font-medium leading-tight">
          {label}
        </p>
        {Icon && (
          <span className="grid w-8 h-8 transition-colors rounded-lg bg-mint place-items-center text-primary shrink-0 group-hover:bg-gold/30">
            <Icon size={14} />
          </span>
        )}
      </div>

      <div className="relative flex items-center justify-between mt-3">
        <p className="text-2xl tracking-tight font-display sm:text-3xl text-primary tabular-nums">
          {loading ? (
            <span className="inline-block w-20 rounded-lg h-7 animate-shimmer bg-primary/10" />
          ) : (
            <span
              className={isRefreshing ? "opacity-70 transition-opacity" : ""}
            >
              {formatNumber(value)}
            </span>
          )}
        </p>

        {isRefreshing && (
          <span
            className="w-2 h-2 rounded-full bg-gold animate-pulse"
            title="Updating..."
          />
        )}
      </div>
    </div>
  );
}
