import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";

export function HomePage() {
  return (
    <>
      <PageHeader
        title="Référentiel BCVB"
        subtitle="Un référentiel de terrain pour aider les coachs à construire, corriger et faire progresser."
      />

      <section className="hero-bcvb">
        <h2 style={{ marginTop: 0 }}>Identité BCVB</h2>
        <p style={{ lineHeight: 1.6 }}>
          Le projet club s’organise autour d’une identité forte : défendre fort,
          courir et partager la balle. La formation s’appuie sur l’intensité,
          l’agressivité, la maîtrise et le jeu.
        </p>

        <div className="hero-bcvb__identity">
          <span className="hero-pill">Défendre Fort</span>
          <span className="hero-pill">Courir</span>
          <span className="hero-pill">Partager la balle</span>
        </div>

        <div className="tag-list" style={{ marginTop: 14 }}>
          <Tag label="Je découvre" />
          <Tag label="Je m'exerce" />
          <Tag label="Je retranscris" />
          <Tag label="Je régule" />
        </div>
      </section>

      <div className="grid-3">
        <SectionCard title="Mini-basket">
          <p>Le jeu comme moteur principal de l’apprentissage.</p>
        </SectionCard>

        <SectionCard title="Aisance avec ballon">
          <p>Manipuler, contrôler, sentir, dissocier, regarder ailleurs.</p>
        </SectionCard>

        <SectionCard title="Tir">
          <p>Beaucoup de répétitions utiles, du proche au dynamique.</p>
        </SectionCard>

        <SectionCard title="Jeu rapide">
          <p>Courir, lire, attaquer vite, occuper les couloirs.</p>
        </SectionCard>

        <SectionCard title="Défense du jeune joueur">
          <p>Gagner le duel, ralentir le ballon, protéger le panier.</p>
        </SectionCard>

        <SectionCard title="Méthodologie coach">
          <p>Objectif clair, explication courte, pratique dense, correction juste.</p>
        </SectionCard>
      </div>
    </>
  );
}
