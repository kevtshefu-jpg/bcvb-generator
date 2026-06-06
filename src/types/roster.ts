export type PlayerGender = "M" | "F" | "Mixte" | "Autre" | "Non renseigné";

export type PlayerStatus =
  | "actif"
  | "en attente"
  | "essai"
  | "mutation"
  | "blessé"
  | "liste attente"
  | "arrêt"
  | "archivé";

export type TeamCategory =
  | "U7"
  | "U9"
  | "U11"
  | "U13"
  | "U15"
  | "U18"
  | "U21"
  | "Seniors"
  | "Loisir"
  | "Section sportive"
  | "Général BCVB";

export type TeamLevel =
  | "Départemental"
  | "Pré-région"
  | "Région"
  | "Performance"
  | "Loisir"
  | "Formation"
  | "Non défini";

export type MembershipRole =
  | "joueur"
  | "passerelle"
  | "joueur passerelle"
  | "partenaire entraînement"
  | "blessé"
  | "essai"
  | "observateur";

export type ContactRole =
  | "Responsable légal 1"
  | "Responsable légal 2"
  | "Parent référent"
  | "Urgence"
  | "Autre";

export interface PlayerContact {
  id: string;
  playerId: string;
  role: ContactRole;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  canReceiveClubInfo: boolean;
  notes?: string;
}

export interface FamilyContact {
  id: string;
  playerId: string;
  relation: "mère" | "père" | "responsable légal" | "autre";
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isPrimary?: boolean;
  isParentReferent?: boolean;
  notes?: string;
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender: PlayerGender;
  licenseNumber?: string;
  email?: string;
  phone?: string;
  status: PlayerStatus;
  category?: TeamCategory;
  notes?: string;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  name: string;
  category: TeamCategory;
  level: TeamLevel;
  season: string;
  coachIds: string[];
  assistantCoachIds?: string[];
  parentReferentIds?: string[];
  description?: string;
  constraints?: string[];
  trainingFrequencyPerWeek?: number;
  heterogeneityLevel?: "faible" | "moyen" | "fort";
  objectives?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMembership {
  id: string;
  playerId: string;
  teamId: string;
  season: string;
  role: MembershipRole;
  isPrimaryTeam: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

export interface RosterImportColumnMapping {
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: string;
  licenseNumber?: string;
  playerEmail?: string;
  playerPhone?: string;
  parent1Name?: string;
  parent1Email?: string;
  parent1Phone?: string;
  parent2Name?: string;
  parent2Email?: string;
  parent2Phone?: string;
  category?: string;
  team?: string;
  status?: string;
  notes?: string;
}

export interface RosterImportRow {
  id: string;
  sourceLine: number;
  raw: Record<string, string>;
  mapped?: Partial<Player>;
  contacts?: Partial<FamilyContact>[];
  errors: string[];
  warnings: string[];
  ignored?: boolean;
  validated?: boolean;
  duplicateScore?: number;
  possibleDuplicateIds?: string[];
  targetTeamName?: string;
  membershipRole?: MembershipRole;
}

export interface ImportedRosterRow {
  id: string;
  raw: Record<string, string>;
  mapped: Partial<Player> & {
    teamName?: string;
    parent1Email?: string;
    parent1Phone?: string;
    parent2Email?: string;
    parent2Phone?: string;
  };
  errors: string[];
  warnings: string[];
  duplicateScore?: number;
  duplicatePlayerId?: string;
}

export interface RosterImportReport {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  possibleDuplicates: number;
  rows: ImportedRosterRow[];
}

export interface RosterImportResult {
  fileName: string;
  columns: string[];
  rowCount: number;
  validRows: RosterImportRow[];
  invalidRows: RosterImportRow[];
  warnings: string[];
  mapping: RosterImportColumnMapping;
}

export interface PlayerPassport {
  player: Player;
  contacts: FamilyContact[];
  memberships: TeamMembership[];
  attendanceRate?: number;
  absencesCount?: number;
  evaluationSummary?: string;
  objectives?: string[];
  documents?: string[];
  coachNotes?: string;
  technicalManagerNotes?: string;
  history?: string[];
}

export type RosterPermissionSet = {
  canImport: boolean;
  canValidateImport: boolean;
  canMergeDuplicates: boolean;
  canAssignTeams: boolean;
  canCreateTeam: boolean;
  canExport: boolean;
  canDeletePlayer: boolean;
  canArchivePlayer: boolean;
  canViewSensitiveContacts: boolean;
  readOnly: boolean;
};

export type RosterQualityScore = {
  score: number;
  playerCount: number;
  playersWithoutTeam: number;
  playersWithoutContact: number;
  probableDuplicates: number;
  importedRows: number;
  errorRows: number;
  strengths: string[];
  actions: string[];
};

export type RosterPlanningContext = {
  category?: TeamCategory;
  level?: TeamLevel;
  playerCount: number;
  ageRange: string;
  trainingConstraints: string[];
  recommendedPlanningDensity: "faible" | "standard" | "renforcée";
  alerts: string[];
  suggestedPriorities: string[];
};

export type RosterImportField =
  | "last_name"
  | "first_name"
  | "birth_date"
  | "category"
  | "team"
  | "gender"
  | "height_cm"
  | "position"
  | "parent_1_name"
  | "parent_2_name"
  | "parent_1_phone"
  | "parent_2_phone"
  | "parent_1_email"
  | "parent_2_email"
  | "emergency_phone"
  | "license_number"
  | "license_status"
  | "head_coach"
  | "parent_referent"
  | "notes";

export type LegacyRosterImportRow = Partial<Record<RosterImportField, string>> & {
  sourceLine: number;
  raw: Record<string, string>;
};

export type RosterDuplicateCandidate = {
  id: string;
  sourceLine: number;
  matchedWithLine: number;
  score: number;
  reasons: string[];
  suggestedAction: "fusionner" | "verifier" | "ignorer";
};

export type RosterContactSummary = {
  total: number;
  complete: number;
  partial: number;
  missing: number;
  parentReferents: number;
};

export type RosterTeamAssignment = {
  id: string;
  teamName: string;
  category: string;
  season: string;
  playersCount: number;
  mode: "existing" | "create";
  coachName?: string;
};

export type RosterPlayerPassport = {
  id: string;
  sourceLine: number;
  displayName: string;
  category: string;
  team: string;
  licenseNumber?: string;
  contactStatus: "complet" | "partiel" | "manquant";
  trackingLinks: {
    attendance: boolean;
    evaluations: boolean;
    objectives: boolean;
    documents: boolean;
  };
};

export type RosterImportPreview = {
  rows: LegacyRosterImportRow[];
  headers: string[];
  mapping: Record<string, RosterImportField | "">;
  duplicates: LegacyRosterImportRow[];
  duplicateCandidates: RosterDuplicateCandidate[];
  invalidRows: Array<{ line: number; reason: string }>;
  categories: string[];
  teams: string[];
  missingFields: string[];
  contactSummary: RosterContactSummary;
  teamAssignments: RosterTeamAssignment[];
  playerPassports: RosterPlayerPassport[];
};
