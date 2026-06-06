import type { QualityScore } from "../types/quality.types";
import type { QualityWeightKey } from "./qualityRules";

export type QualityDecisionItem = {
  key: QualityWeightKey;
  label: string;
  value: number;
  explanation: string;
  action: string;
};

export type PublicationChecklistItem = {
  label: string;
  done: boolean;
  helper: string;
};

const decisionCopy: Record<QualityWeightKey, { label: string; low: string; ok: string; action: string }> = {
  structureScore: {
    label: "Structure",
    low: "La hiérarchie du document manque de titres, d’introduction ou de conclusion.",
    ok: "La structure permet une lecture claire du document.",
    action: "Compléter les sections",
  },
  bcvbIdentityScore: {
    label: "Identité BCVB",
    low: "Les marqueurs Défendre Fort, Courir, Partager la Balle ou Homme à Homme sont trop discrets.",
    ok: "L’identité BCVB est visible et cohérente.",
    action: "Ajouter identité BCVB",
  },
  pedagogicalScore: {
    label: "Pédagogie",
    low: "Les objectifs, progressions, critères ou régulations ne sont pas assez explicites.",
    ok: "La progression pédagogique est exploitable.",
    action: "Ajouter objectifs",
  },
  fieldUseScore: {
    label: "Utilité terrain",
    low: "Le document manque de consignes, organisation ou critères utilisables au gymnase.",
    ok: "Le contenu peut être utilisé concrètement par le terrain.",
    action: "Renforcer terrain",
  },
  tableScore: {
    label: "Tableaux",
    low: "Certains tableaux risquent d’être illisibles ou irréguliers en PDF.",
    ok: "Les tableaux sont lisibles et exportables.",
    action: "Corriger les tableaux",
  },
  situationScore: {
    label: "Situations",
    low: "Les situations pédagogiques sont absentes ou trop peu exploitables.",
    ok: "Les situations donnent une base de travail claire.",
    action: "Ajouter situation",
  },
  diagramScore: {
    label: "Schémas",
    low: "Les schémas terrain ou repères visuels sont insuffisants.",
    ok: "Les repères visuels sont présents pour accompagner le terrain.",
    action: "Ajouter schémas",
  },
  styleScore: {
    label: "Style",
    low: "Certains blocs sont trop longs, techniques ou peu lisibles.",
    ok: "Le style est lisible pour une publication club.",
    action: "Améliorer style",
  },
  exportReadinessScore: {
    label: "Export PDF",
    low: "Le document présente un risque de débordement, de coupe ou d’éléments non imprimables.",
    ok: "Le document est prêt à être vérifié en PDF.",
    action: "Préparer export",
  },
};

export const qualityDecisionKeys = Object.keys(decisionCopy) as QualityWeightKey[];

export function buildQualityDecisionItems(score: QualityScore): QualityDecisionItem[] {
  return qualityDecisionKeys.map((key) => {
    const value = score[key];
    const copy = decisionCopy[key];
    return {
      key,
      label: copy.label,
      value,
      explanation: value < 75 ? copy.low : copy.ok,
      action: copy.action,
    };
  });
}

function hasWarning(score: QualityScore, warningId: string) {
  return score.warnings.some((warning) => warning.id === warningId);
}

export function buildPublicationChecklist(score: QualityScore): PublicationChecklistItem[] {
  const criticalWarnings = score.warnings.filter((warning) => warning.level === "critical");

  return [
    {
      label: "Titre clair",
      done: !hasWarning(score, "title-missing") && score.structureScore >= 55,
      helper: "Le document doit commencer par un titre lisible.",
    },
    {
      label: "Objectif identifié",
      done: score.pedagogicalScore >= 60,
      helper: "Objectifs, progression ou intention doivent être visibles.",
    },
    {
      label: "Public cible identifié",
      done: score.fieldUseScore >= 55 || score.bcvbIdentityScore >= 55,
      helper: "Le lecteur doit savoir si le document vise coachs, joueurs, familles ou dirigeants.",
    },
    {
      label: "Sections complètes",
      done: score.structureScore >= 70,
      helper: "Introduction, sections et synthèse doivent guider la lecture.",
    },
    {
      label: "Tableaux lisibles",
      done: score.tableScore >= 75,
      helper: "Les tableaux doivent rester lisibles à l’écran et en PDF.",
    },
    {
      label: "Situations exploitables",
      done: score.situationScore >= 70,
      helper: "Les situations doivent pouvoir être utilisées en séance ou en réunion.",
    },
    {
      label: "Identité BCVB présente",
      done: score.bcvbIdentityScore >= 70,
      helper: "Défendre Fort, Courir, Partager la Balle ou les repères club doivent apparaître.",
    },
    {
      label: "Aucun warning critique",
      done: criticalWarnings.length === 0,
      helper: "Les warnings critiques bloquent la publication premium.",
    },
    {
      label: "Export PDF prêt",
      done: score.exportReadinessScore >= 80 && criticalWarnings.length === 0,
      helper: "Le document ne doit pas contenir d’éléments UI ou de blocs trop larges.",
    },
  ];
}
