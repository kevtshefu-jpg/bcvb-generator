import type { CourtDiagramProps } from '../components/BCVBCourtDiagram'
import type { BCVBParsedBlock } from './parseBCVBRichMarkdown'

function includes(value: string, words: string[]) {
  const normalized = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  return words.some((word) => normalized.includes(word))
}

export function inferDiagramFromSituation(situation: BCVBParsedBlock): CourtDiagramProps {
  const title = situation.fields.title || situation.fields.titre || situation.fields.numero || 'Situation BCVB'
  const searchable = `${title} ${situation.fields.objectif ?? ''} ${situation.fields.deroulement ?? ''}`

  if (includes(searchable, ['maison', 'couleur', 'zone'])) {
    return {
      title: `${title} — schéma inféré`,
      court: 'half',
      intent: 'Visualiser les zones à rejoindre et sécuriser les trajectoires.',
      players: [
        { id: 'J1', team: 'offense', x: 50, y: 70, label: '1' },
        { id: 'J2', team: 'offense', x: 44, y: 75, label: '2' },
        { id: 'J3', team: 'offense', x: 56, y: 75, label: '3' },
        { id: 'R', team: 'cone', x: 25, y: 38, label: 'Rouge' },
        { id: 'B', team: 'cone', x: 75, y: 38, label: 'Bleu' },
      ],
      arrows: [{ type: 'move', from: 'J1', toX: 25, toY: 38, label: 'signal' }],
      zones: [
        { x: 25, y: 38, width: 18, height: 16, label: 'Maison' },
        { x: 75, y: 38, width: 18, height: 16, label: 'Maison' },
      ],
      notes: ['Schéma généré automatiquement à partir de la situation.'],
    }
  }

  if (includes(searchable, ['parcours', 'slalom'])) {
    return {
      title: `${title} — parcours`,
      court: 'half',
      intent: 'Rendre visible le départ, les repères et la cible.',
      players: [
        { id: 'J1', team: 'offense', x: 50, y: 78, label: '1' },
        { id: 'P1', team: 'cone', x: 42, y: 62, label: '' },
        { id: 'P2', team: 'cone', x: 58, y: 50, label: '' },
        { id: 'C', team: 'cone', x: 50, y: 30, label: 'Cible' },
      ],
      ball: { x: 50, y: 78 },
      arrows: [{ type: 'dribble', from: 'J1', toX: 50, toY: 30, label: 'parcours' }],
      notes: ['Les plots structurent la trajectoire sans bloquer la créativité.'],
    }
  }

  if (includes(searchable, ['goutte', 'dribble'])) {
    return {
      title: `${title} — dribble`,
      court: 'half',
      intent: 'Identifier le porteur, la cible et la trajectoire dribble.',
      players: [
        { id: 'J1', team: 'offense', x: 50, y: 72, label: '1' },
        { id: 'C', team: 'cone', x: 50, y: 38, label: 'cible' },
      ],
      ball: { x: 50, y: 72 },
      arrows: [{ type: 'dribble', from: 'J1', toX: 50, toY: 38, label: 'dribble' }],
      notes: ['Le ballon reste proche du corps, regard disponible.'],
    }
  }

  if (includes(searchable, ['facteur', 'passe', 'reception'])) {
    return {
      title: `${title} — passes`,
      court: 'half',
      intent: 'Visualiser triangle de passe et déplacement après passe.',
      players: [
        { id: 'J1', team: 'offense', x: 35, y: 66, label: '1' },
        { id: 'J2', team: 'offense', x: 65, y: 66, label: '2' },
        { id: 'J3', team: 'offense', x: 50, y: 42, label: '3' },
      ],
      ball: { x: 35, y: 66 },
      arrows: [
        { type: 'pass', from: 'J1', toX: 65, toY: 66, label: 'passe' },
        { type: 'move', from: 'J1', toX: 50, toY: 42, label: 'suit' },
      ],
      notes: ['Passer puis se rendre disponible immédiatement.'],
    }
  }

  if (includes(searchable, ['miroir', 'defense', 'défense'])) {
    return {
      title: `${title} — duel miroir`,
      court: 'half',
      intent: 'Installer le face-à-face et le couloir de déplacement.',
      players: [
        { id: 'A1', team: 'offense', x: 45, y: 66, label: '1' },
        { id: 'D1', team: 'defense', x: 55, y: 66, label: 'X1' },
      ],
      arrows: [
        { type: 'move', from: 'A1', toX: 45, toY: 42, label: 'attaque' },
        { type: 'move', from: 'D1', toX: 55, toY: 42, label: 'miroir' },
      ],
      zones: [{ x: 50, y: 54, width: 26, height: 46, label: 'couloir' }],
      notes: ['Le défenseur reste entre l’attaquant et la cible.'],
    }
  }

  if (includes(searchable, ['chasseur', 'tresor', 'trésor'])) {
    return {
      title: `${title} — chasseurs / trésor`,
      court: 'half',
      intent: 'Identifier la zone à protéger, les chasseurs et la cible à atteindre.',
      players: [
        { id: 'J1', team: 'offense', x: 38, y: 70, label: '1' },
        { id: 'J2', team: 'offense', x: 52, y: 70, label: '2' },
        { id: 'D1', team: 'defense', x: 50, y: 48, label: 'X' },
        { id: 'T', team: 'cone', x: 50, y: 28, label: 'trésor' },
      ],
      ball: { x: 38, y: 70 },
      arrows: [
        { type: 'dribble', from: 'J1', toX: 50, toY: 28, label: 'attaque' },
        { type: 'move', from: 'D1', toX: 45, toY: 58, label: 'chasse' },
      ],
      zones: [{ x: 50, y: 28, width: 28, height: 14, label: 'trésor' }],
      notes: ['Schéma généré automatiquement à partir de la situation.'],
    }
  }

  if (includes(searchable, ['1c1', '1 contre 1', 'un contre un'])) {
    return {
      title: `${title} — duel 1c1`,
      court: 'half',
      intent: 'Clarifier le départ attaquant/défenseur et la cible.',
      players: [
        { id: 'A1', team: 'offense', x: 42, y: 68, label: '1' },
        { id: 'D1', team: 'defense', x: 48, y: 58, label: 'X1' },
        { id: 'C', team: 'cone', x: 70, y: 42, label: 'porte' },
      ],
      ball: { x: 42, y: 68 },
      arrows: [
        { type: 'dribble', from: 'A1', toX: 58, toY: 38, label: 'attaque' },
        { type: 'move', from: 'D1', toX: 54, toY: 42, label: 'contient' },
      ],
      notes: ['Duel simplifié : attaquer l’espace, contenir sans faute.'],
    }
  }

  if (includes(searchable, ['2c1', '2 contre 1', 'surnombre'])) {
    return {
      title: `${title} — surnombre 2c1`,
      court: 'half',
      intent: 'Lire le défenseur pour choisir entre attaque du cercle et passe.',
      players: [
        { id: 'A1', team: 'offense', x: 38, y: 70, label: '1' },
        { id: 'A2', team: 'offense', x: 66, y: 62, label: '2' },
        { id: 'D1', team: 'defense', x: 52, y: 48, label: 'X1' },
      ],
      ball: { x: 38, y: 70 },
      arrows: [
        { type: 'dribble', from: 'A1', toX: 50, toY: 42, label: 'fixe' },
        { type: 'pass', from: 'A1', toX: 66, toY: 36, label: 'donne' },
      ],
      zones: [{ x: 50, y: 40, width: 28, height: 24, label: 'lecture' }],
      notes: ['Créer un avantage simple : fixer avant de transmettre.'],
    }
  }

  if (includes(searchable, ['2c2', 'aide', 'aide defensive', 'aide défensive'])) {
    return {
      title: `${title} — aide 2c2`,
      court: 'half',
      intent: 'Visualiser l’aide, le replacement et la protection du cercle.',
      players: [
        { id: 'A1', team: 'offense', x: 36, y: 68, label: '1' },
        { id: 'A2', team: 'offense', x: 68, y: 46, label: '2' },
        { id: 'D1', team: 'defense', x: 42, y: 58, label: 'X1' },
        { id: 'D2', team: 'defense', x: 60, y: 42, label: 'X2' },
      ],
      ball: { x: 36, y: 68 },
      arrows: [
        { type: 'dribble', from: 'A1', toX: 48, toY: 44, label: 'attaque' },
        { type: 'move', from: 'D2', toX: 52, toY: 38, label: 'aide' },
      ],
      notes: ['Aider sans abandonner totalement son joueur.'],
    }
  }

  if (includes(searchable, ['3c0', '3c2', 'jeu rapide', 'transition', 'contre attaque'])) {
    return {
      title: `${title} — jeu rapide`,
      court: 'full',
      intent: 'Installer les couloirs de course et la passe vers l’avant.',
      players: [
        { id: 'A1', team: 'offense', x: 28, y: 74, label: '1' },
        { id: 'A2', team: 'offense', x: 50, y: 78, label: '2' },
        { id: 'A3', team: 'offense', x: 72, y: 74, label: '3' },
        { id: 'D1', team: 'defense', x: 48, y: 42, label: 'X1' },
        { id: 'D2', team: 'defense', x: 62, y: 36, label: 'X2' },
      ],
      ball: { x: 50, y: 78 },
      arrows: [
        { type: 'move', from: 'A1', toX: 28, toY: 28, label: 'large' },
        { type: 'pass', from: 'A2', toX: 72, toY: 44, label: 'avance' },
        { type: 'move', from: 'A3', toX: 72, toY: 30, label: 'couloir' },
      ],
      notes: ['Courir large, passer devant, finir vite ou ressortir.'],
    }
  }

  if (includes(searchable, ['rebond', 'ecran retard', 'écran retard'])) {
    return {
      title: `${title} — rebond / écran retard`,
      court: 'half',
      intent: 'Montrer le contact, le contrôle joueur et l’accès au ballon.',
      players: [
        { id: 'A1', team: 'offense', x: 43, y: 34, label: '1' },
        { id: 'D1', team: 'defense', x: 43, y: 44, label: 'X1' },
        { id: 'A2', team: 'offense', x: 60, y: 36, label: '2' },
        { id: 'D2', team: 'defense', x: 60, y: 46, label: 'X2' },
      ],
      ball: { x: 50, y: 18 },
      arrows: [
        { type: 'shot', from: 'A1', toX: 50, toY: 16, label: 'tir' },
        { type: 'screen', from: 'D1', toX: 43, toY: 52, label: 'retard' },
      ],
      notes: ['Voir le tir, contacter, pivoter, aller chercher.'],
    }
  }

  if (includes(searchable, ['close-out', 'close out', 'sortie defensive', 'sortie défensive'])) {
    return {
      title: `${title} — close-out`,
      court: 'half',
      intent: 'Freiner la course défensive et contenir le porteur.',
      players: [
        { id: 'A1', team: 'offense', x: 72, y: 42, label: '1' },
        { id: 'D1', team: 'defense', x: 50, y: 28, label: 'X1' },
        { id: 'C', team: 'coach', x: 38, y: 70, label: 'Coach' },
      ],
      ball: { x: 72, y: 42 },
      arrows: [{ type: 'move', from: 'D1', toX: 68, toY: 44, label: 'freine' }],
      notes: ['Petits appuis à l’arrivée, main haute, contenir la première poussée.'],
    }
  }

  if (includes(searchable, ['passe et va', 'jeu sans ballon', 'coupe'])) {
    return {
      title: `${title} — passe et va`,
      court: 'half',
      intent: 'Enchaîner passe, coupe et remplacement.',
      players: [
        { id: 'A1', team: 'offense', x: 35, y: 64, label: '1' },
        { id: 'A2', team: 'offense', x: 65, y: 58, label: '2' },
        { id: 'D1', team: 'defense', x: 42, y: 52, label: 'X1' },
      ],
      ball: { x: 35, y: 64 },
      arrows: [
        { type: 'pass', from: 'A1', toX: 65, toY: 58, label: 'passe' },
        { type: 'move', from: 'A1', toX: 50, toY: 30, label: 'coupe' },
      ],
      notes: ['Après la passe, changer de rythme et attaquer le cercle.'],
    }
  }

  if (includes(searchable, ['relais', 'transition', 'jeu rapide', 'contre attaque'])) {
    return {
      title: `${title} — transition`,
      court: 'full',
      intent: 'Visualiser la course vers l’avant et le couloir de passe.',
      players: [
        { id: 'J1', team: 'offense', x: 32, y: 72, label: '1' },
        { id: 'J2', team: 'offense', x: 50, y: 76, label: '2' },
        { id: 'J3', team: 'offense', x: 68, y: 72, label: '3' },
        { id: 'C', team: 'cone', x: 50, y: 22, label: 'cible' },
      ],
      ball: { x: 50, y: 76 },
      arrows: [
        { type: 'move', from: 'J1', toX: 28, toY: 32, label: 'court' },
        { type: 'pass', from: 'J2', toX: 68, toY: 42, label: 'avance' },
        { type: 'move', from: 'J3', toX: 68, toY: 32, label: 'couloir' },
      ],
      notes: ['Les couloirs de course restent larges pour faciliter la lecture.'],
    }
  }

  if (includes(searchable, ['tir', 'cible'])) {
    return {
      title: `${title} — tir`,
      court: 'half',
      intent: 'Matérialiser la zone de tir et la cible.',
      players: [{ id: 'J1', team: 'offense', x: 50, y: 58, label: '1' }],
      ball: { x: 50, y: 58 },
      arrows: [{ type: 'shot', from: 'J1', toX: 50, toY: 18, label: 'tir' }],
      zones: [{ x: 50, y: 58, width: 24, height: 16, label: 'zone tir' }],
      notes: ['Finir équilibré, viser haut, accompagner le geste.'],
    }
  }

  return {
    title: `${title} — organisation minimale`,
    court: 'half',
    intent: 'Schéma minimal généré automatiquement pour accompagner la situation.',
    players: [
      { id: 'J1', team: 'offense', x: 45, y: 68, label: '1' },
      { id: 'J2', team: 'offense', x: 55, y: 68, label: '2' },
      { id: 'C', team: 'cone', x: 50, y: 38, label: 'repère' },
    ],
    arrows: [{ type: 'move', from: 'J1', toX: 50, toY: 38, label: 'action' }],
    notes: ['Schéma inféré : compléter les données si une organisation plus précise est nécessaire.'],
  }
}
