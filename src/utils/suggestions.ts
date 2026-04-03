type SuggestionKey = `${string}::${string}`;

const SUGGESTIONS: Record<SuggestionKey, string[]> = {
  "U11::jeu rapide": [
    "Attaquer vite vers l'avant",
    "Occuper les couloirs",
    "Fixer pour donner",
  ],
};

/**
 * Returns coaching point suggestions for a given categorie + theme pair.
 * Returns an empty array when no suggestions are defined.
 */
export function getSuggestions(categorie: string, theme: string): string[] {
  const key: SuggestionKey = `${categorie}::${theme.toLowerCase()}`;
  return SUGGESTIONS[key] ?? [];
}
