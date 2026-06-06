export function PlanningSessionLinker({
  linkedSessionIds,
  onChange,
  disabled,
}: {
  linkedSessionIds: string[];
  onChange: (linkedSessionIds: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <input
      value={linkedSessionIds.join(", ")}
      onChange={(event) => onChange(event.target.value.split(",").map((item) => item.trim()).filter(Boolean))}
      placeholder="IDs séances liées"
      aria-label="Séances liées"
      disabled={disabled}
    />
  );
}
