import type { FaqRole } from "../../types/faq";
import { faqRoleLabels, faqRoleOrder } from "../../lib/faq/faqData";

type FaqRoleFilterProps = {
  value: FaqRole | "all";
  currentRole: FaqRole;
  onChange: (role: FaqRole | "all") => void;
};

export default function FaqRoleFilter({ value, currentRole, onChange }: FaqRoleFilterProps) {
  return (
    <section className="faq-role-filter" aria-label="Filtre par rôle">
      <div>
        <span>Profil détecté</span>
        <strong>{faqRoleLabels[currentRole]}</strong>
      </div>

      <button
        type="button"
        className={value === "all" ? "faq-pill faq-pill--active" : "faq-pill"}
        onClick={() => onChange("all")}
      >
        Tous rôles
      </button>

      {faqRoleOrder.map((role) => (
        <button
          type="button"
          key={role}
          className={value === role ? "faq-pill faq-pill--active" : "faq-pill"}
          onClick={() => onChange(role)}
        >
          {faqRoleLabels[role]}
        </button>
      ))}
    </section>
  );
}
