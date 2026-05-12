import { createReactBlockSpec } from "@blocknote/react";
import { NodeSelection } from "prosemirror-state";
import { useRef, useState, KeyboardEvent } from "react";
import { RiLink } from "react-icons/ri";

import "./link-preview.css";

/**
 * Link Preview Block for BlockNote
 *
 * Fetches page metadata (title, favicon, description) from a URL and renders
 * a compact 600×80px banner card.
 *
 * Props:
 * - url:               The link URL (empty = show URL input form in editor mode)
 * - title:             Fetched page title (stored in props, no re-fetch on render)
 * - favicon:           Fetched favicon URL
 * - description:       Fetched meta description (from /api/link-preview)
 * - customDescription: User-entered text that overrides `description` when set
 * - align:             "left" | "center" | "right" — banner position in the row
 *
 * Layout (80px banner):
 *   [favicon 24px] | [Title text]  [domain.com →]
 *                  | [description or customDescription]
 *
 * Toolbar controls:
 * - Link button:        change the URL and re-fetch metadata (clears customDescription)
 * - Align buttons:      left / center / right
 * - Description button: enter custom text to replace the meta description
 *
 * Block selection:
 * content:"none" blocks need a programmatic NodeSelection for the formatting
 * toolbar to appear. selectBlock() creates one on click in editor mode, mirroring
 * the embed block pattern (see Step 7.4 architecture notes in blocknote.md).
 *
 * API: /api/link-preview returns { success, meta: { title, favicon, description, image } }
 */

type AlignType = "left" | "center" | "right";

function alignToItems(align: AlignType): React.CSSProperties["alignItems"] {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

async function fetchLinkMeta(
  url: string
): Promise<{ title: string; favicon: string; description: string } | null> {
  try {
    const res = await fetch(
      `/api/link-preview?url=${encodeURIComponent(url)}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.success) return null;
    return {
      title: data.meta?.title || "",
      favicon: data.meta?.favicon || "",
      description: data.meta?.description || "",
    };
  } catch {
    return null;
  }
}

export const createLinkPreview = createReactBlockSpec(
  {
    type: "linkPreview",
    propSchema: {
      url: { default: "" },
      title: { default: "" },
      favicon: { default: "" },
      description: { default: "" },
      customDescription: { default: "" },
      align: { default: "left" },
    },
    content: "none",
  },
  {
    render: (props) => {
      const { url, title, favicon, description, customDescription, align } =
        props.block.props;
      const isEditable = props.editor.isEditable;
      const wrapperRef = useRef<HTMLDivElement>(null);
      const [inputValue, setInputValue] = useState("");
      const [isLoading, setIsLoading] = useState(false);

      // ── Block selection ───────────────────────────────────────────────────
      // Forces a NodeSelection so the formatting toolbar appears on click.
      // Required for content:"none" blocks — same pattern as embed block.
      const selectBlock = (e: React.MouseEvent) => {
        e.stopPropagation();
        const tiptap = (props.editor as any)._tiptapEditor;
        if (!tiptap || !wrapperRef.current) return;
        const view = tiptap.view;
        const pos = view.posAtDOM(wrapperRef.current, 0);
        if (pos < 1) return;
        const tr = view.state.tr.setSelection(
          NodeSelection.create(view.state.doc, pos - 1)
        );
        view.dispatch(tr);
        view.focus();
      };

      // ── URL submission (input state → preview state) ──────────────────────
      const handleSubmit = async (raw: string) => {
        let normalized = raw.trim();
        if (!normalized) return;
        if (!/^https?:\/\//i.test(normalized)) {
          normalized = `https://${normalized}`;
        }
        setIsLoading(true);
        const meta = await fetchLinkMeta(normalized);
        setIsLoading(false);
        props.editor.updateBlock(props.block, {
          props: {
            url: normalized,
            title: meta?.title || "",
            favicon: meta?.favicon || "",
            description: meta?.description || "",
            customDescription: "",
          },
        });
      };

      const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
          e.preventDefault();
          handleSubmit(inputValue);
        }
      };

      // ── Layout props ──────────────────────────────────────────────────────
      const wrapperStyle: React.CSSProperties = {
        alignItems: alignToItems(align as AlignType),
      };

      // Domain derived from the stored URL at render time
      const domain = url
        ? (() => {
            try {
              return new URL(url).hostname.replace(/^www\./, "");
            } catch {
              return url;
            }
          })()
        : "";

      // customDescription overrides the fetched description when set
      const displayDescription = customDescription || description;

      // ── Input state ───────────────────────────────────────────────────────
      if (isEditable && !url) {
        return (
          <div ref={wrapperRef} className="bn-lp-wrapper" style={wrapperStyle}>
            <div className="bn-lp-input-container">
              <RiLink className="bn-lp-input-icon" size={15} />
              <input
                className="bn-lp-input"
                type="url"
                placeholder="Paste a link to create a preview…"
                value={inputValue}
                autoFocus
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button
                type="button"
                className="bn-lp-input-btn"
                disabled={isLoading}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSubmit(inputValue);
                }}
              >
                {isLoading ? "Fetching…" : "Preview"}
              </button>
            </div>
          </div>
        );
      }

      // ── Banner content (shared between editor and renderer) ───────────────
      const bannerContent = (
        <>
          {/* Favicon — left side */}
          <div className="bn-lp-favicon-wrap">
            {favicon ? (
              <img
                className="bn-lp-favicon"
                src={favicon}
                alt=""
                width={20}
                height={20}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <RiLink className="bn-lp-favicon-fallback" size={16} />
            )}
          </div>

          {/* Text column */}
          <div className="bn-lp-text">
            {/* Title + domain row */}
            <div className="bn-lp-title-row">
              <span className="bn-lp-title">{title || url}</span>
              {domain && (
                <span className="bn-lp-domain-wrap">
                  {domain}
                  <span className="bn-lp-arrow" aria-hidden="true">→</span>
                </span>
              )}
            </div>

            {/* Description row */}
            {displayDescription && (
              <p className="bn-lp-description">{displayDescription}</p>
            )}
          </div>
        </>
      );

      // ── Preview state — editor mode ───────────────────────────────────────
      if (isEditable) {
        return (
          <div ref={wrapperRef} className="bn-lp-wrapper" style={wrapperStyle}>
            <div
              className="bn-lp-banner bn-lp-banner--editor"
              onClick={selectBlock}
            >
              {bannerContent}
            </div>
          </div>
        );
      }

      // ── Preview state — renderer mode ─────────────────────────────────────
      return (
        <div ref={wrapperRef} className="bn-lp-wrapper" style={wrapperStyle}>
          <a
            className="bn-lp-banner"
            href={url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {bannerContent}
          </a>
        </div>
      );
    },
  }
);
