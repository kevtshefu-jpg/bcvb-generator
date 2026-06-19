import { useMemo, useState } from 'react'
import {
  coachCategoryLabels,
  getTemplatesByCategory,
  type CoachCategory,
  type CoachSessionTemplate,
} from './coachSessionTemplates'
import './coach-session-templates.css'

type CoachSessionTemplatePickerProps = {
  selectedCategory?: CoachCategory
  onSelectTemplate: (template: CoachSessionTemplate) => void
}

const categoryFilters: Array<CoachCategory | 'all'> = [
  'all',
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'SENIORS',
]

function getCategoryLabel(category: CoachCategory | 'all') {
  return category === 'all' ? 'Toutes' : coachCategoryLabels[category]
}

export default function CoachSessionTemplatePicker({
  selectedCategory,
  onSelectTemplate,
}: CoachSessionTemplatePickerProps) {
  const [category, setCategory] = useState<CoachCategory | 'all'>(selectedCategory || 'all')

  const templates = useMemo(() => getTemplatesByCategory(category), [category])

  return (
    <section className="coach-session-template-picker" aria-label="Modèles de séances coach">
      <header className="coach-session-template-picker__header">
        <div>
          <p className="bcvb-eyebrow">Modèles coach</p>
          <h2>Séances prêtes à adapter</h2>
          <p>
            Choisis une catégorie, applique une base cohérente, puis ajuste librement l’objectif,
            les situations et les consignes.
          </p>
        </div>

        <span>{templates.length} modèles</span>
      </header>

      <div className="coach-session-template-picker__filters" aria-label="Filtrer les modèles">
        {categoryFilters.map((filter) => (
          <button
            type="button"
            key={filter}
            className={category === filter ? 'is-active' : ''}
            onClick={() => setCategory(filter)}
          >
            {getCategoryLabel(filter)}
          </button>
        ))}
      </div>

      <div className="coach-session-template-picker__grid">
        {templates.map((template) => (
          <article className="coach-session-template-card" key={template.id}>
            <div className="coach-session-template-card__topline">
              <span>{coachCategoryLabels[template.category]}</span>
              <span>{template.duration} min</span>
            </div>

            <h3>{template.title}</h3>
            <p>{template.description}</p>

            <dl className="coach-session-template-card__meta">
              <div>
                <dt>Objectif</dt>
                <dd>{template.objective}</dd>
              </div>

              <div>
                <dt>BCVB</dt>
                <dd>{template.bcvbPillar}</dd>
              </div>

              <div>
                <dt>Pédagogie</dt>
                <dd>{template.pedagogicalStep}</dd>
              </div>
            </dl>

            <ul className="coach-session-template-card__blocks">
              {template.blocks.slice(0, 5).map((block) => (
                <li key={block}>{block}</li>
              ))}
            </ul>

            <button type="button" onClick={() => onSelectTemplate(template)}>
              Utiliser ce modèle
            </button>
          </article>
        ))}
      </div>
    </section>
  )
}
