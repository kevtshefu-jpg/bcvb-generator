type BeforeAfterDiffProps = {
  before: string;
  after: string;
};

export default function BeforeAfterDiff({ before, after }: BeforeAfterDiffProps) {
  return (
    <section className="before-after-diff">
      <article>
        <h3>Avant</h3>
        <pre>{before.slice(0, 4000) || "Aucun contenu."}</pre>
      </article>
      <article>
        <h3>Après</h3>
        <pre>{after.slice(0, 4000) || "Aucune correction lancée."}</pre>
      </article>
    </section>
  );
}
