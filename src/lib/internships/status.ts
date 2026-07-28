export const APPLICATION_STATUSES = [
  "saved",
  "applied",
  "online_assessment",
  "phone_screen",
  "onsite",
  "offer",
  "rejected",
  "withdrawn",
  "ghosted",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export interface StatusMeta {
  id: ApplicationStatus;
  label: string;
  /** Stages that represent forward progress, shown in the funnel strip. */
  inFunnel: boolean;
  className: string;
}

export const STATUS_META: Record<ApplicationStatus, StatusMeta> = {
  saved: {
    id: "saved",
    label: "Saved",
    inFunnel: true,
    className: "bg-muted text-muted-foreground",
  },
  applied: {
    id: "applied",
    label: "Applied",
    inFunnel: true,
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  online_assessment: {
    id: "online_assessment",
    label: "Online assessment",
    inFunnel: true,
    className: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  },
  phone_screen: {
    id: "phone_screen",
    label: "Phone screen",
    inFunnel: true,
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  onsite: {
    id: "onsite",
    label: "Final round",
    inFunnel: true,
    className: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  },
  offer: {
    id: "offer",
    label: "Offer",
    inFunnel: true,
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    id: "rejected",
    label: "Rejected",
    inFunnel: false,
    className: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  withdrawn: {
    id: "withdrawn",
    label: "Withdrawn",
    inFunnel: false,
    className: "bg-muted text-muted-foreground",
  },
  ghosted: {
    id: "ghosted",
    label: "Ghosted",
    inFunnel: false,
    className: "bg-muted text-muted-foreground",
  },
};

export const FUNNEL_STAGES = APPLICATION_STATUSES.filter(
  (s) => STATUS_META[s].inFunnel,
);

export const TIER_LABELS: Record<number, string> = {
  1: "Reach",
  2: "Target",
  3: "Volume",
};
