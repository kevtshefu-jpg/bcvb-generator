import { Link } from "react-router-dom";
import type { FaqItem } from "../../types/faq";
import { faqCategoryLabels, faqRoleLabels } from "../../lib/faq/faqData";
import FaqLinkedTutorials from "./FaqLinkedTutorials";

type FaqCardProps = {
  item: FaqItem;
  highlighted?: boolean;
};

function routeLabel(route: string) {
  return route.replace(/^\//, "") || "accueil";
}

export default function FaqCard({ item, highlighted = false }: FaqCardProps) {
  return (
    <details className={highlighted ? "faq-card faq-card--highlighted" : "faq-card"} open={highlighted || undefined}>
      <summary>
        <span className={`faq-priority faq-priority--${item.priority}`}>{item.priority}</span>
        <span className="faq-card__category">{faqCategoryLabels[item.category]}</span>
        <strong>{item.question}</strong>
        <em>{item.shortAnswer}</em>
      </summary>

      <div className="faq-card__body">
        <p>{item.answer}</p>

        <div className="faq-card__meta-grid">
          <div>
            <strong>Rôles concernés</strong>
            <div className="faq-tag-row">
              {item.roles.map((role) => (
                <span key={role}>{faqRoleLabels[role]}</span>
              ))}
            </div>
          </div>

          <div>
            <strong>Tags</strong>
            <div className="faq-tag-row">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {item.relatedErrorCodes && item.relatedErrorCodes.length > 0 && (
          <div className="faq-error-codes">
            <strong>Codes liés</strong>
            {item.relatedErrorCodes.map((code) => (
              <code key={code}>{code}</code>
            ))}
          </div>
        )}

        {item.relatedRoutes.length > 0 && (
          <div className="faq-route-links">
            <strong>Accès utiles</strong>
            {item.relatedRoutes.map((route) => (
              <Link to={route} key={route}>
                {routeLabel(route)}
              </Link>
            ))}
          </div>
        )}

        <FaqLinkedTutorials tutorialIds={item.relatedTutorialIds} />
      </div>
    </details>
  );
}
