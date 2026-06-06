export type ParentReferentAccessLevel =
  | "none"
  | "read_team_logistics"
  | "manage_logistics"
  | "propose_communication"
  | "validated_parent_referent";

export type LogisticsStatus =
  | "present"
  | "absent"
  | "to_confirm"
  | "not_filled"
  | "unavailable";

export type ParentReferentRole = "parent_referent";

export type ParentLogisticStatus =
  | "available"
  | "absent_announced"
  | "to_confirm"
  | "transport_needed"
  | "transport_offered"
  | "table_help_possible"
  | "snack_possible";

export type ParentMessageStatus =
  | "draft"
  | "submitted_to_coach"
  | "validated_by_coach"
  | "coach_validated"
  | "club_validated"
  | "copied"
  | "archived";

export interface TeamTrainingSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  gym: string;
}

export interface ParentTrainingSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  location: string;
}

export interface TeamLogisticsEvent {
  id: string;
  teamId: string;
  title: string;
  date: string;
  meetingTime?: string;
  gameTime?: string;
  location?: string;
  opponent?: string;
  transportNeeded: boolean;
  tableNeeded: boolean;
  snackNeeded: boolean;
  jerseyWashNeeded: boolean;
  note?: string;
}

export interface ParentTeamEvent {
  id: string;
  type: "match" | "plateau" | "event" | "meeting" | "tournament";
  title: string;
  date: string;
  startTime?: string;
  meetingTime?: string;
  location?: string;
  opponent?: string;
  transportNeed?: boolean;
  snackNeed?: boolean;
  tableNeed?: boolean;
  notes?: string;
}

export interface ParentReferentTeamInfo {
  id: string;
  teamId: string;
  teamName: string;
  category: string;
  level?: string;
  season: string;
  headCoachName: string;
  assistantCoachNames?: string[];
  parentReferentName?: string;
  trainingSlots: TeamTrainingSlot[];
  nextEvent?: TeamLogisticsEvent;
}

export interface ParentTeamInfo {
  teamId: string;
  teamName: string;
  category: string;
  season: string;
  coachName: string;
  assistantCoachName?: string;
  parentReferentName?: string;
  trainingSlots: ParentTrainingSlot[];
  nextEvents: ParentTeamEvent[];
}

export interface PlayerLogisticsAvailability {
  id: string;
  playerId: string;
  playerName: string;
  teamId: string;
  eventId: string;
  status: LogisticsStatus;
  transportNeeded?: boolean;
  carAvailable?: boolean;
  availableSeats?: number;
  accompanyingParent?: string;
  jerseyWash?: boolean;
  snackContribution?: boolean;
  tableHelp?: boolean;
  note?: string;
  updatedAt: string;
}

export interface ParentLogisticAvailability {
  id: string;
  eventId: string;
  playerId: string;
  playerDisplayName: string;
  status: ParentLogisticStatus;
  transportSeatsOffered?: number;
  transportNeeded?: boolean;
  snackHelp?: boolean;
  tableHelp?: boolean;
  shortComment?: string;
  updatedAt: string;
}

export interface ParentReferentMessageTemplate {
  id: string;
  title: string;
  category:
    | "match_reminder"
    | "transport"
    | "snack"
    | "jersey_wash"
    | "table_help"
    | "club_info"
    | "behavior"
    | "event";
  audience: "parents" | "players" | "families" | "parent_referents";
  tone: "direct" | "warm" | "official" | "urgent";
  body: string;
  status: ParentMessageStatus;
  createdBy: string;
  validatedByCoach?: string;
  createdAt?: string;
  updatedAt: string;
}

export interface ParentMessageTemplate {
  id: string;
  title: string;
  category:
    | "match_reminder"
    | "transport"
    | "snack"
    | "schedule_change"
    | "club_event"
    | "plateau"
    | "general";
  audience: "parents" | "parent_referents" | "team";
  content: string;
  status: ParentMessageStatus;
  createdBy: string;
  validatedByCoach?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParentReferentDocument {
  id: string;
  title: string;
  category: string;
  teamId?: string;
  season: string;
  type: "charte" | "planning" | "protocole" | "table" | "transport" | "message" | "club";
  audience: "families" | "parents" | "parent_referents" | "public";
  status: "published" | "club_validated" | "archived";
  badges: Array<"Document officiel BCVB" | "Document équipe" | "Information famille" | "À lire avant match" | "Organisation week-end">;
  route: string;
  updatedAt?: string;
  downloadUrl?: string;
  previewUrl?: string;
}

export interface ParentUsefulDocument {
  id: string;
  title: string;
  documentType:
    | "charter"
    | "rules"
    | "schedule"
    | "protocol"
    | "message_template"
    | "club_info"
    | "logistics";
  category?: string;
  teamId?: string;
  season: string;
  audience: "parent_referent" | "parents" | "public";
  status: "published" | "archived";
  downloadUrl?: string;
  previewUrl?: string;
}
