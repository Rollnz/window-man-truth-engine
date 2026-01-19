/**
 * CRM Lead Warehouse Types
 */

export type LeadStatus =
  | "new"
  | "qualifying"
  | "mql"
  | "appointment_set"
  | "sat"
  | "closed_won"
  | "closed_lost"
  | "dead";

export type LeadQuality = "cold" | "warm" | "hot" | "qualified";

export interface CRMLead {
  id: string;
  created_at: string;
  updated_at: string;
  lead_id: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  original_session_id: string | null;
  original_source_tool: string | null;
  engagement_score: number;
  lead_quality: LeadQuality;
  status: LeadStatus;
  last_contacted_at: string | null;
  notes: string | null;
  estimated_deal_value: number;
  actual_deal_value: number | null;
  closed_at: string | null;
  assigned_to: string | null;
  // Ad attribution for visual indicators
  gclid: string | null;
  fbclid: string | null;
}

export interface CRMColumn {
  id: LeadStatus;
  title: string;
  color: string;
  leads: CRMLead[];
}

export const LEAD_STATUS_CONFIG: Record<LeadStatus, { title: string; color: string; description: string }> = {
  new: {
    title: "New",
    color: "bg-blue-500",
    description: "Fresh leads from the site",
  },
  qualifying: {
    title: "Qualifying",
    color: "bg-purple-500",
    description: "Actively calling/SMSing",
  },
  mql: {
    title: "MQL",
    color: "bg-amber-500",
    description: "Verified, high interest",
  },
  appointment_set: {
    title: "Appt Set",
    color: "bg-cyan-500",
    description: "Appointment on calendar",
  },
  sat: {
    title: "Sat",
    color: "bg-indigo-500",
    description: "Client showed up",
  },
  closed_won: {
    title: "Closed Won",
    color: "bg-green-500",
    description: "SOLD!",
  },
  closed_lost: {
    title: "Closed Lost",
    color: "bg-red-500",
    description: "No sale after appointment",
  },
  dead: {
    title: "Dead",
    color: "bg-gray-500",
    description: "Fake info or not interested",
  },
};

export const KANBAN_COLUMNS: LeadStatus[] = ["new", "qualifying", "mql", "appointment_set", "sat", "closed_won"];

export const LEAD_QUALITY_CONFIG: Record<LeadQuality, { label: string; color: string }> = {
  cold: { label: "Cold", color: "bg-blue-100 text-blue-800" },
  warm: { label: "Warm", color: "bg-amber-100 text-amber-800" },
  hot: { label: "Hot", color: "bg-orange-100 text-orange-800" },
  qualified: { label: "Qualified", color: "bg-green-100 text-green-800" },
};
