import { createReactBlockSpec } from "@blocknote/react";
import { RiExternalLinkLine, RiDownloadLine, RiWindowLine } from "react-icons/ri";
import { createClient } from "@/lib/supabase/client";

import "./button.css";

/**
 * Button Block for BlockNote
 *
 * A custom block that renders as a rectangular clickable button.
 * Supports three output types:
 * - external: Opens a URL in a new browser tab
 * - download: Triggers a download of a custom PDF from the database
 * - tab: Opens a content item or collection as a tab in the bottom nav
 *
 * Props:
 * - buttonTextColor: CSS color for the button label
 * - buttonBackgroundColor: CSS color for the button background
 * - outputType: "external" | "download" | "tab"
 * - url: URL to open (external only)
 * - downloadId: ID of a custom_pdfs row (download only)
 * - tabTargetType: "content" | "collection" | "" (tab only)
 * - tabTargetId: UUID (content) or slug (collection) (tab only)
 * - tabTargetLabel: Human-readable title/name needed when dispatching the event
 * - align: "left" | "center" | "right" — position of the button within the block row
 * - buttonWidth: width in pixels (e.g. 100)
 *
 * Content: "inline" — the button label is editable rich text.
 *
 * Click in renderer mode:
 * A transparent overlay div (contentEditable={false}) sits on top in renderer
 * mode, capturing clicks before ProseMirror can intercept them. This is
 * required because blocks with content:"inline" are wrapped in ProseMirror
 * nodes that would otherwise swallow click events.
 *
 * Tab navigation uses CustomEvents dispatched on window:
 * - "bn-button-open-collection" → { slug, name }
 * - "bn-button-open-content"    → { id, title }
 * These are listened to in app/page.tsx.
 */

type OutputType = "external" | "download" | "tab";
type AlignType = "left" | "center" | "right";

function BadgeIcon({ outputType }: { outputType: OutputType }) {
  if (outputType === "external") return <RiExternalLinkLine size={11} />;
  if (outputType === "download") return <RiDownloadLine size={11} />;
  return <RiWindowLine size={11} />;
}

function badgeText(
  outputType: OutputType,
  url: string,
  downloadId: string,
  tabTargetLabel: string,
  tabTargetType: string,
): string {
  if (outputType === "external") {
    return url
      ? `External URL: ${url.length > 40 ? url.slice(0, 40) + "…" : url}`
      : "External URL — not configured";
  }
  if (outputType === "download") {
    return downloadId ? "Download PDF" : "Download — no PDF selected";
  }
  if (tabTargetLabel) {
    const prefix = tabTargetType === "collection" ? "Collection" : "Content";
    return `Tab → ${prefix}: ${tabTargetLabel}`;
  }
  return "Internal tab — not configured";
}

async function triggerDownload(downloadId: string) {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("custom_pdfs")
      .select("file_url, file_name")
      .eq("id", downloadId)
      .single();
    if (!data?.file_url) return;
    const a = document.createElement("a");
    a.href = data.file_url;
    a.download = data.file_name || "download.pdf";
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Button block: download failed", err);
  }
}

function alignToJustify(align: AlignType): React.CSSProperties["justifyContent"] {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
}

export const createButton = createReactBlockSpec(
  {
    type: "button",
    propSchema: {
      buttonTextColor: { default: "#ffffff" },
      buttonBackgroundColor: { default: "#2563eb" },
      // "external" | "download" | "tab"
      outputType: { default: "external" },
      // External URL
      url: { default: "" },
      // Internal download — custom_pdfs.id
      downloadId: { default: "" },
      // Internal tab
      tabTargetType: { default: "" },  // "content" | "collection" | ""
      tabTargetId: { default: "" },    // UUID for content, slug for collection
      tabTargetLabel: { default: "" }, // Human-readable label for the event
      // Layout
      align: { default: "left" },     // "left" | "center" | "right"
      buttonWidth: { default: 100 },  // px
      noPadding: { default: false },  // remove block-level top/bottom spacing
    },
    content: "inline",
  },
  {
    render: (props) => {
      const {
        buttonTextColor,
        buttonBackgroundColor,
        outputType,
        url,
        downloadId,
        tabTargetType,
        tabTargetId,
        tabTargetLabel,
        align,
        buttonWidth,
      } = props.block.props;

      const isEditable = props.editor.isEditable;

      const doAction = () => {
        const ot = outputType as OutputType;

        if (ot === "external" && url) {
          window.open(url, "_blank", "noopener,noreferrer");
          return;
        }

        if (ot === "download" && downloadId) {
          triggerDownload(downloadId);
          return;
        }

        if (ot === "tab") {
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
      };

      const wrapperStyle: React.CSSProperties = {
        alignItems: alignToJustify(align as AlignType),
      };

      const buttonStyle: React.CSSProperties = {
        color: buttonTextColor || "#ffffff",
        backgroundColor: buttonBackgroundColor || "#2563eb",
        width: `${buttonWidth || 100}px`,
      };

      return (
        <div className={`bn-button-wrapper${props.block.props.noPadding ? ' bn-no-padding' : ''}`} style={wrapperStyle}>
          <div
            className={`bn-button-block${isEditable ? " bn-button-block--editable" : ""}`}
            style={buttonStyle}
          >
            <div ref={props.contentRef} className="bn-button-content" />

            {/* Renderer-mode click overlay.
                Sits on top of the contenteditable area so ProseMirror (which
                intercepts mouse events on inline-content blocks) never sees the
                click. contentEditable={false} makes ProseMirror treat this node
                as a non-interactive atom. */}
            {!isEditable && (
              <div
                contentEditable={false}
                className="bn-button-click-overlay"
                onClick={(e) => {
                  e.stopPropagation();
                  doAction();
                }}
              />
            )}
          </div>

          {isEditable && (
            <div className="bn-button-badge" contentEditable={false}>
              <BadgeIcon outputType={outputType as OutputType} />
              {badgeText(
                outputType as OutputType,
                url,
                downloadId,
                tabTargetLabel,
                tabTargetType,
              )}
            </div>
          )}
        </div>
      );
    },
  }
);
