import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiLink,
  RiPencilLine,
} from "react-icons/ri";

/**
 * Formatting toolbar buttons for the Link Preview block.
 *
 * LinkPreviewUrlButton         — change the URL and re-fetch all metadata
 *                               (title, favicon, description). Clears any
 *                               customDescription so fresh meta shows.
 * LinkPreviewAlignButtons      — left / center / right banner alignment
 * LinkPreviewDescriptionButton — enter custom text that overrides the fetched
 *                               meta description. "Reset" clears it so the
 *                               original meta description shows again.
 *
 * All three render null when a non-linkPreview block is selected.
 */

// ── Hook: selected link-preview block ─────────────────────────────────────────

function useSelectedLinkPreviewBlock() {
  const editor = useBlockNoteEditor();
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      // getSelection().blocks covers NodeSelection (content:"none" blocks)
      const blocks =
        editor.getSelection()?.blocks || [editor.getTextCursorPosition().block];
      if (blocks.length !== 1 || blocks[0].type !== "linkPreview")
        return undefined;
      return blocks[0];
    },
  });
}

// ── LinkPreviewUrlButton ──────────────────────────────────────────────────────

/**
 * Opens a URL input popover. On Apply, fetches page metadata from
 * /api/link-preview and updates url, title, favicon, and description.
 * Also clears customDescription so the freshly fetched description shows.
 */
export const LinkPreviewUrlButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedLinkPreviewBlock();

  const [urlValue, setUrlValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;
    setUrlValue((block.props as Record<string, string>).url || "");
  }, [block?.id]);

  const handleApply = useCallback(async () => {
    if (!block || isLoading) return;
    let normalized = urlValue.trim();
    if (!normalized) return;
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/link-preview?url=${encodeURIComponent(normalized)}`
      );
      const data = res.ok ? await res.json() : null;
      editor.updateBlock(block.id, {
        props: {
          url: normalized,
          title: data?.meta?.title || "",
          favicon: data?.meta?.favicon || "",
          description: data?.meta?.description || "",
          customDescription: "", // clear any custom override after URL change
        },
      });
    } finally {
      setIsLoading(false);
    }
  }, [block, editor, urlValue, isLoading]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleApply();
      }
    },
    [handleApply]
  );

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Link URL"
          mainTooltip="Set link preview URL"
          icon={<RiLink />}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div className="bn-lp-url-popover">
          <Components.Generic.Form.Root>
            <Components.Generic.Form.TextInput
              name="link-preview-url"
              icon={<RiLink />}
              value={urlValue}
              autoFocus
              placeholder="https://…"
              onKeyDown={handleKeyDown}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setUrlValue(e.target.value)
              }
            />
          </Components.Generic.Form.Root>
          <button
            type="button"
            className="bn-lp-url-apply"
            disabled={isLoading}
            onMouseDown={(e) => {
              e.preventDefault();
              handleApply();
            }}
          >
            {isLoading ? "Fetching…" : "Apply"}
          </button>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── LinkPreviewAlignButtons ───────────────────────────────────────────────────

/**
 * Three toolbar buttons (left / center / right) controlling the horizontal
 * position of the banner within its block row. Renders null when the selected
 * block is not a linkPreview.
 */
export const LinkPreviewAlignButtons = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedLinkPreviewBlock();

  if (!block) return null;

  const currentAlign =
    (block.props as Record<string, string>).align || "left";

  const setAlign = (align: string) => {
    editor.updateBlock(block.id, { props: { align } });
  };

  return (
    <>
      <Components.FormattingToolbar.Button
        label="Align left"
        mainTooltip="Align preview left"
        icon={<RiAlignLeft />}
        isSelected={currentAlign === "left"}
        onClick={() => setAlign("left")}
      />
      <Components.FormattingToolbar.Button
        label="Align center"
        mainTooltip="Align preview center"
        icon={<RiAlignCenter />}
        isSelected={currentAlign === "center"}
        onClick={() => setAlign("center")}
      />
      <Components.FormattingToolbar.Button
        label="Align right"
        mainTooltip="Align preview right"
        icon={<RiAlignRight />}
        isSelected={currentAlign === "right"}
        onClick={() => setAlign("right")}
      />
    </>
  );
};

// ── LinkPreviewDescriptionButton ──────────────────────────────────────────────

/**
 * Opens a text input popover for entering a custom description that overrides
 * the fetched meta description. The input is pre-filled with the current
 * customDescription (or empty if none set).
 *
 * "Reset to meta" clears customDescription so the original fetched
 * description shows again.
 */
export const LinkPreviewDescriptionButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedLinkPreviewBlock();

  const [descValue, setDescValue] = useState("");

  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;
    setDescValue((block.props as Record<string, string>).customDescription || "");
  }, [block?.id]);

  const handleApply = useCallback(() => {
    if (!block) return;
    editor.updateBlock(block.id, {
      props: { customDescription: descValue.trim() },
    });
  }, [block, editor, descValue]);

  const handleReset = useCallback(() => {
    if (!block) return;
    setDescValue("");
    editor.updateBlock(block.id, { props: { customDescription: "" } });
  }, [block, editor]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleApply();
      }
    },
    [handleApply]
  );

  if (!block) return null;

  const hasCustom = !!(block.props as Record<string, string>).customDescription;
  const metaDesc = (block.props as Record<string, string>).description || "";

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Description"
          mainTooltip="Custom description"
          icon={<RiPencilLine />}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div className="bn-lp-desc-popover">
          <Components.Generic.Form.Root>
            <Components.Generic.Form.TextInput
              name="link-preview-desc"
              icon={<RiPencilLine />}
              value={descValue}
              autoFocus
              placeholder={metaDesc || "Enter a custom description…"}
              onKeyDown={handleKeyDown}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setDescValue(e.target.value)
              }
            />
          </Components.Generic.Form.Root>
          <div className="bn-lp-desc-actions">
            <button
              type="button"
              className="bn-lp-desc-apply"
              onMouseDown={(e) => {
                e.preventDefault();
                handleApply();
              }}
            >
              Apply
            </button>
            {hasCustom && (
              <button
                type="button"
                className="bn-lp-desc-reset"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleReset();
                }}
              >
                Reset to meta
              </button>
            )}
          </div>
          {metaDesc && (
            <p className="bn-lp-desc-hint">
              Meta: {metaDesc.length > 80 ? metaDesc.slice(0, 80) + "…" : metaDesc}
            </p>
          )}
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};
