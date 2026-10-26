import { Fragment, type CSSProperties, type ReactNode } from "react";
import type { Block, Book, Chapter, Layout, Translation } from "../types";
import { t } from "../i18n";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "./Icons";

interface Props {
  translation: Translation;
  book: Book;
  chapter: Chapter;
  layout: Layout;
  uiLang: "tr" | "en";
  prev: { book: string; chapter: number } | null;
  next: { book: string; chapter: number } | null;
  onPrev: () => void;
  onNext: () => void;
  onOpenPicker: () => void;
}

type Group =
  | { kind: "heading"; block: Extract<Block, { t: "h" }> }
  | { kind: "descriptor"; block: Extract<Block, { t: "d" }> }
  | { kind: "verse"; block: Extract<Block, { t: "v" }> }
  | { kind: "paragraph"; verses: Extract<Block, { t: "v" }>[] };

function groupBlocks(blocks: Block[], layout: Layout): Group[] {
  const groups: Group[] = [];
  let paragraphs: Extract<Block, { t: "v" }>[] = [];
  let paragraphId: number | null = null;

  const flush = () => {
    if (paragraphs.length > 0) {
      groups.push({ kind: "paragraph", verses: paragraphs });
      paragraphs = [];
      paragraphId = null;
    }
  };

  for (const block of blocks) {
    if (block.t === "h") {
      flush();
      groups.push({ kind: "heading", block });
    } else if (block.t === "d") {
      flush();
      groups.push({ kind: "descriptor", block });
    } else if (block.q > 0 || layout === "verse") {
      flush();
      groups.push({ kind: "verse", block });
    } else {
      if (paragraphId !== null && block.p !== paragraphId) flush();
      paragraphId = block.p;
      paragraphs.push(block);
    }
  }
  flush();
  return groups;
}

function VerseText({ html }: { html: string }) {
  // `html` is generated at build time from the bundled, trusted translations.
  return <span className="verse-text" dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Reader({
  translation,
  book,
  chapter,
  layout,
  uiLang,
  prev,
  next,
  onPrev,
  onNext,
  onOpenPicker,
}: Props) {
  const d = t(uiLang);
  const groups = groupBlocks(chapter.blocks, layout);
  const nodes: ReactNode[] = [];

  for (const group of groups) {
    if (group.kind === "heading") {
      const { block } = group;
      nodes.push(
        block.lvl === 0 ? (
          <p key={nodes.length} className="section section-minor">
            {block.text}
          </p>
        ) : (
          <h2 key={nodes.length} className={`section section-${block.lvl}`}>
            {block.text}
          </h2>
        ),
      );
    } else if (group.kind === "descriptor") {
      nodes.push(
        <p key={nodes.length} className="superscription">
          {group.block.text}
        </p>,
      );
    } else if (group.kind === "verse") {
      const { block } = group;
      nodes.push(
        <p
          key={nodes.length}
          className={`verse${block.q > 0 ? " poetry" : ""}`}
          style={{ "--q": block.q } as CSSProperties}
        >
          <sup className="verse-number">{block.n}</sup>
          <VerseText html={block.text} />
        </p>,
      );
    } else {
      nodes.push(
        <p key={nodes.length} className="paragraph">
          {group.verses.map((verse) => (
            <Fragment key={verse.n}>
              <sup className="verse-number">{verse.n}</sup>
              <VerseText html={verse.text} />{" "}
            </Fragment>
          ))}
        </p>,
      );
    }
  }

  return (
    <article className="reader">
      <header className="chapter-title">
        <p className="chapter-kicker">{translation.name}</p>
        <h1>
          <span className="title-book">{book.name}</span>
          <button
            className="chapter-current"
            onClick={onOpenPicker}
            aria-haspopup="dialog"
            title={d.chooseChapter}
          >
            {chapter.n}
            <ChevronDownIcon size={16} />
          </button>
        </h1>
      </header>

      <div className={`chapter-body layout-${layout}`}>{nodes}</div>

      <nav className="chapter-footer" aria-label={d.chapter}>
        <button className="chapter-step" onClick={onPrev} disabled={!prev}>
          <ChevronLeftIcon size={18} />
          <span>
            <small>{d.previousChapter}</small>
            <strong>{prev ? `${prev.book} ${prev.chapter}` : "—"}</strong>
          </span>
        </button>
        <button className="chapter-step is-next" onClick={onNext} disabled={!next}>
          <span>
            <small>{d.nextChapter}</small>
            <strong>{next ? `${next.book} ${next.chapter}` : "—"}</strong>
          </span>
          <ChevronRightIcon size={18} />
        </button>
      </nav>
    </article>
  );
}
