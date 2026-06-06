import type {
  ParentReferentDocument,
  ParentReferentMessageTemplate,
  ParentReferentTeamInfo,
  PlayerLogisticsAvailability,
  TeamLogisticsEvent,
} from "../../types/parentReferent";
import { getTeamStaff, teamProfiles } from "../teams/teamProfiles";
import { isHeadCoachRole } from "../teams/teamStaff";

const now = "2026-06-05T10:00:00.000Z";

function normalizeTrainingSlot(slot: NonNullable<(typeof teamProfiles)[number]["trainingSlots"]>[number], teamId: string, index: number, fallbackGym?: string) {
  if (typeof slot !== "string") {
    return {
      id: slot.id || `slot-${teamId}-${index}`,
      day: slot.day,
      startTime: slot.startTime,
      endTime: slot.endTime,
      gym: slot.gym || fallbackGym || "Gymnase BCVB",
    };
  }

  const [day, hours = "18:00-19:30"] = slot.split(" ");
  const [startTime = "18:00", endTime = "19:30"] = hours.split("-");
  return {
    id: `slot-${teamId}-${index}`,
    day,
    startTime,
    endTime,
    gym: fallbackGym || "Gymnase BCVB",
  };
}

export const parentReferentEvents: TeamLogisticsEvent[] = [
  {
    id: "event-u13-2026-09-12",
    teamId: "u13m1",
    title: "Match U13M vs Saint-Berthevin",
    date: "2026-09-12",
    meetingTime: "13:45",
    gameTime: "15:00",
    location: "Gymnase BCVB",
    opponent: "Saint-Berthevin",
    transportNeeded: false,
    tableNeeded: true,
    snackNeeded: true,
    jerseyWashNeeded: true,
    note: "Merci de confirmer table, goûter et lavage maillots avant jeudi soir.",
  },
  {
    id: "event-u15f-2026-09-13",
    teamId: "u15f1",
    title: "Déplacement U15F à Laval",
    date: "2026-09-13",
    meetingTime: "08:45",
    gameTime: "10:30",
    location: "Salle Laval Nord",
    opponent: "Laval Nord",
    transportNeeded: true,
    tableNeeded: false,
    snackNeeded: false,
    jerseyWashNeeded: true,
    note: "Prévoir au moins trois voitures et départ groupé depuis le gymnase BCVB.",
  },
];

export const parentReferentTeamInfos: ParentReferentTeamInfo[] = teamProfiles.map((team) => {
  const staff = getTeamStaff(team.id);
  const headCoach = staff.find((member) => isHeadCoachRole(member.role) && member.isActive);
  const assistants = staff.filter((member) => member.role === "assistant_coach" && member.isActive);
  const parentReferent = staff.find((member) => member.role === "parent_referent" && member.isActive);
  const nextEvent = parentReferentEvents.find((event) => event.teamId === team.id);

  return {
    id: `parent-info-${team.id}`,
    teamId: team.id,
    teamName: team.name,
    category: team.category,
    level: team.level,
    season: team.season,
    headCoachName: headCoach?.name || "Coach à confirmer",
    assistantCoachNames: assistants.map((member) => member.name),
    parentReferentName: parentReferent?.name || "Parent référent à nommer",
    trainingSlots: (team.trainingSlots || []).map((slot, index) => normalizeTrainingSlot(slot, team.id, index, team.mainGym)),
    nextEvent,
  };
});

export const parentReferentAvailabilities: PlayerLogisticsAvailability[] = [
  {
    id: "log-p1",
    playerId: "p1",
    playerName: "Noah Martin",
    teamId: "u13m1",
    eventId: "event-u13-2026-09-12",
    status: "present",
    transportNeeded: false,
    carAvailable: true,
    availableSeats: 3,
    accompanyingParent: "Parent Martin",
    jerseyWash: false,
    snackContribution: true,
    tableHelp: false,
    note: "Goûter possible.",
    updatedAt: now,
  },
  {
    id: "log-p2",
    playerId: "p2",
    playerName: "Lina Bernard",
    teamId: "u13m1",
    eventId: "event-u13-2026-09-12",
    status: "to_confirm",
    transportNeeded: false,
    carAvailable: false,
    availableSeats: 0,
    jerseyWash: true,
    snackContribution: false,
    tableHelp: true,
    note: "",
    updatedAt: now,
  },
  {
    id: "log-p3",
    playerId: "p3",
    playerName: "Adam Morel",
    teamId: "u13m1",
    eventId: "event-u13-2026-09-12",
    status: "not_filled",
    transportNeeded: false,
    carAvailable: false,
    availableSeats: 0,
    jerseyWash: false,
    snackContribution: false,
    tableHelp: false,
    updatedAt: now,
  },
  {
    id: "log-p4",
    playerId: "p4",
    playerName: "Sofia Petit",
    teamId: "u13m1",
    eventId: "event-u13-2026-09-12",
    status: "unavailable",
    transportNeeded: false,
    carAvailable: false,
    availableSeats: 0,
    jerseyWash: false,
    snackContribution: false,
    tableHelp: false,
    note: "Indisponible renseigné par le coach.",
    updatedAt: now,
  },
];

export const parentReferentDocuments: ParentReferentDocument[] = [
  {
    id: "doc-parent-charte",
    title: "Charte parents BCVB",
    category: "Relation familles",
    season: "2026-2027",
    type: "charte",
    audience: "families",
    status: "published",
    badges: ["Document officiel BCVB", "Information famille"],
    route: "/documents-utiles",
    updatedAt: "2026-06-01T09:00:00.000Z",
    downloadUrl: "/documents-utiles",
    previewUrl: "/documents-utiles",
  },
  {
    id: "doc-protocole-match",
    title: "Protocole match à domicile",
    category: "Organisation week-end",
    teamId: "u13m1",
    season: "2026-2027",
    type: "protocole",
    audience: "parent_referents",
    status: "published",
    badges: ["Document équipe", "À lire avant match", "Organisation week-end"],
    route: "/documents-utiles",
    updatedAt: "2026-06-02T10:30:00.000Z",
    downloadUrl: "/documents-utiles",
    previewUrl: "/documents-utiles",
  },
  {
    id: "doc-table-marque",
    title: "Aide table de marque jeunes",
    category: "Table / OTM",
    season: "2026-2027",
    type: "table",
    audience: "parents",
    status: "published",
    badges: ["Information famille", "À lire avant match"],
    route: "/documents-utiles",
    updatedAt: "2026-05-28T14:15:00.000Z",
    downloadUrl: "/documents-utiles",
    previewUrl: "/documents-utiles",
  },
  {
    id: "doc-deplacements",
    title: "Organisation déplacements BCVB",
    category: "Transport",
    season: "2026-2027",
    type: "transport",
    audience: "families",
    status: "published",
    badges: ["Document officiel BCVB", "Organisation week-end"],
    route: "/documents-utiles",
    updatedAt: "2026-05-25T16:45:00.000Z",
    downloadUrl: "/documents-utiles",
    previewUrl: "/documents-utiles",
  },
];

export const parentReferentMessageTemplates: ParentReferentMessageTemplate[] = [
  {
    id: "msg-match-reminder",
    title: "Rappel match",
    category: "match_reminder",
    audience: "families",
    tone: "warm",
    body: "Bonjour à toutes et tous, rappel match samedi : rendez-vous à 13h45 au gymnase BCVB, match à 15h00. Merci de confirmer la présence de votre enfant.",
    status: "validated_by_coach",
    createdBy: "Coach U13",
    validatedByCoach: "Coach U13",
    createdAt: "2026-06-02T08:30:00.000Z",
    updatedAt: "2026-06-03T08:30:00.000Z",
  },
  {
    id: "msg-transport",
    title: "Appel voitures",
    category: "transport",
    audience: "families",
    tone: "direct",
    body: "Bonjour, pour le déplacement du week-end nous avons besoin de voitures supplémentaires. Merci d’indiquer si vous pouvez accompagner et le nombre de places disponibles.",
    status: "validated_by_coach",
    createdBy: "BCVB",
    validatedByCoach: "Responsable technique",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-02T12:00:00.000Z",
  },
  {
    id: "msg-snack",
    title: "Goûter d’après match",
    category: "snack",
    audience: "parents",
    tone: "warm",
    body: "Bonjour, qui peut apporter un goûter simple pour l’après match ? Merci pour votre aide.",
    status: "validated_by_coach",
    createdBy: "Parent référent U13",
    validatedByCoach: "Coach U13",
    createdAt: "2026-05-31T15:00:00.000Z",
    updatedAt: "2026-06-01T15:00:00.000Z",
  },
  {
    id: "msg-behavior",
    title: "Respect arbitres et tribunes",
    category: "behavior",
    audience: "families",
    tone: "official",
    body: "Rappel club : nous encourageons les enfants, respectons arbitres, adversaires et bénévoles. Merci à tous de porter l’état d’esprit BCVB.",
    status: "validated_by_coach",
    createdBy: "BCVB",
    validatedByCoach: "Responsable technique",
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-05-29T10:00:00.000Z",
  },
  {
    id: "msg-draft",
    title: "Proposition sortie tournoi",
    category: "event",
    audience: "families",
    tone: "warm",
    body: "Proposition de message à faire valider par le coach avant diffusion.",
    status: "submitted_to_coach",
    createdBy: "Parent référent U13",
    createdAt: "2026-06-04T09:30:00.000Z",
    updatedAt: "2026-06-04T10:00:00.000Z",
  },
];
