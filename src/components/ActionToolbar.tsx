export type ActionType = 'deplacement' | 'passe' | 'dribble' | 'tir' | 'ecran';

interface Action {
  id: ActionType;
  label: string;
}

const ACTIONS: Action[] = [
  { id: 'deplacement', label: '➤ Déplacement' },
  { id: 'passe',       label: '➤ Passe' },
  { id: 'dribble',     label: '➤ Dribble' },
  { id: 'tir',         label: '➤ Tir' },
  { id: 'ecran',       label: '➤ Écran' },
];

interface Props {
  active?: ActionType | null;
  onSelect: (action: ActionType) => void;
}

export function ActionToolbar({ active, onSelect }: Props) {
  return (
    <div className="bcvb-toolbar" role="toolbar" aria-label="Actions terrain">
      {ACTIONS.map(({ id, label }) => (
        <button
          key={id}
          className={`bcvb-btn${active === id ? ' bcvb-btn--active' : ''}`}
          onClick={() => onSelect(id)}
          aria-pressed={active === id}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
