import type { CourtArrowType, CourtObjectType } from '../../modules/sessions/sessionModels'

type CourtToolbarProps = {
  onAddObject: (type: CourtObjectType) => void
  onAddArrow: (type: CourtArrowType) => void
  onAddZone: () => void
}

export function CourtToolbar({ onAddObject, onAddArrow, onAddZone }: CourtToolbarProps) {
  return (
    <div className="court-toolbar">
      <button type="button" onClick={() => onAddObject('offense_player')}>Joueur</button>
      <button type="button" onClick={() => onAddObject('defense_player')}>Défenseur</button>
      <button type="button" onClick={() => onAddObject('cone')}>Plot</button>
      <button type="button" onClick={() => onAddObject('ball')}>Ballon</button>
      <button type="button" onClick={() => onAddObject('screen')}>Écran</button>
      <button type="button" onClick={() => onAddObject('text')}>Texte</button>
      <button type="button" onClick={() => onAddArrow('arrow_move')}>Flèche</button>
      <button type="button" onClick={() => onAddArrow('arrow_pass')}>Passe</button>
      <button type="button" onClick={() => onAddArrow('arrow_dribble')}>Dribble</button>
      <button type="button" onClick={() => onAddArrow('arrow_screen')}>Bloc écran</button>
      <button type="button" onClick={onAddZone}>Zone</button>
    </div>
  )
}
