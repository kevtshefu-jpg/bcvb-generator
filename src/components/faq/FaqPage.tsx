import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import type { FaqCategory, FaqRole } from "../../types/faq";
import { useAuth } from "../../features/auth/context/AuthContext";
import { faqCategoryOrder, faqItems, faqRoleLabels, findFaqById } from "../../lib/faq/faqData";
import { getFaqContextByError, getFaqContextFromPath } from "../../lib/faq/faqContext";
import { normalizeFaqRole, searchFaqItems } from "../../lib/faq/faqSearch";
import FaqCard from "./FaqCard";
import FaqCategoryTabs from "./FaqCategoryTabs";
import FaqContextualHelp from "./FaqContextualHelp";
import FaqQuickAccess from "./FaqQuickAccess";
import FaqRoleFilter from "./FaqRoleFilter";
import FaqSearchBar from "./FaqSearchBar";
import "../../styles/faq.css";

export default function FaqPage() {
  const { profile } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentRole = normalizeFaqRole(profile?.role);
  const errorCode = searchParams.get("error") ?? searchParams.get("code");
  const sourcePath = searchParams.get("from") ?? location.pathname;

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FaqCategory | "all">("all");
  const [roleFilter, setRoleFilter] = useState<FaqRole | "all">("all");
  const [roleAutoApplied, setRoleAutoApplied] = useState(false);
  const [selectedFaqId, setSelectedFaqId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.role && !roleAutoApplied) {
      setRoleFilter(currentRole);
      setRoleAutoApplied(true);
    }
  }, [currentRole, profile?.role, roleAutoApplied]);

  const context = useMemo(
    () => getFaqContextByError(errorCode) ?? getFaqContextFromPath(sourcePath),
    [errorCode, sourcePath]
  );

  useEffect(() => {
    if (context?.relatedFaqIds[0]) {
      setSelectedFaqId(context.relatedFaqIds[0]);
    }
  }, [context]);

  const visibleFaqItems = useMemo(
    () => searchFaqItems(faqItems, { query, category, role: roleFilter }),
    [category, query, roleFilter]
  );

  const categoryCounts = useMemo(() => {
    return faqCategoryOrder.reduce<Record<FaqCategory, number>>((acc, categoryId) => {
      acc[categoryId] = searchFaqItems(faqItems, { query, category: categoryId, role: roleFilter }).length;
      return acc;
    }, {} as Record<FaqCategory, number>);
  }, [query, roleFilter]);

  const stats = useMemo(() => {
    const highPriority = visibleFaqItems.filter((item) => item.priority === "haute").length;
    const errorLinked = visibleFaqItems.filter((item) => (item.relatedErrorCodes ?? []).length > 0).length;
    const tutorialLinked = visibleFaqItems.filter((item) => item.relatedTutorialIds.length > 0).length;

    return [
      { label: "Réponses visibles", value: visibleFaqItems.length },
      { label: "Priorité haute", value: highPriority },
      { label: "Codes erreurs liés", value: errorLinked },
      { label: "Tutoriels associés", value: tutorialLinked },
    ];
  }, [visibleFaqItems]);

  function selectQuickAccess(nextCategory: FaqCategory, nextQuery: string) {
    setCategory(nextCategory);
    setQuery(nextQuery);
    setSelectedFaqId(null);
  }

  function selectFaq(faqId: string) {
    const item = findFaqById(faqId);
    if (!item) return;

    setSelectedFaqId(item.id);
    setCategory(item.category);
    setQuery("");
  }

  return (
    <main className="bcvb-page faq-page">
      <section className="faq-hero">
        <div>
          <p className="bcvb-eyebrow">Centre d’aide BCVB</p>
          <h1>FAQ plateforme BCVB</h1>
          <p>
            Recherche, droits, erreurs, exports, documents, séances, effectifs, OCR et sauvegardes :
            la FAQ sert de point d’appui rapide pour débloquer les utilisateurs du club.
          </p>
          <div className="faq-hero__role">
            <span>Rôle actif</span>
            <strong>{faqRoleLabels[currentRole]}</strong>
          </div>
        </div>

        <div className="faq-hero__stats">
          {stats.map((stat) => (
            <article key={stat.label}>
              <strong>{stat.value}</strong>
              <span>{stat.label}</span>
            </article>
          ))}
        </div>
      </section>

      <FaqQuickAccess onSelect={selectQuickAccess} />

      <section className="faq-control-panel">
        <FaqSearchBar query={query} resultCount={visibleFaqItems.length} onQueryChange={setQuery} />
        <FaqRoleFilter value={roleFilter} currentRole={currentRole} onChange={setRoleFilter} />
      </section>

      <FaqCategoryTabs value={category} counts={categoryCounts} onChange={setCategory} />

      <section className="faq-workspace">
        <FaqContextualHelp context={context} items={faqItems} onSelectFaq={selectFaq} />

        <div className="faq-results-panel">
          {visibleFaqItems.map((item) => (
            <FaqCard
              key={item.id}
              item={item}
              highlighted={selectedFaqId === item.id || Boolean(context?.relatedFaqIds.includes(item.id))}
            />
          ))}

          {visibleFaqItems.length === 0 && (
            <section className="faq-empty-state">
              <strong>Aucune réponse trouvée</strong>
              <p>Essaie un autre mot-clé, retire le filtre de rôle ou ouvre une catégorie plus large.</p>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
