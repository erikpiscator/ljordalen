import { cn } from "@/lib/utils";

/** Small cabin + pine mark used in the nav and on auth screens. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={cn("size-6", className)}
      fill="none"
      aria-hidden
    >
      {/* roof */}
      <path d="M4 11 L12 4 L20 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* walls */}
      <path d="M6 10.5 V19 H18 V10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      {/* door */}
      <path d="M10.5 19 V14 H13.5 V19" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {/* snow / star */}
      <circle cx="12" cy="2.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function BrandWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-semibold tracking-tight", className)}>
      <BrandMark className="size-5 text-primary" />
      Hoelskogen 52
    </span>
  );
}
