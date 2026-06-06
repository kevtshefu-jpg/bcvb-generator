export function DirectorStatusBadge({ status }: { status: string }) {
  const labels: Record<string, string> = {
    ok: "OK",
    warning: "À surveiller",
    critical: "Critique",
    info: "Info",
    published: "Publié",
    pending_validation: "À valider",
    to_correct: "À corriger",
    not_publishable: "Non publiable",
    archived: "Archivé",
    missing: "Manquant",
    draft: "Brouillon",
    validated: "Validé",
    up_to_date: "À jour",
    late: "En retard",
  };

  return <span className={`director-status-badge director-status-badge--${status}`}>{labels[status] || status}</span>;
}
