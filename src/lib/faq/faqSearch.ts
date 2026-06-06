import type { FaqCategory, FaqItem, FaqRole } from "../../types/faq";
import { faqCategoryLabels, faqRoleLabels } from "./faqData";

export type FaqSearchFilters = {
  query: string;
  category: FaqCategory | "all";
  role: FaqRole | "all";
};

export function normalizeFaqText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function normalizeFaqRole(role?: string | null): FaqRole {
  if (role === "admin") return "admin";
  if (role === "responsable_technique") return "responsable_technique";
  if (role === "coach") return "coach";
  if (role === "dirigeant") return "dirigeant";
  if (role === "parent_referent" || role === "team_staff") return "parent_referent";
  return "membre";
}

export function canFaqItemShowForRole(item: FaqItem, role: FaqRole | "all") {
  return role === "all" || item.roles.includes("tous") || item.roles.includes(role);
}

export function searchFaqItems(items: FaqItem[], filters: FaqSearchFilters) {
  const normalizedQuery = normalizeFaqText(filters.query.trim());

  return items.filter((item) => {
    const matchesCategory = filters.category === "all" || item.category === filters.category;
    const matchesRole = canFaqItemShowForRole(item, filters.role);
    const searchableText = normalizeFaqText(
      [
        item.question,
        item.shortAnswer,
        item.answer,
        faqCategoryLabels[item.category],
        ...item.roles.map((role) => faqRoleLabels[role]),
        ...item.tags,
        ...item.relatedRoutes,
        ...item.relatedTutorialIds,
        ...(item.relatedErrorCodes ?? []),
      ].join(" ")
    );
    const matchesQuery = normalizedQuery.length === 0 || searchableText.includes(normalizedQuery);

    return matchesCategory && matchesRole && matchesQuery;
  });
}
