import { cn } from "@/lib/cn";

const variants = {
  default: "badge",
  success: "badge badge-success",
  muted: "badge badge-muted",
  brand: "badge badge-brand",
} as const;

type BadgeProps = {
  variant?: keyof typeof variants;
  dot?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ variant = "default", dot, className, children }: BadgeProps) {
  return (
    <span className={cn(variants[variant], className)}>
      {dot && (
        <span
          className={cn(
            "badge-dot",
            variant === "success" && "badge-dot-success",
            variant === "muted" && "badge-dot-muted",
            variant === "brand" && "badge-dot-brand",
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
