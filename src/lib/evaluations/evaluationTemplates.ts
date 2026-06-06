import type { EvaluationCriterion, EvaluationDomain, EvaluationTemplate } from "../../types/evaluations";

export const evaluationDomains: EvaluationDomain[] = [
  "intensite",
  "agressivite_maitrisee",
  "maitrise",
  "jeu",
  "fondamentaux_offensifs",
  "fondamentaux_defensifs",
  "lecture_jeu",
  "attitude_collective",
  "autonomie",
  "assiduite",
  "collectif",
  "mental",
  "physique",
];

export const bcvbRadarDomains: EvaluationDomain[] = [
  "intensite",
  "agressivite_maitrisee",
  "maitrise",
  "jeu",
  "fondamentaux_offensifs",
  "fondamentaux_defensifs",
  "lecture_jeu",
  "attitude_collective",
];

export const evaluationDomainLabels: Record<EvaluationDomain, string> = {
  intensite: "Intensité",
  agressivite_maitrisee: "Agressivité maîtrisée",
  maitrise: "Maîtrise",
  jeu: "Jeu",
  fondamentaux_offensifs: "Fondamentaux offensifs",
  fondamentaux_defensifs: "Fondamentaux défensifs",
  lecture_jeu: "Lecture de jeu",
  attitude_collective: "Attitude collective",
  autonomie: "Autonomie",
  assiduite: "Assiduité",
  collectif: "Collectif",
  mental: "Mental",
  physique: "Physique",
};

function criterion(
  id: string,
  domain: EvaluationDomain,
  label: string,
  description: string,
  observable: string,
  weight = 1
): EvaluationCriterion {
  return { id, domain, label, description, observable, weight };
}

function withBcvbCore(category: string, criteria: EvaluationCriterion[]) {
  return [
    criterion(`${category}-bcvb-intensite`, "intensite", "Intensité BCVB", "Court, freine, repart et reste actif.", "Répète les efforts courts sans sortir de l’action.", 1.2),
    criterion(`${category}-bcvb-agressivite`, "agressivite_maitrisee", "Agressivité maîtrisée", "Engage le duel sans perdre le cadre.", "Attaque le cercle, conteste sans faute, accepte le contact.", 1.2),
    criterion(`${category}-bcvb-maitrise`, "maitrise", "Maîtrise", "Contrôle ses appuis, son ballon et son rythme.", "Protège le ballon, choisit le bon rythme, finit équilibré.", 1.1),
    criterion(`${category}-bcvb-jeu`, "jeu", "Partager la Balle", "Prend l’information et joue avec les autres.", "Regarde avant d’agir, respecte les espaces, trouve le partenaire.", 1.1),
    ...criteria,
  ];
}

export const evaluationTemplates: EvaluationTemplate[] = [
  {
    id: "template-u7-bcvb",
    category: "U7",
    level: "Découverte",
    title: "U7 - Motricité, plaisir et repères simples",
    description: "Observer le plaisir de jouer, les repères corporels, l’écoute et la manipulation du ballon.",
    criteria: withBcvbCore("U7", [
      criterion("u7-motricite", "physique", "Motricité générale", "Court, saute, s’arrête et repart.", "Enchaîne courir, s’arrêter et repartir avec le ballon."),
      criterion("u7-manipulation", "fondamentaux_offensifs", "Manipulation ballon", "Découvre dribble, passe et tir proche.", "Manipule le ballon sans se désorganiser totalement."),
      criterion("u7-ecoute", "attitude_collective", "Écoute et plaisir", "Écoute la consigne courte et reste engagé.", "Participe, sourit, revient dans le groupe après rappel."),
      criterion("u7-reperes", "lecture_jeu", "Repères simples", "Comprend panier, lignes et partenaire.", "Se dirige vers le bon panier et reconnaît un partenaire libre."),
    ]),
  },
  {
    id: "template-u9-bcvb",
    category: "U9",
    level: "Découverte",
    title: "U9 - Motricité basket et opposition simple",
    description: "Évaluer dribble, passe, tir proche, duel simple et attitude dans l’apprentissage.",
    criteria: withBcvbCore("U9", [
      criterion("u9-dribble", "fondamentaux_offensifs", "Dribble utile", "Dribble en avançant et protège son ballon.", "Change de rythme et garde le contrôle dans un couloir."),
      criterion("u9-passe", "jeu", "Passe au partenaire", "Identifie un partenaire proche.", "Regarde avant de passer et dose la passe."),
      criterion("u9-tir", "fondamentaux_offensifs", "Tir proche", "Utilise des appuis simples près du cercle.", "Tire équilibré près du panier après réception ou dribble."),
      criterion("u9-opposition", "fondamentaux_defensifs", "Opposition simple", "Se place devant son joueur.", "Reste devant son joueur sans ouvrir la ligne directe au panier."),
    ]),
  },
  {
    id: "template-u11-bcvb",
    category: "U11",
    level: "Formation",
    title: "U11 - Fondamentaux, information et défense H-H",
    description: "Structurer les bases individuelles, la coopération et la défense Homme à Homme.",
    criteria: withBcvbCore("U11", [
      criterion("u11-info", "lecture_jeu", "Prise d’information", "Observe avant de décider.", "Regarde panier, défenseur et partenaire avant de passer."),
      criterion("u11-coop", "attitude_collective", "Coopération", "Joue avec les autres.", "Se démarque, appelle, encourage et partage la balle."),
      criterion("u11-defense-hh", "fondamentaux_defensifs", "Défense H-H", "Protège l’accès au panier.", "Reste entre son joueur et le panier et communique sur aide."),
      criterion("u11-fondamentaux", "fondamentaux_offensifs", "Passe, dribble, tir", "Réalise un geste utile sous contrainte.", "Choisit dribble, passe ou tir avec une intention claire."),
    ]),
  },
  {
    id: "template-u13-bcvb",
    category: "U13",
    level: "Départemental",
    title: "U13 - Duel, démarquage, tir, passe et intensité",
    description: "Évaluer les bases du 1c1, la lecture simple et l’intensité transférable en match.",
    criteria: withBcvbCore("U13", [
      criterion("u13-1c1-off", "fondamentaux_offensifs", "1c1 offensif", "Attaque un avantage avec maîtrise.", "Engage le duel, protège le ballon et finit équilibré."),
      criterion("u13-1c1-def", "fondamentaux_defensifs", "1c1 défensif", "Contient le porteur.", "Reste devant son joueur sans ouvrir la ligne directe au panier."),
      criterion("u13-demarquage", "jeu", "Démarquage", "Crée une ligne de passe utile.", "Change de rythme, sort de l’ombre et reçoit en mouvement."),
      criterion("u13-transition", "intensite", "Courir", "Court les couloirs en transition.", "Court les couloirs en transition dès la récupération."),
      criterion("u13-lecture", "lecture_jeu", "Lecture simple", "Choisit entre tirer, passer ou attaquer.", "Regarde avant de passer et attaque l’espace libre."),
    ]),
  },
  {
    id: "template-u15-bcvb",
    category: "U15",
    level: "Région",
    title: "U15 - Duel, transition, spacing et autonomie",
    description: "Observer agressivité maîtrisée, spacing, défense H-H et autonomie de joueur en formation.",
    criteria: withBcvbCore("U15", [
      criterion("u15-duel", "agressivite_maitrisee", "Duel maîtrisé", "Gagne son duel sans faute inutile.", "Accepte le contact et reste lucide après le premier avantage."),
      criterion("u15-transition", "intensite", "Transition", "Court vite et se replace vite.", "Sprinte sur changement de possession, en attaque comme en repli."),
      criterion("u15-spacing", "jeu", "Spacing", "Respecte les espaces collectifs.", "Garde largeur/profondeur et libère le couloir d’attaque."),
      criterion("u15-defense", "fondamentaux_defensifs", "Défense H-H", "Pression, aide, reprise.", "Communique en défense sur écran ou aide."),
      criterion("u15-autonomie", "autonomie", "Autonomie", "Comprend et applique le plan.", "Se prépare, questionne, corrige son comportement sans rappel constant."),
    ]),
  },
  {
    id: "template-u18-bcvb",
    category: "U18",
    level: "Pré-région",
    title: "U18 - Lecture, responsabilités et impact collectif",
    description: "Évaluer lecture avancée, exécution, responsabilités, intensité et leadership.",
    criteria: withBcvbCore("U18", [
      criterion("u18-lecture", "lecture_jeu", "Lecture sous pression", "Décide vite sans précipitation.", "Identifie l’aide, le mismatch ou le tir ouvert."),
      criterion("u18-execution", "maitrise", "Exécution", "Réalise le geste demandé au bon tempo.", "Exécute le choix collectif sans perdre précision."),
      criterion("u18-leadership", "attitude_collective", "Leadership", "Fait avancer le groupe.", "Communique avant/après erreur et recadre positivement."),
      criterion("u18-impact-defense", "fondamentaux_defensifs", "Impact défensif", "Influence les possessions adverses.", "Enchaîne pression, aide, contestation et rebond."),
      criterion("u18-role", "autonomie", "Responsabilités", "Tient son rôle dans le plan de match.", "Prépare, annonce et assume ses missions."),
    ]),
  },
  {
    id: "template-seniors-bcvb",
    category: "Seniors",
    level: "Compétition",
    title: "Seniors - Rôle, efficacité, régularité et leadership",
    description: "Mesurer l’impact réel dans le collectif et la régularité sur les rôles attendus.",
    criteria: withBcvbCore("Seniors", [
      criterion("senior-role", "autonomie", "Rôle dans l’équipe", "Comprend et assume son rôle.", "Tient son rôle même quand son usage offensif varie."),
      criterion("senior-efficacite-off", "fondamentaux_offensifs", "Efficacité offensive", "Produit une action utile.", "Crée ou convertit un avantage sans forcer."),
      criterion("senior-impact-def", "fondamentaux_defensifs", "Impact défensif", "Pèse sur la possession adverse.", "Conteste, oriente, aide et sécurise le rebond."),
      criterion("senior-regularite", "assiduite", "Régularité", "Répète son niveau d’engagement.", "Maintient les standards à l’entraînement et en match."),
      criterion("senior-leadership", "attitude_collective", "Leadership", "Aide l’équipe à rester stable.", "Communique clairement et soutient les plus jeunes."),
    ]),
  },
];

export function getAvailableEvaluationTemplates(): EvaluationTemplate[] {
  return evaluationTemplates;
}

export function getEvaluationTemplate(category: string, level?: string): EvaluationTemplate {
  return evaluationTemplates.find((template) => template.category === category && (!level || template.level === level))
    || evaluationTemplates.find((template) => template.category === category)
    || evaluationTemplates.find((template) => template.category === "U13")
    || evaluationTemplates[0];
}

export function getEvaluationTemplateByCategory(category: string, level?: string): EvaluationCriterion[] {
  const template = getEvaluationTemplate(category, level);
  return template.criteria.map((item) => ({
    ...item,
    category,
    level: level || item.level,
  }));
}
