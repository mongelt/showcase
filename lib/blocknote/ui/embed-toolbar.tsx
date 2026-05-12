import {
  FileCaptionButton,
  FileReplaceButton,
  useBlockNoteEditor,
  useComponentsContext,
  useEditorState,
} from "@blocknote/react";
import { ChangeEvent, KeyboardEvent, useCallback, useEffect, useState } from "react";
import { RiInputField, RiLink } from "react-icons/ri";

/**
 * Custom formatting toolbar buttons for the Embed block.
 *
 * - EmbedReplaceUrlButton: shows only when an embed block is selected; opens a
 *   URL input popover to change the embedded URL.
 * - EmbedCaptionButton: shows only when an embed block is selected; opens a
 *   text input popover to set a caption displayed below the embed.
 *
 * Wrappers for existing BlockNote buttons:
 * - FileCaptionButtonForNonEmbed: renders FileCaptionButton only for non-embed blocks,
 *   preventing the file caption UI from incorrectly appearing on embed blocks.
 * - FileReplaceButtonForNonEmbed: same pattern for FileReplaceButton.
 */

// ── Helpers ──────────────────────────────────────────────────────────────────

function useSelectedEmbedBlock() {
  const editor = useBlockNoteEditor();
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return undefined;
      const blocks =
        editor.getSelection()?.blocks || [editor.getTextCursorPosition().block];
      if (blocks.length !== 1 || blocks[0].type !== "embed") return undefined;
      return blocks[0] as typeof blocks[0] & {
        props: { url: string; caption: string };
      };
    },
  });
}

function useIsEmbedSelected() {
  const editor = useBlockNoteEditor();
  return useEditorState({
    editor,
    selector: ({ editor }) => {
      const blocks =
        editor.getSelection()?.blocks || [editor.getTextCursorPosition().block];
      return blocks.length === 1 && blocks[0].type === "embed";
    },
  });
}

// ── EmbedReplaceUrlButton ─────────────────────────────────────────────────────

export const EmbedReplaceUrlButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedEmbedBlock();
  const [urlValue, setUrlValue] = useState("");

  useEffect(() => {
    if (block) setUrlValue(block.props.url ?? "");
  }, [block]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing && block) {
        e.preventDefault();
        editor.updateBlock(block.id, { props: { url: urlValue.trim() } });
      }
    },
    [block, urlValue, editor]
  );

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Edit embed URL"
          mainTooltip="Edit embed URL"
          icon={<RiLink />}
        />
      </Components.Generic.Popover.Trigger>
      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <Components.Generic.Form.Root>
          <Components.Generic.Form.TextInput
            name="embed-url"
            icon={<RiLink />}
            value={urlValue}
            autoFocus={true}
            placeholder="Paste embed URL..."
            onKeyDown={handleKeyDown}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUrlValue(e.target.value)
            }
          />
        </Components.Generic.Form.Root>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── EmbedCaptionButton ────────────────────────────────────────────────────────

export const EmbedCaptionButton = () => {
  const Components = useComponentsContext()!;
  const editor = useBlockNoteEditor();
  const block = useSelectedEmbedBlock();
  const [captionValue, setCaptionValue] = useState("");

  useEffect(() => {
    if (block) setCaptionValue(block.props.caption ?? "");
  }, [block]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.nativeEvent.isComposing && block) {
        e.preventDefault();
        editor.updateBlock(block.id, { props: { caption: captionValue } });
      }
    },
    [block, captionValue, editor]
  );

  if (!block) return null;

  return (
    <Components.Generic.Popover.Root>
      <Components.Generic.Popover.Trigger>
        <Components.FormattingToolbar.Button
          className="bn-button"
          label="Caption"
          mainTooltip="Caption"
          icon={<RiInputField />}
        />
      </Components.Generic.Popover.Trigger>
      <Components.Generic.Popover.Content
        className="bn-popover-content bn-form-popover"
        variant="form-popover"
      >
        <Components.Generic.Form.Root>
          <Components.Generic.Form.TextInput
            name="embed-caption"
            icon={<RiInputField />}
            value={captionValue}
            autoFocus={true}
            placeholder="Add a caption..."
            onKeyDown={handleKeyDown}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setCaptionValue(e.target.value)
            }
          />
        </Components.Generic.Form.Root>
      </Components.Generic.Popover.Content>
    </Components.Generic.Popover.Root>
  );
};

// ── Wrappers that suppress file buttons on embed blocks ───────────────────────

/**
 * Renders the native FileCaptionButton only when the selected block is NOT an
 * embed. Prevents BlockNote's file caption UI from appearing for embed blocks,
 * which use EmbedCaptionButton instead.
 */
export const FileCaptionButtonForNonEmbed = () => {
  const isEmbed = useIsEmbedSelected();
  if (isEmbed) return null;
  return <FileCaptionButton />;
};

/**
 * Renders the native FileReplaceButton only when the selected block is NOT an
 * embed. Prevents the file-upload panel from appearing for embed blocks, which
 * use EmbedReplaceUrlButton instead.
 */
export const FileReplaceButtonForNonEmbed = () => {
  const isEmbed = useIsEmbedSelected();
  if (isEmbed) return null;
  return <FileReplaceButton />;
};
