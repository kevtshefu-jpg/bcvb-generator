import { useMemo, useState } from 'react';
import { situations } from '../data/mockSituations';
import { Category, PedagogyStep } from '../types/bcvb';

const categoryOptions: Array<Category | 'Toutes'> = [
  'Toutes',
  'U7',
  'U9',
  'U11',
  'U13',
  'U15',
  'U18',
  'Seniors',
];

const stepOptions: Array<PedagogyStep | 'Toutes'> = [
  'Toutes',
  'decouvrir',
  'exercer',
  'retranscrire',
  'reguler',
];

export function SituationsPage() {
  const [category, setCategory] = useState<Category | 'Toutes'>('Toutes');
  const [step, setStep] = useState<PedagogyStep | 'Toutes'>('Toutes');
  const [theme, setTheme] = useState('');

  const filtered = useMemo(() => {
    return situations.filter((situation) => {
      const okCategory =
        category === 'Toutes' ? true : situation.categorie.includes(category);

      const okStep =
        step === 'Toutes' ? true : situation.etapePedagogique.includes(step);

      const okTheme = theme.trim()
        ? `${situation.theme} ${situation.sousTheme} ${situation.titre}`
            .toLowerCase()
            .includes(theme.trim().toLowerCase())
        : true;

      return okCategory && okStep && okTheme;
    });
  }, [category, step, theme]);

  return (
    <main className="app-shell">
      <header className="section-hero">
        <span className="eyebrow">Base pédagogique</span>
        <h1>Banque de situations</h1>
        <p>
          Un premier niveau de bibliothèque filtrable pour relier les situations au générateur
          de séance et au référentiel club.
        </p>
      </header>

      <section className="panel filters-bar">
        <div className="grid-3">
          <label>
            <span>Catégorie</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category | 'Toutes')}
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Étape pédagogique</span>
            <select
              value={step}
              onChange={(e) => setStep(e.target.value as PedagogyStep | 'Toutes')}
            >
              {stepOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Recherche thème / titre</span>
            <input
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="Ex : 1c1, transition, mise en route..."
            />
          </label>
        </div>
      </section>

      <section className="situations-list">
        {filtered.map((situation) => (
          <article key={situation.id} className="panel situation-row">
            <div className="situation-row__head">
              <div>
                <span className="situation-theme">{situation.theme}</span>
                <h3>{situation.titre}</h3>
              </div>
              <span className="duration-pill">{situation.duree} min</span>
            </div>

            <div className="session-meta">
              <span>{situation.sousTheme}</span>
              <span>{situation.terrain}</span>
              <span>{situation.intensite}</span>
              <span>
                {situation.effectifMin} à {situation.effectifMax} joueurs
              </span>
            </div>

            <div className="situation-grid">
              <div>
                <span className="field-title">Objectifs</span>
                <ul className="clean-list">
                  {situation.objectifs.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="field-title">Consignes</span>
                <ul className="clean-list">
                  {situation.consignes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="field-title">Vigilance coach</span>
                <ul className="clean-list">
                  {situation.pointsVigilance.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
