import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renderizador de Markdown mínimo para los textos legales.
 *
 * Construye nodos de React en vez de inyectar HTML: no hay
 * `dangerouslySetInnerHTML`, así que el contenido cargado desde la base de
 * datos no puede introducir marcado ejecutable en la página pública.
 *
 * Soporta: encabezados, párrafos, listas ordenadas y no ordenadas, tablas,
 * reglas horizontales, citas, negrita, cursiva, código en línea y enlaces.
 */

type Props = { content: string };

let keySeed = 0;
function nextKey(prefix: string): string {
  keySeed += 1;
  return `${prefix}-${keySeed}`;
}

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\)|\*[^*]+\*)/g;

function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(INLINE).filter((p) => p !== "" && p !== undefined);

  for (const part of parts) {
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      out.push(
        <strong key={nextKey("b")} className="font-black">
          {part.slice(2, -2)}
        </strong>,
      );
      continue;
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
      out.push(
        <code
          key={nextKey("c")}
          className="rounded bg-[var(--mks-cream)] px-1 py-0.5 font-mono text-[0.85em]"
        >
          {part.slice(1, -1)}
        </code>,
      );
      continue;
    }
    const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (link) {
      const [, label, href] = link;
      const external = /^https?:\/\//.test(href);
      out.push(
        external ? (
          <a
            key={nextKey("a")}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[var(--mks-pink)] underline underline-offset-2"
          >
            {label}
          </a>
        ) : (
          <Link
            key={nextKey("a")}
            href={href}
            className="font-bold text-[var(--mks-pink)] underline underline-offset-2"
          >
            {label}
          </Link>
        ),
      );
      continue;
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      out.push(
        <em key={nextKey("i")} className="italic">
          {part.slice(1, -1)}
        </em>,
      );
      continue;
    }
    out.push(part);
  }

  return out;
}

function splitRow(line: string): string[] {
  return line
    .replace(/^\s*\|/, "")
    .replace(/\|\s*$/, "")
    .split("|")
    .map((c) => c.trim());
}

const isSeparatorRow = (line: string) => /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(line);

export function LegalMarkdown({ content }: Props) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flushParagraph = () => {
    if (paragraph.length === 0) return;
    blocks.push(
      <p key={nextKey("p")} className="leading-relaxed text-neutral-800">
        {renderInline(paragraph.join(" "))}
      </p>,
    );
    paragraph = [];
  };

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item) => (
      <li key={nextKey("li")} className="leading-relaxed text-neutral-800">
        {renderInline(item)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={nextKey("ol")} className="ml-5 list-decimal space-y-2">
          {items}
        </ol>
      ) : (
        <ul key={nextKey("ul")} className="ml-5 list-disc space-y-2">
          {items}
        </ul>
      ),
    );
    list = null;
  };

  const flushAll = () => {
    flushParagraph();
    flushList();
  };

  for (let i = 0; i < lines.length; i += 1) {
    const raw = lines[i];
    const line = raw.trimEnd();

    if (line.trim() === "") {
      flushAll();
      continue;
    }

    if (/^\s*(---|___|\*\*\*)\s*$/.test(line)) {
      flushAll();
      blocks.push(
        <hr key={nextKey("hr")} className="border-t-4 border-dashed border-[var(--mks-ink)]/20" />,
      );
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushAll();
      const level = heading[1].length;
      const text = renderInline(heading[2]);
      const cls =
        level === 1
          ? "font-heading text-3xl font-black tracking-tight text-[var(--mks-ink)] md:text-4xl"
          : level === 2
            ? "font-heading mt-10 text-xl font-black text-[var(--mks-ink)] md:text-2xl"
            : "font-heading mt-6 text-base font-black text-[var(--mks-ink)] md:text-lg";
      if (level === 1) blocks.push(<h1 key={nextKey("h")} className={cls}>{text}</h1>);
      else if (level === 2) blocks.push(<h2 key={nextKey("h")} className={cls}>{text}</h2>);
      else blocks.push(<h3 key={nextKey("h")} className={cls}>{text}</h3>);
      continue;
    }

    // Tabla: fila de encabezado + fila separadora.
    if (line.trim().startsWith("|") && isSeparatorRow(lines[i + 1] ?? "")) {
      flushAll();
      const header = splitRow(line);
      const body: string[][] = [];
      let j = i + 2;
      while (j < lines.length && lines[j].trim().startsWith("|")) {
        body.push(splitRow(lines[j]));
        j += 1;
      }
      i = j - 1;

      const hasHeader = header.some((c) => c !== "");
      blocks.push(
        <div key={nextKey("tw")} className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            {hasHeader ? (
              <thead>
                <tr className="border-b-4 border-[var(--mks-ink)] text-left">
                  {header.map((cell) => (
                    <th key={nextKey("th")} className="p-2 font-black uppercase tracking-wide">
                      {renderInline(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
            ) : null}
            <tbody>
              {body.map((row) => (
                <tr key={nextKey("tr")} className="border-b border-neutral-200 align-top">
                  {row.map((cell) => (
                    <td key={nextKey("td")} className="p-2 text-neutral-800">
                      {renderInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      flushAll();
      blocks.push(
        <blockquote
          key={nextKey("q")}
          className="border-l-4 border-[var(--mks-cyan)] pl-4 italic text-neutral-700"
        >
          {renderInline(quote[1])}
        </blockquote>,
      );
      continue;
    }

    const ordered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    if (ordered) {
      flushParagraph();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ordered[1]);
      continue;
    }

    const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(bullet[1]);
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushAll();

  return <div className="space-y-4">{blocks}</div>;
}
