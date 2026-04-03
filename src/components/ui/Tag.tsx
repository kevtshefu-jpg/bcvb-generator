interface Props {
  label: string;
  active?: boolean;
}

export function Tag({ label, active }: Props) {
  return <span className={`tag${active ? ' bcvb-chip--active' : ''}`}>{label}</span>;
}
