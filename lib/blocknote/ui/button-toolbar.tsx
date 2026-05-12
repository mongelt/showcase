import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  RiExternalLinkLine,
  RiDownloadLine,
  RiWindowLine,
  RiPaletteLine,
  RiPaintBrushLine,
  RiAlignLeft,
  RiAlignCenter,
  RiAlignRight,
  RiRuler2Line,
} from "react-icons/ri";
import { createClient } from "@/lib/supabase/client";

/**
 * Formatting toolbar buttons for the Button block.
 *
 * ButtonOutputTypeButton  — sets the button's action (external URL / download / tab)
 * ButtonTextColorButton   — picks the button label color
 * ButtonBgColorButton     — picks the button background color
 *
 * All three render null when a non-button block is selected.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

type OutputType = "external" | "download" | "tab";

interface CustomPdf {
  id: string;
  file_name: string;
}

interface ContentItem {
  id: string;
  title: string;
}

interface Collection {
  slug: string;
  name: string;
}

// ── Color presets ─────────────────────────────────────────────────────────────

// Colors sourced from docs/design-system.md
const COLOR_PRESETS = [
  // Light / neutral
  "#ffffff",   // white
  "#E9E3E0",   // bg-card (light beige)
  "#c7c7c2",   // bg-main (weathered stone gray)
  "#b8b0aa",   // border-card (medium gray)
  "#e0e0e0",   // text-on-dark (off-white)
  "#b0b0b0",   // text-on-dark-secondary
  // Burgundy accent family
  "#fc5454",   // accent-dark (bright)
  "#A85A5A",   // accent-emerald-300 (hover)
  "#6B2A2A",   // accent-light (primary burgundy)
  // Dark backgrounds
  "#272223",   // bg-gray-700
  "#121212",   // bg-profile (cold granite)
  "#0B0A0A",   // bg-menu-bar (warm black)
];

// ── Hook: selected button block ───────────────────────────────────────────────

function useSelectedButtonBlock() {
  const editor = useBlockNoteEditor();
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      const blocks =
        editor.getSelection()?.blocks || [editor.getTextCursorPosition().block];
      if (blocks.length !== 1 || blocks[0].type !== "button") return undefined;
      return blocks[0];
    },
  });
}

// ── ButtonOutputTypeButton ────────────────────────────────────────────────────

export const ButtonOutputTypeButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedButtonBlock();

  // Local state for URL (saved on Enter/Apply; not saved live)
  const [outputType, setOutputType] = useState<OutputType>("external");
  const [urlValue, setUrlValue] = useState("");
  const [downloadId, setDownloadId] = useState("");
  const [tabValue, setTabValue] = useState(""); // "content:{id}" | "collection:{slug}"

  // Remote data
  const [customPdfs, setCustomPdfs] = useState<CustomPdf[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Sync local state when a different button block is focused
  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;

    const p = block.props as Record<string, string>;
    setOutputType((p.outputType as OutputType) || "external");
    setUrlValue(p.url || "");
    setDownloadId(p.downloadId || "");

    const tType = p.tabTargetType || "";
    const tId = p.tabTargetId || "";
    setTabValue(tType && tId ? `${tType}:${tId}` : "");
  }, [block?.id]);

  // Load Supabase data once when any button block is first selected
  useEffect(() => {
    if (!block || dataLoaded) return;
    const supabase = createClient();
    Promise.all([
      supabase.from("custom_pdfs").select("id, file_name").order("file_name"),
      supabase.from("content").select("id, title").order("title"),
      supabase.from("collections").select("slug, name").order("name"),
    ]).then(([pdfs, content, cols]) => {
      setCustomPdfs(pdfs.data || []);
      setContentItems(content.data || []);
      setCollections(cols.data || []);
      setDataLoaded(true);
    });
  }, [!!block]);

  const saveOutputType = useCallback(
    (type: OutputType) => {
      setOutputType(type);
      if (block) editor.updateBlock(block.id, { props: { outputType: type } });
    },
    [block, editor]
  );

  const saveUrl = useCallback(() => {
    if (block) editor.updateBlock(block.id, { props: { url: urlValue.trim() } });
  }, [block, editor, urlValue]);

  const handleUrlKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        saveUrl();
      }
    },
    [saveUrl]
  );

  const handleDownloadChange = useCallback(
    (id: string) => {
      setDownloadId(id);
      if (block) editor.updateBlock(block.id, { props: { downloadId: id } });
    },
    [block, editor]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      setTabValue(value);
      if (!block) return;
      if (!value) {
        editor.updateBlock(block.id, {
          props: { tabTargetType: "", tabTargetId: "", tabTargetLabel: "" },
        });
        return;
      }
      const colonIdx = value.indexOf(":");
      const type = value.slice(0, colonIdx); // "content" | "collection"
      const id = value.slice(colonIdx + 1);
      let label = "";
      if (type === "content") {
        label = contentItems.find((c) => c.id === id)?.title || "";
      } else {
        label = collections.find((c) => c.slug === id)?.name || "";
      }
      editor.updateBlock(block.id, {
        props: { tabTargetType: type, tabTargetId: id, tabTargetLabel: label },
      });
    },
    [block, editor, contentItems, collections]
  );

  // Icon shown on the toolbar button itself
  const toolbarIcon =
    outputType === "external" ? (
      <RiExternalLinkLine />
    ) : outputType === "download" ? (
      <RiDownloadLine />
    ) : (
      <RiWindowLine />
    );

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Button action"
          mainTooltip="Set button action"
          icon={toolbarIcon}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        {/* ── Output type tabs ── */}
        <div className="bn-button-output-tabs">
          {(
            [
              { value: "external", label: "External URL", icon: <RiExternalLinkLine size={13} /> },
              { value: "download", label: "Download", icon: <RiDownloadLine size={13} /> },
              { value: "tab", label: "Internal Tab", icon: <RiWindowLine size={13} /> },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`bn-button-output-tab${outputType === opt.value ? " active" : ""}`}
              onClick={() => saveOutputType(opt.value)}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>

        {/* ── Conditional inputs ── */}
        <div className="bn-button-output-body">
          {outputType === "external" && (
            <>
              <div className="bn-button-url-row">
                <Components.Generic.Form.Root>
                  <Components.Generic.Form.TextInput
                    name="button-url"
                    icon={<RiExternalLinkLine />}
                    value={urlValue}
                    autoFocus
                    placeholder="https://..."
                    onKeyDown={handleUrlKeyDown}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setUrlValue(e.target.value)
                    }
                  />
                </Components.Generic.Form.Root>
                <button
                  type="button"
                  className="bn-button-url-apply"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveUrl();
                  }}
                >
                  Apply
                </button>
              </div>
              <p className="bn-button-output-hint">Opens in a new browser tab</p>
            </>
          )}

          {outputType === "download" && (
            <>
              {customPdfs.length === 0 ? (
                <p className="bn-button-output-hint">
                  No PDFs uploaded yet. Upload PDFs in Admin → Custom PDFs.
                </p>
              ) : (
                <select
                  className="bn-button-output-select"
                  value={downloadId}
                  onChange={(e) => handleDownloadChange(e.target.value)}
                >
                  <option value="">— Select a PDF —</option>
                  {customPdfs.map((pdf) => (
                    <option key={pdf.id} value={pdf.id}>
                      {pdf.file_name}
                    </option>
                  ))}
                </select>
              )}
              <p className="bn-button-output-hint">
                Triggers a download. Auto-generated PDFs will appear here once
                BlockNote PDF generation is set up.
              </p>
            </>
          )}

          {outputType === "tab" && (
            <>
              {contentItems.length === 0 && collections.length === 0 ? (
                <p className="bn-button-output-hint">
                  No content items or collections found.
                </p>
              ) : (
                <select
                  className="bn-button-output-select"
                  value={tabValue}
                  onChange={(e) => handleTabChange(e.target.value)}
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
              <p className="bn-button-output-hint">
                Opens the selected item or collection as a tab in the bottom nav.
              </p>
            </>
          )}
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── Shared color picker ───────────────────────────────────────────────────────

interface ColorPickerProps {
  label: string;
  tooltipLabel: string;
  currentColor: string;
  defaultColor: string;
  icon: React.ReactNode;
  onColorChange: (color: string) => void;
}

function ButtonColorButton({
  label,
  tooltipLabel,
  currentColor,
  defaultColor,
  icon,
  onColorChange,
}: ColorPickerProps) {
  const Components = useComponentsContext()!;

  // Show a color strip on the icon button itself
  const swatchStyle: React.CSSProperties = {
    display: "inline-block",
    width: 12,
    height: 12,
    borderRadius: 2,
    background: currentColor || defaultColor,
    border: "1px solid rgba(0,0,0,0.15)",
    marginLeft: 3,
    verticalAlign: "middle",
    flexShrink: 0,
  };

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label={label}
          mainTooltip={tooltipLabel}
          icon={
            <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {icon}
              <span style={swatchStyle} />
            </span>
          }
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div className="bn-button-color-popover">
          <div className="bn-button-color-label">{label}</div>

          {/* Preset swatches */}
          <div className="bn-button-color-swatches">
            {COLOR_PRESETS.map((color) => (
              <button
                key={color}
                type="button"
                className={`bn-button-color-swatch${currentColor === color ? " active" : ""}`}
                data-color={color}
                style={{ background: color }}
                title={color}
                onClick={() => onColorChange(color)}
              />
            ))}
          </div>

          <div className="bn-button-color-divider" />

          {/* Custom color + reset */}
          <div className="bn-button-color-custom-row">
            <span className="bn-button-color-custom-label">Custom:</span>
            <input
              type="color"
              className="bn-button-color-custom-input"
              value={currentColor || defaultColor}
              onChange={(e) => onColorChange(e.target.value)}
            />
            <button
              type="button"
              className="bn-button-color-reset"
              onClick={() => onColorChange(defaultColor)}
            >
              Reset
            </button>
          </div>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
}

// ── ButtonTextColorButton ─────────────────────────────────────────────────────

export const ButtonTextColorButton = () => {
  const editor = useBlockNoteEditor();
  const block = useSelectedButtonBlock();

  const handleChange = useCallback(
    (color: string) => {
      if (block) editor.updateBlock(block.id, { props: { buttonTextColor: color } });
    },
    [block, editor]
  );

  if (!block) return null;

  const current = (block.props as Record<string, string>).buttonTextColor || "#ffffff";

  return (
    <ButtonColorButton
      label="Text color"
      tooltipLabel="Button text color"
      currentColor={current}
      defaultColor="#ffffff"
      icon={<RiPaletteLine />}
      onColorChange={handleChange}
    />
  );
};

// ── ButtonAlignButtons ────────────────────────────────────────────────────────

/**
 * Three toolbar buttons (left / center / right) that control the horizontal
 * position of the button block within its row. Renders null when the selected
 * block is not a button.
 */
export const ButtonAlignButtons = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedButtonBlock();

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
        mainTooltip="Align button left"
        icon={<RiAlignLeft />}
        isSelected={currentAlign === "left"}
        onClick={() => setAlign("left")}
      />
      <Components.FormattingToolbar.Button
        label="Align center"
        mainTooltip="Align button center"
        icon={<RiAlignCenter />}
        isSelected={currentAlign === "center"}
        onClick={() => setAlign("center")}
      />
      <Components.FormattingToolbar.Button
        label="Align right"
        mainTooltip="Align button right"
        icon={<RiAlignRight />}
        isSelected={currentAlign === "right"}
        onClick={() => setAlign("right")}
      />
    </>
  );
};

// ── ButtonWidthButton ─────────────────────────────────────────────────────────

/**
 * Toolbar button that opens a popover with a numeric width input (in pixels).
 * Renders null when the selected block is not a button.
 */
export const ButtonWidthButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedButtonBlock();

  const [widthValue, setWidthValue] = useState(100);

  // Sync when a different button block is selected
  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;
    const w = (block.props as Record<string, number>).buttonWidth;
    setWidthValue(w ?? 100);
  }, [block?.id]);

  const saveWidth = useCallback(() => {
    if (!block) return;
    const clamped = Math.max(60, Math.min(widthValue, 800));
    editor.updateBlock(block.id, { props: { buttonWidth: clamped } });
    setWidthValue(clamped);
  }, [block, editor, widthValue]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        saveWidth();
      }
    },
    [saveWidth]
  );

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Width"
          mainTooltip="Set button width"
          icon={<RiRuler2Line />}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div className="bn-button-width-popover">
          <span className="bn-button-width-label">Width (px):</span>
          <input
            type="number"
            className="bn-button-width-input"
            value={widthValue}
            min={60}
            max={800}
            autoFocus
            onChange={(e) => setWidthValue(Number(e.target.value))}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            className="bn-button-width-apply"
            onMouseDown={(e) => {
              e.preventDefault();
              saveWidth();
            }}
          >
            Apply
          </button>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── ButtonBgColorButton ───────────────────────────────────────────────────────

export const ButtonBgColorButton = () => {
  const editor = useBlockNoteEditor();
  const block = useSelectedButtonBlock();

  const handleChange = useCallback(
    (color: string) => {
      if (block)
        editor.updateBlock(block.id, { props: { buttonBackgroundColor: color } });
    },
    [block, editor]
  );

  if (!block) return null;

  const current =
    (block.props as Record<string, string>).buttonBackgroundColor || "#2563eb";

  return (
    <ButtonColorButton
      label="Background color"
      tooltipLabel="Button background color"
      currentColor={current}
      defaultColor="#2563eb"
      icon={<RiPaintBrushLine />}
      onColorChange={handleChange}
    />
  );
};
