export interface StatusStyle {
  label: string;
  bgClass: string;
  textClass: string;
}

export const CALL_STATUS_STYLES: Record<string, StatusStyle> = {
  pending: {
    label: "Pending",
    bgClass: "bg-yellow-500/20",
    textClass: "text-yellow-600",
  },
  in_progress: {
    label: "In Progress",
    bgClass: "bg-blue-500/20",
    textClass: "text-blue-600",
  },
  completed: {
    label: "Completed",
    bgClass: "bg-green-500/20",
    textClass: "text-green-600",
  },
  no_answer: {
    label: "No Answer",
    bgClass: "bg-gray-500/20",
    textClass: "text-gray-600",
  },
  dead_letter: {
    label: "Failed",
    bgClass: "bg-red-500/20",
    textClass: "text-red-600",
  },
};

export const DEFAULT_STATUS_STYLE: StatusStyle = {
  label: "Unknown",
  bgClass: "bg-gray-500/10",
  textClass: "text-gray-500",
};

export function getStatusStyle(status: string): StatusStyle {
  return CALL_STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
}
