# BCVB Rich Markdown

BCVB Rich Markdown est une couche optionnelle au-dessus du Markdown classique.

Objectifs :
- garder les anciens documents compatibles ;
- permettre aux nouveaux documents de produire des blocs éditoriaux premium ;
- rester assez simple pour être utilisé dans un cadre de rédaction ;
- fournir un rendu web et PDF plus proche d’un vrai document club.

## Principes

- Le Markdown classique reste valide.
- Les blocs enrichis sont délimités par `:::` et doivent toujours être typés :

```md
:::bcvb-planning
title: Planification annuelle
table:
| Période / Phase | Priorités | Contenus | Objectifs | Vigilances |
|---|---|---|---|---|
| Septembre | Cadre et motricité | Jeux moteurs | Installer les repères | Consignes courtes |
:::
```

- Les blocs génériques `:::` sans type ne sont pas valides pour les nouveaux documents.
- Si un bloc enrichi est absent ou imparfait, le lecteur continue d’afficher le contenu sans planter.
- Les schémas terrain utilisent `:::bcvb-diagram`.

## Blocs supportés

### Hero

```md
:::bcvb-hero
title: Cahier technique U11
subtitle: Défendre fort, courir et partager la balle
:::
```

### Identité BCVB

```md
:::bcvb-identity
title: Identité de catégorie
content: La catégorie construit les premiers repères collectifs.
:::
```

### Planification / Progression / Séance

```md
:::bcvb-planning
title: Planification par périodes
table:
| Période / Phase | Priorités | Contenus | Objectifs | Vigilances |
|---|---|---|---|---|
| P1 | Cadre | Jeux moteurs | Installer les habitudes | Rester simple |
:::
```

Variantes reconnues :
- `bcvb-planning`
- `bcvb-progression`
- `bcvb-session`
- `bcvb-criteria`
- `bcvb-vigilance`
- `bcvb-synthesis`
- `bcvb-takeaway`

### Situation pédagogique

```md
:::bcvb-situation
numero: Situation 1
title: 1c1 couloir
finalite: Attaquer le cercle en protégeant son ballon.
objectif: Fixer un défenseur et finir proche du cercle.
organisation: Deux files à 45°, un défenseur actif, départ sur réception.
materiel: 4 plots, 2 ballons, chasubles.
deroulement: Le joueur attaque le couloir, le défenseur contient.
consignes_joueurs: Lever les yeux, protéger le ballon, finir fort.
points_coach: Valoriser le premier pas et l’épaule engagée.
criteres_reussite: Tir proche du cercle ou faute provoquée.
variables_simplification: Agrandir le couloir.
variables_complexification: Ajouter une aide retardée.
evolution_1: Défenseur actif après un temps de retard.
evolution_2: Aide défensive depuis l’axe.
transfert_match: Lire le duel extérieur et attaquer l’espace libre.
erreurs_frequentes: Départ sans lever les yeux, dribble trop haut.
corrections_possibles: Réduire l’espace, donner un repère d’épaule, valoriser le premier pas.
:::

:::bcvb-diagram
title: 1c1 couloir — départ à 45°
court: half
players:
  - id: A1
    team: offense
    x: 42
    y: 68
    label: 1
  - id: D1
    team: defense
    x: 46
    y: 60
    label: X1
ball:
  x: 42
  y: 68
arrows:
  - type: dribble
    from: A1
    toX: 58
    toY: 45
zones:
  - x: 50
    y: 50
    width: 22
    height: 28
    label: Couloir
notes:
  - Le porteur attaque l’épaule extérieure.
:::
```

### Diagramme terrain seul

```md
:::bcvb-diagram
title: Sortie de pression
court: full
players:
  - id: A1
    team: offense
    x: 20
    y: 75
    label: 1
ball:
  x: 20
  y: 75
arrows:
  - type: pass
    from: A1
    toX: 45
    toY: 55
:::
```

Convention :
- `court`: `half` ou `full`
- coordonnées `x` / `y` en pourcentage de 0 à 100
- `team`: `offense`, `defense`, `coach`, `cone`
- `arrows.type`: `move`, `pass`, `dribble`, `shot`, `screen`
- `zones`: optionnel, pour afficher un couloir, une cible ou une zone à défendre

## Contrôle qualité

Le formulaire d’enregistrement manuel analyse le contenu collé avant sauvegarde :
- nombre de tableaux ;
- nombre de situations ;
- nombre de diagrammes ;
- présence des planifications, cycles, séances types et synthèses ;
- détection de traces méta ou de recommandations de mise en page.

Le contrôle n’empêche pas systématiquement la sauvegarde. Il sert d’alerte éditoriale avant publication.
