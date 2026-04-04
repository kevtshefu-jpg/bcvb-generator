import { Link } from "react-router-dom";
import { PageHeader } from "../../../components/ui/PageHeader";
import { SectionCard } from "../../../components/ui/SectionCard";
import { Tag } from "../../../components/ui/Tag";

export function HomePage() {
  return (
    <>
      <PageHeader
        title="BCVB Platform"
        subtitle="Référentiel, générateur et espace membre dans une même base de travail."
      />

      <section className="hero-bcvb hero-bcvb--premium">
        <div>
          <div className="hero-bcvb__eyebrow">Version premium</div>
          <h2 style={{ marginTop: 0 }}>Le site public s’ouvre sur une plateforme privée réservée aux membres.</h2>
          <p style={{ lineHeight: 1.6 }}>
            Le projet BCVB s’organise autour d’une identité forte : défendre fort, courir et partager
            la balle. La formation s’appuie sur l’intensité, l’agressivité, la maîtrise et le jeu.
          </p>
        </div>

        <div className="hero-bcvb__actions">
          <Link to="/connexion" className="primary-button">Accéder à l’espace membre</Link>
          <Link to="/situations" className="secondary-button">Voir la banque de situations</Link>
        </div>

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
        <SectionCard title="Référentiel club">
          <p>Une base claire pour harmoniser les contenus, les repères et les exigences.</p>
        </SectionCard>

        <SectionCard title="Générateur terrain">
          <p>Créer des situations lisibles, coachables et exportables rapidement.</p>
        </SectionCard>

        <SectionCard title="Espace membres">
          <p>Limiter l’accès, différencier les rôles et préparer une vraie plateforme club.</p>
        </SectionCard>
      </div>
    </>
  );
}
