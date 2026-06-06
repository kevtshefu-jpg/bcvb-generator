type FaqSearchBarProps = {
  query: string;
  resultCount: number;
  onQueryChange: (query: string) => void;
};

export default function FaqSearchBar({ query, resultCount, onQueryChange }: FaqSearchBarProps) {
  return (
    <label className="faq-search-bar">
      <span>Recherche intelligente</span>
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Ex. score qualité, export PDF, terrain, import Excel, brouillon..."
      />
      <strong>
        {resultCount} réponse{resultCount > 1 ? "s" : ""} trouvée{resultCount > 1 ? "s" : ""}
      </strong>
    </label>
  );
}
