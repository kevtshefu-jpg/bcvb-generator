import type { FaqContextHint, FaqItem } from "../../types/faq";

type FaqContextualHelpProps = {
  context: FaqContextHint | null;
  items: FaqItem[];
  onSelectFaq: (faqId: string) => void;
};

export default function FaqContextualHelp({ context, items, onSelectFaq }: FaqContextualHelpProps) {
  if (!context) return null;

  const relatedItems = context.relatedFaqIds
    .map((faqId) => items.find((item) => item.id === faqId))
    .filter((item): item is FaqItem => Boolean(item));

  return (
    <aside className={`faq-context-help faq-context-help--${context.severity}`}>
      <span>Aide contextuelle</span>
      <h2>{context.title}</h2>
      <p>{context.description}</p>

      {context.errorCode && <code>{context.errorCode}</code>}

      {relatedItems.length > 0 && (
        <div className="faq-context-help__links">
          {relatedItems.map((item) => (
            <button type="button" key={item.id} onClick={() => onSelectFaq(item.id)}>
              {item.question}
            </button>
          ))}
        </div>
      )}
    </aside>
  );
}
