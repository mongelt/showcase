import { createReactInlineContentSpec } from "@blocknote/react";
import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  RiExternalLinkLine,
  RiDownloadLine,
  RiWindowLine,
  RiHashtag,
} from "react-icons/ri";
import { createClient } from "@/lib/supabase/client";

import "./tag.css";

/**
 * Text Tag Inline Content for BlockNote
 *
 * A small pill/badge that lives inline within a paragraph or heading
 * (not a standalone block). Three click actions:
 * - external: Opens a URL in a new browser tab
 * - download: Downloads a file from a direct URL
 * - tab: Opens a content item or collection in the bottom nav
 *        (dispatches "bn-button-open-collection" / "bn-button-open-content"
 *         CustomEvents — already registered in app/page.tsx)
 *
 * Props:
 * - label:          Text shown on the pill
 * - outputType:     "external" | "download" | "tab"
 * - url:            URL for external and download types
 * - tabTargetType:  "content" | "collection" | ""
 * - tabTargetId:    UUID (content) or slug (collection)
 * - tabTargetLabel: Human-readable name — carried in the CustomEvent payload
 *
 * Editor mode: clicking the pill opens a self-contained config popover.
 * Renderer mode: clicking the pill executes the configured action.
 *
 * Insertion: TagInsertButton (formatting toolbar) calls editor.insertInlineContent.
 */

type OutputType = "external" | "download" | "tab";

interface ContentItem {
  id: string;
  title: string;
}

interface Collection {
  slug: string;
  name: string;
}

function triggerUrlDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || "download";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Block types that support inline content — TagInsertButton only shows here
const TEXT_BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "bulletListItem",
  "numberedListItem",
  "checkListItem",
]);

// ── TagInsertButton ───────────────────────────────────────────────────────────

/**
 * Formatting toolbar button that inserts a new (unconfigured) text tag
 * at the current cursor position. Self-hides when the cursor is not inside
 * a text block (e.g. when a button or embed block is selected).
 */
export const TagInsertButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();

  const isTextBlock = useEditorState({
    editor,
    selector: ({ editor }) => {
      try {
        const block = editor.getTextCursorPosition().block;
        return TEXT_BLOCK_TYPES.has(block.type);
      } catch {
        return false;
      }
    },
  });

  if (!isTextBlock) return null;

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="Text Tag"
      mainTooltip="Insert text tag"
      icon={<RiHashtag />}
      onClick={() => {
        (editor as any).insertInlineContent([
          {
            type: "tag",
            props: {
              label: "",
              outputType: "external",
              url: "",
              tabTargetType: "",
              tabTargetId: "",
              tabTargetLabel: "",
            },
          },
        ]);
      }}
    />
  );
};

// ── createTag ─────────────────────────────────────────────────────────────────

export const createTag = () =>
  createReactInlineContentSpec(
    {
      type: "tag" as const,
      content: "none" as const,
      propSchema: {
        label: { default: "" },
        outputType: { default: "external" },
        url: { default: "" },
        tabTargetType: { default: "" },
        tabTargetId: { default: "" },
        tabTargetLabel: { default: "" },
      },
    },
    {
      render: ({ inlineContent, editor }) => {
        const p = inlineContent.props as Record<string, string>;
        const { label, outputType, url, tabTargetType, tabTargetId, tabTargetLabel } = p;

        const isEditable = editor.isEditable;

        // ── Local state ──────────────────────────────────────────────────────
        const [isOpen, setIsOpen] = useState(false);
        const [localLabel, setLocalLabel] = useState(label || "");
        const [localOutputType, setLocalOutputType] = useState<OutputType>(
          (outputType as OutputType) || "external"
        );
        const [localUrl, setLocalUrl] = useState(url || "");
        const [localTabValue, setLocalTabValue] = useState(() => {
          const tt = tabTargetType || "";
          const ti = tabTargetId || "";
          return tt && ti ? `${tt}:${ti}` : "";
        });
        const [contentItems, setContentItems] = useState<ContentItem[]>([]);
        const [collections, setCollections] = useState<Collection[]>([]);
        const [dataLoaded, setDataLoaded] = useState(false);

        const popoverRef = useRef<HTMLDivElement>(null);
        const tagRef = useRef<HTMLSpanElement>(null);

        // ── Sync local state from props when popover opens ───────────────────
        // Intentionally not including inlineContent.props in deps — we only
        // want to sync at the moment the popover opens, not on every prop change
        // (which would fight with live edits in the popover inputs).
        useEffect(() => {
          if (!isOpen) return;
          const cp = inlineContent.props as Record<string, string>;
          setLocalLabel(cp.label || "");
          setLocalOutputType((cp.outputType as OutputType) || "external");
          setLocalUrl(cp.url || "");
          const tt = cp.tabTargetType || "";
          const ti = cp.tabTargetId || "";
          setLocalTabValue(tt && ti ? `${tt}:${ti}` : "");
          // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [isOpen]);

        // ── Load Supabase data (once, when popover first opens) ──────────────
        useEffect(() => {
          if (!isOpen || dataLoaded) return;
          const supabase = createClient();
          Promise.all([
            supabase.from("content").select("id, title").order("title"),
            supabase.from("collections").select("slug, name").order("name"),
          ]).then(([content, cols]) => {
            setContentItems(content.data || []);
            setCollections(cols.data || []);
            setDataLoaded(true);
          });
        }, [isOpen, dataLoaded]);

        // ── Close on outside click ───────────────────────────────────────────
        useEffect(() => {
          if (!isOpen) return;
          const handleOutside = (e: MouseEvent) => {
            if (
              popoverRef.current &&
              !popoverRef.current.contains(e.target as Node) &&
              tagRef.current &&
              !tagRef.current.contains(e.target as Node)
            ) {
              setIsOpen(false);
            }
          };
          document.addEventListener("mousedown", handleOutside);
          return () => document.removeEventListener("mousedown", handleOutside);
        }, [isOpen]);

        // ── Action execution (renderer mode) ────────────────────────────────
        const doAction = useCallback(() => {
          const ot = outputType as OutputType;
          if (ot === "external" && url) {
            window.open(url, "_blank", "noopener,noreferrer");
          } else if (ot === "download" && url) {
            triggerUrlDownload(url, label || "download");
          } else if (ot === "tab") {
            if (tabTargetType === "collection" && tabTargetId) {
              window.dispatchEvent(
                new CustomEvent("bn-button-open-collection", {
                  detail: { slug: tabTargetId, name: tabTargetLabel },
                })
              );
            } else if (tabTargetType === "content" && tabTargetId) {
              window.dispatchEvent(
                new CustomEvent("bn-button-open-content", {
                  detail: { id: tabTargetId, title: tabTargetLabel },
                })
              );
            }
          }
        }, [outputType, url, label, tabTargetType, tabTargetId, tabTargetLabel]);

        // ── Apply from popover ───────────────────────────────────────────────
        // Uses a direct ProseMirror setNodeMarkup transaction instead of
        // updateInlineContent, which corrupts the document in BlockNote 0.47.
        const handleApply = useCallback(() => {
          const colonIdx = localTabValue.indexOf(":");
          const tabType = colonIdx > -1 ? localTabValue.slice(0, colonIdx) : "";
          const tabId = colonIdx > -1 ? localTabValue.slice(colonIdx + 1) : "";
          let tabLabel = "";
          if (tabType === "content") {
            tabLabel = contentItems.find((c) => c.id === tabId)?.title || "";
          } else if (tabType === "collection") {
            tabLabel = collections.find((c) => c.slug === tabId)?.name || "";
          }
          const newAttrs = {
            label: localLabel.trim() || "tag",
            outputType: localOutputType,
            url: localOutputType !== "tab" ? localUrl.trim() : "",
            tabTargetType: tabType,
            tabTargetId: tabId,
            tabTargetLabel: tabLabel,
          };

          // BlockNote's InlineContentWrapper adds data-inline-content-type to
          // the NodeView span — use it to locate the ProseMirror node position.
          const tiptap = (editor as any)._tiptapEditor;
          const nodeViewEl = tagRef.current?.closest(
            "[data-inline-content-type]"
          ) as HTMLElement | null;

          if (tiptap && nodeViewEl) {
            const view = tiptap.view;
            const basePos = view.posAtDOM(nodeViewEl, 0);
            // posAtDOM on an inline atom may land inside or just before the node;
            // try the base position and adjacent offsets.
            for (const tryPos of [basePos - 1, basePos, basePos + 1]) {
              if (tryPos < 0) continue;
              try {
                const node = view.state.doc.nodeAt(tryPos);
                if (node && !node.isText) {
                  const tr = view.state.tr.setNodeMarkup(
                    tryPos,
                    undefined,
                    { ...node.attrs, ...newAttrs }
                  );
                  view.dispatch(tr);
                  break;
                }
              } catch {
                /* try next offset */
              }
            }
          }

          setIsOpen(false);
        }, [
          editor,
          localLabel,
          localOutputType,
          localUrl,
          localTabValue,
          contentItems,
          collections,
        ]);

        // ── Pill icon ────────────────────────────────────────────────────────
        const ot = outputType as OutputType;
        const PillIcon =
          ot === "download" ? (
            <RiDownloadLine size={10} />
          ) : ot === "tab" ? (
            <RiWindowLine size={10} />
          ) : (
            <RiExternalLinkLine size={10} />
          );

        const isConfigured = !!label;
        const displayLabel = label || (isEditable ? "+ tag" : "tag");

        // ── Renderer mode ────────────────────────────────────────────────────
        if (!isEditable) {
          return (
            <span
              className={`bn-tag bn-tag--renderer${!isConfigured ? " bn-tag--empty" : ""}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                doAction();
              }}
            >
              {PillIcon}
              {displayLabel}
            </span>
          );
        }

        // ── Editor mode ──────────────────────────────────────────────────────
        return (
          <span className="bn-tag-wrapper">
            <span
              ref={tagRef}
              className={`bn-tag bn-tag--editor${!isConfigured ? " bn-tag--empty" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen((prev) => !prev);
              }}
            >
              {PillIcon}
              {displayLabel}
            </span>

            {isOpen && (
              <div
                ref={popoverRef}
                className="bn-tag-popover"
                onMouseDown={(e) => e.stopPropagation()}
              >
                {/* Label */}
                <div className="bn-tag-popover-row">
                  <label className="bn-tag-popover-label">Label</label>
                  <input
                    className="bn-tag-popover-input"
                    type="text"
                    value={localLabel}
                    placeholder="Tag label"
                    autoFocus
                    onChange={(e) => setLocalLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        handleApply();
                      }
                    }}
                  />
                </div>

                {/* Output type tabs */}
                <div className="bn-tag-output-tabs">
                  {(
                    [
                      { value: "external", label: "External URL" },
                      { value: "download", label: "Download" },
                      { value: "tab", label: "Internal Tab" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`bn-tag-output-tab${localOutputType === opt.value ? " active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setLocalOutputType(opt.value);
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Conditional inputs */}
                <div className="bn-tag-output-body">
                  {(localOutputType === "external" || localOutputType === "download") && (
                    <input
                      className="bn-tag-popover-input"
                      type="url"
                      value={localUrl}
                      placeholder={
                        localOutputType === "download" ? "Direct file URL…" : "https://…"
                      }
                      onChange={(e) => setLocalUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          handleApply();
                        }
                      }}
                    />
                  )}

                  {localOutputType === "tab" && (
                    <select
                      className="bn-tag-output-select"
                      value={localTabValue}
                      onChange={(e) => setLocalTabValue(e.target.value)}
                    >
                      <option value="">— Select a tab target —</option>
                      {contentItems.length > 0 && (
                        <optgroup label="Content Items">
                          {contentItems.map((c) => (
                            <option key={c.id} value={`content:${c.id}`}>
                              {c.title}
                            </option>
                          ))}
                        </optgroup>
                      )}
                      {collections.length > 0 && (
                        <optgroup label="Collections">
                          {collections.map((c) => (
                            <option key={c.slug} value={`collection:${c.slug}`}>
                              {c.name}
                            </option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  )}
                </div>

                {/* Actions */}
                <div className="bn-tag-popover-actions">
                  <button
                    type="button"
                    className="bn-tag-popover-apply"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleApply();
                    }}
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    className="bn-tag-popover-cancel"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </span>
        );
      },
    }
  );
