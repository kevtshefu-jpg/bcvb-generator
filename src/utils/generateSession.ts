import {
  GeneratedSession,
  GeneratorFilters,
  PedagogyStep,
  SessionBlock,
  Situation,
} from '../types/bcvb';
import { situations } from '../data/mockSituations';

const desiredBlocksByStep: Record<PedagogyStep, Array<SessionBlock['typeBloc']>> = {
  decouvrir: ['mise_en_route', 'fondamental', 'apprentissage', 'opposition', 'regulation'],
  exercer: ['mise_en_route', 'fondamental', 'apprentissage', 'opposition', 'regulation'],
  retranscrire: ['mise_en_route', 'fondamental', 'apprentissage', 'opposition', 'regulation'],
  reguler: ['mise_en_route', 'fondamental', 'apprentissage', 'opposition', 'regulation'],
};

function includesMaterial(available: string[], needed: string[]): boolean {
  if (available.length === 0) return true;
  return needed.every((item) => available.includes(item));
}

function scoreSituation(situation: Situation, filters: GeneratorFilters, blockType: SessionBlock['typeBloc']): number {
  let score = 0;

  if (situation.categorie.includes(filters.categorie)) score += 5;
  if (situation.theme === filters.theme) score += 7;
  if (filters.sousTheme && situation.sousTheme === filters.sousTheme) score += 3;
  if (situation.etapePedagogique.includes(filters.etapePedagogique)) score += 5;
  if (situation.intensite === filters.intensite) score += 2;
  if (filters.effectif >= situation.effectifMin && filters.effectif <= situation.effectifMax) score += 3;
  if (includesMaterial(filters.materielDisponible, situation.materiel)) score += 2;

  if (blockType === 'mise_en_route' && situation.theme === 'mise en route') score += 10;
  if (blockType === 'regulation' && situation.theme === 'régulation') score += 10;
  if (blockType === 'opposition' && situation.tagsBCVB.includes('jeu')) score += 4;
  if (blockType === 'fondamental' && situation.tagsBCVB.includes('1c1')) score += 2;

  return score;
}

function pickSituation(
  filters: GeneratorFilters,
  blockType: SessionBlock['typeBloc'],
  usedIds: Set<string>
): Situation {
  const pool = situations
    .filter((s) => s.categorie.includes(filters.categorie))
    .filter((s) => s.effectifMin <= filters.effectif && s.effectifMax >= filters.effectif)
    .filter((s) => includesMaterial(filters.materielDisponible, s.materiel))
    .sort((a, b) => scoreSituation(b, filters, blockType) - scoreSituation(a, filters, blockType));

  const fresh = pool.find((item) => !usedIds.has(item.id));
  return fresh ?? pool[0] ?? situations[0];
}

function distributeDurations(total: number, step: PedagogyStep): number[] {
  if (step === 'decouvrir') {
    return adjust([0.20, 0.24, 0.24, 0.20, 0.12], total);
  }

  if (step === 'retranscrire') {
    return adjust([0.16, 0.20, 0.22, 0.28, 0.14], total);
  }

  if (step === 'reguler') {
    return adjust([0.14, 0.18, 0.22, 0.28, 0.18], total);
  }

  return adjust([0.18, 0.22, 0.24, 0.24, 0.12], total);
}

function adjust(ratios: number[], total: number): number[] {
  const raw = ratios.map((ratio) => Math.round(total * ratio));
  const sum = raw.reduce((acc, value) => acc + value, 0);
  raw[2] += total - sum;
  return raw;
}

function labelStep(step: PedagogyStep): string {
  switch (step) {
    case 'decouvrir':
      return 'Je découvre';
    case 'exercer':
      return 'Je m’exerce';
    case 'retranscrire':
      return 'Je retranscris';
    case 'reguler':
      return 'Je régule';
  }
}

function sessionNotes(filters: GeneratorFilters): string[] {
  const common = [
    'Rappeler le langage BCVB : défendre fort, courir, partager la balle.',
    'Ne garder que 1 à 2 vrais repères prioritaires sur la séance.',
  ];

  if (filters.categorie === 'U7' || filters.categorie === 'U9') {
    return [
      ...common,
      'Mettre du rythme, peu de consignes longues, beaucoup d’engagement moteur.',
      'Favoriser des consignes simples, visibles et répétables.',
    ];
  }

  if (filters.categorie === 'U15' || filters.categorie === 'U18' || filters.categorie === 'Seniors') {
    return [
      ...common,
      'Chercher du transfert réel : lecture, vitesse de décision et exigence d’exécution.',
      'Utiliser les temps morts pédagogiques de façon courte et précise.',
    ];
  }

  return [
    ...common,
    'Faire émerger les repères avant de complexifier les contraintes.',
    'Terminer par une verbalisation brève et concrète.',
  ];
}

export function generateSession(filters: GeneratorFilters): GeneratedSession {
  const blockOrder = desiredBlocksByStep[filters.etapePedagogique];
  const durations = distributeDurations(filters.dureeTotale, filters.etapePedagogique);
  const used = new Set<string>();

  const template: Array<Pick<SessionBlock, 'typeBloc' | 'titre' | 'objectif'>> = [
    {
      typeBloc: blockOrder[0],
      titre: 'Mise en route',
      objectif: 'Activer le groupe et orienter l’attention.',
    },
    {
      typeBloc: blockOrder[1],
      titre: 'Fondamental',
      objectif: 'Installer la forme de jeu ou la base technique prioritaire.',
    },
    {
      typeBloc: blockOrder[2],
      titre: 'Situation coeur',
      objectif: 'Créer des répétitions ciblées et transférables.',
    },
    {
      typeBloc: blockOrder[3],
      titre: 'Opposition / transfert',
      objectif: 'Valider en lecture réelle et sous contrainte.',
    },
    {
      typeBloc: blockOrder[4],
      titre: 'Régulation',
      objectif: 'Stabiliser, verbaliser et finir avec du sens.',
    },
  ];

  const blocs: SessionBlock[] = template.map((item, index) => {
    const situation = pickSituation(filters, item.typeBloc, used);
    used.add(situation.id);

    return {
      ordre: index + 1,
      typeBloc: item.typeBloc,
      titre: item.titre,
      objectif: item.objectif,
      duree: durations[index],
      situation,
      pointsCoaching: situation.pointsVigilance.slice(0, 3),
    };
  });

  return {
    titre: `${filters.categorie} · ${filters.theme} · ${labelStep(filters.etapePedagogique)}`,
    categorie: filters.categorie,
    theme: filters.theme,
    dureeTotale: filters.dureeTotale,
    effectif: filters.effectif,
    etapePedagogique: filters.etapePedagogique,
    intensite: filters.intensite,
    blocs,
    notesCoach: sessionNotes(filters),
  };
}
