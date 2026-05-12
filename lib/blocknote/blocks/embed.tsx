import { defaultProps } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import { NodeSelection } from "@tiptap/pm/state";
import { useEffect, useRef, useState } from "react";
import { RiExternalLinkLine } from "react-icons/ri";

import "./embed.css";

/**
 * Embed Block for BlockNote
 *
 * A custom block that embeds external content via URL.
 * Supports:
 * - YouTube videos (official iframe embed)
 * - Instagram posts and Reels (official embed.js API)
 * - Any URL as a generic iframe
 *
 * Props:
 * - url: the embed URL
 * - previewWidth: pixel width (0 = full width)
 * - textAlignment: left/center/right/justify (applied as margin when width is set)
 * - caption: optional caption text shown below the embed
 *
 * Limitation: Most websites (e.g. Substack) set X-Frame-Options headers that
 * prevent embedding — their iframes will appear blank. This is a browser-level
 * security restriction with no workaround without a proxy server.
 */

type EmbedType = "youtube" | "instagram" | "iframe";

function detectEmbedType(url: string): EmbedType {
  if (/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/.test(url)) {
    return "youtube";
  }
  if (/instagram\.com\/(?:p|reel|tv)\//.test(url)) {
    return "instagram";
  }
  return "iframe";
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match ? match[1] : null;
}

function YouTubeEmbed({ videoId }: { videoId: string }) {
  return (
    <div className="bn-embed-video-wrapper">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="bn-embed-iframe"
        title="YouTube video"
      />
    </div>
  );
}

function InstagramEmbed({ url }: { url: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as Window & { instgrm?: { Embeds: { process: () => void } } };

    if (win.instgrm) {
      win.instgrm.Embeds.process();
    } else {
      const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
      if (!existing) {
        const script = document.createElement("script");
        script.src = "//www.instagram.com/embed.js";
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [url]);

  return (
    <div className="bn-embed-instagram-wrapper">
      <blockquote
        className="instagram-media"
        data-instgrm-captioned
        data-instgrm-permalink={url}
        data-instgrm-version="14"
        style={{ margin: "0 auto", maxWidth: "540px", width: "100%" }}
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          View on Instagram
        </a>
      </blockquote>
    </div>
  );
}

function GenericIframeEmbed({ url }: { url: string }) {
  return (
    <div className="bn-embed-video-wrapper">
      <iframe
        src={url}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
        className="bn-embed-iframe"
        title="Embedded content"
      />
    </div>
  );
}

type ResizeParams = {
  handleUsed: "left" | "right";
  initialWidth: number;
  initialClientX: number;
};

/**
 * Creates an Embed block spec for BlockNote.
 *
 * The Embed block supports:
 * - Auto-detection of YouTube, Instagram, and generic URLs
 * - Editor mode: URL input form → embed preview with formatting toolbar controls
 * - Editor mode: left/right drag handles to resize width (stored as previewWidth px)
 * - textAlignment prop: drives the native TextAlignButton in the formatting toolbar
 * - caption prop: drives the EmbedCaptionButton in the formatting toolbar
 * - Renderer mode: embed displayed at stored width and alignment with caption
 *
 * @returns A React block spec that can be added to BlockNote schema
 */
export const createEmbed = createReactBlockSpec(
  {
    type: "embed",
    propSchema: {
      url: { default: "" },
      previewWidth: { default: 0 },
      textAlignment: defaultProps.textAlignment,
      caption: { default: "" },
      noPadding: { default: false },
    },
    content: "none",
  },
  {
    render: (props) => {
      // ── All hooks must be called unconditionally before any early returns ──
      const [inputValue, setInputValue] = useState("");
      const [resizeParams, setResizeParams] = useState<ResizeParams | null>(null);
      const wrapperRef = useRef<HTMLDivElement>(null);
      // Stable ref to latest block to avoid stale closures in drag effects
      const latestBlock = useRef(props.block);
      latestBlock.current = props.block;

      // Document-level listeners active only during a drag operation
      useEffect(() => {
        if (!resizeParams) return;

        const onMove = (e: MouseEvent | TouchEvent) => {
          const clientX =
            "touches" in e
              ? (e as TouchEvent).touches[0].clientX
              : (e as MouseEvent).clientX;

          const delta =
            resizeParams.handleUsed === "left"
              ? resizeParams.initialClientX - clientX
              : clientX - resizeParams.initialClientX;

          let newWidth = Math.max(200, resizeParams.initialWidth + delta);
          const maxWidth =
            wrapperRef.current?.parentElement?.clientWidth ?? newWidth;
          newWidth = Math.min(newWidth, maxWidth);

          if (wrapperRef.current) {
            wrapperRef.current.style.width = `${newWidth}px`;
          }
        };

        const onUp = () => {
          const finalWidth = wrapperRef.current?.clientWidth;
          if (finalWidth) {
            props.editor.updateBlock(latestBlock.current, {
              type: "embed",
              props: { previewWidth: finalWidth },
            });
          }
          setResizeParams(null);
        };

        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
        document.addEventListener("touchmove", onMove);
        document.addEventListener("touchend", onUp);

        return () => {
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
          document.removeEventListener("touchmove", onMove);
          document.removeEventListener("touchend", onUp);
        };
      }, [resizeParams, props.editor]);

      // ── Derived values ──
      const url = props.block.props.url;
      const isEditable = props.editor.isEditable;
      const previewWidth = props.block.props.previewWidth;
      const textAlignment = props.block.props.textAlignment;
      const caption = props.block.props.caption;

      // ── Alignment style (applies when block has a specific width) ──
      const wrapperStyle: React.CSSProperties = {};
      if (previewWidth) wrapperStyle.width = `${previewWidth}px`;
      if (textAlignment === "center") {
        wrapperStyle.marginLeft = "auto";
        wrapperStyle.marginRight = "auto";
      } else if (textAlignment === "right") {
        wrapperStyle.marginLeft = "auto";
      }

      // ── Handlers ──
      const handleSubmit = () => {
        const trimmed = inputValue.trim();
        if (!trimmed) return;
        props.editor.updateBlock(props.block, {
          type: "embed",
          props: { url: trimmed },
        });
      };

      const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleSubmit();
        }
        if (e.key === "Escape") {
          setInputValue("");
        }
      };

      const startResize =
        (handleUsed: "left" | "right") =>
        (e: React.MouseEvent | React.TouchEvent) => {
          e.preventDefault();
          const clientX =
            "touches" in e ? e.touches[0].clientX : e.clientX;
          setResizeParams({
            handleUsed,
            initialWidth: wrapperRef.current?.clientWidth ?? 400,
            initialClientX: clientX,
          });
        };

      // Select this block in the editor so the formatting toolbar appears.
      // Iframes capture all pointer events, so clicking inside the embed would
      // normally never reach BlockNote. The invisible frame strips call this
      // function to manually trigger a ProseMirror NodeSelection for the block.
      const selectBlock = (e: React.MouseEvent) => {
        e.stopPropagation();
        const tiptap = (props.editor as any)._tiptapEditor;
        if (!tiptap || !wrapperRef.current) return;
        const view = tiptap.view;
        const pos = view.posAtDOM(wrapperRef.current, 0);
        // pos is the first position inside the node; pos-1 is the node itself
        if (pos < 1) return;
        const tr = view.state.tr.setSelection(
          NodeSelection.create(view.state.doc, pos - 1)
        );
        view.dispatch(tr);
        view.focus();
      };

      const renderEmbed = () => {
        if (!url) return null;

        const type = detectEmbedType(url);

        if (type === "youtube") {
          const videoId = extractYouTubeId(url);
          if (videoId) return <YouTubeEmbed videoId={videoId} />;
        }

        if (type === "instagram") {
          return <InstagramEmbed url={url} />;
        }

        return <GenericIframeEmbed url={url} />;
      };

      // ── Input state: editor mode, no URL set ──
      if (isEditable && !url) {
        return (
          <div className="bn-embed-input-wrapper" contentEditable={false}>
            <RiExternalLinkLine className="bn-embed-input-icon" size={18} />
            <input
              className="bn-embed-input"
              type="url"
              placeholder="Paste a YouTube, Instagram, or other URL..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <button
              className="bn-embed-input-btn"
              onMouseDown={(e) => {
                e.preventDefault(); // Prevent blur before click
                handleSubmit();
              }}
              type="button"
            >
              Embed
            </button>
          </div>
        );
      }

      // ── Embed state: URL set (or renderer mode) ──
      return (
        <div
          className={`bn-embed-block${props.block.props.noPadding ? ' bn-no-padding' : ''}`}
          contentEditable={false}
          ref={wrapperRef}
          style={wrapperStyle}
        >
          {renderEmbed()}
          {caption && <p className="bn-embed-caption">{caption}</p>}

          {isEditable && (
            <>
              {/* Drag overlay: appears only while a resize is in progress.
                  Sits on top of the iframe so mousemove events reach the
                  document listener instead of being swallowed by the iframe. */}
              {resizeParams && (
                <div className="bn-embed-resize-overlay" />
              )}
              {/* Left resize handle — also selects block on click */}
              <div
                className="bn-resize-handle bn-resize-handle-left"
                onMouseDown={startResize("left")}
                onTouchStart={startResize("left")}
                onClick={selectBlock}
              />
              {/* Right resize handle — also selects block on click */}
              <div
                className="bn-resize-handle bn-resize-handle-right"
                onMouseDown={startResize("right")}
                onTouchStart={startResize("right")}
                onClick={selectBlock}
              />
              {/* Top and bottom invisible strips to complete the clickable frame */}
              <div className="bn-embed-frame-top" onClick={selectBlock} />
              <div className="bn-embed-frame-bottom" onClick={selectBlock} />
            </>
          )}
        </div>
      );
    },
  }
);
