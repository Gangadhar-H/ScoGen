export function formatDate(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function timeAgo(date) {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export const RISK_COLORS = {
  LOW: {
    bg: "bg-green-100",
    text: "text-green-800",
    dot: "bg-green-500",
    border: "border-green-200",
  },
  MEDIUM: {
    bg: "bg-amber-100",
    text: "text-amber-800",
    dot: "bg-amber-500",
    border: "border-amber-200",
  },
  HIGH: {
    bg: "bg-orange-100",
    text: "text-orange-800",
    dot: "bg-orange-500",
    border: "border-orange-200",
  },
  CRITICAL: {
    bg: "bg-red-100",
    text: "text-red-800",
    dot: "bg-red-500",
    border: "border-red-200",
  },
};

export const STATUS_COLORS = {
  DRAFT: { bg: "bg-slate-100", text: "text-slate-600" },
  SUBMITTED: { bg: "bg-yellow-100", text: "text-yellow-800" },
  MANAGER_APPROVED: { bg: "bg-blue-100", text: "text-blue-800" },
  INFO_REQUESTED: { bg: "bg-purple-100", text: "text-purple-800" },
  ACTIVE: { bg: "bg-green-100", text: "text-green-800" },
  EXPIRED: { bg: "bg-red-100", text: "text-red-800" },
  REVOKED: { bg: "bg-slate-100", text: "text-slate-600" },
  REJECTED: { bg: "bg-red-100", text: "text-red-700" },
};

export const STATUS_LABELS = {
  DRAFT: "Draft",
  SUBMITTED: "Pending Review",
  MANAGER_APPROVED: "Manager Approved",
  INFO_REQUESTED: "Info Requested",
  ACTIVE: "Active",
  EXPIRED: "Expired",
  REVOKED: "Revoked",
  REJECTED: "Rejected",
};

export const ROLE_LABELS = {
  REQUESTER: "Requester",
  APPROVER: "Approver",
  SECURITY_REVIEWER: "Security Reviewer",
  AUDITOR: "Auditor",
  ADMIN: "Admin",
};

export function pluralize(count, word) {
  return `${count} ${count === 1 ? word : word + "s"}`;
}

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
