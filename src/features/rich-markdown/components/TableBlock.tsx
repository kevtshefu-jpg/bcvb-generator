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
      <div className="bcvb-table-block__scroll">
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
