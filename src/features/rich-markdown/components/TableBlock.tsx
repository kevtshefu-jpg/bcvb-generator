import type { NormalizedTable } from "../services/tableParser";

type TableBlockProps = {
  table: NormalizedTable;
};

export default function TableBlock({ table }: TableBlockProps) {
  return (
    <figure
      className={[
        "bcvb-table-block",
        table.compact ? "bcvb-table-block--compact" : "",
        table.fullWidth ? "bcvb-table-block--full" : "",
      ].filter(Boolean).join(" ")}
    >
      {table.caption && <figcaption>{table.caption}</figcaption>}
      <div className="bcvb-table-block__scroll responsive-data-table">
        <table className="bcvb-table">
          <thead>
            <tr>
              {table.headers.map((header, index) => (
                <th key={`${table.id}-head-${index}`}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`${table.id}-row-${rowIndex}`}>
                {table.headers.map((_header, columnIndex) => (
                  <td key={`${table.id}-${rowIndex}-${columnIndex}`}>{row[columnIndex] || "—"}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="responsive-data-mobile">
        <div className="responsive-data-list">
          {table.rows.length > 0 ? table.rows.map((row, rowIndex) => (
            <article className="responsive-data-card" key={`${table.id}-mobile-${rowIndex}`}>
              <header className="responsive-data-card__header">
                <div>
                  <span className="responsive-data-label">Ligne {rowIndex + 1}</span>
                  <h3>{row[0] || table.caption || "Donnée"}</h3>
                </div>
              </header>
              <dl className="responsive-data-kv-grid">
                {table.headers.map((header, columnIndex) => (
                  <div className={columnIndex === 0 ? undefined : "is-full"} key={`${table.id}-mobile-${rowIndex}-${columnIndex}`}>
                    <dt>{header}</dt>
                    <dd>{row[columnIndex] || "—"}</dd>
                  </div>
                ))}
              </dl>
            </article>
          )) : (
            <div className="responsive-empty-state">
              <strong>Tableau vide</strong>
              <p>Aucune ligne n’est disponible pour ce tableau.</p>
            </div>
          )}
        </div>
      </div>
      {table.warnings.length > 0 && (
        <div className="bcvb-table-block__warnings">
          {table.warnings.map((warning) => (
            <span key={warning}>{warning}</span>
          ))}
        </div>
      )}
    </figure>
  );
}
