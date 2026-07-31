import { cn } from "../../lib/cn";

/**
 * Loading placeholder.
 *
 * Replaces the app's spinner-for-everything approach. A skeleton that matches
 * the shape of the incoming content keeps the layout from jumping when data
 * lands, which is the actual cost of a centred spinner.
 */
const Skeleton = ({ className, rounded = "rounded-lg", ...rest }) => (
  <div
    aria-hidden="true"
    className={cn(
      "bg-[linear-gradient(90deg,var(--surface-hover)_25%,var(--surface-active)_37%,var(--surface-hover)_63%)]",
      "bg-[length:200%_100%] [animation:shimmer_1.4s_ease-in-out_infinite]",
      rounded,
      className
    )}
    {...rest}
  />
);

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn("space-y-2.5", className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-3.5"
        // Last line short, like real prose — a stack of equal bars reads as a
        // table, not a paragraph.
        style={{ width: i === lines - 1 ? "60%" : "100%" }}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="surface-card p-5 sm:p-6">
    <div className="flex items-center gap-3">
      <Skeleton className="size-11 shrink-0" rounded="rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonText lines={2} className="mt-5" />
    <div className="mt-5 flex gap-2">
      <Skeleton className="h-6 w-20" rounded="rounded-full" />
      <Skeleton className="h-6 w-24" rounded="rounded-full" />
    </div>
  </div>
);

/**
 * A grid of skeleton cards, sized to the layout it is standing in for.
 * `count` should match the page's usual result count so the scroll height
 * does not collapse when the real data arrives.
 */
export const SkeletonGrid = ({ count = 6, className }) => (
  <div
    className={cn("grid gap-5 sm:grid-cols-2 xl:grid-cols-3", className)}
    role="status"
    aria-label="Loading"
  >
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export default Skeleton;
