import { parseRichMarkdown } from "../services/richMarkdownParser";
import TableBlock from "./TableBlock";

type RichMarkdownRendererProps = {
  content: string;
  title?: string;
};

function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, index) =>
    /^\*\*[^*]+\*\*$/.test(chunk) ? <strong key={index}>{chunk.slice(2, -2)}</strong> : <span key={index}>{chunk}</span>
  );
}

export default function RichMarkdownRenderer({ content, title = "Document BCVB" }: RichMarkdownRendererProps) {
  const segments = parseRichMarkdown(content);

  return (
    <article className="bcvb-rich-document bcvb-document-export-root">
      <header className="bcvb-rich-document__hero bcvb-block">
        <span>BCVB Référentiel</span>
        <h1>{title}</h1>
        <p>Défendre Fort · Courir · Partager la Balle</p>
      </header>

      {segments.map((segment) => {
        if (segment.type === "heading") {
          const HeadingTag = segment.level <= 1 ? "h2" : segment.level === 2 ? "h2" : "h3";
          return (
            <HeadingTag className="bcvb-rich-document__heading bcvb-block" key={segment.id}>
              {segment.text}
            </HeadingTag>
          );
        }

        if (segment.type === "list") {
          return (
            <ul className="bcvb-rich-document__list bcvb-card" key={segment.id}>
              {segment.items.map((item) => (
                <li key={item}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        if (segment.type === "table") {
          return <TableBlock table={segment.table} key={segment.id} />;
        }

        if (segment.type === "block") {
          return (
            <section className="bcvb-rich-document__block bcvb-block" key={segment.id}>
              <span>{segment.blockType}</span>
              <pre>{segment.content}</pre>
            </section>
          );
        }

        return (
          <p className="bcvb-rich-document__paragraph" key={segment.id}>
            {renderInline(segment.text)}
          </p>
        );
      })}
    </article>
  );
}
