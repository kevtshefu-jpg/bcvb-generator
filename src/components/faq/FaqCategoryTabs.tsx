import type { FaqCategory } from "../../types/faq";
import { faqCategoryLabels, faqCategoryOrder } from "../../lib/faq/faqData";

type FaqCategoryTabsProps = {
  value: FaqCategory | "all";
  counts: Record<FaqCategory, number>;
  onChange: (category: FaqCategory | "all") => void;
};

export default function FaqCategoryTabs({ value, counts, onChange }: FaqCategoryTabsProps) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <nav className="faq-category-tabs" aria-label="Catégories FAQ">
      <button
        type="button"
        className={value === "all" ? "faq-tab faq-tab--active" : "faq-tab"}
        onClick={() => onChange("all")}
      >
        <span>Toutes</span>
        <strong>{total}</strong>
      </button>

      {faqCategoryOrder.map((category) => (
        <button
          type="button"
          key={category}
          className={value === category ? "faq-tab faq-tab--active" : "faq-tab"}
          onClick={() => onChange(category)}
        >
          <span>{faqCategoryLabels[category]}</span>
          <strong>{counts[category] ?? 0}</strong>
        </button>
      ))}
    </nav>
  );
}
