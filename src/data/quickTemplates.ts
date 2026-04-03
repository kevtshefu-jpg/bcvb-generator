import type { GeneratorState } from "../types/generator";

export const quickTemplates: { name: string; build: () => Partial<GeneratorState> }[] = [
  {
    name: "1c1 aile",
    build: () => ({
      meta: {
        title: "1c1 aile",
        categoryId: "U11",
        themeId: "jeu-rapide",
        step: "Je m'exerce",
        duration: 10,
        players: 6,
        baskets: 1,
        objective: "Attaquer vite le cercle en duel simple.",
        intentions: ["Menacer le panier", "Changer de rythme"],
        coachingPoints: ["Premier pas agressif", "Lecture simple"],
        material: ["Ballons", "Cônes"],
        setup: "Une file attaque, une file défense sur l’aile.",
        instructions: "Sur la réception, l’attaquant joue le duel.",
        successCriteria: "Créer un avantage et finir au cercle.",
        variables: "Limiter les dribbles."
      },
      nodes: [
        { id: "a1", kind: "attacker", label: "A1", position: { x: 35, y: 58 } },
        { id: "d1", kind: "defender", label: "D1", position: { x: 42, y: 54 } },
        { id: "ball1", kind: "ball", position: { x: 31, y: 55 } }
      ],
      actions: []
    })
  },
  {
    name: "Jeu rapide 3 couloirs",
    build: () => ({
      meta: {
        title: "Jeu rapide 3 couloirs",
        categoryId: "U11",
        themeId: "jeu-rapide",
        step: "Je retranscris",
        duration: 12,
        players: 9,
        baskets: 1,
        objective: "Attaquer vite en occupant trois couloirs.",
        intentions: ["Courir large et profond", "Jouer vers l’avant"],
        coachingPoints: ["Exiger la projection", "Limiter les dribbles inutiles"],
        material: ["Ballons", "Cônes", "Chasubles"],
        setup: "Trois couloirs matérialisés par des cônes.",
        instructions: "Le ballon doit avancer vite jusqu’à la finition.",
        successCriteria: "Couloirs respectés, ballon vivant, finition rapide.",
        variables: "Ajouter un défenseur retard."
      }
    })
  }
];
