/**
 * Barrel for the primitive layer.
 *
 *   import { Button, Card, Input, StatusBadge } from "@/components/ui";
 *
 * Screens should import from here, never from the individual files, so the
 * internal file layout stays free to change.
 */

export { default as Button } from "./Button";
export { default as Card, CardHeader, CardBody, CardFooter } from "./Card";
export { default as Input, Textarea, Select, FieldShell } from "./Field";
export {
  default as Badge,
  StatusBadge,
  stageMeta,
  APPLICATION_STAGES,
  TERMINAL_STAGES,
} from "./Badge";
export { default as Modal } from "./Modal";
export { default as Table } from "./Table";
export { default as Tabs } from "./Tabs";
export { default as Avatar, AvatarGroup } from "./Avatar";
export { default as Skeleton, SkeletonText, SkeletonCard, SkeletonGrid } from "./Skeleton";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export { default as StatCard, useCountUp } from "./StatCard";
export { default as Pagination } from "./Pagination";
export { default as Stepper, StatusTimeline } from "./Stepper";
export { default as Menu, MenuItem, MenuLabel, MenuSeparator } from "./Menu";
export { default as ThemeToggle } from "./ThemeToggle";
