import type {
  TeamLinkedDocument,
  TeamObjective,
  TeamProfile,
  TeamSeasonHistory,
  TeamStaffMember,
} from "../../types/teams";

const now = "2026-06-05T08:00:00.000Z";

export const teamProfiles: TeamProfile[] = [
  {
    id: "u13m1",
    name: "U13 Masculins 1",
    category: "U13",
    gender: "masculin",
    level: "Départemental",
    championship: "D1 U13M",
    season: "2026-2027",
    status: "active",
    mainGym: "Gymnase BCVB",
    trainingSlots: ["Mardi 18:30-20:00", "Vendredi 18:00-19:30"],
    identityTags: ["Défendre Fort", "Courir", "Partager la Balle"],
    styleOfPlay: "Jeu rapide après rebond, fixation et passe supplémentaire.",
    defensiveIdentity: "Défense Homme à Homme agressive et maîtrisée.",
    mainObjective: "Installer des standards défensifs communs et transférables en match.",
    technicalPriority: "Appuis défensifs et finition proche panier.",
    behavioralPriority: "Écoute, exigence et réaction après erreur.",
    collectivePriority: "Repli rapide et entraide.",
    description: "Groupe formation avec priorité défense H-H, intensité et jeu rapide.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "u15f1",
    name: "U15 Féminines",
    category: "U15",
    gender: "feminin",
    level: "Région",
    championship: "Région U15F",
    season: "2026-2027",
    status: "preparation",
    mainGym: "Salle annexe BCVB",
    trainingSlots: ["Mercredi 17:30-19:00", "Samedi 10:00-11:30"],
    identityTags: ["Lecture", "Agressivité maîtrisée", "Spacing"],
    styleOfPlay: "Lecture des avantages et occupation des espaces.",
    defensiveIdentity: "Pression porteur, aides courtes, communication.",
    mainObjective: "Améliorer la lecture collective sur demi-terrain.",
    technicalPriority: "Timing de passe et tirs ouverts.",
    behavioralPriority: "Communication positive et autonomie.",
    collectivePriority: "Spacing et continuité offensive.",
    description: "Groupe en consolidation, priorité lecture de jeu et agressivité maîtrisée.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "u18m",
    name: "U18 Masculins",
    category: "U18",
    gender: "masculin",
    level: "Pré-région",
    championship: "Pré-région U18M",
    season: "2026-2027",
    status: "active",
    mainGym: "Gymnase BCVB",
    trainingSlots: ["Lundi 20:00-21:30", "Jeudi 19:30-21:00"],
    identityTags: ["Responsabilité", "Transition", "Leadership"],
    styleOfPlay: "Transition contrôlée, responsabilité des cadres et lecture des mismatchs.",
    defensiveIdentity: "Intensité collective et communication des aides.",
    mainObjective: "Responsabiliser les leaders de terrain dans les temps faibles.",
    technicalPriority: "Lecture pick and roll et passes sous pression.",
    behavioralPriority: "Standard d’échauffement et concentration.",
    collectivePriority: "Régularité défensive sur 40 minutes.",
    description: "Groupe compétition avec objectif transfert match et responsabilités.",
    createdAt: now,
    updatedAt: now,
  },
];

export const teamStaffMembers: TeamStaffMember[] = [
  { id: "staff-u13-head", teamId: "u13m1", name: "Kevin T.", email: "coach.u13@bcvb.fr", phone: "06 00 00 00 01", role: "head_coach", startDate: "2026-08-20", isActive: true },
  { id: "staff-u13-parent", teamId: "u13m1", name: "Parent référent U13", email: "parents.u13@bcvb.fr", role: "parent_referent", startDate: "2026-09-01", isActive: true },
  { id: "staff-u13-tech", teamId: "u13m1", name: "Responsable technique", email: "rt@bcvb.fr", role: "technical_manager", startDate: "2026-08-20", isActive: true },
  { id: "staff-u15-head", teamId: "u15f1", name: "Coach U15F", email: "coach.u15f@bcvb.fr", role: "head_coach", startDate: "2026-08-20", isActive: true },
  { id: "staff-u18-head", teamId: "u18m", name: "Coach U18M", email: "coach.u18m@bcvb.fr", role: "head_coach", startDate: "2026-08-20", isActive: true },
  { id: "staff-u18-assist", teamId: "u18m", name: "Assistant U18M", role: "assistant_coach", startDate: "2026-09-01", isActive: true },
];

export const teamObjectives: TeamObjective[] = [
  {
    id: "obj-u13-defense",
    teamId: "u13m1",
    season: "2026-2027",
    type: "defensif",
    title: "Installer une défense H-H agressive et maîtrisée",
    description: "Faire de la pression porteur, du placement entre joueur et panier et du repli rapide une base commune.",
    observableCriteria: "Pression porteur, contestation sans faute, aide/reprise et repli rapide.",
    quantifiableCriteria: "6 séquences défensives actives par quart-temps, moins de 3 paniers encaissés sur non-repli.",
    priority: "haute",
    status: "en_cours",
    linkedPlanningId: "planning-u13-2026",
    linkedEvaluationIds: ["eval-u13-trimestre-2"],
  },
  {
    id: "obj-u13-bcvb",
    teamId: "u13m1",
    season: "2026-2027",
    type: "identite_bcvb",
    title: "Défendre Fort, Courir et Partager la Balle",
    description: "Relier chaque séance aux valeurs BCVB avec un observable simple.",
    observableCriteria: "Au moins une intention BCVB nommée et observée par séance.",
    priority: "haute",
    status: "en_cours",
  },
  {
    id: "obj-u15-jeu",
    teamId: "u15f1",
    season: "2026-2027",
    type: "offensif",
    title: "Améliorer lecture et partage de balle",
    description: "Développer surnombre, timing de passe et occupation des espaces.",
    observableCriteria: "Passe dans le bon timing, coupe utile, spacing respecté.",
    priority: "moyenne",
    status: "a_faire",
  },
  {
    id: "obj-u18-autonomie",
    teamId: "u18m",
    season: "2026-2027",
    type: "collectif",
    title: "Responsabiliser les leaders de terrain",
    description: "Faire émerger communication, standards d’échauffement et autonomie tactique.",
    priority: "moyenne",
    status: "en_cours",
  },
];

export const teamLinkedDocuments: TeamLinkedDocument[] = [
  { id: "doc-u13-planning", teamId: "u13m1", documentId: "planning-u13-2026", documentType: "planning", title: "Planification annuelle U13M", url: "/coach/planifications", createdAt: now },
  { id: "doc-u13-session", teamId: "u13m1", documentId: "session-defense-hh", documentType: "session", title: "Séance défense H-H", url: "/coach/seances", createdAt: now },
  { id: "doc-u13-attendance", teamId: "u13m1", documentId: "presence-u13-dernier", documentType: "presence", title: "Dernier appel U13M", url: "/presences", createdAt: now },
  { id: "doc-u13-eval", teamId: "u13m1", documentId: "eval-u13-trimestre-2", documentType: "evaluation", title: "Bilan évaluations T2", url: "/evaluations", createdAt: now },
  { id: "doc-u15-doc", teamId: "u15f1", documentId: "doc-u15-projet", documentType: "document", title: "Projet équipe U15F", url: "/bibliotheque", createdAt: now },
];

export const teamSeasonHistories: TeamSeasonHistory[] = [
  {
    id: "history-u13-2025",
    teamId: "u13m1",
    season: "2025-2026",
    summary: "Groupe structuré, forte progression défensive et meilleure assiduité en deuxième partie de saison.",
    finalLevel: "Départemental haut",
    keyPlayers: ["Noah Martin", "Lina Bernard"],
    staff: ["Coach U13", "Parent référent U13"],
    strengths: ["Intensité", "Défense H-H", "Vie de groupe"],
    priorities: ["Lecture aide/reprise", "Finition sous pression"],
    archivedAt: "2026-06-20",
  },
  {
    id: "history-u18-2025",
    teamId: "u18m",
    season: "2025-2026",
    summary: "Saison de transition avec montée en autonomie des cadres.",
    finalLevel: "Pré-région",
    strengths: ["Leadership", "Préparation match"],
    priorities: ["Régularité présence", "Exigence défensive"],
    archivedAt: "2026-06-18",
  },
];

export function getTeamProfile(teamId?: string) {
  return teamProfiles.find((team) => team.id === teamId) || teamProfiles[0];
}

export function getTeamStaff(teamId: string) {
  return teamStaffMembers.filter((member) => member.teamId === teamId);
}

export function getTeamObjectives(teamId: string) {
  return teamObjectives.filter((objective) => objective.teamId === teamId);
}

export function getTeamDocuments(teamId: string) {
  return teamLinkedDocuments.filter((document) => document.teamId === teamId);
}

export function getTeamHistory(teamId: string) {
  return teamSeasonHistories.filter((history) => history.teamId === teamId);
}
