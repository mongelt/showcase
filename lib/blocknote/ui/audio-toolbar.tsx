import {
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useRef, useState } from "react";
import { RiMusic2Line, RiPencilLine } from "react-icons/ri";

/**
 * Formatting toolbar buttons for the Audio block.
 *
 * AudioReplaceUrlButton — change the audio URL (paste URL or upload file)
 * AudioCaptionButton    — set or clear the caption text shown below the waveform
 *
 * Both render null when a non-audio block is selected.
 */

// ── Shared hook ───────────────────────────────────────────────────────────────

function useSelectedAudioBlock() {
  const editor = useBlockNoteEditor();
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      // getSelection().blocks covers NodeSelection (content:"none" blocks selected
      // via selectBlock() — the audio block's invisible overlay)
      const blocks =
        editor.getSelection()?.blocks || [editor.getTextCursorPosition().block];
      if (blocks.length !== 1 || blocks[0].type !== "audio") return undefined;
      return blocks[0];
    },
  });
}

// ── AudioReplaceUrlButton ─────────────────────────────────────────────────────

/**
 * Opens a popover with a URL text input and a file upload option.
 * On Apply (URL): updates the audio block's url prop directly.
 * On Upload (file): uploads to Cloudinary's video/upload endpoint,
 *   then updates the url prop with the returned secure_url.
 */
export const AudioReplaceUrlButton = () => {
  const Components = useComponentsContext()!;
  const editor     = useBlockNoteEditor();
  const block      = useSelectedAudioBlock();

  const [urlValue,    setUrlValue]    = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Sync local input only when the selected block changes (not on every keystroke)
  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;
    setUrlValue((block.props as Record<string, string>).url || "");
  }, [block?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyUrl = useCallback(() => {
    if (!block) return;
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    editor.updateBlock(block.id, { props: { url: trimmed } });
  }, [block, editor, urlValue]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing) {
        e.preventDefault();
        handleApplyUrl();
      }
    },
    [handleApplyUrl]
  );

  const handleUpload = async (file: File) => {
    if (!block) return;
    setIsUploading(true);
    try {
      const cloudName    = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || !uploadPreset) {
        alert("Upload not configured. Set NEXT_PUBLIC_CLOUDINARY_* env vars.");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      const res  = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: "POST", body: formData }
      );
      const data = await res.json();
      if (data.secure_url) {
        editor.updateBlock(block.id, { props: { url: data.secure_url } });
      } else {
        alert("Upload failed — no URL returned.");
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Audio URL"
          mainTooltip="Replace audio URL or upload file"
          icon={<RiMusic2Line />}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px" }}>
          <Components.Generic.Form.Root>
            <Components.Generic.Form.TextInput
              name="audio-url"
              icon={<RiMusic2Line />}
              value={urlValue}
              autoFocus
              placeholder="https://… (audio URL)"
              onKeyDown={handleKeyDown}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setUrlValue(e.target.value)}
            />
          </Components.Generic.Form.Root>
          <button
            type="button"
            className="bn-lp-url-apply"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApplyUrl();
            }}
          >
            Apply URL
          </button>
          <label style={{ cursor: "pointer", fontSize: "13px", color: "#888" }}>
            {isUploading ? "Uploading…" : "Or upload a file →"}
            <input
              type="file"
              accept="audio/*"
              style={{ display: "none" }}
              onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              disabled={isUploading}
            />
          </label>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── AudioCaptionButton ────────────────────────────────────────────────────────

/**
 * Opens a text input popover for setting a caption below the waveform.
 * Pre-filled with the current caption on block selection change.
 * Apply saves the value; empty Apply clears the caption.
 */
export const AudioCaptionButton = () => {
  const Components = useComponentsContext()!;
  const editor     = useBlockNoteEditor();
  const block      = useSelectedAudioBlock();

  const [captionValue, setCaptionValue] = useState("");

  const prevBlockIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!block) return;
    if (block.id === prevBlockIdRef.current) return;
    prevBlockIdRef.current = block.id;
    setCaptionValue((block.props as Record<string, string>).caption || "");
  }, [block?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = useCallback(() => {
    if (!block) return;
    editor.updateBlock(block.id, { props: { caption: captionValue.trim() } });
  }, [block, editor, captionValue]);

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
          label="Caption"
          mainTooltip="Set audio caption"
          icon={<RiPencilLine />}
        />
      </Components.Generic.Popover.Trigger>

      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "4px" }}>
          <Components.Generic.Form.Root>
            <Components.Generic.Form.TextInput
              name="audio-caption"
              icon={<RiPencilLine />}
              value={captionValue}
              autoFocus
              placeholder="Enter a caption…"
              onKeyDown={handleKeyDown}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCaptionValue(e.target.value)}
            />
          </Components.Generic.Form.Root>
          <button
            type="button"
            className="bn-lp-url-apply"
            onMouseDown={(e) => {
              e.preventDefault();
              handleApply();
            }}
          >
            Apply
          </button>
        </div>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};
