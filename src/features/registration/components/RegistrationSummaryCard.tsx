type RegistrationSummaryCardProps = {
  fullName: string
  email: string
  roleLabel: string
  category: string
  team?: string
  notes?: string
  clubLink?: string
}

function getValue(value?: string) {
  return value?.trim() || '—'
}

export default function RegistrationSummaryCard({
  fullName,
  email,
  roleLabel,
  category,
  team,
  notes,
  clubLink,
}: RegistrationSummaryCardProps) {
  return (
    <article className="registration-page__summaryCard">
      <div>
        <span>Nom complet</span>
        <strong>{getValue(fullName)}</strong>
      </div>

      <div>
        <span>Email</span>
        <strong>{getValue(email)}</strong>
      </div>

      <div>
        <span>Type de demande</span>
        <strong>{getValue(roleLabel)}</strong>
      </div>

      <div>
        <span>Catégorie</span>
        <strong>{getValue(category)}</strong>
      </div>

      <div>
        <span>Équipe / groupe</span>
        <strong>{getValue(team)}</strong>
      </div>

      <div>
        <span>Lien avec le club</span>
        <strong>{getValue(clubLink)}</strong>
      </div>

      <div className="registration-page__summaryCardFull">
        <span>Notes</span>
        <p>{getValue(notes)}</p>
      </div>
    </article>
  )
}
