import type { GeneratorState } from '../types/generator';

export interface StarterTemplate {
  id: string;
  label: string;
  description: string;
  state: Partial<GeneratorState>;
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    id: 'transition-3c2',
    label: 'Transition 3c2',
    description: '3 attaquants vs 2 défenseurs en vitesse de remplacement',
    state: {
      nom: 'Transition 3c2',
      theme: 'Jeu rapide',
      etapePedagogique: 'retranscrire',
      objectif: 'Exploiter le surnombre en transition',
      tags: ['Créer avantage', 'Attaquer panier'],
    },
  },
  {
    id: '1c1-sur-catch',
    label: '1c1 sur catch',
    description: 'Lecture et attaque immédiate après réception',
    state: {
      nom: '1c1 sur catch',
      theme: '1c1',
      etapePedagogique: 'exercer',
      objectif: 'Attaquer le défenseur dès la réception',
      tags: ['Fixer défenseur', 'Attaquer panier'],
    },
  },
  {
    id: 'lay-up-russe',
    label: 'Lay-up russe',
    description: 'Circuit de finition à deux mains en mouvement',
    state: {
      nom: 'Lay-up russe',
      theme: 'Tir',
      etapePedagogique: 'exercer',
      objectif: 'Maîtriser le lay-up des deux côtés',
      tags: [],
    },
  },
];
