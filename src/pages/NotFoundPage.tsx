import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../styles/not-found.css";

export default function NotFoundPage() {
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Page introuvable · BCVB Référentiel";
    titleRef.current?.focus();

    return () => {
      document.title = previousTitle;
    };
  }, []);

  function openMenu() {
    const mobileMenuButton = document.querySelector<HTMLButtonElement>(
      'button[aria-controls="mobile-navigation-panel"]'
    );

    if (mobileMenuButton && mobileMenuButton.getAttribute("aria-expanded") !== "true") {
      mobileMenuButton.click();
    }

    window.setTimeout(() => {
      document.querySelector<HTMLElement>("#mobile-navigation-panel a, .sidebar a")?.focus();
    }, 0);
  }

  return (
    <main className="bcvb-page not-found-page" aria-labelledby="not-found-title">
      <section className="not-found-card">
        <div className="not-found-card__content">
          <p className="bcvb-eyebrow">Erreur 404</p>
          <h1 id="not-found-title" ref={titleRef} tabIndex={-1}>Page introuvable</h1>
          <p>
            Cette page n’existe pas ou n’est plus disponible.
          </p>
        </div>
        <div className="not-found-card__actions">
          <Link className="not-found-card__primary" to="/">Retour à l’accueil</Link>
          <button className="not-found-card__secondary" type="button" onClick={openMenu}>Ouvrir le menu</button>
        </div>
      </section>
    </main>
  );
}
